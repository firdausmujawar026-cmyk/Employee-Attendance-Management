const exportService = require('../services/exportService');

class ExportController {
  async exportExcel(req, res, next) {
    try {
      const { type = 'daily', date, startDate, endDate, year, month, department, employeeId } = req.query;

      const buffer = await exportService.generateExcel({
        type,
        date,
        startDate,
        endDate,
        year,
        month,
        department,
        employeeId,
      });

      const fileName = `attendance_report_${type}_${new Date().toISOString().split('T')[0]}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(buffer);
    } catch (err) {
      next(err);
    }
  }

  async exportPDF(req, res, next) {
    try {
      const { type = 'daily', date, startDate, endDate, year, month, department, employeeId } = req.query;

      const fileName = `attendance_report_${type}_${new Date().toISOString().split('T')[0]}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      await exportService.generatePDF(
        {
          type,
          date,
          startDate,
          endDate,
          year,
          month,
          department,
          employeeId,
        },
        res
      );
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ExportController();
