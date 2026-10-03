import { useState } from "react";
import { useDerivedState, actions, MILESTONES } from "../lib/store";
import { sankalpMessageOfDay } from "../lib/content";
import { calendarDateForDevotionalDay, toHindiDigits } from "../lib/date";
import { Card, SectionTitle, Eyebrow } from "../components/ui/Card";
import { Diya } from "../components/ui/Diya";
import { MilestoneBadges } from "../components/ui/MilestoneBadges";
import { Button } from "../components/ui/Button";
import { playChime } from "../lib/audio";

const SANKALP_IDEAS = [
  "परीक्षा में पास होना",
  "परिवार का स्वास्थ्य",
  "नौकरी मिलना",
  "शांति और सच्चाई",
  "माँ-पापा की सेहत",
];

export function Sankalp() {
  const state = useDerivedState();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(state.profile.sankalp);
  const today = calendarDateForDevotionalDay();

  const intensity = Math.min(1, state.streak / 21);
  const message = sankalpMessageOfDay(today, state.profile.sankalp);
  const nextMilestone = MILESTONES.find((m) => state.streak < m.days)?.days;

  function save() {
    actions.updateProfile({ sankalp: draft.trim() });
    setEditing(false);
    playChime();
  }

  return (
    <div className="safe-top px-5 pt-3 pb-6">
      <h1 className="text-3xl font-extrabold text-ink-900">संकल्प</h1>
      <p className="mt-1 text-sm font-semibold tracking-wide text-ink-500 uppercase">
        Sankalp · your intention
      </p>

      <Card className="mt-5 overflow-hidden bg-linear-to-b from-cream-200/90 to-white">
        <div className="flex flex-col items-center text-center">
          <Diya intensity={intensity} size={168} />

          {editing ? (
            <div className="mt-3 w-full">
              <input
                autoFocus
                value={draft}
                maxLength={140}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="जैसे: परिवार का स्वास्थ्य"
                className="w-full rounded-3xl border-2 border-saffron-200 bg-white px-5 py-4 text-lg font-semibold text-ink-900"
              />
              <div className="mt-3 flex gap-2">
                <Button variant="primary" size="md" block onClick={save}>
                  सहेजें
                </Button>
                <Button variant="ghost" size="md" onClick={() => setEditing(false)}>
                  रद्द
                </Button>
              </div>
            </div>
          ) : state.profile.sankalp ? (
            <>
              <Eyebrow className="mt-3">आपका संकल्प</Eyebrow>
              <p className="mt-2 text-2xl leading-snug font-extrabold text-ink-900">
                {state.profile.sankalp}
              </p>
              <button
                type="button"
                onClick={() => {
                  setDraft(state.profile.sankalp);
                  setEditing(true);
                }}
                className="pressable mt-3 rounded-full bg-white/70 px-4 py-2 text-sm font-bold text-saffron-700"
              >
                संकल्प बदलें
              </button>
            </>
          ) : (
            <>
              <Eyebrow className="mt-3">अभी कोई संकल्प नहीं</Eyebrow>
              <p className="mt-2 max-w-xs text-base leading-[1.85] text-ink-700">
                एक छोटा इरादा रखिए — पढ़ाई, सेहत, परिवार, कुछ भी। रोज़ याद आएगा, और पूजा का
                मक़सद साफ़ हो जाएगा।
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {SANKALP_IDEAS.map((idea) => (
                  <button
                    key={idea}
                    type="button"
                    onClick={() => {
                      setDraft(idea);
                      setEditing(true);
                    }}
                    className="pressable rounded-full border border-saffron-200 bg-white/80 px-3.5 py-2 text-sm font-medium text-ink-700"
                  >
                    {idea}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="mt-5 rounded-3xl bg-white/85 p-4">
          <p className="text-[11px] font-bold tracking-widest text-saffron-600 uppercase">
            आज का संदेश · Today
          </p>
          <p className="mt-1.5 text-base leading-relaxed font-semibold text-ink-900">{message}</p>
        </div>
      </Card>

      <Card className="mt-4">
        <SectionTitle hindi="दीवे की चमक" english="Diya brightness" />
        <div className="flex items-center justify-between">
          <p className="text-sm text-ink-500">
            जितनी लंबी स्ट्रीक, उतना चमकता दीवा
          </p>
          <p className="text-lg font-extrabold text-saffron-700">
            {toHindiDigits(Math.round(intensity * 100))}%
          </p>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-cream-300">
          <div
            className="h-full rounded-full bg-linear-to-r from-gold-300 to-saffron-500"
            style={{ width: `${Math.max(4, intensity * 100)}%` }}
          />
        </div>
        {nextMilestone ? (
          <p className="mt-3 text-sm text-ink-500">
            अगला बैज: <b className="text-ink-900">{toHindiDigits(nextMilestone)} दिन</b> —{" "}
            {toHindiDigits(Math.max(0, nextMilestone - state.streak))} दिन और।
          </p>
        ) : (
          <p className="mt-3 text-sm font-bold text-gold-600">
            🏅 108 दिन पूरे — आप परम भक्त हैं!
          </p>
        )}
      </Card>

      <Card className="mt-4">
        <SectionTitle hindi="बैज" english="Badges" />
        <MilestoneBadges streak={state.streak} />
        <p className="mt-3 text-xs leading-relaxed text-ink-500">
          कुछ दिन छूट जाएँ तो कोई बात नहीं — चिंता मत करो, फिर से शुरू करो 🙏
        </p>
      </Card>

      <Card className="mt-4">
        <SectionTitle hindi="आपकी साधना" english="Your practice" />
        <div className="grid grid-cols-2 gap-3 text-center">
          <Stat label="लगातार दिन" value={state.streak} />
          <Stat label="कुल पूजा" value={state.totalCompleted} />
          <Stat label="सर्वश्रेष्ठ" value={state.bestStreak} />
          <Stat label="बैज" value={MILESTONES.filter((m) => state.streak >= m.days).length} />
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-cream-200/70 px-2 py-3">
      <p className="text-2xl font-extrabold text-ink-900 tabular-nums">{toHindiDigits(value)}</p>
      <p className="mt-0.5 text-[11px] font-semibold text-ink-500">{label}</p>
    </div>
  );
}