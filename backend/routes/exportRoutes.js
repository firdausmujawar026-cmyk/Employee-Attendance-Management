const express = require('express');
const { query } = require('express-validator');
const exportController = require('../controllers/exportController');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validate');

const router = express.Router();

router.use(authenticateToken);

// GET /api/export/excel
router.get(
  '/excel',
  [
    query('type').optional().isIn(['daily', 'weekly', 'monthly']).withMessage('Type must be daily, weekly or monthly'),
  ],
  validateRequest,
  exportController.exportExcel
);

// GET /api/export/pdf
router.get(
  '/pdf',
  [
    query('type').optional().isIn(['daily', 'weekly', 'monthly']).withMessage('Type must be daily, weekly or monthly'),
  ],
  validateRequest,
  exportController.exportPDF
);

module.exports = router;
