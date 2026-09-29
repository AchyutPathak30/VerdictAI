import React from 'react';

interface ScoreGaugeProps {
  score: number; // 0 to 100
  label?: string;
  favourText?: string;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  label = 'FAVOUR MEMBER',
  favourText = 'MEMBER',
}) => {
  // Semi-circle SVG parameters
  const radius = 70;
  const strokeWidth = 14;
  const cx = 90;
  const cy = 90;
  // Circumference of semi-circle: π * r
  const arcLength = Math.PI * radius;
  // Dash offset: 100% score means full arc
  const strokeDashoffset = arcLength * (1 - score / 100);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative w-[180px] h-[100px] flex items-end justify-center overflow-hidden">
        <svg viewBox="0 0 180 100" className="w-full h-full">
          {/* Background track */}
          <path
            d="M 20,90 A 70,70 0 0,1 160,90"
            fill="none"
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Active colored arc */}
          <path
            d="M 20,90 A 70,70 0 0,1 160,90"
            fill="none"
            stroke="#10B981"
            strokeWidth={strokeWidth}
            strokeDasharray={arcLength}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Score Readout */}
        <div className="absolute bottom-0 flex flex-col items-center">
          <span className="text-3xl font-extrabold text-slate-800 tracking-tight leading-none">
            {score}%
          </span>
          <span className="text-[10px] font-bold text-emerald-700 tracking-wider mt-1 uppercase">
            {label}
          </span>
        </div>
      </div>

      {/* Axis Scale Labels */}
      <div className="w-full flex justify-between px-3 text-[11px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">
        <span>MERCHANT</span>
        <span>{favourText}</span>
      </div>
    </div>
  );
};
