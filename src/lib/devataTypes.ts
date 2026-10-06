/**
 * देवता का आकार — यहाँ सिर्फ़ आकार है, कोई आयात नहीं।
 *
 * अलग फ़ाइल इसलिए कि `devata.ts` और `devata/<देवता>/index.ts` एक-दूसरे को
 * आयात करते हैं; प्रकार अगर यहीं रहते तो वह चक्र बन जाता और TypeScript
 * `any` दे देता।
 */
import type { Lang } from "./i18n";

export type DevataId = "hanuman" | "shiva";

/** स्क्रीन पर दिखने वाली सामग्री — हर हिस्सा जाँच-गेट के पीछे है */
export type DevataContent = {
  id: DevataId;
  /** नाम, जैसे "हनुमान जी" */
  name: string;
  /** शीर्षक पर आने वाला रुक — जैसे "जय श्री राम" */
  greeting: string;
  /** हर दिन की पंक्ति — यात्रा के क्रम में */
  verse: () => { source: string; lines: string[]; meaning: string } | null;
  /** यात्रा की स्थिति */
  yatra: (read: number) => {
    total: number;
    read: number;
    label: string;
    /** कल की इकाई का नाम + पहले चार शब्द */
    next: { label: string; teaser: string } | null;
    complete: boolean;
  };
  /** ख़ास दिन — हनुमान: मंगलवार/शनिवार, महादेव: सोमवार */
  specialWeekday: (date: Date) => string | null;
  /** कथा की स्थिति */
  katha: () => {
    published: number;
    written: number;
    total: number;
    held: { title: string; note: string };
    teaser: { title: string; note: string };
  };
  /** पूजा के बाद देवता क्या कहते हैं */
  afterPrayer: { title: string; note: string; nameRemembered: string };
  /** याद दिलाने का टेक्स्ट */
  reminder: (name: string) => string;
  /** घंटी और मंत्र की धुन — देवता के अनुसार */
  audio: { bellRoot: number; chantRoots: number[]; decay: number };
  /** कार्ड पर देवता का चित्र बनाना */
  draw: (ctx: CanvasRenderingContext2D, size: number, palette: { accent: string; soft: string }) => void;
  /** देवता के रंग — केवल पूजा-स्क्रीन पर */
  theme: { ritualFrom: string; ritualVia: string; ritualTo: string };
  /** भाषा जिसमें दिखना है — यह UI तय करता है, प्रकार सिर्फ़ सूचित करता है */
  __lang?: Lang;
};
