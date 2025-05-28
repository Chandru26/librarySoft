const express = require('express');
const bcrypt = require('bcryptjs');
const { getClient, query } = require('../db/db'); // Assuming db.js is in ../db/
const { readSqlFile } = require('../utils/fileUtils');
const path = require('path');

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
    const orgInsertQuery = 'INSERT INTO public.organizations (name, schema_name) VALUES ($1, $2) RETURNING id';
    const orgResult = await client.query(orgInsertQuery, [organizationName, schemaName]);
    const organizationId = orgResult.rows[0].id;

    // 3. Hash Admin Password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

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

module.exports = router;
