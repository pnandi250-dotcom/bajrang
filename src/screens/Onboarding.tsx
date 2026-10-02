import { useState } from "react";
import { actions } from "../lib/store";
import { Button } from "../components/ui/Button";
import { normalizeTime } from "../lib/date";
import { cn } from "../lib/utils";

const TIME_PRESETS = ["05:30", "06:00", "06:30", "07:00", "07:30"];

const SANKALP_EXAMPLES = [
  "परीक्षा में पास होना",
  "परिवार का स्वास्थ्य",
  "नौकरी मिलना",
  "शांति और सच्चाई",
];

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [time, setTime] = useState("06:00");
  const [sankalp, setSankalp] = useState("");

  const canContinue = step === 0 ? name.trim().length > 0 : true;

  function finish() {
    actions.completeOnboarding({
      name: name.trim(),
      reminderTime: normalizeTime(time),
      sankalp: sankalp.trim(),
    });
    onDone();
  }

  return (
    <div className="safe-top safe-bottom relative flex min-h-[100dvh] flex-col overflow-hidden bg-linear-to-b from-saffron-100 via-cream-100 to-cream-200 px-6">
      <Backdrop />

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col">
        <header className="flex items-center justify-between pt-2">
          <span className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-bold tracking-[0.14em] text-saffron-700">
            BAJRANG
          </span>
          <span className="text-sm font-semibold text-ink-500 tabular-nums">
            {toStepHindi(step + 1)} / {toStepHindi(3)}
          </span>
        </header>

        <div className="mt-4 flex gap-2" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={3}>
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors duration-300",
                index <= step ? "bg-saffron-500" : "bg-saffron-200/60",
              )}
            />
          ))}
        </div>

        <div className="flex flex-1 flex-col justify-center py-8">
          {step === 0 ? (
            <StepFrame
              icon="🙏"
              title="आपका नाम क्या है?"
              english="Your name"
              hint="गृह में हनुमान जी का नाम लेकर आइए।"
            >
              <input
                autoFocus
                value={name}
                maxLength={40}
                onChange={(event) => setName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && name.trim()) setStep(1);
                }}
                placeholder="जैसे: सीता"
                className="w-full rounded-3xl border-2 border-saffron-200 bg-white/90 px-5 py-4 text-xl font-bold text-ink-900 placeholder:font-normal placeholder:text-ink-500/50"
              />
            </StepFrame>
          ) : null}

          {step === 1 ? (
            <StepFrame
              icon="⏰"
              title="रोज़ किस समय याद करें?"
              english="Daily reminder time"
              hint="इस समय आपको एक हल्का संदेश मिलेगा।"
            >
              <div className="flex flex-wrap justify-center gap-2">
                {TIME_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTime(preset)}
                    className={cn(
                      "pressable rounded-2xl border-2 px-4 py-3 text-base font-bold transition-colors",
                      time === preset
                        ? "border-saffron-500 bg-saffron-500 text-white"
                        : "border-saffron-200 bg-white/90 text-ink-700",
                    )}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <label className="mt-5 block text-center text-sm font-semibold text-ink-500">
                या अपना समय चुनें
                <input
                  type="time"
                  value={time}
                  onChange={(event) => setTime(normalizeTime(event.target.value))}
                  className="mx-auto mt-2 block rounded-2xl border-2 border-saffron-200 bg-white/90 px-4 py-3 text-lg font-bold text-ink-900"
                />
              </label>
            </StepFrame>
          ) : null}

          {step === 2 ? (
            <StepFrame
              icon="🪔"
              title="आपका संकल्प क्या है?"
              english="Your sankalp — one intention"
              hint="एक छोटा संकल्प रखिए। रोज़ याद आएगा।"
            >
              <input
                autoFocus
                value={sankalp}
                maxLength={140}
                onChange={(event) => setSankalp(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") finish();
                }}
                placeholder="जैसे: परीक्षा में पास होना"
                className="w-full rounded-3xl border-2 border-saffron-200 bg-white/90 px-5 py-4 text-lg font-semibold text-ink-900 placeholder:font-normal placeholder:text-ink-500/50"
              />

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {SANKALP_EXAMPLES.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setSankalp(example)}
                    className="pressable rounded-full border border-saffron-200 bg-white/80 px-3.5 py-2 text-sm font-medium text-ink-700"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </StepFrame>
          ) : null}
        </div>

        <div className="pb-2">
          {step < 2 ? (
            <Button
              variant="primary"
              size="xl"
              block
              disabled={!canContinue}
              onClick={() => setStep(step + 1)}
            >
              आगे बढ़ें
            </Button>
          ) : (
            <Button variant="primary" size="xl" block onClick={finish}>
              पूजा शुरू करें 🙏
            </Button>
          )}
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="pressable mt-3 w-full py-2 text-sm font-semibold text-ink-500"
            >
              पीछे जाएँ
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function StepFrame({
  icon,
  title,
  english,
  hint,
  children,
}: {
  icon: string;
  title: string;
  english: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="animate-rise">
      <div className="text-center">
        <span className="animate-floaty inline-grid h-16 w-16 place-items-center rounded-full bg-white/80 text-3xl shadow-[0_10px_28px_-16px_rgba(120,44,25,0.7)]">
          {icon}
        </span>
        <h1 className="mt-5 text-3xl font-extrabold text-ink-900">{title}</h1>
        <p className="mt-1.5 text-[11px] font-bold tracking-[0.14em] text-saffron-600 uppercase">
          {english}
        </p>
        <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-ink-500">{hint}</p>
      </div>
      <div className="mt-7">{children}</div>
    </div>
  );
}

function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-16 -left-10 h-56 w-56 rounded-full bg-saffron-300/30 blur-3xl" />
      <div className="absolute top-1/3 -right-14 h-64 w-64 rounded-full bg-gold-300/25 blur-3xl" />
      <span className="animate-floaty absolute top-24 left-5 text-5xl text-saffron-300/20 select-none">
        🪔
      </span>
    </div>
  );
}

function toStepHindi(value: number): string {
  const digits = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
  return String(value).replace(/\d/g, (d) => digits[Number(d)]);
}