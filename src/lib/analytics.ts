/**
 * माप — सिर्फ़ इसी फ़ोन में, कोई नेटवर्क नहीं।
 *
 * ऐप का वादा है: कोई सर्वर नहीं, कोई खाता नहीं, कोई ट्रैकिंग नहीं। इसलिए यहाँ
 * गिनती सिर्फ़ `localStorage` में जुड़ती है और "मेरा डेटा" स्क्रीन पर दिखती है।
 * उपयोगकर्ता चाहे तो सेटिंग्स के बैकअप बटन से यही JSON बाहर ले जा सकता है।
 *
 * क्यों नहीं भेजा जाता: धार्मिक ऐप में स्ट्रीक-आँकड़ा उपयोगकर्ता की निजी बात है,
 * और बिना उसकी मझम्मी (और बिना किसी सर्वर) इसे जमा करना ठीक नहीं होता।
 * D1/D7/D30 की जानकारी चाहिए तो यह स्क्रीन वह सवाल ख़ुद पूछ लेगी।
 */

export type LocalEvent =
  | "app_open"
  | "onboarding_started"
  | "ritual_started"
  | "ritual_completed"
  | "ritual_abandoned"
  | "share_card_created"
  | "reminder_enabled"
  | "katha_read"
  | "streak_broken"
  | "backup_created";

export type Summary = {
  name: LocalEvent;
  label: string;
  count: number;
  lastAt: string | null;
};

const KEY = "bajrang.metrics.v1";

type Stored = Partial<Record<LocalEvent, { count: number; lastAt: string }>>;

function read(): Stored {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Stored) : {};
  } catch {
    return {};
  }
}

/** एक घटना गिनो — कभी भी कहीं नहीं भेजी जाती */
export function track(event: LocalEvent): void {
  try {
    const data = read();
    const row = data[event] ?? { count: 0, lastAt: "" };
    data[event] = { count: row.count + 1, lastAt: new Date().toISOString() };
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage बंद है तो गिनना छूट जाए — ऐप चलता रहे */
  }
}

/** "मेरा डेटा" स्क्रीन के लिए — बढ़े हुए क्रम में */
export function summary(): Summary[] {
  const data = read();
  return (Object.entries(data) as [LocalEvent, { count: number; lastAt: string }][])
    .map(([name, row]) => ({
      name,
      label: LABELS[name] ?? name,
      count: row.count,
      lastAt: row.lastAt || null,
    }))
    .sort((a, b) => b.count - a.count);
}

/** सारा गिना-माप एक साथ — बैकअप में भी चला जाता है */
export function allMetrics(): Stored {
  return read();
}

/** सब माप मिटाओ (जब उपयोगकर्ता कहे) */
export function clearMetrics(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* कुछ नहीं कर सकते तो छोड़ दो */
  }
}

const LABELS: Record<LocalEvent, string> = {
  app_open: "ऐप खुला",
  onboarding_started: "परिचय शुरू",
  ritual_started: "पूजा शुरू",
  ritual_completed: "पूजा पूरी",
  ritual_abandoned: "पूजा बीच में छूटी",
  share_card_created: "कार्ड बनाया",
  reminder_enabled: "याद दिलाना चालू",
  katha_read: "कथा पढ़ी",
  streak_broken: "सिलसिला टूटा",
  backup_created: "बैकअप लिया",
};
