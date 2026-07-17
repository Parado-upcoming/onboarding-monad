"use client";

export function Sparkline({
  points,
  width = 600,
  height = 160,
}: {
  points: number[];
  width?: number;
  height?: number;
}) {
  if (points.length < 2) {
    return <div style={{ width, height }} className="flex items-center justify-center text-xs text-muted-foreground">Not enough data yet</div>;
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const rising = points[points.length - 1] >= points[0];

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - ((p - min) / range) * height;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  const areaPath = `M0,${height} L${coords.join(" L")} L${width},${height} Z`;
  const linePath = `M${coords.join(" L")}`;
  const color = rising ? "#34d399" : "#fb7185";

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
      <path d={areaPath} fill={color} fillOpacity={0.08} />
      <path d={linePath} fill="none" stroke={color} strokeWidth={2} />
    </svg>
  );
}
