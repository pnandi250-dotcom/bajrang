import { useEffect, useState } from "react";
import { useDerivedState } from "../lib/store";
import { buildShareText, createShareCard, shareFileName } from "../lib/shareCard";
import { toHindiDigits } from "../lib/date";
import { Button } from "./ui/Button";

type Props = {
  open: boolean;
  onClose: () => void;
  /** किस अवधि का कार्ड बनाना है (आमतौर पर स्ट्रीक) */
  periodDays?: number;
};

export function ShareCardSheet({ open, onClose, periodDays }: Props) {
  const state = useDerivedState();
  const [card, setCard] = useState<{ dataUrl: string; blob: Blob | null } | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const streak = periodDays ?? state.streak;
  const periodLabel = `${toHindiDigits(streak)} दिन`;

  useEffect(() => {
    if (!open) {
      setCard(null);
      setStatus(null);
      return;
    }
    const canvas = createShareCard({
      name: state.profile.name || "भक्त",
      streak,
      totalCompleted: state.totalCompleted,
      sankalp: state.profile.sankalp,
      periodLabel,
    });
    const dataUrl = canvas.toDataURL("image/png");
    canvas.toBlob((blob) => setCard({ dataUrl, blob }), "image/png", 0.95);
  }, [open, state.profile.name, state.profile.sankalp, state.totalCompleted, streak, periodLabel]);

  if (!open) return null;

  const dataUrl = card?.dataUrl ?? null;

  function downloadImage() {
    // Blob URL ज़्यादा भरोसेमंद है — बड़े data: URL से कुछ ब्राउज़र डाउनलोड नहीं करते
    const href = card?.blob ? URL.createObjectURL(card.blob) : dataUrl;
    if (!href) return;

    const link = document.createElement("a");
    link.href = href;
    link.download = shareFileName(streak);
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
    if (card?.blob) {
      window.setTimeout(() => URL.revokeObjectURL(href), 15_000);
    }
  }

  function buildText() {
    return buildShareText({
      name: state.profile.name,
      streak,
      totalCompleted: state.totalCompleted,
      sankalp: state.profile.sankalp,
      periodLabel,
    });
  }

  async function shareNative() {
    const file = card?.blob
      ? new File([card.blob], shareFileName(streak), { type: "image/png" })
      : null;

    if (file && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: buildText(), title: "Bajrang" });
        return;
      } catch {
        /* user cancelled — fall through to WhatsApp */
      }
    }
    shareToWhatsApp();
  }

  function shareToWhatsApp() {
    downloadImage();
    window.open(`https://wa.me/?text=${encodeURIComponent(buildText())}`, "_blank", "noopener");
    setStatus("तस्वीर सहेजी जा रही है — फिर WhatsApp में चुन लीजिए।");
  }

  /** iOS Safari में download attribute काम नहीं करता — तस्वीर नए टैब में खोलें */
  function openImage() {
    if (!dataUrl) return;
    const tab = window.open();
    if (!tab) {
      setStatus("पॉपअप ब्लॉक है — तस्वीर सहेजें दबाएँ।");
      return;
    }
    tab.document.write(
      `<title>बजरंग कार्ड</title><img src="${dataUrl}" style="max-width:100%;height:auto;display:block;margin:0 auto" />`,
    );
    tab.document.close();
    setStatus("तस्वीर खुल गई — लंबे दबाएँ और 'Save Image' चुनें।");
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(buildText());
      setStatus("बात कॉपी हो गई।");
    } catch {
      setStatus("कॉपी नहीं हो सका।");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/55 backdrop-blur-sm">
      <div className="safe-bottom animate-rise mx-auto max-h-[92dvh] w-full max-w-[480px] overflow-y-auto rounded-t-[32px] bg-cream-100 px-5 pt-5 pb-4 shadow-2xl">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-saffron-200" />

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-ink-900">साप्ताहिक कार्ड</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-cream-300 text-ink-700"
            aria-label="बंद करें"
          >
            ✕
          </button>
        </div>

        <div className="mt-3 overflow-hidden rounded-3xl border border-saffron-200 bg-white shadow-soft">
          {dataUrl ? (
            <img src={dataUrl} alt="बजरंग साप्ताहिक कार्ड" className="w-full" />
          ) : (
            <div className="grid aspect-square place-items-center text-saffron-400">
              तैयार हो रहा है…
            </div>
          )}
        </div>

        <div className="mt-4 space-y-2.5">
          <Button variant="primary" size="lg" block onClick={shareNative}>
            <span>साझा करें</span>
            <span className="text-sm font-normal">Share</span>
          </Button>

          <Button variant="deep" size="lg" block onClick={shareToWhatsApp}>
            <span>WhatsApp पर भेजें</span>
            <span className="text-sm font-normal">WhatsApp</span>
          </Button>

          <div className="flex gap-2.5">
            <Button variant="soft" size="md" block onClick={downloadImage}>
              तस्वीर सहेजें
            </Button>
            <Button variant="soft" size="md" block onClick={openImage}>
              तस्वीर खोलें
            </Button>
          </div>

          <p className="rounded-2xl bg-cream-200/80 px-4 py-2.5 text-center text-[11px] font-semibold text-ink-500">
            PNG तस्वीर · 1080 × 1080 · कोई ऐप नहीं, सीधे WhatsApp
          </p>

          <button
            type="button"
            onClick={copyText}
            className="w-full text-center text-sm font-semibold text-ink-500"
          >
            सिर्फ़ बात कॉपी करें
          </button>

          {status ? (
            <p className="rounded-2xl bg-cream-200 px-4 py-2.5 text-center text-xs font-semibold text-ink-700">
              {status}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}