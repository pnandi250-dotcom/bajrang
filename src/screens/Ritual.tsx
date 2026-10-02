import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { verseOfDay } from "../lib/content";
import { playChime, playTempleBell, startChanting, stopChanting } from "../lib/audio";
import { haptic, requestWakeLock, type WakeLockSentinelLike } from "../lib/device";
import { actions, useDerivedState } from "../lib/store";
import { toHindiDigits } from "../lib/date";
import { Button } from "../components/ui/Button";
import { ProgressRing } from "../components/ui/ProgressRing";
import { ShareCardSheet } from "../components/ShareCardSheet";

const RITUAL_MS = 60_000;

export function Ritual({ onExit }: { onExit: () => void }) {
  const state = useDerivedState();
  const verse = useMemo(() => verseOfDay(new Date()), []);

  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const [screenAwake, setScreenAwake] = useState(false);
  const [result, setResult] = useState<{
    newStreak: number;
    crossedMilestone: number | null;
  } | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const startRef = useRef<number>(Date.now());
  const wakeLockRef = useRef<WakeLockSentinelLike | null>(null);

  const chanting = state.profile.chantingEnabled;

  // 60 सेकंड तक स्क्रीन बुझने न दें
  useEffect(() => {
    let cancelled = false;

    const acquire = async () => {
      const lock = await requestWakeLock();
      if (cancelled) {
        void lock?.release();
        return;
      }
      wakeLockRef.current = lock;
      setScreenAwake(Boolean(lock));
    };

    if (!finished) void acquire();

    // फ़ोन/टैब दूसरी बार खुले तो फिर से जगाएँ
    const onVisible = () => {
      if (document.visibilityState === "visible" && !finished && !wakeLockRef.current) {
        void acquire();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      void wakeLockRef.current?.release();
      wakeLockRef.current = null;
    };
  }, [finished]);

  const finish = useCallback(() => {
    if (finished) return;
    setFinished(true);
    setElapsed(RITUAL_MS);
    haptic([14, 60, 24]);
    // मंत्र पहले धीमा हो, फिर घंटी — ताकि घंटी साफ़ सुनाई दे
    stopChanting();
    const outcome = actions.completeRitual();
    setResult({ newStreak: outcome.newStreak, crossedMilestone: outcome.crossedMilestone });
    window.setTimeout(() => {
      playTempleBell();
      playChime();
    }, 900);
  }, [finished]);

  useEffect(() => {
    startRef.current = Date.now();
  }, []);

  // पूजा के दौरान हल्का मंत्र — सिर्फ़ तब जब यह चालू हो
  useEffect(() => {
    if (!chanting || finished) return;
    startChanting();
    return stopChanting;
  }, [chanting, finished]);

  useEffect(() => {
    if (finished) return;
    const tick = window.setInterval(() => {
      const passed = Date.now() - startRef.current;
      setElapsed(Math.min(RITUAL_MS, passed));
      if (passed >= RITUAL_MS) finish();
    }, 200);
    return () => window.clearInterval(tick);
  }, [finish, finished]);

  const remainingSeconds = Math.max(0, Math.ceil((RITUAL_MS - elapsed) / 1000));
  const progress = elapsed / RITUAL_MS;

  if (finished) {
    return (
      <div className="app-shell safe-top safe-bottom relative flex min-h-[100dvh] flex-col overflow-hidden bg-linear-to-b from-saffron-600 via-saffron-500 to-sindoor-700 px-5 text-cream-100">
        <CelebrationHalo />
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center">
          <div className="animate-floaty grid h-28 w-28 place-items-center rounded-full bg-white/15 text-6xl shadow-glow backdrop-blur-sm">
            🙏
          </div>

          <h1 className="mt-7 text-4xl font-extrabold text-white">पूजा पूरी!</h1>
          <p className="mt-2 text-lg text-cream-200">हनुमान जी आपके साथ हैं</p>

          <div className="mt-7 rounded-[28px] border border-gold-300/50 bg-sindoor-800/35 px-8 py-7 text-center backdrop-blur-sm">
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
                {
                  result.crossedMilestone === 108
                    ? "परम भक्त"
                    : result.crossedMilestone === 21
                      ? "अभ्यासी भक्त"
                      : "सप्ताही भक्त"
                }
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

        <ShareCardSheet
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          periodDays={result?.newStreak ?? state.streak}
        />
      </div>
    );
  }

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
        <span className="rounded-full bg-white/12 px-4 py-2 text-sm text-cream-200">
          1 मिनट की पूजा
        </span>
        <button
          type="button"
          onClick={() => actions.updateProfile({ chantingEnabled: !chanting })}
          aria-label={chanting ? "मंत्र बंद करें" : "मंत्र चालू करें"}
          className="pressable grid h-10 w-10 place-items-center rounded-full bg-white/12 text-lg backdrop-blur-sm"
        >
          {chanting ? "🔊" : "🔇"}
        </button>
      </header>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center py-5 text-center">
        <p className="rounded-full bg-white/10 px-4 py-1 text-[11px] font-semibold tracking-[0.14em] text-gold-200 uppercase">
          {verse.source}
        </p>

        <h1 className="mt-6 text-[25px] leading-[1.85] font-bold text-white sm:text-[29px]">
          {verse.lines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h1>

        <p className="mt-5 max-w-sm text-[15px] leading-[1.9] text-cream-200">
          {verse.meaning}
        </p>

        {verse.chant ? (
          <p className="mt-5 rounded-2xl border border-gold-300/40 bg-sindoor-800/40 px-5 py-3 text-xl font-bold text-gold-200">
            {verse.chant}
          </p>
        ) : null}

        <div className="relative mt-8 grid place-items-center">
          {/* साँस का घेरा — धीरे चलता है, मन शांत करने के लिए */}
          <span
            aria-hidden
            className="animate-breathe pointer-events-none absolute h-[268px] w-[268px] rounded-full border border-gold-200/20 bg-[radial-gradient(circle,rgba(255,208,131,0.16),transparent_70%)]"
          />
          <ProgressRing progress={progress} size={230} stroke={11}>
            <div className="text-center">
              <p className="text-5xl font-extrabold text-white tabular-nums">
                {toHindiDigits(remainingSeconds)}
              </p>
              <p className="mt-1 text-sm text-cream-300">सेकंड</p>
            </div>
          </ProgressRing>
        </div>

        {/* जाननेदार के लिए पूरी पूजा साफ़ घोषणा होती रहे */}
        <p aria-live="polite" className="sr-only">
          {finished ? "पूजा पूरी" : `अभी ${remainingSeconds} सेकंड बाकी`}
        </p>

        <p className="mt-6 max-w-xs text-sm leading-[1.85] text-cream-300">
          मन लगाकर पढ़िए या जप कीजिए। धीमी साँस लीजिए — उनका साथ महसूस होगा।
        </p>

        <div className="mt-3 flex flex-col items-center gap-2">
          {screenAwake ? (
            <span className="rounded-full bg-white/8 px-3 py-1 text-[11px] font-semibold text-cream-300">
              स्क्रीन जली है — आराम से पढ़िए
            </span>
          ) : null}
          <button
            type="button"
            onClick={finish}
            className="pressable text-sm text-cream-300/90 underline underline-offset-4"
          >
            मैंने जप पूरा कर लिया
          </button>
        </div>
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

function CelebrationHalo() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-x-0 -top-24 h-[520px] bg-[radial-gradient(circle_at_50%_25%,rgba(255,236,168,0.5),transparent_62%)]" />
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
    </div>
  );
}