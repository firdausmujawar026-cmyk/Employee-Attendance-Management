-- ========================================================
-- Employee Attendance Management System - Sample Data
-- For MySQL / MySQL Workbench
-- ========================================================

USE employee_attendance;

-- 1. Insert Administrator User (Username: admin, Password: admin123)
INSERT INTO Users (Username, PasswordHash, FullName, Email, Role, CreatedDate)
VALUES (
    'admin',
    '$2a$10$FrWpcSbJGw8LfrHMEkTRU.2bdrTwvNigIWR/KqlKF9bBOvA89ifF2',
    'System Administrator',
    'admin@enterprise.local',
    'admin',
    NOW()
) ON DUPLICATE KEY UPDATE FullName = VALUES(FullName);

-- 2. Insert Sample Employees into EmployeeMaster
INSERT INTO EmployeeMaster 
(EmployeeCode, EmployeeName, Department, Designation, MobileNo, EmailID, DateOfJoining, IsActive, CreatedDate)
VALUES
('EMP001', 'Alexander Wright', 'Engineering', 'Lead Systems Architect', '+15551234567', 'alex.wright@enterprise.com', '2022-01-15', TRUE, NOW()),
('EMP002', 'Sophia Chen', 'Engineering', 'Senior Full Stack Engineer', '+15552345678', 'sophia.chen@enterprise.com', '2022-03-01', TRUE, NOW()),
('EMP003', 'Marcus Johnson', 'Engineering', 'DevOps & Cloud Engineer', '+15553456789', 'marcus.j@enterprise.com', '2022-06-10', TRUE, NOW()),
('EMP004', 'Emily Davis', 'Human Resources', 'HR Director', '+15554567890', 'emily.davis@enterprise.com', '2021-08-01', TRUE, NOW()),
('EMP005', 'Liam Patel', 'Human Resources', 'Talent Acquisition Lead', '+15555678901', 'liam.patel@enterprise.com', '2023-02-15', TRUE, NOW()),
('EMP006', 'Olivia Taylor', 'Finance', 'Financial Controller', '+15556789012', 'olivia.t@enterprise.com', '2021-11-20', TRUE, NOW()),
('EMP007', 'Noah Miller', 'Finance', 'Senior Accountant', '+15557890123', 'noah.miller@enterprise.com', '2022-09-05', TRUE, NOW()),
('EMP008', 'Ava Wilson', 'Marketing', 'VP of Marketing', '+15558901234', 'ava.wilson@enterprise.com', '2022-05-12', TRUE, NOW()),
('EMP009', 'Lucas Garcia', 'Marketing', 'Growth & Brand Strategist', '+15559012345', 'lucas.g@enterprise.com', '2023-04-18', TRUE, NOW()),
('EMP010', 'Isabella Martinez', 'Sales', 'Enterprise Account Executive', '+15550123456', 'isabella.m@enterprise.com', '2022-10-01', TRUE, NOW()),
('EMP011', 'Ethan Brown', 'Sales', 'Business Development Rep', '+15551122334', 'ethan.brown@enterprise.com', '2023-07-01', TRUE, NOW()),
('EMP012', 'Mia Anderson', 'Operations', 'Chief Operations Officer', '+15552233445', 'mia.a@enterprise.com', '2021-05-01', TRUE, NOW()),
('EMP013', 'James Thomas', 'Operations', 'Logistics Coordinator', '+15553344556', 'james.t@enterprise.com', '2023-01-10', TRUE, NOW()),
('EMP014', 'Charlotte White', 'Engineering', 'QA Automation Engineer', '+15554455667', 'charlotte.w@enterprise.com', '2023-08-20', TRUE, NOW()),
('EMP015', 'Daniel Harris', 'Marketing', 'Content Specialist', '+15555566778', 'daniel.h@enterprise.com', '2022-12-01', FALSE, NOW())
ON DUPLICATE KEY UPDATE EmployeeName = VALUES(EmployeeName);

-- 3. Insert Historical Attendance Records
-- Note: Current and past attendance across recent days
INSERT INTO Attendance (EmployeeID, AttendanceDate, AttendanceStatus, InTime, OutTime, Remarks, CreatedDate)
VALUES
-- Yesterday
(1, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Present', '09:02:00', '18:15:00', 'On time, sprint deployment', NOW()),
(2, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Present', '08:55:00', '18:05:00', 'Regular hours', NOW()),
(3, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Half Day', '09:00:00', '13:30:00', 'Medical checkup in afternoon', NOW()),
(4, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Present', '09:10:00', '18:00:00', 'HR policy review', NOW()),
(5, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Leave', NULL, NULL, 'Approved casual leave', NOW()),
(6, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Present', '08:45:00', '17:45:00', 'Quarterly audit prep', NOW()),
(7, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Absent', NULL, NULL, 'Uninformed absence', NOW()),
(8, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Present', '09:15:00', '18:30:00', 'Campaign launch review', NOW()),
(9, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Present', '09:00:00', '18:00:00', 'SEO optimizations', NOW()),
(10, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Present', '08:50:00', '18:10:00', 'Client demos', NOW()),
(11, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Present', '09:20:00', '18:20:00', 'Outbound leads calling', NOW()),
(12, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Present', '08:30:00', '17:30:00', 'Executive operations sync', NOW()),
(13, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Weekly Off', NULL, NULL, 'Scheduled roster off', NOW()),
(14, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Present', '09:05:00', '18:00:00', 'Automated regression run', NOW()),

-- Today (CURDATE())
(1, CURDATE(), 'Present', '08:58:00', '18:05:00', 'Standard working hours', NOW()),
(2, CURDATE(), 'Present', '09:05:00', '18:12:00', 'Code reviews and bug fixes', NOW()),
(3, CURDATE(), 'Present', '09:15:00', '18:00:00', 'Kubernetes cluster maintenance', NOW()),
(4, CURDATE(), 'Present', '09:00:00', '17:50:00', 'New employee onboarding', NOW()),
(5, CURDATE(), 'Present', '09:25:00', '18:30:00', 'Technical interviews conducted', NOW()),
(6, CURDATE(), 'Present', '08:40:00', '17:40:00', 'Financial ledger reconciliation', NOW()),
(7, CURDATE(), 'Half Day', '09:00:00', '13:00:00', 'First half only', NOW()),
(8, CURDATE(), 'Leave', NULL, NULL, 'Sick leave requested', NOW()),
(9, CURDATE(), 'Present', '09:10:00', '18:00:00', 'Digital ad campaigns review', NOW()),
(10, CURDATE(), 'Absent', NULL, NULL, 'Absent without notice', NOW()),
(11, CURDATE(), 'Present', '08:55:00', '17:55:00', 'Sales pipeline follow-ups', NOW()),
(12, CURDATE(), 'Present', '08:35:00', '17:30:00', 'Vendor management check', NOW()),
(13, CURDATE(), 'Present', '09:00:00', '18:00:00', 'Warehouse logistics audit', NOW()),
(14, CURDATE(), 'Present', '09:02:00', '18:05:00', 'Integration testing', NOW())
ON DUPLICATE KEY UPDATE AttendanceStatus = VALUES(AttendanceStatus);
