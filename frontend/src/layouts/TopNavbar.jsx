import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Menu,
  Bell,
  Calendar,
  LogOut,
  User,
  ChevronDown,
  CheckCircle,
} from 'lucide-react';

export default function TopNavbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
        setNotificationOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format today date nicely
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Breadcrumb path title
  const getBreadcrumb = () => {
    const p = location.pathname;
    if (p === '/') return 'Dashboard';
    if (p.startsWith('/employees')) return 'Employees';
    if (p.startsWith('/attendance')) return 'Daily Attendance';
    if (p.startsWith('/reports')) return 'Reports & Analytics';
    if (p.startsWith('/settings')) return 'Settings';
    return 'Overview';
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30 no-print">
      {/* Left: Mobile hamburger & Breadcrumb */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 lg:hidden focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-sm">
          <Link to="/" className="text-slate-400 hover:text-slate-600 font-medium transition">
            Home
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-semibold text-slate-800">{getBreadcrumb()}</span>
        </div>
      </div>

      {/* Right: Date, Notifications, User profile */}
      <div className="flex items-center gap-4 lg:gap-6" ref={dropdownRef}>
        {/* Date Display */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600">
          <Calendar className="w-3.5 h-3.5 text-blue-600" />
          <span>{todayFormatted}</span>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setNotificationOpen(!notificationOpen);
              setDropdownOpen(false);
            }}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg relative transition"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full" />
          </button>

          {notificationOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-1">
              <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500">Notifications</span>
                <span className="text-[11px] text-blue-600 font-medium">All caught up</span>
              </div>
              <div className="px-4 py-3 text-xs text-slate-600 flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-slate-800">System Online</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Attendance records and reporting engine running smoothly.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => {
              setDropdownOpen(!dropdownOpen);
              setNotificationOpen(false);
            }}
            className="flex items-center gap-3 p-1.5 pr-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-semibold text-xs">
              {user?.fullName ? user.fullName.charAt(0) : 'A'}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-slate-800 leading-tight">
                {user?.fullName || 'Administrator'}
              </div>
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                {user?.role || 'Admin'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* User Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-800">{user?.fullName || 'Administrator'}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email || 'admin@enterprise.local'}</p>
              </div>

              <Link
                to="/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition"
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>Account & Settings</span>
              </Link>

              <div className="border-t border-slate-100 my-1" />

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition font-medium text-left"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
