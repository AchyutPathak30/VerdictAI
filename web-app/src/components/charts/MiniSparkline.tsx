import React, { useId } from 'react';

interface MiniSparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
  className?: string;
  isPositive?: boolean;
}

export const MiniSparkline: React.FC<MiniSparklineProps> = ({
  data,
  color,
  height = 36,
  width = 90,
  className = '',
  isPositive = true,
}) => {
  const chartId = useId().replace(/:/g, '');
  const strokeColor = color || (isPositive ? '#10B981' : '#EF4444');

  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const paddingY = 4;
  const usableHeight = height - paddingY * 2;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = paddingY + usableHeight - ((val - min) / range) * usableHeight;
    return { x, y };
  });

  // Build path
  let path = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const mx = (p1.x + p2.x) / 2;
    path += ` C ${mx},${p1.y} ${mx},${p2.y} ${p2.x},${p2.y}`;
  }

  const lastPt = points[points.length - 1];
  const firstPt = points[0];
  const areaPath = `${path} L ${lastPt.x},${height} L ${firstPt.x},${height} Z`;

  return (
    <div className={`inline-block overflow-hidden ${className}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible block"
      >
        <defs>
          <linearGradient
            id={`${chartId}-spark-grad`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        <path d={areaPath} fill={`url(#${chartId}-spark-grad)`} />
        <path
          d={path}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Current Endpoint Dot */}
        <circle
          cx={lastPt.x}
          cy={lastPt.y}
          r="2.5"
          fill="#FFFFFF"
          stroke={strokeColor}
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
};

