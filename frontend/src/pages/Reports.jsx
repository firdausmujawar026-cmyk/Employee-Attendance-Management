import React, { useState, useEffect } from 'react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../context/ToastContext';
import {
  FileBarChart2,
  Calendar,
  Filter,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  ChevronLeft,
  ChevronRight,
  Users,
  Building,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export default function Reports() {
  const { error: toastError, info } = useToast();

  const todayStr = new Date().toISOString().split('T')[0];

  // Report Type: 'daily' | 'weekly' | 'monthly'
  const [reportType, setReportType] = useState('daily');

  // Filters
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedWeekDate, setSelectedWeekDate] = useState(todayStr);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [department, setDepartment] = useState('ALL');
  const [departments, setDepartments] = useState([]);
  const [employeeId, setEmployeeId] = useState('ALL');
  const [employeesList, setEmployeesList] = useState([]);

  // Report Data
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Load dropdown metadata
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [deptRes, empRes] = await Promise.all([
          api.get('/employees/departments'),
          api.get('/employees?limit=200'),
        ]);

        if (deptRes.data.success) setDepartments(deptRes.data.data);
        if (empRes.data.success) setEmployeesList(empRes.data.data);
      } catch (err) {
        console.error('Failed to load filter metadata:', err);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch report data based on active tab and filters
  const fetchReport = async () => {
    try {
      setLoading(true);
      let endpoint = `/reports/${reportType}`;
      let params = {
        department,
        employeeId,
      };

      if (reportType === 'daily') {
        params.date = selectedDate;
      } else if (reportType === 'weekly') {
        params.date = selectedWeekDate;
      } else if (reportType === 'monthly') {
        params.year = selectedYear;
        params.month = selectedMonth;
      }

      const res = await api.get(endpoint, { params });
      if (res.data.success) {
        setReportData(res.data.data);
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to generate report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, selectedDate, selectedWeekDate, selectedYear, selectedMonth, department, employeeId]);

  // Handle Excel Export
  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      const params = new URLSearchParams({
        type: reportType,
        department,
        employeeId,
      });

      if (reportType === 'daily') params.append('date', selectedDate);
      else if (reportType === 'weekly') params.append('date', selectedWeekDate);
      else if (reportType === 'monthly') {
        params.append('year', selectedYear);
        params.append('month', selectedMonth);
      }

      const res = await api.get(`/export/excel?${params.toString()}`, {
        responseType: 'blob',
      });

      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_report_${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toastError('Failed to download Excel report.');
    } finally {
      setExportingExcel(false);
    }
  };

  // Handle PDF Export
  const handleExportPDF = async () => {
    try {
      setExportingPdf(true);
      const params = new URLSearchParams({
        type: reportType,
        department,
        employeeId,
      });

      if (reportType === 'daily') params.append('date', selectedDate);
      else if (reportType === 'weekly') params.append('date', selectedWeekDate);
      else if (reportType === 'monthly') {
        params.append('year', selectedYear);
        params.append('month', selectedMonth);
      }

      const res = await api.get(`/export/pdf?${params.toString()}`, {
        responseType: 'blob',
      });

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_report_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toastError('Failed to download PDF report.');
    } finally {
      setExportingPdf(false);
    }
  };

  // Handle Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header and Export Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance Reports & Exports</h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate auditable daily rosters, Monday–Sunday weekly matrices, and monthly analytics
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            disabled={exportingExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{exportingExcel ? 'Exporting...' : 'Export Excel'}</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={exportingPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>{exportingPdf ? 'Exporting...' : 'Export PDF'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Filter and Mode Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 no-print">
        {/* Tab Switcher: Daily | Weekly | Monthly */}
        <div className="flex items-center border-b border-slate-100 pb-4">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setReportType('daily')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                reportType === 'daily'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daily Report
            </button>
            <button
              onClick={() => setReportType('weekly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                reportType === 'weekly'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Weekly Report (Mon–Sun)
            </button>
            <button
              onClick={() => setReportType('monthly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                reportType === 'monthly'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Report
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
          {/* Dynamic Date/Period Selector */}
          {reportType === 'daily' && (
            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
                Report Date
              </label>
              <input
                type="date"
                max={todayStr}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          )}

          {reportType === 'weekly' && (
            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
                Select Date in Week
              </label>
              <input
                type="date"
                value={selectedWeekDate}
                onChange={(e) => setSelectedWeekDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          )}

          {reportType === 'monthly' && (
            <>
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
                  Calendar Month
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value={1}>January</option>
                  <option value={2}>February</option>
                  <option value={3}>March</option>
                  <option value={4}>April</option>
                  <option value={5}>May</option>
                  <option value={6}>June</option>
                  <option value={7}>July</option>
                  <option value={8}>August</option>
                  <option value={9}>September</option>
                  <option value={10}>October</option>
                  <option value={11}>November</option>
                  <option value={12}>December</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
                  Year
                </label>
                <input
                  type="number"
                  min={2020}
                  max={2030}
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </>
          )}

          {/* Department Filter */}
          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
              Department
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Employee Filter */}
          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
              Employee Filter
            </label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">All Employees</option>
              {employeesList.map((emp) => (
                <option key={emp.EmployeeID} value={emp.EmployeeID}>
                  {emp.EmployeeName} ({emp.EmployeeCode})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Printable Report Header */}
      <div className="hidden print:block mb-6 text-center border-b pb-4">
        <h1 className="text-xl font-bold">EMPLOYEE ATTENDANCE MANAGEMENT SYSTEM</h1>
        <p className="text-xs text-slate-600 mt-1">
          {reportType.toUpperCase()} ATTENDANCE REPORT &bull; Generated on {new Date().toLocaleString()}
        </p>
        <p className="text-xs text-slate-500">
          Department: {department === 'ALL' ? 'All Departments' : department} &bull; Employee:{' '}
          {employeeId === 'ALL' ? 'All Employees' : `ID: ${employeeId}`}
        </p>
      </div>

      {/* Loading Indicator */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 mt-2 font-medium">Generating report from database...</p>
        </div>
      ) : !reportData || reportData.data.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center text-slate-400 text-xs">
          No attendance records found matching your specified filters.
        </div>
      ) : (
        <>
          {/* ======================================================== */}
          {/* 1. DAILY REPORT VIEW */}
          {/* ======================================================== */}
          {reportType === 'daily' && (
            <div className="space-y-4">
              {/* Daily KPI Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 no-print">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-semibold uppercase text-slate-400">Total</span>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">{reportData.summary.total}</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-semibold uppercase text-emerald-600">Present</span>
                  <div className="text-lg font-bold text-emerald-700 mt-0.5">{reportData.summary.present}</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-semibold uppercase text-rose-600">Absent</span>
                  <div className="text-lg font-bold text-rose-700 mt-0.5">{reportData.summary.absent}</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-semibold uppercase text-amber-600">Half Day</span>
                  <div className="text-lg font-bold text-amber-700 mt-0.5">{reportData.summary.halfDay}</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-semibold uppercase text-blue-600">Leave</span>
                  <div className="text-lg font-bold text-blue-700 mt-0.5">{reportData.summary.leave}</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-semibold uppercase text-purple-600">Holiday</span>
                  <div className="text-lg font-bold text-purple-700 mt-0.5">{reportData.summary.holiday}</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-semibold uppercase text-slate-500">Weekly Off</span>
                  <div className="text-lg font-bold text-slate-700 mt-0.5">{reportData.summary.weeklyOff}</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-semibold uppercase text-zinc-400">Unmarked</span>
                  <div className="text-lg font-bold text-zinc-600 mt-0.5">{reportData.summary.notMarked}</div>
                </div>
              </div>

              {/* Daily Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        <th className="py-3.5 px-5">Emp Code</th>
                        <th className="py-3.5 px-5">Employee Name</th>
                        <th className="py-3.5 px-5">Department</th>
                        <th className="py-3.5 px-5">Designation</th>
                        <th className="py-3.5 px-5">Attendance Status</th>
                        <th className="py-3.5 px-5 text-center">In Time</th>
                        <th className="py-3.5 px-5 text-center">Out Time</th>
                        <th className="py-3.5 px-5">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {reportData.data.map((r) => (
                        <tr key={r.EmployeeID} className="hover:bg-slate-50/50">
                          <td className="py-3 px-5 font-bold font-mono text-slate-900">{r.EmployeeCode}</td>
                          <td className="py-3 px-5 font-medium text-slate-800">{r.EmployeeName}</td>
                          <td className="py-3 px-5 text-slate-600">{r.Department}</td>
                          <td className="py-3 px-5 text-slate-500">{r.Designation || '-'}</td>
                          <td className="py-3 px-5">
                            <StatusBadge status={r.AttendanceStatus} />
                          </td>
                          <td className="py-3 px-5 text-center font-mono text-slate-600">
                            {r.InTime ? r.InTime.substring(0, 5) : '-'}
                          </td>
                          <td className="py-3 px-5 text-center font-mono text-slate-600">
                            {r.OutTime ? r.OutTime.substring(0, 5) : '-'}
                          </td>
                          <td className="py-3 px-5 text-slate-500 max-w-xs truncate">{r.Remarks || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 2. WEEKLY REPORT VIEW (MONDAY TO SUNDAY) */}
          {/* ======================================================== */}
          {reportType === 'weekly' && (
            <div className="space-y-4">
              {/* Period banner */}
              <div className="bg-blue-50/60 border border-blue-200/80 p-3.5 rounded-xl flex items-center justify-between text-xs text-blue-900">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold">
                    Week Period: Monday, {reportData.weekStart} &mdash; Sunday, {reportData.weekEnd}
                  </span>
                </div>
                <div className="text-[11px] font-medium text-blue-700">ISO Standard (Monday–Sunday)</div>
              </div>

              {/* Weekly Matrix Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        <th className="py-3 px-4">Code</th>
                        <th className="py-3 px-4">Employee Name</th>
                        <th className="py-3 px-4">Dept</th>
                        <th className="py-3 px-2 text-center">Mon</th>
                        <th className="py-3 px-2 text-center">Tue</th>
                        <th className="py-3 px-2 text-center">Wed</th>
                        <th className="py-3 px-2 text-center">Thu</th>
                        <th className="py-3 px-2 text-center">Fri</th>
                        <th className="py-3 px-2 text-center">Sat</th>
                        <th className="py-3 px-2 text-center">Sun</th>
                        <th className="py-3 px-3 text-center bg-emerald-50/40 text-emerald-800">Pres</th>
                        <th className="py-3 px-3 text-center bg-rose-50/40 text-rose-800">Abs</th>
                        <th className="py-3 px-3 text-center bg-amber-50/40 text-amber-800">Half</th>
                        <th className="py-3 px-3 text-center bg-blue-50/40 text-blue-800">Leave</th>
                        <th className="py-3 px-3 text-center bg-slate-50/80 text-slate-800">Off</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {reportData.data.map((r) => (
                        <tr key={r.EmployeeID} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-4 font-bold font-mono text-slate-900">{r.EmployeeCode}</td>
                          <td className="py-2.5 px-4 font-medium text-slate-800">{r.EmployeeName}</td>
                          <td className="py-2.5 px-4 text-slate-500">{r.Department}</td>

                          {/* 7 Days: Mon-Sun */}
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                            <td key={day} className="py-2.5 px-2 text-center">
                              <StatusBadge status={r[day]} showDot={false} size="xs" />
                            </td>
                          ))}

                          {/* Summary Totals */}
                          <td className="py-2.5 px-3 text-center font-bold bg-emerald-50/30 text-emerald-700">
                            {r.PresentTotal}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold bg-rose-50/30 text-rose-700">
                            {r.AbsentTotal}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold bg-amber-50/30 text-amber-700">
                            {r.HalfDayTotal}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold bg-blue-50/30 text-blue-700">
                            {r.LeaveTotal}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold bg-slate-100/40 text-slate-700">
                            {r.WeeklyOffTotal}
                          </td>
                        </tr>
                      ))}

                      {/* Summary Row */}
                      <tr className="bg-slate-900 text-white font-bold text-xs">
                        <td colSpan={3} className="py-3 px-4">
                          COLUMN TOTALS ({reportData.summary.totalEmployees} Employees)
                        </td>
                        <td colSpan={7} className="py-3 px-2 text-center text-slate-400 text-[11px]">
                          Monday to Sunday Matrix
                        </td>
                        <td className="py-3 px-3 text-center text-emerald-300">{reportData.summary.presentTotal}</td>
                        <td className="py-3 px-3 text-center text-rose-300">{reportData.summary.absentTotal}</td>
                        <td className="py-3 px-3 text-center text-amber-300">{reportData.summary.halfDayTotal}</td>
                        <td className="py-3 px-3 text-center text-blue-300">{reportData.summary.leaveTotal}</td>
                        <td className="py-3 px-3 text-center text-slate-300">{reportData.summary.weeklyOffTotal}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 3. MONTHLY REPORT VIEW */}
          {/* ======================================================== */}
          {reportType === 'monthly' && (
            <div className="space-y-4">
              {/* Month banner */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex items-center justify-between text-xs text-slate-800">
                <span className="font-semibold">
                  Reporting Month: {reportData.monthName} {reportData.year} ({reportData.daysInMonth} Days)
                </span>
                <span className="text-slate-500">
                  {reportData.monthStart} &mdash; {reportData.monthEnd}
                </span>
              </div>

              {/* Monthly Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        <th className="py-3.5 px-5">Emp Code</th>
                        <th className="py-3.5 px-5">Employee Name</th>
                        <th className="py-3.5 px-5">Department</th>
                        <th className="py-3.5 px-5">Designation</th>
                        <th className="py-3.5 px-4 text-center bg-emerald-50/40 text-emerald-800">Present</th>
                        <th className="py-3.5 px-4 text-center bg-rose-50/40 text-rose-800">Absent</th>
                        <th className="py-3.5 px-4 text-center bg-amber-50/40 text-amber-800">Half Day</th>
                        <th className="py-3.5 px-4 text-center bg-blue-50/40 text-blue-800">Leave</th>
                        <th className="py-3.5 px-4 text-center bg-purple-50/40 text-purple-800">Holiday</th>
                        <th className="py-3.5 px-4 text-center bg-slate-50 text-slate-800">Weekly Off</th>
                        <th className="py-3.5 px-4 text-center font-bold">Total Marked</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {reportData.data.map((r) => (
                        <tr key={r.EmployeeID} className="hover:bg-slate-50/50">
                          <td className="py-3 px-5 font-bold font-mono text-slate-900">{r.EmployeeCode}</td>
                          <td className="py-3 px-5 font-medium text-slate-800">{r.EmployeeName}</td>
                          <td className="py-3 px-5 text-slate-600">{r.Department}</td>
                          <td className="py-3 px-5 text-slate-500">{r.Designation || '-'}</td>
                          <td className="py-3 px-4 text-center font-bold text-emerald-700 bg-emerald-50/20">
                            {r.Present}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-rose-700 bg-rose-50/20">
                            {r.Absent}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-amber-700 bg-amber-50/20">
                            {r.HalfDay}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-blue-700 bg-blue-50/20">
                            {r.Leave}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-purple-700 bg-purple-50/20">
                            {r.Holiday}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-slate-600 bg-slate-50/40">
                            {r.WeeklyOff}
                          </td>
                          <td className="py-3 px-4 text-center font-semibold text-slate-900">
                            {r.TotalMarked}
                          </td>
                        </tr>
                      ))}

                      {/* Monthly Totals Row */}
                      <tr className="bg-slate-900 text-white font-bold text-xs">
                        <td colSpan={4} className="py-3.5 px-5">
                          TOTALS ({reportData.summary.totalEmployees} Employees)
                        </td>
                        <td className="py-3.5 px-4 text-center text-emerald-300">{reportData.summary.presentTotal}</td>
                        <td className="py-3.5 px-4 text-center text-rose-300">{reportData.summary.absentTotal}</td>
                        <td className="py-3.5 px-4 text-center text-amber-300">{reportData.summary.halfDayTotal}</td>
                        <td className="py-3.5 px-4 text-center text-blue-300">{reportData.summary.leaveTotal}</td>
                        <td className="py-3.5 px-4 text-center text-purple-300">{reportData.summary.holidayTotal}</td>
                        <td className="py-3.5 px-4 text-center text-slate-300">{reportData.summary.weeklyOffTotal}</td>
                        <td className="py-3.5 px-4 text-center text-slate-300">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
