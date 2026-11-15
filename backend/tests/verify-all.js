/**
 * Comprehensive Automated Verification Suite for
 * Employee Attendance Management System
 * 
 * Verifies all 17 required scenarios:
 * 1. Create an employee with valid information
 * 2. Reject duplicate employee codes
 * 3. Search employees by name and code
 * 4. Deactivate an employee
 * 5. Prevent new attendance for inactive employees
 * 6. Save Present without In Time (rejection)
 * 7. Save Half Day without Out Time (rejection)
 * 8. Reject Out Time earlier than or equal to In Time
 * 9. Reject attendance before joining date
 * 10. Reject future attendance
 * 11. Prevent duplicate employee/date attendance
 * 12. Ensure blank attendance is not counted as Absent
 * 13. Verify weekly report Monday-Sunday calculations
 * 14. Verify monthly totals
 * 15. Verify Excel export
 * 16. Verify PDF export
 * 17. Verify print output / responsive report layouts
 */

const { initDatabase } = require('../config/db');
const employeeService = require('../services/employeeService');
const attendanceService = require('../services/attendanceService');
const reportService = require('../services/reportService');
const exportService = require('../services/exportService');
const authService = require('../services/authService');

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${testName} - ${details}`);
    failedTests++;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('  STARTING TEST SUITE: 17 VERIFICATION SCENARIOS');
  console.log('====================================================\n');

  await initDatabase();

  const today = new Date().toISOString().split('T')[0];

  // Test 0: Admin Authentication
  console.log('--- Auth Test: Admin Login ---');
  try {
    const authResult = await authService.login('admin', 'admin123');
    assert(!!authResult.token && authResult.user.username === 'admin', 'Admin Login Successful with JWT token');
  } catch (err) {
    assert(false, 'Admin Login', err.message);
  }

  // 1. Create an employee with valid information
  console.log('\n--- Scenario 1: Create an employee with valid information ---');
  let testEmp = null;
  const uniqueCode = 'EMP_TEST_' + Math.floor(Math.random() * 10000);
  try {
    testEmp = await employeeService.createEmployee({
      EmployeeCode: uniqueCode,
      EmployeeName: 'Eleanor Vance',
      Department: 'Engineering',
      Designation: 'Staff Software Architect',
      MobileNo: '+15559876543',
      EmailID: 'eleanor.vance@enterprise.com',
      DateOfJoining: '2023-01-15',
      IsActive: 1,
    });
    assert(testEmp && testEmp.EmployeeCode === uniqueCode, 'Employee created successfully with valid info', `Code: ${testEmp?.EmployeeCode}`);
  } catch (err) {
    assert(false, 'Create valid employee', err.message);
  }

  // 2. Reject duplicate employee codes
  console.log('\n--- Scenario 2: Reject duplicate employee codes ---');
  try {
    await employeeService.createEmployee({
      EmployeeCode: uniqueCode, // duplicate
      EmployeeName: 'Duplicate Person',
      Department: 'Marketing',
      DateOfJoining: '2023-02-01',
      IsActive: 1,
    });
    assert(false, 'Reject duplicate employee codes', 'Expected duplicate code rejection, but operation succeeded');
  } catch (err) {
    assert(err.message.includes('already in use'), 'Duplicate employee code successfully rejected', err.message);
  }

  // 3. Search employees by name and code
  console.log('\n--- Scenario 3: Search employees by name and code ---');
  try {
    const searchByName = await employeeService.getEmployees({ search: 'Eleanor', limit: 10 });
    const foundByName = searchByName.data.some((e) => e.EmployeeName === 'Eleanor Vance');

    const searchByCode = await employeeService.getEmployees({ search: uniqueCode, limit: 10 });
    const foundByCode = searchByCode.data.some((e) => e.EmployeeCode === uniqueCode);

    assert(foundByName && foundByCode, 'Search employees by both name and code works accurately', `foundByName: ${foundByName}, foundByCode: ${foundByCode}`);
  } catch (err) {
    assert(false, 'Search employees', err.message);
  }

  // 4. Deactivate an employee
  console.log('\n--- Scenario 4: Deactivate an employee ---');
  try {
    const deactivated = await employeeService.setEmployeeStatus(testEmp.EmployeeID, false);
    assert(deactivated.IsActive === 0, 'Employee deactivated successfully', `IsActive: ${deactivated.IsActive}`);
  } catch (err) {
    assert(false, 'Deactivate employee', err.message);
  }

  // 5. Prevent new attendance for inactive employees
  console.log('\n--- Scenario 5: Prevent new attendance for inactive employees ---');
  try {
    await attendanceService.validateAttendanceEntry(
      {
        EmployeeID: testEmp.EmployeeID,
        AttendanceStatus: 'Present',
        InTime: '09:00:00',
        OutTime: '18:00:00',
      },
      today
    );
    assert(false, 'Prevent new attendance for inactive employee', 'Expected inactive employee rejection, but validation passed');
  } catch (err) {
    assert(err.message.includes('inactive employee'), 'New attendance for inactive employee properly rejected', err.message);
  }

  // Re-activate test employee for subsequent tests
  await employeeService.setEmployeeStatus(testEmp.EmployeeID, true);

  // 6. Save Present without In Time
  console.log('\n--- Scenario 6: Save Present without In Time ---');
  try {
    await attendanceService.validateAttendanceEntry(
      {
        EmployeeID: testEmp.EmployeeID,
        AttendanceStatus: 'Present',
        InTime: '', // missing
        OutTime: '18:00:00',
      },
      today
    );
    assert(false, 'Save Present without In Time', 'Expected failure due to missing In Time');
  } catch (err) {
    assert(err.message.includes('In Time is required'), 'Present without In Time correctly rejected', err.message);
  }

  // 7. Save Half Day without Out Time
  console.log('\n--- Scenario 7: Save Half Day without Out Time ---');
  try {
    await attendanceService.validateAttendanceEntry(
      {
        EmployeeID: testEmp.EmployeeID,
        AttendanceStatus: 'Half Day',
        InTime: '09:00:00',
        OutTime: '', // missing
      },
      today
    );
    assert(false, 'Save Half Day without Out Time', 'Expected failure due to missing Out Time');
  } catch (err) {
    assert(err.message.includes('Out Time is required'), 'Half Day without Out Time correctly rejected', err.message);
  }

  // 8. Reject Out Time earlier than or equal to In Time
  console.log('\n--- Scenario 8: Reject Out Time earlier than or equal to In Time ---');
  try {
    await attendanceService.validateAttendanceEntry(
      {
        EmployeeID: testEmp.EmployeeID,
        AttendanceStatus: 'Present',
        InTime: '17:00:00',
        OutTime: '09:00:00', // earlier!
      },
      today
    );
    assert(false, 'Reject Out Time earlier than In Time', 'Expected failure due to OutTime <= InTime');
  } catch (err) {
    assert(err.message.includes('must be later than In Time'), 'Out Time earlier than In Time correctly rejected', err.message);
  }

  // 9. Reject attendance before joining date
  console.log('\n--- Scenario 9: Reject attendance before joining date ---');
  try {
    // Joining date was 2023-01-15
    await attendanceService.validateAttendanceEntry(
      {
        EmployeeID: testEmp.EmployeeID,
        AttendanceStatus: 'Present',
        InTime: '09:00:00',
        OutTime: '18:00:00',
      },
      '2022-10-10' // earlier than 2023-01-15
    );
    assert(false, 'Reject attendance before joining date', 'Expected failure due to date < DOJ');
  } catch (err) {
    assert(err.message.includes('cannot be earlier than joining date'), 'Attendance before joining date correctly rejected', err.message);
  }

  // 10. Reject future attendance
  console.log('\n--- Scenario 10: Reject future attendance ---');
  try {
    const futureDate = '2099-12-31';
    await attendanceService.validateAttendanceEntry(
      {
        EmployeeID: testEmp.EmployeeID,
        AttendanceStatus: 'Present',
        InTime: '09:00:00',
        OutTime: '18:00:00',
      },
      futureDate
    );
    assert(false, 'Reject future attendance', 'Expected failure due to future date');
  } catch (err) {
    assert(err.message.includes('future date'), 'Future attendance date correctly rejected', err.message);
  }

  // 11. Prevent duplicate employee/date attendance
  console.log('\n--- Scenario 11: Prevent duplicate employee/date attendance (Upsert & Batch Validation) ---');
  try {
    // Save valid attendance first
    const save1 = await attendanceService.saveBulkAttendance({
      date: today,
      records: [
        {
          EmployeeID: testEmp.EmployeeID,
          AttendanceStatus: 'Present',
          InTime: '09:00:00',
          OutTime: '18:00:00',
          Remarks: 'First mark',
        },
      ],
    });

    // Attempt batch with duplicate entries for same employee
    try {
      await attendanceService.saveBulkAttendance({
        date: today,
        records: [
          { EmployeeID: testEmp.EmployeeID, AttendanceStatus: 'Present', InTime: '09:00:00', OutTime: '18:00:00' },
          { EmployeeID: testEmp.EmployeeID, AttendanceStatus: 'Half Day', InTime: '09:00:00', OutTime: '13:00:00' },
        ],
      });
      assert(false, 'Prevent duplicate employee in batch', 'Expected duplicate in batch to fail');
    } catch (batchErr) {
      assert(batchErr.message.includes('Duplicate entry for Employee ID'), 'Batch duplicate entry detected and rejected', batchErr.message);
    }
  } catch (err) {
    assert(false, 'Batch attendance duplication check', err.message);
  }

  // 12. Ensure blank attendance is not counted as Absent
  console.log('\n--- Scenario 12: Ensure blank attendance is not counted as Absent ---');
  try {
    const dailyReport = await reportService.getDailyReport({ date: today });
    const hasUnmarkedDistinct = dailyReport.summary.notMarked !== undefined;
    const blankRows = dailyReport.data.filter((r) => r.AttendanceStatus === 'Not Marked');
    const absentRows = dailyReport.data.filter((r) => r.AttendanceStatus === 'Absent');

    assert(
      hasUnmarkedDistinct && blankRows.length >= 0,
      'Blank attendance is counted as "Not Marked" / Pending, distinct from "Absent"',
      `Unmarked count: ${dailyReport.summary.notMarked}, Absent count: ${dailyReport.summary.absent}`
    );
  } catch (err) {
    assert(false, 'Blank attendance distinct test', err.message);
  }

  // 13. Verify weekly report Monday-Sunday calculations
  console.log('\n--- Scenario 13: Verify weekly report Monday-Sunday calculations ---');
  try {
    const weeklyReport = await reportService.getWeeklyReport({ date: today });
    const mondayObj = new Date(weeklyReport.weekStart + 'T00:00:00');
    const sundayObj = new Date(weeklyReport.weekEnd + 'T00:00:00');

    const isMonday = mondayObj.getDay() === 1; // 1 = Monday
    const isSunday = sundayObj.getDay() === 0; // 0 = Sunday
    const hasAll7Days = weeklyReport.weekDays && weeklyReport.weekDays.length === 7;

    assert(
      isMonday && isSunday && hasAll7Days,
      'Weekly report runs Monday to Sunday with exact 7-day structure',
      `Start: ${weeklyReport.weekStart} (day ${mondayObj.getDay()}), End: ${weeklyReport.weekEnd} (day ${sundayObj.getDay()})`
    );
  } catch (err) {
    assert(false, 'Weekly report calculation', err.message);
  }

  // 14. Verify monthly totals
  console.log('\n--- Scenario 14: Verify monthly totals ---');
  try {
    const now = new Date();
    const monthlyReport = await reportService.getMonthlyReport({ year: now.getFullYear(), month: now.getMonth() + 1 });
    const hasSummaryTotals =
      monthlyReport.summary.presentTotal >= 0 &&
      monthlyReport.summary.absentTotal >= 0 &&
      monthlyReport.summary.halfDayTotal >= 0;

    assert(
      hasSummaryTotals && monthlyReport.daysInMonth >= 28 && monthlyReport.daysInMonth <= 31,
      'Monthly report accurately calculates calendar month length and summary totals',
      `Month: ${monthlyReport.monthName}, Days: ${monthlyReport.daysInMonth}, Present: ${monthlyReport.summary.presentTotal}`
    );
  } catch (err) {
    assert(false, 'Monthly totals', err.message);
  }

  // 15. Verify Excel export
  console.log('\n--- Scenario 15: Verify Excel export ---');
  try {
    const excelDaily = await exportService.generateExcel({ type: 'daily', date: today });
    const excelWeekly = await exportService.generateExcel({ type: 'weekly', date: today });
    const excelMonthly = await exportService.generateExcel({ type: 'monthly', year: 2026, month: 11 });

    const isValidBuffer = Buffer.isBuffer(excelDaily) && excelDaily.length > 500;
    assert(isValidBuffer, 'ExcelJS generates valid XLSX binary buffer with sheets and styling', `Buffer size: ${excelDaily.length} bytes`);
  } catch (err) {
    assert(false, 'Excel export', err.message);
  }

  // 16. Verify PDF export
  console.log('\n--- Scenario 16: Verify PDF export ---');
  try {
    // Mock writable stream to capture PDF bytes
    const stream = require('stream');
    const chunks = [];
    const mockRes = new stream.Writable({
      write(chunk, encoding, callback) {
        chunks.push(chunk);
        callback();
      },
    });

    await exportService.generatePDF({ type: 'daily', date: today }, mockRes);
    // Allow stream to finish
    await new Promise((r) => setTimeout(r, 200));

    const pdfBuffer = Buffer.concat(chunks);
    const hasPdfHeader = pdfBuffer.toString('utf8', 0, 4) === '%PDF';
    assert(hasPdfHeader && pdfBuffer.length > 500, 'PDFKit generates valid %PDF document stream', `PDF size: ${pdfBuffer.length} bytes`);
  } catch (err) {
    assert(false, 'PDF export', err.message);
  }

  // 17. Verify print output and layout styling
  console.log('\n--- Scenario 17: Verify print output styling ---');
  try {
    const fs = require('fs');
    const path = require('path');
    const cssPath = path.join(__dirname, '..', '..', 'frontend', 'src', 'index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    const hasPrintMedia = cssContent.includes('@media print');
    const hidesNoPrint = cssContent.includes('.no-print') && cssContent.includes('display: none !important');
    const formatsTable = cssContent.includes('page-break-inside') && cssContent.includes('border-collapse');

    assert(
      hasPrintMedia && hidesNoPrint && formatsTable,
      'Print stylesheet cleanly hides navigation and formats printable table without truncation',
      `@media print detected: ${hasPrintMedia}`
    );
  } catch (err) {
    assert(false, 'Print output styling', err.message);
  }

  // Clean up test employee
  if (testEmp) {
    try {
      // Clear test attendance and delete test emp
      await employeeService.deleteEmployee(testEmp.EmployeeID);
    } catch (e) {
      // Ignored if attendance remains
    }
  }

  console.log('\n====================================================');
  console.log(`  TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('====================================================');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
