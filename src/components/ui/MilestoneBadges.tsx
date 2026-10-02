import { MILESTONES } from "../../lib/store";
import { toHindiDigits } from "../../lib/date";
import { cn } from "../../lib/utils";

export function MilestoneBadges({ streak }: { streak: number }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {MILESTONES.map((milestone) => {
        const earned = streak >= milestone.days;
        const progress = Math.min(1, streak / milestone.days);
        return (
          <div
            key={milestone.days}
            className={cn(
              "rounded-3xl border p-3 text-center transition-colors",
              milestone.golden && earned
                ? "border-gold-300 bg-linear-to-b from-gold-200 to-cream-200 shadow-glow"
                : earned
                  ? "border-saffron-200 bg-white"
                  : "border-dashed border-saffron-200 bg-white/55",
            )}
          >
            <div
              className={cn(
                "mx-auto grid h-12 w-12 place-items-center rounded-2xl text-2xl",
                earned ? "bg-saffron-100" : "bg-cream-200 grayscale",
              )}
            >
              {milestone.golden ? "🏅" : "🏵️"}
            </div>
            <p
              className={cn(
                "mt-2 text-sm font-bold",
                earned ? "text-ink-900" : "text-ink-500",
              )}
            >
              {toHindiDigits(milestone.days)} दिन
            </p>
            <p
              className={cn(
                "text-[11px] font-semibold",
                earned
                  ? milestone.golden
                    ? "text-gold-600"
                    : "text-saffron-700"
                  : "text-ink-500",
              )}
            >
              {milestone.label}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cream-300">
              <div
                className={cn(
                  "h-full rounded-full",
                  milestone.golden ? "bg-gold-400" : "bg-saffron-400",
                )}
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}