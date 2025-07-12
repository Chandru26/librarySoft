const express = require('express');
const router = express.Router();
const { protect, authorizeRole } = require('../middleware/authMiddleware');

// Mock data for reports
const mockReportData = {
  users: {
    total: 150,
    newLast30Days: 25,
    activeLast30Days: 120,
  },
  books: {
    total: 500,
    addedLast30Days: 50,
  },
  organizationSubscriptions: {
    freeTier: 10,
    standardTier: 5,
    premiumTier: 2,
  }
};

// GET /api/reports/summary - Admin only
router.get('/summary', protect, authorizeRole('admin'), (req, res) => {
  // In a real application, you would fetch this data from the database
  res.json(mockReportData);
});

module.exports = router;
