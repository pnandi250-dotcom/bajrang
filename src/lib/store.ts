import { useSyncExternalStore } from "react";
import { plan, type PlanEntry } from "./katha";
import { chalisaUnitCount } from "./content";
import { track } from "./analytics";

// ये दोनों UI भी इस्तेमाल करता है (होम और सेटिंग्स)
export { GRACE_EVERY_DAYS, GRACE_MAX } from "./state";
import {
  DEFAULT_STATE,
  GRACE_EVERY_DAYS,
  GRACE_MAX,
  sanitize,
  STATE_KEY,
  type AppState,
  type Profile,
} from "./state";
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

export type { Lang as Language } from "./i18n";


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

const STORAGE_KEY = STATE_KEY;

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

/** बदलाव की सूचना — React के बाहर भी इस्तेमाल हो सकती है */
export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}


/**
 * `localStorage` से फिर से पढ़ो — बैकअप आयात के बाद।
 * पूरा पेज रीलोड करने की ज़रूरत नहीं, इसलिए उपयोगकर्ता वहीं रहता है।
 */
export function reloadFromStorage(): void {
  state = load();
  emit();
}

/** कच्ची स्थिति — React के बाहर भी पढ़ी जा सकती है (परीक्षण, बैकअप) */
export function getState(): AppState {
  return state;
}

/** गिनती-सहित की स्थिति — यही UI दिखाता है */
export function getDerived(): DerivedState {
  const raw = state;
  // पूजा का दिन 3:00 बजे से शुरू होता है
  const view = streakView(raw, devotionalDateKey());
  return {
    ...raw,
    ...view,
    bestStreak: Math.max(raw.bestStreak, view.streak, raw.streakAtPause),
    isSpecialDay: isHanumanDay(fromDateKey(view.todayKey)),
  };
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getState, getState);
}

export function useDerivedState(): DerivedState {
  return useSyncExternalStore(subscribe, getDerived, getDerived);
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

export type StreakView = {
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

/** UI को दिखने वाली पूरी स्थिति — कच्ची स्थिति + गिनती */
export type DerivedState = AppState &
  StreakView & { bestStreak: number; isSpecialDay: boolean };

export type KathaReveal = PlanEntry;

/** पूजा के बाद खुलने वाला अगला प्रसंग — कथा पूरी हो गई तो null */
function revealKatha(): KathaReveal | null {
  return plan()[state.kathaRevealed] ?? null;
}

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
    /** पूजा के बाद खुला नया प्रसंग */
    katha: KathaReveal | null;
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
        katha: null,
      };
    }

    const yesterdayKey = devotionalYesterday();
    const previousBest = Math.max(state.bestStreak, state.streak);

    // विश्राम में पूजा की — बढ़ती नहीं, टूटती भी नहीं। यही आराम का मतलब है।
    if (state.pausedUntil && state.pausedUntil >= todayKey) {
      const katha = revealKatha();
      commit({
        ...state,
        // यह भी दर्ज करो — वरना विश्राम में उसी दिन दो बार पूजा करने पर
        // कथा और यात्रा दो-दो बार बढ़ जाती है।
        lastCompleted: todayKey,
        totalCompleted: state.totalCompleted + 1,
        completedDates: [...state.completedDates, todayKey].slice(-400),
        chalisaRead: Math.min(chalisaUnitCount(), state.chalisaRead + 1),
        kathaRevealed: state.kathaRevealed + (katha ? 1 : 0),
      });
      return {
        newStreak: state.streakAtPause,
        isNewBest: false,
        crossedMilestone: null,
        usedGrace: false,
        earnedGrace: false,
        paused: true,
        katha,
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
    // सिलसिला टूटा — यह गिना जाए, पर नाम या कोई पहचान नहीं
    if (!continued && !graceCoversGap && state.streak > 1) track("streak_broken");

    // हर 7 दिन पर एक क्षमा कमाओ (ज़्यादा से ज़्यादा 2 साथ में)
    let earnedGrace = false;
    if (newStreak > 0 && newStreak % GRACE_EVERY_DAYS === 0 && graceLeft < GRACE_MAX) {
      graceLeft += 1;
      earnedGrace = true;
    }

    const katha = revealKatha();

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
      chalisaRead: Math.min(chalisaUnitCount(), state.chalisaRead + 1),
      kathaRevealed: state.kathaRevealed + (katha ? 1 : 0),
    });

    return {
      newStreak,
      isNewBest: newStreak > previousBest,
      crossedMilestone: findMilestone(previousBest, newStreak),
      usedGrace: graceCoversGap,
      earnedGrace,
      paused: false,
      katha,
    };
  },

  /** प्रसंग पढ़ लिया — तभी आगे का हिसाब चलता है */
  markKathaRead(n: number) {
    const read = Math.min(state.kathaRevealed, Math.max(0, Math.floor(n)));
    if (read <= state.kathaRead) return;
    track("katha_read");
    commit({ ...state, kathaRead: read });
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
    // सचमुच नया शुरुआत — नाम और संकल्प भी मिट जाते हैं, जैसा सेटिंग्स में लिखा है।
    // `onboarded` सच रहता है ताकि दोबारा परिचय न दिखे; स्ट्रीक शून्य से शुरू होती है।
    commit({
      ...DEFAULT_STATE,
      profile: {
        ...DEFAULT_STATE.profile,
        createdAt: toDateKey(new Date()),
        onboarded: true,
      },
    });
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

