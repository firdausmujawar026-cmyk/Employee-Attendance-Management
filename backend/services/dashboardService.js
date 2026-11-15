const db = require('../config/db');

class DashboardService {
  formatDate(d) {
    if (typeof d === 'string') return d.split('T')[0];
    return d.toISOString().split('T')[0];
  }

  /**
   * Overall dashboard statistics for today
   */
  async getStats() {
    const today = this.formatDate(new Date());

    if (db.getDialect() === 'mysql') {
      const [empStats] = await db.query(`
        SELECT 
          COUNT(*) as totalEmployees,
          SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END) as activeEmployees,
          SUM(CASE WHEN IsActive = 0 THEN 1 ELSE 0 END) as inactiveEmployees
        FROM EmployeeMaster
      `);

      const [attStats] = await db.query(
        `
        SELECT 
          SUM(CASE WHEN AttendanceStatus = 'Present' THEN 1 ELSE 0 END) as presentToday,
          SUM(CASE WHEN AttendanceStatus = 'Absent' THEN 1 ELSE 0 END) as absentToday,
          SUM(CASE WHEN AttendanceStatus = 'Leave' THEN 1 ELSE 0 END) as onLeave,
          SUM(CASE WHEN AttendanceStatus = 'Half Day' THEN 1 ELSE 0 END) as halfDay,
          SUM(CASE WHEN AttendanceStatus = 'Holiday' THEN 1 ELSE 0 END) as holiday,
          SUM(CASE WHEN AttendanceStatus = 'Weekly Off' THEN 1 ELSE 0 END) as weeklyOff
        FROM Attendance
        WHERE AttendanceDate = ?
      `,
        [today]
      );

      const totalEmployees = empStats[0]?.totalEmployees || 0;
      const activeEmployees = empStats[0]?.activeEmployees || 0;
      const inactiveEmployees = empStats[0]?.inactiveEmployees || 0;

      const presentToday = attStats[0]?.presentToday || 0;
      const absentToday = attStats[0]?.absentToday || 0;
      const onLeave = attStats[0]?.onLeave || 0;
      const halfDay = attStats[0]?.halfDay || 0;
      const holiday = attStats[0]?.holiday || 0;
      const weeklyOff = attStats[0]?.weeklyOff || 0;

      return {
        date: today,
        totalEmployees,
        activeEmployees,
        inactiveEmployees,
        presentToday,
        absentToday,
        onLeave,
        halfDay,
        holiday,
        weeklyOff,
      };
    }

    // Embedded store implementation
    const store = db.getMemoryStore();
    const totalEmployees = store.employees.length;
    const activeEmployees = store.employees.filter((e) => e.IsActive === 1 || e.IsActive === true).length;
    const inactiveEmployees = totalEmployees - activeEmployees;

    const todayAtt = store.attendance.filter((a) => a.AttendanceDate === today);
    const presentToday = todayAtt.filter((a) => a.AttendanceStatus === 'Present').length;
    const absentToday = todayAtt.filter((a) => a.AttendanceStatus === 'Absent').length;
    const onLeave = todayAtt.filter((a) => a.AttendanceStatus === 'Leave').length;
    const halfDay = todayAtt.filter((a) => a.AttendanceStatus === 'Half Day').length;
    const holiday = todayAtt.filter((a) => a.AttendanceStatus === 'Holiday').length;
    const weeklyOff = todayAtt.filter((a) => a.AttendanceStatus === 'Weekly Off').length;

    return {
      date: today,
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      presentToday,
      absentToday,
      onLeave,
      halfDay,
      holiday,
      weeklyOff,
    };
  }

  /**
   * Daily attendance overview chart for past 7 or 14 days
   */
  async getAttendanceOverview(daysCount = 7) {
    const days = [];
    const today = new Date();

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(this.formatDate(d));
    }

    const startDate = days[0];
    const endDate = days[days.length - 1];

    if (db.getDialect() === 'mysql') {
      const sql = `
        SELECT 
          AttendanceDate,
          SUM(CASE WHEN AttendanceStatus = 'Present' THEN 1 ELSE 0 END) as Present,
          SUM(CASE WHEN AttendanceStatus = 'Absent' THEN 1 ELSE 0 END) as Absent,
          SUM(CASE WHEN AttendanceStatus = 'Half Day' THEN 1 ELSE 0 END) as HalfDay,
          SUM(CASE WHEN AttendanceStatus = 'Leave' THEN 1 ELSE 0 END) as OnLeave
        FROM Attendance
        WHERE AttendanceDate BETWEEN ? AND ?
        GROUP BY AttendanceDate
        ORDER BY AttendanceDate ASC
      `;
      const [rows] = await db.query(sql, [startDate, endDate]);
      const map = new Map(rows.map((r) => [this.formatDate(r.AttendanceDate), r]));

      return days.map((dateStr) => {
        const item = map.get(dateStr);
        const dateObj = new Date(dateStr + 'T00:00:00');
        const shortDay = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        const shortDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        return {
          date: dateStr,
          label: `${shortDay} ${shortDate}`,
          Present: item ? parseInt(item.Present, 10) : 0,
          Absent: item ? parseInt(item.Absent, 10) : 0,
          HalfDay: item ? parseInt(item.HalfDay, 10) : 0,
          Leave: item ? parseInt(item.OnLeave, 10) : 0,
        };
      });
    }

    // Embedded store implementation
    const store = db.getMemoryStore();
    return days.map((dateStr) => {
      const records = store.attendance.filter((a) => a.AttendanceDate === dateStr);
      const dateObj = new Date(dateStr + 'T00:00:00');
      const shortDay = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const shortDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      return {
        date: dateStr,
        label: `${shortDay} ${shortDate}`,
        Present: records.filter((a) => a.AttendanceStatus === 'Present').length,
        Absent: records.filter((a) => a.AttendanceStatus === 'Absent').length,
        HalfDay: records.filter((a) => a.AttendanceStatus === 'Half Day').length,
        Leave: records.filter((a) => a.AttendanceStatus === 'Leave').length,
      };
    });
  }

  /**
   * Employees distribution by Department
   */
  async getDepartmentDistribution() {
    if (db.getDialect() === 'mysql') {
      const sql = `
        SELECT 
          Department,
          COUNT(*) as count,
          SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END) as activeCount
        FROM EmployeeMaster
        GROUP BY Department
        ORDER BY count DESC
      `;
      const [rows] = await db.query(sql);
      return rows;
    }

    const store = db.getMemoryStore();
    const map = new Map();

    store.employees.forEach((e) => {
      const dept = e.Department || 'Unassigned';
      if (!map.has(dept)) {
        map.set(dept, { Department: dept, count: 0, activeCount: 0 });
      }
      const entry = map.get(dept);
      entry.count++;
      if (e.IsActive) entry.activeCount++;
    });

    const result = Array.from(map.values());
    result.sort((a, b) => b.count - a.count);
    return result;
  }

  /**
   * Recent attendance activity table (last 10 records)
   */
  async getRecentAttendance(limit = 10) {
    if (db.getDialect() === 'mysql') {
      const sql = `
        SELECT 
          a.AttendanceID,
          a.AttendanceDate,
          a.AttendanceStatus,
          a.InTime,
          a.OutTime,
          a.Remarks,
          e.EmployeeCode,
          e.EmployeeName,
          e.Department
        FROM Attendance a
        JOIN EmployeeMaster e ON a.EmployeeID = e.EmployeeID
        ORDER BY a.AttendanceDate DESC, a.AttendanceID DESC
        LIMIT ?
      `;
      const [rows] = await db.query(sql, [limit]);
      return rows;
    }

    const store = db.getMemoryStore();
    const empMap = new Map(store.employees.map((e) => [e.EmployeeID, e]));

    const sortedAtt = [...store.attendance].sort((a, b) => {
      if (b.AttendanceDate === a.AttendanceDate) {
        return b.AttendanceID - a.AttendanceID;
      }
      return b.AttendanceDate.localeCompare(a.AttendanceDate);
    });

    const recent = sortedAtt.slice(0, limit).map((a) => {
      const emp = empMap.get(a.EmployeeID) || {};
      return {
        AttendanceID: a.AttendanceID,
        AttendanceDate: a.AttendanceDate,
        AttendanceStatus: a.AttendanceStatus,
        InTime: a.InTime,
        OutTime: a.OutTime,
        Remarks: a.Remarks,
        EmployeeCode: emp.EmployeeCode || 'N/A',
        EmployeeName: emp.EmployeeName || 'Unknown',
        Department: emp.Department || 'N/A',
      };
    });

    return recent;
  }
}

module.exports = new DashboardService();
