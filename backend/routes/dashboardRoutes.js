const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

// GET /api/dashboard/stats
router.get('/stats', dashboardController.getStats);

// GET /api/dashboard/attendance-overview
router.get('/attendance-overview', dashboardController.getAttendanceOverview);

// GET /api/dashboard/department-distribution
router.get('/department-distribution', dashboardController.getDepartmentDistribution);

// GET /api/dashboard/recent-attendance
router.get('/recent-attendance', dashboardController.getRecentAttendance);

module.exports = router;
