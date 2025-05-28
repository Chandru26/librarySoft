const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getClient, query } = require('../db/db'); // Assuming db.js is in ../db/
const { readSqlFile } = require('../utils/fileUtils'); // Assuming fileUtils.js is in ../utils/
const path = require('path');

// Helper function to ensure the books table exists for an organization
async function ensureBooksTableExists(client, schemaName) {
  // Check if table exists
  const checkTableQuery = `
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = $1 AND table_name = 'books'
    );
  `;
  const { rows } = await client.query(checkTableQuery, [schemaName]);
  const tableExists = rows[0].exists;

  if (!tableExists) {
    console.log(`Books table does not exist in schema '${schemaName}'. Creating now.`);
    const booksTableTemplatePath = process.env.BOOKS_TABLE_TEMPLATE_PATH || 'db_scripts/04_create_books_table_template.sql';
    let booksTableSql = await readSqlFile(booksTableTemplatePath);

    // Replace placeholder for schema name in SQL template
    // Ensure the SQL template is structured for this simple replacement.
    // A more robust method might use specific placeholders like {{schema_name}}.
    booksTableSql = booksTableSql.replace(/CREATE TABLE books/g, `CREATE TABLE "${client.escapeIdentifier(schemaName)}".books`);
    // Add similar replacements for indexes or triggers if they are schema-specific in the template.
    // e.g., booksTableSql = booksTableSql.replace(/ON books\(/g, `ON "${client.escapeIdentifier(schemaName)}".books(`);
    // This simple replacement might be problematic if "books" appears in comments or other contexts.
    // A safer template would be: CREATE TABLE {{schema_name}}.books
    // And then replace {{schema_name}} with client.escapeIdentifier(schemaName)

    // For now, being careful with the template structure:
    // Assuming index creation lines are like: CREATE INDEX idx_books_title ON organization_schema_name.books(title);
    // And trigger lines are like: CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON organization_schema_name.books
    booksTableSql = booksTableSql.replace(/ON organization_schema_name\.books/g, `ON "${client.escapeIdentifier(schemaName)}".books`);
    booksTableSql = booksTableSql.replace(/TABLE organization_schema_name\.books/g, `TABLE "${client.escapeIdentifier(schemaName)}".books`);


    await client.query(booksTableSql);
    console.log(`Books table created successfully in schema '${schemaName}'.`);
  }
}


// POST /api/books - Add a new book (admin only)
router.post('/', protect, authorize(['admin']), async (req, res) => {
  const { organizationSchema } = req.user; // organizationSchema from JWT
  const { title, author, isbn, cover_image_url, publication_year, quantity } = req.body;

  // Basic Validation
  if (!title || !author) {
    return res.status(400).json({ message: 'Title and Author are required.' });
  }
  if (quantity !== undefined && (typeof quantity !== 'number' || quantity < 0)) {
    return res.status(400).json({ message: 'Quantity must be a non-negative number.' });
  }
  if (publication_year !== undefined && (typeof publication_year !== 'number' || !Number.isInteger(publication_year))) {
    return res.status(400).json({ message: 'Publication year must be an integer.'});
  }


  const client = await getClient();
  try {
    await client.query('BEGIN');

    // 1. Fetch Organization's Book Limit & Current Book Count
    const orgDetailsQuery = 'SELECT book_limit, subscription_tier FROM public.organizations WHERE id = $1';
    const orgDetailsResult = await client.query(orgDetailsQuery, [req.user.organizationId]);

    if (orgDetailsResult.rows.length === 0) {
      await client.query('ROLLBACK');
      // This should ideally not happen if user is authenticated with a valid org ID
      return res.status(404).json({ message: 'Organization not found.' });
    }
    const { book_limit, subscription_tier } = orgDetailsResult.rows[0];

    // Ensure books table exists for this organization (also creates it if it's the very first book)
    await ensureBooksTableExists(client, organizationSchema);
    
    const currentBookCountQuery = `SELECT COUNT(*) as count FROM "${client.escapeIdentifier(organizationSchema)}".books;`;
    const currentBookCountResult = await client.query(currentBookCountQuery);
    const currentBookCount = parseInt(currentBookCountResult.rows[0].count, 10);

    // 2. Check Limit
    if (book_limit !== -1 && currentBookCount >= book_limit) {
      await client.query('ROLLBACK');
      return res.status(403).json({ // 403 Forbidden is appropriate, or 402 if direct payment is expected
        message: `Book limit of ${book_limit} reached for your current '${subscription_tier}' subscription tier. Please upgrade to add more books.`
      });
    }

    // 3. Insert the new book (if limit not reached)
    const insertQuery = `
      INSERT INTO "${client.escapeIdentifier(organizationSchema)}".books
      (title, author, isbn, cover_image_url, publication_year, quantity)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [title, author, isbn, cover_image_url, publication_year, quantity === undefined ? 1 : quantity];
    const result = await client.query(insertQuery, values);

    await client.query('COMMIT');
    res.status(201).json({ message: 'Book added successfully.', book: result.rows[0] });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error in POST /api/books for schema ${organizationSchema}:`, error);
    if (error.code === '23505' && error.constraint && error.constraint.includes('isbn')) { // Unique constraint violation for ISBN
        return res.status(409).json({ message: `A book with ISBN '${isbn}' already exists.` });
    }
    if (error.code === '42P01') { // undefined_table, should be handled by ensureBooksTableExists, but as fallback
        console.error(`Critical: Books table missing for schema ${organizationSchema} despite check.`);
        return res.status(500).json({ message: 'Book table setup failed. Please try again or contact support.' });
    }
    res.status(500).json({ message: 'Failed to add book.' });
  } finally {
    client.release();
  }
});

// GET /api/books - Get all books for the organization
router.get('/', protect, async (req, res) => {
  const { organizationSchema } = req.user;
  const { page = 1, limit = 10 } = req.query; // Basic pagination

  const offset = (parseInt(page.toString(), 10) - 1) * parseInt(limit.toString(), 10);

  // Validate limit and offset
  if (isNaN(offset) || offset < 0 || isNaN(parseInt(limit.toString(), 10)) || parseInt(limit.toString(), 10) <= 0) {
    return res.status(400).json({ message: 'Invalid pagination parameters.' });
  }

  const client = await getClient(); // Use getClient for consistent connection handling
  try {
    // Ensure books table exists (mostly for safety, though typically it would exist if books are present)
    // This call might be omitted in GET if we assume table creation is robust in POST
    // However, it doesn't hurt to check, especially if other ways of creating books might exist or fail.
    await ensureBooksTableExists(client, organizationSchema);

    const booksQuery = `
      SELECT * FROM "${client.escapeIdentifier(organizationSchema)}".books
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2;
    `;
    const countQuery = `SELECT COUNT(*) FROM "${client.escapeIdentifier(organizationSchema)}".books;`;

    const booksResult = await client.query(booksQuery, [limit, offset]);
    const countResult = await client.query(countQuery);

    res.json({
      message: `Books for organization schema: ${organizationSchema}`,
      data: booksResult.rows,
      pagination: {
        totalItems: parseInt(countResult.rows[0].count, 10),
        currentPage: parseInt(page.toString(), 10),
        pageSize: parseInt(limit.toString(), 10),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count, 10) / parseInt(limit.toString(), 10))
      }
    });
  } catch (error) {
    console.error(`Error in GET /api/books for schema ${organizationSchema}:`, error);
     if (error.code === '42P01') { // undefined_table
        // This means the books table doesn't exist, and ensureBooksTableExists might have failed or been bypassed.
        // For a GET request, if the table doesn't exist, it implies no books.
        return res.json({
            message: `No books found for organization schema: ${organizationSchema}. The books table may not have been created yet.`,
            data: [],
            pagination: { totalItems: 0, currentPage: 1, pageSize: parseInt(limit.toString(), 10), totalPages: 0 }
        });
    }
    res.status(500).json({ message: 'Failed to retrieve books.' });
  } finally {
    client.release();
  }
});

// GET /api/books/:id - Get a specific book by ID
router.get('/:id', protect, async (req, res) => {
  const { organizationSchema } = req.user;
  const { id: bookId } = req.params;

  if (!bookId || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(bookId)) {
    return res.status(400).json({ message: 'Invalid book ID format. Must be a UUID.' });
  }
  
  const client = await getClient();
  try {
    await ensureBooksTableExists(client, organizationSchema); // Ensure table exists

    const selectQuery = `SELECT * FROM "${client.escapeIdentifier(organizationSchema)}".books WHERE id = $1;`;
    const result = await client.query(selectQuery, [bookId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Book not found.' });
    }
    res.json({ message: 'Book retrieved successfully.', book: result.rows[0] });
  } catch (error) {
    console.error(`Error in GET /api/books/:id for schema ${organizationSchema}:`, error);
    if (error.code === '42P01') { // undefined_table
        return res.status(404).json({ message: 'Book not found (table does not exist).' });
    }
    res.status(500).json({ message: 'Failed to retrieve book.' });
  } finally {
    client.release();
  }
});

// PUT /api/books/:id - Update Book (admin only)
router.put('/:id', protect, authorize(['admin']), async (req, res) => {
  const { organizationSchema } = req.user;
  const { id: bookId } = req.params;
  const { title, author, isbn, cover_image_url, publication_year, quantity } = req.body;

  if (!bookId || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(bookId)) {
    return res.status(400).json({ message: 'Invalid book ID format. Must be a UUID.' });
  }

  // Basic validation for provided fields
  if (title !== undefined && !title.trim()) return res.status(400).json({ message: 'Title cannot be empty.' });
  if (author !== undefined && !author.trim()) return res.status(400).json({ message: 'Author cannot be empty.' });
  if (quantity !== undefined && (typeof quantity !== 'number' || quantity < 0)) {
    return res.status(400).json({ message: 'Quantity must be a non-negative number.' });
  }
  if (publication_year !== undefined && publication_year !== null && (typeof publication_year !== 'number' || !Number.isInteger(publication_year))) {
    return res.status(400).json({ message: 'Publication year must be an integer or null.'});
  }


  const client = await getClient();
  try {
    await client.query('BEGIN');
    await ensureBooksTableExists(client, organizationSchema); // Ensure table exists

    // Construct SET clause dynamically based on provided fields
    const setClauses = [];
    const values = [];
    let valueCount = 1;

    if (title !== undefined) { setClauses.push(`title = $${valueCount++}`); values.push(title); }
    if (author !== undefined) { setClauses.push(`author = $${valueCount++}`); values.push(author); }
    if (isbn !== undefined) { setClauses.push(`isbn = $${valueCount++}`); values.push(isbn); } // Allow setting isbn to null
    if (cover_image_url !== undefined) { setClauses.push(`cover_image_url = $${valueCount++}`); values.push(cover_image_url); }
    if (publication_year !== undefined) { setClauses.push(`publication_year = $${valueCount++}`); values.push(publication_year); }
    if (quantity !== undefined) { setClauses.push(`quantity = $${valueCount++}`); values.push(quantity); }
    
    if (setClauses.length === 0) {
      return res.status(400).json({ message: 'No fields provided for update.' });
    }

    // Always update the updated_at timestamp
    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

    values.push(bookId); // Add bookId as the last parameter for WHERE clause

    const updateQuery = `
      UPDATE "${client.escapeIdentifier(organizationSchema)}".books
      SET ${setClauses.join(', ')}
      WHERE id = $${valueCount}
      RETURNING *;
    `;

    const result = await client.query(updateQuery, values);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK'); // Rollback if book not found
      return res.status(404).json({ message: 'Book not found.' });
    }

    await client.query('COMMIT');
    res.json({ message: 'Book updated successfully.', book: result.rows[0] });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error in PUT /api/books/:id for schema ${organizationSchema}:`, error);
    if (error.code === '23505' && error.constraint && error.constraint.includes('isbn')) { // Unique constraint violation for ISBN
        return res.status(409).json({ message: `A book with ISBN '${isbn}' already exists.` });
    }
    if (error.code === '42P01') { // undefined_table
        return res.status(404).json({ message: 'Book not found (table does not exist).' });
    }
    res.status(500).json({ message: 'Failed to update book.' });
  } finally {
    client.release();
  }
});


// DELETE /api/books/:id - Delete Book (admin only)
router.delete('/:id', protect, authorize(['admin']), async (req, res) => {
  const { organizationSchema } = req.user;
  const { id: bookId } = req.params;

  if (!bookId || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(bookId)) {
    return res.status(400).json({ message: 'Invalid book ID format. Must be a UUID.' });
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');
    await ensureBooksTableExists(client, organizationSchema); // Ensure table exists

    const deleteQuery = `DELETE FROM "${client.escapeIdentifier(organizationSchema)}".books WHERE id = $1 RETURNING id;`;
    const result = await client.query(deleteQuery, [bookId]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Book not found.' });
    }

    await client.query('COMMIT');
    res.status(200).json({ message: 'Book deleted successfully.' }); // Or 204 No Content, but 200 with message is also common

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error in DELETE /api/books/:id for schema ${organizationSchema}:`, error);
     if (error.code === '42P01') { // undefined_table
        return res.status(404).json({ message: 'Book not found (table does not exist).' });
    }
    res.status(500).json({ message: 'Failed to delete book.' });
  } finally {
    client.release();
  }
});

module.exports = router;
