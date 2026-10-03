import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { verseOfDay } from "../lib/content";
import { playChime, playTempleBell, startChanting, stopChanting } from "../lib/audio";
import { haptic, requestWakeLock, type WakeLockSentinelLike } from "../lib/device";
import { actions, useDerivedState } from "../lib/store";
import { calendarDateForDevotionalDay, toHindiDigits } from "../lib/date";
import { Button } from "../components/ui/Button";
import { ProgressRing } from "../components/ui/ProgressRing";
import { ShareCardSheet } from "../components/ShareCardSheet";

const RITUAL_MS = 60_000;

/** एक पंक्ति या अर्थ — हिस्सा कितना समय पाएगा */
type Step = {
  kind: "line" | "meaning" | "chant";
  text: string;
  weight: number;
};

/** समय-बँटवारा हिस्सा (buildSteps के बाद जुड़ता है) */
type TimedStep = Step & { duration: number };

/**
 * पूजा को टुकड़ों में बाँट देना, ताकि मिनट खाली न लगे —
 * हर पंक्ति अपनी-अपनी बारी आती है और ध्यान बँटता नहीं।
 */
function buildSteps(verse: ReturnType<typeof verseOfDay>): TimedStep[] {
  const steps: Step[] = verse.lines.map((text) => ({ kind: "line", text, weight: 1 }));
  if (verse.meaning) {
    steps.push({ kind: "meaning", text: verse.meaning, weight: 2.1 });
  }
  if (verse.chant) {
    steps.push({ kind: "chant", text: verse.chant, weight: 1.6 });
  }

  const total = steps.reduce((sum, step) => sum + step.weight, 0);
  let assigned = 0;
  return steps.map((step, index) => {
    const duration =
      index === steps.length - 1
        ? Math.max(0, RITUAL_MS - assigned)
        : Math.round((step.weight / total) * RITUAL_MS);
    assigned += duration;
    return { ...step, duration };
  });
}

type Phase = "sound" | "prayer" | "done";

export function Ritual({ onExit }: { onExit: () => void }) {
  const state = useDerivedState();
  const verse = useMemo(() => verseOfDay(calendarDateForDevotionalDay()), []);
  const steps = useMemo(() => buildSteps(verse), [verse]);

  const [phase, setPhase] = useState<Phase>("sound");
  const [sound, setSound] = useState(state.profile.chantingEnabled);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<{
    newStreak: number;
    crossedMilestone: number | null;
  } | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [introStage, setIntroStage] = useState<"name" | "optional" | "done" | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftSankalp, setDraftSankalp] = useState("");
  const [draftTime, setDraftTime] = useState(state.profile.reminderTime);

  const startRef = useRef<number>(Date.now());
  const wakeLockRef = useRef<WakeLockSentinelLike | null>(null);

  const praying = phase === "prayer";
  const needsName = !state.profile.name.trim();
  const needsOptional =
    !state.profile.sankalp.trim() || !state.profile.reminderEnabled;

  /* ---- स्क्रीण जली रहे ---- */
  useEffect(() => {
    if (!praying) return;
    let cancelled = false;

    const acquire = async () => {
      const lock = await requestWakeLock();
      if (cancelled) {
        void lock?.release();
        return;
      }
      wakeLockRef.current = lock;
    };
    void acquire();

    const onVisible = () => {
      if (document.visibilityState === "visible" && !wakeLockRef.current) void acquire();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      void wakeLockRef.current?.release();
      wakeLockRef.current = null;
    };
  }, [praying]);

  /* ---- घंटी ---- */
  const finish = useCallback(() => {
    stopChanting();
    haptic([14, 60, 24]);
    const outcome = actions.completeRitual();
    setResult({ newStreak: outcome.newStreak, crossedMilestone: outcome.crossedMilestone });
    setPhase("done");
    setIntroStage(needsName ? "name" : needsOptional ? "optional" : "done");
    window.setTimeout(() => {
      playTempleBell();
      playChime();
    }, 700);
  }, [needsName, needsOptional]);

  /* ---- घड़ी ---- */
  useEffect(() => {
    if (!praying) return;
    startRef.current = Date.now();
    const tick = window.setInterval(() => {
      const passed = Date.now() - startRef.current;
      setElapsed(Math.min(RITUAL_MS, passed));
      if (passed >= RITUAL_MS) finish();
    }, 200);
    return () => window.clearInterval(tick);
  }, [praying, finish]);

  /* ---- मंत्र: चुनी गई आवाज़ ---- */
  useEffect(() => {
    if (!praying || !sound) return;
    startChanting();
    return stopChanting;
  }, [praying, sound]);

  function chooseSound(withSound: boolean) {
    setSound(withSound);
    actions.updateProfile({ chantingEnabled: withSound });
    setPhase("prayer");
  }

  /* ---- अभी कौन सी पंक्ति चल रही है ---- */
  let cursor = 0;
  let activeIndex = 0;
  let stepElapsed = 0;
  for (let i = 0; i < steps.length; i += 1) {
    const duration = steps[i].duration;
    if (elapsed < cursor + duration || i === steps.length - 1) {
      activeIndex = i;
      stepElapsed = elapsed - cursor;
      break;
    }
    cursor += duration;
  }
  const activeStep = steps[activeIndex];
  const stepProgress = Math.min(1, Math.max(0, stepElapsed / activeStep.duration));
  const remainingSeconds = Math.max(0, Math.ceil((RITUAL_MS - elapsed) / 1000));

  /* ================= 1. आवाज़ का चुनाव ================= */
  if (phase === "sound") {
    return (
      <div className="app-shell safe-top safe-bottom relative flex min-h-[100dvh] flex-col overflow-hidden bg-linear-to-b from-sindoor-700 via-sindoor-600 to-saffron-700 px-5 py-6 text-cream-100">
        <OmBackdrop />
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center">
          <span className="animate-floaty grid h-20 w-20 place-items-center rounded-full bg-white/12 text-4xl backdrop-blur-sm">
            🔔
          </span>
          <p className="mt-7 text-[11px] font-bold tracking-[0.2em] text-gold-200 uppercase">
            आज की पूजा
          </p>
          <h1 className="mt-2 text-[28px] leading-snug font-extrabold text-white">
            आवाज़ के साथ, या बिना?
          </h1>
          <p className="mt-3 max-w-xs text-[15px] leading-[1.85] text-cream-200">
            दोनों ही बराबर हैं। जो मन को भाए, वही चुनिए।
          </p>

          <div className="mt-9 w-full space-y-3">
            <Button variant="gold" size="xl" block onClick={() => chooseSound(true)}>
              <span className="text-xl">🔊</span> आवाज़ के साथ
            </Button>
            <Button
              variant="soft"
              size="xl"
              block
              className="border-white/25 bg-white/12 text-white"
              onClick={() => chooseSound(false)}
            >
              <span className="text-xl">🤫</span> बिना आवाज़
            </Button>
            <button
              type="button"
              onClick={onExit}
              className="pressable mt-2 w-full py-2 text-sm text-cream-300/80"
            >
              अभी नहीं
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ================= 2. पूजा ================= */
  if (praying) {
    return (
      <div className="app-shell safe-top safe-bottom relative flex min-h-[100dvh] flex-col overflow-hidden bg-linear-to-b from-sindoor-700 via-sindoor-600 to-saffron-700 px-5 text-cream-100">
        <OmBackdrop />

        <header className="relative z-10 flex items-center justify-between">
          <button
            type="button"
            onClick={onExit}
            className="pressable rounded-full bg-white/12 px-4 py-2 text-sm font-semibold text-cream-200 backdrop-blur-sm"
          >
            बंद करें
          </button>
          <span className="text-sm text-cream-200">
            पंक्ति {toHindiDigits(activeIndex + 1)} / {toHindiDigits(steps.length)}
          </span>
          <button
            type="button"
            onClick={() => setSound((prev) => !prev)}
            aria-label={sound ? "आवाज़ बंद करें" : "आवाज़ चालू करें"}
            className="pressable grid h-10 w-10 place-items-center rounded-full bg-white/12 text-lg backdrop-blur-sm"
          >
            {sound ? "🔊" : "🔇"}
          </button>
        </header>

        {/* पंक्ति-दर-पंक्ति — जो चल रही है वही चमकती है */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 py-4">
          <p className="rounded-full bg-white/10 px-4 py-1 text-[11px] font-semibold tracking-[0.14em] text-gold-200 uppercase">
            {verse.source}
          </p>

          <div className="flex w-full flex-col items-center gap-4">
            {steps.map((step, index) => {
              const isActive = index === activeIndex;
              const isDone = index < activeIndex;
              return (
                <div key={`${step.kind}-${index}`} className="relative w-full">
                  {isActive ? (
                    <span
                      aria-hidden
                      className="animate-breathe pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-[radial-gradient(ellipse_at_center,rgba(255,214,138,0.16),transparent_70%)]"
                    />
                  ) : null}
                  <p
                    className={
                      step.kind === "chant"
                        ? "text-center text-[28px] leading-[1.7] font-extrabold text-gold-200 transition-opacity duration-500 " +
                          (isActive ? "opacity-100" : isDone ? "opacity-50" : "opacity-35")
                        : step.kind === "meaning"
                          ? "text-center text-[16px] leading-[2] transition-all duration-500 " +
                            (isActive
                              ? "font-semibold text-cream-100 opacity-100"
                              : isDone
                                ? "font-medium text-cream-300/45"
                                : "text-cream-200/45")
                          : "text-center text-[25px] leading-[1.75] font-bold transition-all duration-500 " +
                            (isActive
                              ? "scale-[1.03] text-white"
                              : isDone
                                ? "text-gold-200/55"
                                : "text-white/35")
                    }
                  >
                    {step.text}
                  </p>
                  {isActive ? (
                    <div className="mx-auto mt-3 h-1 w-32 overflow-hidden rounded-full bg-white/20">
                      <div
                        className="h-full rounded-full bg-gold-200"
                        style={{ width: `${stepProgress * 100}%` }}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="flex flex-col items-center">
            <ProgressRing progress={elapsed / RITUAL_MS} size={150} stroke={8}>
              <div className="text-center">
                <p className="text-4xl font-extrabold text-white tabular-nums">
                  {toHindiDigits(remainingSeconds)}
                </p>
              </div>
            </ProgressRing>

            <div aria-hidden className="mt-4 flex gap-1.5">
              {steps.map((_, index) => (
                <span
                  key={index}
                  className={
                    index <= activeIndex
                      ? "h-1.5 w-6 rounded-full bg-gold-200"
                      : "h-1.5 w-6 rounded-full bg-white/20"
                  }
                />
              ))}
            </div>
          </div>

          <p aria-live="polite" className="sr-only">
            {activeStep.kind === "chant" ? "जप" : "पंक्ति"} {activeIndex + 1} —{" "}
            {remainingSeconds} सेकंड बाकी
          </p>

          <button
            type="button"
            onClick={finish}
            className="pressable text-sm text-cream-300/85 underline underline-offset-4"
          >
            मैंने जप पूरा कर लिया
          </button>
        </div>
      </div>
    );
  }

  /* ================= 3. घंटी के बाद ================= */
  return (
    <div className="app-shell safe-top safe-bottom relative flex min-h-[100dvh] flex-col overflow-hidden bg-linear-to-b from-saffron-600 via-saffron-500 to-sindoor-700 px-5 text-cream-100">
      <CelebrationHalo showDecorations={introStage === "done"} />

      {introStage === "name" ? (
        <NameStep
          value={draftName}
          onChange={setDraftName}
          onNext={() => {
            const clean = draftName.trim();
            if (clean) actions.updateProfile({ name: clean });
            setIntroStage(needsOptional ? "optional" : "done");
          }}
          onSkip={() => setIntroStage(needsOptional ? "optional" : "done")}
        />
      ) : introStage === "optional" ? (
        <OptionalStep
          sankalp={draftSankalp}
          time={draftTime}
          onSankalpChange={setDraftSankalp}
          onTimeChange={setDraftTime}
          onNext={() => {
            actions.updateProfile({
              sankalp: draftSankalp.trim() || state.profile.sankalp,
              reminderTime: draftTime,
            });
            void enableReminder();
            setIntroStage("done");
          }}
          onSkip={() => {
            actions.updateProfile({ reminderTime: draftTime });
            setIntroStage("done");
          }}
        />
      ) : (
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center">
          <div className="animate-floaty grid h-28 w-28 place-items-center rounded-full bg-white/15 text-6xl shadow-glow backdrop-blur-sm">
            🙏
          </div>

          <h1 className="mt-7 text-4xl font-extrabold text-white">पूजा पूरी!</h1>
          <p className="mt-2 text-lg text-cream-200">हनुमान जी आपके साथ हैं</p>

          <div className="mt-7 rounded-[28px] border border-gold-300/50 bg-sindoor-800/35 px-8 py-7 backdrop-blur-sm">
            <p className="text-sm tracking-wide text-cream-300">आपकी लगातार पूजा</p>
            <p className="mt-1 text-5xl leading-none font-extrabold text-gold-200">
              🔥 {toHindiDigits(result?.newStreak ?? state.streak)}
            </p>
            <p className="mt-3 text-sm text-cream-200">
              कुल {toHindiDigits(state.totalCompleted)} पूजा पूर्ण
            </p>
          </div>

          {result?.crossedMilestone ? (
            <div className="animate-rise mt-5 rounded-3xl border border-gold-300 bg-gold-200/95 px-6 py-4 text-ink-900 shadow-glow">
              <p className="text-2xl">
                {result.crossedMilestone === 108 ? "🏅" : "🏵️"} नया बैज!
              </p>
              <p className="mt-1 text-lg font-bold">
                {toHindiDigits(result.crossedMilestone)} दिन —{" "}
                {result.crossedMilestone === 108
                  ? "परम भक्त"
                  : result.crossedMilestone === 21
                    ? "अभ्यासी भक्त"
                    : "सप्ताही भक्त"}
              </p>
            </div>
          ) : null}

          <div className="mt-8 w-full space-y-3">
            <Button variant="gold" size="xl" block onClick={() => setShareOpen(true)}>
              <span>साझा करें</span>
              <span className="text-base font-normal">Share</span>
            </Button>
            <Button
              variant="soft"
              size="lg"
              block
              className="border-white/30 bg-white/15 text-white"
              onClick={onExit}
            >
              होम पर जाएँ
            </Button>
          </div>
        </div>
      )}

      <ShareCardSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        periodDays={result?.newStreak ?? state.streak}
      />
    </div>
  );

  async function enableReminder() {
    const { requestPermission } = await import("../lib/reminder");
    const granted = await requestPermission();
    actions.updateProfile({ reminderEnabled: granted });
  }
}

/* ---------------- घंटी के बाद नाम पूछना ---------------- */

function NameStep({
  value,
  onChange,
  onNext,
  onSkip,
}: {
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center">
      <span className="animate-floaty grid h-20 w-20 place-items-center rounded-full bg-white/15 text-4xl">
        🙏
      </span>
      <h1 className="mt-6 text-3xl font-extrabold text-white">पूजा पूरी! 🙏</h1>
      <p className="mt-3 max-w-xs text-[15px] leading-[1.85] text-cream-200">
        हनुमान जी ने आपका नाम जान लिया। वे हर दिन आपको याद करेंगे।
      </p>

      <input
        autoFocus
        value={value}
        maxLength={40}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && value.trim()) onNext();
        }}
        placeholder="आपका नाम"
        className="mt-7 w-full max-w-xs rounded-3xl border-2 border-gold-300/60 bg-white/95 px-5 py-4 text-center text-xl font-bold text-ink-900 placeholder:font-normal placeholder:text-ink-500/50"
      />

      <div className="mt-4 w-full max-w-xs space-y-2.5">
        <Button variant="gold" size="lg" block disabled={!value.trim()} onClick={onNext}>
          सहेजें
        </Button>
        <button type="button" onClick={onSkip} className="pressable w-full py-2 text-sm text-cream-300/80">
          रहने दीजिए
        </button>
      </div>
    </div>
  );
}

/* ---------------- वैकल्पिक: संकल्प + समय ---------------- */

const TIME_PRESETS = ["05:30", "06:00", "06:30", "07:00", "07:30"];

function OptionalStep({
  sankalp,
  time,
  onSankalpChange,
  onTimeChange,
  onNext,
  onSkip,
}: {
  sankalp: string;
  time: string;
  onSankalpChange: (v: string) => void;
  onTimeChange: (v: string) => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
      <h1 className="text-center text-2xl font-extrabold text-white">
        एक संकल्प रख लीजिए
      </h1>
      <p className="mt-2 max-w-xs text-center text-sm leading-[1.85] text-cream-200">
        यह कोई बात नहीं — पर रोज़ याद आएगा।
      </p>

      <input
        value={sankalp}
        maxLength={140}
        onChange={(event) => onSankalpChange(event.target.value)}
        placeholder="जैसे: परीक्षा में पास होना"
        className="mt-6 w-full max-w-xs rounded-3xl border-2 border-gold-300/50 bg-white/95 px-5 py-4 text-lg font-semibold text-ink-900 placeholder:font-normal placeholder:text-ink-500/50"
      />

      <p className="mt-6 text-xs font-bold tracking-[0.14em] text-gold-200 uppercase">
        रोज़ किस समय याद करें?
      </p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {TIME_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onTimeChange(preset)}
            className={
              "pressable rounded-2xl px-4 py-2.5 text-sm font-bold " +
              (time === preset
                ? "bg-gold-300 text-ink-900"
                : "bg-white/12 text-cream-200")
            }
          >
            {preset}
          </button>
        ))}
      </div>

      <div className="mt-7 w-full max-w-xs space-y-2.5">
        <Button variant="gold" size="lg" block onClick={onNext}>
          याद दिलाना चालू करें
        </Button>
        <button type="button" onClick={onSkip} className="pressable w-full py-2 text-sm text-cream-300/80">
          बाद में करूँगा
        </button>
      </div>
    </div>
  );
}

function OmBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_50%_18%,rgba(255,208,131,0.28),transparent_65%)]" />
      <span className="absolute -top-10 left-1/2 -translate-x-1/2 text-[280px] leading-none text-white/6 select-none">
        ॐ
      </span>
    </div>
  );
}

/**
 * पूजा पूरी होने का प्रभाव।
 * नाम/संकल्प पूछते समय सजावट हटा दी जाती है ताकि पढ़ने में दिक्कत न हो।
 */
function CelebrationHalo({ showDecorations }: { showDecorations: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-x-0 -top-24 h-[520px] bg-[radial-gradient(circle_at_50%_25%,rgba(255,236,168,0.5),transparent_62%)]" />
      {showDecorations ? (
        <>
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className="animate-ring-pop absolute top-[18%] left-1/2 h-64 w-64 -translate-x-1/2 rounded-full border-2 border-gold-200/60"
              style={{ animationDelay: `${index * 0.6}s` }}
            />
          ))}
          <span className="animate-floaty absolute top-[44%] right-8 text-3xl text-gold-200/70">
            🪔
          </span>
          <span
            className="animate-floaty absolute top-[54%] left-8 text-2xl text-gold-200/60"
            style={{ animationDelay: "0.8s" }}
          >
            ✨
          </span>
        </>
      ) : null}
    </div>
  );
}
