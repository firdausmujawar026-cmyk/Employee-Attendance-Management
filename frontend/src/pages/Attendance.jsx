import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../context/ToastContext';
import {
  Calendar,
  Filter,
  Search,
  Save,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  Sparkles,
  RotateCcw,
  Check,
} from 'lucide-react';

export default function Attendance() {
  const { success, error: toastError, info } = useToast();

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [department, setDepartment] = useState('ALL');
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');

  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({
    totalEmployees: 0,
    markedAttendance: 0,
    pendingAttendance: 0,
    present: 0,
    absent: 0,
    halfDay: 0,
    leave: 0,
    holiday: 0,
    weeklyOff: 0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unsavedMap, setUnsavedMap] = useState({}); // { [employeeId]: boolean }
  const [errorBanner, setErrorBanner] = useState('');

  // Fetch departments
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await api.get('/employees/departments');
        if (res.data.success) {
          setDepartments(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load departments:', err);
      }
    };
    fetchDepts();
  }, []);

  // Fetch attendance records for selectedDate and filters
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setErrorBanner('');

      const res = await api.get('/attendance', {
        params: {
          date: selectedDate,
          department,
          search: search.trim(),
        },
      });

      if (res.data.success) {
        const fetchedRecords = res.data.data.records.map((r) => ({
          EmployeeID: r.EmployeeID,
          EmployeeCode: r.EmployeeCode,
          EmployeeName: r.EmployeeName,
          Department: r.Department,
          Designation: r.Designation,
          DateOfJoining: r.DateOfJoining ? r.DateOfJoining.split('T')[0] : '',
          IsActive: r.IsActive,
          AttendanceID: r.AttendanceID,
          AttendanceStatus: r.AttendanceStatus || '',
          InTime: r.InTime ? r.InTime.substring(0, 5) : '',
          OutTime: r.OutTime ? r.OutTime.substring(0, 5) : '',
          Remarks: r.Remarks || '',
        }));

        setRecords(fetchedRecords);
        setSummary(res.data.data.summary);
        setUnsavedMap({});
      }
    } catch (err) {
      setErrorBanner(err.response?.data?.message || err.message || 'Failed to fetch daily attendance.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate, department]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAttendance();
  };

  // Warn on browser unload if there are unsaved changes
  useEffect(() => {
    const hasUnsaved = Object.values(unsavedMap).some(Boolean);
    const handleBeforeUnload = (e) => {
      if (hasUnsaved) {
        e.preventDefault();
        e.returnValue = 'You have unsaved attendance changes. Are you sure you want to leave?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [unsavedMap]);

  // Handle record field changes
  const handleFieldChange = (employeeId, field, value) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.EmployeeID !== employeeId) return r;

        const updated = { ...r, [field]: value };

        // Auto defaults on status selection
        if (field === 'AttendanceStatus') {
          if (value === 'Present') {
            if (!updated.InTime) updated.InTime = '09:00';
            if (!updated.OutTime) updated.OutTime = '18:00';
          } else if (value === 'Half Day') {
            if (!updated.InTime) updated.InTime = '09:00';
            if (!updated.OutTime) updated.OutTime = '13:00';
          } else if (value === 'Absent' || value === 'Leave' || value === 'Holiday' || value === 'Weekly Off') {
            updated.InTime = '';
            updated.OutTime = '';
          }
        }

        return updated;
      })
    );

    setUnsavedMap((prev) => ({ ...prev, [employeeId]: true }));
  };

  // Quick Action: Mark all currently unmarked as Present
  const handleMarkAllUnmarkedPresent = () => {
    let count = 0;
    setRecords((prev) =>
      prev.map((r) => {
        if (!r.AttendanceStatus || r.AttendanceStatus === '') {
          count++;
          setUnsavedMap((m) => ({ ...m, [r.EmployeeID]: true }));
          return {
            ...r,
            AttendanceStatus: 'Present',
            InTime: '09:00',
            OutTime: '18:00',
            Remarks: r.Remarks || 'Standard schedule',
          };
        }
        return r;
      })
    );

    if (count > 0) {
      info(`Populated ${count} unmarked employees with default hours (09:00 - 18:00). Click Save to commit.`);
    } else {
      info('All employees on this list already have attendance assigned.');
    }
  };

  // Reset/Discard unsaved edits
  const handleDiscardChanges = () => {
    fetchAttendance();
    info('Unsaved changes discarded.');
  };

  // Validate and submit batch attendance to backend API
  const handleSaveBulk = async () => {
    setErrorBanner('');

    // Filter only records that have a status set
    const markedRecords = records.filter((r) => r.AttendanceStatus && r.AttendanceStatus.trim() !== '');

    if (markedRecords.length === 0) {
      toastError('Please select attendance status for at least one employee.');
      return;
    }

    // Client-side validations to give instant friendly feedback
    for (const r of markedRecords) {
      const empLabel = `${r.EmployeeName} (${r.EmployeeCode})`;

      // Date of joining check
      if (r.DateOfJoining && selectedDate < r.DateOfJoining) {
        setErrorBanner(
          `Validation Error: Attendance date (${selectedDate}) cannot be earlier than joining date (${r.DateOfJoining}) for ${empLabel}.`
        );
        return;
      }

      // Time checks for Present / Half Day
      if (r.AttendanceStatus === 'Present' || r.AttendanceStatus === 'Half Day') {
        if (!r.InTime) {
          setErrorBanner(`Validation Error: In Time is required for ${empLabel} (${r.AttendanceStatus}).`);
          return;
        }
        if (!r.OutTime) {
          setErrorBanner(`Validation Error: Out Time is required for ${empLabel} (${r.AttendanceStatus}).`);
          return;
        }

        // Compare times: Out Time must be strictly later than In Time
        const [inH, inM] = r.InTime.split(':').map((n) => parseInt(n, 10));
        const [outH, outM] = r.OutTime.split(':').map((n) => parseInt(n, 10));
        const inMins = inH * 60 + inM;
        const outMins = outH * 60 + outM;

        if (outMins <= inMins) {
          setErrorBanner(
            `Validation Error: Out Time (${r.OutTime}) must be later than In Time (${r.InTime}) for ${empLabel}. Overnight shifts are not supported.`
          );
          return;
        }
      }
    }

    try {
      setSaving(true);
      const payload = {
        date: selectedDate,
        records: markedRecords.map((r) => ({
          EmployeeID: r.EmployeeID,
          AttendanceID: r.AttendanceID || null,
          AttendanceStatus: r.AttendanceStatus,
          InTime: r.InTime ? `${r.InTime}:00` : null,
          OutTime: r.OutTime ? `${r.OutTime}:00` : null,
          Remarks: r.Remarks ? r.Remarks.trim() : null,
        })),
      };

      const res = await api.post('/attendance/bulk', payload);

      if (res.data.success) {
        success(res.data.message || 'Attendance saved successfully.');
        setUnsavedMap({});
        fetchAttendance();
      }
    } catch (err) {
      setErrorBanner(err.response?.data?.message || err.message || 'Failed to save attendance batch.');
    } finally {
      setSaving(false);
    }
  };

  const unsavedCount = Object.values(unsavedMap).filter(Boolean).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Daily Attendance Register</h1>
          <p className="text-xs text-slate-500 mt-1">
            Record, verify and modify daily workforce attendance with transactional integrity
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5">
          {unsavedCount > 0 && (
            <button
              onClick={handleDiscardChanges}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-xl transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Discard ({unsavedCount})</span>
            </button>
          )}

          <button
            onClick={handleMarkAllUnmarkedPresent}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition"
            title="Auto-fill unmarked records with Present (09:00 - 18:00)"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Fill Unmarked Present</span>
          </button>

          <button
            onClick={handleSaveBulk}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition shadow-sm shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving Batch...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Attendance {unsavedCount > 0 && `(${unsavedCount})`}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorBanner && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 font-medium leading-relaxed">{errorBanner}</div>
          <button onClick={() => setErrorBanner('')} className="text-rose-500 hover:text-rose-700">
            &times;
          </button>
        </div>
      )}

      {/* Top Filter and Date Selector Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date:</span>
            <div className="relative">
              <input
                type="date"
                max={todayStr}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
            {selectedDate === todayStr && (
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-semibold">
                Today
              </span>
            )}
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dept:</span>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative max-w-xs w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
          />
        </form>
      </div>

      {/* Summary Counters Bar */}
      <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-9 gap-3">
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-semibold uppercase text-slate-400">Total</span>
          <div className="text-lg font-bold text-slate-900 mt-0.5">{summary.totalEmployees}</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-semibold uppercase text-emerald-600">Marked</span>
          <div className="text-lg font-bold text-emerald-700 mt-0.5">{summary.markedAttendance}</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-semibold uppercase text-amber-600">Pending</span>
          <div className="text-lg font-bold text-amber-700 mt-0.5">{summary.pendingAttendance}</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-semibold uppercase text-emerald-600">Present</span>
          <div className="text-lg font-bold text-emerald-700 mt-0.5">{summary.present}</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-semibold uppercase text-rose-600">Absent</span>
          <div className="text-lg font-bold text-rose-700 mt-0.5">{summary.absent}</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-semibold uppercase text-amber-600">Half Day</span>
          <div className="text-lg font-bold text-amber-700 mt-0.5">{summary.halfDay}</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-semibold uppercase text-blue-600">Leave</span>
          <div className="text-lg font-bold text-blue-700 mt-0.5">{summary.leave}</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-semibold uppercase text-purple-600">Holiday</span>
          <div className="text-lg font-bold text-purple-700 mt-0.5">{summary.holiday}</div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-semibold uppercase text-slate-500">Weekly Off</span>
          <div className="text-lg font-bold text-slate-700 mt-0.5">{summary.weeklyOff}</div>
        </div>
      </div>

      {/* Attendance Register Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-5">Emp Code</th>
                <th className="py-3.5 px-5">Employee Name</th>
                <th className="py-3.5 px-5">Department</th>
                <th className="py-3.5 px-5 min-w-[150px]">Attendance Status *</th>
                <th className="py-3.5 px-5 text-center min-w-[110px]">In Time</th>
                <th className="py-3.5 px-5 text-center min-w-[110px]">Out Time</th>
                <th className="py-3.5 px-5 min-w-[200px]">Remarks</th>
                <th className="py-3.5 px-5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-slate-400 mt-2 font-medium">Loading attendance records...</p>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No employees eligible for attendance on this date.
                  </td>
                </tr>
              ) : (
                records.map((row) => {
                  const isModified = !!unsavedMap[row.EmployeeID];
                  const isPresentOrHalf = row.AttendanceStatus === 'Present' || row.AttendanceStatus === 'Half Day';

                  return (
                    <tr
                      key={row.EmployeeID}
                      className={`transition ${isModified ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'}`}
                    >
                      {/* Code */}
                      <td className="py-3 px-5 font-bold text-slate-900 font-mono">{row.EmployeeCode}</td>

                      {/* Name */}
                      <td className="py-3 px-5 font-medium text-slate-800">
                        <div>{row.EmployeeName}</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          Joined: {row.DateOfJoining || 'N/A'}
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-5 text-slate-600 font-medium">{row.Department}</td>

                      {/* Status Dropdown */}
                      <td className="py-3 px-5">
                        <select
                          value={row.AttendanceStatus || ''}
                          onChange={(e) => handleFieldChange(row.EmployeeID, 'AttendanceStatus', e.target.value)}
                          className={`w-full px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                            row.AttendanceStatus === 'Present'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : row.AttendanceStatus === 'Absent'
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : row.AttendanceStatus === 'Half Day'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : row.AttendanceStatus === 'Leave'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : row.AttendanceStatus === 'Holiday'
                              ? 'bg-purple-50 text-purple-800 border-purple-300'
                              : row.AttendanceStatus === 'Weekly Off'
                              ? 'bg-slate-100 text-slate-800 border-slate-300'
                              : 'bg-white text-slate-400 border-slate-200'
                          }`}
                        >
                          <option value="">-- Select Status --</option>
                          <option value="Present">Present</option>
                          <option value="Absent">Absent</option>
                          <option value="Half Day">Half Day</option>
                          <option value="Leave">Leave</option>
                          <option value="Holiday">Holiday</option>
                          <option value="Weekly Off">Weekly Off</option>
                        </select>
                      </td>

                      {/* In Time */}
                      <td className="py-3 px-5 text-center">
                        <input
                          type="time"
                          disabled={!isPresentOrHalf}
                          value={row.InTime || ''}
                          onChange={(e) => handleFieldChange(row.EmployeeID, 'InTime', e.target.value)}
                          className={`px-2 py-1 rounded-lg border text-xs text-center font-mono ${
                            !isPresentOrHalf
                              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                              : 'bg-white border-slate-300 text-slate-800 focus:border-blue-600 focus:ring-1 focus:ring-blue-500'
                          }`}
                        />
                      </td>

                      {/* Out Time */}
                      <td className="py-3 px-5 text-center">
                        <input
                          type="time"
                          disabled={!isPresentOrHalf}
                          value={row.OutTime || ''}
                          onChange={(e) => handleFieldChange(row.EmployeeID, 'OutTime', e.target.value)}
                          className={`px-2 py-1 rounded-lg border text-xs text-center font-mono ${
                            !isPresentOrHalf
                              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                              : 'bg-white border-slate-300 text-slate-800 focus:border-blue-600 focus:ring-1 focus:ring-blue-500'
                          }`}
                        />
                      </td>

                      {/* Remarks */}
                      <td className="py-3 px-5">
                        <input
                          type="text"
                          maxLength={500}
                          placeholder="Optional notes or remarks"
                          value={row.Remarks || ''}
                          onChange={(e) => handleFieldChange(row.EmployeeID, 'Remarks', e.target.value)}
                          className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs placeholder-slate-300 focus:border-blue-600 focus:outline-none"
                        />
                      </td>

                      {/* State Badge */}
                      <td className="py-3 px-5 text-center">
                        {isModified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                            Unsaved
                          </span>
                        ) : row.AttendanceStatus ? (
                          <span className="inline-flex items-center text-emerald-600 text-[11px] font-medium">
                            <Check className="w-3.5 h-3.5 mr-0.5" />
                            Saved
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info banner */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>
              Business Rules: Present & Half Day require valid In and Out Times. Out Time must be later than In Time.
            </span>
          </div>
          <div className="font-semibold text-slate-700">
            {unsavedCount > 0 ? `${unsavedCount} unsaved modification(s)` : 'All records in sync with database'}
          </div>
        </div>
      </div>
    </div>
  );
}
