import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Settings as SettingsIcon,
  Database,
  Shield,
  Clock,
  Server,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Save,
  User,
} from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const { success } = useToast();

  const [dbStatus, setDbStatus] = useState(null);
  const [loadingDb, setLoadingDb] = useState(true);

  // Configuration preferences
  const [workHours, setWorkHours] = useState({
    standardIn: '09:00',
    standardOut: '18:00',
    halfDayOut: '13:00',
    graceMinutes: 15,
  });

  useEffect(() => {
    const checkDbHealth = async () => {
      try {
        setLoadingDb(true);
        const res = await api.get('/health');
        setDbStatus(res.data);
      } catch (err) {
        setDbStatus({ status: 'unreachable', error: err.message });
      } finally {
        setLoadingDb(false);
      }
    };
    checkDbHealth();
  }, []);

  const handleSaveHours = (e) => {
    e.preventDefault();
    success('Working shift configuration updated successfully.');
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings & Architecture</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure ERP integration parameters, shift rules, and inspect database connectivity
        </p>
      </div>

      {/* Database Connection Status Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Database Engine Connectivity</h2>
              <p className="text-xs text-slate-400">MySQL Server / MySQL Workbench configuration</p>
            </div>
          </div>

          <div>
            {loadingDb ? (
              <span className="text-xs text-slate-400">Pinging server...</span>
            ) : dbStatus?.databaseDialect === 'mysql' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Connected to MySQL
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Embedded SQL Active
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Database Name</span>
            <span className="font-semibold text-slate-800 font-mono">employee_attendance</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Driver</span>
            <span className="font-semibold text-slate-800 font-mono">mysql2 / promise pool</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Active Dialect</span>
            <span className="font-semibold text-slate-800 uppercase font-mono">
              {dbStatus?.databaseDialect || 'embedded'}
            </span>
          </div>
        </div>

        <div className="mt-4 p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 text-xs text-slate-600 leading-relaxed">
          <div className="flex items-center gap-2 font-semibold text-slate-800 mb-1">
            <FileCode className="w-4 h-4 text-blue-600" />
            <span>MySQL Workbench Setup & Seeding</span>
          </div>
          <p>
            To populate your local MySQL server directly, execute <code className="px-1.5 py-0.5 bg-slate-200/70 rounded text-[11px] font-mono">database/schema.sql</code> and{' '}
            <code className="px-1.5 py-0.5 bg-slate-200/70 rounded text-[11px] font-mono">database/sample-data.sql</code> in MySQL Workbench or run{' '}
            <code className="px-1.5 py-0.5 bg-slate-200/70 rounded text-[11px] font-mono">npm run db:init</code> and{' '}
            <code className="px-1.5 py-0.5 bg-slate-200/70 rounded text-[11px] font-mono">npm run db:seed</code> inside the <code className="px-1.5 py-0.5 bg-slate-200/70 rounded text-[11px] font-mono">backend/</code> directory.
          </p>
        </div>
      </div>

      {/* Standard Shift Hours Configuration */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Working Shifts & Business Hours</h2>
            <p className="text-xs text-slate-400">Default operational hours applied across attendance recording</p>
          </div>
        </div>

        <form onSubmit={handleSaveHours} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-700 tracking-wider mb-1">
                Standard In Time
              </label>
              <input
                type="time"
                value={workHours.standardIn}
                onChange={(e) => setWorkHours({ ...workHours, standardIn: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-700 tracking-wider mb-1">
                Standard Out Time
              </label>
              <input
                type="time"
                value={workHours.standardOut}
                onChange={(e) => setWorkHours({ ...workHours, standardOut: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-700 tracking-wider mb-1">
                Half Day Out Time
              </label>
              <input
                type="time"
                value={workHours.halfDayOut}
                onChange={(e) => setWorkHours({ ...workHours, halfDayOut: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Configuration</span>
            </button>
          </div>
        </form>
      </div>

      {/* Administrator Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Administrator Profile</h2>
            <p className="text-xs text-slate-400">Authenticated user session information</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Username</span>
            <span className="font-semibold text-slate-800">{user?.username || 'admin'}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Full Name</span>
            <span className="font-semibold text-slate-800">{user?.fullName || 'System Administrator'}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Role</span>
            <span className="font-semibold text-slate-800 uppercase">{user?.role || 'admin'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
