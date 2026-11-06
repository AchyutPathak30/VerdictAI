import React, { useState, useId } from 'react';

export interface BarSeries {
  key: string;
  label: string;
  color: string;
  gradientTo?: string;
}

export interface BarChartDataPoint {
  label: string;
  [key: string]: string | number;
}

interface BarChartProps {
  data: BarChartDataPoint[];
  series: BarSeries[];
  height?: number;
  title?: string;
  subtitle?: string;
  valueFormatter?: (value: number) => string;
  showGridLines?: boolean;
  className?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  series,
  height = 260,
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

  // SVG coordinate system
  const svgWidth = 600;
  const svgHeight = height;
  const padding = { top: 20, right: 20, bottom: 36, left: 45 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  // Filter series based on user toggle
  const visibleSeries = series.filter((s) => activeSeriesKeys.includes(s.key));

  // Compute max value for Y scale
  const allValues = data.flatMap((d) =>
    visibleSeries.map((s) => Number(d[s.key]) || 0)
  );
  const rawMax = Math.max(...allValues, 10);
  // Round up to clean round number
  const roundFactor = Math.pow(10, Math.floor(Math.log10(rawMax)));
  const yMax = Math.ceil(rawMax / roundFactor) * roundFactor || 100;

  // Generate 4 Y-ticks
  const yTicks = [0, yMax * 0.33, yMax * 0.66, yMax].map((v) => Math.round(v));

  // Bar group layout
  const groupCount = data.length;
  const groupWidth = chartWidth / (groupCount || 1);
  const barGap = 3;
  const groupPadding = Math.max(groupWidth * 0.18, 6);
  const availableGroupWidth = groupWidth - groupPadding * 2;
  const singleBarWidth = Math.max(
    Math.min(
      (availableGroupWidth - (visibleSeries.length - 1) * barGap) /
        (visibleSeries.length || 1),
      28
    ),
    6
  );

  const toggleSeries = (key: string) => {
    setActiveSeriesKeys((prev) => {
      if (prev.includes(key)) {
        if (prev.length === 1) return prev; // Keep at least one visible
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
      {/* Header with Title and Interactive Series Legend */}
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

          {/* Interactive Legend Pills */}
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
                  title={`Toggle ${s.label}`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-sm transition-transform duration-200"
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

      {/* Responsive Chart Viewport with Tooltip */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible block"
          style={{ minHeight: `${height * 0.75}px` }}
        >
          {/* Gradients */}
          <defs>
            {series.map((s) => (
              <linearGradient
                key={s.key}
                id={`${chartId}-grad-${s.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={s.color} stopOpacity="0.95" />
                <stop
                  offset="100%"
                  stopColor={s.gradientTo || s.color}
                  stopOpacity="0.75"
                />
              </linearGradient>
            ))}
            {/* Hover shadow filter */}
            <filter
              id={`${chartId}-bar-glow`}
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
            >
              <feDropShadow
                dx="0"
                dy="2"
                stdDeviation="3"
                floodColor="#0F172A"
                floodOpacity="0.12"
              />
            </filter>
          </defs>

          {/* Grid lines & Y-axis labels */}
          {yTicks.map((tick, i) => {
            const yPos = padding.top + chartHeight - (tick / yMax) * chartHeight;
            return (
              <g key={i} className="transition-opacity duration-300">
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

          {/* Bar Groups */}
          {data.map((item, groupIdx) => {
            const groupCenterX =
              padding.left + groupIdx * groupWidth + groupWidth / 2;
            const totalBarsWidth =
              visibleSeries.length * singleBarWidth +
              (visibleSeries.length - 1) * barGap;
            const groupStartX = groupCenterX - totalBarsWidth / 2;
            const isHovered = hoveredIndex === groupIdx;

            return (
              <g
                key={groupIdx}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(groupIdx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Hover Backdrop Pillar */}
                <rect
                  x={padding.left + groupIdx * groupWidth + 2}
                  y={padding.top}
                  width={groupWidth - 4}
                  height={chartHeight}
                  rx="6"
                  fill="#F8FAFC"
                  className={`transition-opacity duration-200 ${
                    isHovered ? 'opacity-90' : 'opacity-0'
                  }`}
                />

                {/* Individual Bars for Each Series */}
                {visibleSeries.map((s, seriesIdx) => {
                  const val = Number(item[s.key]) || 0;
                  const barHeight = Math.max(
                    (val / yMax) * chartHeight,
                    val > 0 ? 3 : 0
                  );
                  const barX =
                    groupStartX + seriesIdx * (singleBarWidth + barGap);
                  const barY = padding.top + chartHeight - barHeight;

                  return (
                    <g key={s.key}>
                      <rect
                        x={barX}
                        y={barY}
                        width={singleBarWidth}
                        height={barHeight}
                        rx="3"
                        ry="3"
                        fill={`url(#${chartId}-grad-${s.key})`}
                        filter={
                          isHovered ? `url(#${chartId}-bar-glow)` : undefined
                        }
                        className="transition-all duration-300 ease-out hover:opacity-100"
                        style={{
                          transformOrigin: `${barX + singleBarWidth / 2}px ${
                            padding.top + chartHeight
                          }px`,
                          opacity:
                            hoveredIndex === null || isHovered ? 1 : 0.75,
                        }}
                      />
                    </g>
                  );
                })}

                {/* X-axis Label */}
                <text
                  x={groupCenterX}
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
              </g>
            );
          })}
        </svg>

        {/* Floating HTML Hover Tooltip */}
        {hoveredIndex !== null && hoveredData && (
          <div
            className="pointer-events-none absolute z-20 transition-all duration-150 ease-out bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2.5 rounded-lg shadow-elevated border border-slate-700/60 text-xs min-w-[130px]"
            style={{
              left: `${Math.max(
                16,
                Math.min(
                  84,
                  ((padding.left +
                    hoveredIndex * groupWidth +
                    groupWidth / 2) /
                    svgWidth) *
                    100
                )
              )}%`,
              top: '8px',
              transform: 'translateX(-50%)',
            }}
          >
            <div className="font-bold text-slate-100 border-b border-slate-700/60 pb-1 mb-1.5 flex items-center justify-between">
              <span>{hoveredData.label}</span>
              <span className="text-[10px] font-mono text-slate-400">Data</span>
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
