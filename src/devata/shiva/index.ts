/**
 * महादेव — दूसरा देवता।
 *
 * ⚠️  सामग्री जाँच बाकी है
 * ─────────────────────────────────────────────────────────────
 * यहाँ जो पंक्तियाँ होंगी, वे किसी मुद्रित या सिद्ध पाठ से उतारी जाएँगी — जैसे
 * चालीसा की पंक्तियाँ तीन स्वतंत्र प्रकाशनों से मिलाकर ली गई थीं। **याद से कुछ
 * नहीं लिखा जाएगा**, और जब तक `verified: true` न हो, पंक्ति स्क्रीण पर दिखेगी ही
 * नहीं।
 *
 * जब तक सामग्री नहीं आती, ऐप शुरू में "कथा जाँच के बाद खुलेगी" ही दिखाएगा — जो
 * सच है।
 */
import { SHIVA_VERSES } from "./content";
import { shivaKathaState, SHIVA_KATHA_TOTAL, shivaWrittenCount } from "./katha";
import { shivaYatra } from "./yatra";
import { SHIVA_FESTIVALS } from "./festivals";
import { drawShivaCard } from "./drawCard";
import { t } from "../../lib/i18n";
import type { DevataContent } from "../../lib/devataTypes";

/** पूजा-स्क्रीण की धुन — G2, ज़्यादा गूँजती (हिमालयी मंदिर की घंटी जैसा) */
export const SHIVA_AUDIO = {
  bellRoot: 98.0,
  chantRoots: [98.0, 130.81, 196.0],
  decay: 4.0,
};

export const SHIVA_THEME = {
  ritualFrom: "#1E3A5F",
  ritualVia: "#274C77",
  ritualTo: "#0B1B2B",
};

export const shivaDevata: DevataContent = {
  id: "shiva",
  name: t("महादेव"),
  greeting: t("हर हर महादेव"),

  verse: () => {
    // जब तक पंक्तियाँ जाँची नहीं गईं, कुछ नहीं दिखेगा
    const first = SHIVA_VERSES.find((verse) => verse.verified);
    return first
      ? { source: first.source, lines: first.lines, meaning: first.meaning }
      : null;
  },

  yatra: (read) => shivaYatra(read),

  specialWeekday: (date) => (date.getDay() === 1 ? t("सोमवार") : null),

  katha: () => shivaKathaState(),

  afterPrayer: {
    title: t("महादेव ने आपका नाम सुन लिया। वे हर दिन आपको याद करेंगे।"),
    note: t("शिव का आशीर्वाद हमेशा साथ रहता है।"),
    nameRemembered: t("आपका नाम"),
  },

  reminder: (name) =>
    `🙏 ${name ? `${name}, ` : ""}${t("महादेव का दिन है — आज की पूजा 1 मिनट में पूरी करो")}`,

  audio: SHIVA_AUDIO,
  theme: SHIVA_THEME,
  draw: drawShivaCard,
  // त्योहार भी जाँच बाकी हैं
  ...({ festivals: SHIVA_FESTIVALS, kathaTotal: SHIVA_KATHA_TOTAL, written: shivaWrittenCount() } as object),
} as DevataContent;
