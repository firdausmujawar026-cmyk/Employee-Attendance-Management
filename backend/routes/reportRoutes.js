const express = require('express');
const { query } = require('express-validator');
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validate');

const router = express.Router();

router.use(authenticateToken);

// GET /api/reports/daily
router.get(
  '/daily',
  [
    query('date').optional().isISO8601().withMessage('Date must be in format YYYY-MM-DD'),
  ],
  validateRequest,
  reportController.getDailyReport
);

// GET /api/reports/weekly
router.get(
  '/weekly',
  [
    query('startDate').optional().isISO8601().withMessage('startDate must be in format YYYY-MM-DD'),
    query('endDate').optional().isISO8601().withMessage('endDate must be in format YYYY-MM-DD'),
  ],
  validateRequest,
  reportController.getWeeklyReport
);

// GET /api/reports/monthly
router.get(
  '/monthly',
  [
    query('year').optional().isInt({ min: 2000, max: 2100 }).withMessage('Year must be valid integer'),
    query('month').optional().isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  ],
  validateRequest,
  reportController.getMonthlyReport
);

module.exports = router;
