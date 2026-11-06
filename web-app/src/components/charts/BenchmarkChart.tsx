import React from 'react';

export interface BenchmarkItem {
  label: string;
  currentValue: number;
  benchmarkValue: number;
  unit?: string;
  isHigherBetter?: boolean;
  benchmarkLabel?: string;
}

interface BenchmarkChartProps {
  title?: string;
  subtitle?: string;
  items: BenchmarkItem[];
  className?: string;
}

export const BenchmarkChart: React.FC<BenchmarkChartProps> = ({
  title,
  subtitle,
  items,
  className = '',
}) => {
  return (
    <div
      className={`w-full bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-card transition-all duration-300 hover:shadow-md ${className}`}
    >
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

      <div className="space-y-4">
        {items.map((item, idx) => {
          const maxScale = Math.max(item.currentValue, item.benchmarkValue, 100) * 1.15;
          const currentPct = Math.min((item.currentValue / maxScale) * 100, 100);
          const benchPct = Math.min((item.benchmarkValue / maxScale) * 100, 100);

          const isPositive = item.isHigherBetter
            ? item.currentValue >= item.benchmarkValue
            : item.currentValue <= item.benchmarkValue;

          const delta = Math.abs(item.currentValue - item.benchmarkValue).toFixed(1);

          return (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 truncate max-w-[180px]">
                  {item.label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900">
                    {item.currentValue}
                    {item.unit || '%'}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isPositive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {isPositive ? 'Optimal' : 'Needs Review'} ({isPositive ? '+' : '-'}{delta}
                    {item.unit || '%'})
                  </span>
                </div>
              </div>

              {/* Comparative Track */}
              <div className="relative w-full bg-slate-100 rounded-full h-3.5 overflow-hidden">
                {/* Active value bar */}
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    isPositive
                      ? 'bg-gradient-to-r from-blue-500 to-emerald-500'
                      : 'bg-gradient-to-r from-amber-500 to-rose-500'
                  }`}
                  style={{ width: `${currentPct}%` }}
                />

                {/* Benchmark Target Marker Pin */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-slate-900 z-10"
                  style={{ left: `${benchPct}%` }}
                >
                  <div className="w-2 h-2 rounded-full bg-slate-900 -translate-x-[3px] -translate-y-[2px]" />
                </div>
              </div>

              {/* Sub-label showing benchmark comparison */}
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>0{item.unit || '%'}</span>
                <span>
                  {item.benchmarkLabel || 'Peer Benchmark'}:{' '}
                  <strong className="text-slate-600 font-mono">
                    {item.benchmarkValue}
                    {item.unit || '%'}
                  </strong>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

