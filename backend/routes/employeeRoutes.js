const express = require('express');
const { body, param, query } = require('express-validator');
const employeeController = require('../controllers/employeeController');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validate');

const router = express.Router();

// Apply auth to all employee routes
router.use(authenticateToken);

// GET /api/employees
router.get('/', employeeController.getEmployees);

// GET /api/employees/departments
router.get('/departments', employeeController.getDepartments);

// GET /api/employees/:id
router.get('/:id', [param('id').isInt().withMessage('Employee ID must be an integer')], validateRequest, employeeController.getEmployeeById);

// POST /api/employees
router.post(
  '/',
  [
    body('EmployeeCode')
      .trim()
      .notEmpty()
      .withMessage('Employee Code is required')
      .isLength({ max: 20 })
      .withMessage('Employee Code must not exceed 20 characters'),
    body('EmployeeName')
      .trim()
      .notEmpty()
      .withMessage('Employee Name is required')
      .isLength({ max: 150 })
      .withMessage('Employee Name must not exceed 150 characters'),
    body('Department')
      .trim()
      .notEmpty()
      .withMessage('Department is required')
      .isLength({ max: 100 })
      .withMessage('Department must not exceed 100 characters'),
    body('Designation')
      .optional({ nullable: true, checkFalsy: true })
      .trim()
      .isLength({ max: 100 })
      .withMessage('Designation must not exceed 100 characters'),
    body('MobileNo')
      .optional({ nullable: true, checkFalsy: true })
      .trim()
      .matches(/^[\d+\s-]+$/)
      .withMessage('Mobile number should contain valid phone digits and +')
      .isLength({ max: 15 })
      .withMessage('Mobile number must not exceed 15 characters'),
    body('EmailID')
      .optional({ nullable: true, checkFalsy: true })
      .trim()
      .isEmail()
      .withMessage('Must be a valid email address')
      .isLength({ max: 150 })
      .withMessage('Email must not exceed 150 characters'),
    body('DateOfJoining')
      .notEmpty()
      .withMessage('Date of Joining is required')
      .isISO8601()
      .withMessage('Date of Joining must be a valid date (YYYY-MM-DD)'),
    body('IsActive').optional().isBoolean().withMessage('IsActive must be a boolean'),
  ],
  validateRequest,
  employeeController.createEmployee
);

// PUT /api/employees/:id
router.put(
  '/:id',
  [
    param('id').isInt().withMessage('Employee ID must be an integer'),
    body('EmployeeName')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Employee Name cannot be empty')
      .isLength({ max: 150 })
      .withMessage('Employee Name must not exceed 150 characters'),
    body('Department')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Department cannot be empty')
      .isLength({ max: 100 })
      .withMessage('Department must not exceed 100 characters'),
    body('Designation')
      .optional({ nullable: true, checkFalsy: true })
      .trim()
      .isLength({ max: 100 })
      .withMessage('Designation must not exceed 100 characters'),
    body('MobileNo')
      .optional({ nullable: true, checkFalsy: true })
      .trim()
      .matches(/^[\d+\s-]+$/)
      .withMessage('Mobile number should contain valid phone digits and +')
      .isLength({ max: 15 })
      .withMessage('Mobile number must not exceed 15 characters'),
    body('EmailID')
      .optional({ nullable: true, checkFalsy: true })
      .trim()
      .isEmail()
      .withMessage('Must be a valid email address')
      .isLength({ max: 150 })
      .withMessage('Email must not exceed 150 characters'),
    body('DateOfJoining').optional().isISO8601().withMessage('Date of Joining must be a valid date (YYYY-MM-DD)'),
    body('IsActive').optional().isBoolean().withMessage('IsActive must be a boolean'),
  ],
  validateRequest,
  employeeController.updateEmployee
);

// PATCH /api/employees/:id/status
router.patch(
  '/:id/status',
  [
    param('id').isInt().withMessage('Employee ID must be an integer'),
    body('isActive').isBoolean().withMessage('isActive must be a boolean (true or false)'),
  ],
  validateRequest,
  employeeController.setEmployeeStatus
);

// DELETE /api/employees/:id (Blocked if attendance exists)
router.delete('/:id', [param('id').isInt().withMessage('Employee ID must be an integer')], validateRequest, employeeController.deleteEmployee);

module.exports = router;
