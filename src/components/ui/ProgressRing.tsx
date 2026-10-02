import { cn } from "../../lib/utils";

type Props = {
  /** 0 → 1 */
  progress: number;
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
  className?: string;
};

/** पूजा के 60 सेकंड का घेरा। शांत, धीमी गति से भरता है। */
export function ProgressRing({
  progress,
  size = 260,
  stroke = 12,
  children,
  className,
}: Props) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, progress));
  const dash = circumference * clamped;

  return (
    <div
      className={cn("relative grid place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <defs>
          <linearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffd15c" />
            <stop offset="55%" stopColor="#ffb648" />
            <stop offset="100%" stopColor="#ff6b35" />
          </linearGradient>
          <radialGradient id="ringGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255, 178, 72, 0)" />
            <stop offset="100%" stopColor="rgba(255, 178, 72, 0.35)" />
          </radialGradient>
        </defs>

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="url(#ringGlow)"
          opacity={clamped}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 244, 237, 0.18)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#ringGradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dasharray 400ms linear" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}