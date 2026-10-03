import { useSyncExternalStore } from "react";
import {
  addDays,
  calendarDateForDevotionalDay,
  daysBetween,
  devotionalDateKey,
  fromDateKey,
  isHanumanDay,
  toDateKey,
} from "./date";

/** पूजा-कल — दिन की शुरुआत 3:00 बजे है, इसलिए कल भी उसी हिसाब से गिना जाएगा */
function devotionalYesterday(): string {
  return toDateKey(addDays(calendarDateForDevotionalDay(), -1));
}

export type Language = "hi" | "en";

export type Profile = {
  name: string;
  sankalp: string;
  reminderTime: string;
  reminderEnabled: boolean;
  /** पूजा के दौरान हल्का "ॐ" मंत्र सुनना */
  chantingEnabled: boolean;
  language: Language;
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
};

/** हर इतने दिन बाद एक क्षमा दिन मिलता है */
export const GRACE_EVERY_DAYS = 7;
/** एक साथ जितनी क्षमा रख सकते हैं */
export const GRACE_MAX = 2;

const STORAGE_KEY = "bajrang.state.v1";

const DEFAULT_STATE: AppState = {
  version: 1,
  profile: {
    name: "",
    sankalp: "",
    reminderTime: "06:00",
    reminderEnabled: false,
    chantingEnabled: true,
    language: "hi",
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
};

function sanitize(raw: unknown): AppState {
  if (!raw || typeof raw !== "object") return DEFAULT_STATE;
  const input = raw as Partial<AppState>;
  const profile = { ...DEFAULT_STATE.profile, ...(input.profile ?? {}) };
  profile.name = String(profile.name ?? "").slice(0, 40);
  profile.sankalp = String(profile.sankalp ?? "").slice(0, 140);
  profile.reminderTime = /^\d{2}:\d{2}$/.test(profile.reminderTime)
    ? profile.reminderTime
    : "06:00";
  profile.language = profile.language === "en" ? "en" : "hi";
  profile.chantingEnabled = profile.chantingEnabled !== false;

  const completedDates = Array.isArray(input.completedDates)
    ? Array.from(new Set(input.completedDates.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)))).sort()
    : [];
  const lastCompleted =
    typeof input.lastCompleted === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.lastCompleted)
      ? input.lastCompleted
      : (completedDates.at(-1) ?? null);

  const graceDays = Number.isFinite(input.graceDays)
    ? Math.min(GRACE_MAX, Math.max(0, Math.floor(input.graceDays as number)))
    : 0;

  const dateKey = (value: unknown): string | null =>
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;

  const pausedUntil = dateKey(input.pausedUntil);
  const pausedFrom = dateKey(input.pausedFrom);
  const forgivenUntil = dateKey(input.forgivenUntil);

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
  };
}

function load(): AppState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return sanitize(JSON.parse(raw));
  } catch {
    return DEFAULT_STATE;
  }
}

let state: AppState = load();
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function commit(next: AppState) {
  state = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage full or blocked — the app keeps working in-memory */
  }
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

export function useDerivedState() {
  const raw = useAppState();

  // पूजा का दिन 3:00 बजे से शुरू होता है
  const view = streakView(raw, devotionalDateKey());

  return {
    ...raw,
    ...view,
    bestStreak: Math.max(raw.bestStreak, view.streak, raw.streakAtPause),
    isSpecialDay: isHanumanDay(fromDateKey(view.todayKey)),
  };
}

/**
 * विश्राम की माफ़ी — जो दिन विश्राम की अवधि में बीत गए, वे छूटे नहीं गिने जाते।
 * माफ़ी सिर्फ़ इतनी ही है जितनी विश्राम थी, और उतनी ही जब तक पूजा फिर से शुरू न हो।
 */
function forgivenInGap(
  pausedFrom: string | null,
  forgivenUntil: string | null,
  lastCompleted: string | null,
  gapDays: number,
): number {
  if (!lastCompleted || !forgivenUntil) return 0;
  if (forgivenUntil <= lastCompleted) return 0;
  if (pausedFrom && pausedFrom > forgivenUntil) return 0;
  return Math.min(Math.max(0, daysBetween(lastCompleted, forgivenUntil)), gapDays);
}

type StreakView = {
  todayKey: string;
  doneToday: boolean;
  /** पिछली पूजा के बाद के सारे छूटे दिन (आज शामिल नहीं) */
  gapDays: number;
  /** उनमें से विश्राम के दिन */
  forgivenDays: number;
  /** असली छूट — यही स्क्रीन पर दिखता है */
  missedDays: number;
  graceWillCover: number;
  willRecoverWithGrace: boolean;
  streakAlive: boolean;
  streak: number;
  isPaused: boolean;
  pauseDaysLeft: number;
};

/** स्ट्रीक का पूरा हिसाब — यही स्क्रीन दिखाती है और विश्राम भी यहीं से जुकता है */
function streakView(state: AppState, todayKey: string): StreakView {
  const doneToday = state.lastCompleted === todayKey;
  const gapDays =
    state.lastCompleted && !doneToday
      ? Math.max(0, daysBetween(state.lastCompleted, todayKey) - 1)
      : 0;
  const forgivenDays = forgivenInGap(
    state.pausedFrom,
    state.forgivenUntil,
    state.lastCompleted,
    gapDays,
  );
  const missedDays = Math.max(0, gapDays - forgivenDays);

  // क्षमा दिनों से छूट ढक जाए तो सिलसिला ज़िंदा ही माना जाएगा
  const graceWillCover = Math.min(missedDays, state.graceDays);
  const willRecoverWithGrace = missedDays > 0 && graceWillCover === missedDays;
  const streakAlive = Boolean(
    state.lastCompleted && (doneToday || missedDays === 0 || willRecoverWithGrace),
  );

  // विश्राम जारी है? आखिरी तारीख आज या आगे हो तो हाँ
  const isPaused = Boolean(state.pausedUntil && state.pausedUntil >= todayKey);

  return {
    todayKey,
    doneToday,
    gapDays,
    forgivenDays,
    missedDays,
    graceWillCover,
    willRecoverWithGrace,
    streakAlive,
    // विश्राम में स्ट्रीक जहाँ थी वहीं ठहरी हुई है — यही उसकी दीवा है
    streak: isPaused
      ? state.streakAtPause
      : doneToday
        ? state.streak
        : streakAlive
          ? state.streak
          : 0,
    isPaused,
    pauseDaysLeft: isPaused
      ? Math.max(0, daysBetween(todayKey, state.pausedUntil as string))
      : 0,
  };
}

export type DerivedState = ReturnType<typeof useDerivedState>;

export const actions = {
  completeOnboarding(profile: Partial<Profile>) {
    commit({
      ...state,
      profile: { ...state.profile, ...profile, onboarded: true },
    });
  },

  updateProfile(patch: Partial<Profile>) {
    commit({ ...state, profile: { ...state.profile, ...patch } });
  },

  /** Called when the 60-second ritual finishes. */
  completeRitual(): {
    newStreak: number;
    isNewBest: boolean;
    crossedMilestone: number | null;
    usedGrace: boolean;
    earnedGrace: boolean;
    paused: boolean;
  } {
    const todayKey = devotionalDateKey();
    if (state.lastCompleted === todayKey) {
      return {
        newStreak: state.streak,
        isNewBest: false,
        crossedMilestone: null,
        usedGrace: false,
        earnedGrace: false,
        paused: false,
      };
    }

    const yesterdayKey = devotionalYesterday();
    const previousBest = Math.max(state.bestStreak, state.streak);

    // विश्राम में पूजा की — बढ़ती नहीं, टूटती भी नहीं। यही आराम का मतलब है।
    if (state.pausedUntil && state.pausedUntil >= todayKey) {
      commit({
        ...state,
        totalCompleted: state.totalCompleted + 1,
        completedDates: [...state.completedDates, todayKey].slice(-400),
      });
      return {
        newStreak: state.streakAtPause,
        isNewBest: false,
        crossedMilestone: null,
        usedGrace: false,
        earnedGrace: false,
        paused: true,
      };
    }

    // पिछली पूजा के बाद छूटे दिन — विश्राम के दिन पहले ही माफ़ हो चुके हैं
    const view = streakView(state, todayKey);
    const continued =
      Boolean(state.lastCompleted) &&
      (state.lastCompleted === yesterdayKey || view.missedDays === 0);

    // दिन छूट गए — क्षमा दिनों से सब ढकने चाहिए, वरना सिलसिला टूट जाए
    const graceCoversGap = view.missedDays > 0 && state.graceDays >= view.missedDays;
    const graceUsed = graceCoversGap ? view.missedDays : 0;
    let graceLeft = state.graceDays - graceUsed;

    const newStreak = continued || graceCoversGap ? state.streak + 1 : 1;

    // हर 7 दिन पर एक क्षमा कमाओ (ज़्यादा से ज़्यादा 2 साथ में)
    let earnedGrace = false;
    if (newStreak > 0 && newStreak % GRACE_EVERY_DAYS === 0 && graceLeft < GRACE_MAX) {
      graceLeft += 1;
      earnedGrace = true;
    }

    commit({
      ...state,
      streak: newStreak,
      bestStreak: Math.max(previousBest, newStreak),
      lastCompleted: todayKey,
      totalCompleted: state.totalCompleted + 1,
      completedDates: [...state.completedDates, todayKey].slice(-400),
      graceDays: graceLeft,
      pausedUntil: null,
      pausedFrom: null,
      forgivenUntil: null,
      streakAtPause: newStreak,
    });

    return {
      newStreak,
      isNewBest: newStreak > previousBest,
      crossedMilestone: findMilestone(previousBest, newStreak),
      usedGrace: graceCoversGap,
      earnedGrace,
      paused: false,
    };
  },

  /** विश्राम — n दिन के लिए रुकना। स्ट्रीक यहीं ठहर जाती है। */
  pauseFor(days: number) {
    const clamped = Math.max(1, Math.min(30, Math.floor(days)));
    const from = devotionalDateKey();
    const until = toDateKey(addDays(fromDateKey(from), clamped - 1));
    // जो स्ट्रीक अभी स्क्रीन पर दिख रही है, वही जुकती है — टूटी हुई साधना नहीं
    const frozen = streakView(state, from).streak;
    commit({
      ...state,
      streak: frozen,
      streakAtPause: frozen,
      pausedFrom: from,
      forgivenUntil: until,
      pausedUntil: until,
    });
  },

  /** विश्राम ख़त्म — सिलसिला वहीं से आगे बढ़ेगा, रुके हुए दिन माफ़ रहेंगे */
  resumeFromPause() {
    if (!state.pausedUntil) return;
    const todayKey = devotionalDateKey();
    // जल्दी लौटे तो सिर्फ़ बीत चुके दिन माफ़ — आगे के दिन नहीं
    const forgivenUntil = state.pausedUntil < todayKey ? state.pausedUntil : todayKey;
    commit({ ...state, pausedUntil: null, forgivenUntil });
  },

  /** Devotional apps should always offer a way back — used by Settings. */
  resetAll() {
    commit({ ...DEFAULT_STATE, profile: { ...state.profile, createdAt: toDateKey(new Date()), onboarded: true } });
  },
};

export type Milestone = { days: number; label: string; title: string; note: string; golden?: boolean };

export const MILESTONES: Milestone[] = [
  {
    days: 7,
    label: "सप्ताही भक्त",
    title: "7 दिन",
    note: "एक हफ़्ते की लगातार साधना। बहुत बढ़िया शुरुआत!",
  },
  {
    days: 21,
    label: "अभ्यासी भक्त",
    title: "21 दिन",
    note: "तीन हफ़्ते। अब यह आपकी दिनचर्या बन गई।",
  },
  {
    days: 108,
    label: "परम भक्त",
    title: "108 दिन",
    note: "108 — चालीसा के बारह आयाम। हनुमान जी की पूर्ण कृपा।",
    golden: true,
  },
];

export function findMilestone(before: number, after: number): number | null {
  for (const milestone of MILESTONES) {
    if (after >= milestone.days && before < milestone.days) return milestone.days;
  }
  return null;
}

