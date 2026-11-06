import React, { useState, useId } from 'react';

interface ScoreGaugeProps {
  score: number; // 0 to 100
  label?: string;
  favourText?: string;
  size?: 'sm' | 'md' | 'lg';
  showTicks?: boolean;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  label = 'Confidence Score',
  favourText = 'MEMBER',
  size = 'md',
  showTicks = true,
}) => {
  const chartId = useId().replace(/:/g, '');
  const [isHovered, setIsHovered] = useState(false);

  // Normalise score
  const safeScore = Math.min(Math.max(score, 0), 100);

  // Color themes based on verdict score
  const isHighMember = safeScore >= 60;
  const isNeutral = safeScore >= 45 && safeScore < 60;

  const primaryColor = isHighMember
    ? '#10B981'
    : isNeutral
    ? '#F59E0B'
    : '#EF4444';

  const secondaryColor = isHighMember
    ? '#3B82F6'
    : isNeutral
    ? '#F97316'
    : '#DC2626';

  // SVG Geometry for 180-degree semi-circle
  const width = size === 'sm' ? 180 : size === 'lg' ? 240 : 210;
  const height = width * 0.58;
  const strokeWidth = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;
  const cx = width / 2;
  const cy = height - 8;
  const radius = cx - strokeWidth - 6;
  const arcLength = Math.PI * radius;
  const strokeDashoffset = arcLength * (1 - safeScore / 100);

  // Pointer bead position
  const angleRad = Math.PI * (1 - safeScore / 100);
  const beadX = cx + radius * Math.cos(angleRad);
  const beadY = cy - radius * Math.sin(angleRad);

  // Tick marks
  const ticks = [0, 25, 50, 75, 100];

  return (
    <div
      className="flex flex-col items-center justify-center p-2 relative select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="relative flex items-end justify-center overflow-visible"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible block"
        >
          <defs>
            {/* Dynamic Score Gradient */}
            <linearGradient id={`${chartId}-gauge-grad`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>

            {/* Glowing bead filter */}
            <filter id={`${chartId}-glow`} x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={primaryColor} floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Background Outer Track */}
          <path
            d={`M ${cx - radius},${cy} A ${radius},${radius} 0 0,1 ${cx + radius},${cy}`}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Inner Decorative Subtle Guideline Arc */}
          <path
            d={`M ${cx - radius + strokeWidth * 0.9},${cy} A ${radius - strokeWidth * 0.9},${radius - strokeWidth * 0.9} 0 0,1 ${cx + radius - strokeWidth * 0.9},${cy}`}
            fill="none"
            stroke="#CBD5E1"
            strokeWidth="1"
            strokeDasharray="2 3"
            opacity="0.6"
          />

          {/* Active Gradient Arc */}
          <path
            d={`M ${cx - radius},${cy} A ${radius},${radius} 0 0,1 ${cx + radius},${cy}`}
            fill="none"
            stroke={`url(#${chartId}-gauge-grad)`}
            strokeWidth={strokeWidth}
            strokeDasharray={arcLength}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />

          {/* Tick graduation marks */}
          {showTicks &&
            ticks.map((t) => {
              const rad = Math.PI * (1 - t / 100);
              const innerR = radius - strokeWidth / 2 - 4;
              const outerR = radius - strokeWidth / 2 - 1;
              const x1 = cx + innerR * Math.cos(rad);
              const y1 = cy - innerR * Math.sin(rad);
              const x2 = cx + outerR * Math.cos(rad);
              const y2 = cy - outerR * Math.sin(rad);
              return (
                <line
                  key={t}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#94A3B8"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  className="opacity-60"
                />
              );
            })}

          {/* Current Position Pointer Bead */}
          <circle
            cx={beadX}
            cy={beadY}
            r={strokeWidth * 0.42}
            fill="#FFFFFF"
            stroke={primaryColor}
            strokeWidth="3.5"
            filter={`url(#${chartId}-glow)`}
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Score Readout */}
        <div className="absolute bottom-1 flex flex-col items-center pointer-events-none">
          <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-none">
            {safeScore}%
          </span>
          <span className="text-[10px] font-bold text-slate-500 tracking-wider mt-1 uppercase">
            {label}
          </span>
        </div>
      </div>

      {/* Axis Scale Labels */}
      <div
        className="flex justify-between text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-wider"
        style={{ width: `${width}px` }}
      >
        <span className="text-rose-600 font-bold">Merchant (0%)</span>
        <span className="text-slate-400">Neutral</span>
        <span className="text-emerald-600 font-bold">Member (100%)</span>
      </div>

      {/* Favor Indication Badge */}
      <div
        className={`mt-3 px-3.5 py-1 rounded-full text-xs font-bold flex items-center gap-2 border shadow-xs transition-all duration-300 ${
          isHighMember
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : isNeutral
            ? 'bg-amber-50 text-amber-800 border-amber-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full animate-pulse ${
            isHighMember
              ? 'bg-emerald-500'
              : isNeutral
              ? 'bg-amber-500'
              : 'bg-rose-500'
          }`}
        />
        <span>FAVOURS {favourText.replace(/^FAVOUR\s+/i, '')}</span>
      </div>

      {/* Interactive Tooltip on Hover */}
      {isHovered && (
        <div className="absolute -top-12 z-30 bg-slate-900/95 backdrop-blur-md text-white px-3 py-1.5 rounded-lg shadow-elevated border border-slate-700/80 text-[11px] whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
          <span className="font-semibold text-slate-300">ML Confidence: </span>
          <strong className="text-emerald-400 font-mono font-bold">
            {safeScore}%
          </strong>{' '}
          • {safeScore >= 80 ? 'Straight-Through Auto' : safeScore >= 50 ? 'Standard Review' : 'Override Required'}
        </div>
      )}
    </div>
  );
};
