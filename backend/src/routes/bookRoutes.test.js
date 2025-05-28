const request = require('supertest');
const app = require('../app');
const { pool } = require('../db/db');
const { dropSchemaIfExists, deleteOrganizationByName } = require('../testUtils/dbTestUtils');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '.env.test' });

process.env.NODE_ENV = 'test';

describe('Book Management API (/api/books)', () => {
  let adminAuthToken;
  let organizationData; // Will hold schema_name, id, etc.

  // Setup: Create a new organization and log in as admin for this test suite
  beforeAll(async () => {
    const orgName = `BookLimitTestOrg_${Date.now()}`;
    const adminEmail = `admin@${orgName.toLowerCase()}.com`;
    const adminPassword = 'bookTestPassword123';

    // Register organization
    const regResponse = await request(app)
      .post('/api/organizations/register')
      .send({ organizationName: orgName, adminEmail, adminPassword });
    
    expect(regResponse.status).toBe(201);
    organizationData = {
      id: regResponse.body.organizationId,
      name: orgName,
      schemaName: regResponse.body.schemaName,
      adminEmail,
      adminPassword,
      // Default tier values from DB, assuming Free tier has book_limit of 2 for this test
      subscriptionTier: 'Free',
      bookLimit: 2, // Hardcoding for test clarity, ensure DB default or update for test
      userLimit: 3,
    };
    
    // Manually update the organization's book_limit to 2 for this specific test org
    // This is to make testing the limit easier.
    await pool.query(
      'UPDATE public.organizations SET book_limit = $1 WHERE id = $2',
      [organizationData.bookLimit, organizationData.id]
    );


    // Log in to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ organizationIdentifier: orgName, email: adminEmail, password: adminPassword });
    
    expect(loginResponse.status).toBe(200);
    adminAuthToken = loginResponse.body.token;
    expect(adminAuthToken).toBeDefined();
  });

  // Teardown: Clean up the created organization and its schema
  afterAll(async () => {
    if (organizationData && organizationData.schemaName) {
      await dropSchemaIfExists(organizationData.schemaName);
    }
    if (organizationData && organizationData.name) {
      await deleteOrganizationByName(organizationData.name);
    }
    await pool.end(); // Close db pool
  });

  // Clean up books table before each test in this suite, if it exists
  // This is to ensure book count is fresh for each specific book creation test.
  beforeEach(async () => {
      try {
        await pool.query(`TRUNCATE TABLE "${organizationData.schemaName}".books RESTART IDENTITY CASCADE;`);
      } catch (error) {
        // If table doesn't exist yet (e.g. before first book POST), ignore error.
        if (error.code !== '42P01') { // 42P01 is undefined_table
            throw error;
        }
      }
  });


  describe('POST /api/books - Book Limit Enforcement', () => {
    const book1Data = { title: 'Book 1', author: 'Author A' };
    const book2Data = { title: 'Book 2', author: 'Author B' };
    const book3Data = { title: 'Book 3', author: 'Author C' };

    it('should allow adding books up to the limit', async () => {
      // Add first book
      let response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send(book1Data);
      expect(response.status).toBe(201);
      expect(response.body.book.title).toBe(book1Data.title);

      // Add second book (reaching the limit of 2)
      response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send(book2Data);
      expect(response.status).toBe(201);
      expect(response.body.book.title).toBe(book2Data.title);
    });

    it('should return 403 when attempting to exceed the book limit', async () => {
      // Add first book
      await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send(book1Data); // Status checked in previous test or assume ok

      // Add second book
      await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send(book2Data); // Status checked in previous test or assume ok

      // Attempt to add third book (exceeding limit of 2)
      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send(book3Data);
      
      expect(response.status).toBe(403);
      expect(response.body.message).toBe(
        `Book limit of ${organizationData.bookLimit} reached for your current '${organizationData.subscriptionTier}' subscription tier. Please upgrade to add more books.`
      );
    });

    it('should allow adding books if tier is unlimited (-1)', async () => {
        // Temporarily update the organization's book_limit to -1 (unlimited)
        await pool.query(
            'UPDATE public.organizations SET book_limit = -1, subscription_tier = $1 WHERE id = $2',
            ['PremiumUnlimited', organizationData.id] // Using a distinct tier name for clarity
        );
        
        // Add first book
        let response = await request(app)
            .post('/api/books')
            .set('Authorization', `Bearer ${adminAuthToken}`)
            .send(book1Data);
        expect(response.status).toBe(201);

        // Add second book
        response = await request(app)
            .post('/api/books')
            .set('Authorization', `Bearer ${adminAuthToken}`)
            .send(book2Data);
        expect(response.status).toBe(201);

        // Add third book (should be allowed now)
        response = await request(app)
            .post('/api/books')
            .set('Authorization', `Bearer ${adminAuthToken}`)
            .send(book3Data);
        expect(response.status).toBe(201);
        expect(response.body.book.title).toBe(book3Data.title);

        // Reset book_limit for other tests if any, or rely on afterAll cleanup.
        // For safety, setting it back, though afterAll will drop this org.
        await pool.query(
            'UPDATE public.organizations SET book_limit = $1, subscription_tier = $2 WHERE id = $3',
            [organizationData.bookLimit, organizationData.subscriptionTier, organizationData.id]
        );
    });
  });

  // Placeholder for other book tests (GET, PUT, DELETE) if they were in this file
  // For now, focusing on the book limit tests for POST /api/books
});
