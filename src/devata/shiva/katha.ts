/**
 * महादेव की कथा — 108 प्रसंग का ढाँचा, ख़ाली।
 *
 * रूप हनुमान जी वाले जैसा ही है (9 भाग, क्रम, हर प्रसंग पर स्रोत), पर **कोई प्रसंग
 * लिखा या प्रकाशित नहीं**। `published` हर जगह `false` है, इसलिए कथा-स्क्रीण पर
 * वही सच दिखेगा जो हनुमान जी की कथा पर दिख रहा है: "जाँच के बाद खुलेगी"।
 *
 * भाग (जान-बूझकर चुने गए, ये हनुमान जी के नौ भागों की जगह):
 *   1 बाल्य        2 विवाह        3 गणेश        4 कार्तिकेय      5 अंधकासुर
 *   6 ज्योतिर्लिंग  7 अमृत मंथन    8 नीलकंठ      9 आशीर्वाद
 */
import { t } from "../../lib/i18n";

export const SHIVA_KATHA_TOTAL = 108;

export type ShivaPart = { id: string; name: string; from: number; to: number };

export const SHIVA_PARTS: ShivaPart[] = [
  { id: "balya", name: t("बाल्य"), from: 1, to: 12 },
  { id: "vivah", name: t("विवाह"), from: 13, to: 24 },
  { id: "ganesh", name: t("गणेश"), from: 25, to: 36 },
  { id: "kARTIKEYA", name: t("कार्तिकेय"), from: 37, to: 48 },
  { id: "andhak", name: t("अंधकासुर"), from: 49, to: 60 },
  { id: "jyotirling", name: t("ज्योतिर्लिंग"), from: 61, to: 72 },
  { id: "amrit", name: t("अमृत मंथन"), from: 73, to: 84 },
  { id: "nilakanth", name: t("नीलकंठ"), from: 85, to: 96 },
  { id: "ashirvad", name: t("आशीर्वाद"), from: 97, to: 108 },
];

export type ShivaEpisode = {
  n: number;
  title: string;
  story: string[];
  lesson: string;
  part: string;
  /** स्रोत — हनुमान जी की तरह हर प्रसंग पर अनिवार्य */
  source: string;
  tradition: "script" | "folk" | "mixed" | "unsourced";
  reviewed: boolean;
  published: boolean;
};

/** अभी कोई प्रसंग नहीं — ढाँचा तैयार है, सामग्री जाँच के बाद आएगी */
export const SHIVA_EPISODES: ShivaEpisode[] = [];

export function shivaWrittenCount(): number {
  return SHIVA_EPISODES.length;
}

export function shivaPublishedCount(): number {
  return SHIVA_EPISODES.filter((episode) => episode.published).length;
}

export function shivaKathaState() {
  const published = shivaPublishedCount();
  return {
    published,
    written: shivaWrittenCount(),
    total: SHIVA_KATHA_TOTAL,
    held: {
      title: published > 0 ? t("आज का नया प्रसंग") : t("कथा जाँच के बाद खुलेगी"),
      note:
        published > 0
          ? t("हर पूजा के बाद एक नया प्रसंग खुलता है।")
          : t("महादेव की कथा का ढाँचा तैयार है, पर कोई प्रसंग लिखा या जाँचा नहीं गया — इसलिए कुछ नहीं दिखाया जा रहा।"),
    },
    teaser: {
      title: published > 0 ? t("कथा पढ़ें") : t("जाँच की स्थिति देखें"),
      note:
        published > 0
          ? t("हर दिन एक नया प्रसंग।")
          : t("नौ भाग तय हैं — बाल्य से आशीर्वाद तक।"),
    },
  };
}
