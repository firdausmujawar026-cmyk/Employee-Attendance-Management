-- ========================================================
-- Employee Attendance Management System
-- Database Schema for MySQL / MySQL Workbench
-- Database Name: employee_attendance
-- ========================================================

CREATE DATABASE IF NOT EXISTS employee_attendance
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE employee_attendance;

-- Drop tables if existing (in reverse order of dependencies)
DROP TABLE IF EXISTS Attendance;
DROP TABLE IF EXISTS EmployeeMaster;
DROP TABLE IF EXISTS Users;

-- ========================================================
-- Table: Users (Administrator Authentication)
-- ========================================================
CREATE TABLE Users (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(50) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    FullName VARCHAR(100) NOT NULL,
    Email VARCHAR(150),
    Role VARCHAR(50) NOT NULL DEFAULT 'admin',
    CreatedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_username (Username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================
-- Table: EmployeeMaster
-- ========================================================
CREATE TABLE EmployeeMaster (
    EmployeeID INT AUTO_INCREMENT PRIMARY KEY,
    EmployeeCode VARCHAR(20) NOT NULL UNIQUE,
    EmployeeName VARCHAR(150) NOT NULL,
    Department VARCHAR(100) NOT NULL,
    Designation VARCHAR(100) NULL,
    MobileNo VARCHAR(15) NULL,
    EmailID VARCHAR(150) NULL,
    DateOfJoining DATE NOT NULL,
    IsActive BOOLEAN NOT NULL DEFAULT TRUE,
    CreatedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_emp_code (EmployeeCode),
    INDEX idx_emp_department (Department),
    INDEX idx_emp_is_active (IsActive),
    INDEX idx_emp_doj (DateOfJoining)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================
-- Table: Attendance
-- ========================================================
CREATE TABLE Attendance (
    AttendanceID INT AUTO_INCREMENT PRIMARY KEY,
    EmployeeID INT NOT NULL,
    AttendanceDate DATE NOT NULL,
    AttendanceStatus VARCHAR(20) NOT NULL,
    InTime TIME NULL,
    OutTime TIME NULL,
    Remarks VARCHAR(500) NULL,
    CreatedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    ModifiedDate DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_attendance_employee
        FOREIGN KEY (EmployeeID) 
        REFERENCES EmployeeMaster (EmployeeID) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT uq_employee_attendance_date 
        UNIQUE (EmployeeID, AttendanceDate),
    INDEX idx_att_date (AttendanceDate),
    INDEX idx_att_employee (EmployeeID),
    INDEX idx_att_status (AttendanceStatus)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
