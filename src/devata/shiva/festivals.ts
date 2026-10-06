/**
 * महादेव के त्योहार — तारीख़ें पंचांग से जाँची जानी बाकी हैं।
 *
 * ⏳ `verified: false` वाले त्योहार सूची में दिखते हैं, पर तारीख़ के साथ नहीं —
 * इसी तरह जैसे श्लोक जाँच बिना नहीं दिखते। चाँद के त्योहार हर साल बदलते हैं,
 * इसलिए इन्हें पंचांग से हर साल पक्का करना पड़ता है; यह काम हमने नहीं किया।
 */

export type ShivaFestival = {
  id: string;
  name: string;
  /** "lunar" = चाँद के अनुसार बदलता है, "fixed" = तय तारीख़ */
  kind: "lunar" | "fixed";
  /** MM-DD — तय तारीख़ों के लिए; चाँद वाले ख़ाली रहते हैं */
  md?: string;
  /** जान-बूझकर तय नहीं, इसलिए ख़ाली */
  dateHint: string;
  source: string;
  note: string;
  verified: boolean;
};

export const SHIVA_FESTIVALS: ShivaFestival[] = [
  {
    id: "mahashivaratri",
    name: "महाशिवरात्रि",
    kind: "lunar",
    dateHint: "",
    source: "—",
    note: "फाल्गुन कृष्ण चतुर्दशी — तिथि हर साल बदलती है, पंचांग से पक्की करनी होगी।",
    verified: false,
  },
  {
    id: "shravan-monday",
    name: "श्रावण के सोमवार",
    kind: "lunar",
    dateHint: "",
    source: "—",
    note: "श्रावण मास के प्रत्येक सोमवार — शिव के लिए विशेष दिन।",
    verified: false,
  },
  {
    id: "pradosh",
    name: "प्रदोष व्रत",
    kind: "lunar",
    dateHint: "",
    source: "—",
    note: "हर तेरहवीं तिथि (त्रयोदशी) — शुक्ल और कृष्ण दोनों पक्ष में।",
    verified: false,
  },
  {
    id: "kartik-purnima",
    name: "कार्तिक पूर्णिमा",
    kind: "lunar",
    dateHint: "",
    source: "—",
    note: "कार्तिक शुक्ल पूर्णिमा — शिव तथा सूर्य दर्शन।",
    verified: false,
  },
];
