const { protect, authorize } = require('./authMiddleware'); // Adjust path as needed
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '.env.test' }); // Ensure test env vars are loaded

// Ensure NODE_ENV is set to 'test' for consistency, though not strictly needed for these unit tests
process.env.NODE_ENV = 'test';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in the test environment. Ensure .env.test is configured.');
}

describe('Authentication Middleware', () => {
  let mockRequest;
  let mockResponse;
  let nextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    // Mock Express response methods
    mockResponse = {
      status: jest.fn().mockReturnThis(), // Allows chaining .status().json()
      json: jest.fn(),
      send: jest.fn(), // For other types of responses if any
    };
    nextFunction = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks after each test
  });

  describe('protect middleware', () => {
    const testUserPayload = { userId: '123', email: 'test@example.com', role: 'user', organizationId: 'org1' };

    it('should call next() and populate req.user with a valid token', () => {
      const token = jwt.sign(testUserPayload, JWT_SECRET, { expiresIn: '1h' });
      mockRequest.headers.authorization = `Bearer ${token}`;

      protect(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user.userId).toBe(testUserPayload.userId);
      expect(mockRequest.user.email).toBe(testUserPayload.email);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 401 if no token is provided', () => {
      protect(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Not authorized, no token provided.' });
    });

    it('should return 401 if token is malformed (not Bearer)', () => {
      mockRequest.headers.authorization = 'NotBearer token';
      protect(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      // The current implementation directly checks for 'Bearer ' prefix.
      // If it doesn't find it, it falls through to "no token provided"
      // This can be refined in the middleware for a more specific error.
      // For now, testing current behavior:
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Not authorized, no token provided.' });
    });
    
    it('should return 401 if token is present but not Bearer prefixed', () => {
        mockRequest.headers.authorization = 'somerandomtokenstring'; // No "Bearer "
        protect(mockRequest, mockResponse, nextFunction);
        expect(nextFunction).not.toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        // This will also fall into the "no token provided" if split fails as expected
        expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Not authorized, no token provided.' });
    });


    it('should return 401 for an invalid signature', () => {
      const token = jwt.sign(testUserPayload, 'wrongsecret', { expiresIn: '1h' });
      mockRequest.headers.authorization = `Bearer ${token}`;

      protect(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Not authorized, token failed (invalid signature or malformed).' });
    });

    it('should return 401 for an expired token', () => {
      const token = jwt.sign(testUserPayload, JWT_SECRET, { expiresIn: '0s' }); // Expires immediately
      mockRequest.headers.authorization = `Bearer ${token}`;

      // Need to wait a tiny bit for the token to actually be expired
      return new Promise(resolve => {
        setTimeout(() => {
            protect(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Not authorized, token expired.' });
            resolve();
        }, 50); // 50ms should be enough for expiry
      });
    });

    it('should return 401 for a token with invalid payload structure (e.g. if jwt.verify returns string)', () => {
        // This scenario is less common with jwt.verify but good to consider edge cases.
        // We can mock jwt.verify to return something unexpected.
        const originalVerify = jwt.verify;
        jwt.verify = jest.fn().mockReturnValue("unexpectedstring"); // Mocking verify to return a string

        mockRequest.headers.authorization = `Bearer sometoken`;
        protect(mockRequest, mockResponse, nextFunction);

        expect(nextFunction).not.toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        // The error message depends on how jwt.verify throws an error or what it returns.
        // If it throws, it would be caught by the generic catch.
        // If it returns a non-object, req.user might not be set correctly.
        // The current middleware code doesn't explicitly check type of 'decoded'.
        // Assuming jwt.verify throws for truly malformed tokens that aren't just signature/expiry issues.
        expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Not authorized, token failed (invalid signature or malformed).' });
        
        jwt.verify = originalVerify; // Restore original function
    });
  });

  describe('authorize middleware', () => {
    it('should call next() if user role is in allowedRoles', () => {
      mockRequest.user = { role: 'admin' };
      const adminOnly = authorize(['admin', 'superadmin']);

      adminOnly(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 403 if user role is not in allowedRoles', () => {
      mockRequest.user = { role: 'user' };
      const adminOnly = authorize(['admin', 'superadmin']);

      adminOnly(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Forbidden: User role 'user' is not authorized to access this resource."
      });
    });

    it('should return 403 if req.user is not defined (protect middleware did not run or failed)', () => {
      // mockRequest.user is undefined by default in these tests
      const anyRole = authorize(['user']); // Role doesn't matter here

      anyRole(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Forbidden: User role not available.' });
    });

    it('should return 403 if req.user.role is not defined', () => {
      mockRequest.user = { email: 'test@example.com' }; // User object without role property
      const anyRole = authorize(['user']);

      anyRole(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Forbidden: User role not available.' });
    });

    it('should handle empty allowedRoles array (no one is allowed)', () => {
        mockRequest.user = { role: 'admin' };
        const noOneAllowed = authorize([]);

        noOneAllowed(mockRequest, mockResponse, nextFunction);

        expect(nextFunction).not.toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(403);
        expect(mockResponse.json).toHaveBeenCalledWith({
            message: "Forbidden: User role 'admin' is not authorized to access this resource."
        });
    });
  });
});
