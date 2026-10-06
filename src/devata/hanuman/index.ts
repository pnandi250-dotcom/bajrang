/**
 * हनुमान जी — एक देवता की पूरी सामग्री, एक जगह।
 *
 * श्लोक-पाठ `content.ts`, कथा `katha.ts`, त्योहार `festivals.ts` और कार्ड का चित्र
 * `drawCard.ts` में रहते हैं — वे सीधे उपयोग में आते हैं, इसलिए यहाँ दोबारा
 * परिभाषित नहीं किए गए; यह फ़ाइल सिर्फ़ उन्हें `Devata` के आकार में जोड़ती है।
 */
import { chalisaYatra, chalisaVerseAt } from "./content";
import { KATHA_TOTAL, publishedCount, writtenCount } from "./katha";
import { drawHanumanCard } from "./drawCard";
import { t } from "../../lib/i18n";
import type { DevataContent } from "../../lib/devataTypes";

/** पूजा-स्क्रीण की धुन — C4 (हनुमान जी) */
export const HANUMAN_AUDIO = {
  bellRoot: 261.63,
  chantRoots: [261.63, 329.63, 392.0],
  decay: 2.8,
};

/** केवल पूजा-स्क्रीण बदलती है, बाक़ी ऐप गर्म रहता है */
export const HANUMAN_THEME = {
  ritualFrom: "#FF6B35",
  ritualVia: "#F2582E",
  ritualTo: "#A01B23",
};

export const hanumanDevata: DevataContent = {
  id: "hanuman",
  name: t("हनुमान जी"),
  greeting: t("जय श्री राम"),

  verse: () => chalisaVerseAt(0),

  yatra: (read) => {
    const view = chalisaYatra(read);
    return {
      total: view.total,
      read: view.read,
      label: t("चालीसा यात्रा"),
      next: view.next ? { label: view.next.label, teaser: view.next.teaser } : null,
      complete: view.complete,
    };
  },

  specialWeekday: (date) =>
    date.getDay() === 2 ? t("मंगलवार") : date.getDay() === 6 ? t("शनिवार") : null,

  katha: () => {
    const published = publishedCount();
    return {
      published,
      written: writtenCount(),
      total: KATHA_TOTAL,
      held: {
        title: published > 0 ? t("आज का नया प्रसंग") : t("कथा जाँच के बाद खुलेगी"),
        note:
          published > 0
            ? t("हर पूजा के बाद एक नया प्रसंग खुलता है।")
            : t("लिखे गए प्रसंग हैं, पर विद्वान पाठक की समीक्षा बाकी है — इसलिए कुछ नहीं दिखाया जा रहा।"),
      },
      teaser: {
        title: published > 0 ? t("कथा पढ़ें") : t("जाँच की स्थिति देखें"),
        note:
          published > 0
            ? t("हर दिन एक नया प्रसंग।")
            : t("प्रसंगों का हवाला दर्ज है — वाल्मीकि रामायण या रामचरितमानस।"),
      },
    };
  },

  afterPrayer: {
    title: t("हनुमान जी ने आपका नाम जान लिया। वे हर दिन आपको याद करेंगे।"),
    note: t("जानकी माता ने आपको रक्षा दी है।"),
    nameRemembered: t("आपका नाम"),
  },

  reminder: (name) =>
    `🙏 ${name ? `${name}, ` : ""}${t("हनुमान जी का वार है — आज की पूजा 1 मिनट में पूरी करो")}`,

  audio: HANUMAN_AUDIO,
  theme: HANUMAN_THEME,
  draw: drawHanumanCard,
};
