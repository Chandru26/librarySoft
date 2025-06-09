const request = require('supertest');
const express = require('express');
const reportRoutes = require('./reportRoutes');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const mockJwt = require('jsonwebtoken'); // To sign tokens for testing

// Mock the auth middleware for controlled testing
jest.mock('../middleware/authMiddleware', () => ({
  authenticateToken: jest.fn((req, res, next) => {
    // Simulate token presence for protected routes
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        // Verify the token only if it's one of our test tokens
        // This is a simplified check; in a real scenario, you'd use a test secret
        const decoded = mockJwt.verify(token, 'test_secret_key'); // Use a consistent test secret
        req.user = decoded; // Attach user to request
        next();
      } catch (err) {
        // If token is invalid for some reason (e.g. expired, wrong secret)
         if (token === 'valid-admin-token' || token === 'valid-non-admin-token') {
            // This part is tricky because we are mocking verify.
            // Let's assume specific tokens imply specific roles for testing.
            if (token === 'valid-admin-token') req.user = { role: 'admin', userId: 1, organizationId: 1, organizationSchema: 'org1' };
            else if (token === 'valid-non-admin-token') req.user = { role: 'user', userId: 2, organizationId: 1, organizationSchema: 'org1' };
            next();
         } else {
            return res.sendStatus(403); // Forbidden for bad tokens in test
         }
      }
    } else {
      res.sendStatus(401); // Unauthorized if no token
    }
  }),
  authorizeRole: jest.fn((role) => (req, res, next) => {
    if (req.user && req.user.role === role) {
      next();
    } else {
      res.sendStatus(403); // Forbidden if role doesn't match
    }
  }),
}));

const app = express();
app.use(express.json());
app.use('/api/reports', reportRoutes); // Mount the routes to be tested

// Helper to generate tokens
const generateTestToken = (payload, secret = 'test_secret_key') => {
  return mockJwt.sign(payload, secret, { expiresIn: '1h' });
};

const adminToken = generateTestToken({ userId: 1, email: 'admin@test.com', role: 'admin', organizationId: 1, organizationSchema: 'org1' });
const userToken = generateTestToken({ userId: 2, email: 'user@test.com', role: 'user', organizationId: 1, organizationSchema: 'org1' });


describe('Report Routes - /api/reports', () => {
  beforeEach(() => {
    // Reset the mocks before each test to clear call counts, etc.
    authenticateToken.mockClear();
    authorizeRole.mockClear();

    // Redefine mock implementations if they were altered by a specific test
    authenticateToken.mockImplementation((req, res, next) => {
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                    const decoded = mockJwt.verify(token, 'test_secret_key');
                req.user = decoded;
                next();
            } catch (err) {
                 // Simplified for testing: if mockJwt.verify fails, it's an invalid token
                return res.sendStatus(403); // Forbidden for truly invalid/malformed tokens
            }
        } else {
            res.sendStatus(401); // Unauthorized if no token
        }
    });
    authorizeRole.mockImplementation((role) => (req, res, next) => {
         if (req.user && req.user.role === role) {
            next();
        } else {
            res.sendStatus(403); // Forbidden if role doesn't match
        }
    });
  });

  describe('GET /summary', () => {
    it('should return 401 if no token is provided', async () => {
      const response = await request(app).get('/api/reports/summary');
      expect(response.statusCode).toBe(401);
    });

    it('should return 403 if a non-admin user token is provided', async () => {
      // Mock authenticateToken to simulate a non-admin user
      authenticateToken.mockImplementationOnce((req, res, next) => {
        req.user = { role: 'user', userId: 2, organizationId: 1, organizationSchema: 'org1' }; // Simulate non-admin user
        next();
      });
      const response = await request(app)
        .get('/api/reports/summary')
        .set('Authorization', `Bearer ${userToken}`); // Still need a token structure for authenticateToken

      expect(response.statusCode).toBe(403);
      // authorizeRole is called during route setup, not per-request directly.
      // The returned middleware from authorizeRole('admin') is called per-request.
      // Status code check is sufficient to verify role protection.
    });

    it('should return 200 and report data for an admin user', async () => {
      // Mock authenticateToken to simulate an admin user
       authenticateToken.mockImplementationOnce((req, res, next) => {
        req.user = { role: 'admin', userId: 1, organizationId: 1, organizationSchema: 'org1' }; // Simulate admin user
        next();
      });

      const response = await request(app)
        .get('/api/reports/summary')
        .set('Authorization', `Bearer ${adminToken}`); // Use the admin token

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('books');
      expect(response.body).toHaveProperty('organizationSubscriptions');
      expect(response.body.users.total).toBeGreaterThanOrEqual(0);
      expect(response.body.books.total).toBeGreaterThanOrEqual(0);
      expect(authenticateToken).toHaveBeenCalled();
      // authorizeRole is called during route setup. Status code implies it worked.
    });

    it('should return 403 for a token that is invalid or has an incorrect role after passing authenticateToken (edge case)', async () => {
        // This test ensures authorizeRole correctly blocks if req.user is somehow not admin
        // even if authenticateToken passed (e.g. token valid, but role changed / error in logic)
        authenticateToken.mockImplementationOnce((req, res, next) => {
            req.user = { role: 'user', userId: 3, organizationId: 1, organizationSchema: 'org1' }; // Simulate a user that somehow passed initial auth but isn't admin
            next();
        });

        const someUserToken = generateTestToken({ userId: 3, email: 'anotheruser@test.com', role: 'user', organizationId: 1, organizationSchema: 'org1' });
        const response = await request(app)
            .get('/api/reports/summary')
            .set('Authorization', `Bearer ${someUserToken}`);

        expect(response.statusCode).toBe(403);
    });
  });
});
