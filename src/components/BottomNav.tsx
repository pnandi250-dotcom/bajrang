/**
 * नीचे की पट्टी — पाँच टैब, एक ही रेखा-शैली के प्रतीक।
 *
 * पहले हर टैब पर ईमोजी था और उसके नीचे दो भाषाएँ (हिन्दी + अंग्रेज़ी) — यानी हर
 * आइकन के नीचे दो पंक्तियाँ, और सक्रिय टैब पूरा पीला डिब्बा। अब सिर्फ़ एक नाम,
 * और सक्रिय होने पर सिर्फ़ रंग बदलता है — कोई पृष्ठभूमि-डिब्बा नहीं।
 */
import { cn } from "../lib/utils";
import { useT } from "../lib/i18n";
import { haptic } from "../lib/device";
import { IconBook, IconDiya, IconFlame, IconKalash, IconShare } from "./icons";

export type Tab = "home" | "katha" | "calendar" | "sankalp" | "settings";

const TABS: {
  id: Tab;
  Icon: (p: { className?: string }) => React.ReactElement;
  label: string;
  english: string;
}[] = [
  { id: "home", Icon: IconFlame, label: "आज", english: "Today" },
  { id: "katha", Icon: IconBook, label: "कथा", english: "Katha" },
  { id: "calendar", Icon: IconDiya, label: "पंचांग", english: "Dapan" },
  { id: "sankalp", Icon: IconKalash, label: "संकल्प", english: "Resolve" },
  { id: "settings", Icon: IconShare, label: "सेटिंग", english: "Settings" },
];

export function BottomNav({ tab, onChange }: { tab: Tab; onChange: (tab: Tab) => void }) {
  const t = useT();
  return (
    <nav className="safe-bottom sticky bottom-0 z-30 border-t border-cream-300 bg-cream-50/95 backdrop-blur-md">
      <ul className="mx-auto flex max-w-[480px] items-stretch px-1">
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
                aria-label={`${t(item.label)} — ${item.english}`}
                className={cn(
                  "flex min-h-[56px] w-full flex-col items-center justify-center gap-1.5 px-1 py-2",
                  "transition-colors active:bg-cream-200/60",
                )}
              >
                <item.Icon
                  className={cn(
                    "size-5 transition-colors",
                    active ? "text-saffron-600" : "text-ink-500/60",
                  )}
                />
                <span
                  className={cn(
                    "text-[11px] leading-none",
                    active ? "font-semibold text-saffron-700" : "text-ink-500",
                  )}
                >
                  {t(item.label)}
                </span>
                {/* सक्रिय टैब की पतली रेखा — डिब्बे की जगह */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-px w-4 rounded-full transition-colors",
                    active ? "bg-saffron-500" : "bg-transparent",
                  )}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
