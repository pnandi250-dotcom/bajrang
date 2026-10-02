import { useEffect, useState } from "react";
import { Button } from "./ui/Button";

type BeforeInstallPromptEvent = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "bajrang.installBanner";

/**
 * फ़ोन में "Add to Home Screen" करने की सलाह।
 * Chromium से installPrompt आता है; Safari पर यह नहीं दिखता,
 * वहाँ iOS का हुक instruction ज़्यादा काम आता है।
 */
export function InstallBanner({ isIOS }: { isIOS: boolean }) {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return (
        window.localStorage.getItem(DISMISS_KEY) === "done" ||
        window.matchMedia("(display-mode: standalone)").matches
      );
    } catch {
      return true;
    }
  });
  const [installed, setInstalled] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches,
  );

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || dismissed) return null;

  function close() {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, "done");
    } catch {
      /* कुछ नहीं हुआ तो भी ठीक */
    }
  }

  if (!event && !isIOS) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] px-4 pb-[calc(78px+env(safe-area-inset-bottom))]">
      <div className="animate-rise pointer-events-auto flex items-center gap-3 rounded-3xl border border-saffron-200 bg-cream-50 p-4 shadow-[0_18px_40px_-18px_rgba(120,44,25,0.55)]">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-saffron-100 text-xl">
          📲
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink-900">Bajrang को फ़ोन में लगाएँ</p>
          <p className="mt-0.5 text-xs leading-[1.7] text-ink-500">
            {isIOS
              ? "Safari → साझा करें → 'Add to Home Screen'"
              : "एक टैप में खुलेगा, और रोज़ का संदेश भी आएगा।"}
          </p>
        </div>
        {event ? (
          <Button
            variant="primary"
            size="md"
            className="shrink-0"
            onClick={async () => {
              await event.prompt();
              await event.userChoice;
              setEvent(null);
              close();
            }}
          >
            लगाएँ
          </Button>
        ) : (
          <button
            type="button"
            onClick={close}
            className="shrink-0 rounded-2xl px-3 py-2 text-sm font-bold text-saffron-700"
          >
            ठीक है
          </button>
        )}
      </div>
    </div>
  );
}
