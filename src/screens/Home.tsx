import { useMemo } from "react";
import { hopeOfDay, verseOfDay } from "../lib/content";
import { useDerivedState } from "../lib/store";
import {
  HINDI_WEEKDAYS,
  addDays,
  formatHindiDate,
  formatFullHindiDate,
  hanumanDayName,
  toDateKey,
  toHindiDigits,
} from "../lib/date";
import { Button } from "../components/ui/Button";
import { Card, Eyebrow } from "../components/ui/Card";
import { WeekStrip } from "../components/WeekStrip";

export function Home({
  onStartRitual,
  onOpenShare,
  onOpenSankalp,
  onOpenSettings,
}: {
  onStartRitual: () => void;
  onOpenShare: () => void;
  onOpenSankalp: () => void;
  onOpenSettings: () => void;
}) {
  const state = useDerivedState();
  const today = useMemo(() => new Date(), []);
  const verse = useMemo(() => verseOfDay(today), [today]);
  const hope = useMemo(() => hopeOfDay(today), [today]);
  const specialDay = hanumanDayName(today);
  const firstName = state.profile.name.trim().split(" ")[0] ?? "";
  const partOfDay = timeOfDay(today);
  // नए उपयोगकर्ता को "० दिन" न दिखाएँ — यह उम्मीद का ऐप है
  const isNewHere = state.streak === 0 && state.totalCompleted === 0;

  return (
    <div className="safe-top stagger px-5 pt-3 pb-6">
      {/* ऊपर: स्ट्रीक + संस्करण */}
      <header className="flex items-center justify-between">
        <div className="pressable flex items-center gap-2 rounded-full border border-saffron-200 bg-white/85 py-1.5 pr-4 pl-1.5 shadow-[0_6px_18px_-14px_rgba(120,44,25,0.6)]">
          {isNewHere ? (
            <>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-linear-to-b from-saffron-100 to-saffron-200 text-base">
                🪔
              </span>
              <span className="text-sm font-bold text-ink-700">नया शुरुआत</span>
            </>
          ) : (
            <>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-linear-to-b from-saffron-100 to-saffron-200 text-lg">
                <span className="animate-flame">🔥</span>
              </span>
              <span className="text-lg font-extrabold text-ink-900 tabular-nums">
                {toHindiDigits(state.streak)}
              </span>
              <span className="text-sm font-semibold text-ink-500">दिन</span>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          className="rounded-full bg-saffron-100/70 px-3 py-1.5 text-xs font-bold tracking-[0.12em] text-saffron-700"
        >
          BAJRANG
        </button>
      </header>

      {/* नमस्कार */}
      <div className="mt-6">
        <p className="text-sm font-semibold text-saffron-700">{partOfDay}</p>
        <h1 className="mt-1 text-[28px] leading-snug font-extrabold text-ink-900">
          जय श्री राम{firstName ? `, ${firstName}` : ""} 🙏
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-500">
          {state.doneToday
            ? "आज की पूजा पूरी हो चुकी है। शाम को फिर मिलेंगे।"
            : "आज का एक मिनट, हनुमान जी के साथ।"}
        </p>
      </div>

      {/* आज का दिन */}
      <Card className="mt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[13px] font-semibold text-ink-500">
              {formatHindiDate(today)} · <span className="text-ink-700">{HINDI_WEEKDAYS[today.getDay()]}</span>
            </p>
            <p className="mt-0.5 text-lg font-bold text-ink-900">
              {formatFullHindiDate(today)}
            </p>
          </div>
          {specialDay ? (
            <span className="animate-floaty shrink-0 rounded-2xl bg-linear-to-b from-saffron-100 to-saffron-200 px-3 py-2 text-center shadow-[0_6px_16px_-12px_rgba(120,44,25,0.8)]">
              <span className="block text-xl leading-none">🚩</span>
              <span className="mt-1 block text-[11px] font-bold text-saffron-700">
                {specialDay}
              </span>
            </span>
          ) : null}
        </div>

        {specialDay ? (
          <p className="mt-4 rounded-2xl bg-saffron-50 px-4 py-3 text-sm leading-[1.8] font-medium text-saffron-800">
            आज {specialDay} है — हनुमान जी के दिन। आज का पूजा और सोहना है।
          </p>
        ) : null}

        {/* हफ़्ते की झलक */}
        <div className="mt-5">
          <WeekStrip />
        </div>
      </Card>

      {/* सबसे बड़ा बटन */}
      <div className="mt-6">
        {state.doneToday ? (
          <>
            <div className="rounded-[28px] border border-gold-300 bg-linear-to-b from-gold-200 to-cream-200 px-6 py-5 text-center shadow-glow">
              <p className="text-2xl font-extrabold text-ink-900">आज की पूजा पूरी 🙏</p>
              <p className="mt-2 text-sm leading-relaxed font-medium text-ink-700">
                कल फिर मिलेंगे। हनुमान जी आपका रक्षक हैं।
              </p>
            </div>
            <Button
              variant="soft"
              size="lg"
              block
              className="mt-3"
              onClick={onOpenShare}
            >
              🖼️ साप्ताहिक कार्ड साझा करें
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="primary"
              size="xl"
              block
              onClick={onStartRitual}
            >
              <span className="text-2xl">🙏</span>
              आज की पूजा शुरू करें
            </Button>
            {state.streak > 0 ? (
              <button
                type="button"
                onClick={onOpenShare}
                className="pressable mt-3 w-full rounded-2xl py-2.5 text-sm font-bold text-saffron-700"
              >
                🖼️ साप्ताहिक कार्ड बनाएँ
              </button>
            ) : null}
          </>
        )}
      </div>

      {/* रविवार है तो कार्ड साझा करने की नम्र निवेदन */}
      {today.getDay() === 0 && state.streak > 0 ? (
        <Card className="mt-5 border-gold-300 bg-linear-to-b from-gold-200/80 to-white">
          <Eyebrow tone="gold">आज रविवार है · Sunday</Eyebrow>
          <p className="mt-2 text-[17px] leading-[1.85] font-bold text-ink-900">
            आपके {toHindiDigits(state.streak)} दिन की साधना को साझा करें — एक तस्वीर, कुछ
            लोगों के लिए प्रेरणा बन जाएगी।
          </p>
          <Button variant="deep" size="lg" block className="mt-4" onClick={onOpenShare}>
            साप्ताहिक कार्ड बनाएँ
          </Button>
        </Card>
      ) : null}

      {/* चिंता मत करो */}
      {state.missedDays > 0 && !state.doneToday ? (
        <Card className="mt-5 border-gold-300/70 bg-gold-200/35">
          <p className="text-lg font-bold text-ink-900">चिंता मत करो, फिर से शुरू करो 🙏</p>
          <p className="mt-2 text-sm leading-[1.85] text-ink-700">
            {toHindiDigits(state.missedDays)} दिन बीत गए — कोई बात नहीं। हनुमान जी आज भी आपके
            साथ हैं। एक मिनट से ही सब शुरू हो जाता है।
          </p>
        </Card>
      ) : null}

      {/* आज का श्लोक */}
      <Card className="mt-5">
        <Eyebrow>आज का श्लोक · {verse.source}</Eyebrow>
        <p className="mt-3 text-[17px] leading-[1.9] font-bold text-ink-900">
          {verse.lines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </p>
        <p className="mt-3 text-sm leading-[1.85] text-ink-500">{verse.meaning}</p>
      </Card>

      {/* उम्मीद का संदेश + संकल्प */}
      <Card className="mt-4 bg-linear-to-b from-saffron-50 to-white">
        <Eyebrow>आज का संदेश · Daily Hope</Eyebrow>
        <p className="mt-2 text-[17px] leading-[1.85] font-bold text-ink-900">“{hope}”</p>
        {state.profile.sankalp ? (
          <button
            type="button"
            onClick={onOpenSankalp}
            className="pressable mt-4 flex w-full items-center justify-between rounded-2xl bg-white/80 px-4 py-3 text-left"
          >
            <span>
              <span className="block text-[11px] font-bold tracking-[0.14em] text-ink-500 uppercase">
                आपका संकल्प
              </span>
              <span className="mt-1 block text-base font-bold text-ink-900">
                {state.profile.sankalp}
              </span>
            </span>
            <span className="animate-floaty text-2xl">🪔</span>
          </button>
        ) : null}
      </Card>

      {/* हफ़्ते का सारांश */}
      <Card className="mt-4">
        <Eyebrow>साप्ताहिक सारांश · Weekly</Eyebrow>
        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
          <Stat label="इस हफ़्ते" value={weekCount(state.completedDates)} />
          <Stat label="कुल पूजा" value={state.totalCompleted} />
          <Stat label="सर्वश्रेष्ठ" value={state.bestStreak} />
        </div>
      </Card>

      {/* याद दिलाने की नम्र सलाह — नीचे, ताकि पूजा का बटन साफ़ रहे */}
      <ReminderNudge onOpenSettings={onOpenSettings} />

      <p className="mt-6 text-center text-xs leading-relaxed text-ink-500">
        जय बजरंगबली 🙏 — प्रेम और अनुशासन, रोज़ एक मिनट
      </p>
    </div>
  );
}

/** समय के हिसाब से नमस्कार — सुबह अलग, शाम अलग */
function timeOfDay(date: Date): string {
  const hour = date.getHours();
  if (hour < 4) return "शुभ रात्रि 🙏";
  if (hour < 11) return "शुभ प्रभात 🙏";
  if (hour < 16) return "नमस्कार 🙏";
  if (hour < 20) return "शुभ संध्या 🙏";
  return "शुभ रात्रि 🙏";
}

/** रोज़ का संदेश चालू करने की नम्र याद दिलाना — साल में एक बार ही दिखेगा */
function ReminderNudge({ onOpenSettings }: { onOpenSettings: () => void }) {
  const state = useDerivedState();
  const dismissed = useMemo(() => {
    try {
      return window.localStorage.getItem("bajrang.reminderNudge") === "done";
    } catch {
      return true;
    }
  }, []);

  const show = state.profile.onboarded && state.streak >= 3 && !state.profile.reminderEnabled && !dismissed;
  if (!show) return null;

  return (
    <Card className="mt-5 border-saffron-200 bg-white">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-saffron-100 text-xl">
          ⏰
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-ink-900">रोज़ सुबह का संदेश चालू करें?</p>
          <p className="mt-1 text-sm leading-[1.8] text-ink-500">
            आपके चुने हुए समय पर हनुमान जी का वार याद दिला देंगे — हर दिन सिर्फ़ एक बार।
          </p>
          <div className="mt-3 flex gap-2">
            <Button variant="primary" size="md" onClick={onOpenSettings}>
              सेटिंग में जाएँ
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={() => {
                try {
                  window.localStorage.setItem("bajrang.reminderNudge", "done");
                } catch {
                  /* रखने में दिक्कत हो तो बस दिखता रहेगा */
                }
              }}
            >
              बाद में
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-cream-200/70 px-2 py-3">
      <p className="text-2xl font-extrabold text-ink-900 tabular-nums">
        {toHindiDigits(value)}
      </p>
      <p className="mt-0.5 text-[11px] font-semibold text-ink-500">{label}</p>
    </div>
  );
}

function weekCount(completed: string[]): number {
  const keys = new Set(completed);
  const today = new Date();
  let count = 0;
  for (let i = 0; i < 7; i += 1) {
    if (keys.has(toDateKey(addDays(today, -i)))) count += 1;
  }
  return count;
}