/**
 * बैकअप की परीक्षा — सबसे ज़रूरी बात: एक फ़ोल्ड टूटी फ़ाइल साधना नहीं बिगाड़ सकती।
 */
import { beforeEach, describe, expect, it } from "vitest";

import {
  BACKUP_VERSION,
  backupFilename,
  exportState,
  importState,
  lastBackupAt,
  markBackupDone,
} from "./backup";
import { getState, actions } from "./store";
import { STATE_KEY } from "./state";

beforeEach(() => {
  window.localStorage.clear();
});

function goodState(streak = 42) {
  return {
    version: 1,
    profile: {
      name: "सीता",
      sankalp: "परीक्षा",
      reminderTime: "05:30",
      reminderEnabled: true,
      chantingEnabled: false,
      onboarded: true,
      createdAt: "2026-01-01",
    },
    streak,
    bestStreak: 60,
    lastCompleted: "2026-10-04",
    totalCompleted: 60,
    completedDates: ["2026-10-03", "2026-10-04"],
    graceDays: 1,
    pausedUntil: null,
    pausedFrom: null,
    forgivenUntil: null,
    streakAtPause: 0,
    chalisaRead: 17,
    kathaRevealed: 4,
    kathaRead: 3,
  };
}

describe("निर्यात", () => {
  it("फ़ाइल का नाम तारीख़ के साथ आता है", () => {
    expect(backupFilename()).toMatch(/^bajrang-backup-\d{4}-\d{2}-\d{2}\.json$/);
  });

  it("स्ट्रीक, क्षमा और यात्रा सब अंदर होती है", () => {
    window.localStorage.setItem(STATE_KEY, JSON.stringify(goodState()));
    const { data } = exportState();
    const file = JSON.parse(data);
    expect(file.version).toBe(BACKUP_VERSION);
    expect(file.app).toBe("bajrang");
    expect(file.exportedAt).toBeTruthy();
    const saved = file.data[STATE_KEY];
    expect(saved.streak).toBe(42);
    expect(saved.graceDays).toBe(1);
    expect(saved.chalisaRead).toBe(17);
    expect(saved.kathaRevealed).toBe(4);
  });

  it("भाषा भी साथ जाती है", () => {
    window.localStorage.setItem(STATE_KEY, JSON.stringify(goodState()));
    window.localStorage.setItem("bajrang.lang.v1", "bn");
    const file = JSON.parse(exportState().data);
    expect(file.data["bajrang.lang.v1"]).toBe("bn");
  });

  it("आख़िरी बैकअप की तारीख़ याद रहती है", () => {
    expect(lastBackupAt()).toBeNull();
    markBackupDone();
    expect(lastBackupAt()).toBeTruthy();
  });
});

describe("आयात", () => {
  it("वही फ़ाइल वापस बैठाती है", () => {
    window.localStorage.setItem(STATE_KEY, JSON.stringify(goodState()));
    const { data } = exportState();

    window.localStorage.clear();
    actions.resetAll();
    expect(getState().streak).toBe(0);

    expect(importState(data).ok).toBe(true);
    const restored = getState();
    expect(restored.streak).toBe(42);
    expect(restored.graceDays).toBe(1);
    expect(restored.chalisaRead).toBe(17);
    expect(restored.kathaRevealed).toBe(4);
    expect(restored.profile.name).toBe("सीता");
  });

  it("अधूरी फ़ाइल साफ़ इरारे के साथ रुकती है", () => {
    const result = importState('{"version":1,"app":"bajrang","data":{"bajrang.state');
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("रुकी हुई फ़ाइल (बीच में कटी) पढ़ी नहीं जाती", () => {
    window.localStorage.setItem(STATE_KEY, JSON.stringify(goodState()));
    const { data } = exportState();
    const cut = data.slice(0, Math.floor(data.length / 2));
    expect(importState(cut).ok).toBe(false);
  });

  it("बेतरतीबार JSON रुकता है", () => {
    expect(importState("कुछ भी नहीं").ok).toBe(false);
    expect(importState("{}").ok).toBe(false);
    expect(importState("[]").ok).toBe(false);
  });

  it("दूसरे ऐप की फ़ाइल रुकती है", () => {
    const other = JSON.stringify({ version: 1, app: "some-other-app", data: {} });
    const result = importState(other);
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("नई/अजानी संस्करण की फ़ाइल रुकती है", () => {
    const future = JSON.stringify({ version: 99, app: "bajrang", data: { [STATE_KEY]: {} } });
    expect(importState(future).ok).toBe(false);
  });

  it("साधना के बिना खाली फ़ाइल रुकती है", () => {
    const empty = JSON.stringify({ version: 1, app: "bajrang", data: {} });
    expect(importState(empty).ok).toBe(false);
  });

  it("ख़राब आँकड़े आयात होते हैं तो साफ़ हो जाते हैं", () => {
    const hostile = JSON.stringify({
      version: 1,
      app: "bajrang",
      data: {
        [STATE_KEY]: {
          version: 1,
          profile: { name: 123, sankalp: null, reminderTime: "रात", onboarded: true },
          streak: -50,
          bestStreak: 99999,
          graceDays: Number.NaN,
          lastCompleted: "2026-13-45",
          completedDates: ["बुरा", "2026-10-04"],
          chalisaRead: 1e9,
          kathaRevealed: -5,
        },
      },
    });
    expect(importState(hostile).ok).toBe(true);
    const s = getState();
    expect(s.streak).toBe(0);
    expect(s.graceDays).toBe(0);
    expect(s.completedDates).toEqual(["2026-10-04"]);
    expect(s.chalisaRead).toBeLessThanOrEqual(43);
    expect(s.kathaRevealed).toBe(0);
    expect(s.profile.reminderTime).toBe("06:00");
  });

  it("रिजेक्ट होने पर पुरानी साधना बनी रहती है", () => {
    window.localStorage.setItem(STATE_KEY, JSON.stringify(goodState()));
    const before = getState().streak;
    importState("कच्चा टेक्स्ट");
    expect(getState().streak).toBe(before);
  });
});
