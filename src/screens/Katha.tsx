import { useEffect, useState } from "react";
import { KATHA_TOTAL, PARTS, plan, publishedCount, writtenCount, type PlanEntry } from "../lib/katha";
import { actions, useDerivedState } from "../lib/store";
import { toNativeDigits } from "../lib/date";
import { fmt, useT } from "../lib/i18n";
import { Card, Eyebrow, SectionTitle } from "../components/ui/Card";
import { cn } from "../lib/utils";

export function Katha() {
  const state = useDerivedState();
  const t = useT();
  const revealed = state.kathaRevealed;
  const entries = plan();
  const live = publishedCount();
  // केवल वही प्रसंग खुला है जो जाँच से गुज़र चुका है
  const latest = live > 0 ? entries[live - 1] : null;
  const next = live < KATHA_TOTAL && !entries[live]?.withheld ? (entries[live] ?? null) : null;

  // सबसे नया प्रसंग खुलकर दिखे — बाकी बंद
  const [openN, setOpenN] = useState<number | null>(latest?.n ?? null);
  const latestN = latest?.n ?? 0;
  useEffect(() => {
    if (latestN > (openN ?? 0)) setOpenN(latestN);
  }, [latestN, openN]);

  function toggle(n: number) {
    setOpenN((prev) => (prev === n ? null : n));
    actions.markKathaRead(n);
  }

  const done = live >= KATHA_TOTAL;

  return (
    <div className="safe-top px-5 pt-3 pb-6">
      <h1 className="text-3xl font-extrabold text-ink-900">{t("बजरंग कथा")}</h1>
      <p className="mt-1 text-sm font-semibold tracking-wide text-ink-500 uppercase">
        Katha · one episode each day
      </p>

      {/* हाल का प्रसंग और आगे का इशारा */}
      <Card className="mt-5 border-gold-300 bg-linear-to-b from-gold-200/80 to-white">
        <div className="flex items-end justify-between gap-3">
          <div>
            <Eyebrow tone="gold">{t("प्रसंग")}</Eyebrow>
            <p className="mt-1 text-3xl leading-none font-extrabold text-ink-900 tabular-nums">
              {toNativeDigits(live)}
              <span className="ml-1 text-lg font-bold text-ink-500">
                / {toNativeDigits(KATHA_TOTAL)}
              </span>
            </p>
          </div>
          <p className="text-right text-xs leading-[1.7] font-semibold text-ink-500">
            {latest ? t(latest.part.name) : t("कथा आरंभ")}
          </p>
        </div>

        {live === 0 ? (
          <div className="mt-5 rounded-2xl bg-white/80 px-4 py-3">
            <p className="text-[11px] font-bold tracking-[0.14em] text-gold-600 uppercase">
              {t("जाँच बाकी — स्क्रीन पर रुका है")}
            </p>
            <p className="mt-2 text-sm leading-[1.85] text-ink-700">
              {fmt(
                "{w} प्रसंग लिखे गए हैं, पर विद्वान पाठक ने अभी एक भी देखा नहीं। इसलिए यहाँ अभी कुछ नहीं दिखाया जा रहा — जाँच पूरी होते ही प्रसंग अपने आप खुल जाएँगे।",
                { w: toNativeDigits(writtenCount()) },
              )}
            </p>
            <p className="mt-2 text-xs leading-[1.8] text-ink-500">
              {t("हर प्रसंग का स्रोत दर्ज है — वाल्मीकि रामायण अथवा रामचरितमानस।")}
            </p>
          </div>
        ) : null}

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-cream-300">
          <div
            className="h-full rounded-full bg-linear-to-r from-saffron-400 to-saffron-600 transition-[width]"
            style={{ width: `${Math.round((live / KATHA_TOTAL) * 100)}%` }}
          />
        </div>

        {latest ? (
          <div className="mt-5 rounded-2xl bg-white/75 px-4 py-3">
            <p className="text-[11px] font-bold tracking-[0.14em] text-saffron-700 uppercase">
              {state.kathaRead >= revealed ? t("पिछला प्रसंग") : t("नया खुला प्रसंग")}
            </p>
            <p className="mt-1 text-lg leading-snug font-extrabold text-ink-900">
              {latest.title}
            </p>
          </div>
        ) : null}

        {next ? (
          <p className="mt-3 text-sm leading-[1.8] text-ink-700">
            {t("कल पूजा के बाद खुलेगा")} —{" "}
            <b className="text-saffron-700">
              {t("प्रसंग")} {toNativeDigits(next.n)} · {next.title}
            </b>
          </p>
        ) : (
          <p className="mt-3 text-sm leading-[1.8] text-ink-700">
            {done
              ? t("सौ आठ प्रसंग पूरे हो गए। हनुमान जी का साथ अब भी साथ है 🙏")
              : t("रोज़ एक प्रसंग — पूजा के बाद ही खुलता है।")}
          </p>
        )}
      </Card>

      {/* सारे प्रसंग — भाग-भाग के क्रम में */}
      {PARTS.map((part) => {
        const list = entries.filter((entry) => entry.part.id === part.id);
        const openInPart = list.filter((entry) => !entry.withheld).length;
        if (!openInPart && live === 0 && part.id !== "janam") return null;
        return (
          <section key={part.id} className="mt-6">
            <SectionTitle hindi={part.name} english={`${openInPart} / ${list.length}`} />
            <div className="mt-3 space-y-2.5">
              {list.map((entry) => (
                <EpisodeRow
                  key={entry.n}
                  entry={entry}
                  unlocked={!entry.withheld && entry.n <= revealed}
                  open={openN === entry.n}
                  onToggle={() => toggle(entry.n)}
                />
              ))}
            </div>
          </section>
        );
      })}

      {/* आगे के प्रसंग — सिर्फ़ गिनती, शीर्षक नहीं (वे भी जाँच में हैं) */}
      {live < KATHA_TOTAL ? (
        <Card className="mt-6 border-saffron-200 bg-cream-200/60">
          <p className="text-sm leading-[1.85] font-semibold text-ink-700">
            {fmt("जाँच पूरी होने पर {r} और प्रसंग खुल जाएँगे — एक-एक करके।", {
              r: toNativeDigits(KATHA_TOTAL - live),
            })}
          </p>
          <p className="mt-2 text-xs leading-[1.8] text-ink-500">
            {t("रुके हुए प्रसंगों का शीर्षक भी अभी नहीं दिखाया जाता — जो कुछ जाँच से नहीं गुज़रा, वह प्रकाशित नहीं होगा।")}
          </p>
        </Card>
      ) : null}

      <p className="mt-6 rounded-3xl bg-cream-200/70 p-4 text-xs leading-[1.85] text-ink-500">
        {t("हर प्रसंग का स्रोत दर्ज है — वाल्मीकि रामायण या रामचरितमानस। जो कथा इन दोनों में नहीं मिलती, उसे “लोक-परंपरा” कहा गया है। विद्वान पाठक की समीक्षा पूरी होने से पहले कोई प्रसंग प्रकाशित नहीं होता।")}
      </p>
    </div>
  );
}

function EpisodeRow({
  entry,
  unlocked,
  open,
  onToggle,
}: {
  entry: PlanEntry;
  unlocked: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const t = useT();
  if (!unlocked) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-saffron-200 bg-cream-100/70 px-4 py-3">
        <span className="text-base">🔒</span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-[0.12em] text-ink-500 uppercase">
            {t("प्रसंग")} {toNativeDigits(entry.n)}
          </p>
          <p className="truncate text-sm font-bold text-ink-500">{entry.title}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border transition-colors",
        open ? "border-gold-300 bg-white" : "border-saffron-100 bg-white/70",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-saffron-100 text-sm font-extrabold text-saffron-700 tabular-nums">
          {toNativeDigits(entry.n)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-extrabold text-ink-900">
            {entry.title}
          </span>
          {entry.episode ? (
            <span className="mt-0.5 block text-[10px] font-bold tracking-[0.1em] text-gold-700 uppercase">
              {entry.episode.tradition === "folk"
                ? t("लोक-परंपरा — जाँच बाकी")
                : t("ग्रंथ-आधारित — जाँच बाकी")}
            </span>
          ) : null}
          {entry.episode ? (
            <span className="mt-0.5 block text-xs text-ink-500">
              {entry.episode.story[0].slice(0, 46)}…
            </span>
          ) : null}
        </span>
        <span className={cn("text-sm text-ink-500", open && "rotate-180")}>⌄</span>
      </button>

      {open ? (
        <div className="border-t border-saffron-100 px-4 pt-3 pb-4">
          {entry.episode ? (
            <>
              {entry.episode.story.map((para, index) => (
                <p
                  key={index}
                  className="mb-2.5 text-[15px] leading-[1.95] text-ink-700 last:mb-0"
                >
                  {para}
                </p>
              ))}
              <p className="mt-4 rounded-2xl bg-saffron-50 px-4 py-3 text-sm leading-[1.8] font-semibold text-saffron-800">
                {t("सीख · ")} {entry.episode.lesson}
              </p>
              <p className="mt-2 text-[11px] leading-[1.7] font-semibold text-ink-500">
                {t("स्रोत:")} {entry.episode.source}
              </p>
              {entry.episode.note ? (
                <p className="mt-2 rounded-2xl bg-cream-200/70 px-4 py-3 text-xs leading-[1.8] text-ink-500">
                  {t("परंपरा में मतभेद · ")} {entry.episode.note}
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-sm leading-[1.8] text-ink-500">
              {t("यह प्रसंग अभी लिखा जा रहा है। जिस दिन आपकी पूजा होगी, उसी दिन यह पूरा खुल जाएगा।")}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
