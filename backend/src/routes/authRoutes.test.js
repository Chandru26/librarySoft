const request = require('supertest');
const app = require('../app');
const { pool } = require('../db/db');
const { dropSchemaIfExists, deleteOrganizationByName } = require('../testUtils/dbTestUtils');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '.env.test' }); // Ensure test env vars are loaded

// Ensure NODE_ENV is set to 'test'
process.env.NODE_ENV = 'test';

describe('Authentication API (/api/auth)', () => {
  const uniqueOrgId = Date.now();
  const orgIdentifier = `LoginTestOrg_${uniqueOrgId}`; // Can be name or ID
  const adminEmail = `admin@logintestorg_${uniqueOrgId}.com`;
  const adminPassword = 'password123Secure';
  let createdOrgData = {}; // To store orgId, schemaName, etc. from registration

  beforeAll(async () => {
    // Register a new organization and admin user for testing login
    const registrationResponse = await request(app)
      .post('/api/organizations/register')
      .send({
        organizationName: orgIdentifier,
        adminEmail: adminEmail,
        adminPassword: adminPassword,
      });

    if (registrationResponse.status !== 201) {
      console.error('Failed to register organization for login tests:', registrationResponse.body);
      throw new Error('Test setup failed: Could not register organization.');
    }
    createdOrgData = {
      id: registrationResponse.body.organizationId,
      name: orgIdentifier,
      schemaName: registrationResponse.body.schemaName,
      adminEmail: adminEmail,
      adminPassword: adminPassword,
    };
    console.log(`Login tests: Registered org ${createdOrgData.name} with schema ${createdOrgData.schemaName}`);
  });

  afterAll(async () => {
    // Clean up: drop the schema and delete the organization from public.organizations
    if (createdOrgData.schemaName) {
      await dropSchemaIfExists(createdOrgData.schemaName);
    }
    await deleteOrganizationByName(createdOrgData.name);
    await pool.end(); // Close the database pool
  });

  describe('POST /login', () => {
    it('should login successfully with correct organization name, email, and password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          organizationIdentifier: createdOrgData.name, // Using org name
          email: createdOrgData.adminEmail,
          password: createdOrgData.adminPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login successful.');
      expect(response.body.token).toBeDefined();

      // Verify JWT payload
      const decodedToken = jwt.verify(response.body.token, process.env.JWT_SECRET);
      expect(decodedToken.email).toBe(createdOrgData.adminEmail);
      expect(decodedToken.organizationId).toBe(createdOrgData.id);
      expect(decodedToken.organizationSchema).toBe(createdOrgData.schemaName);
      expect(decodedToken.role).toBe('admin');
    });

    it('should login successfully with correct organization ID, email, and password', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            organizationIdentifier: createdOrgData.id.toString(), // Using org ID as string
            email: createdOrgData.adminEmail,
            password: createdOrgData.adminPassword,
          });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Login successful.');
        expect(response.body.token).toBeDefined();
        const decodedToken = jwt.verify(response.body.token, process.env.JWT_SECRET);
        expect(decodedToken.organizationId).toBe(createdOrgData.id);
    });


    it('should return 401 for incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          organizationIdentifier: createdOrgData.name,
          email: createdOrgData.adminEmail,
          password: 'wrongpassword',
        });
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid organization, email, or password.');
    });

    it('should return 401 for non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          organizationIdentifier: createdOrgData.name,
          email: 'nonexistent@example.com',
          password: createdOrgData.adminPassword,
        });
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid organization, email, or password.');
    });

    it('should return 401 for non-existent organization name', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          organizationIdentifier: 'NonExistentOrganizationName',
          email: createdOrgData.adminEmail,
          password: createdOrgData.adminPassword,
        });
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid organization, email, or password.');
    });
    
    it('should return 401 for non-existent organization ID', async () => {
        const nonExistentOrgId = 999999; // Assuming this ID does not exist
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            organizationIdentifier: nonExistentOrgId.toString(),
            email: createdOrgData.adminEmail,
            password: createdOrgData.adminPassword,
          });
        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Invalid organization, email, or password.');
      });

    it('should return 400 for missing organizationIdentifier', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: createdOrgData.adminEmail,
          password: createdOrgData.adminPassword,
        });
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Organization identifier, email, and password are required.');
    });

    it('should return 400 for missing email', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            organizationIdentifier: createdOrgData.name,
            password: createdOrgData.adminPassword,
          });
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Organization identifier, email, and password are required.');
    });

    it('should return 400 for missing password', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            organizationIdentifier: createdOrgData.name,
            email: createdOrgData.adminEmail,
          });
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Organization identifier, email, and password are required.');
    });

    // Add test for JWT_SECRET not being configured if possible (might be hard to simulate without altering global process.env)
  });
});
