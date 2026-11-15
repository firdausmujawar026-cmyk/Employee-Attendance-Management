const db = require('../config/db');

class EmployeeService {
  /**
   * Get paginated employees with search and filters
   */
  async getEmployees({ page = 1, limit = 10, search = '', department = '', status = '' }) {
    page = Math.max(1, parseInt(page, 10));
    limit = Math.max(1, parseInt(limit, 10));
    const offset = (page - 1) * limit;

    if (db.getDialect() === 'mysql') {
      let whereClauses = [];
      let params = [];

      if (search && search.trim() !== '') {
        const term = `%${search.trim()}%`;
        whereClauses.push('(EmployeeCode LIKE ? OR EmployeeName LIKE ? OR EmailID LIKE ?)');
        params.push(term, term, term);
      }

      if (department && department.trim() !== '' && department !== 'ALL') {
        whereClauses.push('Department = ?');
        params.push(department.trim());
      }

      if (status !== '' && status !== 'ALL') {
        whereClauses.push('IsActive = ?');
        params.push(status === 'active' || status === '1' ? 1 : 0);
      }

      const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      const countSql = `SELECT COUNT(*) as total FROM EmployeeMaster ${whereSql}`;
      const [countRows] = await db.query(countSql, params);
      const total = countRows[0].total;

      const dataSql = `
        SELECT EmployeeID, EmployeeCode, EmployeeName, Department, Designation, 
               MobileNo, EmailID, DateOfJoining, IsActive, CreatedDate, ModifiedDate
        FROM EmployeeMaster
        ${whereSql}
        ORDER BY EmployeeID DESC
        LIMIT ? OFFSET ?
      `;
      const [rows] = await db.query(dataSql, [...params, limit, offset]);

      return {
        data: rows,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
    }

    // Embedded Store handling
    const store = db.getMemoryStore();
    let filtered = [...store.employees];

    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (e) =>
          (e.EmployeeCode && e.EmployeeCode.toLowerCase().includes(q)) ||
          (e.EmployeeName && e.EmployeeName.toLowerCase().includes(q)) ||
          (e.EmailID && e.EmailID.toLowerCase().includes(q))
      );
    }

    if (department && department.trim() !== '' && department !== 'ALL') {
      filtered = filtered.filter((e) => e.Department.toLowerCase() === department.trim().toLowerCase());
    }

    if (status !== '' && status !== 'ALL') {
      const activeVal = status === 'active' || status === '1' ? 1 : 0;
      filtered = filtered.filter((e) => (e.IsActive ? 1 : 0) === activeVal);
    }

    // Sort by ID DESC
    filtered.sort((a, b) => b.EmployeeID - a.EmployeeID);

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      data: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get all active employees (for dropdowns / attendance)
   */
  async getActiveEmployees(department = '') {
    if (db.getDialect() === 'mysql') {
      let sql = 'SELECT * FROM EmployeeMaster WHERE IsActive = 1';
      let params = [];
      if (department && department !== 'ALL') {
        sql += ' AND Department = ?';
        params.push(department);
      }
      sql += ' ORDER BY EmployeeName ASC';
      const [rows] = await db.query(sql, params);
      return rows;
    }

    const store = db.getMemoryStore();
    let emps = store.employees.filter((e) => e.IsActive === 1 || e.IsActive === true);
    if (department && department !== 'ALL') {
      emps = emps.filter((e) => e.Department.toLowerCase() === department.toLowerCase());
    }
    emps.sort((a, b) => a.EmployeeName.localeCompare(b.EmployeeName));
    return emps;
  }

  /**
   * Get distinct departments
   */
  async getDepartments() {
    if (db.getDialect() === 'mysql') {
      const [rows] = await db.query('SELECT DISTINCT Department FROM EmployeeMaster ORDER BY Department ASC');
      return rows.map((r) => r.Department).filter(Boolean);
    }

    const store = db.getMemoryStore();
    const depts = [...new Set(store.employees.map((e) => e.Department).filter(Boolean))];
    depts.sort();
    return depts;
  }

  /**
   * Get single employee by ID
   */
  async getEmployeeById(id) {
    if (db.getDialect() === 'mysql') {
      const [rows] = await db.query('SELECT * FROM EmployeeMaster WHERE EmployeeID = ?', [id]);
      return rows[0] || null;
    }

    const store = db.getMemoryStore();
    return store.employees.find((e) => e.EmployeeID === parseInt(id, 10)) || null;
  }

  /**
   * Get single employee by Code
   */
  async getEmployeeByCode(code) {
    if (db.getDialect() === 'mysql') {
      const [rows] = await db.query('SELECT * FROM EmployeeMaster WHERE EmployeeCode = ?', [code]);
      return rows[0] || null;
    }

    const store = db.getMemoryStore();
    return store.employees.find((e) => e.EmployeeCode.toUpperCase() === String(code).trim().toUpperCase()) || null;
  }

  /**
   * Create employee
   */
  async createEmployee(data) {
    const { EmployeeCode, EmployeeName, Department, Designation, MobileNo, EmailID, DateOfJoining, IsActive = 1 } = data;

    // Check duplicate code
    const existing = await this.getEmployeeByCode(EmployeeCode);
    if (existing) {
      throw new Error(`Employee Code "${EmployeeCode}" is already in use by another employee.`);
    }

    // Validate DateOfJoining cannot be in future
    const doj = new Date(DateOfJoining);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (doj > today) {
      throw new Error('Date of Joining cannot be in the future.');
    }

    if (db.getDialect() === 'mysql') {
      const sql = `
        INSERT INTO EmployeeMaster 
        (EmployeeCode, EmployeeName, Department, Designation, MobileNo, EmailID, DateOfJoining, IsActive, CreatedDate)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;
      const [result] = await db.execute(sql, [
        EmployeeCode.trim().toUpperCase(),
        EmployeeName.trim(),
        Department.trim(),
        Designation ? Designation.trim() : null,
        MobileNo ? MobileNo.trim() : null,
        EmailID ? EmailID.trim() : null,
        DateOfJoining,
        IsActive ? 1 : 0,
      ]);

      return await this.getEmployeeById(result.insertId);
    }

    // Embedded store
    const store = db.getMemoryStore();
    const now = new Date().toISOString();
    const newEmp = {
      EmployeeID: store.nextEmployeeId++,
      EmployeeCode: EmployeeCode.trim().toUpperCase(),
      EmployeeName: EmployeeName.trim(),
      Department: Department.trim(),
      Designation: Designation ? Designation.trim() : null,
      MobileNo: MobileNo ? MobileNo.trim() : null,
      EmailID: EmailID ? EmailID.trim() : null,
      DateOfJoining,
      IsActive: IsActive ? 1 : 0,
      CreatedDate: now,
      ModifiedDate: now,
    };
    store.employees.push(newEmp);
    db.savePersistedStore();
    return newEmp;
  }

  /**
   * Update employee
   */
  async updateEmployee(id, data) {
    const employee = await this.getEmployeeById(id);
    if (!employee) {
      throw new Error('Employee not found.');
    }

    const { EmployeeName, Department, Designation, MobileNo, EmailID, DateOfJoining, IsActive } = data;

    // Validate DateOfJoining
    if (DateOfJoining) {
      const doj = new Date(DateOfJoining);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (doj > today) {
        throw new Error('Date of Joining cannot be in the future.');
      }
    }

    if (db.getDialect() === 'mysql') {
      const sql = `
        UPDATE EmployeeMaster
        SET EmployeeName = ?, Department = ?, Designation = ?, MobileNo = ?, EmailID = ?, 
            DateOfJoining = ?, IsActive = ?, ModifiedDate = NOW()
        WHERE EmployeeID = ?
      `;
      await db.execute(sql, [
        EmployeeName !== undefined ? EmployeeName.trim() : employee.EmployeeName,
        Department !== undefined ? Department.trim() : employee.Department,
        Designation !== undefined ? (Designation ? Designation.trim() : null) : employee.Designation,
        MobileNo !== undefined ? (MobileNo ? MobileNo.trim() : null) : employee.MobileNo,
        EmailID !== undefined ? (EmailID ? EmailID.trim() : null) : employee.EmailID,
        DateOfJoining !== undefined ? DateOfJoining : employee.DateOfJoining,
        IsActive !== undefined ? (IsActive ? 1 : 0) : employee.IsActive,
        id,
      ]);

      return await this.getEmployeeById(id);
    }

    // Embedded store
    const store = db.getMemoryStore();
    const emp = store.employees.find((e) => e.EmployeeID === parseInt(id, 10));
    if (emp) {
      if (EmployeeName !== undefined) emp.EmployeeName = EmployeeName.trim();
      if (Department !== undefined) emp.Department = Department.trim();
      if (Designation !== undefined) emp.Designation = Designation ? Designation.trim() : null;
      if (MobileNo !== undefined) emp.MobileNo = MobileNo ? MobileNo.trim() : null;
      if (EmailID !== undefined) emp.EmailID = EmailID ? EmailID.trim() : null;
      if (DateOfJoining !== undefined) emp.DateOfJoining = DateOfJoining;
      if (IsActive !== undefined) emp.IsActive = IsActive ? 1 : 0;
      emp.ModifiedDate = new Date().toISOString();
      db.savePersistedStore();
      return emp;
    }
    throw new Error('Employee not found.');
  }

  /**
   * Toggle employee active status
   */
  async setEmployeeStatus(id, isActive) {
    const employee = await this.getEmployeeById(id);
    if (!employee) {
      throw new Error('Employee not found.');
    }

    const activeVal = isActive ? 1 : 0;

    if (db.getDialect() === 'mysql') {
      await db.execute('UPDATE EmployeeMaster SET IsActive = ?, ModifiedDate = NOW() WHERE EmployeeID = ?', [activeVal, id]);
      return await this.getEmployeeById(id);
    }

    const store = db.getMemoryStore();
    const emp = store.employees.find((e) => e.EmployeeID === parseInt(id, 10));
    if (emp) {
      emp.IsActive = activeVal;
      emp.ModifiedDate = new Date().toISOString();
      db.savePersistedStore();
      return emp;
    }
    throw new Error('Employee not found.');
  }

  /**
   * Delete employee (Safety check: prevent if attendance history exists)
   */
  async deleteEmployee(id) {
    const employee = await this.getEmployeeById(id);
    if (!employee) {
      throw new Error('Employee not found.');
    }

    // Check attendance records
    let attendanceCount = 0;
    if (db.getDialect() === 'mysql') {
      const [rows] = await db.query('SELECT COUNT(*) AS count FROM Attendance WHERE EmployeeID = ?', [id]);
      attendanceCount = rows[0].count;
    } else {
      const store = db.getMemoryStore();
      attendanceCount = store.attendance.filter((a) => a.EmployeeID === parseInt(id, 10)).length;
    }

    if (attendanceCount > 0) {
      throw new Error(
        `Cannot delete employee "${employee.EmployeeName}" because they have ${attendanceCount} recorded attendance history. Use Deactivate instead to preserve audit logs.`
      );
    }

    if (db.getDialect() === 'mysql') {
      await db.execute('DELETE FROM EmployeeMaster WHERE EmployeeID = ?', [id]);
      return { success: true, message: 'Employee deleted successfully.' };
    }

    const store = db.getMemoryStore();
    store.employees = store.employees.filter((e) => e.EmployeeID !== parseInt(id, 10));
    db.savePersistedStore();
    return { success: true, message: 'Employee deleted successfully.' };
  }
}

module.exports = new EmployeeService();
