/**
 * रोज़ सुबह का संदेश:
 *   "🙏 [नाम], हनुमान जी का वार है — आज की पूजा 1 मिनट में पूरी करो"
 *
 * सच्चाई यह है कि ब्राउज़र बंद होने पर JS नहीं चलता, इसलिए यह तीन तरीकों से कोशिश करता है:
 *   1. App खुला हो तो setTimeout से समय पर दिखाता है
 *   2. App बंद होकर खुले तो "पछड़ा हुआ संदेश" भेज देता है (एक बार)
 *   3. Chrome समर्थन दे तो Periodic Background Sync (सबसे भरोसेमंद)
 * फिर भी, सबसे भरोसेमंद तरीका फ़ोन की अलार्म है — सेटिंग में यही बताया गया है।
 */

const MAX_TIMEOUT = 2_147_483_000;
const LAST_SHOWN_KEY = "bajrang.lastReminderShown";

export type ReminderOptions = {
  enabled: boolean;
  time: string;
  name: string;
  /** आज की पूजा हो चुकी है तो दोबारा याद नहीं दिलाना */
  doneToday: boolean;
};

export function reminderText(name: string): string {
  const who = name.trim();
  return `🙏 ${who ? `${who}, ` : ""}हनुमान जी का वार है — आज की पूजा 1 मिनट में पूरी करो`;
}

function parseTime(time: string): { h: number; m: number } {
  const [h, m] = time.split(":").map(Number);
  return { h: Number.isFinite(h) ? h : 6, m: Number.isFinite(m) ? m : 0 };
}

export function nextOccurrence(time: string, from: Date = new Date()): Date {
  const { h, m } = parseTime(time);
  const target = new Date(from);
  target.setHours(h, m, 0, 0);
  if (target <= from) target.setDate(target.getDate() + 1);
  return target;
}

function permission(): NotificationPermission | "unsupported" {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission;
}

/** Service worker से दिखाना बेहतर है — Android पर ज़्यादा भरोसेमंद */
async function show(title: string, body: string) {
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
  if (permission() === "unsupported") return false;
  if (Notification.permission === "granted") return true;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export async function sendTestReminder(name: string): Promise<boolean> {
  if (!(await requestPermission())) return false;
  return show("जय बजरंगबली 🙏", reminderText(name));
}

/** App बंद होकर खुलने पर: समय बीत चुका हो तो एक बार याद दिला दो */
async function sendCatchUp(options: ReminderOptions) {
  if (!options.enabled || options.doneToday) return;
  const now = new Date();
  const { h, m } = parseTime(options.time);
  if (now.getHours() * 60 + now.getMinutes() < h * 60 + m) return;

  const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  try {
    if (window.localStorage.getItem(LAST_SHOWN_KEY) === todayKey) return;
  } catch {
    /* storage blocked — फिर भी भेज देते हैं */
  }
  window.localStorage.setItem(LAST_SHOWN_KEY, todayKey);
  await show("जय बजरंगबली 🙏", reminderText(options.name));
}

/** Chrome हो तो background sync माँग लें (काम करे तो सबसे अच्छा) */
async function tryPeriodicSync() {
  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    const manager = registration as unknown as {
      periodicSync?: { register(tag: string, options: { minInterval: number }): Promise<void> };
    };
    if (!manager?.periodicSync) return;
    // हर 12 घंटे — सुबह 6 बजे तक पहुँच जाए
    await manager.periodicSync.register("bajrang-daily-reminder", {
      minInterval: 12 * 60 * 60 * 1000,
    });
  } catch {
    /* यह सुविधा नहीं है — कोई समस्या नहीं */
  }
}

export function scheduleReminder(options: ReminderOptions): () => void {
  const { enabled, time, name } = options;

  if (!enabled || permission() === "unsupported" || Notification.permission !== "granted") {
    return () => {};
  }

  void tryPeriodicSync();
  void sendCatchUp(options);

  const delay = nextOccurrence(time).getTime() - Date.now();
  if (delay <= 0 || delay > MAX_TIMEOUT) return () => {};

  const id = window.setTimeout(() => {
    void show("जय बजरंगबली 🙏", reminderText(name));
  }, delay);

  return () => window.clearTimeout(id);
}

/** सेटिंग में दिखाने के लिए: अगला संदेश कब आएगा */
export function formatNextReminder(time: string): string {
  const { h, m } = parseTime(time);
  const suffix = h < 12 ? "सुबह" : h < 17 ? "दोपहर" : h < 20 ? "शाम" : "रात";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${suffix}`;
}