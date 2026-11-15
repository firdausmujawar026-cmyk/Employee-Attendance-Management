import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../context/ToastContext';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Edit,
  Eye,
  Power,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  Building,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  CheckCircle,
} from 'lucide-react';

export default function Employees() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { success, error: toastError } = useToast();

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('ALL');
  const [status, setStatus] = useState('ALL');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Form state
  const initialFormState = {
    EmployeeCode: '',
    EmployeeName: '',
    Department: '',
    Designation: '',
    MobileNo: '',
    EmailID: '',
    DateOfJoining: new Date().toISOString().split('T')[0],
    IsActive: 1,
  };
  const [formData, setFormData] = useState(initialFormState);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Check URL query param for quick action
  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setShowAddModal(true);
      // clean param
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // Load departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await api.get('/employees/departments');
        if (res.data.success) {
          setDepartments(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load departments:', err);
      }
    };
    fetchDepartments();
  }, []);

  // Fetch employees list
  const fetchEmployees = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.get('/employees', {
        params: {
          page,
          limit: pagination.limit,
          search: search.trim(),
          department,
          status,
        },
      });

      if (res.data.success) {
        setEmployees(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to load employees.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees(1);
  }, [department, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEmployees(1);
  };

  // Add Employee Handler
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Pre-validations
    if (!formData.EmployeeCode.trim()) {
      setFormError('Employee Code is required.');
      return;
    }
    if (!formData.EmployeeName.trim()) {
      setFormError('Employee Name is required.');
      return;
    }
    if (!formData.Department.trim()) {
      setFormError('Department is required.');
      return;
    }
    if (!formData.DateOfJoining) {
      setFormError('Date of Joining is required.');
      return;
    }

    const doj = new Date(formData.DateOfJoining);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (doj > today) {
      setFormError('Date of Joining cannot be in the future.');
      return;
    }

    try {
      setFormSubmitting(true);
      const res = await api.post('/employees', formData);
      if (res.data.success) {
        success(`Employee ${formData.EmployeeName} added successfully.`);
        setShowAddModal(false);
        setFormData(initialFormState);
        fetchEmployees(1);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error saving employee.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Edit Employee Handler
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.EmployeeName.trim()) {
      setFormError('Employee Name is required.');
      return;
    }
    if (!formData.Department.trim()) {
      setFormError('Department is required.');
      return;
    }

    try {
      setFormSubmitting(true);
      const res = await api.put(`/employees/${selectedEmployee.EmployeeID}`, formData);
      if (res.data.success) {
        success(`Employee ${formData.EmployeeName} updated successfully.`);
        setShowEditModal(false);
        fetchEmployees(pagination.page);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error updating employee.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Status Toggle Handler
  const handleToggleStatus = async () => {
    if (!selectedEmployee) return;
    const newStatus = !selectedEmployee.IsActive;

    try {
      setFormSubmitting(true);
      const res = await api.patch(`/employees/${selectedEmployee.EmployeeID}/status`, {
        isActive: newStatus,
      });

      if (res.data.success) {
        success(
          `Employee ${selectedEmployee.EmployeeName} has been ${
            newStatus ? 'activated' : 'deactivated'
          }.`
        );
        setShowStatusModal(false);
        fetchEmployees(pagination.page);
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update employee status.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const openEditModal = (emp) => {
    setSelectedEmployee(emp);
    setFormData({
      EmployeeCode: emp.EmployeeCode,
      EmployeeName: emp.EmployeeName,
      Department: emp.Department,
      Designation: emp.Designation || '',
      MobileNo: emp.MobileNo || '',
      EmailID: emp.EmailID || '',
      DateOfJoining: emp.DateOfJoining ? emp.DateOfJoining.split('T')[0] : '',
      IsActive: emp.IsActive ? 1 : 0,
    });
    setFormError('');
    setShowEditModal(true);
  };

  const openViewModal = (emp) => {
    setSelectedEmployee(emp);
    setShowViewModal(true);
  };

  const openStatusModal = (emp) => {
    setSelectedEmployee(emp);
    setShowStatusModal(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Employee Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Maintain employee records, contact details, designations and activation status
          </p>
        </div>

        <button
          onClick={() => {
            setFormData(initialFormState);
            setFormError('');
            setShowAddModal(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition shadow-sm shadow-blue-500/20 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, name or email..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
          />
        </form>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Department Filter */}
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          >
            <option value="ALL">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-5">ID</th>
                <th className="py-3.5 px-5">Code</th>
                <th className="py-3.5 px-5">Employee Name</th>
                <th className="py-3.5 px-5">Department</th>
                <th className="py-3.5 px-5">Designation</th>
                <th className="py-3.5 px-5">Mobile</th>
                <th className="py-3.5 px-5">Joining Date</th>
                <th className="py-3.5 px-5 text-center">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-slate-400 mt-2 font-medium">Fetching employee directory...</p>
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No employees matching the selected criteria.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.EmployeeID} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-5 font-mono text-slate-400">#{emp.EmployeeID}</td>
                    <td className="py-3.5 px-5 font-bold text-slate-900">{emp.EmployeeCode}</td>
                    <td className="py-3.5 px-5 font-medium text-slate-800">
                      <div>{emp.EmployeeName}</div>
                      <div className="text-[11px] text-slate-400">{emp.EmailID || 'No email provided'}</div>
                    </td>
                    <td className="py-3.5 px-5 text-slate-600 font-medium">{emp.Department}</td>
                    <td className="py-3.5 px-5 text-slate-500">{emp.Designation || '-'}</td>
                    <td className="py-3.5 px-5 font-mono text-slate-600">{emp.MobileNo || '-'}</td>
                    <td className="py-3.5 px-5 text-slate-600">
                      {emp.DateOfJoining ? emp.DateOfJoining.split('T')[0] : '-'}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <StatusBadge status={emp.IsActive ? 'Active' : 'Inactive'} />
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openViewModal(emp)}
                          title="View Details"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(emp)}
                          title="Edit Employee"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openStatusModal(emp)}
                          title={emp.IsActive ? 'Deactivate Employee' : 'Activate Employee'}
                          className={`p-1.5 rounded-lg transition ${
                            emp.IsActive
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-700">{employees.length}</span> of{' '}
            <span className="font-semibold text-slate-700">{pagination.total}</span> employees
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => fetchEmployees(pagination.page - 1)}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium text-slate-700">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchEmployees(pagination.page + 1)}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ADD EMPLOYEE MODAL */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Add New Employee</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-700 tracking-wider mb-1">
                    Employee Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={20}
                    placeholder="e.g. EMP016"
                    value={formData.EmployeeCode}
                    onChange={(e) => setFormData({ ...formData, EmployeeCode: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-700 tracking-wider mb-1">
                    Employee Name *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={150}
                    placeholder="Full legal name"
                    value={formData.EmployeeName}
                    onChange={(e) => setFormData({ ...formData, EmployeeName: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-700 tracking-wider mb-1">
                    Department *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    list="dept-options"
                    placeholder="e.g. Engineering"
                    value={formData.Department}
                    onChange={(e) => setFormData({ ...formData, Department: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                  <datalist id="dept-options">
                    {departments.map((d) => (
                      <option key={d} value={d} />
                    ))}
                    <option value="Engineering" />
                    <option value="Human Resources" />
                    <option value="Finance" />
                    <option value="Marketing" />
                    <option value="Sales" />
                    <option value="Operations" />
                  </datalist>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-700 tracking-wider mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    placeholder="e.g. Lead Engineer"
                    value={formData.Designation}
                    onChange={(e) => setFormData({ ...formData, Designation: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-700 tracking-wider mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    maxLength={15}
                    placeholder="+15551234567"
                    value={formData.MobileNo}
                    onChange={(e) => setFormData({ ...formData, MobileNo: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-700 tracking-wider mb-1">
                    Email ID
                  </label>
                  <input
                    type="email"
                    maxLength={150}
                    placeholder="employee@enterprise.com"
                    value={formData.EmailID}
                    onChange={(e) => setFormData({ ...formData, EmailID: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-700 tracking-wider mb-1">
                    Date of Joining *
                  </label>
                  <input
                    type="date"
                    required
                    max={new Date().toISOString().split('T')[0]}
                    value={formData.DateOfJoining}
                    onChange={(e) => setFormData({ ...formData, DateOfJoining: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-700 tracking-wider mb-1">
                    Active Status
                  </label>
                  <select
                    value={formData.IsActive}
                    onChange={(e) => setFormData({ ...formData, IsActive: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
                >
                  {formSubmitting ? 'Creating...' : 'Save Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* EDIT EMPLOYEE MODAL */}
      {/* ======================================================== */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Edit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Edit Employee</h3>
                  <p className="text-[11px] text-slate-400">Code: {formData.EmployeeCode}</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-700 tracking-wider mb-1">
                    Employee Code
                  </label>
                  <input
                    type="text"
                    disabled
                    value={formData.EmployeeCode}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-700 tracking-wider mb-1">
                    Employee Name *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={150}
                    value={formData.EmployeeName}
                    onChange={(e) => setFormData({ ...formData, EmployeeName: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-700 tracking-wider mb-1">
                    Department *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={formData.Department}
                    onChange={(e) => setFormData({ ...formData, Department: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-700 tracking-wider mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={formData.Designation}
                    onChange={(e) => setFormData({ ...formData, Designation: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-700 tracking-wider mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    maxLength={15}
                    value={formData.MobileNo}
                    onChange={(e) => setFormData({ ...formData, MobileNo: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-700 tracking-wider mb-1">
                    Email ID
                  </label>
                  <input
                    type="email"
                    maxLength={150}
                    value={formData.EmailID}
                    onChange={(e) => setFormData({ ...formData, EmailID: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-700 tracking-wider mb-1">
                    Date of Joining *
                  </label>
                  <input
                    type="date"
                    required
                    max={new Date().toISOString().split('T')[0]}
                    value={formData.DateOfJoining}
                    onChange={(e) => setFormData({ ...formData, DateOfJoining: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-700 tracking-wider mb-1">
                    Active Status
                  </label>
                  <select
                    value={formData.IsActive}
                    onChange={(e) => setFormData({ ...formData, IsActive: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
                >
                  {formSubmitting ? 'Updating...' : 'Update Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW DETAILS MODAL */}
      {/* ======================================================== */}
      {showViewModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                  {selectedEmployee.EmployeeName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{selectedEmployee.EmployeeName}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs text-slate-500">{selectedEmployee.EmployeeCode}</span>
                    <StatusBadge status={selectedEmployee.IsActive ? 'Active' : 'Inactive'} size="xs" />
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-3.5 text-xs">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
                <Building className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Department</span>
                  <span className="font-semibold text-slate-800">{selectedEmployee.Department}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
                <Briefcase className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Designation</span>
                  <span className="font-semibold text-slate-800">{selectedEmployee.Designation || 'Not Assigned'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
                <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Email Address</span>
                  <span className="font-semibold text-slate-800">{selectedEmployee.EmailID || 'Not Provided'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
                <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Mobile Number</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {selectedEmployee.MobileNo || 'Not Provided'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
                <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Date of Joining</span>
                  <span className="font-semibold text-slate-800">
                    {selectedEmployee.DateOfJoining ? selectedEmployee.DateOfJoining.split('T')[0] : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ACTIVATE / DEACTIVATE CONFIRMATION MODAL */}
      {/* ======================================================== */}
      {showStatusModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <h3 className="font-bold text-slate-900 text-sm">
              {selectedEmployee.IsActive ? 'Deactivate Employee' : 'Activate Employee'}
            </h3>

            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Are you sure you want to{' '}
              <span className="font-semibold text-slate-800">
                {selectedEmployee.IsActive ? 'deactivate' : 'activate'}
              </span>{' '}
              <span className="font-semibold text-slate-900">{selectedEmployee.EmployeeName}</span> (
              {selectedEmployee.EmployeeCode})?
              {selectedEmployee.IsActive &&
                ' Deactivated employees cannot receive new attendance records but their historical attendance remains preserved.'}
            </p>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={formSubmitting}
                onClick={handleToggleStatus}
                className={`px-4 py-2 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50 ${
                  selectedEmployee.IsActive ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {formSubmitting
                  ? 'Updating...'
                  : selectedEmployee.IsActive
                  ? 'Confirm Deactivation'
                  : 'Confirm Activation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
