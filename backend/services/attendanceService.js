const db = require('../config/db');
const employeeService = require('./employeeService');

class AttendanceService {
  /**
   * Helper to format Date to YYYY-MM-DD
   */
  formatDate(d) {
    if (typeof d === 'string') return d.split('T')[0];
    return d.toISOString().split('T')[0];
  }

  /**
   * Helper to validate HH:MM:SS or HH:MM format
   */
  isValidTime(timeStr) {
    if (!timeStr) return false;
    return /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/.test(timeStr);
  }

  /**
   * Compare two times HH:MM or HH:MM:SS
   * Returns true if outTime > inTime
   */
  isTimeAfter(inTime, outTime) {
    if (!inTime || !outTime) return false;
    const normalize = (t) => {
      const parts = t.split(':').map((p) => parseInt(p, 10));
      return parts[0] * 3600 + parts[1] * 60 + (parts[2] || 0);
    };
    return normalize(outTime) > normalize(inTime);
  }

  /**
   * Get attendance for a specific date with filters
   * Returns all active employees + any attendance record for this date
   */
  async getDailyAttendance(dateStr, department = '', search = '') {
    const today = this.formatDate(new Date());
    const targetDate = dateStr ? this.formatDate(dateStr) : today;

    // Reject future dates
    if (targetDate > today) {
      throw new Error(`Cannot query attendance for future date (${targetDate}). Today is ${today}.`);
    }

    if (db.getDialect() === 'mysql') {
      let deptClause = '';
      let searchClause = '';
      let params = [targetDate];

      if (department && department !== 'ALL') {
        deptClause = 'AND e.Department = ?';
        params.push(department);
      }

      if (search && search.trim() !== '') {
        const term = `%${search.trim()}%`;
        searchClause = 'AND (e.EmployeeCode LIKE ? OR e.EmployeeName LIKE ?)';
        params.push(term, term);
      }

      // Query active employees (or inactive employees who already have attendance on this date)
      const sql = `
        SELECT 
          e.EmployeeID,
          e.EmployeeCode,
          e.EmployeeName,
          e.Department,
          e.Designation,
          e.DateOfJoining,
          e.IsActive,
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
        WHERE (e.IsActive = 1 OR a.AttendanceID IS NOT NULL)
          ${deptClause}
          ${searchClause}
        ORDER BY e.Department ASC, e.EmployeeName ASC
      `;

      const [rows] = await db.query(sql, params);

      // Compute statistics
      const totalEmployees = rows.length;
      const markedRows = rows.filter((r) => r.AttendanceStatus != null);
      const markedAttendance = markedRows.length;
      const pendingAttendance = totalEmployees - markedAttendance;

      return {
        date: targetDate,
        summary: {
          totalEmployees,
          markedAttendance,
          pendingAttendance,
          present: markedRows.filter((r) => r.AttendanceStatus === 'Present').length,
          absent: markedRows.filter((r) => r.AttendanceStatus === 'Absent').length,
          halfDay: markedRows.filter((r) => r.AttendanceStatus === 'Half Day').length,
          leave: markedRows.filter((r) => r.AttendanceStatus === 'Leave').length,
          holiday: markedRows.filter((r) => r.AttendanceStatus === 'Holiday').length,
          weeklyOff: markedRows.filter((r) => r.AttendanceStatus === 'Weekly Off').length,
        },
        records: rows,
      };
    }

    // Embedded store implementation
    const store = db.getMemoryStore();
    const existingAttendance = store.attendance.filter((a) => a.AttendanceDate === targetDate);
    const existingMap = new Map(existingAttendance.map((a) => [a.EmployeeID, a]));

    let eligibleEmployees = store.employees.filter((e) => e.IsActive === 1 || existingMap.has(e.EmployeeID));

    if (department && department !== 'ALL') {
      eligibleEmployees = eligibleEmployees.filter((e) => e.Department.toLowerCase() === department.toLowerCase());
    }

    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      eligibleEmployees = eligibleEmployees.filter(
        (e) => (e.EmployeeCode && e.EmployeeCode.toLowerCase().includes(q)) || (e.EmployeeName && e.EmployeeName.toLowerCase().includes(q))
      );
    }

    // Sort by Department, Name
    eligibleEmployees.sort((a, b) => a.Department.localeCompare(b.Department) || a.EmployeeName.localeCompare(b.EmployeeName));

    const records = eligibleEmployees.map((e) => {
      const att = existingMap.get(e.EmployeeID);
      return {
        EmployeeID: e.EmployeeID,
        EmployeeCode: e.EmployeeCode,
        EmployeeName: e.EmployeeName,
        Department: e.Department,
        Designation: e.Designation,
        DateOfJoining: e.DateOfJoining,
        IsActive: e.IsActive,
        AttendanceID: att ? att.AttendanceID : null,
        AttendanceDate: att ? att.AttendanceDate : null,
        AttendanceStatus: att ? att.AttendanceStatus : null,
        InTime: att ? att.InTime : null,
        OutTime: att ? att.OutTime : null,
        Remarks: att ? att.Remarks : null,
      };
    });

    const totalEmployees = records.length;
    const markedRows = records.filter((r) => r.AttendanceStatus != null);
    const markedAttendance = markedRows.length;
    const pendingAttendance = totalEmployees - markedAttendance;

    return {
      date: targetDate,
      summary: {
        totalEmployees,
        markedAttendance,
        pendingAttendance,
        present: markedRows.filter((r) => r.AttendanceStatus === 'Present').length,
        absent: markedRows.filter((r) => r.AttendanceStatus === 'Absent').length,
        halfDay: markedRows.filter((r) => r.AttendanceStatus === 'Half Day').length,
        leave: markedRows.filter((r) => r.AttendanceStatus === 'Leave').length,
        holiday: markedRows.filter((r) => r.AttendanceStatus === 'Holiday').length,
        weeklyOff: markedRows.filter((r) => r.AttendanceStatus === 'Weekly Off').length,
      },
      records,
    };
  }

  /**
   * Validate a single attendance entry against all business rules
   */
  async validateAttendanceEntry(entry, attendanceDate) {
    const validStatuses = ['Present', 'Absent', 'Half Day', 'Leave', 'Holiday', 'Weekly Off'];

    if (!entry.EmployeeID) {
      throw new Error('EmployeeID is required for attendance.');
    }

    const employee = await employeeService.getEmployeeById(entry.EmployeeID);
    if (!employee) {
      throw new Error(`Employee with ID ${entry.EmployeeID} does not exist.`);
    }

    const empLabel = `${employee.EmployeeName} (${employee.EmployeeCode})`;

    // Check future date
    const today = this.formatDate(new Date());
    if (attendanceDate > today) {
      throw new Error(`Cannot record attendance for future date ${attendanceDate} for ${empLabel}.`);
    }

    // Check attendance before DateOfJoining
    const doj = this.formatDate(employee.DateOfJoining);
    if (attendanceDate < doj) {
      throw new Error(`Attendance date (${attendanceDate}) cannot be earlier than joining date (${doj}) for ${empLabel}.`);
    }

    // Inactive employee check
    if (!employee.IsActive) {
      // Check if updating an existing record for that date
      let existingRecord = null;
      if (entry.AttendanceID) {
        if (db.getDialect() === 'mysql') {
          const [r] = await db.query('SELECT * FROM Attendance WHERE AttendanceID = ?', [entry.AttendanceID]);
          existingRecord = r[0];
        } else {
          existingRecord = db.getMemoryStore().attendance.find((a) => a.AttendanceID === parseInt(entry.AttendanceID, 10));
        }
      }
      if (!existingRecord) {
        throw new Error(`Cannot record new attendance for inactive employee ${empLabel}.`);
      }
    }

    // Status validation
    if (!entry.AttendanceStatus) {
      throw new Error(`Attendance status must be selected for ${empLabel}. Blank attendance is not allowed.`);
    }

    if (!validStatuses.includes(entry.AttendanceStatus)) {
      throw new Error(`Invalid attendance status "${entry.AttendanceStatus}" for ${empLabel}.`);
    }

    const { AttendanceStatus, InTime, OutTime } = entry;

    // Rule 1 & 2: Present and Half Day require InTime and OutTime
    if (AttendanceStatus === 'Present' || AttendanceStatus === 'Half Day') {
      if (!InTime || String(InTime).trim() === '') {
        throw new Error(`In Time is required when status is "${AttendanceStatus}" for ${empLabel}.`);
      }
      if (!OutTime || String(OutTime).trim() === '') {
        throw new Error(`Out Time is required when status is "${AttendanceStatus}" for ${empLabel}.`);
      }

      // Rule 8: Out Time must be later than In Time (no overnight shifts)
      if (!this.isTimeAfter(InTime, OutTime)) {
        throw new Error(`Out Time (${OutTime}) must be later than In Time (${InTime}) for ${empLabel}. Overnight shifts are not supported.`);
      }
    }

    // Return sanitized entry
    return {
      EmployeeID: employee.EmployeeID,
      AttendanceDate: attendanceDate,
      AttendanceStatus,
      InTime: InTime && (AttendanceStatus === 'Present' || AttendanceStatus === 'Half Day') ? InTime : null,
      OutTime: OutTime && (AttendanceStatus === 'Present' || AttendanceStatus === 'Half Day') ? OutTime : null,
      Remarks: entry.Remarks ? String(entry.Remarks).trim() : null,
      AttendanceID: entry.AttendanceID ? parseInt(entry.AttendanceID, 10) : null,
    };
  }

  /**
   * Save or update bulk attendance records within a transaction
   */
  async saveBulkAttendance({ date, records }) {
    if (!date) {
      throw new Error('Attendance date is required.');
    }

    const targetDate = this.formatDate(date);
    const today = this.formatDate(new Date());

    if (targetDate > today) {
      throw new Error(`Cannot save attendance for future date ${targetDate}.`);
    }

    if (!Array.isArray(records) || records.length === 0) {
      throw new Error('No attendance records provided for saving.');
    }

    // Step 1: Pre-validate all records. If any record fails validation, abort before starting transaction
    const validatedRecords = [];
    const seenEmployees = new Set();

    for (const record of records) {
      // Skip empty/unselected records if user hasn't chosen a status
      if (!record.AttendanceStatus) {
        continue;
      }

      if (seenEmployees.has(record.EmployeeID)) {
        throw new Error(`Duplicate entry for Employee ID ${record.EmployeeID} detected in the submission batch.`);
      }
      seenEmployees.add(record.EmployeeID);

      const validated = await this.validateAttendanceEntry(record, targetDate);
      validatedRecords.push(validated);
    }

    if (validatedRecords.length === 0) {
      throw new Error('No marked attendance records to save.');
    }

    // Step 2: Database transaction execution
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      const savedResults = [];

      for (const item of validatedRecords) {
        // Check if record already exists for this employee and date
        let existingId = item.AttendanceID;

        if (!existingId) {
          const [checkExisting] = await conn.query('SELECT AttendanceID FROM Attendance WHERE EmployeeID = ? AND AttendanceDate = ?', [
            item.EmployeeID,
            targetDate,
          ]);
          if (checkExisting && checkExisting.length > 0) {
            existingId = checkExisting[0].AttendanceID;
          }
        }

        if (existingId) {
          // Update existing
          const updateSql = `
            UPDATE Attendance 
            SET AttendanceStatus = ?, InTime = ?, OutTime = ?, Remarks = ?, ModifiedDate = NOW()
            WHERE AttendanceID = ?
          `;
          await conn.execute(updateSql, [item.AttendanceStatus, item.InTime, item.OutTime, item.Remarks, existingId]);
          savedResults.push({ AttendanceID: existingId, action: 'updated', EmployeeID: item.EmployeeID });
        } else {
          // Insert new
          const insertSql = `
            INSERT INTO Attendance 
            (EmployeeID, AttendanceDate, AttendanceStatus, InTime, OutTime, Remarks, CreatedDate)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
          `;
          const [result] = await conn.execute(insertSql, [
            item.EmployeeID,
            targetDate,
            item.AttendanceStatus,
            item.InTime,
            item.OutTime,
            item.Remarks,
          ]);
          savedResults.push({ AttendanceID: result.insertId, action: 'inserted', EmployeeID: item.EmployeeID });
        }
      }

      await conn.commit();
      return {
        success: true,
        message: `Successfully saved ${savedResults.length} attendance records for ${targetDate}.`,
        date: targetDate,
        savedCount: savedResults.length,
        results: savedResults,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * Update a single attendance record by AttendanceID (Correction)
   */
  async updateAttendance(id, data) {
    let attendance = null;
    if (db.getDialect() === 'mysql') {
      const [rows] = await db.query('SELECT * FROM Attendance WHERE AttendanceID = ?', [id]);
      attendance = rows[0];
    } else {
      attendance = db.getMemoryStore().attendance.find((a) => a.AttendanceID === parseInt(id, 10));
    }

    if (!attendance) {
      throw new Error(`Attendance record with ID ${id} not found.`);
    }

    const validated = await this.validateAttendanceEntry(
      {
        ...attendance,
        ...data,
        AttendanceID: id,
        EmployeeID: attendance.EmployeeID,
      },
      this.formatDate(attendance.AttendanceDate)
    );

    if (db.getDialect() === 'mysql') {
      const sql = `
        UPDATE Attendance 
        SET AttendanceStatus = ?, InTime = ?, OutTime = ?, Remarks = ?, ModifiedDate = NOW()
        WHERE AttendanceID = ?
      `;
      await db.execute(sql, [validated.AttendanceStatus, validated.InTime, validated.OutTime, validated.Remarks, id]);

      const [updated] = await db.query('SELECT * FROM Attendance WHERE AttendanceID = ?', [id]);
      return updated[0];
    }

    // Embedded store
    const store = db.getMemoryStore();
    const att = store.attendance.find((a) => a.AttendanceID === parseInt(id, 10));
    if (att) {
      att.AttendanceStatus = validated.AttendanceStatus;
      att.InTime = validated.InTime;
      att.OutTime = validated.OutTime;
      att.Remarks = validated.Remarks;
      att.ModifiedDate = new Date().toISOString();
      db.savePersistedStore();
      return att;
    }
  }
}

module.exports = new AttendanceService();
