import React from 'react';

interface ProgressBarProps {
  label: string;
  value: number; // 0 to 100
  color?: 'green' | 'blue' | 'amber' | 'red';
  showPercentage?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  label,
  value,
  color = 'green',
  showPercentage = true,
}) => {
  let barColor = 'bg-emerald-500';
  if (color === 'blue') barColor = 'bg-blue-600';
  if (color === 'amber') barColor = 'bg-amber-500';
  if (color === 'red') barColor = 'bg-red-500';

  return (
    <div className="w-full">
      <div className="flex justify-between items-center text-xs mb-1.5">
        <span className="text-slate-700 font-medium">{label}</span>
        {showPercentage && (
          <span className="text-slate-500 font-semibold">{value}%</span>
        )}
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
          style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
        />
      </div>
    </div>
  );
};
