import React from 'react';

const statusConfig = {
  Present: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  Absent: {
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
  },
  'Half Day': {
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  Leave: {
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
  },
  Holiday: {
    bg: 'bg-purple-50 text-purple-700 border-purple-200',
    dot: 'bg-purple-500',
  },
  'Weekly Off': {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  },
  Active: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  Inactive: {
    bg: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
  },
  'Not Marked': {
    bg: 'bg-zinc-100 text-zinc-500 border-zinc-200',
    dot: 'bg-zinc-400',
  },
  '-': {
    bg: 'bg-zinc-50 text-zinc-400 border-zinc-200',
    dot: 'bg-zinc-300',
  },
};

export default function StatusBadge({ status, showDot = true, size = 'sm' }) {
  const config = statusConfig[status] || {
    bg: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
  };

  const sizeClasses =
    size === 'xs'
      ? 'px-2 py-0.5 text-xs'
      : size === 'md'
      ? 'px-3 py-1 text-sm'
      : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${config.bg} ${sizeClasses}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />}
      {status || 'Not Marked'}
    </span>
  );
}
