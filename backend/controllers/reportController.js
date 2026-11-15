const reportService = require('../services/reportService');

class ReportController {
  async getDailyReport(req, res, next) {
    try {
      const { date, employeeId, department } = req.query;
      const report = await reportService.getDailyReport({ date, employeeId, department });
      res.json({
        success: true,
        data: report,
      });
    } catch (err) {
      next(err);
    }
  }

  async getWeeklyReport(req, res, next) {
    try {
      const { date, startDate, endDate, employeeId, department } = req.query;
      const report = await reportService.getWeeklyReport({ date, startDate, endDate, employeeId, department });
      res.json({
        success: true,
        data: report,
      });
    } catch (err) {
      next(err);
    }
  }

  async getMonthlyReport(req, res, next) {
    try {
      const { year, month, employeeId, department } = req.query;
      const report = await reportService.getMonthlyReport({ year, month, employeeId, department });
      res.json({
        success: true,
        data: report,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ReportController();
