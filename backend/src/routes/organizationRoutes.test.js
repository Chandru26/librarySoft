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

  describe('GET /me/details', () => {
    let authToken;
    let tempOrgData = {}; // To hold details of an org created just for this test suite

    beforeAll(async () => {
      // 1. Register a new organization for these specific tests
      const orgNameForDetailsTest = `DetailsOrg_${Date.now()}`;
      const adminEmailForDetailsTest = `admin@${orgNameForDetailsTest.toLowerCase()}.com`;
      const adminPasswordForDetailsTest = 'detailPass123';

      const regResponse = await request(app)
        .post('/api/organizations/register')
        .send({
          organizationName: orgNameForDetailsTest,
          adminEmail: adminEmailForDetailsTest,
          adminPassword: adminPasswordForDetailsTest,
        });
      
      expect(regResponse.status).toBe(201); // Ensure registration was successful
      tempOrgData = {
          id: regResponse.body.organizationId,
          name: orgNameForDetailsTest,
          schemaName: regResponse.body.schemaName,
          adminEmail: adminEmailForDetailsTest,
          adminPassword: adminPasswordForDetailsTest,
          // Default tier values from DB
          subscriptionTier: 'Free', 
          bookLimit: 100,
          userLimit: 3,
      };
      
      // 2. Log in as the admin of this new organization to get a token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          organizationIdentifier: tempOrgData.name,
          email: tempOrgData.adminEmail,
          password: tempOrgData.adminPassword,
        });
      expect(loginResponse.status).toBe(200); // Ensure login was successful
      authToken = loginResponse.body.token;
      expect(authToken).toBeDefined();
    });

    afterAll(async () => {
      // Clean up the organization created for this test suite
      if (tempOrgData.schemaName) {
        await dropSchemaIfExists(tempOrgData.schemaName);
      }
      await deleteOrganizationByName(tempOrgData.name);
      // pool.end() is in the main afterAll for the file
    });

    it('should successfully fetch organization details for an authenticated user', async () => {
      const response = await request(app)
        .get('/api/organizations/me/details')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(tempOrgData.id);
      expect(response.body.name).toBe(tempOrgData.name);
      expect(response.body.schemaName).toBe(tempOrgData.schemaName);
      expect(response.body.subscriptionTier).toBe(tempOrgData.subscriptionTier); // Default 'Free'
      expect(response.body.bookLimit).toBe(tempOrgData.bookLimit);         // Default 100
      expect(response.body.currentBookCount).toBe(0);         // No books added yet
      expect(response.body.userLimit).toBe(tempOrgData.userLimit);          // Default 3
      expect(response.body.currentUserCount).toBe(1);         // Only the admin user
      expect(response.body.createdAt).toBeDefined();
    });

    it('should return 401 if no token is provided', async () => {
      const response = await request(app)
        .get('/api/organizations/me/details');
      
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Not authorized, no token provided.');
    });

    it('should correctly report currentBookCount as 0 if books table does not exist (fresh org)', async () => {
        // The beforeAll setup for this describe block already creates a fresh org.
        // The books table is only created upon the first attempt to POST a book.
        // So, this scenario is covered by the 'should successfully fetch' test.
        const response = await request(app)
            .get('/api/organizations/me/details')
            .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.currentBookCount).toBe(0);
    });

    it('should correctly report currentBookCount after a book is added', async () => {
        // This requires admin role to add a book, which our current token has.
        // We need the organizationSchema from the token to add a book.
        const decodedToken = jwt.verify(authToken, process.env.JWT_SECRET);
        const organizationSchema = decodedToken.organizationSchema;

        // Add a book (minimal data)
        await request(app)
            .post('/api/books')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ title: 'Test Book for Details Endpoint', author: 'Test Author' });
            // No need to check status of book creation here, assuming it works or other tests cover it.

        const response = await request(app)
            .get('/api/organizations/me/details')
            .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.currentBookCount).toBe(1);

        // Cleanup: remove the book or rely on schema drop in afterAll.
        // For simplicity here, relying on schema drop.
    });
  });
});
