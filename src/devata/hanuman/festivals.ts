/**
 * त्योहार की तिथियाँ।
 *
 * स्रोत: Drik Panchang (drikpanchang.com) — "Drik Ganita" गणना, Lahiri Ayanamsha।
 *   • चैत्र पूर्णिमा (हनुमान जयंती, उत्तर भारत की परंपरा):
 *     https://www.drikpanchang.com/vrats/purnimasidates.html
 *   • राम नवमी (शुक्ल नवमी, चैत्र):
 *     https://www.drikpanchang.com/hindu-festivals/rama-navami/rama-navami.html
 *
 * ज़रूरी बात: ये तिथियाँ भारत के पंचांग के हिसाब से हैं। अमेरिका/यूरोप
 * के समय-क्षेत्र में यही तिथि वहाँ एक दिन पहले दिख सकती है (Drik Panchang की
 * अमेरिका वाली सूचियाँ 2027 राम नवमी 14 अप्रैल दिखाती हैं)। इसलिए ऐप में
 * तारीख खुद ठीक करने का विकल्प रखा गया है।
 *
 * पुराने कमिट में दी गई तारीखें (19 मार्च 2026, 8 मार्च 2027) ग़लत थीं —
 * वे हटा दी गई हैं।
 */

export type Festival = {
  id: string;
  name: string;
  /** YYYY-MM-DD */
  date: string;
  /** यह तारीख किस स्रोत से ली गई */
  source: string;
  note?: string;
};

const DRIK = "Drik Panchang · drikpanchang.com";

export const DEFAULT_FESTIVALS: Festival[] = [
  {
    id: "ram-navami-2027",
    name: "राम नवमी",
    date: "2027-04-15",
    source: `${DRIK} · शुक्ल नवमी, चैत्र`,
    note: "भारत के पंचांग में गुरुवार 15 अप्रैल 2027। अमेरिका/यूरोप में यही तिथि 14 अप्रैल पड़ सकती है।",
  },
  {
    id: "hanuman-jayanti-2027",
    name: "हनुमान जयंती",
    date: "2027-04-20",
    source: `${DRIK} · चैत्र पूर्णिमा`,
    note: "उत्तर भारत की परंपरा — चैत्र पूर्णिमा, मंगलवार 20 अप्रैल 2027।",
  },
  {
    id: "hanuman-jayanti-2028",
    name: "हनुमान जयंती",
    date: "2028-04-08",
    source: `${DRIK} · चैत्र पूर्णिमा`,
    note: "उत्तर भारत की परंपरा — चैत्र पूर्णिमा, शनिवार 8 अप्रैल 2028।",
  },
  {
    id: "ram-navami-2028",
    name: "राम नवमी",
    date: "2028-04-03",
    source: `${DRIK} · शुक्ल नवमी, चैत्र`,
    note: "भारत के पंचांग में सोमवार 3 अप्रैल 2028।",
  },
];

const FESTIVAL_KEY = "bajrang.festivals.v2";

export function loadFestivals(): Festival[] {
  if (typeof window === "undefined") return DEFAULT_FESTIVALS;
  try {
    const raw = window.localStorage.getItem(FESTIVAL_KEY);
    // v1 में ग़लत तारीखें थीं, इसलिए पुरानी सूची नहीं पढ़ते
    if (!raw) return DEFAULT_FESTIVALS;
    const parsed = JSON.parse(raw) as Festival[];
    if (!Array.isArray(parsed)) return DEFAULT_FESTIVALS;
    const valid = parsed.filter((f) => f && /^\d{4}-\d{2}-\d{2}$/.test(f.date ?? ""));
    return valid.length ? valid : DEFAULT_FESTIVALS;
  } catch {
    return DEFAULT_FESTIVALS;
  }
}

export function saveFestivals(festivals: Festival[]) {
  try {
    window.localStorage.setItem(FESTIVAL_KEY, JSON.stringify(festivals));
  } catch {
    /* storage बंद है तो याद रखा नहीं जाएगा */
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
