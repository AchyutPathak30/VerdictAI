import React, { useState, useId } from 'react';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
  percentage?: number;
  count?: number;
}

interface DonutChartProps {
  data: DonutSegment[];
  title?: string;
  subtitle?: string;
  totalLabel?: string;
  aiInsight?: string;
  size?: number;
  thickness?: number;
  className?: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  title,
  subtitle,
  totalLabel = 'Total Claims',
  aiInsight,
  size = 200,
  thickness = 26,
  className = '',
}) => {
  const chartId = useId().replace(/:/g, '');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const totalValue = data.reduce((acc, d) => acc + (d.value || d.percentage || 0), 0);
  const totalCount = data.reduce((acc, d) => acc + (d.count || d.value || 0), 0);

  // SVG dimensions
  const center = size / 2;
  const radius = center - thickness / 2 - 8;
  const circumference = 2 * Math.PI * radius;

  // Compute stroke offsets
  let accumulatedAngle = 0;
  const segmentsWithAngles = data.map((d) => {
    const rawVal = d.percentage ?? (totalValue > 0 ? (d.value / totalValue) * 100 : 0);
    const sliceAngle = (rawVal / 100) * circumference;
    const offset = circumference - accumulatedAngle;
    accumulatedAngle += sliceAngle;
    return {
      ...d,
      pct: rawVal,
      sliceAngle,
      offset,
    };
  });

  const activeSegment = hoveredIdx !== null ? segmentsWithAngles[hoveredIdx] : null;

  return (
    <div
      className={`w-full bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-card transition-all duration-300 hover:shadow-md ${className}`}
    >
      {/* Title & Subtitle */}
      {(title || subtitle) && (
        <div className="mb-4 pb-3 border-b border-slate-100">
          {title && (
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      )}

      {/* Main Grid: Donut + Legend */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
        {/* SVG Donut Circle */}
        <div
          className="relative shrink-0 flex items-center justify-center"
          style={{ width: `${size}px`, height: `${size}px` }}
        >
          <svg
            viewBox={`0 0 ${size} ${size}`}
            className="w-full h-full transform -rotate-90 overflow-visible"
          >
            <defs>
              <filter id={`${chartId}-donut-shadow`} x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0F172A" floodOpacity="0.15" />
              </filter>
            </defs>

            {/* Background Track Ring */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="#F1F5F9"
              strokeWidth={thickness}
            />

            {/* Segments */}
            {segmentsWithAngles.map((segment, idx) => {
              const isHovered = hoveredIdx === idx;
              return (
                <circle
                  key={idx}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={isHovered ? thickness + 4 : thickness}
                  strokeDasharray={`${segment.sliceAngle} ${circumference - segment.sliceAngle}`}
                  strokeDashoffset={segment.offset}
                  strokeLinecap="butt"
                  filter={isHovered ? `url(#${chartId}-donut-shadow)` : undefined}
                  className="cursor-pointer transition-all duration-300 ease-out"
                  style={{
                    transformOrigin: `${center}px ${center}px`,
                    opacity: hoveredIdx === null || isHovered ? 1 : 0.65,
                  }}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              );
            })}
          </svg>

          {/* Central Metric Readout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
            {activeSegment ? (
              <div className="animate-in fade-in zoom-in-95 duration-150">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none block">
                  {Math.round(activeSegment.pct)}%
                </span>
                <span className="text-[11px] font-bold text-slate-700 mt-1 block truncate max-w-[110px]">
                  {activeSegment.label}
                </span>
                {activeSegment.count !== undefined && (
                  <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                    {activeSegment.count.toLocaleString()} cases
                  </span>
                )}
              </div>
            ) : (
              <div>
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none block">
                  {totalCount > 0 ? totalCount.toLocaleString() : '100%'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1 block">
                  {totalLabel}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Legend Panel */}
        <div className="w-full sm:flex-1 space-y-2.5">
          {segmentsWithAngles.map((segment, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`p-2.5 rounded-lg border transition-all duration-200 cursor-pointer flex items-center justify-between ${
                  isHovered
                    ? 'border-blue-300 bg-blue-50/50 shadow-xs'
                    : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 transition-transform duration-200"
                    style={{
                      backgroundColor: segment.color,
                      transform: isHovered ? 'scale(1.2)' : 'scale(1)',
                    }}
                  />
                  <span className="text-xs font-semibold text-slate-800 truncate">
                    {segment.label}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {segment.count !== undefined && (
                    <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                      {segment.count.toLocaleString()}
                    </span>
                  )}
                  <span className="text-xs font-bold text-slate-900 font-mono bg-slate-100 px-2 py-0.5 rounded">
                    {Math.round(segment.pct)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Optional Embedded Proactive AI Advisory Box */}
      {aiInsight && (
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-start gap-2.5 p-3 rounded-lg bg-blue-50/60 border border-blue-100/80">
          <span className="text-blue-600 text-sm shrink-0 mt-0.5">💡</span>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-900 block">
              Proactive AI Insight
            </span>
            <p className="text-xs text-blue-950 font-medium leading-relaxed mt-0.5">
              {aiInsight}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

