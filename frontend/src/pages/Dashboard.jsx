import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import {
  Users,
  UserCheck,
  UserX,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  UserPlus,
  ArrowRight,
  RefreshCw,
  BarChart3,
  PieChart as PieIcon,
  Briefcase,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [attendanceOverview, setAttendanceOverview] = useState([]);
  const [departmentDistribution, setDepartmentDistribution] = useState([]);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, overviewRes, deptRes, recentRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/attendance-overview?days=7'),
        api.get('/dashboard/department-distribution'),
        api.get('/dashboard/recent-attendance?limit=8'),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.data);
      if (overviewRes.data.success) setAttendanceOverview(overviewRes.data.data);
      if (deptRes.data.success) setDepartmentDistribution(deptRes.data.data);
      if (recentRes.data.success) setRecentAttendance(recentRes.data.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err.response?.data?.message || err.message || 'Error connecting to database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium mt-3">Loading dashboard analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800">
        <h3 className="font-semibold text-sm">Failed to retrieve dashboard data</h3>
        <p className="text-xs mt-1">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-4 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner / Welcome & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time workforce attendance intelligence and department statistics
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/employees?action=add')}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition shadow-xs"
          >
            <UserPlus className="w-4 h-4 text-blue-600" />
            <span>Add Employee</span>
          </button>
          <button
            onClick={() => navigate('/attendance')}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition shadow-sm shadow-blue-500/20"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Mark Attendance</span>
          </button>
          <button
            onClick={() => navigate('/reports')}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition shadow-xs"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
        {/* Total Employees */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats?.totalEmployees || 0}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Total registered</div>
        </div>

        {/* Active Employees */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Active</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats?.activeEmployees || 0}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Eligible roster</div>
        </div>

        {/* Inactive Employees */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Inactive</span>
            <UserX className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-700 mt-2">{stats?.inactiveEmployees || 0}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Deactivated</div>
        </div>

        {/* Present Today */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Present</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">{stats?.presentToday || 0}</div>
          <div className="text-[11px] text-emerald-600/80 font-medium mt-0.5">Today</div>
        </div>

        {/* Absent Today */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-600">Absent</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700 mt-2">{stats?.absentToday || 0}</div>
          <div className="text-[11px] text-rose-600/80 font-medium mt-0.5">Unrecorded / Off</div>
        </div>

        {/* On Leave */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">On Leave</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-700 mt-2">{stats?.onLeave || 0}</div>
          <div className="text-[11px] text-blue-600/80 font-medium mt-0.5">Approved leave</div>
        </div>

        {/* Half Day */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">Half Day</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-2">{stats?.halfDay || 0}</div>
          <div className="text-[11px] text-amber-600/80 font-medium mt-0.5">Partial hours</div>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Overview (Bar Chart) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Attendance Overview</h2>
              <p className="text-xs text-slate-500">Daily workforce distribution across the past 7 days</p>
            </div>
            <span className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-semibold rounded-lg">
              Last 7 Days
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceOverview} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: '#E2E8F0' }} fontSize={11} stroke="#64748B" />
                <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="#64748B" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Present" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="Absent" fill="#F43F5E" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="HalfDay" name="Half Day" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="Leave" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Distribution (Donut / Pie) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900">Department Distribution</h2>
            <p className="text-xs text-slate-500">Employee count allocated per department</p>
          </div>

          <div className="h-56 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departmentDistribution}
                  dataKey="count"
                  nameKey="Department"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {departmentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name) => [`${val} Employees`, name]}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 max-h-36 overflow-y-auto">
            {departmentDistribution.map((dept, idx) => (
              <div key={dept.Department} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-slate-700 font-medium">{dept.Department}</span>
                </div>
                <span className="text-slate-500 font-semibold">{dept.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Attendance Activity Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Attendance Activity</h2>
            <p className="text-xs text-slate-500">Latest recorded attendance logs from the database</p>
          </div>
          <button
            onClick={() => navigate('/attendance')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-6">Employee Code</th>
                <th className="py-3 px-6">Employee Name</th>
                <th className="py-3 px-6">Department</th>
                <th className="py-3 px-6">Attendance Status</th>
                <th className="py-3 px-6 text-center">In Time</th>
                <th className="py-3 px-6 text-center">Out Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {recentAttendance.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No recent attendance records found.
                  </td>
                </tr>
              ) : (
                recentAttendance.map((row) => (
                  <tr key={row.AttendanceID} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-6 font-semibold text-slate-900">{row.EmployeeCode}</td>
                    <td className="py-3 px-6 font-medium text-slate-800">{row.EmployeeName}</td>
                    <td className="py-3 px-6 text-slate-600">{row.Department}</td>
                    <td className="py-3 px-6">
                      <StatusBadge status={row.AttendanceStatus} />
                    </td>
                    <td className="py-3 px-6 text-center font-mono text-slate-600">
                      {row.InTime ? row.InTime.substring(0, 5) : '-'}
                    </td>
                    <td className="py-3 px-6 text-center font-mono text-slate-600">
                      {row.OutTime ? row.OutTime.substring(0, 5) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
