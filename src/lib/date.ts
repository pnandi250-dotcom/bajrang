import { getLang, type Lang } from "./i18n";

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

export const BENGALI_MONTHS = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
] as const;

export const BENGALI_WEEKDAYS = [
  "রবিবার",
  "সোমবার",
  "মঙ্গলবার",
  "বুধবার",
  "বৃহস্পতিবার",
  "শুক্রবার",
  "শনিবার",
] as const;

export const BENGALI_WEEKDAYS_SHORT = [
  "রবি",
  "সোম",
  "মঙ্গল",
  "বুধ",
  "বৃহঃ",
  "শুক্র",
  "শনি",
] as const;

export const HINDI_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
export const BENGALI_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export const MANGALVAR = 2;
export const SHANIVAR = 6;

/**
 * दिन की शुरुआत 3:00 बजे से।
 *
 * पूजा तड़के 2 बजे होती है — वह "कल" की पूजा है, आज की नहीं। इसलिए हर गिनती
 * इसी हिसाब से चलती है, वरना जो भक्त रात जागकर पूजा करता है उसका दिन गिना ही नहीं
 * जाता। यही परंपरा भी है — तिथि का दिन सूर्योदय से शुरू होता है।
 */
export const DAY_BOUNDARY_HOUR = 3;

/** पूजा के हिसाब से "आज कौन सा दिन है" — YYYY-MM-DD */
export function devotionalDateKey(now: Date = new Date()): string {
  return toDateKey(
    new Date(now.getTime() - DAY_BOUNDARY_HOUR * 60 * 60 * 1000),
  );
}

/** पूजा-दिन के हिसाब से कितने सेकंड बचे (कभी 0 से नीचे नहीं) */
export function secondsIntoDevotionalDay(now: Date = new Date()): number {
  const start = new Date(now);
  start.setHours(DAY_BOUNDARY_HOUR, 0, 0, 0);
  if (start > now) start.setDate(start.getDate() - 1);
  return Math.floor((now.getTime() - start.getTime()) / 1000);
}

/** Local-timezone YYYY-MM-DD key. Never use toISOString() here — it shifts days. */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** पूजा-दिन के मुकाबले असली दिन कौन सा (दिन की सीमा पार करने पर बदलता है) */
export function calendarDateForDevotionalDay(now: Date = new Date()): Date {
  return fromDateKey(devotionalDateKey(now));
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

export function hanumanDayName(date: Date, lang: Lang = getLang()): string | null {
  const names = weekdayNames(lang);
  if (date.getDay() === MANGALVAR) return names[2];
  if (date.getDay() === SHANIVAR) return names[6];
  return null;
}

/** 1 -> "१" (हिंदी) या "১" (বাংলा), 2026 -> "२०२६" / "২০২৬" */
export function toNativeDigits(value: number | string, lang: Lang = getLang()): string {
  const digits = lang === "bn" ? BENGALI_DIGITS : HINDI_DIGITS;
  return String(value).replace(/\d/g, (d) => digits[Number(d)]);
}

/** भाषा के हिसाब से महीने के नाम */
export function monthNames(lang: Lang = getLang()): readonly string[] {
  return lang === "bn" ? BENGALI_MONTHS : HINDI_MONTHS;
}

/** भाषा के हिसाब से पूरे दिन के नाम */
export function weekdayNames(lang: Lang = getLang()): readonly string[] {
  return lang === "bn" ? BENGALI_WEEKDAYS : HINDI_WEEKDAYS;
}

/** भाषा के हिसाब से दिन के छोटे नाम */
export function weekdayShort(lang: Lang = getLang()): readonly string[] {
  return lang === "bn" ? BENGALI_WEEKDAYS_SHORT : HINDI_WEEKDAYS_SHORT;
}

export function formatDate(date: Date, lang: Lang = getLang()): string {
  return `${toNativeDigits(date.getDate(), lang)} ${monthNames(lang)[date.getMonth()]}`;
}

export function formatFullDate(date: Date, lang: Lang = getLang()): string {
  return `${formatDate(date, lang)} ${toNativeDigits(date.getFullYear(), lang)}`;
}

export function formatTime(time: string, lang: Lang = getLang()): string {
  const [hRaw, mRaw] = time.split(":");
  const h = Number(hRaw);
  const suffix =
    lang === "bn"
      ? h < 12
        ? "সকাল"
        : h < 17
          ? "দুপুর"
          : h < 20
            ? "সন্ধ্যা"
            : "রাত"
      : h < 12
        ? "सुबह"
        : h < 17
          ? "दोपहर"
          : h < 20
            ? "शाम"
            : "रात";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${toNativeDigits(hour12, lang)}:${mRaw} ${suffix}`;
}

/** "HH:MM" in 24h form, for <input type="time"> */
export function normalizeTime(time: string): string {
  const match = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!match) return "06:00";
  const h = Math.min(23, Math.max(0, Number(match[1])));
  const m = Math.min(59, Math.max(0, Number(match[2])));
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}