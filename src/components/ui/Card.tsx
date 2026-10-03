import type { ReactNode } from "react";
import { useT } from "../../lib/i18n";
import { cn } from "../../lib/utils";

export function Card({
  className,
  children,
  onClick,
}: {
  className?: string;
  children: ReactNode;
  /** दी गई हो तो कार्ड दबाने योग्य बन जाता है */
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "section";

  return (
    <Tag
      {...(onClick ? { type: "button" as const, onClick } : {})}
      className={cn(
        "block w-full rounded-3xl border border-saffron-100/90 bg-white/80 p-5 text-left",
        "shadow-[0_8px_24px_-18px_rgba(120,44,25,0.45)] backdrop-blur-sm",
        onClick && "pressable",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function SectionTitle({
  hindi,
  english,
  className,
}: {
  hindi: string;
  english?: string;
  className?: string;
}) {
  const t = useT();
  return (
    <div className={cn("mb-3", className)}>
      <h2 className="text-lg leading-snug font-bold text-ink-900 sm:text-xl">{t(hindi)}</h2>
      {english ? (
        <p className="mt-1 text-[11px] font-semibold tracking-[0.14em] text-ink-500 uppercase">
          {t(english)}
        </p>
      ) : null}
    </div>
  );
}

/** छोटा ऊपरी निशान — हर कार्ड पर एक जैसा दिखे */
export function Eyebrow({
  children,
  tone = "saffron",
  className,
}: {
  children: ReactNode;
  tone?: "saffron" | "gold" | "muted";
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-[11px] font-bold tracking-[0.14em] uppercase",
        tone === "saffron" && "text-saffron-600",
        tone === "gold" && "text-gold-600",
        tone === "muted" && "text-ink-500",
        className,
      )}
    >
      {children}
    </p>
  );
}
