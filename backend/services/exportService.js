const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const reportService = require('./reportService');

class ExportService {
  /**
   * Generate Excel report for Daily, Weekly, or Monthly
   */
  async generateExcel({ type = 'daily', ...params }) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Enterprise Attendance System';
    workbook.created = new Date();

    const normalizedType = type.toLowerCase();

    if (normalizedType === 'daily') {
      const report = await reportService.getDailyReport(params);
      const sheet = workbook.addWorksheet('Daily Attendance');

      // Title & Metadata
      sheet.mergeCells('A1:G1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = 'EMPLOYEE ATTENDANCE MANAGEMENT SYSTEM';
      titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }; // Dark Navy
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.getRow(1).height = 36;

      sheet.mergeCells('A2:G2');
      const subCell = sheet.getCell('A2');
      subCell.value = `Daily Attendance Report - Date: ${report.date} | Department: ${params.department || 'All'} | Employee: ${params.employeeId || 'All'}`;
      subCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF475569' } };
      subCell.alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.getRow(2).height = 20;

      sheet.addRow([]); // Blank row

      // Table Headers
      const headerRow = sheet.addRow([
        'Employee Code',
        'Employee Name',
        'Department',
        'Designation',
        'Attendance Status',
        'In Time',
        'Out Time',
      ]);
      headerRow.height = 25;
      headerRow.eachCell((cell) => {
        cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      // Data Rows
      report.data.forEach((row, idx) => {
        const r = sheet.addRow([
          row.EmployeeCode,
          row.EmployeeName,
          row.Department,
          row.Designation || '-',
          row.AttendanceStatus,
          row.InTime || '-',
          row.OutTime || '-',
        ]);
        r.height = 20;
        const bg = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC';
        r.eachCell((cell, colNum) => {
          cell.font = { name: 'Arial', size: 10 };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          };
          if (colNum === 1 || colNum >= 5) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          } else {
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
          }
        });
      });

      sheet.addRow([]);

      // Summary Table
      const summaryHeader = sheet.addRow(['SUMMARY METRIC', 'COUNT']);
      summaryHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      summaryHeader.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
      summaryHeader.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };

      const summaryData = [
        ['Total Employees', report.summary.total],
        ['Present', report.summary.present],
        ['Absent', report.summary.absent],
        ['Half Day', report.summary.halfDay],
        ['On Leave', report.summary.leave],
        ['Holiday', report.summary.holiday],
        ['Weekly Off', report.summary.weeklyOff],
        ['Pending / Unmarked', report.summary.notMarked],
      ];

      summaryData.forEach(([label, count]) => {
        const sr = sheet.addRow([label, count]);
        sr.getCell(1).font = { bold: true };
        sr.getCell(2).alignment = { horizontal: 'center' };
      });

      // Adjust column widths
      sheet.columns = [
        { width: 16 },
        { width: 26 },
        { width: 20 },
        { width: 24 },
        { width: 18 },
        { width: 14 },
        { width: 14 },
      ];

      return await workbook.xlsx.writeBuffer();
    }

    if (normalizedType === 'weekly') {
      const report = await reportService.getWeeklyReport(params);
      const sheet = workbook.addWorksheet('Weekly Report');

      sheet.mergeCells('A1:Q1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = 'WEEKLY ATTENDANCE MATRIX REPORT (MONDAY - SUNDAY)';
      titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.getRow(1).height = 36;

      sheet.mergeCells('A2:Q2');
      const subCell = sheet.getCell('A2');
      subCell.value = `Period: ${report.weekStart} to ${report.weekEnd} | Department: ${params.department || 'All'} | Employee: ${params.employeeId || 'All'}`;
      subCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF475569' } };
      subCell.alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.getRow(2).height = 20;

      sheet.addRow([]);

      const headerRow = sheet.addRow([
        'Emp Code',
        'Employee Name',
        'Department',
        'Mon',
        'Tue',
        'Wed',
        'Thu',
        'Fri',
        'Sat',
        'Sun',
        'Present',
        'Absent',
        'Half Day',
        'Leave',
        'Holiday',
        'Weekly Off',
      ]);
      headerRow.height = 25;
      headerRow.eachCell((cell) => {
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      report.data.forEach((row, idx) => {
        const r = sheet.addRow([
          row.EmployeeCode,
          row.EmployeeName,
          row.Department,
          row.Monday,
          row.Tuesday,
          row.Wednesday,
          row.Thursday,
          row.Friday,
          row.Saturday,
          row.Sunday,
          row.PresentTotal,
          row.AbsentTotal,
          row.HalfDayTotal,
          row.LeaveTotal,
          row.HolidayTotal,
          row.WeeklyOffTotal,
        ]);
        r.height = 20;
        const bg = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC';
        r.eachCell((cell, colNum) => {
          cell.font = { name: 'Arial', size: 9 };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
          cell.alignment = { horizontal: colNum <= 3 ? 'left' : 'center', vertical: 'middle' };
        });
      });

      // Total Row
      const totalRow = sheet.addRow([
        'TOTALS',
        `Employees: ${report.summary.totalEmployees}`,
        '-',
        '-',
        '-',
        '-',
        '-',
        '-',
        '-',
        '-',
        report.summary.presentTotal,
        report.summary.absentTotal,
        report.summary.halfDayTotal,
        report.summary.leaveTotal,
        report.summary.holidayTotal,
        report.summary.weeklyOffTotal,
      ]);
      totalRow.height = 24;
      totalRow.eachCell((cell) => {
        cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      sheet.columns = [
        { width: 14 },
        { width: 24 },
        { width: 18 },
        { width: 10 },
        { width: 10 },
        { width: 10 },
        { width: 10 },
        { width: 10 },
        { width: 10 },
        { width: 10 },
        { width: 10 },
        { width: 10 },
        { width: 10 },
        { width: 10 },
        { width: 10 },
        { width: 12 },
      ];

      return await workbook.xlsx.writeBuffer();
    }

    if (normalizedType === 'monthly') {
      const report = await reportService.getMonthlyReport(params);
      const sheet = workbook.addWorksheet('Monthly Report');

      sheet.mergeCells('A1:J1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = 'MONTHLY ATTENDANCE SUMMARY REPORT';
      titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.getRow(1).height = 36;

      sheet.mergeCells('A2:J2');
      const subCell = sheet.getCell('A2');
      subCell.value = `Month: ${report.monthName} ${report.year} (${report.daysInMonth} Days) | Department: ${params.department || 'All'} | Employee: ${params.employeeId || 'All'}`;
      subCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF475569' } };
      subCell.alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.getRow(2).height = 20;

      sheet.addRow([]);

      const headerRow = sheet.addRow([
        'Emp Code',
        'Employee Name',
        'Department',
        'Designation',
        'Present',
        'Absent',
        'Half Day',
        'Leave',
        'Holiday',
        'Weekly Off',
      ]);
      headerRow.height = 25;
      headerRow.eachCell((cell) => {
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      report.data.forEach((row, idx) => {
        const r = sheet.addRow([
          row.EmployeeCode,
          row.EmployeeName,
          row.Department,
          row.Designation || '-',
          row.Present,
          row.Absent,
          row.HalfDay,
          row.Leave,
          row.Holiday,
          row.WeeklyOff,
        ]);
        r.height = 20;
        const bg = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC';
        r.eachCell((cell, colNum) => {
          cell.font = { name: 'Arial', size: 9 };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
          cell.alignment = { horizontal: colNum <= 4 ? 'left' : 'center', vertical: 'middle' };
        });
      });

      // Total Row
      const totalRow = sheet.addRow([
        'TOTALS',
        `Employees: ${report.summary.totalEmployees}`,
        '-',
        '-',
        report.summary.presentTotal,
        report.summary.absentTotal,
        report.summary.halfDayTotal,
        report.summary.leaveTotal,
        report.summary.holidayTotal,
        report.summary.weeklyOffTotal,
      ]);
      totalRow.height = 24;
      totalRow.eachCell((cell) => {
        cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      sheet.columns = [
        { width: 14 },
        { width: 24 },
        { width: 18 },
        { width: 20 },
        { width: 12 },
        { width: 12 },
        { width: 12 },
        { width: 12 },
        { width: 12 },
        { width: 14 },
      ];

      return await workbook.xlsx.writeBuffer();
    }

    throw new Error(`Unsupported export type: ${type}`);
  }

  /**
   * Generate PDF report for Daily, Weekly, or Monthly using PDFKit
   */
  async generatePDF({ type = 'daily', ...params }, res) {
    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: type === 'weekly' ? 'landscape' : 'portrait' });
    doc.pipe(res);

    const normalizedType = type.toLowerCase();

    // Header styling
    doc.rect(30, 30, doc.page.width - 60, 48).fill('#0F172A');
    doc.fillColor('#FFFFFF').fontSize(16).font('Helvetica-Bold').text('EMPLOYEE ATTENDANCE MANAGEMENT SYSTEM', 40, 42, { align: 'center' });

    let subtitle = '';
    let reportData = null;

    if (normalizedType === 'daily') {
      reportData = await reportService.getDailyReport(params);
      subtitle = `Daily Attendance Report | Date: ${reportData.date} | Dept: ${params.department || 'All'} | Emp: ${params.employeeId || 'All'}`;
    } else if (normalizedType === 'weekly') {
      reportData = await reportService.getWeeklyReport(params);
      subtitle = `Weekly Attendance Report | Period: ${reportData.weekStart} to ${reportData.weekEnd} | Dept: ${params.department || 'All'}`;
    } else if (normalizedType === 'monthly') {
      reportData = await reportService.getMonthlyReport(params);
      subtitle = `Monthly Attendance Summary | ${reportData.monthName} ${reportData.year} | Dept: ${params.department || 'All'}`;
    }

    doc.fillColor('#475569').fontSize(10).font('Helvetica-Oblique').text(subtitle, 40, 88, { align: 'center' });

    doc.moveDown(1.5);
    let y = 115;

    if (normalizedType === 'daily') {
      // Columns: Code (70), Name (150), Dept (100), Status (80), In (60), Out (60)
      doc.rect(30, y, doc.page.width - 60, 22).fill('#1E293B');
      doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
      doc.text('Emp Code', 35, y + 6, { width: 65 });
      doc.text('Employee Name', 105, y + 6, { width: 145 });
      doc.text('Department', 255, y + 6, { width: 100 });
      doc.text('Status', 360, y + 6, { width: 75, align: 'center' });
      doc.text('In Time', 440, y + 6, { width: 55, align: 'center' });
      doc.text('Out Time', 500, y + 6, { width: 55, align: 'center' });

      y += 24;

      reportData.data.forEach((r, idx) => {
        if (y > doc.page.height - 100) {
          doc.addPage();
          y = 40;
        }

        const bg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
        doc.rect(30, y, doc.page.width - 60, 18).fill(bg);

        doc.fillColor('#1E293B').fontSize(8).font('Helvetica');
        doc.text(r.EmployeeCode, 35, y + 4, { width: 65 });
        doc.text(r.EmployeeName, 105, y + 4, { width: 145 });
        doc.text(r.Department, 255, y + 4, { width: 100 });
        doc.font('Helvetica-Bold').text(r.AttendanceStatus, 360, y + 4, { width: 75, align: 'center' });
        doc.font('Helvetica').text(r.InTime || '-', 440, y + 4, { width: 55, align: 'center' });
        doc.text(r.OutTime || '-', 500, y + 4, { width: 55, align: 'center' });

        y += 19;
      });

      // Daily Summary box
      y += 15;
      if (y > doc.page.height - 120) {
        doc.addPage();
        y = 40;
      }

      doc.rect(30, y, doc.page.width - 60, 50).fill('#F1F5F9');
      doc.fillColor('#0F172A').fontSize(10).font('Helvetica-Bold').text('Attendance Summary Totals', 40, y + 8);
      doc.fontSize(8).font('Helvetica');
      doc.text(
        `Total: ${reportData.summary.total}  |  Present: ${reportData.summary.present}  |  Absent: ${reportData.summary.absent}  |  Half Day: ${reportData.summary.halfDay}  |  Leave: ${reportData.summary.leave}  |  Holiday: ${reportData.summary.holiday}  |  Off: ${reportData.summary.weeklyOff}  |  Unmarked: ${reportData.summary.notMarked}`,
        40,
        y + 26
      );
    } else if (normalizedType === 'weekly') {
      // Landscape table: Emp Code, Name, Dept, Mon-Sun, Totals
      doc.rect(30, y, doc.page.width - 60, 22).fill('#1E293B');
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
      doc.text('Code', 35, y + 6, { width: 50 });
      doc.text('Employee Name', 90, y + 6, { width: 130 });
      doc.text('Dept', 225, y + 6, { width: 90 });
      doc.text('Mon', 320, y + 6, { width: 38, align: 'center' });
      doc.text('Tue', 360, y + 6, { width: 38, align: 'center' });
      doc.text('Wed', 400, y + 6, { width: 38, align: 'center' });
      doc.text('Thu', 440, y + 6, { width: 38, align: 'center' });
      doc.text('Fri', 480, y + 6, { width: 38, align: 'center' });
      doc.text('Sat', 520, y + 6, { width: 38, align: 'center' });
      doc.text('Sun', 560, y + 6, { width: 38, align: 'center' });
      doc.text('Pres', 605, y + 6, { width: 35, align: 'center' });
      doc.text('Abs', 645, y + 6, { width: 35, align: 'center' });
      doc.text('Half', 685, y + 6, { width: 35, align: 'center' });
      doc.text('Leave', 725, y + 6, { width: 35, align: 'center' });
      doc.text('Off', 765, y + 6, { width: 35, align: 'center' });

      y += 24;

      reportData.data.forEach((r, idx) => {
        if (y > doc.page.height - 80) {
          doc.addPage();
          y = 40;
        }

        const bg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
        doc.rect(30, y, doc.page.width - 60, 16).fill(bg);

        doc.fillColor('#1E293B').fontSize(7.5).font('Helvetica');
        doc.text(r.EmployeeCode, 35, y + 3, { width: 50 });
        doc.text(r.EmployeeName, 90, y + 3, { width: 130 });
        doc.text(r.Department, 225, y + 3, { width: 90 });
        doc.text(r.Monday ? r.Monday.substring(0, 3) : '-', 320, y + 3, { width: 38, align: 'center' });
        doc.text(r.Tuesday ? r.Tuesday.substring(0, 3) : '-', 360, y + 3, { width: 38, align: 'center' });
        doc.text(r.Wednesday ? r.Wednesday.substring(0, 3) : '-', 400, y + 3, { width: 38, align: 'center' });
        doc.text(r.Thursday ? r.Thursday.substring(0, 3) : '-', 440, y + 3, { width: 38, align: 'center' });
        doc.text(r.Friday ? r.Friday.substring(0, 3) : '-', 480, y + 3, { width: 38, align: 'center' });
        doc.text(r.Saturday ? r.Saturday.substring(0, 3) : '-', 520, y + 3, { width: 38, align: 'center' });
        doc.text(r.Sunday ? r.Sunday.substring(0, 3) : '-', 560, y + 3, { width: 38, align: 'center' });
        doc.font('Helvetica-Bold');
        doc.text(String(r.PresentTotal), 605, y + 3, { width: 35, align: 'center' });
        doc.text(String(r.AbsentTotal), 645, y + 3, { width: 35, align: 'center' });
        doc.text(String(r.HalfDayTotal), 685, y + 3, { width: 35, align: 'center' });
        doc.text(String(r.LeaveTotal), 725, y + 3, { width: 35, align: 'center' });
        doc.text(String(r.WeeklyOffTotal), 765, y + 3, { width: 35, align: 'center' });

        y += 17;
      });

      // Weekly Summary line
      y += 10;
      doc.rect(30, y, doc.page.width - 60, 20).fill('#0F172A');
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
      doc.text(`TOTALS (Employees: ${reportData.summary.totalEmployees})`, 35, y + 6);
      doc.text(`Present: ${reportData.summary.presentTotal}  |  Absent: ${reportData.summary.absentTotal}  |  Half Day: ${reportData.summary.halfDayTotal}  |  Leave: ${reportData.summary.leaveTotal}  |  Weekly Off: ${reportData.summary.weeklyOffTotal}`, 320, y + 6);
    } else if (normalizedType === 'monthly') {
      // Monthly summary table
      doc.rect(30, y, doc.page.width - 60, 22).fill('#1E293B');
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
      doc.text('Emp Code', 35, y + 6, { width: 65 });
      doc.text('Employee Name', 105, y + 6, { width: 140 });
      doc.text('Department', 250, y + 6, { width: 95 });
      doc.text('Present', 350, y + 6, { width: 35, align: 'center' });
      doc.text('Absent', 390, y + 6, { width: 35, align: 'center' });
      doc.text('Half Day', 430, y + 6, { width: 40, align: 'center' });
      doc.text('Leave', 475, y + 6, { width: 35, align: 'center' });
      doc.text('Holiday', 515, y + 6, { width: 35, align: 'center' });
      doc.text('Off', 555, y + 6, { width: 30, align: 'center' });

      y += 24;

      reportData.data.forEach((r, idx) => {
        if (y > doc.page.height - 80) {
          doc.addPage();
          y = 40;
        }

        const bg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
        doc.rect(30, y, doc.page.width - 60, 18).fill(bg);

        doc.fillColor('#1E293B').fontSize(8).font('Helvetica');
        doc.text(r.EmployeeCode, 35, y + 4, { width: 65 });
        doc.text(r.EmployeeName, 105, y + 4, { width: 140 });
        doc.text(r.Department, 250, y + 4, { width: 95 });
        doc.font('Helvetica-Bold');
        doc.text(String(r.Present), 350, y + 4, { width: 35, align: 'center' });
        doc.text(String(r.Absent), 390, y + 4, { width: 35, align: 'center' });
        doc.text(String(r.HalfDay), 430, y + 4, { width: 40, align: 'center' });
        doc.text(String(r.Leave), 475, y + 4, { width: 35, align: 'center' });
        doc.text(String(r.Holiday), 515, y + 4, { width: 35, align: 'center' });
        doc.text(String(r.WeeklyOff), 555, y + 4, { width: 30, align: 'center' });

        y += 19;
      });

      // Monthly Total Bar
      y += 12;
      doc.rect(30, y, doc.page.width - 60, 22).fill('#0F172A');
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
      doc.text(`TOTALS (${reportData.summary.totalEmployees} Employees)`, 35, y + 6);
      doc.text(
        `Pres: ${reportData.summary.presentTotal} | Abs: ${reportData.summary.absentTotal} | Half: ${reportData.summary.halfDayTotal} | Leave: ${reportData.summary.leaveTotal} | Hol: ${reportData.summary.holidayTotal} | Off: ${reportData.summary.weeklyOffTotal}`,
        250,
        y + 6
      );
    }

    doc.end();
  }
}

module.exports = new ExportService();
