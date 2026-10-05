import { useMemo } from "react";
import { chalisaYatra, hopeOfDay } from "../lib/content";
import { KATHA_TOTAL, plan, publishedCount, writtenCount } from "../lib/katha";
import { useDerivedState, actions, GRACE_EVERY_DAYS, GRACE_MAX } from "../lib/store";
import {
  addDays,
  calendarDateForDevotionalDay,
  formatDate,
  hanumanDayName,
  toDateKey,
  toNativeDigits,
  weekdayNames,
} from "../lib/date";
import { fmt, t as translate, useLang, useT, type Lang } from "../lib/i18n";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { WeekStrip } from "../components/WeekStrip";
import {
  IconArrow,
  IconBook,
  IconCheck,
  IconFlame,
  IconShare,
  IconKalash,
} from "../components/icons";
import { lastBackupAt } from "../lib/backup";
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
  // चालीसा यात्रा — पूजा के बाद एक-एक चौपाई, क्रम से
  const yatra = useMemo(() => chalisaYatra(state.chalisaRead, lang), [state.chalisaRead, lang]);
  // यात्रा शुरू होने से पहले भी पहली इकाई दिखाई दे — कल क्या आएगा, यह पता होना चाहिए
  const verse = yatra.today ?? chalisaYatra(0, lang).today;
  const hope = useMemo(() => hopeOfDay(today, lang), [today, lang]);
  const specialDay = hanumanDayName(today);
  const firstName = state.profile.name.trim().split(" ")[0] ?? "";
  const partOfDay = timeOfDay(today);
  // नए उपयोगकर्ता को "० दिन" न दिखाएँ — यह उम्मीद का ऐप है
  const isNewHere = state.streak === 0 && state.totalCompleted === 0;
  // कथा का हुक — कल क्या खुलेगा, यह आज से ही बताओ
  const kathaHook = useMemo(
    () => kathaTeaser(state.kathaRead, lang),
    [state.kathaRead, lang],
  );

  return (
    <div className="safe-top stagger px-5 pt-3 pb-6">
      {/* ऊपर: स्ट्रीक, भाषा, संस्करण — पतली पंक्ति, कोई डिब्बा नहीं */}
      <header className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-baseline gap-2">
          {state.streak > 0 && !state.isPaused ? (
            <span className="flex items-baseline gap-1.5">
              <IconFlame className="size-4 translate-y-0.5 text-saffron-500" />
              <span className="text-lg font-semibold text-ink-900 tabular-nums">
                {toNativeDigits(state.streak)}
              </span>
              <span className="text-sm text-ink-500">{t("दिन")}</span>
            </span>
          ) : state.isPaused ? (
            <span className="text-sm text-ink-500">
              {t("विश्राम")} · {toNativeDigits(state.streak)} {t("दिन")}
            </span>
          ) : isNewHere ? (
            <span className="text-sm text-ink-500">{t("नया शुरुआत")}</span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <LanguagePicker variant="compact" />
          <button
            type="button"
            onClick={onOpenSettings}
            className="text-[11px] font-medium tracking-[0.1em] text-ink-500 uppercase"
          >
            Bajrang
          </button>
        </div>
      </header>

      {/* नमस्कार — आज का दिन भी, साथ में */}
      <div className="mt-7">
        <p className="text-sm text-ink-500">{partOfDay}</p>
        <h1 className="display mt-1 text-[2rem] leading-[1.4] text-ink-900">
          {t("जय श्री राम")}
          {firstName ? <span className="text-ink-500">, {firstName}</span> : null}
        </h1>
        <p className="mt-2 max-w-[30ch] text-[15px] text-ink-700">
          {state.doneToday
            ? t("आज की पूजा पूरी हो चुकी है। शाम को फिर मिलेंगे।")
            : t("आज का एक मिनट, हनुमान जी के साथ।")}
        </p>
        <p className="mt-4 flex items-center gap-2 text-sm text-ink-500">
          <span>{formatDate(today)}</span>
          <span aria-hidden="true" className="text-cream-400">
            ·
          </span>
          <span>{weekdayNames()[today.getDay()]}</span>
          {specialDay ? (
            <span className="text-saffron-700">
              · {t("हनुमान जी का दिन")}
            </span>
          ) : null}
        </p>
      </div>

      {/* सप्ताह — पंक्ति की तरह, डिब्बे के बिना */}
      <section className="mt-7">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium text-ink-700">{t("इस हफ़्ते")}</h2>
          <span className="text-sm text-ink-500 tabular-nums">
            {toNativeDigits(weekCount(state.completedDates))} /{" "}
            {toNativeDigits(7)}
          </span>
        </div>
        <div className="mt-3">
          <WeekStrip />
        </div>
      </section>

      {/* पूजा — स्क्रीन का एक ही मुख्य काम */}
      <div className="mt-8">
        {state.doneToday ? (
          <div className="border-l-2 border-gold-400 pl-4">
            <p className="display text-[1.375rem] text-ink-900">
              {t("आज की पूजा पूरी")}
            </p>
            <p className="mt-1 text-[15px] text-ink-700">
              {t("कल फिर मिलेंगे। हनुमान जी आपका रक्षक हैं।")}
            </p>
          </div>
        ) : (
          <Button variant="primary" size="xl" block onClick={onStartRitual}>
            <IconFlame className="size-5" />
            {t("आज की पूजा शुरू करें")}
          </Button>
        )}
        {state.streak > 0 ? (
          <button
            type="button"
            onClick={onOpenShare}
            className="row mt-2 text-sm text-ink-700"
          >
            <IconShare className="size-4 text-ink-500" />
            <span className="flex-1 text-left">{t("साप्ताहिक कार्ड बनाएँ")}</span>
            <IconArrow className="size-4 text-ink-500" />
          </button>
        ) : null}
      </div>

      {/* रविवार — कार्ड साझा करने की नम्र निवेदन */}
      {today.getDay() === 0 && state.streak > 0 ? (
        <div className="mt-6 border-t border-cream-300 pt-5">
          <p className="text-sm text-ink-700">
            {fmt("आपके {n} दिन की साधना को साझा करें — एक तस्वीर, कुछ लोगों के लिए प्रेरणा बन जाएगी।", {
              n: toNativeDigits(state.streak),
            })}
          </p>
          <Button variant="soft" size="md" className="mt-3" onClick={onOpenShare}>
            <IconShare className="size-4" />
            {t("साप्ताहिक कार्ड साझा करें")}
          </Button>
        </div>
      ) : null}

      {/* विश्राम — सूचना, अनुरोध नहीं */}
      {state.isPaused ? (
        <section className="mt-9 border-t border-cream-300 pt-6">
          <h2 className="label">{t("विश्राम जारी है")}</h2>
          <p className="display-sm mt-2 text-[1.0625rem] text-ink-900">
            {state.pauseDaysLeft > 0
              ? fmt("{d} दिन और आराम। आपकी {s} दिन की साधना जहाँ थी वहीं सुरक्षित है।", {
                  d: toNativeDigits(state.pauseDaysLeft),
                  s: toNativeDigits(state.streak),
                })
              : t("आज विश्राम का अंतिम दिन है। कल फिर सिलसिला यहीं से आगे बढ़ेगा।")}
          </p>
          <p className="mt-1 text-sm text-ink-500">
            {t("रुके हुए दिन छूटे नहीं गिने जाएँगे।")}
          </p>
          <Button
            variant="soft"
            size="md"
            className="mt-4"
            onClick={() => actions.resumeFromPause()}
          >
            {t("आज से फिर शुरू करें")}
          </Button>
        </section>
      ) : null}

      {/* छूटे दिन — डाँट नहीं, सच बताइए */}
      {!state.isPaused && state.missedDays > 0 && !state.doneToday ? (
        <section className="mt-7 border-l-2 border-saffron-300 pl-4">
          {state.willRecoverWithGrace ? (
            <>
              <h2 className="text-sm font-medium text-ink-900">{t("क्षमा बचा लेगी")}</h2>
              <p className="mt-1 text-sm text-ink-700">
                {fmt("{m} दिन छूट गए हैं, पर आपके पास {g} क्षमा दिन हैं। आज पूजा कीजिए — सिलसिला टूटेगा नहीं।", {
                  m: toNativeDigits(state.missedDays),
                  g: toNativeDigits(state.graceDays),
                })}
              </p>
            </>
          ) : (
            <>
              <h2 className="text-sm font-medium text-ink-900">
                {t("चिंता मत करो, फिर से शुरू करो")}
              </h2>
              <p className="mt-1 text-sm text-ink-700">
                {fmt("{m} दिन बीत गए — कोई बात नहीं। हनुमान जी आज भी आपके साथ हैं। एक मिनट से ही सब शुरू हो जाता है।", {
                  m: toNativeDigits(state.missedDays),
                })}
              </p>
            </>
          )}
        </section>
      ) : null}

      {/* चालीसा यात्रा — आज की पंक्ति यहाँ सबसे ऊपर, कल का इशारा उसके नीचे */}
      <section className="mt-9 border-t border-cream-300 pt-7">
        {verse ? (
          <>
            <p className="label">{verse.source}</p>
            <div className="display mt-3 text-[1.5rem] leading-[1.75] text-ink-900">
              {verse.lines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </div>
            {/* जाँच की बात एक ही पंक्ति में — ऊपर-ऊपर डिब्बे नहीं */}
            <p className="mt-4 flex items-start gap-2 text-[13px] leading-[1.8] text-ink-500">
              <IconCheck className="mt-0.5 size-3.5 shrink-0 text-saffron-500" />
              <span>
                {t("अर्थ अभी जाँचा नहीं गया")} · {t("पाठ स्रोत से लाया गया है, पर अक्षर-अक्षर जाँच बाकी है")}
              </span>
            </p>
          </>
        ) : null}

        {yatra.read > 0 && yatra.next ? (
          <p className="mt-6 flex items-baseline gap-2 border-t border-cream-300/70 pt-4 text-sm">
            <span className="text-ink-500">{t("कल:")}</span>
            <span className="text-ink-900">{yatra.next.label}</span>
            <span className="text-ink-500">“{yatra.next.teaser}”</span>
          </p>
        ) : (
          <p className="mt-6 border-t border-cream-300/70 pt-4 text-sm text-ink-500">
            {fmt("आज की पूजा के बाद यात्रा आगे बढ़ेगी — कुल {n} इकाइयाँ।", {
              n: toNativeDigits(yatra.total),
            })}
          </p>
        )}
      </section>

      {/* कथा — जब तक जाँच न हो, यहाँ सिर्फ़ यही सच दिखेगा */}
      <button
        type="button"
        onClick={onOpenKatha}
        className="row mt-7 border-t border-cream-300 pt-5"
      >
        <IconBook className="size-5 text-saffron-600" />
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-medium text-ink-900">
            {kathaHook.title}
          </span>
          <span className="mt-0.5 block text-sm text-ink-500">{kathaHook.note}</span>
        </span>
        <IconArrow className="size-4 shrink-0 text-ink-500" />
      </button>

      {/* आज का संदेश + संकल्प */}
      <section className="mt-9">
        <h2 className="label">{t("आज का संदेश")}</h2>
        <p className="display-sm mt-2 text-[1.0625rem] text-ink-900">“{hope}”</p>
        {state.profile.sankalp ? (
          <button
            type="button"
            onClick={onOpenSankalp}
            className="row mt-3 border-t border-cream-300 pt-4"
          >
            <IconKalash className="size-5 text-saffron-600" />
            <span className="min-w-0 flex-1">
              <span className="label block">{t("आपका संकल्प")}</span>
              <span className="mt-0.5 block text-[15px] font-medium text-ink-900">
                {state.profile.sankalp}
              </span>
            </span>
            <IconArrow className="size-4 shrink-0 text-ink-500" />
          </button>
        ) : null}
      </section>

      {/* याद दिलाने की नम्र सलाह और बैकअप निवेदन */}
      <ReminderNudge onOpenSettings={onOpenSettings} />
      <BackupNudge onOpenSettings={onOpenSettings} />

      {/* आँकड़े — छोटी पंक्तियाँ, संख्या की जगह बड़ी */}
      <section className="mt-9 border-t border-cream-300 pt-6">
        <dl className="grid grid-cols-3 gap-4">
          {[
            { label: t("इस हफ़्ते"), value: weekCount(state.completedDates) },
            { label: t("कुल पूजा"), value: state.totalCompleted },
            { label: t("सर्वश्रेष्ठ"), value: state.bestStreak },
          ].map((item) => (
            <div key={item.label}>
              <dd className="text-2xl font-semibold text-ink-900 tabular-nums">
                {toNativeDigits(item.value)}
              </dd>
              <dt className="label mt-1">{item.label}</dt>
            </div>
          ))}
        </dl>

        <div className="mt-6 flex items-center gap-3">
          <IconCheck className="size-4 text-saffron-500" />
          <span className="text-sm text-ink-700">
            {fmt("{n} क्षमा दिन बाकी", { n: toNativeDigits(state.graceDays) })}
          </span>
          <span className="ml-auto flex gap-1.5">
            {Array.from({ length: GRACE_MAX }, (_, index) => (
              <span
                key={index}
                className={
                  index < state.graceDays
                    ? "size-2.5 rounded-full bg-saffron-400"
                    : "size-2.5 rounded-full border border-cream-400"
                }
              />
            ))}
          </span>
        </div>
        <p className="mt-2 text-sm text-ink-500">
          {fmt("हर {n} दिन की साधना पर एक क्षमा दिन मिलता है (ज़्यादा से ज़्यादा {m})।", {
            n: toNativeDigits(GRACE_EVERY_DAYS),
            m: toNativeDigits(GRACE_MAX),
          })}
        </p>
      </section>

      {yatra.read === 0 && yatra.firstUnit ? (
        <Card className="mt-4 border-saffron-200 bg-cream-200/60">
          <p className="text-sm leading-[1.85] font-semibold text-ink-900">
            {t("आज की पूजा के बाद चालीसा यात्रा शुरू होगी")}
          </p>
          <p className="mt-1 text-xs leading-[1.8] text-ink-500">
            {t("पहली इकाई:")} {yatra.firstUnit.label} · “{yatra.firstUnit.teaser}”
          </p>
        </Card>
      ) : null}

      <p className="display-sm mt-10 text-center text-[0.9375rem] text-ink-500">
        {t("जय बजरंगबली — प्रेम और अनुशासन, रोज़ एक मिनट")}
      </p>
    </div>
  );
}

/**
 * कथा का इशारा — यही वह कारण है जो भक्त को कल फिर लाता है।
 * पहली पूजा से पहले भी उत्सुकता बननी चाहिए, पूजा के बाद भी अगला प्रसंग दिखना चाहिए।
 */
function kathaTeaser(read: number, lang: Lang) {
  const entries = plan(lang);
  const live = publishedCount();
  const latest = live > 0 ? entries[live - 1] : null;
  const next = live < KATHA_TOTAL && !entries[live]?.withheld ? (entries[live] ?? null) : null;

  // जब तक विद्वान पाठक ने देखा नहीं, कुछ न दिखाओ — न कथा, न उसका आइरा
  if (!latest) {
    return {
      title: translate("कथा जाँच के बाद खुलेगी"),
      note: fmt(
        "{w} प्रसंग लिखे जा चुके हैं और हर एक का स्रोत दर्ज है, पर विद्वान पाठक की समीक्षा बाकी है। तब तक यह कथा आपके सामने नहीं आएगी।",
        { w: toNativeDigits(writtenCount()) },
      ),
      cta: translate("जाँच की स्थिति देखें"),
    };
  }
  if (!next) {
    return {
      title: translate("सौ आठ प्रसंग पूरे"),
      note: translate("आप पूरी कथा सुन चुके हैं। हनुमान जी का साथ सदा के लिए बना रहे।"),
      cta: translate("कथा दोबारा पढ़ें"),
    };
  }
  const label = read >= live ? "पिछला प्रसंग: " : "नया खुला प्रसंग: ";
  return {
    title: `${translate(label)}${latest.title}`,
    note: fmt("कल पूजा के बाद खुलेगा — प्रसंग {n}: {title}।", {
      n: toNativeDigits(next.n),
      title: next.title,
    }),
    cta: translate("कथा पढ़ें"),
  };
}

/**
 * ७ दिन की साधना के बाद एक बार याद दिलाना — कि यह सब एक फ़ाइल में सहेजा
 * जा सकता है। सिर्फ़ एक बार दिखता है, फिर कभी नहीं।
 */
function BackupNudge({ onOpenSettings }: { onOpenSettings: () => void }) {
  const state = useDerivedState();
  const t = useT();

  // यह कार्ड साल में एक बार — स्ट्रीक बदलने पर दोबारा पढ़ने की ज़रूरत नहीं
  const hidden = useMemo(
    () =>
      (() => {
        try {
          return (
            window.localStorage.getItem("bajrang.backupNudge") === "done" ||
            Boolean(lastBackupAt())
          );
        } catch {
          return true;
        }
      })(),
    [],
  );

  const show = state.streak >= 7 && !hidden;
  if (!show) return null;

  return (
    <Card className="mt-4 border-saffron-200 bg-white">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gold-200 text-xl">
          💾
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-ink-900">
            {fmt("आपके {n} दिन की साधना सुरक्षित करें — एक बैकअप फ़ाइल डाउनलोड करें।", {
              n: toNativeDigits(state.streak),
            })}
          </p>
          <p className="mt-1 text-sm leading-[1.8] text-ink-500">
            {t("फ़ोन बदलें या डेटा मिटे, तो यह सब चला जाएगा। बैकअप से वापस आ जाता है।")}
          </p>
          <div className="mt-3 flex gap-2">
            <Button variant="primary" size="md" onClick={onOpenSettings}>
              {t("बैकअप लें")}
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={() => {
                try {
                  window.localStorage.setItem("bajrang.backupNudge", "done");
                } catch {
                  /* storage बंद है तो यह बार-बार दिखेगी — कोई हानि नहीं */
                }
              }}
            >
              {t("अभी नहीं")}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
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

function weekCount(completed: string[]): number {
  const keys = new Set(completed);
  const today = calendarDateForDevotionalDay();
  let count = 0;
  for (let i = 0; i < 7; i += 1) {
    if (keys.has(toDateKey(addDays(today, -i)))) count += 1;
  }
  return count;
}
