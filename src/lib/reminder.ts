/**
 * रोज़ सुबह का संदेश — अब भरोसेमंद।
 *
 * दो अलग-अलग दुनिया हैं, और दोनों को ठीक से चलाना ज़रूरी है:
 *
 * 1. Android ऐप (Capacitor) — `LocalNotifications.schedule()` Android के
 *    AlarmManager पर लगाता है। ऐप बंद हो, मारा जाए, फ़ोन रीस्टार्ट हो — फिर भी
 *    संदेश आएगा। यही असली भरोसेमंद रास्ता है।
 *
 * 2. वेब (PWA) — ब्राउज़र में JS बंद ऐप पर नहीं चलता, इसलिए यहाँ पूरी तरह भरोसा
 *    नहीं किया जा सकता। जो कर सकते हैं वो करते हैं: setTimeout, छूटा हुआ संदेश,
 *    और Periodic Background Sync। यह भी सेटिंग में साफ़ लिखा है।
 *
 * संदेश: 🙏 [नाम], हनुमान जी का वार है — आज की पूजा 1 मिनट में पूरी करो
 */

import { Capacitor } from "@capacitor/core";
import { t } from "./i18n";

export type ReminderMode = "native" | "web";

const MAX_TIMEOUT = 2_147_483_000;
const LAST_SHOWN_KEY = "bajrang.lastReminderShown";

/** Android पर संदेश की पहचान — समय बदलने पर पुराना हटाकर नया लगाते हैं */
const NATIVE_ID = 1001;

export type ReminderOptions = {
  enabled: boolean;
  time: string;
  name: string;
  /** आज की पूजा हो चुकी है तो दोबारा याद नहीं दिलाना */
  doneToday: boolean;
};

export function reminderText(name: string): string {
  const who = name.trim();
  return `🙏 ${who ? `${who}, ` : ""}${t("हनुमान जी का वार है — आज की पूजा 1 मिनट में पूरी करो")}`;
}

export function isNative(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

function parseTime(time: string): { h: number; m: number } {
  const [h, m] = time.split(":").map(Number);
  return {
    h: Number.isFinite(h) && h >= 0 && h <= 23 ? h : 6,
    m: Number.isFinite(m) && m >= 0 && m <= 59 ? m : 0,
  };
}

export function nextOccurrence(time: string, from: Date = new Date()): Date {
  const { h, m } = parseTime(time);
  const target = new Date(from);
  target.setHours(h, m, 0, 0);
  if (target <= from) target.setDate(target.getDate() + 1);
  return target;
}

/* ------------------------------------------------------------------ */
/* Android — वास्तविक नियमित संदेश                                       */
/* ------------------------------------------------------------------ */

/** क्या ऐप को संदेश दिखाने की इजाज़त मिली? (Android 13+ पर ज़रूरी) */
export async function nativePermission(): Promise<"granted" | "denied" | "prompt"> {
  if (!isNative()) return "denied";
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  const status = await LocalNotifications.checkPermissions();
  // "prompt-with-rationale" भी मतलब अभी अनुमति नहीं मिली
  return status.display === "granted"
    ? "granted"
    : status.display === "denied"
      ? "denied"
      : "prompt";
}

/**
 * रोज़ उसी समय संदेश लगा दो — repeats: true का मतलब AlarmManager खुद दोहराएगा,
 * ऐप बंद होने पर भी।
 */
export async function scheduleNativeReminder(options: ReminderOptions): Promise<boolean> {
  if (!isNative() || !options.enabled) return false;

  const { h, m } = parseTime(options.time);

  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");

    // पहले पुराना हटा दो, वरना समय बदलने पर दो संदेश चलने लगते हैं
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.some((n) => n.id === NATIVE_ID)) {
      await LocalNotifications.cancel({ notifications: [{ id: NATIVE_ID }] });
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: NATIVE_ID,
          title: t("जय बजरंगबली 🙏"),
          body: reminderText(options.name),
          schedule: { on: { hour: h, minute: m }, repeats: true },
          smallIcon: "ic_stat_icon",
          extra: { source: "bajrang" },
        },
      ],
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Android 12+ पर "exact alarm" की अनुमति अलग से माँगी जाती है।
 * नहीं मिली तो AlarmManager संदेश टाल सकता है — इसलिए जाँचकर पूछना ज़रूरी है।
 */
export async function exactAlarmState(): Promise<"granted" | "denied" | "unknown"> {
  if (!isNative()) return "unknown";
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const status = await LocalNotifications.checkExactNotificationSetting();
    return status.exact_alarm === "granted" ? "granted" : "denied";
  } catch {
    return "unknown";
  }
}

/** Android सेटिंग खोलकर exact alarm की अनुमति माँगो */
export async function openExactAlarmSettings(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const status = await LocalNotifications.changeExactNotificationSetting();
    return status.exact_alarm === "granted";
  } catch {
    return false;
  }
}

/** संदेश हटा दो (टाइम बदलते या बंद करते समय) */
export async function cancelNativeReminder(): Promise<void> {
  if (!isNative()) return;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.cancel({ notifications: [{ id: NATIVE_ID }] });
  } catch {
    /* पहले से नहीं है तो कुछ नहीं करना */
  }
}

/** क्या अभी संदेश सच में लगा है? (सेटिंग में दिखाने के लिए) */
export async function isNativeReminderScheduled(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const pending = await LocalNotifications.getPending();
    return pending.notifications.some((n) => n.id === NATIVE_ID);
  } catch {
    return false;
  }
}

export async function sendNativeTestNotification(name: string): Promise<boolean> {
  if (!isNative()) return false;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.schedule({
      notifications: [
        {
          id: NATIVE_ID + 1,
          title: t("जय बजरंगबली 🙏"),
          body: reminderText(name),
          schedule: { at: new Date(Date.now() + 3000) },
          smallIcon: "ic_stat_icon",
        },
      ],
    });
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* वेब — जो कर सकते हैं                                                */
/* ------------------------------------------------------------------ */

function webPermission(): NotificationPermission | "unsupported" {
  if (typeof Notification === "undefined") return "unsupported";
  if (!window.isSecureContext) return "unsupported";
  return Notification.permission;
}

async function showWebNotification(title: string, body: string) {
  const options: NotificationOptions = {
    body,
    tag: "bajrang-daily",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    lang: "hi",
  };

  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.showNotification(title, options);
        return true;
      }
    } catch {
      /* नीचे वाला तरीका आज़माएँ */
    }
  }

  try {
    new Notification(title, options);
    return true;
  } catch {
    return false;
  }
}

export async function requestPermission(): Promise<boolean> {
  if (isNative()) {
    const result = await nativePermission();
    if (result === "granted") return true;
    if (result === "prompt") {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const asked = await LocalNotifications.requestPermissions();
      return asked.display === "granted";
    }
    return false;
  }

  if (webPermission() === "unsupported") return false;
  if (Notification.permission === "granted") return true;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export async function sendTestReminder(name: string): Promise<boolean> {
  if (isNative()) return sendNativeTestNotification(name);
  if (!(await requestPermission())) return false;
  return showWebNotification(t("जय बजरंगबली 🙏"), reminderText(name));
}

/** ऐप बंद होकर खुलने पर: समय बीत चुका हो तो एक बार याद दिला दो (सिर्फ़ वेब) */
async function sendWebCatchUp(options: ReminderOptions) {
  if (!options.enabled || options.doneToday) return;
  const now = new Date();
  const { h, m } = parseTime(options.time);
  if (now.getHours() * 60 + now.getMinutes() < h * 60 + m) return;

  const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  try {
    if (window.localStorage.getItem(LAST_SHOWN_KEY) === todayKey) return;
  } catch {
    /* storage बंद है तो भी भेज देते हैं */
  }
  try {
    window.localStorage.setItem(LAST_SHOWN_KEY, todayKey);
  } catch {
    /* कुछ नहीं कर सकते */
  }
  await showWebNotification(t("जय बजरंगबली 🙏"), reminderText(options.name));
}

/** Chrome समर्थन दे तो background sync माँग लें */
async function tryPeriodicSync() {
  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    const manager = registration as unknown as {
      periodicSync?: { register(tag: string, options: { minInterval: number }): Promise<void> };
    };
    if (!manager?.periodicSync) return;
    await manager.periodicSync.register("bajrang-daily-reminder", {
      minInterval: 12 * 60 * 60 * 1000,
    });
  } catch {
    /* सुविधा नहीं है — कोई समस्या नहीं */
  }
}

/**
 * यह हर बार चलता है (समय/नाम बदलने पर)। Android पर असली AlarmManager सेट करता है,
 * वेब पर setTimeout + छूटा हुआ संदेश।
 */
export function scheduleReminder(options: ReminderOptions): () => void {
  if (isNative()) {
    if (options.enabled) {
      void requestPermission().then((granted) => {
        if (granted) void scheduleNativeReminder({ ...options, enabled: true });
      });
    } else {
      void cancelNativeReminder();
    }
    return () => {};
  }

  const { enabled, time, name } = options;
  if (!enabled || webPermission() === "unsupported" || Notification.permission !== "granted") {
    return () => {};
  }

  void tryPeriodicSync();
  void sendWebCatchUp(options);

  const delay = nextOccurrence(time).getTime() - Date.now();
  if (delay <= 0 || delay > MAX_TIMEOUT) return () => {};

  const id = window.setTimeout(() => {
    void showWebNotification(t("जय बजरंगबली 🙏"), reminderText(name));
  }, delay);

  return () => window.clearTimeout(id);
}

/** सेटिंग में दिखाने के लिए: अगला संदेश कब आएगा */
export function formatNextReminder(time: string): string {
  const { h, m } = parseTime(time);
  const suffix = t(h < 12 ? "सुबह" : h < 17 ? "दोपहर" : h < 20 ? "शाम" : "रात");
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${suffix}`;
}