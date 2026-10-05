/** WeekStrip — पहले हर दिन के लिए डटेड घेरा था, जो टूट हुआ दिखता था। */
import {
  addDays,
  calendarDateForDevotionalDay,
  hanumanDayName,
  toDateKey,
  weekdayShort,
} from "../lib/date";
import { useDerivedState } from "../lib/store";
import { fmt, useT } from "../lib/i18n";
import { cn } from "../lib/utils";

export function WeekStrip() {
  const state = useDerivedState();
  const t = useT();
  const completed = new Set(state.completedDates);
  // पूजा का दिन — रात 3 बजे के बाद यह कल हो जाता है
  const today = calendarDateForDevotionalDay();

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, index - 6);
    const key = toDateKey(date);
    return {
      date,
      key,
      label: weekdayShort()[date.getDay()],
      done: completed.has(key),
      isToday: key === state.todayKey,
      special: hanumanDayName(date) !== null,
    };
  });

  const doneCount = days.filter((day) => day.done).length;

  return (
    <div>
      {/* पूरे हफ़्ते की पट्टी — दिन की लंबाई बराबर, आज की जगह ख़ाली नहीं */}
      <ol className="grid grid-cols-7 gap-1" role="list">
        {days.map((day) => (
          <li key={day.key} className="flex flex-col items-center gap-1.5">
            <span
              className={cn(
                "text-[11px] tabular-nums",
                day.isToday ? "font-semibold text-saffron-700" : "text-ink-500",
              )}
            >
              {day.label}
            </span>
            <span
              className={cn(
                "grid h-8 w-full place-items-center rounded-lg text-xs font-semibold tabular-nums",
                day.done && "bg-saffron-500 text-white",
                !day.done && day.isToday && "bg-cream-200 text-saffron-700",
                !day.done && !day.isToday && "text-ink-500",
                day.special && !day.done && "ring-1 ring-saffron-200 ring-inset",
              )}
            >
              {day.done ? "✓" : day.date.getDate()}
            </span>
          </li>
        ))}
      </ol>

      {/* हफ़्ते की एक पंक्ति — कम चीज़ें, ज़्यादा साफ़ */}
      <p className="mt-3 flex items-baseline gap-2 text-sm text-ink-500">
        <span className="text-ink-900 tabular-nums">{doneCount}</span>
        <span>
          {doneCount === 0
            ? t("इस हफ़्ते अभी कोई पूजा नहीं")
            : doneCount === 1
              ? t("इस हफ़्ते एक पूजा")
              : fmt("इस हफ़्ते {n} पूजा", { n: doneCount })}
        </span>
      </p>
    </div>
  );
}
