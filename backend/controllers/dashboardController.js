const dashboardService = require('../services/dashboardService');

class DashboardController {
  async getStats(req, res, next) {
    try {
      const stats = await dashboardService.getStats();
      res.json({
        success: true,
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  }

  async getAttendanceOverview(req, res, next) {
    try {
      const days = req.query.days ? parseInt(req.query.days, 10) : 7;
      const data = await dashboardService.getAttendanceOverview(days);
      res.json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async getDepartmentDistribution(req, res, next) {
    try {
      const distribution = await dashboardService.getDepartmentDistribution();
      res.json({
        success: true,
        data: distribution,
      });
    } catch (err) {
      next(err);
    }
  }

  async getRecentAttendance(req, res, next) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
      const recent = await dashboardService.getRecentAttendance(limit);
      res.json({
        success: true,
        data: recent,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DashboardController();
