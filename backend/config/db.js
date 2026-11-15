const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'employee_attendance';

let mysqlPool = null;
let activeDialect = 'mysql'; // 'mysql' | 'embedded'

// Storage directory for embedded fallback persistence
const storageDir = path.join(__dirname, '..', 'storage');
const storageFile = path.join(storageDir, 'attendance_store.json');

// In-memory data store for fallback
let memoryStore = {
  users: [],
  employees: [],
  attendance: [],
  nextUserId: 1,
  nextEmployeeId: 1,
  nextAttendanceId: 1,
};

// Ensure storage directory exists
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

// Load persisted embedded data if exists
function loadPersistedStore() {
  try {
    if (fs.existsSync(storageFile)) {
      const data = fs.readFileSync(storageFile, 'utf8');
      memoryStore = JSON.parse(data);
      console.log(`[Database] Loaded embedded store from ${storageFile} (${memoryStore.employees.length} employees, ${memoryStore.attendance.length} attendance records)`);
      return;
    }
  } catch (err) {
    console.error('[Database] Error reading fallback storage file, reinitializing:', err.message);
  }
  seedEmbeddedStore();
  savePersistedStore();
}

function savePersistedStore() {
  try {
    fs.writeFileSync(storageFile, JSON.stringify(memoryStore, null, 2), 'utf8');
  } catch (err) {
    console.error('[Database] Failed to write fallback storage file:', err.message);
  }
}

// Seed default data for embedded fallback
function seedEmbeddedStore() {
  const now = new Date().toISOString();
  // Password hash for 'admin123'
  const adminHash = '$2a$10$FrWpcSbJGw8LfrHMEkTRU.2bdrTwvNigIWR/KqlKF9bBOvA89ifF2';

  memoryStore.users = [
    {
      UserID: 1,
      Username: 'admin',
      PasswordHash: adminHash,
      FullName: 'System Administrator',
      Email: 'admin@enterprise.local',
      Role: 'admin',
      CreatedDate: now,
      ModifiedDate: now,
    },
  ];
  memoryStore.nextUserId = 2;

  const sampleEmployees = [
    { EmployeeID: 1, EmployeeCode: 'EMP001', EmployeeName: 'Alexander Wright', Department: 'Engineering', Designation: 'Lead Systems Architect', MobileNo: '+15551234567', EmailID: 'alex.wright@enterprise.com', DateOfJoining: '2022-01-15', IsActive: 1, CreatedDate: now, ModifiedDate: now },
    { EmployeeID: 2, EmployeeCode: 'EMP002', EmployeeName: 'Sophia Chen', Department: 'Engineering', Designation: 'Senior Full Stack Engineer', MobileNo: '+15552345678', EmailID: 'sophia.chen@enterprise.com', DateOfJoining: '2022-03-01', IsActive: 1, CreatedDate: now, ModifiedDate: now },
    { EmployeeID: 3, EmployeeCode: 'EMP003', EmployeeName: 'Marcus Johnson', Department: 'Engineering', Designation: 'DevOps & Cloud Engineer', MobileNo: '+15553456789', EmailID: 'marcus.j@enterprise.com', DateOfJoining: '2022-06-10', IsActive: 1, CreatedDate: now, ModifiedDate: now },
    { EmployeeID: 4, EmployeeCode: 'EMP004', EmployeeName: 'Emily Davis', Department: 'Human Resources', Designation: 'HR Director', MobileNo: '+15554567890', EmailID: 'emily.davis@enterprise.com', DateOfJoining: '2021-08-01', IsActive: 1, CreatedDate: now, ModifiedDate: now },
    { EmployeeID: 5, EmployeeCode: 'EMP005', EmployeeName: 'Liam Patel', Department: 'Human Resources', Designation: 'Talent Acquisition Lead', MobileNo: '+15555678901', EmailID: 'liam.patel@enterprise.com', DateOfJoining: '2023-02-15', IsActive: 1, CreatedDate: now, ModifiedDate: now },
    { EmployeeID: 6, EmployeeCode: 'EMP006', EmployeeName: 'Olivia Taylor', Department: 'Finance', Designation: 'Financial Controller', MobileNo: '+15556789012', EmailID: 'olivia.t@enterprise.com', DateOfJoining: '2021-11-20', IsActive: 1, CreatedDate: now, ModifiedDate: now },
    { EmployeeID: 7, EmployeeCode: 'EMP007', EmployeeName: 'Noah Miller', Department: 'Finance', Designation: 'Senior Accountant', MobileNo: '+15557890123', EmailID: 'noah.miller@enterprise.com', DateOfJoining: '2022-09-05', IsActive: 1, CreatedDate: now, ModifiedDate: now },
    { EmployeeID: 8, EmployeeCode: 'EMP008', EmployeeName: 'Ava Wilson', Department: 'Marketing', Designation: 'VP of Marketing', MobileNo: '+15558901234', EmailID: 'ava.wilson@enterprise.com', DateOfJoining: '2022-05-12', IsActive: 1, CreatedDate: now, ModifiedDate: now },
    { EmployeeID: 9, EmployeeCode: 'EMP009', EmployeeName: 'Lucas Garcia', Department: 'Marketing', Designation: 'Growth & Brand Strategist', MobileNo: '+15559012345', EmailID: 'lucas.g@enterprise.com', DateOfJoining: '2023-04-18', IsActive: 1, CreatedDate: now, ModifiedDate: now },
    { EmployeeID: 10, EmployeeCode: 'EMP010', EmployeeName: 'Isabella Martinez', Department: 'Sales', Designation: 'Enterprise Account Executive', MobileNo: '+15550123456', EmailID: 'isabella.m@enterprise.com', DateOfJoining: '2022-10-01', IsActive: 1, CreatedDate: now, ModifiedDate: now },
    { EmployeeID: 11, EmployeeCode: 'EMP011', EmployeeName: 'Ethan Brown', Department: 'Sales', Designation: 'Business Development Rep', MobileNo: '+15551122334', EmailID: 'ethan.brown@enterprise.com', DateOfJoining: '2023-07-01', IsActive: 1, CreatedDate: now, ModifiedDate: now },
    { EmployeeID: 12, EmployeeCode: 'EMP012', EmployeeName: 'Mia Anderson', Department: 'Operations', Designation: 'Chief Operations Officer', MobileNo: '+15552233445', EmailID: 'mia.a@enterprise.com', DateOfJoining: '2021-05-01', IsActive: 1, CreatedDate: now, ModifiedDate: now },
    { EmployeeID: 13, EmployeeCode: 'EMP013', EmployeeName: 'James Thomas', Department: 'Operations', Designation: 'Logistics Coordinator', MobileNo: '+15553344556', EmailID: 'james.t@enterprise.com', DateOfJoining: '2023-01-10', IsActive: 1, CreatedDate: now, ModifiedDate: now },
    { EmployeeID: 14, EmployeeCode: 'EMP014', EmployeeName: 'Charlotte White', Department: 'Engineering', Designation: 'QA Automation Engineer', MobileNo: '+15554455667', EmailID: 'charlotte.w@enterprise.com', DateOfJoining: '2023-08-20', IsActive: 1, CreatedDate: now, ModifiedDate: now },
    { EmployeeID: 15, EmployeeCode: 'EMP015', EmployeeName: 'Daniel Harris', Department: 'Marketing', Designation: 'Content Specialist', MobileNo: '+15555566778', EmailID: 'daniel.h@enterprise.com', DateOfJoining: '2022-12-01', IsActive: 0, CreatedDate: now, ModifiedDate: now },
  ];

  memoryStore.employees = sampleEmployees;
  memoryStore.nextEmployeeId = 16;

  // Generate sample attendance records for today and recent days
  const today = new Date();
  const formatDate = (d) => d.toISOString().split('T')[0];

  const todayStr = formatDate(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDate(yesterday);

  const sampleAttendance = [
    // Yesterday
    { AttendanceID: 1, EmployeeID: 1, AttendanceDate: yesterdayStr, AttendanceStatus: 'Present', InTime: '09:02:00', OutTime: '18:15:00', Remarks: 'On time, sprint deployment', CreatedDate: now, ModifiedDate: now },
    { AttendanceID: 2, EmployeeID: 2, AttendanceDate: yesterdayStr, AttendanceStatus: 'Present', InTime: '08:55:00', OutTime: '18:05:00', Remarks: 'Regular hours', CreatedDate: now, ModifiedDate: now },
    { AttendanceID: 3, EmployeeID: 3, AttendanceDate: yesterdayStr, AttendanceStatus: 'Half Day', InTime: '09:00:00', OutTime: '13:30:00', Remarks: 'Medical checkup in afternoon', CreatedDate: now, ModifiedDate: now },
    { AttendanceID: 4, EmployeeID: 4, AttendanceDate: yesterdayStr, AttendanceStatus: 'Present', InTime: '09:10:00', OutTime: '18:00:00', Remarks: 'HR policy review', CreatedDate: now, ModifiedDate: now },
    { AttendanceID: 5, EmployeeID: 5, AttendanceDate: yesterdayStr, AttendanceStatus: 'Leave', InTime: null, OutTime: null, Remarks: 'Approved casual leave', CreatedDate: now, ModifiedDate: now },
    { AttendanceID: 6, EmployeeID: 6, AttendanceDate: yesterdayStr, AttendanceStatus: 'Present', InTime: '08:45:00', OutTime: '17:45:00', Remarks: 'Quarterly audit prep', CreatedDate: now, ModifiedDate: now },
    { AttendanceID: 7, EmployeeID: 7, AttendanceDate: yesterdayStr, AttendanceStatus: 'Absent', InTime: null, OutTime: null, Remarks: 'Uninformed absence', CreatedDate: now, ModifiedDate: now },
    { AttendanceID: 8, EmployeeID: 8, AttendanceDate: yesterdayStr, AttendanceStatus: 'Present', InTime: '09:15:00', OutTime: '18:30:00', Remarks: 'Campaign launch review', CreatedDate: now, ModifiedDate: now },
    { AttendanceID: 9, EmployeeID: 9, AttendanceDate: yesterdayStr, AttendanceStatus: 'Present', InTime: '09:00:00', OutTime: '18:00:00', Remarks: 'SEO optimizations', CreatedDate: now, ModifiedDate: now },
    { AttendanceID: 10, EmployeeID: 10, AttendanceDate: yesterdayStr, AttendanceStatus: 'Present', InTime: '08:50:00', OutTime: '18:10:00', Remarks: 'Client demos', CreatedDate: now, ModifiedDate: now },
    { AttendanceID: 11, EmployeeID: 11, AttendanceDate: yesterdayStr, AttendanceStatus: 'Present', InTime: '09:20:00', OutTime: '18:20:00', Remarks: 'Outbound leads calling', CreatedDate: now, ModifiedDate: now },
    { AttendanceID: 12, EmployeeID: 12, AttendanceDate: yesterdayStr, AttendanceStatus: 'Present', InTime: '08:30:00', OutTime: '17:30:00', Remarks: 'Executive operations sync', CreatedDate: now, ModifiedDate: now },
    { AttendanceID: 13, EmployeeID: 13, AttendanceDate: yesterdayStr, AttendanceStatus: 'Weekly Off', InTime: null, OutTime: null, Remarks: 'Scheduled roster off', CreatedDate: now, ModifiedDate: now },
    { AttendanceID: 14, EmployeeID: 14, AttendanceDate: yesterdayStr, AttendanceStatus: 'Present', InTime: '09:05:00', OutTime: '18:00:00', Remarks: 'Automated regression run', CreatedDate: now, ModifiedDate: now },

    // Today
    { AttendanceID: 15, EmployeeID: 1, AttendanceDate: todayStr, AttendanceStatus: 'Present', InTime: '08:58:00', OutTime: '18:05:00', Remarks: 'Standard working hours', CreatedDate: now, ModifiedDate: now },
    { AttendanceID: 16, EmployeeID: 2, AttendanceDate: todayStr, AttendanceStatus: 'Present', InTime: '09:05:00', OutTime: '18:12:00', Remarks: 'Code reviews and bug fixes', CreatedDate: now, ModifiedDate: now },
    { AttendanceID: 17, EmployeeID: 3, AttendanceDate: todayStr, AttendanceStatus: 'Present', InTime: '09:15:00', OutTime: '18:00:00', Remarks: 'Kubernetes cluster maintenance', CreatedDate: now, ModifiedDate: now },
    { AttendanceID: 18, EmployeeID: 4, AttendanceDate: todayStr, AttendanceStatus: 'Present', InTime: '09:00:00', OutTime: '17:50:00', Remarks: 'New employee onboarding', CreatedDate: now, ModifiedDate: now },
    { AttendanceID: 19, EmployeeID: 5, AttendanceDate: todayStr, AttendanceStatus: 'Present', InTime: '09:25:00', OutTime: '18:30:00', Remarks: 'Technical interviews conducted', CreatedDate: now, ModifiedDate: now },
    { AttendanceID: 20, EmployeeID: 6, AttendanceDate: todayStr, AttendanceStatus: 'Present', InTime: '08:40:00', OutTime: '17:40:00', Remarks: 'Financial ledger reconciliation', CreatedDate: now, ModifiedDate: now },
    { AttendanceID: 21, EmployeeID: 7, AttendanceDate: todayStr, AttendanceStatus: 'Half Day', InTime: '09:00:00', OutTime: '13:00:00', Remarks: 'First half only', CreatedDate: now, ModifiedDate: now },
    { AttendanceID: 22, EmployeeID: 8, AttendanceDate: todayStr, AttendanceStatus: 'Leave', InTime: null, OutTime: null, Remarks: 'Sick leave requested', CreatedDate: now, ModifiedDate: now },
    { AttendanceID: 23, EmployeeID: 9, AttendanceDate: todayStr, AttendanceStatus: 'Present', InTime: '09:10:00', OutTime: '18:00:00', Remarks: 'Digital ad campaigns review', CreatedDate: now, ModifiedDate: now },
    { AttendanceID: 24, EmployeeID: 10, AttendanceDate: todayStr, AttendanceStatus: 'Absent', InTime: null, OutTime: null, Remarks: 'Absent without notice', CreatedDate: now, ModifiedDate: now },
    { AttendanceID: 25, EmployeeID: 11, AttendanceDate: todayStr, AttendanceStatus: 'Present', InTime: '08:55:00', OutTime: '17:55:00', Remarks: 'Sales pipeline follow-ups', CreatedDate: now, ModifiedDate: now },
    { AttendanceID: 26, EmployeeID: 12, AttendanceDate: todayStr, AttendanceStatus: 'Present', InTime: '08:35:00', OutTime: '17:30:00', Remarks: 'Vendor management check', CreatedDate: now, ModifiedDate: now },
    { AttendanceID: 27, EmployeeID: 13, AttendanceDate: todayStr, AttendanceStatus: 'Present', InTime: '09:00:00', OutTime: '18:00:00', Remarks: 'Warehouse logistics audit', CreatedDate: now, ModifiedDate: now },
    { AttendanceID: 28, EmployeeID: 14, AttendanceDate: todayStr, AttendanceStatus: 'Present', InTime: '09:02:00', OutTime: '18:05:00', Remarks: 'Integration testing', CreatedDate: now, ModifiedDate: now },
  ];

  memoryStore.attendance = sampleAttendance;
  memoryStore.nextAttendanceId = 29;
}

// Connect to MySQL or initialize Embedded Fallback
async function initDatabase() {
  try {
    const testPool = mysql.createPool({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      dateStrings: true,
      connectTimeout: 2000,
    });

    const [testResult] = await testPool.query('SELECT 1 as test');
    if (testResult && testResult[0].test === 1) {
      mysqlPool = testPool;
      activeDialect = 'mysql';
      console.log(`[Database] Successfully connected to MySQL server (${DB_HOST}:${DB_PORT}/${DB_NAME})`);
      return;
    }
  } catch (err) {
    console.log(`[Database] MySQL not reachable (${err.message}).`);
    console.log(`[Database] Engaging high-performance embedded persistence engine.`);
    activeDialect = 'embedded';
    loadPersistedStore();
  }
}

// Global query wrapper matching mysql2 promise signature: [rows, fields]
async function query(sql, params = []) {
  if (activeDialect === 'mysql' && mysqlPool) {
    return await mysqlPool.query(sql, params);
  }

  // Handle embedded fallback
  return executeEmbeddedQuery(sql, params);
}

// Global execute wrapper
async function execute(sql, params = []) {
  if (activeDialect === 'mysql' && mysqlPool) {
    return await mysqlPool.execute(sql, params);
  }
  return executeEmbeddedQuery(sql, params);
}

// Transaction support
async function getConnection() {
  if (activeDialect === 'mysql' && mysqlPool) {
    return await mysqlPool.getConnection();
  }

  // Embedded mock connection supporting transactions
  let inTransaction = false;
  let snapshot = null;

  return {
    beginTransaction: async () => {
      inTransaction = true;
      snapshot = JSON.parse(JSON.stringify(memoryStore));
    },
    query: async (sql, params) => executeEmbeddedQuery(sql, params),
    execute: async (sql, params) => executeEmbeddedQuery(sql, params),
    commit: async () => {
      inTransaction = false;
      snapshot = null;
      savePersistedStore();
    },
    rollback: async () => {
      if (snapshot) {
        memoryStore = snapshot;
        savePersistedStore();
      }
      inTransaction = false;
      snapshot = null;
    },
    release: () => {
      if (inTransaction && snapshot) {
        memoryStore = snapshot;
      }
    },
  };
}

// Embedded SQL emulation handler
function executeEmbeddedQuery(sql, params = []) {
  const cleanSql = sql.trim().replace(/\s+/g, ' ');
  const upper = cleanSql.toUpperCase();

  // 1. SELECT queries
  if (upper.startsWith('SELECT')) {
    // Users queries
    if (upper.includes('FROM USERS')) {
      if (upper.includes('WHERE USERNAME = ?')) {
        const username = params[0];
        const user = memoryStore.users.find((u) => u.Username.toLowerCase() === String(username).toLowerCase());
        return [user ? [user] : [], []];
      }
      if (upper.includes('WHERE USERID = ?')) {
        const id = parseInt(params[0], 10);
        const user = memoryStore.users.find((u) => u.UserID === id);
        return [user ? [user] : [], []];
      }
      return [memoryStore.users, []];
    }

    // EmployeeMaster single by ID
    if (upper.includes('FROM EMPLOYEEMASTER WHERE EMPLOYEEID = ?')) {
      const id = parseInt(params[0], 10);
      const emp = memoryStore.employees.find((e) => e.EmployeeID === id);
      return [emp ? [emp] : [], []];
    }

    // EmployeeMaster single by Code
    if (upper.includes('FROM EMPLOYEEMASTER WHERE EMPLOYEECODE = ?')) {
      const code = String(params[0]).trim().toUpperCase();
      const emp = memoryStore.employees.find((e) => e.EmployeeCode.toUpperCase() === code);
      return [emp ? [emp] : [], []];
    }

    // Attendance by EmployeeID and AttendanceDate
    if (upper.includes('FROM ATTENDANCE WHERE EMPLOYEEID = ? AND ATTENDANCEDATE = ?')) {
      const empId = parseInt(params[0], 10);
      const date = String(params[1]).trim();
      const att = memoryStore.attendance.find((a) => a.EmployeeID === empId && a.AttendanceDate === date);
      return [att ? [att] : [], []];
    }

    // Attendance by ID
    if (upper.includes('FROM ATTENDANCE WHERE ATTENDANCEID = ?')) {
      const id = parseInt(params[0], 10);
      const att = memoryStore.attendance.find((a) => a.AttendanceID === id);
      return [att ? [att] : [], []];
    }

    // Attendance count for Employee (for delete check)
    if (upper.includes('COUNT(*) AS COUNT FROM ATTENDANCE WHERE EMPLOYEEID = ?')) {
      const id = parseInt(params[0], 10);
      const count = memoryStore.attendance.filter((a) => a.EmployeeID === id).length;
      return [[{ count, COUNT: count }], []];
    }

    // Fallback for general queries handled by repository functions
    return [[], []];
  }

  // 2. INSERT queries
  if (upper.startsWith('INSERT INTO EMPLOYEEMASTER')) {
    const now = new Date().toISOString();
    // [EmployeeCode, EmployeeName, Department, Designation, MobileNo, EmailID, DateOfJoining, IsActive]
    const newEmp = {
      EmployeeID: memoryStore.nextEmployeeId++,
      EmployeeCode: params[0],
      EmployeeName: params[1],
      Department: params[2],
      Designation: params[3] || null,
      MobileNo: params[4] || null,
      EmailID: params[5] || null,
      DateOfJoining: params[6],
      IsActive: params[7] !== undefined ? (params[7] ? 1 : 0) : 1,
      CreatedDate: now,
      ModifiedDate: now,
    };
    memoryStore.employees.push(newEmp);
    savePersistedStore();
    return [{ insertId: newEmp.EmployeeID, affectedRows: 1 }, []];
  }

  if (upper.startsWith('INSERT INTO ATTENDANCE')) {
    const now = new Date().toISOString();
    // [EmployeeID, AttendanceDate, AttendanceStatus, InTime, OutTime, Remarks]
    const newAtt = {
      AttendanceID: memoryStore.nextAttendanceId++,
      EmployeeID: parseInt(params[0], 10),
      AttendanceDate: params[1],
      AttendanceStatus: params[2],
      InTime: params[3] || null,
      OutTime: params[4] || null,
      Remarks: params[5] || null,
      CreatedDate: now,
      ModifiedDate: now,
    };
    memoryStore.attendance.push(newAtt);
    savePersistedStore();
    return [{ insertId: newAtt.AttendanceID, affectedRows: 1 }, []];
  }

  // 3. UPDATE queries
  if (upper.startsWith('UPDATE EMPLOYEEMASTER')) {
    const now = new Date().toISOString();
    if (upper.includes('SET ISACTIVE = ? WHERE EMPLOYEEID = ?')) {
      const isActive = params[0] ? 1 : 0;
      const empId = parseInt(params[1], 10);
      const emp = memoryStore.employees.find((e) => e.EmployeeID === empId);
      if (emp) {
        emp.IsActive = isActive;
        emp.ModifiedDate = now;
        savePersistedStore();
        return [{ affectedRows: 1 }, []];
      }
      return [{ affectedRows: 0 }, []];
    }

    if (upper.includes('WHERE EMPLOYEEID = ?')) {
      // General update
      // [EmployeeName, Department, Designation, MobileNo, EmailID, DateOfJoining, IsActive, EmployeeID]
      const empId = parseInt(params[params.length - 1], 10);
      const emp = memoryStore.employees.find((e) => e.EmployeeID === empId);
      if (emp) {
        emp.EmployeeName = params[0];
        emp.Department = params[1];
        emp.Designation = params[2] || null;
        emp.MobileNo = params[3] || null;
        emp.EmailID = params[4] || null;
        emp.DateOfJoining = params[5];
        emp.IsActive = params[6] ? 1 : 0;
        emp.ModifiedDate = now;
        savePersistedStore();
        return [{ affectedRows: 1 }, []];
      }
      return [{ affectedRows: 0 }, []];
    }
  }

  if (upper.startsWith('UPDATE ATTENDANCE')) {
    const now = new Date().toISOString();
    // [AttendanceStatus, InTime, OutTime, Remarks, AttendanceID]
    const attId = parseInt(params[params.length - 1], 10);
    const att = memoryStore.attendance.find((a) => a.AttendanceID === attId);
    if (att) {
      att.AttendanceStatus = params[0];
      att.InTime = params[1] || null;
      att.OutTime = params[2] || null;
      att.Remarks = params[3] || null;
      att.ModifiedDate = now;
      savePersistedStore();
      return [{ affectedRows: 1 }, []];
    }
    return [{ affectedRows: 0 }, []];
  }

  // 4. DELETE queries
  if (upper.startsWith('DELETE FROM EMPLOYEEMASTER WHERE EMPLOYEEID = ?')) {
    const empId = parseInt(params[0], 10);
    const initialLen = memoryStore.employees.length;
    memoryStore.employees = memoryStore.employees.filter((e) => e.EmployeeID !== empId);
    savePersistedStore();
    return [{ affectedRows: initialLen - memoryStore.employees.length }, []];
  }

  return [{ affectedRows: 0 }, []];
}

module.exports = {
  initDatabase,
  query,
  execute,
  getConnection,
  getDialect: () => activeDialect,
  getPool: () => mysqlPool,
  getMemoryStore: () => memoryStore,
  savePersistedStore,
};
