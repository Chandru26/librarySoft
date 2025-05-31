const express = require('express');
const bcrypt = require('bcryptjs');
const { getClient, query } = require('../db/db'); // Assuming db.js is in ../db/
const { readSqlFile } = require('../utils/fileUtils');
const path = require('path');
const { protect } = require('../middleware/authMiddleware'); // <-- ADDED LINE

const router = express.Router();

// POST /api/organizations/register
router.post('/register', async (req, res) => {
  const { organizationName, adminEmail, adminPassword } = req.body;

  // Basic validation
  if (!organizationName || !adminEmail || !adminPassword) {
    return res.status(400).json({ message: 'Organization name, admin email, and admin password are required.' });
  }

  // Sanitize organization name to create a schema name
  // Replace spaces and non-alphanumeric characters (except underscore)
  // Convert to lowercase and ensure it starts with a letter or underscore
  let schemaName = `org_${organizationName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/gi, '')}`;
  if (!schemaName.match(/^[a-z_]/i)) {
    schemaName = `org_${schemaName}`; // Prepend 'org_' if it doesn't start with a letter or underscore
  }
  // Further truncate if too long for PostgreSQL identifiers (max 63 chars)
  schemaName = schemaName.substring(0, 63);


  const client = await getClient();

  try {
    await client.query('BEGIN');

    // 1. Create Organization Schema
    // Use IF NOT EXISTS to prevent error if schema somehow already exists, though org name should be unique
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${client.escapeIdentifier(schemaName)}`);

    // 2. Add to public.organizations table
    // The new columns (subscription_tier, book_limit, user_limit) will use their DEFAULT values
    // as defined in the 05_add_subscription_tiers_to_organizations.sql migration script.
    // Default: 'Free' tier, 100 books, 3 users.
    const orgInsertQuery = 'INSERT INTO public.organizations (name, schema_name) VALUES ($1, $2) RETURNING id, subscription_tier, book_limit, user_limit';
    const orgResult = await client.query(orgInsertQuery, [organizationName, schemaName]);
    const organizationId = orgResult.rows[0].id;
    // Log the tier info for the newly registered org (optional)
    console.log(
        `New organization ${organizationName} (ID: ${organizationId}) registered with tier: ${orgResult.rows[0].subscription_tier}, book_limit: ${orgResult.rows[0].book_limit}, user_limit: ${orgResult.rows[0].user_limit}`
    );


    // 3. Hash Admin Password
    const saltRounds = 10;
    const trimmedAdminPassword = adminPassword.trim();
    const hashedPassword = await bcrypt.hash(trimmedAdminPassword, saltRounds);

    // 4. Create Admin User in New Schema
    //    a. Read the users table template
    const usersTableTemplatePath = process.env.USERS_TABLE_TEMPLATE_PATH || 'db_scripts/03_create_users_table_template.sql';
    let usersTableSql = await readSqlFile(usersTableTemplatePath);

    //    b. Modify SQL to use the new schema name for table creation and index
    //       This simple replacement is okay if the template is structured for it.
    //       Ensuring the template doesn't have "users" in other contexts (e.g., comments that could be wrongly replaced)
    //       A more robust solution might involve specific placeholders in the template.
    usersTableSql = usersTableSql.replace(/CREATE TABLE users/g, `CREATE TABLE ${client.escapeIdentifier(schemaName)}.users`);
    usersTableSql = usersTableSql.replace(/CREATE INDEX idx_users_email ON users/g, `CREATE INDEX idx_users_email ON ${client.escapeIdentifier(schemaName)}.users`);
    usersTableSql = usersTableSql.replace(/DEFAULT gen_random_uuid\(\)/g, 'DEFAULT gen_random_uuid()'); // Ensure pgcrypto is enabled

    await client.query(usersTableSql);

    //    c. Insert the admin user
    const adminInsertQuery = `
      INSERT INTO ${client.escapeIdentifier(schemaName)}.users (email, password_hash, role)
      VALUES ($1, $2, $3)
      RETURNING id
    `;
    await client.query(adminInsertQuery, [adminEmail, hashedPassword, 'admin']);

    await client.query('COMMIT');
    res.status(201).json({
      message: 'Organization registered successfully.',
      organizationId: organizationId,
      schemaName: schemaName
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error during organization registration:', error);

    if (error.code === '23505') { // Unique violation (e.g., organization name)
        if (error.table === 'organizations' && error.constraint === 'organizations_name_key') {
             return res.status(409).json({ message: 'Organization name already exists.' });
        }
        // Could also be a unique violation on schemaName if not generated carefully,
        // or email in the new users table if somehow tried to insert twice (less likely here).
    }
    // Check if it's a schema creation error (e.g. duplicate schema)
    if (error.code === '42P06') { // duplicate_schema
        return res.status(409).json({ message: `Schema '${schemaName}' already exists. The organization name might be too similar to an existing one after sanitization.` });
    }

    res.status(500).json({ message: 'Internal server error during registration.' });
  } finally {
    client.release();
  }
});

// GET /api/organizations/me/details - Get details for the authenticated user's organization
router.get('/me/details', protect, async (req, res) => {
  const { organizationId, organizationSchema, email: userEmail } = req.user; // from JWT

  if (!organizationId || !organizationSchema) {
    // This should not happen if protect middleware is working correctly and token is valid
    return res.status(400).json({ message: 'Organization information missing from token.' });
  }

  const client = await getClient();

  try {
    // 1. Fetch Organization Data (name, tier, limits)
    const orgQuery = `
      SELECT name, schema_name, subscription_tier, book_limit, user_limit, created_at
      FROM public.organizations
      WHERE id = $1;
    `;
    const orgResult = await client.query(orgQuery, [organizationId]);

    if (orgResult.rows.length === 0) {
      return res.status(404).json({ message: 'Organization not found.' });
    }
    const orgData = orgResult.rows[0];

    // 2. Count Current Users in the organization's schema
    // The users table should always exist if the schema was created successfully.
    const userCountQuery = `SELECT COUNT(*) AS count FROM "${client.escapeIdentifier(organizationSchema)}".users;`;
    const userCountResult = await client.query(userCountQuery);
    const currentUserCount = parseInt(userCountResult.rows[0].count, 10);

    // 3. Count Current Books in the organization's schema
    //    Handle cases where the books table might not exist yet.
    let currentBookCount = 0;
    const booksTableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = $1 AND table_name = 'books'
      );
    `;
    const booksTableExistsResult = await client.query(booksTableExistsQuery, [organizationSchema]);

    if (booksTableExistsResult.rows[0].exists) {
      const bookCountQuery = `SELECT COUNT(*) AS count FROM "${client.escapeIdentifier(organizationSchema)}".books;`;
      const bookCountResult = await client.query(bookCountQuery);
      currentBookCount = parseInt(bookCountResult.rows[0].count, 10);
    }
    // If table doesn't exist, currentBookCount remains 0, which is correct.

    res.status(200).json({
      id: organizationId, // from token, but good to include
      name: orgData.name,
      schemaName: orgData.schema_name, // from DB, should match token's organizationSchema
      subscriptionTier: orgData.subscription_tier,
      bookLimit: orgData.book_limit,
      currentBookCount: currentBookCount,
      userLimit: orgData.user_limit,
      currentUserCount: currentUserCount,
      createdAt: orgData.created_at,
      // You could add more details here if needed, like primary contact (admin user's email)
      // adminEmail: userEmail // from token, if relevant to show
    });

  } catch (error) {
    console.error('Error fetching organization details:', error);
    res.status(500).json({ message: 'Failed to retrieve organization details.' });
  } finally {
    client.release();
  }
});

module.exports = router;
