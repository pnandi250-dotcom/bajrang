import { actions } from "../lib/store";
import { useT } from "../lib/i18n";
import { LanguagePicker } from "../components/LanguagePicker";
import { Button } from "../components/ui/Button";

/**
 * पहला स्क्रीन — सिर्फ़ एक सवाल: शुरू करें?
 *
 * नाम पहले नहीं पूछा जाता। पहली पूजा के बाद, घंटी के साथ पूछा जाता है।
 * इससे कोई भी बिना कुछ भरे सीधे पूजा कर सकता है — और यही सबसे ज़रूरी है।
 */
export function Onboarding({ onDone }: { onDone: () => void }) {
  const t = useT();

  function start() {
    actions.completeOnboarding({});
    onDone();
  }

  return (
    <div className="safe-top safe-bottom relative flex min-h-[100dvh] flex-col overflow-hidden bg-linear-to-b from-saffron-100 via-cream-100 to-cream-200 px-6">
      <Backdrop />

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 pt-2">
          <LanguagePicker variant="compact" />
          <span className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-bold tracking-[0.14em] text-saffron-700">
            BAJRANG
          </span>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <span className="animate-floaty grid h-24 w-24 place-items-center rounded-full bg-white/80 text-5xl shadow-[0_14px_36px_-18px_rgba(120,44,25,0.7)]">
            🙏
          </span>

          <p className="mt-7 text-[11px] font-bold tracking-[0.2em] text-saffron-600 uppercase">
            {t("रोज़ एक मिनट")}
          </p>
          <h1 className="mt-2 text-[32px] leading-snug font-extrabold text-ink-900">
            {t("जय बजरंगबली")}
          </h1>
          <p className="mx-auto mt-4 max-w-xs text-[16px] leading-[1.9] text-ink-700">
            {t("हर रोज़ सिर्फ़ एक मिनट — हनुमान चालीसा का एक पंक्ति, एक घंटी, और आपका संकल्प।")}{" "}
            {t("कोई नाम पहले नहीं चाहिए, कोई खाता नहीं।")}
          </p>

          <div className="mt-8 w-full space-y-3">
            <LanguagePicker variant="full" className="mb-5 text-left" />
            <Button variant="primary" size="xl" block onClick={start}>
              {t("पूजा शुरू करें 🙏")}
            </Button>
            <p className="text-xs leading-relaxed text-ink-500">
              {t("आपका नाम और संकल्प पूजा के बाद पूछा जाएगा।")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="animate-floaty absolute top-28 left-5 text-5xl text-saffron-300/20 select-none">
        🪔
      </div>
      <div className="absolute top-1/3 -right-14 h-64 w-64 rounded-full bg-gold-300/25 blur-3xl" />
      <div className="absolute bottom-24 -left-12 h-56 w-56 rounded-full bg-saffron-300/20 blur-3xl" />
    </div>
  );
}
