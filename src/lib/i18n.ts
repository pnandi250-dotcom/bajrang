/**
 * भाषा — हिंदी और বাংলा।
 *
 * तरीका सरल है: हर जगह हिंदी साफ़ लिखी रहती है, और `t()` उसे भाषा के हिसाब से
 * बदल देता है। इससे मूल ऐप हिंदी में ही रहता है — नया लेखक ख़ुद हिंदी लिखता है,
 * और बंगाली अनुवाद साथ-साथ रखा जाता है।
 *
 * बंगाली शब्दकोश `src/lib/bn.ts` में है। वहाँ हर हिंदी वाक्य की जगह बंगाली है;
 * `i18n-check.mjs` स्क्रिप्ट जाँचती है कि कोई `t("…")` वाक्य छूटा तो नहीं —
 * इसलिए अनुवाद अधूरा होते ही पकड़ा जाता है और उपयोगकर्ता को कहीं हिंदी नहीं टूट पड़ती।
 */

import { useMemo, useSyncExternalStore } from "react";
import { BN } from "./bn";

export type Lang = "hi" | "bn";

export const LANGS: { id: Lang; label: string; english: string }[] = [
  { id: "hi", label: "हिंदी", english: "Hindi" },
  { id: "bn", label: "বাংলা", english: "Bengali" },
];

const STORAGE_KEY = "bajrang.lang.v1";

function readLang(): Lang {
  if (typeof window === "undefined") return "hi";
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "bn" ? "bn" : "hi";
  } catch {
    return "hi";
  }
}

let current: Lang = readLang();
const listeners = new Set<() => void>();

export function getLang(): Lang {
  return current;
}

export function setLang(next: Lang) {
  if (next === current) return;
  current = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* storage बंद है तो इसी सत्र में चलेगा */
  }
  if (typeof document !== "undefined") {
    document.documentElement.lang = next === "bn" ? "bn" : "hi";
  }
  for (const listener of listeners) listener();
}

export function useLang(): Lang {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    () => current,
    () => current,
  );
}

export type Translator = (hindi: string) => string;

/** भाषा बदलते ही घटक फिर से बनते हैं, इसलिए `t` हर बार सही भाषा देता है */
export function useT(): Translator {
  const lang = useLang();
  // स्थिर function — भाषा न बदले तो घटक दोबारा नहीं बनता
  return useMemo(() => (hindi: string) => translate(lang, hindi), [lang]);
}

export function translate(lang: Lang, hindi: string): string {
  if (lang === "hi") return hindi;
  return BN[hindi] ?? hindi;
}

/** बिना React के — फ़ंक्शन और स्क्रिप्ट में (तारीख, त्योहार आदि) */
export function t(hindi: string): string {
  return translate(current, hindi);
}

/** `{n}` जैसे निशान भरने के लिए */
export function fmt(hindi: string, vars: Record<string, string | number>): string {
  let out = t(hindi);
  for (const [key, value] of Object.entries(vars)) {
    out = out.replaceAll(`{${key}}`, String(value));
  }
  return out;
}

/**
 * दीर्घ सामग्री (कथा, अर्थ, संदेश, त्योहार) — हिंदी हमेशा, बंगाली साथ।
 * बंगाली न हो तो हिंदी ही दिखेगी, इसलिए कभी खाली जगह नहीं दिखती।
 */
export type Tr = { hi: string; bn?: string };

export function pick(item: Tr | undefined, lang: Lang = current): string {
  if (!item) return "";
  if (lang === "bn" && item.bn) return item.bn;
  return item.hi;
}
