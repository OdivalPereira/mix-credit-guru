import { cn } from "@/lib/utils";

interface MiniChartProps {
  data: number[];
  className?: string;
  color?: string;
}

export function MiniChart({ data, className, color = "hsl(var(--primary))" }: MiniChartProps) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className={cn("relative h-12 w-24", className)}>
      <svg 
        viewBox="0 0 100 100" 
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-[0_0_4px_currentColor]"
        />
      </svg>
    </div>
  );
}
