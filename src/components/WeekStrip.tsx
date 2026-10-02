import {
  HINDI_WEEKDAYS_SHORT,
  addDays,
  hanumanDayName,
  toDateKey,
} from "../lib/date";
import { useDerivedState } from "../lib/store";
import { cn } from "../lib/utils";

/** पिछले 7 दिन — पूरी हुई पूजा के निशान के साथ। */
export function WeekStrip() {
  const state = useDerivedState();
  const completed = new Set(state.completedDates);
  const today = new Date();

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, index - 6);
    const key = toDateKey(date);
    return {
      date,
      key,
      day: HINDI_WEEKDAYS_SHORT[date.getDay()],
      done: completed.has(key),
      isToday: key === state.todayKey,
      special: hanumanDayName(date) !== null,
    };
  });

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {days.map((day) => (
        <div
          key={day.key}
          className={cn(
            "flex flex-col items-center rounded-2xl py-2",
            day.done && "bg-saffron-100",
            day.isToday && !day.done && "bg-cream-200",
          )}
        >
          <span
            className={cn(
              "text-[11px] font-semibold",
              day.done ? "text-saffron-700" : "text-ink-500",
            )}
          >
            {day.day}
          </span>
          <span
            className={cn(
              "mt-1 grid h-7 w-7 place-items-center rounded-full text-sm",
              day.done
                ? "bg-saffron-500 text-white"
                : "border border-dashed border-saffron-200 text-transparent",
            )}
          >
            ✓
          </span>
          {day.special ? (
            <span className="mt-0.5 text-[10px] leading-none">🚩</span>
          ) : (
            <span className="mt-0.5 h-[10px]" />
          )}
        </div>
      ))}
    </div>
  );
}