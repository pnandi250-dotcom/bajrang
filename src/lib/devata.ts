/**
 * देवता — ऐप किसे पूजा है।
 *
 * ऐप "Bajrang" नाम से बना है, पर देवता बदला जा सकता है: हनुमान जी या महादेव।
 * इसलिए हर पूजा-सामग्री (पंक्ति, कथा, त्योहार, कार्ड, धुन) एक `Devata` के
 * नीचे रहती है, और उपयोगकर्ता का हर देवता का अपना हिसाब रहता है — दस दिन
 * हनुमान जी के साथ और बीस दिन महादेव के साथ, दोनों सुरक्षित।
 *
 * नियम: कोई भी पंक्ति या कथा जो "जाँच बाकी" है, वह स्क्रीन पर नहीं दिखती।
 * इसीलिए नीचे जोड़ने वाला कोई भी देवता बिना जाँच किए कुछ नहीं दिखा सकता।
 */

import type { DevataContent, DevataId } from "./devataTypes";

export type { DevataContent, DevataId };

import { hanumanDevata } from "../devata/hanuman/index";
import { shivaDevata } from "../devata/shiva/index";

export const DEVATA: Record<DevataId, DevataContent> = {
  hanuman: hanumanDevata,
  shiva: shivaDevata,
};

/** जो देवता चुना है उसकी सामग्री (न जाने पर हनुमान जी) */
export function devataOf(id: string | undefined): DevataContent {
  return DEVATA[(id as DevataId) in DEVATA ? (id as DevataId) : "hanuman"];
}

export { hanumanDevata, shivaDevata };

/**
 * अभी हनुमान जी की सामग्री सीधे भी उपलब्ध है (जाँच-स्क्रिप्ट इन्हीं आयातों से
 * पढ़ते हैं)। स्क्रीनें आगे `devataOf(...)` से पूछेंगी।
 */
export * from "../devata/hanuman/content";
export * from "../devata/hanuman/katha";
export * from "../devata/hanuman/festivals";
