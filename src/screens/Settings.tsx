import { useEffect, useState } from "react";
import { actions, useDerivedState, GRACE_EVERY_DAYS, GRACE_MAX } from "../lib/store";
import {
  DAY_BOUNDARY_HOUR,
  calendarDateForDevotionalDay,
  formatFullDate,
  formatTime,
  normalizeTime,
  toNativeDigits,
} from "../lib/date";
import {
  exactAlarmState,
  formatNextReminder,
  isNative,
  isNativeReminderScheduled,
  openExactAlarmSettings,
  reminderText,
  requestPermission,
  scheduleNativeReminder,
  sendTestReminder,
} from "../lib/reminder";
import { capabilities } from "../lib/env";
import { Card, SectionTitle } from "../components/ui/Card";
import { verseCheckStats } from "../lib/content";
import { LanguagePicker } from "../components/LanguagePicker";
import { Button } from "../components/ui/Button";
import { playChime } from "../lib/audio";
import { fmt, useT } from "../lib/i18n";
import { cn } from "../lib/utils";

const TIME_PRESETS = ["05:30", "06:00", "06:30", "07:00", "07:30", "08:00"];

export function Settings({ onReset }: { onReset: () => void }) {
  const state = useDerivedState();
  const t = useT();
  const [name, setName] = useState(state.profile.name);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [nativeScheduled, setNativeScheduled] = useState(false);
  const [exactAlarm, setExactAlarm] = useState<"granted" | "denied" | "unknown">("unknown");
  const caps = capabilities();
  const verseStats = verseCheckStats();
  const native = isNative();

  useEffect(() => {
    if (!native) return;
    void isNativeReminderScheduled().then(setNativeScheduled);
    void exactAlarmState().then(setExactAlarm);
  }, [native, state.profile.reminderEnabled, state.profile.reminderTime]);

  async function toggleNotifications() {
    const next = !state.profile.reminderEnabled;
    if (next) {
      const granted = await requestPermission();
      actions.updateProfile({ reminderEnabled: granted });
      if (granted && native) {
        const ok = await scheduleNativeReminder({
          enabled: true,
          time: state.profile.reminderTime,
          name: state.profile.name,
          doneToday: state.doneToday,
        });
        setNativeScheduled(ok);
        setNotice(
          ok
            ? t("हर दिन सुबह लग गया — ऐप बंद होने पर भी आएगा।")
            : t("इजाज़त मिली, पर समय नहीं लग सका।"),
        );
        return;
      }
      setNotice(
        granted
          ? t("चालू — रोज़ सुबह संदेश आएगा।")
          : caps.secure
            ? t("ब्राउज़र ने इजाज़त नहीं दी। फ़ोन की अलार्म में समय लगा लीजिए।")
            : t("https पर यह काम करता है। फ़ोन की अलार्म में समय लगा लीजिए।"),
      );
      return;
    }
    actions.updateProfile({ reminderEnabled: false });
    setNativeScheduled(false);
    setNotice(t("बंद कर दिया।"));
  }

  async function sendTest() {
    const sent = await sendTestReminder(state.profile.name);
    setNotice(sent ? t("संदेश भेज दिया — देखिए।") : t("संदेश नहीं जा सका।"));
  }

  return (
    <div className="safe-top px-5 pt-3 pb-6">
      <h1 className="text-3xl font-extrabold text-ink-900">{t("सेटिंग")}</h1>
      <p className="mt-1 text-sm font-semibold tracking-wide text-ink-500 uppercase">Settings</p>

      {!caps.secure ? (
        <Card className="mt-5 border-sindoor-200 bg-sindoor-700">
          <p className="text-lg font-bold text-white">{t("सुरक्षित कनेक्शन नहीं है")}</p>
          <p className="mt-2 text-sm leading-[1.85] text-cream-200">
            {t("अभी यह ऐप")} <b>http</b> {t("पर चल रहा है। रोज़ का संदेश, फ़ोन में इंस्टॉल, और पूजा के दौरान स्क्रीन जली रखना — ये सब")}{" "}
            <b>https</b> {t("पर ही चलते हैं। पूजा और स्ट्रीक फिर भी ठीक से काम करेंगे।")}
          </p>
          <p className="mt-3 rounded-2xl bg-sindoor-800/50 px-4 py-2.5 text-xs leading-[1.8] text-cream-200">
            {t("असली जाँच के लिए ऐप को किसी https पते पर चलाएँ, या अपने फ़ोन के अलार्म में")} {" "}
            {formatTime(state.profile.reminderTime)} {t("लगा लीजिए।")}
          </p>
        </Card>
      ) : null}

      <Card className="mt-5">
        <SectionTitle hindi="आपका नाम" english="Name" />
        <div className="flex gap-2">
          <input
            value={name}
            maxLength={40}
            onChange={(event) => setName(event.target.value)}
            className="min-w-0 flex-1 rounded-2xl border-2 border-saffron-200 bg-white px-4 py-3 text-lg font-semibold text-ink-900"
          />
          <Button
            variant="primary"
            size="md"
            onClick={() => actions.updateProfile({ name: name.trim() })}
          >
            {t("सहेजें")}
          </Button>
        </div>
      </Card>

      <Card className="mt-4">
        <SectionTitle hindi="रोज़ का संदेश" english="Daily reminder" />
        <Toggle
          checked={state.profile.reminderEnabled}
          onChange={toggleNotifications}
          label={t("याद दिलाना चालू रखें")}
        />

        <p className="mt-4 text-sm font-semibold text-ink-700">
          {t("समय:")} <span className="text-saffron-700">{formatTime(state.profile.reminderTime)}</span>
          <span className="ml-2 font-normal text-ink-500">
            ({t("हर दिन")} {formatNextReminder(state.profile.reminderTime)})
          </span>
        </p>

{native ? (
          <div className="mt-3 space-y-2.5">
            <div className="flex items-start gap-2 rounded-2xl bg-gold-200/45 px-4 py-3">
              <span className="text-lg">🔒</span>
              <p className="text-xs leading-[1.75] text-ink-700">
                {nativeScheduled ? (
                  <>
                    <b>{t("हर दिन लगा हुआ है।")}</b> {t("ऐप बंद हो, फ़ोन बंद हो, कुछ भी हो — संदेश आ जाएगा।")}
                  </>
                ) : state.profile.reminderEnabled ? (
                  <>
                    <b>{t("चालू है, पर समय नहीं लगा।")}</b> {t("ऐप एक बार खोलिए, समय दोबारा चुनिए।")}
                  </>
                ) : (
                  <>{t("ऐप बंद होने पर भी संदेश आएगा — यही Android ऐप की सबसे बड़ी बात है।")}</>
                )}
              </p>
            </div>

            {exactAlarm === "denied" ? (
              <div className="rounded-2xl border border-saffron-200 bg-white px-4 py-3">
                <p className="text-xs leading-[1.75] font-semibold text-ink-900">
                  {t("Android से ठीक समय पर संदेश देने की अनुमति माँगी ज़रूरी है")}
                </p>
                <p className="mt-1 text-[11px] leading-[1.7] text-ink-500">
                  {t("बिना इसके फ़ोन संदेश देर से दिखा सकता है।")}
                </p>
                <Button
                  variant="primary"
                  size="md"
                  block
                  className="mt-2.5"
                  onClick={async () => {
                    const asked = await openExactAlarmSettings();
                    if (!asked) {
                      setNotice(t("Android सेटिंग्स में \"Alarms & reminders\" खोलिए।"));
                      return;
                    }
                    setExactAlarm(await exactAlarmState());
                  }}
                >
                  {t("अनुमति देने के लिए खोलें")}
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2">
          {TIME_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => actions.updateProfile({ reminderTime: preset })}
              className={cn(
                "rounded-2xl border-2 px-4 py-2.5 text-sm font-bold transition-colors",
                state.profile.reminderTime === preset
                  ? "border-saffron-500 bg-saffron-500 text-white"
                  : "border-saffron-200 bg-white text-ink-700",
              )}
            >
              {preset}
            </button>
          ))}
        </div>

        <label className="mt-3 block text-sm font-semibold text-ink-500">
          {t("अपना समय चुनें")}
          <input
            type="time"
            value={state.profile.reminderTime}
            onChange={(event) =>
              actions.updateProfile({ reminderTime: normalizeTime(event.target.value) })
            }
            className="mt-1.5 block w-full rounded-2xl border-2 border-saffron-200 bg-white px-4 py-3 text-base font-bold text-ink-900"
          />
        </label>

        <div className="mt-4 rounded-3xl bg-cream-200/70 p-4">
          <p className="text-[11px] font-bold tracking-[0.14em] text-ink-500 uppercase">
            {t("ऐसा संदेश आएगा")}
          </p>
          <p className="mt-1.5 text-base leading-relaxed font-bold text-ink-900">
            {reminderText(state.profile.name)}
          </p>
          {caps.notificationsGranted ? (
            <Button variant="soft" size="md" block className="mt-3" onClick={sendTest}>
              {t("अभी संदेश भेजकर देखें")}
            </Button>
          ) : (
            <p className="mt-3 rounded-2xl bg-cream-300/70 px-4 py-2.5 text-xs leading-[1.8] text-ink-700">
              {caps.secure
                ? t("पहले ऊपर वाला स्विच चालू कीजिए — फिर यह संदेश जाँच सकेंगे।")
                : t("यह जाँच https पर ही हो पाएगी।")}
            </p>
          )}
        </div>

        <p className="mt-3 rounded-3xl bg-cream-200/70 p-4 text-xs leading-[1.85] text-ink-700">
          {native ? (
            <>
              {t("यह संदेश Android के अलार्म पर लगा है — ऐप बंद होने पर भी आएगा। बस फ़ोन में")} {" "}
              <b>Alarms &amp; reminders</b> {t("से Bajrang को अनुमति दी हो तो ठीक समय आएगा।")}
            </>
          ) : (
            <>
              {t("यह PWA संस्करण है। ब्राउज़र बंद होने पर संदेश नहीं आ पाता, इसलिए भरोसेमंद नहीं।")} <b>{t("Android ऐप")}</b>{" "}
              {t("में यह हर दिन, ऐप बंद होने पर भी आता है — और वीडियो पर वही नाम, वही संदेश, वही स्ट्रीक चलती है। सबसे भरोसेमंद तरीका अभी भी:")} {" "}
              {t("फ़ोन की अलार्म में भी")} {formatTime(state.profile.reminderTime)} {t("लगा लीजिए।")}
            </>
          )}
        </p>
      </Card>

      <Card className="mt-4">
        <SectionTitle hindi="विश्राम" english="Pause" />
        <p className="text-sm leading-[1.85] text-ink-500">
          {t("कभी-कभी बीमारी, यात्रा, या कोई मजबूरी होती है। ऐसे समय में डाँटने की बजाय रुक लीजिए — आपकी साधना जहाँ थी वहीं जुकी रहेगी। रुके हुए दिन छूटे नहीं गिने जाएँगे।")}
        </p>

        {state.isPaused ? (
          <div className="mt-4 rounded-3xl border border-saffron-200 bg-cream-200/70 p-4">
            <p className="text-base font-bold text-ink-900">
              🛌 {t("विश्राम जारी है")}
            </p>
            <p className="mt-1.5 text-sm leading-[1.8] text-ink-700">
              {state.pauseDaysLeft > 0
                ? fmt("{d} दिन और। सिलसिला {s} दिन पर जुका हुआ है।", {
                    d: toNativeDigits(state.pauseDaysLeft),
                    s: toNativeDigits(state.streak),
                  })
                : t("आज अंतिम दिन है।")}
            </p>
            <Button
              variant="primary"
              size="lg"
              block
              className="mt-3"
              onClick={() => {
                actions.resumeFromPause();
                setNotice(t("विश्राम समाप्त। फिर शुरू करें 🙏"));
              }}
            >
              {t("अभी लौटें")}
            </Button>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {[1, 3, 7, 14].map((days) => (
              <Button
                key={days}
                variant="soft"
                size="md"
                onClick={() => {
                  actions.pauseFor(days);
                  setNotice(fmt("{d} दिन का विश्राम। आराम करिए।", { d: toNativeDigits(days) }));
                }}
              >
                🛌 {toNativeDigits(days)} {t("दिन")}
              </Button>
            ))}
          </div>
        )}
      </Card>

      <Card className="mt-4">
        <SectionTitle hindi="क्षमा दिन" english="Grace days" />
        <div className="flex items-center gap-2">
          {Array.from({ length: GRACE_MAX }, (_, index) => (
            <span
              key={index}
              className={
                index < state.graceDays
                  ? "grid h-11 w-11 place-items-center rounded-2xl bg-gold-200 text-lg"
                  : "grid h-11 w-11 place-items-center rounded-2xl border border-dashed border-saffron-300 text-lg text-transparent"
              }
            >
              🕊️
            </span>
          ))}
          <p className="ml-1 text-sm font-bold text-ink-700">
            {toNativeDigits(state.graceDays)} / {toNativeDigits(GRACE_MAX)} {t("बाकी")}
          </p>
        </div>
        <p className="mt-3 text-xs leading-[1.85] text-ink-500">
          {fmt("हर {n} दिन लगातार पूजा करने पर एक क्षमा दिन अपने आप मिलता है। दिन छूट जाए तो यह अपने आप लग जाती है — इसलिए बार-बार सिलसिला नहीं टूटता।", {
            n: toNativeDigits(GRACE_EVERY_DAYS),
          })}
        </p>
      </Card>

      <Card className="mt-4">
        <SectionTitle hindi="दिन की शुरुआत" english="Day boundary" />
        <p className="text-sm leading-[1.85] text-ink-700">
          {t("दिन")} <b>{t("रात 3:00 बजे")}</b> {t("से शुरू होता है। रात 2 बजे की पूजा पहले दिन की गिनी जाती है — जैसे परंपरा में भी तिथि सूर्योदय से चलती है।")}
        </p>
        <p className="mt-2 text-xs leading-[1.75] text-ink-500">
          {t("अभी पूजा का दिन है:")} {" "}
          <span className="font-semibold text-saffron-700">
            {formatFullDate(calendarDateForDevotionalDay())}
          </span>
          {new Date().getHours() < DAY_BOUNDARY_HOUR
            ? ` ${t("— घड़ी के हिसाब से")} ${formatFullDate(new Date())} ${t("की रात है, पर पूजा का दिन पिछला ही चल रहा है।")}`
            : ""}
        </p>
      </Card>

      <Card className="mt-4">
        <SectionTitle hindi="पूजा की आवाज़" english="Chanting" />
        <Toggle
          checked={state.profile.chantingEnabled}
          onChange={() => {
            const next = !state.profile.chantingEnabled;
            actions.updateProfile({ chantingEnabled: next });
            if (next) playChime();
          }}
          label={t("पूजा के दौरान हल्का ॐ मंत्र")}
        />
        <p className="mt-3 text-xs leading-relaxed text-ink-500">
          {t("बहुत धीमी, बहुत हल्की आवाज़ — साँस जैसी। पूजा के दौरान 🔊 बटन से भी बंद/चालू कर सकते हैं।")}
        </p>
      </Card>

      <Card className="mt-4">
        <SectionTitle hindi="भाषा" english="Language" />
        <LanguagePicker variant="full" />
      </Card>

      <Card className="mt-4 border-gold-300 bg-gold-200/30">
        <SectionTitle hindi="पंक्तियों की जाँच" english="Verse review status" />
        <p className="text-sm leading-[1.85] text-ink-700">
          {fmt("{done} / {total} पंक्तियाँ किसी प्रमाणिक संस्करण से मिलान कर जाँची गई हैं।", {
            done: toNativeDigits(verseStats.done),
            total: toNativeDigits(verseStats.total),
          })}
        </p>
        <p className="mt-2 text-sm leading-[1.85] text-ink-700">
          {t(
            "अभी कोई पंक्ति जाँची नहीं गई। इसलिए हर पंक्ति के साथ “जाँच बाकी” का निशान दिखता है — ताकि कोई पाठ ग़लती से प्रामाणिक न समझ ले।",
          )}
        </p>
        <p className="mt-3 text-xs leading-[1.85] text-ink-500">
          {t("जो पंक्तियाँ किसी रचना से नहीं मिलीं, वे हटा दी गई हैं। अब सिर्फ़ वही दिखता है")}
          {t("जो स्रोत से जुड़ा हो — पर वह भी अभी अलिज्ञात स्रोत पर टिका है, तब तक जब तक जाँच न हो।")}
        </p>
        <p className="mt-3 text-xs leading-[1.85] text-ink-500">
          {t("पूरी सूची और जाँच का तरीका: CONTENT-REVIEW.md (रिपॉज़िटरी में)।")}
        </p>
      </Card>

      <Card className="mt-4">
        <SectionTitle hindi="आपकी साधना" english="Your data" />
        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat label={t("स्ट्रीक")} value={state.streak} />
          <Stat label={t("कुल")} value={state.totalCompleted} />
          <Stat label={t("सर्वश्रेष्ठ")} value={state.bestStreak} />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-ink-500">
          {t("सारी जानकारी सिर्फ़ आपके फ़ोन में सहेजी है — कोई अकाउंट नहीं, कोई सर्वर नहीं।")}
        </p>
      </Card>

      <Card className="mt-4">
        <SectionTitle hindi="ऐप के बारे में" english="About" />
        <ul className="space-y-1.5 text-sm text-ink-700">
          <li>{t("जय बजरंगबली 🙏")}</li>
          <li>{t("रोज़ एक मिनट की पूजा, बस इतनी सी।")}</li>
          <li>
            Bajrang · v0.2 · {t("हिंदी ⇄ बंगाला")} 
          </li>
        </ul>
      </Card>

      <div className="mt-5">
        {confirmingReset ? (
          <div className="space-y-3">
            <p className="rounded-2xl bg-cream-300/70 px-4 py-3 text-sm leading-relaxed text-ink-700">
              {t("सारी जानकारी मिट जाएगी — नाम, संकल्प और स्ट्रीक। क्या आप नया शुरुआत करना चाहते हैं?")}
            </p>
            <div className="flex gap-2">
              <Button
                variant="deep"
                size="lg"
                block
                onClick={() => {
                  actions.resetAll();
                  setConfirmingReset(false);
                  onReset();
                }}
              >
                {t("हाँ, नया शुरुआत करें")}
              </Button>
              <Button variant="ghost" size="lg" onClick={() => setConfirmingReset(false)}>
                {t("नहीं")}
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingReset(true)}
            className="w-full rounded-3xl border border-saffron-200 bg-white/70 py-3.5 text-sm font-bold text-sindoor-600"
          >
            {t("सब कुछ मिटाएँ")} · Reset
          </button>
        )}
      </div>

      {notice ? (
        <p className="mt-4 rounded-2xl bg-cream-300/70 px-4 py-2.5 text-center text-xs leading-relaxed font-semibold text-ink-700">
          {notice}
        </p>
      ) : null}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="pressable flex min-h-[56px] w-full items-center justify-between rounded-2xl bg-cream-200/70 px-4 py-3"
    >
      <span className="text-sm font-bold text-ink-900">{label}</span>
      <span
        className={cn(
          "relative h-7 w-12 rounded-full transition-colors",
          checked ? "bg-saffron-500" : "bg-ink-500/30",
        )}
      >
        <span
          className={cn(
            "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all",
            checked ? "left-6" : "left-1",
          )}
        />
      </span>
    </button>
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