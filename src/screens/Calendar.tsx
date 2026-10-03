import { useMemo, useState } from "react";
import { useDerivedState } from "../lib/store";
import { loadFestivals, nextFestival, saveFestivals } from "../lib/festivals";
import {
  HINDI_MONTHS,
  calendarDateForDevotionalDay,
  devotionalDateKey,
  HINDI_WEEKDAYS,
  MANGALVAR,
  SHANIVAR,
  fromDateKey,
  toDateKey,
  toHindiDigits,
} from "../lib/date";
import { Card, SectionTitle } from "../components/ui/Card";
import { cn } from "../lib/utils";

export function Calendar() {
  const state = useDerivedState();
  const [month, setMonth] = useState(() => {
    const now = calendarDateForDevotionalDay();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [festivals, setFestivals] = useState(loadFestivals);
  const [editing, setEditing] = useState(false);

  const upcoming = useMemo(() => nextFestival(festivals, state.todayKey), [festivals, state.todayKey]);

  const cells = useMemo(() => buildMonth(month, state.completedDates, festivals), [month, state.completedDates, festivals]);

  function shiftMonth(delta: number) {
    setMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  function updateFestivalDate(id: string, date: string) {
    const next = festivals.map((f) => (f.id === id ? { ...f, date } : f));
    setFestivals(next);
    saveFestivals(next);
  }

  const today = calendarDateForDevotionalDay();
  const isCurrentMonth =
    month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth();

  return (
    <div className="safe-top px-5 pt-3 pb-6">
      <h1 className="text-3xl font-extrabold text-ink-900">पंचांग</h1>
      <p className="mt-1 text-sm font-semibold tracking-wide text-ink-500 uppercase">
        Calendar · Tuesday & Saturday
      </p>

      {upcoming ? (
        <Card className="mt-5 border-gold-300 bg-linear-to-b from-gold-200/70 to-white">
          <p className="text-[11px] font-bold tracking-[0.14em] text-gold-600 uppercase">
            आने वाला त्योहार
          </p>
          <p className="mt-1.5 text-2xl font-extrabold text-ink-900">
            {upcoming.festival.name}
          </p>
          <p className="mt-1 text-lg font-bold text-saffron-700">
            {upcoming.daysUntil === 0
              ? "आज ही है! 🙏"
              : `${toHindiDigits(upcoming.daysUntil)} दिन बाकी`}
          </p>
          <p className="mt-1 text-sm text-ink-500">
            {fromDateKey(upcoming.festival.date).getDate()}{" "}
            {HINDI_MONTHS[fromDateKey(upcoming.festival.date).getMonth()]}
          </p>
          {upcoming.festival.note ? (
            <p className="mt-3 rounded-2xl bg-white/70 px-4 py-2.5 text-xs leading-relaxed text-ink-500">
              {upcoming.festival.note}
            </p>
          ) : null}
        </Card>
      ) : null}

      <Card className="mt-5">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="pressable grid h-11 w-11 place-items-center rounded-full bg-cream-200 text-lg font-bold text-ink-700"
            aria-label="पिछला महीना"
          >
            ‹
          </button>
          <p className="text-lg font-extrabold text-ink-900">
            {HINDI_MONTHS[month.getMonth()]} {toHindiDigits(month.getFullYear())}
          </p>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="pressable grid h-11 w-11 place-items-center rounded-full bg-cream-200 text-lg font-bold text-ink-700"
            aria-label="अगला महीना"
          >
            ›
          </button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center">
          {HINDI_WEEKDAYS.map((day) => (
            <span key={day} className="text-[11px] font-bold text-ink-500">
              {day.slice(0, 3)}
            </span>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-1">
          {cells.map((cell, index) => (
            <div
              key={`${cell.key ?? "blank"}-${index}`}
              className={cn(
                "relative flex h-12 flex-col items-center justify-center rounded-2xl text-sm",
                cell.special && "bg-saffron-100 text-saffron-800",
                cell.completed && "bg-saffron-500 text-white",
                cell.today && !cell.completed && "ring-2 ring-saffron-500",
                !cell.day && "bg-transparent",
              )}
            >
              {cell.day ? <span className="font-semibold tabular-nums">{toHindiDigits(cell.day)}</span> : null}
              {cell.special && cell.day ? (
                <span className="text-[10px] leading-none">🚩</span>
              ) : cell.day ? (
                <span className="h-[10px]" />
              ) : null}
              {cell.festival ? (
<span
                  className="absolute -top-1 left-1/2 -translate-x-1/2 rounded-full bg-gold-300 px-2 py-0.5 text-[9px] font-bold whitespace-nowrap text-ink-900"
                >
                  {cell.festival}
                </span>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-semibold text-ink-500">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-saffron-100" /> मंगलवार / शनिवार
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-saffron-500" /> पूजा पूरी
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full ring-2 ring-saffron-500" /> आज
          </span>
        </div>

        {!isCurrentMonth ? (
          <button
            type="button"
            onClick={() => setMonth(new Date(today.getFullYear(), today.getMonth(), 1))}
            className="mt-4 w-full rounded-2xl bg-cream-200 py-2.5 text-sm font-bold text-saffron-700"
          >
            इस महीने पर लौटें
          </button>
        ) : null}
      </Card>

      <Card className="mt-4">
        <SectionTitle hindi="हनुमान जी के दिन" english="Hanuman days" />
        <ul className="space-y-2 text-sm text-ink-700">
          <li className="flex gap-2">
            <span>🚩</span>
            <span>
              <b>मंगलवार</b> — हनुमान जी का प्रिय दिन
            </span>
          </li>
          <li className="flex gap-2">
            <span>🚩</span>
            <span>
              <b>शनिवार</b> — संकष्टी, हनुमान जी के लिए समर्पित
            </span>
          </li>
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-ink-500">
          हर हफ़्ते दो बार संकल्प दोहराना आसान है — बस एक मिनट।
        </p>
      </Card>

      <Card className="mt-4">
        <SectionTitle hindi="त्योहार की तिथि" english="Festival dates" />
        <div className="space-y-3">
          {festivals.map((festival) => (
            <div key={festival.id} className="rounded-2xl bg-cream-200/50 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-ink-900">{festival.name}</span>
                <input
                  type="date"
                  value={festival.date}
                  onChange={(event) => updateFestivalDate(festival.id, event.target.value)}
                  className="rounded-xl border border-saffron-200 bg-white px-3 py-2 text-sm font-semibold text-ink-900"
                />
              </div>
              <p className="mt-1.5 text-[11px] font-semibold text-saffron-700">
                स्रोत: {festival.source}
              </p>
              {festival.note ? (
                <p className="mt-1 text-[11px] leading-relaxed text-ink-500">{festival.note}</p>
              ) : null}
            </div>
          ))}
        </div>

        <p className="mt-3 rounded-2xl bg-gold-200/40 px-4 py-3 text-xs leading-[1.8] text-ink-700">
          ये तिथियाँ <b>Drik Panchang</b> (drikpanchang.com) से ली गई हैं। भारत के पंचांग के
          हिसाब से चाँद वाले त्योहार एक दिन ऊपर-नीचे हो सकते हैं, और दूसरे देशों में यही तिथि
          एक दिन पहले पड़ सकती है। अपने इलाके की पंचांग से मिलाकर ऊपर वाली तारीख बदल दीजिए।
        </p>

        <button
          type="button"
          onClick={() => setEditing(!editing)}
          className="pressable mt-3 text-xs font-bold text-saffron-700 underline underline-offset-4"
        >
          {editing ? "बंद करें" : "स्रोत देखें"}
        </button>
        {editing ? (
          <div className="mt-2 space-y-1.5 rounded-2xl bg-cream-200/70 px-4 py-3 text-xs leading-[1.8] text-ink-700">
            <p>• चैत्र पूर्णिमा (हनुमान जयंती): drikpanchang.com/vrats/purnimasidates.html</p>
            <p>• राम नवमी: drikpanchang.com/hindu-festivals/rama-navami</p>
            <p className="pt-1 text-ink-500">
              अपने इलाके के पंचांग या धर्मप्रधान से भी तिथि जाँच लीजिए — पंचांग हर जगह एक
              जैसा नहीं होता।
            </p>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

type Cell = {
  key: string | null;
  day: number | null;
  special: boolean;
  today: boolean;
  completed: boolean;
  festival: string | null;
};

function buildMonth(month: Date, completed: string[], festivals: { date: string; name: string }[]): Cell[] {
  const completedSet = new Set(completed);
  const festivalMap = new Map(festivals.map((f) => [f.date, f.name]));
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  // पूजा का दिन — रात 3 बजे के बाद यह कल हो जाता है
  const todayKey = devotionalDateKey();

  const cells: Cell[] = [];
  for (let i = 0; i < firstDay; i += 1) {
    cells.push({ key: null, day: null, special: false, today: false, completed: false, festival: null });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, monthIndex, day);
    const key = toDateKey(date);
    const dow = date.getDay();
    cells.push({
      key,
      day,
      special: dow === MANGALVAR || dow === SHANIVAR,
      today: key === todayKey,
      completed: completedSet.has(key),
      festival: festivalMap.get(key) ?? null,
    });
  }
  return cells;
}