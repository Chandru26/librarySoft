const request = require('supertest');
const app = require('../app'); // Assuming your app is exported from app.js
const { pool } = require('../db/db'); // For direct DB checks and pool closing
const { dropSchemaIfExists, deleteOrganizationByName } = require('../testUtils/dbTestUtils'); // Cleanup utilities
const bcrypt = require('bcryptjs');

// Ensure NODE_ENV is set to 'test'
process.env.NODE_ENV = 'test';

describe('Organization Registration API (/api/organizations)', () => {
  // Test data
  const uniqueOrgName = `TestOrg_${Date.now()}`;
  const testOrgData = {
    organizationName: uniqueOrgName,
    adminEmail: `admin@${uniqueOrgName.toLowerCase()}.com`,
    adminPassword: 'password123',
  };
  let createdSchemaName; // To store schema name for cleanup

  afterEach(async () => {
    // Clean up created organization and schema after each test
    if (createdSchemaName) {
      await dropSchemaIfExists(createdSchemaName);
      createdSchemaName = null; // Reset for next test
    }
    // Ensure organization is deleted from public table even if schema creation failed
    await deleteOrganizationByName(testOrgData.organizationName);
    // If other test data creates orgs with different names, they need separate cleanup logic
  });

  afterAll(async () => {
    // Close the database pool after all tests are done
    await pool.end();
  });

  describe('POST /register', () => {
    it('should successfully register a new organization and create admin user', async () => {
      const response = await request(app)
        .post('/api/organizations/register')
        .send(testOrgData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Organization registered successfully.');
      expect(response.body.organizationId).toBeDefined();
      expect(response.body.schemaName).toMatch(/^org_testorg_[0-9]+$/); // Matches sanitized name
      createdSchemaName = response.body.schemaName; // Save for cleanup

      // 1. Verify organization in public.organizations table
      const orgQuery = await pool.query('SELECT * FROM public.organizations WHERE name = $1', [testOrgData.organizationName]);
      expect(orgQuery.rows.length).toBe(1);
      expect(orgQuery.rows[0].name).toBe(testOrgData.organizationName);
      expect(orgQuery.rows[0].schema_name).toBe(createdSchemaName);

      // 2. Verify schema creation (existence)
      const schemaQuery = await pool.query(
        "SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1",
        [createdSchemaName]
      );
      expect(schemaQuery.rows.length).toBe(1);

      // 3. Verify admin user in the organization's schema
      const userQuery = await pool.query(`SELECT * FROM "${createdSchemaName}".users WHERE email = $1`, [testOrgData.adminEmail]);
      expect(userQuery.rows.length).toBe(1);
      expect(userQuery.rows[0].email).toBe(testOrgData.adminEmail);
      expect(userQuery.rows[0].role).toBe('admin');

      // 4. Verify password was hashed
      expect(userQuery.rows[0].password_hash).not.toBe(testOrgData.adminPassword);
      const isPasswordCorrect = await bcrypt.compare(testOrgData.adminPassword, userQuery.rows[0].password_hash);
      expect(isPasswordCorrect).toBe(true);
    });

    it('should return 409 if organization name already exists', async () => {
      // First, register the organization
      const firstResponse = await request(app)
        .post('/api/organizations/register')
        .send(testOrgData);
      expect(firstResponse.status).toBe(201);
      createdSchemaName = firstResponse.body.schemaName; // Save for cleanup

      // Then, try to register again with the same name
      const secondResponse = await request(app)
        .post('/api/organizations/register')
        .send({ ...testOrgData, adminEmail: `anotheradmin@${testOrgData.organizationName.toLowerCase()}.com` }); // Different email, same org name

      expect(secondResponse.status).toBe(409);
      expect(secondResponse.body.message).toBe('Organization name already exists.');
    });

    it('should return 400 for missing organizationName', async () => {
      const { organizationName, ...dataWithMissingName } = testOrgData;
      const response = await request(app)
        .post('/api/organizations/register')
        .send(dataWithMissingName);
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Organization name, admin email, and admin password are required.');
    });

    it('should return 400 for missing adminEmail', async () => {
      const { adminEmail, ...dataWithMissingEmail } = testOrgData;
      const response = await request(app)
        .post('/api/organizations/register')
        .send(dataWithMissingEmail);
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Organization name, admin email, and admin password are required.');
    });

    it('should return 400 for missing adminPassword', async () => {
      const { adminPassword, ...dataWithMissingPassword } = testOrgData;
      const response = await request(app)
        .post('/api/organizations/register')
        .send(dataWithMissingPassword);
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Organization name, admin email, and admin password are required.');
    });

    // Add more tests here:
    // - Test for schema name sanitization (e.g. names with spaces, special chars)
    // - Test for schema name collision if sanitization leads to same name (though unique org name should prevent this)
    // - Test if USERS_TABLE_TEMPLATE_PATH is not configured (should ideally be caught by server startup or have a default)
  });
});
