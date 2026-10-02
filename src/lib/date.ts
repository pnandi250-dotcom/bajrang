export const HINDI_WEEKDAYS = [
  "रविवार",
  "सोमवार",
  "मंगलवार",
  "बुधवार",
  "गुरुवार",
  "शुक्रवार",
  "शनिवार",
] as const;

export const HINDI_WEEKDAYS_SHORT = [
  "रवि",
  "सोम",
  "मंगल",
  "बुध",
  "गुरु",
  "शुक्र",
  "शनि",
] as const;

export const HINDI_MONTHS = [
  "जनवरी",
  "फ़रवरी",
  "मार्च",
  "अप्रैल",
  "मई",
  "जून",
  "जुलाई",
  "अगस्त",
  "सितंबर",
  "अक्तूबर",
  "नवंबर",
  "दिसंबर",
] as const;

export const HINDI_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

export const MANGALVAR = 2;
export const SHANIVAR = 6;

/** Local-timezone YYYY-MM-DD key. Never use toISOString() here — it shifts days. */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Whole calendar days between two date keys (b - a). */
export function daysBetween(aKey: string, bKey: string): number {
  const a = fromDateKey(aKey);
  const b = fromDateKey(bKey);
  return Math.round(
    (Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) -
      Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) /
      86_400_000,
  );
}

export function isSameDay(a: Date, b: Date): boolean {
  return toDateKey(a) === toDateKey(b);
}

export function isHanumanDay(date: Date): boolean {
  const day = date.getDay();
  return day === MANGALVAR || day === SHANIVAR;
}

export function hanumanDayName(date: Date): string | null {
  if (date.getDay() === MANGALVAR) return "मंगलवार";
  if (date.getDay() === SHANIVAR) return "शनिवार";
  return null;
}

/** 1 -> "१", 2026 -> "२०२६" */
export function toHindiDigits(value: number | string): string {
  return String(value).replace(/\d/g, (d) => HINDI_DIGITS[Number(d)]);
}

export function formatHindiDate(date: Date): string {
  return `${toHindiDigits(date.getDate())} ${HINDI_MONTHS[date.getMonth()]}`;
}

export function formatFullHindiDate(date: Date): string {
  return `${formatHindiDate(date)} ${toHindiDigits(date.getFullYear())}`;
}

export function formatTime(time: string): string {
  const [hRaw, mRaw] = time.split(":");
  const h = Number(hRaw);
  const suffix = h < 12 ? "सुबह" : h < 17 ? "दोपहर" : h < 20 ? "शाम" : "रात";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${toHindiDigits(hour12)}:${mRaw} ${suffix}`;
}

/** "HH:MM" in 24h form, for <input type="time"> */
export function normalizeTime(time: string): string {
  const match = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!match) return "06:00";
  const h = Math.min(23, Math.max(0, Number(match[1])));
  const m = Math.min(59, Math.max(0, Number(match[2])));
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}