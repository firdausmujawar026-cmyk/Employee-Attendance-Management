const attendanceService = require('../services/attendanceService');

class AttendanceController {
  async getDailyAttendance(req, res, next) {
    try {
      const { date, department, search } = req.query;
      const result = await attendanceService.getDailyAttendance(date, department, search);
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }

  async saveBulkAttendance(req, res, next) {
    try {
      const { date, records } = req.body;
      const result = await attendanceService.saveBulkAttendance({ date, records });
      res.json(result);
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }

  async updateAttendance(req, res, next) {
    try {
      const { id } = req.params;
      const result = await attendanceService.updateAttendance(id, req.body);
      res.json({
        success: true,
        message: 'Attendance record updated successfully.',
        data: result,
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }
}

module.exports = new AttendanceController();
