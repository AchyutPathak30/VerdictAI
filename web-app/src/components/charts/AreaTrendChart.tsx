import React, { useState, useId } from 'react';

export interface AreaSeries {
  key: string;
  label: string;
  color: string;
  strokeWidth?: number;
}

export interface AreaDataPoint {
  label: string;
  [key: string]: string | number;
}

interface AreaTrendChartProps {
  data: AreaDataPoint[];
  series: AreaSeries[];
  height?: number;
  title?: string;
  subtitle?: string;
  valueFormatter?: (value: number) => string;
  showGridLines?: boolean;
  className?: string;
}

// Generate smooth cubic bezier SVG path
function getCubicSplinePath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  let path = `M ${points[0].x},${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const prev = points[i - 1] || current;
    const afterNext = points[i + 2] || next;

    // Catmull-Rom to Cubic Bezier conversion
    const tension = 0.25;
    const cp1x = current.x + (next.x - prev.x) * tension;
    const cp1y = current.y + (next.y - prev.y) * tension;
    const cp2x = next.x - (afterNext.x - current.x) * tension;
    const cp2y = next.y - (afterNext.y - current.y) * tension;

    path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${next.x},${next.y}`;
  }

  return path;
}

export const AreaTrendChart: React.FC<AreaTrendChartProps> = ({
  data,
  series,
  height = 250,
  title,
  subtitle,
  valueFormatter = (v) => v.toLocaleString(),
  showGridLines = true,
  className = '',
}) => {
  const chartId = useId().replace(/:/g, '');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeSeriesKeys, setActiveSeriesKeys] = useState<string[]>(
    series.map((s) => s.key)
  );

  const svgWidth = 600;
  const svgHeight = height;
  const padding = { top: 20, right: 24, bottom: 36, left: 45 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  const visibleSeries = series.filter((s) => activeSeriesKeys.includes(s.key));

  const allValues = data.flatMap((d) =>
    visibleSeries.map((s) => Number(d[s.key]) || 0)
  );
  const rawMax = Math.max(...allValues, 10);
  const roundFactor = Math.pow(10, Math.floor(Math.log10(rawMax)));
  const yMax = Math.ceil(rawMax / roundFactor) * roundFactor || 100;

  const yTicks = [0, yMax * 0.33, yMax * 0.66, yMax].map((v) => Math.round(v));

  // Compute X and Y positions
  const getX = (idx: number) => {
    if (data.length <= 1) return padding.left + chartWidth / 2;
    return padding.left + (idx / (data.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    return padding.top + chartHeight - (val / yMax) * chartHeight;
  };

  const toggleSeries = (key: string) => {
    setActiveSeriesKeys((prev) => {
      if (prev.includes(key)) {
        if (prev.length === 1) return prev;
        return prev.filter((k) => k !== key);
      }
      return [...prev, key];
    });
  };

  const hoveredData = hoveredIndex !== null ? data[hoveredIndex] : null;

  return (
    <div
      className={`w-full bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-card transition-all duration-300 hover:shadow-md ${className}`}
    >
      {/* Chart Header */}
      {(title || series.length > 0) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            {title && (
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>

          {/* Interactive Legend */}
          <div className="flex flex-wrap items-center gap-2">
            {series.map((s) => {
              const isVisible = activeSeriesKeys.includes(s.key);
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => toggleSeries(s.key)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    isVisible
                      ? 'bg-slate-100/90 text-slate-800 shadow-xs'
                      : 'bg-slate-50 text-slate-400 opacity-60 line-through'
                  }`}
                >
                  <span
                    className="w-2.5 h-1 rounded-full transition-all"
                    style={{
                      backgroundColor: isVisible ? s.color : '#CBD5E1',
                    }}
                  />
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible block"
          style={{ minHeight: `${height * 0.75}px` }}
        >
          <defs>
            {/* Area Fill Gradients */}
            {series.map((s) => (
              <linearGradient
                key={s.key}
                id={`${chartId}-area-${s.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={s.color} stopOpacity="0.28" />
                <stop offset="65%" stopColor={s.color} stopOpacity="0.08" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.0" />
              </linearGradient>
            ))}

            {/* Glowing line filter */}
            <filter
              id={`${chartId}-glow`}
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
            >
              <feDropShadow
                dx="0"
                dy="2"
                stdDeviation="2"
                floodColor="#0F172A"
                floodOpacity="0.1"
              />
            </filter>
          </defs>

          {/* Grid lines & Y Axis */}
          {yTicks.map((tick, i) => {
            const yPos = getY(tick);
            return (
              <g key={i}>
                {showGridLines && (
                  <line
                    x1={padding.left}
                    y1={yPos}
                    x2={padding.left + chartWidth}
                    y2={yPos}
                    stroke="#E2E8F0"
                    strokeDasharray={i === 0 ? undefined : '4 4'}
                    strokeWidth={i === 0 ? '1.5' : '1'}
                    className="opacity-70"
                  />
                )}
                <text
                  x={padding.left - 8}
                  y={yPos + 3}
                  textAnchor="end"
                  className="fill-slate-400 font-mono text-[9px] font-medium"
                >
                  {valueFormatter(tick)}
                </text>
              </g>
            );
          })}

          {/* Series Curves and Area Fills */}
          {visibleSeries.map((s) => {
            const points = data.map((d, i) => ({
              x: getX(i),
              y: getY(Number(d[s.key]) || 0),
            }));

            const linePath = getCubicSplinePath(points);
            const firstPt = points[0];
            const lastPt = points[points.length - 1];
            const bottomY = padding.top + chartHeight;
            const areaPath = `${linePath} L ${lastPt.x},${bottomY} L ${firstPt.x},${bottomY} Z`;

            return (
              <g key={s.key} className="transition-opacity duration-300">
                {/* Gradient Area Fill */}
                <path
                  d={areaPath}
                  fill={`url(#${chartId}-area-${s.key})`}
                  className="transition-all duration-500 ease-out"
                />

                {/* Spline Curve Stroke */}
                <path
                  d={linePath}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={s.strokeWidth || 2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter={`url(#${chartId}-glow)`}
                  className="transition-all duration-500 ease-out"
                />

                {/* Data Points */}
                {points.map((pt, idx) => {
                  const isHovered = hoveredIndex === idx;
                  return (
                    <g key={idx}>
                      {/* Pulse halo on hover */}
                      {isHovered && (
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="7"
                          fill={s.color}
                          fillOpacity="0.2"
                          className="animate-ping"
                        />
                      )}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? '4.5' : '3'}
                        fill="#FFFFFF"
                        stroke={s.color}
                        strokeWidth={isHovered ? '2.5' : '2'}
                        className="transition-all duration-200"
                      />
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Interactive Vertical Guide Line */}
          {hoveredIndex !== null && (
            <line
              x1={getX(hoveredIndex)}
              y1={padding.top}
              x2={getX(hoveredIndex)}
              y2={padding.top + chartHeight}
              stroke="#64748B"
              strokeDasharray="3 3"
              strokeWidth="1.2"
              className="transition-all duration-150"
            />
          )}

          {/* Invisible Overlay Pillars for Hover Detection */}
          {data.map((item, idx) => {
            const colWidth = chartWidth / (data.length - 1 || 1);
            const x = Math.max(padding.left, getX(idx) - colWidth / 2);
            return (
              <rect
                key={idx}
                x={x}
                y={padding.top}
                width={colWidth}
                height={chartHeight + 25}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}

          {/* X-axis Labels */}
          {data.map((item, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <text
                key={idx}
                x={getX(idx)}
                y={padding.top + chartHeight + 18}
                textAnchor="middle"
                className={`text-[10px] font-semibold transition-colors duration-200 ${
                  isHovered
                    ? 'fill-blue-600 font-bold'
                    : 'fill-slate-500'
                }`}
              >
                {item.label}
              </text>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredIndex !== null && hoveredData && (
          <div
            className="pointer-events-none absolute z-20 transition-all duration-150 ease-out bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2.5 rounded-lg shadow-elevated border border-slate-700/60 text-xs min-w-[130px]"
            style={{
              left: `${Math.max(16, Math.min(84, (getX(hoveredIndex) / svgWidth) * 100))}%`,
              top: '8px',
              transform: 'translateX(-50%)',
            }}
          >
            <div className="font-bold text-slate-100 border-b border-slate-700/60 pb-1 mb-1.5 flex items-center justify-between">
              <span>{hoveredData.label}</span>
              <span className="text-[10px] font-mono text-slate-400">Trend</span>
            </div>
            <div className="space-y-1">
              {visibleSeries.map((s) => {
                const val = Number(hoveredData[s.key]) || 0;
                return (
                  <div
                    key={s.key}
                    className="flex items-center justify-between gap-3 text-[11px]"
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="text-slate-300 font-medium truncate max-w-[90px]">
                        {s.label}:
                      </span>
                    </div>
                    <span className="font-mono font-bold text-white">
                      {valueFormatter(val)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
