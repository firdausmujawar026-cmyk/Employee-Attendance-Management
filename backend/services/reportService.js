const db = require('../config/db');

class ReportService {
  formatDate(d) {
    if (typeof d === 'string') return d.split('T')[0];
    return d.toISOString().split('T')[0];
  }

  /**
   * Helper to get Monday and Sunday of a given date's week
   */
  getMondayAndSunday(d) {
    const date = new Date(d);
    // getDay() gives 0 for Sunday, 1 for Monday, ..., 6 for Saturday
    const day = date.getDay();
    // In ISO week, Monday is day 1, Sunday is day 7
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(date);
    monday.setDate(date.getDate() + diffToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return {
      monday: this.formatDate(monday),
      sunday: this.formatDate(sunday),
    };
  }

  /**
   * Daily Report
   */
  async getDailyReport({ date, employeeId, department }) {
    const today = this.formatDate(new Date());
    const targetDate = date ? this.formatDate(date) : today;

    let employees = [];
    let attendanceRecords = [];

    if (db.getDialect() === 'mysql') {
      let whereClauses = ['(e.IsActive = 1 OR a.AttendanceID IS NOT NULL)'];
      let params = [targetDate];

      if (employeeId && employeeId !== 'ALL') {
        whereClauses.push('e.EmployeeID = ?');
        params.push(parseInt(employeeId, 10));
      }

      if (department && department !== 'ALL') {
        whereClauses.push('e.Department = ?');
        params.push(department);
      }

      const sql = `
        SELECT 
          e.EmployeeID,
          e.EmployeeCode,
          e.EmployeeName,
          e.Department,
          e.Designation,
          e.DateOfJoining,
          a.AttendanceID,
          a.AttendanceDate,
          a.AttendanceStatus,
          a.InTime,
          a.OutTime,
          a.Remarks
        FROM EmployeeMaster e
        LEFT JOIN Attendance a 
          ON e.EmployeeID = a.EmployeeID 
          AND a.AttendanceDate = ?
        WHERE ${whereClauses.join(' AND ')}
        ORDER BY e.Department ASC, e.EmployeeName ASC
      `;

      const [rows] = await db.query(sql, params);
      attendanceRecords = rows;
    } else {
      const store = db.getMemoryStore();
      const attMap = new Map(store.attendance.filter((a) => a.AttendanceDate === targetDate).map((a) => [a.EmployeeID, a]));

      let filteredEmployees = store.employees.filter((e) => e.IsActive === 1 || attMap.has(e.EmployeeID));

      if (employeeId && employeeId !== 'ALL') {
        filteredEmployees = filteredEmployees.filter((e) => e.EmployeeID === parseInt(employeeId, 10));
      }

      if (department && department !== 'ALL') {
        filteredEmployees = filteredEmployees.filter((e) => e.Department.toLowerCase() === department.toLowerCase());
      }

      filteredEmployees.sort((a, b) => a.Department.localeCompare(b.Department) || a.EmployeeName.localeCompare(b.EmployeeName));

      attendanceRecords = filteredEmployees.map((e) => {
        const att = attMap.get(e.EmployeeID);
        return {
          EmployeeID: e.EmployeeID,
          EmployeeCode: e.EmployeeCode,
          EmployeeName: e.EmployeeName,
          Department: e.Department,
          Designation: e.Designation,
          DateOfJoining: e.DateOfJoining,
          AttendanceID: att ? att.AttendanceID : null,
          AttendanceDate: att ? att.AttendanceDate : targetDate,
          AttendanceStatus: att ? att.AttendanceStatus : 'Not Marked',
          InTime: att ? att.InTime : null,
          OutTime: att ? att.OutTime : null,
          Remarks: att ? att.Remarks : null,
        };
      });
    }

    // Format results and build summary
    const formattedRecords = attendanceRecords.map((r) => ({
      ...r,
      AttendanceStatus: r.AttendanceStatus || 'Not Marked',
    }));

    const summary = {
      total: formattedRecords.length,
      present: formattedRecords.filter((r) => r.AttendanceStatus === 'Present').length,
      absent: formattedRecords.filter((r) => r.AttendanceStatus === 'Absent').length,
      halfDay: formattedRecords.filter((r) => r.AttendanceStatus === 'Half Day').length,
      leave: formattedRecords.filter((r) => r.AttendanceStatus === 'Leave').length,
      holiday: formattedRecords.filter((r) => r.AttendanceStatus === 'Holiday').length,
      weeklyOff: formattedRecords.filter((r) => r.AttendanceStatus === 'Weekly Off').length,
      notMarked: formattedRecords.filter((r) => r.AttendanceStatus === 'Not Marked').length,
    };

    return {
      reportType: 'Daily',
      date: targetDate,
      filters: { date: targetDate, employeeId, department },
      summary,
      data: formattedRecords,
    };
  }

  /**
   * Weekly Report (Monday to Sunday)
   */
  async getWeeklyReport({ date, startDate, endDate, employeeId, department }) {
    let weekStart = startDate;
    let weekEnd = endDate;

    if (!weekStart || !weekEnd) {
      const baseDate = date || new Date();
      const bounds = this.getMondayAndSunday(baseDate);
      weekStart = bounds.monday;
      weekEnd = bounds.sunday;
    }

    // Generate all 7 days from Monday to Sunday
    const weekDays = [];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const cur = new Date(weekStart + 'T00:00:00');

    for (let i = 0; i < 7; i++) {
      const dStr = this.formatDate(cur);
      weekDays.push({
        dayName: dayNames[i],
        date: dStr,
      });
      cur.setDate(cur.getDate() + 1);
    }

    let employees = [];
    let allAttendance = [];

    if (db.getDialect() === 'mysql') {
      let empWhere = ['e.IsActive = 1'];
      let empParams = [];

      if (employeeId && employeeId !== 'ALL') {
        empWhere.push('e.EmployeeID = ?');
        empParams.push(parseInt(employeeId, 10));
      }

      if (department && department !== 'ALL') {
        empWhere.push('e.Department = ?');
        empParams.push(department);
      }

      const empSql = `SELECT * FROM EmployeeMaster e WHERE ${empWhere.join(' AND ')} ORDER BY e.Department, e.EmployeeName`;
      const [empRows] = await db.query(empSql, empParams);
      employees = empRows;

      const attSql = `
        SELECT a.*, e.EmployeeCode, e.EmployeeName, e.Department
        FROM Attendance a
        JOIN EmployeeMaster e ON a.EmployeeID = e.EmployeeID
        WHERE a.AttendanceDate BETWEEN ? AND ?
      `;
      const [attRows] = await db.query(attSql, [weekStart, weekEnd]);
      allAttendance = attRows;
    } else {
      const store = db.getMemoryStore();
      employees = store.employees.filter((e) => e.IsActive === 1);

      if (employeeId && employeeId !== 'ALL') {
        employees = employees.filter((e) => e.EmployeeID === parseInt(employeeId, 10));
      }

      if (department && department !== 'ALL') {
        employees = employees.filter((e) => e.Department.toLowerCase() === department.toLowerCase());
      }

      allAttendance = store.attendance.filter((a) => a.AttendanceDate >= weekStart && a.AttendanceDate <= weekEnd);
    }

    // Map attendance by `${EmployeeID}_${AttendanceDate}`
    const attMap = new Map();
    for (const a of allAttendance) {
      attMap.set(`${a.EmployeeID}_${this.formatDate(a.AttendanceDate)}`, a);
    }

    // Process weekly grid for each employee
    const rows = employees.map((emp) => {
      let presentCount = 0;
      let absentCount = 0;
      let halfDayCount = 0;
      let leaveCount = 0;
      let holidayCount = 0;
      let weeklyOffCount = 0;

      const days = {};

      weekDays.forEach((wd) => {
        const att = attMap.get(`${emp.EmployeeID}_${wd.date}`);
        const status = att ? att.AttendanceStatus : '-';
        days[wd.dayName] = {
          date: wd.date,
          status,
          inTime: att ? att.InTime : null,
          outTime: att ? att.OutTime : null,
        };

        if (status === 'Present') presentCount++;
        else if (status === 'Absent') absentCount++;
        else if (status === 'Half Day') halfDayCount++;
        else if (status === 'Leave') leaveCount++;
        else if (status === 'Holiday') holidayCount++;
        else if (status === 'Weekly Off') weeklyOffCount++;
      });

      return {
        EmployeeID: emp.EmployeeID,
        EmployeeCode: emp.EmployeeCode,
        EmployeeName: emp.EmployeeName,
        Department: emp.Department,
        Designation: emp.Designation,
        Monday: days['Monday'].status,
        Tuesday: days['Tuesday'].status,
        Wednesday: days['Wednesday'].status,
        Thursday: days['Thursday'].status,
        Friday: days['Friday'].status,
        Saturday: days['Saturday'].status,
        Sunday: days['Sunday'].status,
        days,
        PresentTotal: presentCount,
        AbsentTotal: absentCount,
        HalfDayTotal: halfDayCount,
        LeaveTotal: leaveCount,
        HolidayTotal: holidayCount,
        WeeklyOffTotal: weeklyOffCount,
      };
    });

    // Summary totals across all employees
    const summary = {
      totalEmployees: rows.length,
      presentTotal: rows.reduce((s, r) => s + r.PresentTotal, 0),
      absentTotal: rows.reduce((s, r) => s + r.AbsentTotal, 0),
      halfDayTotal: rows.reduce((s, r) => s + r.HalfDayTotal, 0),
      leaveTotal: rows.reduce((s, r) => s + r.LeaveTotal, 0),
      holidayTotal: rows.reduce((s, r) => s + r.HolidayTotal, 0),
      weeklyOffTotal: rows.reduce((s, r) => s + r.WeeklyOffTotal, 0),
    };

    return {
      reportType: 'Weekly',
      weekStart,
      weekEnd,
      weekDays,
      filters: { weekStart, weekEnd, employeeId, department },
      summary,
      data: rows,
    };
  }

  /**
   * Monthly Report
   */
  async getMonthlyReport({ year, month, employeeId, department }) {
    const now = new Date();
    const targetYear = parseInt(year || now.getFullYear(), 10);
    const targetMonth = parseInt(month || now.getMonth() + 1, 10); // 1-12

    // Calculate start and end date for month, handling leap years correctly
    const monthStart = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
    // Last day of month
    const lastDayNum = new Date(targetYear, targetMonth, 0).getDate();
    const monthEnd = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(lastDayNum).padStart(2, '0')}`;

    let employees = [];
    let allAttendance = [];

    if (db.getDialect() === 'mysql') {
      let empWhere = ['e.IsActive = 1'];
      let empParams = [];

      if (employeeId && employeeId !== 'ALL') {
        empWhere.push('e.EmployeeID = ?');
        empParams.push(parseInt(employeeId, 10));
      }

      if (department && department !== 'ALL') {
        empWhere.push('e.Department = ?');
        empParams.push(department);
      }

      const empSql = `SELECT * FROM EmployeeMaster e WHERE ${empWhere.join(' AND ')} ORDER BY e.Department, e.EmployeeName`;
      const [empRows] = await db.query(empSql, empParams);
      employees = empRows;

      const attSql = `
        SELECT a.*, e.EmployeeCode, e.EmployeeName, e.Department
        FROM Attendance a
        JOIN EmployeeMaster e ON a.EmployeeID = e.EmployeeID
        WHERE a.AttendanceDate BETWEEN ? AND ?
      `;
      const [attRows] = await db.query(attSql, [monthStart, monthEnd]);
      allAttendance = attRows;
    } else {
      const store = db.getMemoryStore();
      employees = store.employees.filter((e) => e.IsActive === 1);

      if (employeeId && employeeId !== 'ALL') {
        employees = employees.filter((e) => e.EmployeeID === parseInt(employeeId, 10));
      }

      if (department && department !== 'ALL') {
        employees = employees.filter((e) => e.Department.toLowerCase() === department.toLowerCase());
      }

      allAttendance = store.attendance.filter((a) => a.AttendanceDate >= monthStart && a.AttendanceDate <= monthEnd);
    }

    // Group attendance by EmployeeID
    const empAttMap = new Map();
    for (const a of allAttendance) {
      if (!empAttMap.has(a.EmployeeID)) {
        empAttMap.set(a.EmployeeID, []);
      }
      empAttMap.get(a.EmployeeID).push(a);
    }

    const rows = employees.map((emp) => {
      const attList = empAttMap.get(emp.EmployeeID) || [];
      const present = attList.filter((a) => a.AttendanceStatus === 'Present').length;
      const absent = attList.filter((a) => a.AttendanceStatus === 'Absent').length;
      const halfDay = attList.filter((a) => a.AttendanceStatus === 'Half Day').length;
      const leave = attList.filter((a) => a.AttendanceStatus === 'Leave').length;
      const holiday = attList.filter((a) => a.AttendanceStatus === 'Holiday').length;
      const weeklyOff = attList.filter((a) => a.AttendanceStatus === 'Weekly Off').length;
      const recordedTotal = attList.length;

      return {
        EmployeeID: emp.EmployeeID,
        EmployeeCode: emp.EmployeeCode,
        EmployeeName: emp.EmployeeName,
        Department: emp.Department,
        Designation: emp.Designation,
        Present: present,
        Absent: absent,
        HalfDay: halfDay,
        Leave: leave,
        Holiday: holiday,
        WeeklyOff: weeklyOff,
        TotalMarked: recordedTotal,
      };
    });

    const summary = {
      totalEmployees: rows.length,
      daysInMonth: lastDayNum,
      presentTotal: rows.reduce((s, r) => s + r.Present, 0),
      absentTotal: rows.reduce((s, r) => s + r.Absent, 0),
      halfDayTotal: rows.reduce((s, r) => s + r.HalfDay, 0),
      leaveTotal: rows.reduce((s, r) => s + r.Leave, 0),
      holidayTotal: rows.reduce((s, r) => s + r.Holiday, 0),
      weeklyOffTotal: rows.reduce((s, r) => s + r.WeeklyOff, 0),
    };

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return {
      reportType: 'Monthly',
      year: targetYear,
      month: targetMonth,
      monthName: monthNames[targetMonth - 1],
      monthStart,
      monthEnd,
      daysInMonth: lastDayNum,
      filters: { year: targetYear, month: targetMonth, employeeId, department },
      summary,
      data: rows,
    };
  }
}

module.exports = new ReportService();
