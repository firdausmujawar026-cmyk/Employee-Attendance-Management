# Employee Attendance Management System

A production-ready, full-stack **Enterprise Employee Attendance Management System** built with **React.js, Vite, Tailwind CSS, Node.js, Express.js, and MySQL (MySQL2)** with comprehensive ExcelJS, PDFKit, and browser print reporting.

Designed as an internship project structured for modular integration into enterprise ERP systems (such as SAP, Oracle HCM, or custom ERP suites).

---

## 1. System Architecture & Features Overview

```
                                  +-----------------------------+
                                  |   React.js / Vite / Tailwind|
                                  |   Modern Enterprise UI      |
                                  +--------------+--------------+
                                                 | REST APIs (Axios + JWT)
                                                 v
                                  +-----------------------------+
                                  |   Node.js / Express Backend |
                                  |   Layered Services & Auth   |
                                  +--------------+--------------+
                                                 |
                       +-------------------------+-------------------------+
                       |                                                   |
                       v                                                   v
         +----------------------------+                     +----------------------------+
         | MySQL Database Engine      |                     | Enterprise Document Export |
         | MySQL2 Connection Pool     |                     | ExcelJS (XLSX)             |
         | Parameterized Queries      |                     | PDFKit (Streamable PDF)    |
         | Transactions & Foreign Keys|                     | Print Friendly Layouts     |
         +----------------------------+                     +----------------------------+
```

### Key Modules:
- **Executive Dashboard**: Real-time workforce KPIs, 7-day attendance trend charts (Recharts), department allocation distribution, recent activity logs, and quick action shortcuts.
- **Employee Master**: Searchable & filterable employee directory (code, name, department, active status), pagination, detailed profile viewer, edit modal, and safe activation/deactivation (preventing hard deletion of employees with attendance history).
- **Daily Attendance Register**: Bulk attendance recording with database transactions, auto-fill defaults (09:00–18:00), unsaved modification counters, status badges (Present, Absent, Half Day, Leave, Holiday, Weekly Off), and rigorous validation.
- **Reporting & Analytics**:
  - **Daily Report**: Attendance roster with In/Out timestamps, department and individual employee filters.
  - **Weekly Report**: Strict **Monday to Sunday** matrix displaying each day's status alongside cumulative Present, Absent, Half Day, Leave, Holiday, and Weekly Off totals.
  - **Monthly Report**: Calendar month aggregation handling variable month lengths (28–31 days) and leap years. Unrecorded days remain distinct from Absent.
- **Document Exporting & Print**:
  - **Excel (ExcelJS)**: Styled workbooks with navy title headers, metadata blocks, formatted times, and summary calculation rows.
  - **PDF (PDFKit)**: Formatted, paginated executive reports matching active filters.
  - **Browser Print**: Dedicated `@media print` stylesheet that strips navigation and actions to print clean, high-resolution tables.

---

## 2. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 6, Tailwind CSS 3, React Router DOM v7, Axios, Lucide React, Recharts |
| **Backend** | Node.js (v24), Express.js 4, Express Validator 7, jsonwebtoken, bcryptjs, dotenv, CORS |
| **Database** | MySQL (with MySQL Workbench compatibility) & MySQL2 Promise driver |
| **Reporting / Export** | ExcelJS, PDFKit, Native CSS `@media print` |

---

## 3. Database Schema

The database is named `employee_attendance` and consists of 3 relational tables:

### 1. `EmployeeMaster`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `EmployeeID` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique Employee ID |
| `EmployeeCode` | VARCHAR(20) | UNIQUE, NOT NULL | Unique Employee Code (e.g. EMP001) |
| `EmployeeName` | VARCHAR(150) | NOT NULL | Full Employee Name |
| `Department` | VARCHAR(100) | NOT NULL, INDEXED | Department Name |
| `Designation` | VARCHAR(100) | NULL | Job Title / Role |
| `MobileNo` | VARCHAR(15) | NULL | Phone digits & + |
| `EmailID` | VARCHAR(150) | NULL | Validated email address |
| `DateOfJoining` | DATE | NOT NULL | Hire / Joining date |
| `IsActive` | BOOLEAN | NOT NULL, DEFAULT TRUE | Status flag (Active / Inactive) |
| `CreatedDate` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Audit timestamp |
| `ModifiedDate` | DATETIME | ON UPDATE CURRENT_TIMESTAMP | Audit timestamp |

### 2. `Attendance`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `AttendanceID` | INT | PRIMARY KEY, AUTO_INCREMENT | Unique Attendance record ID |
| `EmployeeID` | INT | FOREIGN KEY, NOT NULL | References `EmployeeMaster(EmployeeID)` |
| `AttendanceDate` | DATE | NOT NULL, INDEXED | Date of attendance |
| `AttendanceStatus` | VARCHAR(20) | NOT NULL | Present, Absent, Half Day, Leave, Holiday, Weekly Off |
| `InTime` | TIME | NULL | Clock-in time (HH:MM:SS) |
| `OutTime` | TIME | NULL | Clock-out time (HH:MM:SS) |
| `Remarks` | VARCHAR(500) | NULL | Optional remarks or notes |
| `CreatedDate` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Audit timestamp |
| `ModifiedDate` | DATETIME | ON UPDATE CURRENT_TIMESTAMP | Audit timestamp |

*Constraints*:
- `uq_employee_attendance_date`: Unique constraint on `(EmployeeID, AttendanceDate)` preventing duplicate entries.
- `fk_attendance_employee`: Foreign key referencing `EmployeeMaster(EmployeeID)` with `ON DELETE RESTRICT` and `ON UPDATE CASCADE`.

### 3. `Users` (Authentication)
| Column | Type | Constraints | Description |
|---|---|---|---|
| `UserID` | INT | PRIMARY KEY, AUTO_INCREMENT | User ID |
| `Username` | VARCHAR(50) | UNIQUE, NOT NULL | Login username |
| `PasswordHash` | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| `FullName` | VARCHAR(100) | NOT NULL | Admin full name |
| `Role` | VARCHAR(50) | DEFAULT 'admin' | Role |

SQL Scripts:
- `database/schema.sql`: Complete DDL table creation and indexing script.
- `database/sample-data.sql`: Seed data for administrator and sample employees across 6 departments with past and present attendance logs.

---

## 4. Installation & Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- MySQL Server (Optional / Recommended: MySQL 8.x or XAMPP / WampServer)

### 1. Database Setup (MySQL Server)
1. Open MySQL Workbench or your MySQL CLI.
2. Run the schema creation script:
   ```sql
   SOURCE database/schema.sql;
   SOURCE database/sample-data.sql;
   ```
3. Configure your credentials in `backend/.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=employee_attendance
   JWT_SECRET=super_secret_attendance_enterprise_jwt_key_2025_prod_secure
   JWT_EXPIRES_IN=7d
   ```
4. Or run the automated migration command:
   ```bash
   npm run db:init
   npm run db:seed
   ```
*(Note: If MySQL is not running during local inspection, the backend includes a built-in embedded fallback database with identical constraints, allowing zero-friction testing without crashes).*

### 2. Start the Backend API
```bash
cd backend
npm start
```
The server will start on `http://localhost:5000`.

### 3. Start the Frontend Application
```bash
cd frontend
npm run dev
```
The application will launch on `http://localhost:3000`.

---

## 5. Default Credentials

| Username | Password | Role |
|---|---|---|
| `admin` | `admin123` | System Administrator |

---

## 6. Business Rules Enforced

1. **Present & Half Day Attendance**:
   - Requires valid `InTime` and `OutTime`.
   - `OutTime` must be strictly later than `InTime` (Overnight shifts are not supported).
2. **Absent, Leave, Holiday, Weekly Off**:
   - Clock-in and clock-out times are optional / cleared.
3. **Future Dates**:
   - Rejected across all attendance operations.
4. **Date of Joining Check**:
   - Attendance cannot be recorded for any date prior to the employee's `DateOfJoining`.
5. **Inactive Employees**:
   - Inactive employees cannot receive new attendance records.
6. **No Duplicate Attendance**:
   - Unique constraint on `(EmployeeID, AttendanceDate)` ensures only 1 record per employee per day.
7. **Blank Attendance Distinction**:
   - Unrecorded dates are shown as "Pending / Not Marked" and are never falsely classified as "Absent".
8. **Employee Audit Safety**:
   - Employees with attendance records cannot be deleted; activation/deactivation toggles are used instead to preserve historic compliance records.
9. **Transactional Integrity**:
   - Batch submissions on `/api/attendance/bulk` execute within a database transaction, ensuring atomicity (all-or-nothing).

---

## 7. REST API Endpoints

### Authentication
- `POST /api/auth/login`: Authenticate admin, returns JWT token.
- `GET /api/auth/me`: Get current logged-in profile.
- `POST /api/auth/logout`: End session.

### Employees
- `GET /api/employees`: Paginated list with `search`, `department`, and `status` filters.
- `POST /api/employees`: Create new employee with unique code check.
- `GET /api/employees/departments`: List of distinct departments.
- `GET /api/employees/:id`: Retrieve single employee.
- `PUT /api/employees/:id`: Update employee details.
- `PATCH /api/employees/:id/status`: Toggle active / inactive status.
- `DELETE /api/employees/:id`: Delete employee (blocked if attendance history exists).

### Attendance
- `GET /api/attendance?date=YYYY-MM-DD`: Get attendance register for a specific date.
- `POST /api/attendance/bulk`: Transactional bulk save/update of attendance records.
- `PUT /api/attendance/:id`: Correct/update a specific attendance record.

### Reports
- `GET /api/reports/daily?date=YYYY-MM-DD`: Daily attendance roster.
- `GET /api/reports/weekly?date=YYYY-MM-DD`: Monday to Sunday matrix report.
- `GET /api/reports/monthly?year=YYYY&month=MM`: Monthly aggregate report.

### Dashboard
- `GET /api/dashboard/stats`: KPI counts (Total, Active, Inactive, Present, Absent, Half Day, Leave).
- `GET /api/dashboard/attendance-overview?days=7`: 7-day daily trend for Recharts.
- `GET /api/dashboard/department-distribution`: Employee count by department.
- `GET /api/dashboard/recent-attendance?limit=10`: Latest attendance activity feed.

### Exports
- `GET /api/export/excel?type=daily|weekly|monthly`: Generate downloadable Excel file.
- `GET /api/export/pdf?type=daily|weekly|monthly`: Generate downloadable PDF report.

---

## 8. Verification & Test Checklist

The project includes an automated test runner executing 17 comprehensive validation scenarios:

```bash
npm test
```

### Verified Test Scenarios:
1. ✓ Create an employee with valid information.
2. ✓ Reject duplicate employee codes.
3. ✓ Search employees by name and code.
4. ✓ Deactivate an employee.
5. ✓ Prevent new attendance for inactive employees.
6. ✓ Reject Present without In Time.
7. ✓ Reject Half Day without Out Time.
8. ✓ Reject Out Time earlier than or equal to In Time.
9. ✓ Reject attendance before joining date.
10. ✓ Reject future attendance dates.
11. ✓ Prevent duplicate employee/date attendance and handle batch conflicts.
12. ✓ Ensure blank attendance is counted as "Not Marked", distinct from "Absent".
13. ✓ Verify weekly report Monday–Sunday ISO calendar calculations.
14. ✓ Verify monthly summary calculations across variable month lengths and leap years.
15. ✓ Verify ExcelJS XLSX binary buffer generation with headings and summary formulas.
16. ✓ Verify PDFKit stream generation with table and header layouts.
17. ✓ Verify `@media print` CSS for print layout optimization.
