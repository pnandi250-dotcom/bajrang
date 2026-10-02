/**
 * फ़ोन की सुविधाएँ — सब चुपचाप, कोशिश करने पर।
 * हर जगह इनका विकल्प भी है, इसलिए ये कभी स्क्रीन या बटन नहीं तोड़ते।
 */

export type WakeLockSentinelLike = {
  release(): Promise<void>;
  released: boolean;
  addEventListener(type: "release", listener: () => void): void;
};

type NavigatorWithWakeLock = Navigator & {
  wakeLock?: { request(type: "screen"): Promise<WakeLockSentinelLike> };
};

/** पूजा के 60 सेकंड तक स्क्रीन जली रखता है */
export async function requestWakeLock(): Promise<WakeLockSentinelLike | null> {
  try {
    const nav = navigator as NavigatorWithWakeLock;
    if (!nav.wakeLock || document.visibilityState !== "visible") return null;
    return await nav.wakeLock.request("screen");
  } catch {
    return null;
  }
}

/** हल्का कंपन — पूजा पूरी होने पर (न हो तो चुपचाप) */
export function haptic(pattern: number | number[] = 12) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* कुछ ब्राउज़र में नहीं है */
  }
}

export function supportsWakeLock(): boolean {
  return typeof navigator !== "undefined" && "wakeLock" in navigator;
}

/** iOS में अलग होता है */
export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}
