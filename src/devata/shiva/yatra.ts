/**
 * महादेव की यात्रा — जब तक पंक्तियाँ नहीं आतीं, कुछ नहीं दिखेगा।
 *
 * हनुमान जी की यात्रा का ढाँचा यहाँ भी वही है ताकि दोनों देवता एक जैसे दिखें।
 */
import { SHIVA_VERSE_COUNT } from "./content";
import { t } from "../../lib/i18n";

export function shivaYatra(read: number) {
  const total = SHIVA_VERSE_COUNT;
  const done = Math.min(Math.max(0, Math.floor(read)), total);
  return {
    total,
    read: done,
    label: t("ज्योतिर्लिंग यात्रा"),
    // पंक्ति आने पर असली इशारा यहाँ आएगा
    next: null,
    complete: false,
  };
}
