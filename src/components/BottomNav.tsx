import { cn } from "../lib/utils";
import { useT } from "../lib/i18n";
import { haptic } from "../lib/device";

export type Tab = "home" | "katha" | "calendar" | "sankalp" | "settings";

const TABS: { id: Tab; icon: string; hindi: string; english: string }[] = [
  { id: "home", icon: "🙏", hindi: "आज", english: "Home" },
  { id: "katha", icon: "📖", hindi: "कथा", english: "Katha" },
  { id: "calendar", icon: "📅", hindi: "पंचांग", english: "Calendar" },
  { id: "sankalp", icon: "🪔", hindi: "संकल्प", english: "Sankalp" },
  { id: "settings", icon: "⚙️", hindi: "सेटिंग", english: "Settings" },
];

export function BottomNav({ tab, onChange }: { tab: Tab; onChange: (tab: Tab) => void }) {
  const t = useT();
  return (
    <nav className="safe-bottom sticky bottom-0 z-30 border-t border-saffron-100 bg-cream-100/95 backdrop-blur-md">
      <ul className="mx-auto flex max-w-[480px] items-stretch justify-around px-2 py-1.5">
        {TABS.map((item) => {
          const active = item.id === tab;
          return (
            <li key={item.id} className="flex-1">
              <button
                type="button"
                onClick={() => {
                  if (!active) haptic(8);
                  onChange(item.id);
                }}
                aria-current={active ? "page" : undefined}
                aria-label={`${t(item.hindi)} (${item.english})`}
                className={cn(
                  "flex w-full flex-col items-center gap-0.5 rounded-2xl px-1 py-2 transition-colors",
                  "min-h-[58px] justify-center",
                  active ? "bg-saffron-100" : "active:bg-cream-200",
                )}
              >
                <span
                  className={cn(
                    "text-xl leading-none transition-transform",
                    active ? "scale-110" : "opacity-55 grayscale",
                  )}
                >
                  {item.icon}
                </span>
                <span
                  className={cn(
                    "text-[11px] leading-tight font-bold",
                    active ? "text-saffron-700" : "text-ink-500",
                  )}
                >
                  {t(item.hindi)}
                </span>
                <span
                  className={cn(
                    "text-[9px] leading-none font-semibold tracking-wide",
                    active ? "text-saffron-600" : "text-ink-500/70",
                  )}
                >
                  {item.english}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}