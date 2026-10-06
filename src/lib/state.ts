/**
 * स्थिति की परिभाषा और सफ़ाई — बिना React के।
 *
 * `store.ts` इसी से स्थिति बनाता है, और `backup.ts` आयात की गई फ़ाइल जाँचने के
 * लिए उपयोग करता है। इसलिए सफ़ाई का काम दोनों जगह एक ही रहता है।
 */

import { isValidDateKey, toDateKey } from "./date";
import { KATHA_TOTAL } from "../devata/hanuman/katha";

export type Profile = {
  name: string;
  sankalp: string;
  reminderTime: string;
  reminderEnabled: boolean;
  /** पूजा के दौरान हल्का "ॐ" मंत्र सुनना */
  chantingEnabled: boolean;
  onboarded: boolean;
  createdAt: string;
};

export type AppState = {
  version: 1;
  profile: Profile;
  /** Consecutive days as of the last completion. 0 once the chain is broken. */
  streak: number;
  bestStreak: number;
  lastCompleted: string | null;
  totalCompleted: number;
  /** YYYY-MM-DD keys, capped at the most recent 400 days. */
  completedDates: string[];
  /**
   * क्षमा — छूटे दिन की माफ़ी। हर 7 दिन की साधना पर 1 मिलती है (ज़्यादा से ज़्यादा 2)।
   * दिन छूटने पर अपने आप लगती है, ताकि सिलसिला टूटे नहीं।
   */
  graceDays: number;
  /** विश्राम — YYYY-MM-DD, जिस दिन तक रुकना है (null = जारी है) */
  pausedUntil: string | null;
  /** विश्राम किस दिन से शुरू हुआ — माफ़ी सिर्फ़ इसी अवधि की है */
  pausedFrom: string | null;
  /**
   * विश्राम के दिन क्षमा में गिने जाते हैं — यह उनकी अंतिम तारीख है।
   * विश्राम ख़त्म होने पर भी यह बनी रहती है, ताकि लौटने पर सिलसिला वहीं से चले।
   */
  forgivenUntil: string | null;
  /** रुकते समय का स्ट्रीक, लौटने पर यहीं से आगे बढ़ेगा */
  streakAtPause: number;
  /** चालीसा यात्रा — अब तक पूरी हुई चौपाइयों की संख्या (हर पूजा के बाद +1) */
  chalisaRead: number;
  /** कथा में अब तक खुले प्रसंग — हर पूजा के बाद एक नया */
  kathaRevealed: number;
  /** जिस प्रसंग तक पहुँचे (पढ़ा), वह सबसे बड़ा संख्या */
  kathaRead: number;
};

/** हर इतने दिन बाद एक क्षमा दिन मिलता है */
export const GRACE_EVERY_DAYS = 7;
/** एक साथ जितनी क्षमा रख सकते हैं */
export const GRACE_MAX = 2;

/** localStorage की कुंजी — store और backup, दोनों यही इस्तेमाल करते हैं */
export const STATE_KEY = "bajrang.state.v1";

/** चालीसा यात्रा की कुल इकाइयाँ — content.ts भी यही संख्या बताता है */
export const CHALISA_MAX_UNITS = 43;

export const DEFAULT_STATE: AppState = {
  version: 1,
  profile: {
    name: "",
    sankalp: "",
    reminderTime: "06:00",
    reminderEnabled: false,
    chantingEnabled: true,
    onboarded: false,
    createdAt: toDateKey(new Date()),
  },
  streak: 0,
  bestStreak: 0,
  lastCompleted: null,
  totalCompleted: 0,
  completedDates: [],
  graceDays: 0,
  pausedUntil: null,
  pausedFrom: null,
  forgivenUntil: null,
  streakAtPause: 0,
  chalisaRead: 0,
  kathaRevealed: 0,
  kathaRead: 0,
};

export function sanitize(raw: unknown): AppState {
  if (!raw || typeof raw !== "object") return DEFAULT_STATE;
  const input = raw as Partial<AppState>;
  const profile = { ...DEFAULT_STATE.profile, ...(input.profile ?? {}) };
  profile.name = String(profile.name ?? "").slice(0, 40);
  profile.sankalp = String(profile.sankalp ?? "").slice(0, 140);
  profile.reminderTime = /^\d{2}:\d{2}$/.test(profile.reminderTime)
    ? profile.reminderTime
    : "06:00";
  profile.chantingEnabled = profile.chantingEnabled !== false;

  // यहाँ सिर्फ़ असली तारीखें रखी जाती हैं — `2026-13-45` जैसी चीज़ Date पलटकर
  // किसी दूसरी तारीख बना देती है, और फिर स्ट्रीक गढ़ी जा सकती है।
  const completedDates = Array.isArray(input.completedDates)
    ? Array.from(new Set(input.completedDates.filter(isValidDateKey))).sort()
    : [];
  const lastCompleted = isValidDateKey(input.lastCompleted)
    ? input.lastCompleted
    : (completedDates.at(-1) ?? null);

  const graceDays = Number.isFinite(input.graceDays)
    ? Math.min(GRACE_MAX, Math.max(0, Math.floor(input.graceDays as number)))
    : 0;

  const dateKey = (value: unknown): string | null => (isValidDateKey(value) ? value : null);

  const pausedUntil = dateKey(input.pausedUntil);
  const pausedFrom = dateKey(input.pausedFrom);
  const forgivenUntil = dateKey(input.forgivenUntil);

  const clampKatha = (value: unknown) =>
    Number.isFinite(value)
      ? Math.min(KATHA_TOTAL, Math.max(0, Math.floor(value as number)))
      : 0;

  return {
    version: 1,
    profile,
    streak: Number.isFinite(input.streak) ? Math.max(0, Math.floor(input.streak as number)) : 0,
    bestStreak: Number.isFinite(input.bestStreak)
      ? Math.max(0, Math.floor(input.bestStreak as number))
      : 0,
    lastCompleted,
    totalCompleted: Math.max(
      Number.isFinite(input.totalCompleted) ? (input.totalCompleted as number) : 0,
      completedDates.length,
    ),
    completedDates: completedDates.slice(-400),
    graceDays,
    pausedUntil,
    pausedFrom,
    forgivenUntil,
    streakAtPause: Number.isFinite(input.streakAtPause)
      ? Math.max(0, Math.floor(input.streakAtPause as number))
      : 0,
    // चालीसा यात्रा ४३ इकाइयाँ तक — यहाँ सीमा content.ts से आती है, इसलिए यहाँ
    // तय सीमा (KATHA_TOTAL) लगा दी गई है ताकि यह मॉड्यूल बिना content के चल सके।
    chalisaRead: Math.min(CHALISA_MAX_UNITS, Math.max(0, Math.floor(Number(input.chalisaRead) || 0))),
    kathaRevealed: clampKatha(input.kathaRevealed),
    kathaRead: Math.min(clampKatha(input.kathaRevealed), clampKatha(input.kathaRead)),
  };
}
