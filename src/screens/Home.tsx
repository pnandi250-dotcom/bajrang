import { useMemo } from "react";
import { VERSE_PENDING_NOTE, hopeOfDay, verseOfDay } from "../lib/content";
import { KATHA_TOTAL, plan } from "../lib/katha";
import { useDerivedState, actions, GRACE_EVERY_DAYS, GRACE_MAX } from "../lib/store";
import {
  addDays,
  calendarDateForDevotionalDay,
  formatDate,
  formatFullDate,
  hanumanDayName,
  toDateKey,
  toNativeDigits,
  weekdayNames,
} from "../lib/date";
import { fmt, t as translate, useLang, useT, type Lang } from "../lib/i18n";
import { Button } from "../components/ui/Button";
import { Card, Eyebrow } from "../components/ui/Card";
import { WeekStrip } from "../components/WeekStrip";
import { LanguagePicker } from "../components/LanguagePicker";

export function Home({
  onStartRitual,
  onOpenShare,
  onOpenSankalp,
  onOpenSettings,
  onOpenKatha,
}: {
  onStartRitual: () => void;
  onOpenShare: () => void;
  onOpenSankalp: () => void;
  onOpenSettings: () => void;
  onOpenKatha: () => void;
}) {
  const state = useDerivedState();
  const t = useT();
  // "आज" का मतलब पूजा का दिन — रात 3 बजे के बाद यह कल हो जाता है
  const today = useMemo(() => calendarDateForDevotionalDay(), []);
  const lang = useLang();
  const verse = useMemo(() => verseOfDay(today, lang), [today, lang]);
  const hope = useMemo(() => hopeOfDay(today, lang), [today, lang]);
  const specialDay = hanumanDayName(today);
  const firstName = state.profile.name.trim().split(" ")[0] ?? "";
  const partOfDay = timeOfDay(today);
  // नए उपयोगकर्ता को "० दिन" न दिखाएँ — यह उम्मीद का ऐप है
  const isNewHere = state.streak === 0 && state.totalCompleted === 0;
  // कथा का हुक — कल क्या खुलेगा, यह आज से ही बताओ
  const kathaHook = useMemo(
    () => kathaTeaser(state.kathaRevealed, state.kathaRead, lang),
    [state.kathaRevealed, state.kathaRead, lang],
  );

  return (
    <div className="safe-top stagger px-5 pt-3 pb-6">
      {/* ऊपर: स्ट्रीक + संस्करण */}
      <header className="flex items-center justify-between">
        <div className="pressable flex items-center gap-2 rounded-full border border-saffron-200 bg-white/85 py-1.5 pr-4 pl-1.5 shadow-[0_6px_18_-14px_rgba(120,44,25,0.6)]">
          {isNewHere ? (
            <>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-linear-to-b from-saffron-100 to-saffron-200 text-base">
                🪔
              </span>
              <span className="text-sm font-bold text-ink-700">{t("नया शुरुआत")}</span>
            </>
          ) : state.isPaused ? (
            <>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-linear-to-b from-cream-200 to-cream-300 text-base">
                🛌
              </span>
              <span className="text-lg font-extrabold text-ink-900 tabular-nums">
                {toNativeDigits(state.streak)}
              </span>
              <span className="text-sm font-semibold text-ink-500">{t("विश्राम")}</span>
            </>
          ) : (
            <>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-linear-to-b from-saffron-100 to-saffron-200 text-lg">
                <span className="animate-flame">🔥</span>
              </span>
              <span className="text-lg font-extrabold text-ink-900 tabular-nums">
                {toNativeDigits(state.streak)}
              </span>
              <span className="text-sm font-semibold text-ink-500">{t("दिन")}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <LanguagePicker variant="compact" />
          <button
            type="button"
            onClick={onOpenSettings}
            className="rounded-full bg-saffron-100/70 px-3 py-1.5 text-xs font-bold tracking-[0.12em] text-saffron-700"
          >
            BAJRANG
          </button>
        </div>
      </header>

      {/* नमस्कार */}
      <div className="mt-6">
        <p className="text-sm font-semibold text-saffron-700">{partOfDay}</p>
        <h1 className="mt-1 text-[28px] leading-snug font-extrabold text-ink-900">
          {t("जय श्री राम")}
          {firstName ? `, ${firstName}` : ""} 🙏
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-500">
          {state.doneToday
            ? t("आज की पूजा पूरी हो चुकी है। शाम को फिर मिलेंगे।")
            : t("आज का एक मिनट, हनुमान जी के साथ।")}
        </p>
      </div>

      {/* आज का दिन */}
      <Card className="mt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[13px] font-semibold text-ink-500">
              {formatDate(today)} ·{" "}
              <span className="text-ink-700">{weekdayNames()[today.getDay()]}</span>
            </p>
            <p className="mt-0.5 text-lg font-bold text-ink-900">{formatFullDate(today)}</p>
          </div>
          {specialDay ? (
            <span className="animate-floaty shrink-0 rounded-2xl bg-linear-to-b from-saffron-100 to-saffron-200 px-3 py-2 text-center shadow-[0_6px_16_-12px_rgba(120,44,25,0.8)]">
              <span className="block text-xl leading-none">🚩</span>
              <span className="mt-1 block text-[11px] font-bold text-saffron-700">{specialDay}</span>
            </span>
          ) : null}
        </div>

        {specialDay ? (
          <p className="mt-4 rounded-2xl bg-saffron-50 px-4 py-3 text-sm leading-[1.8] font-medium text-saffron-800">
            {t("आज")} {specialDay} {t("है — हनुमान जी के दिन। आज का पूजा और सोहना है।")}
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
              <p className="text-2xl font-extrabold text-ink-900">{t("आज की पूजा पूरी 🙏")}</p>
              <p className="mt-2 text-sm leading-relaxed font-medium text-ink-700">
                {t("कल फिर मिलेंगे। हनुमान जी आपका रक्षक हैं।")}
              </p>
            </div>
            <Button variant="soft" size="lg" block className="mt-3" onClick={onOpenShare}>
              🖼️ {t("साप्ताहिक कार्ड साझा करें")}
            </Button>
          </>
        ) : (
          <>
            <Button variant="primary" size="xl" block onClick={onStartRitual}>
              <span className="text-2xl">🙏</span>
              {t("आज की पूजा शुरू करें")}
            </Button>
            {state.streak > 0 ? (
              <button
                type="button"
                onClick={onOpenShare}
                className="pressable mt-3 w-full rounded-2xl py-2.5 text-sm font-bold text-saffron-700"
              >
                🖼️ {t("साप्ताहिक कार्ड बनाएँ")}
              </button>
            ) : null}
          </>
        )}
      </div>

      {/* रविवार है तो कार्ड साझा करने की नम्र निवेदन */}
      {today.getDay() === 0 && state.streak > 0 ? (
        <Card className="mt-5 border-gold-300 bg-linear-to-b from-gold-200/80 to-white">
          <Eyebrow tone="gold">{t("आज रविवार है · Sunday")}</Eyebrow>
          <p className="mt-2 text-[17px] leading-[1.85] font-bold text-ink-900">
            {fmt("आपके {n} दिन की साधना को साझा करें — एक तस्वीर, कुछ लोगों के लिए प्रेरणा बन जाएगी।", {
              n: toNativeDigits(state.streak),
            })}
          </p>
          <Button variant="deep" size="lg" block className="mt-4" onClick={onOpenShare}>
            {t("साप्ताहिक कार्ड बनाएँ")}
          </Button>
        </Card>
      ) : null}

      {/* क्षमा और विश्राम — दोनों ही दिल जीतने वाली बातें */}
      {state.isPaused ? (
        <Card className="mt-5 border-saffron-200 bg-linear-to-b from-cream-200 to-white">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛌</span>
            <p className="text-lg font-extrabold text-ink-900">{t("विश्राम जारी है")}</p>
          </div>
          <p className="mt-2 text-sm leading-[1.85] text-ink-700">
            {state.pauseDaysLeft > 0 ? (
              <>
                <b>
                  {toNativeDigits(state.pauseDaysLeft)} {t("दिन")}
                </b>{" "}
                {fmt("और आराम। आपकी {n} दिन की साधना जहाँ थी वहीं सुरक्षित है — रुके हुए दिन छूटे नहीं गिने जाएँगे। जब मन करे, पूजा कीजिए।", {
                  n: toNativeDigits(state.streak),
                })}
              </>
            ) : (
              t("आज विश्राम का अंतिम दिन है। कल फिर सिलसिला यहीं से आगे बढ़ेगा।")
            )}
          </p>
          <Button
            variant="primary"
            size="lg"
            block
            className="mt-4"
            onClick={() => actions.resumeFromPause()}
          >
            {t("आज से फिर शुरू करें")}
          </Button>
        </Card>
      ) : null}

      {/* छूटे दिन — क्षमा बचा लेगी या नहीं, पहले बता दें */}
      {!state.isPaused && state.missedDays > 0 && !state.doneToday ? (
        state.willRecoverWithGrace ? (
          <Card className="mt-5 border-gold-300 bg-linear-to-b from-gold-200/70 to-white">
            <div className="flex items-center gap-2">
              <span className="text-xl">🕊️</span>
              <p className="text-lg font-extrabold text-ink-900">{t("क्षमा बचा लेगी")}</p>
            </div>
            <p className="mt-2 text-sm leading-[1.85] text-ink-700">
              {fmt("{m} दिन छूट गए हैं, पर आपके पास", { m: toNativeDigits(state.missedDays) })}{" "}
              <b>
                {toNativeDigits(state.graceDays)} {t("क्षमा दिन")}
              </b>{" "}
              {t("हैं। आज पूजा कीजिए — सिलसिला टूटेगा नहीं। कोई डाँट नहीं, बस ध्यान रखिए।")}
            </p>
          </Card>
        ) : (
          <Card className="mt-5 border-gold-300/70 bg-gold-200/35">
            <p className="text-lg font-bold text-ink-900">{t("चिंता मत करो, फिर से शुरू करो 🙏")}</p>
            <p className="mt-2 text-sm leading-[1.85] text-ink-700">
              {t("दिन बीत गए")}{" "}
              {fmt("({n} — कोई बात नहीं। हनुमान जी आज भी आपके साथ हैं। एक मिनट से ही सब शुरू हो जाता है।", {
                n: toNativeDigits(state.missedDays),
              })}
            </p>
          </Card>
        )
      ) : null}

      {/* कथा — कल का इंतज़ार बनाने वाली सबसे बड़ी बात */}
      <button type="button" onClick={onOpenKatha} className="mt-4 block w-full text-left">
        <Card className="border-saffron-200 bg-linear-to-b from-cream-200 to-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Eyebrow>
                {t("बजरंग कथा")} · {toNativeDigits(state.kathaRevealed)} /{" "}
                {toNativeDigits(KATHA_TOTAL)}
              </Eyebrow>
              <p className="mt-1 text-[17px] leading-snug font-extrabold text-ink-900">
                {kathaHook.title}
              </p>
            </div>
            <span className="animate-floaty shrink-0 rounded-2xl bg-linear-to-b from-saffron-100 to-saffron-200 px-3 py-2 text-2xl">
              📖
            </span>
          </div>
          <p className="mt-3 text-sm leading-[1.85] text-ink-700">{kathaHook.note}</p>
          <p className="mt-3 text-xs font-bold text-saffron-700">{kathaHook.cta} →</p>
        </Card>
      </button>

      {/* आज का श्लोक */}
      <Card className="mt-5">
        <Eyebrow>
          {t("आज का श्लोक")} · {verse.source}
        </Eyebrow>
        <p className="mt-3 text-[17px] leading-[1.9] font-bold text-ink-900">
          {verse.lines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </p>
        <p className="mt-3 text-sm leading-[1.85] text-ink-500">{verse.meaning}</p>
        {verse.verified ? null : (
          <p className="mt-3 rounded-2xl bg-gold-200/60 px-4 py-2.5 text-xs leading-[1.75] text-ink-700">
            <b className="text-gold-700">{t("जाँच बाकी")}</b> {t(VERSE_PENDING_NOTE)}
          </p>
        )}
      </Card>

      {/* उम्मीद का संदेश + संकल्प */}
      <Card className="mt-4 bg-linear-to-b from-saffron-50 to-white">
        <Eyebrow>{t("आज का संदेश")} · Daily Hope</Eyebrow>
        <p className="mt-2 text-[17px] leading-[1.85] font-bold text-ink-900">“{hope}”</p>
        {state.profile.sankalp ? (
          <button
            type="button"
            onClick={onOpenSankalp}
            className="pressable mt-4 flex w-full items-center justify-between rounded-2xl bg-white/80 px-4 py-3 text-left"
          >
            <span>
              <span className="block text-[11px] font-bold tracking-[0.14em] text-ink-500 uppercase">
                {t("आपका संकल्प")}
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
        <Eyebrow>{t("साप्ताहिक सारांश")} · Weekly</Eyebrow>
        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
          <Stat label={t("इस हफ़्ते")} value={weekCount(state.completedDates)} />
          <Stat label={t("कुल पूजा")} value={state.totalCompleted} />
          <Stat label={t("सर्वश्रेष्ठ")} value={state.bestStreak} />
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl bg-cream-200/70 px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-ink-700">
            <span className="text-base">🕊️</span> {t("क्षमा दिन बाकी")}
          </span>
          <span className="flex gap-1.5">
            {Array.from({ length: GRACE_MAX }, (_, index) => (
              <span
                key={index}
                className={
                  index < state.graceDays
                    ? "grid h-7 w-7 place-items-center rounded-full bg-gold-300 text-sm"
                    : "grid h-7 w-7 place-items-center rounded-full border border-dashed border-saffron-300 text-transparent"
                }
              >
                🕊️
              </span>
            ))}
          </span>
        </div>
        <p className="mt-2 text-[11px] leading-[1.7] text-ink-500">
          {fmt("हर {n} दिन की साधना पर एक क्षमा दिन मिलता है (ज़्यादा से ज़्यादा {m})। दिन छूट जाए तो अपने आप लग जाती है।", {
            n: toNativeDigits(GRACE_EVERY_DAYS),
            m: toNativeDigits(GRACE_MAX),
          })}
        </p>
      </Card>

      {/* याद दिलाने की नम्र सलाह — नीचे, ताकि पूजा का बटन साफ़ रहे */}
      <ReminderNudge onOpenSettings={onOpenSettings} />

      <p className="mt-6 text-center text-xs leading-relaxed text-ink-500">
        {t("जय बजरंगबली 🙏 — प्रेम और अनुशासन, रोज़ एक मिनट")}
      </p>
    </div>
  );
}

/**
 * कथा का इशारा — यही वह कारण है जो भक्त को कल फिर लाता है।
 * पहली पूजा से पहले भी उत्सुकता बननी चाहिए, पूजा के बाद भी अगला प्रसंग दिखना चाहिए।
 */
function kathaTeaser(revealed: number, read: number, lang: Lang) {
  const entries = plan(lang);
  const latest = revealed > 0 ? entries[revealed - 1] : null;
  const next = entries[revealed] ?? null;

  if (!latest) {
    return {
      title: translate("आज की पूजा के बाद खुलेगा पहला प्रसंग"),
      note: translate(
        "रोज़ एक प्रसंग, पूजा के बाद — ताकि कथा आगे बढ़ती रहे और आप कल फिर आएँ।",
      ),
      cta: translate("कथा देखें"),
    };
  }
  if (!next) {
    return {
      title: translate("सौ आठ प्रसंग पूरे"),
      note: translate("आप पूरी कथा सुन चुके हैं। हनुमान जी का साथ सदा के लिए बना रहे।"),
      cta: translate("कथा दोबारा पढ़ें"),
    };
  }
  const label = read >= revealed ? "पिछला प्रसंग: " : "नया खुला प्रसंग: ";
  return {
    title: `${translate(label)}${latest.title}`,
    note: fmt("कल पूजा के बाद खुलेगा — प्रसंग {n}: {title}।", {
      n: toNativeDigits(next.n),
      title: next.title,
    }),
    cta: translate("कथा पढ़ें"),
  };
}

/** समय के हिसाब से नमस्कार — सुबह अलग, शाम अलग */
function timeOfDay(date: Date): string {
  const hour = date.getHours();
  if (hour < 4) return translate("शुभ रात्रि 🙏");
  if (hour < 11) return translate("शुभ प्रभात 🙏");
  if (hour < 16) return translate("नमस्कार 🙏");
  if (hour < 20) return translate("शुभ संध्या 🙏");
  return translate("शुभ रात्रि 🙏");
}

/** रोज़ का संदेश चालू करने की नम्र याद दिलाना — साल में एक बार ही दिखेगा */
function ReminderNudge({ onOpenSettings }: { onOpenSettings: () => void }) {
  const state = useDerivedState();
  const t = useT();
  const dismissed = useMemo(() => {
    try {
      return window.localStorage.getItem("bajrang.reminderNudge") === "done";
    } catch {
      return true;
    }
  }, []);

  const show =
    state.profile.onboarded &&
    state.streak >= 3 &&
    !state.profile.reminderEnabled &&
    !dismissed;
  if (!show) return null;

  return (
    <Card className="mt-5 border-saffron-200 bg-white">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-saffron-100 text-xl">
          ⏰
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-ink-900">
            {t("रोज़ सुबह का संदेश चालू करें?")}
          </p>
          <p className="mt-1 text-sm leading-[1.8] text-ink-500">
            {t("आपके चुने हुए समय पर हनुमान जी का वार याद दिला देंगे — हर दिन सिर्फ़ एक बार।")}
          </p>
          <div className="mt-3 flex gap-2">
            <Button variant="primary" size="md" onClick={onOpenSettings}>
              {t("सेटिंग में जाएँ")}
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
              {t("बाद में")}
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
      <p className="text-2xl font-extrabold text-ink-900 tabular-nums">{toNativeDigits(value)}</p>
      <p className="mt-0.5 text-[11px] font-semibold text-ink-500">{label}</p>
    </div>
  );
}

function weekCount(completed: string[]): number {
  const keys = new Set(completed);
  const today = calendarDateForDevotionalDay();
  let count = 0;
  for (let i = 0; i < 7; i += 1) {
    if (keys.has(toDateKey(addDays(today, -i)))) count += 1;
  }
  return count;
}
