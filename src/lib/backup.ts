/**
 * बैकअप — स्ट्रीक और साधना की पूरी हिस्सेदारी, एक फ़ाइल में।
 *
 * ऐप में कोई सर्वर नहीं, कोई खाता नहीं। सब कुछ `localStorage` में है — और वह
 * फ़ोन मिटाने पर, ब्राउज़र का डेटा साफ़ करने पर, या ऐप हटाने पर चला जाता है।
 * यह फ़ाइल उपयोगकर्ता को ख़ुद की साधना का एक कॉपी रखने देती है।
 *
 * यहाँ कोई नया सर्वर नहीं जोड़ा गया — बैकअप भी उतनी ही ऑफ़लाइन है जितना ऐप।
 */

import { sanitize, STATE_KEY } from "./state";
import { reloadFromStorage } from "./store";
import { allMetrics } from "./analytics";

export const BACKUP_VERSION = 1;
export const BACKUP_STAMP_KEY = "bajrang.lastBackup";

/** बैकअप में गिनती ले जाने के लिए कुंजी */
export const BACKUP_METRICS_KEY = "bajrang.metrics.v1";

/** जिन कुंजियों की हिस्सेदारी बैकअप में जाती है */
const KEYS = [STATE_KEY, "bajrang.lang.v1", "bajrang.reminderNudge"] as const;

export type BackupFile = {
  version: number;
  exportedAt: string;
  app: "bajrang";
  data: Record<string, unknown>;
};

function readKey(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function todayStamp(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** आज की तारीख़ वाली फ़ाइल — `bajrang-backup-2026-10-05.json` */
export function backupFilename(): string {
  return `bajrang-backup-${todayStamp()}.json`;
}

/** सारी हिस्सेदारी एक JSON पंक्ति में तैयार करो */
export function exportState(): { data: string; filename: string } {
  const data: Record<string, unknown> = {};
  for (const key of KEYS) {
    const raw = readKey(key);
    if (raw === null) continue;
    try {
      data[key] = JSON.parse(raw);
    } catch {
      data[key] = raw;
    }
  }

  // गिनती भी साथ — यह भी इसी फ़ोन की चीज़ है, उपयोगकर्ता चाहे तो ले जाए
  const metrics = allMetrics();
  if (Object.keys(metrics).length > 0) data[BACKUP_METRICS_KEY] = metrics;

  const file: BackupFile = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    app: "bajrang",
    data,
  };
  return { data: JSON.stringify(file, null, 2), filename: backupFilename() };
}

export type ImportResult = { ok: boolean; error?: string };

/**
 * बैकअप फ़ाइल पढ़कर हिस्सेदारी वापस बैठाओ।
 *
 * पहले `sanitize()` से गुज़रती है — यानी बाहर से आई हुई फ़ाइल सीधे
 * `localStorage` में नहीं लिखी जाती। ख़राब फ़ाइल, पुराना संस्करण, या दूसरे
 * ऐप की फ़ाइल — तीनों ही साफ़ इरारे के साथ रुक जाती है।
 */
export function importState(json: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: "यह फ़ाइल पढ़ी नहीं जा सकी — शायद यह अधूरी है।" };
  }

  if (typeof parsed !== "object" || parsed === null) {
    return { ok: false, error: "यह बैकअप फ़ाइल नहीं लगती।" };
  }

  const file = parsed as Partial<BackupFile>;
  if (file.app !== "bajrang") {
    return { ok: false, error: "यह किसी और ऐप की फ़ाइल लगती है।" };
  }
  if (typeof file.version !== "number" || file.version > BACKUP_VERSION) {
    return { ok: false, error: "यह फ़ाइल नई है या पुरानी — अभी इसे नहीं खोला जा सकता।" };
  }
  if (typeof file.data !== "object" || file.data === null) {
    return { ok: false, error: "फ़ाइल में साधना का कोई आँकड़ा नहीं मिला।" };
  }

  const raw = file.data[STATE_KEY];
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, error: "फ़ाइल में स्ट्रीक का आँकड़ा नहीं मिला।" };
  }

  const clean = sanitize(raw as Record<string, unknown>);

  try {
    window.localStorage.setItem(STATE_KEY, JSON.stringify(clean));
    for (const key of KEYS) {
      if (key === STATE_KEY) continue;
      const value = file.data[key];
      if (typeof value === "string") window.localStorage.setItem(key, value);
      else if (value !== undefined) window.localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    return { ok: false, error: "फ़ोन में जगह नहीं है — पहले कुछ हटाइए, फिर कोशिश करें।" };
  }

  // स्टोर को तुरंत बताएँ — पूरा पेज रीलोड करने की ज़रूरत नहीं
  reloadFromStorage();

  return { ok: true };
}

/** आख़िरी बैकअप कब लिया गया — 0 यानी कभी नहीं */
export function lastBackupAt(): string | null {
  try {
    return window.localStorage.getItem(BACKUP_STAMP_KEY);
  } catch {
    return null;
  }
}

export function markBackupDone(): void {
  try {
    window.localStorage.setItem(BACKUP_STAMP_KEY, new Date().toISOString());
  } catch {
    /* storage बंद है तो याद रखना संभव नहीं — बाक़ी ऐप चलता रहे */
  }
}
