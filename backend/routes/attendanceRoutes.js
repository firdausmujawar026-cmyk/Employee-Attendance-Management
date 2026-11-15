const express = require('express');
const { body, param, query } = require('express-validator');
const attendanceController = require('../controllers/attendanceController');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validate');

const router = express.Router();

router.use(authenticateToken);

// GET /api/attendance?date=YYYY-MM-DD&department=...&search=...
router.get(
  '/',
  [
    query('date')
      .optional()
      .isISO8601()
      .withMessage('Date must be in format YYYY-MM-DD'),
  ],
  validateRequest,
  attendanceController.getDailyAttendance
);

// POST /api/attendance/bulk
router.post(
  '/bulk',
  [
    body('date').notEmpty().withMessage('Date is required').isISO8601().withMessage('Date must be in format YYYY-MM-DD'),
    body('records').isArray({ min: 1 }).withMessage('Records array cannot be empty'),
  ],
  validateRequest,
  attendanceController.saveBulkAttendance
);

// PUT /api/attendance/:id
router.put(
  '/:id',
  [
    param('id').isInt().withMessage('Attendance ID must be an integer'),
    body('AttendanceStatus')
      .notEmpty()
      .withMessage('AttendanceStatus is required')
      .isIn(['Present', 'Absent', 'Half Day', 'Leave', 'Holiday', 'Weekly Off'])
      .withMessage('Invalid attendance status option'),
  ],
  validateRequest,
  attendanceController.updateAttendance
);

module.exports = router;
