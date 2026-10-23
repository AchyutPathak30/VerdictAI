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
          <span className="text-[10px] font-bold text-slate-500 tracking-wider mt-1 uppercase">
            {label}
          </span>
        </div>
      </div>

      {/* Axis Scale Labels */}
      <div className="w-[180px] flex justify-between text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">
        <span>Merchant</span>
        <span>Member</span>
      </div>

      {/* Favor Indication Badge */}
      <div className={`mt-2.5 px-3 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 border ${
        score >= 50 
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
          : 'bg-amber-50 text-amber-800 border-amber-200'
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${score >= 50 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        <span>FAVOURS {favourText.replace(/^FAVOUR\s+/i, '')}</span>
      </div>
    </div>
  );
};
