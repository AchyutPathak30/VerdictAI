import React from 'react';
import { CaseStatus, RiskLevel } from '../../types/dispute';

interface StatusBadgeProps {
  status: CaseStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = status.toLowerCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  if (normalized.includes('review') || normalized.includes('warning') || normalized === 'pending review') {
    styles = 'bg-amber-50 text-amber-700 border-amber-300';
    dotColor = 'bg-amber-500';
  } else if (normalized.includes('escalat') || normalized.includes('critical') || normalized === 'lost') {
    styles = 'bg-red-50 text-red-700 border-red-300';
    dotColor = 'bg-red-500';
  } else if (normalized.includes('auto-res') || normalized.includes('resolved') || normalized.includes('won') || normalized === 'stable' || normalized === 'completed' || normalized === 'attached') {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-300';
    dotColor = 'bg-emerald-500';
  } else if (normalized.includes('pending') || normalized.includes('evidence')) {
    styles = 'bg-slate-100 text-slate-600 border-slate-300';
    dotColor = 'bg-slate-400';
  } else if (normalized.includes('low')) {
    styles = 'bg-blue-50 text-blue-700 border-blue-200';
    dotColor = 'bg-blue-500';
  }

  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${padding} ${styles}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
      {status}
    </span>
  );
};

export const RiskDot: React.FC<{ level: RiskLevel }> = ({ level }) => {
  let color = 'bg-emerald-500';
  if (level === 'Medium') color = 'bg-amber-500';
  if (level === 'High') color = 'bg-red-500';

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
      <span className={`w-2 h-2 rounded-full ${color}`}></span>
      {level}
    </span>
  );
};
