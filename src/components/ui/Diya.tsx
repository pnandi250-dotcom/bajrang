import { cn } from "../../lib/utils";

type Props = {
  /** 0 → 1, दीवा कितना चमक रहा है */
  intensity: number;
  size?: number;
  className?: string;
};

/** 🪔 — जितनी लंबी स्ट्रीक, उतना बड़ा और चमकता दीवा। */
export function Diya({ intensity, size = 140, className }: Props) {
  const level = Math.min(1, Math.max(0, intensity));
  const flameScale = 0.72 + level * 0.5;
  const glowOpacity = 0.18 + level * 0.62;
  const flameOuter = level > 0.66 ? "#ff8a3c" : "#f4b74a";
  const flameInner = level > 0.66 ? "#ffd15c" : "#ffe9a8";

  return (
    <div
      className={cn("relative grid place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <div
        className="animate-glow pointer-events-none absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 42%, rgba(255,196,92,0.85) 0%, rgba(255,138,60,0.28) 42%, rgba(255,107,53,0) 70%)",
          opacity: glowOpacity,
        }}
      />
      <svg
        width={size * 0.86}
        height={size * 0.86}
        viewBox="0 0 120 120"
        aria-hidden
        className="animate-floaty relative"
      >
        <defs>
          <linearGradient id="flameOuter" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#ff6b35" />
            <stop offset="100%" stopColor={flameOuter} />
          </linearGradient>
          <linearGradient id="bowl" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e0483c" />
            <stop offset="100%" stopColor="#7d131b" />
          </linearGradient>
        </defs>

        {/* लौ */}
        <g
          style={{
            transformOrigin: "60px 62px",
            transform: `scale(${flameScale})`,
            transition: "transform 700ms ease",
          }}
        >
          <path
            d="M60 14c9 14 17 22 17 33a17 17 0 0 1-34 0c0-6 3-11 7-15 1 5 3 8 6 9 0-9-2-17 4-27z"
            fill="url(#flameOuter)"
            opacity={0.55 + level * 0.45}
          />
          <path
            d="M60 34c4 8 8 12 8 19a8 8 0 0 1-16 0c0-4 2-7 4-10 1 3 2 5 4 6 0-5-1-9 0-15z"
            fill={flameInner}
            opacity={0.5 + level * 0.5}
          />
        </g>

        {/* कटोरी */}
        <path d="M26 70c6 26 20 34 34 34s28-8 34-34z" fill="url(#bowl)" />
        <ellipse cx="60" cy="70" rx="34" ry="8" fill="#e8b24a" />
        <ellipse cx="60" cy="70" rx="26" ry="5" fill="#ffd15c" opacity={0.5 + level * 0.5} />
      </svg>
    </div>
  );
}