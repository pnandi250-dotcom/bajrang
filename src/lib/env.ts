/**
 * फ़ोन/ब्राउज़र क्या-क्या कर सकता है, यह साफ़ पता करना।
 *
 * ज़रूरी बात: service worker, notification, wake lock और Web Share — ये सब
 * सुरक्षित संदर्भ (HTTPS, या localhost) में ही काम करते हैं। यानी अगर ऐप किसी
 * LAN address पर http:// से खुला हो (जैसे http://192.168.1.5:5173), तो ये सब
 * चुपचाप नहीं होते। उपयोगकर्ता को "कुछ नहीं हुआ" महसूस नहीं होना चाहिए,
 * इसलिए हम जाँचकर साफ़ बता देते हैं।
 */

export type Capabilities = {
  /** HTTPS या localhost */
  secure: boolean;
  serviceWorker: boolean;
  notificationsSupported: boolean;
  notificationsGranted: boolean;
  wakeLock: boolean;
  webShare: boolean;
  /** Web Share Level 2 — तस्वीर के साथ साझा करना */
  shareFiles: boolean;
  vibrate: boolean;
};

type NavigatorWithWakeLock = Navigator & { wakeLock?: unknown };

export function capabilities(): Capabilities {
  if (typeof window === "undefined") {
    return {
      secure: false,
      serviceWorker: false,
      notificationsSupported: false,
      notificationsGranted: false,
      wakeLock: false,
      webShare: false,
      shareFiles: false,
      vibrate: false,
    };
  }

  const secure = window.isSecureContext === true;
  const nav = navigator as NavigatorWithWakeLock;

  return {
    secure,
    serviceWorker: secure && "serviceWorker" in nav,
    notificationsSupported: secure && "Notification" in window,
    notificationsGranted: secure && "Notification" in window && Notification.permission === "granted",
    wakeLock: secure && "wakeLock" in nav,
    webShare: typeof nav.share === "function",
    shareFiles: typeof nav.canShare === "function",
    vibrate: typeof nav.vibrate === "function",
  };
}

/**
 * सुरक्षित संदर्भ नहीं है तो यह बात साफ़ बताओ — वरना उपयोगकर्ता
 * "संदेश आया ही नहीं" कहकर निकल जाता है।
 */
export function insecureReason(): string | null {
  if (capabilities().secure) return null;
  return "यह ऐप अभी सुरक्षित कनेक्शन (https) पर नहीं चल रहा है।";
}