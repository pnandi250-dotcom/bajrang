/**
 * त्योहार।
 *
 * चाँद के हिसाब से वाले त्योहार (हनुमान जयंती, राम नवमी) पंचांग पर निर्भर हैं,
 * इसलिए यहाँ अनुमानित तिथि दी गई है और उपयोगता Settings से इसे ठीक कर सकती है।
 * साप्ताहिक संकष्टी (मंगलवार/शनिवार) हमेशा सही होती है, इसलिए वे गिने जाते हैं।
 */

export type Festival = {
  id: string;
  name: string;
  /** YYYY-MM-DD */
  date: string;
  /** केवल अनुमानित तिथि वाले त्योहार पर "अनुमानित" दिखेगा */
  estimated?: boolean;
  note?: string;
};

export const DEFAULT_FESTIVALS: Festival[] = [
  {
    id: "hanuman-jayanti",
    name: "हनुमान जयंती",
    date: "2026-03-19",
    estimated: true,
    note: "चैत्र पूर्णिमा — पंचांग के अनुसार तिथि बदल सकती है।",
  },
  {
    id: "ram-navami",
    name: "राम नवमी",
    date: "2026-03-12",
    estimated: true,
    note: "शुक्ल नवमी — पंचांग के अनुसार तिथि बदल सकती है।",
  },
  {
    id: "hanuman-jayanti-2027",
    name: "हनुमान जयंती",
    date: "2027-03-08",
    estimated: true,
    note: "चैत्र पूर्णिमा।",
  },
];

const FESTIVAL_KEY = "bajrang.festivals.v1";

export function loadFestivals(): Festival[] {
  if (typeof window === "undefined") return DEFAULT_FESTIVALS;
  try {
    const raw = window.localStorage.getItem(FESTIVAL_KEY);
    if (!raw) return DEFAULT_FESTIVALS;
    const parsed = JSON.parse(raw) as Festival[];
    if (!Array.isArray(parsed)) return DEFAULT_FESTIVALS;
    return parsed.filter((f) => /^hanuman-jayanti|ram-navami/.test(f.id));
  } catch {
    return DEFAULT_FESTIVALS;
  }
}

export function saveFestivals(festivals: Festival[]) {
  try {
    window.localStorage.setItem(FESTIVAL_KEY, JSON.stringify(festivals));
  } catch {
    /* ignore */
  }
}

/** अगला आने वाला त्योहार और उस तक के दिन */
export function nextFestival(festivals: Festival[], todayKey: string) {
  const upcoming = festivals
    .filter((f) => f.date > todayKey)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (upcoming.length === 0) return null;

  const festival = upcoming[0];
  const [y, m, d] = festival.date.split("-").map(Number);
  const [ty, tm, td] = todayKey.split("-").map(Number);
  const daysUntil = Math.round(
    (Date.UTC(y, m - 1, d) - Date.UTC(ty, tm - 1, td)) / 86_400_000,
  );
  return { festival, daysUntil };
}