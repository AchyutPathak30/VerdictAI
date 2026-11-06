import React, { useState } from 'react';

interface ProgressBarProps {
  label: string;
  value: number; // 0 to 100
  color?: 'green' | 'blue' | 'amber' | 'red';
  showPercentage?: boolean;
  subtitle?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  label,
  value,
  color = 'green',
  showPercentage = true,
  subtitle,
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const safeValue = Math.min(Math.max(value, 0), 100);

  let gradientClasses = 'from-emerald-500 to-teal-400';
  let badgeClasses = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  let glowColor = 'rgba(16, 185, 129, 0.25)';

  if (color === 'blue') {
    gradientClasses = 'from-blue-600 to-indigo-500';
    badgeClasses = 'text-blue-700 bg-blue-50 border-blue-200';
    glowColor = 'rgba(37, 99, 235, 0.25)';
  } else if (color === 'amber') {
    gradientClasses = 'from-amber-500 to-orange-400';
    badgeClasses = 'text-amber-800 bg-amber-50 border-amber-200';
    glowColor = 'rgba(245, 158, 11, 0.25)';
  } else if (color === 'red') {
    gradientClasses = 'from-rose-500 to-red-500';
    badgeClasses = 'text-rose-700 bg-rose-50 border-rose-200';
    glowColor = 'rgba(239, 68, 68, 0.25)';
  }

  return (
    <div
      className={`w-full group select-none ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex justify-between items-center text-xs mb-1.5 gap-2">
        <div className="truncate flex-1">
          <span className="text-slate-700 font-semibold truncate block">
            {label}
          </span>
          {subtitle && (
            <span className="text-[10px] text-slate-400 block truncate">
              {subtitle}
            </span>
          )}
        </div>
        {showPercentage && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${badgeClasses} transition-all duration-200`}
            >
              Weight
            </span>
            <span className="text-slate-800 font-mono font-bold text-xs">
              {safeValue}%
            </span>
          </div>
        )}
      </div>

      {/* Bar Track */}
      <div className="w-full bg-slate-100/90 rounded-full h-2.5 overflow-hidden p-[1px] relative">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${gradientClasses} transition-all duration-700 ease-out`}
          style={{
            width: `${safeValue}%`,
            boxShadow: isHovered ? `0 0 8px ${glowColor}` : undefined,
          }}
        />
      </div>
    </div>
  );
};
