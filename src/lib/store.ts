import { useSyncExternalStore } from "react";
import { addDays, daysBetween, toDateKey } from "./date";

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
};

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

  const todayKey = toDateKey(new Date());
  const doneToday = raw.lastCompleted === todayKey;
  const yesterdayKey = toDateKey(addDays(new Date(), -1));

  const missedDays =
    raw.lastCompleted && !doneToday ? Math.max(0, daysBetween(raw.lastCompleted, todayKey) - 1) : 0;

  // A chain is alive only if the last completion was today or yesterday.
  const streakAlive = Boolean(raw.lastCompleted && (doneToday || raw.lastCompleted === yesterdayKey));
  const streak = doneToday ? raw.streak : streakAlive ? raw.streak : 0;

  return {
    ...raw,
    doneToday,
    streak,
    streakAlive,
    missedDays,
    bestStreak: Math.max(raw.bestStreak, streak),
    todayKey,
    isSpecialDay: new Date().getDay() === 2 || new Date().getDay() === 6,
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
  completeRitual(): { newStreak: number; isNewBest: boolean; crossedMilestone: number | null } {
    const todayKey = toDateKey(new Date());
    if (state.lastCompleted === todayKey) {
      return { newStreak: state.streak, isNewBest: false, crossedMilestone: null };
    }

    const yesterdayKey = toDateKey(addDays(new Date(), -1));
    const continued = state.lastCompleted === yesterdayKey;
    const newStreak = continued ? state.streak + 1 : 1;
    const previousBest = Math.max(state.bestStreak, state.streak);

    commit({
      ...state,
      streak: newStreak,
      bestStreak: Math.max(previousBest, newStreak),
      lastCompleted: todayKey,
      totalCompleted: state.totalCompleted + 1,
      completedDates: [...state.completedDates, todayKey].slice(-400),
    });

    return {
      newStreak,
      isNewBest: newStreak > previousBest,
      crossedMilestone: findMilestone(previousBest, newStreak),
    };
  },

  /** Devotional apps should always offer a way back — used by Settings. */
  resetAll() {
    commit({ ...DEFAULT_STATE, profile: { ...DEFAULT_STATE.profile, createdAt: toDateKey(new Date()) } });
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

