import { LANGS, setLang, useLang, useT } from "../lib/i18n";
import { cn } from "../lib/utils";

/**
 * भाषा चुनना — हिंदी ⇄ बंगाली।
 *
 * यह तीन जगह दिखता है: पहली स्क्रीन (Onboarding), होम के ऊपर, और सेटिंग्स।
 * किसी को भी भाषा ढूँढ़ने की ज़रूरत न पड़े — जहाँ से उसे फ़ॉलो करना है, वहीं से
 * यह बदलिए।
 */
export function LanguagePicker({
  variant = "full",
  className,
}: {
  variant?: "full" | "compact";
  className?: string;
}) {
  const t = useT();
  const lang = useLang();

  if (variant === "compact") {
    return (
      <div className={cn("flex gap-1", className)} role="group" aria-label={t("भाषा")}>
        {LANGS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setLang(item.id)}
            aria-pressed={lang === item.id}
            className={cn(
              "pressable rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors",
              lang === item.id
                ? "bg-saffron-500 text-white"
                : "bg-white/70 text-saffron-700",
            )}
          >
            {item.short}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-3 gap-2">
        {LANGS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setLang(item.id)}
            aria-pressed={lang === item.id}
            className={cn(
              "rounded-2xl border-2 px-4 py-3 text-base font-bold transition-colors",
              lang === item.id
                ? "border-saffron-500 bg-saffron-500 text-white"
                : "border-saffron-200 bg-white text-ink-700",
            )}
          >
            <span>{item.label}</span>
            {item.english !== item.label ? (
              <span className="ml-1.5 text-[10px] font-semibold tracking-wide uppercase opacity-70">
                {item.english}
              </span>
            ) : null}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-ink-500">
        {t("श्रीरामचरितमानस की भाषा में")}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-ink-500">
        {lang === "bn"
          ? t("বাংলায় শ্লোক দেবনাগরিতেই থাকবে")
          : lang === "en"
            ? t("English screen, but the verses stay in the original Devanagari")
            : t("हिंदी में श्लोक उसी मूल रूप में रहते हैं")}
      </p>
    </div>
  );
}
