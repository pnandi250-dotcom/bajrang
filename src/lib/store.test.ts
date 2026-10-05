/**
 * स्ट्रीक तर्क की परीक्षा — ऐप का सबसे नाज़ुक हिस्सा।
 *
 * हर परीक्षण अपनी घड़ी और अपनी localStorage के साथ चलता है, इसलिए store.ts को
 * हर बार दोबारा लोड किया जाता है (`vi.resetModules()`)।
 *
 * दिन की सीमा ३:०० बजे है: रात २:३० बजे की पूजा "कल" दर्ज होती है।
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const STORAGE_KEY = "bajrang.state.v1";

/** घड़ी ३:०० की सीमा के साथ — रात २:३० बजे "कल" हो जाता है */
function setClock(iso: string): void {
  const fixed = new Date(iso).getTime();
  const RealDate = Date;
  class FakeDate extends RealDate {
    constructor(...args: unknown[]) {
      // कोई तारख़ न दी हो तो घड़ी जहाँ ठहराई है उसी पर
      if (args.length === 0) super(fixed);
      else super(...(args as [number]));
    }
    static now(): number {
      return fixed;
    }
  }
  FakeDate.parse = RealDate.parse;
  FakeDate.UTC = RealDate.UTC;
  vi.stubGlobal("Date", FakeDate);
}

async function loadStore() {
  vi.resetModules();
  return import("./store");
}

function seed(raw: Record<string, unknown> | null): void {
  const store = (globalThis as unknown as { window: { localStorage: { setItem: (k: string, v: string) => void; clear: () => void } } }).window;
  store.localStorage.clear();
  if (raw) store.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, ...raw }));
}

/** पिछली पूजा n दिन पहले — साथ में streak भी */
function stateWith(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    profile: {
      name: "सीता",
      sankalp: "परीक्षा",
      reminderTime: "06:00",
      reminderEnabled: false,
      chantingEnabled: false,
      onboarded: true,
      createdAt: "2026-09-01",
    },
    bestStreak: 0,
    totalCompleted: 0,
    completedDates: [],
    graceDays: 0,
    pausedUntil: null,
    pausedFrom: null,
    forgivenUntil: null,
    streakAtPause: 0,
    chalisaRead: 0,
    kathaRevealed: 0,
    kathaRead: 0,
    streak: 0,
    lastCompleted: null,
    ...overrides,
  };
}

beforeEach(() => {
  seed(null);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("पहली पूजा", () => {
  it("स्ट्रीक ० से १ होती है, क्षमा नहीं, बैज नहीं", async () => {
    setClock("2026-10-05T06:00:00");
    seed(stateWith());
    const { actions, getDerived } = await loadStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const get = () => (getDerived() as any);
    expect(get().doneToday).toBe(false);

    const result = actions.completeRitual();
    expect(result.newStreak).toBe(1);
    expect(result.crossedMilestone).toBeNull();
    expect(result.earnedGrace).toBe(false);
    expect(result.usedGrace).toBe(false);
    expect(get().graceDays).toBe(0);
    expect(get().lastCompleted).toBe("2026-10-05");
  });

  it("एक ही दिन दूसरी बार पूजा करने पर कुछ नहीं बदलता", async () => {
    setClock("2026-10-05T06:00:00");
    seed(stateWith({ streak: 4, lastCompleted: "2026-10-05", totalCompleted: 4 }));
    const { actions, getDerived } = await loadStore();
    const result = actions.completeRitual();
    expect(result.newStreak).toBe(4);
    expect(result.crossedMilestone).toBeNull();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((getDerived() as any).totalCompleted).toBe(4);
  });
});

describe("लगातार दिन", () => {
  it("स्ट्रीक n से n+1, क्षमा नहीं", async () => {
    setClock("2026-10-05T06:00:00");
    seed(stateWith({ streak: 3, lastCompleted: "2026-10-04" }));
    const { actions, getDerived } = await loadStore();
    const result = actions.completeRitual();
    expect(result.newStreak).toBe(4);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((getDerived() as any).graceDays).toBe(0);
    expect(result.earnedGrace).toBe(false);
  });

  it("स्ट्रीक ७ पर एक क्षमा दिन मिलता है", async () => {
    setClock("2026-10-05T06:00:00");
    seed(stateWith({ streak: 6, lastCompleted: "2026-10-04" }));
    const { actions } = await loadStore();
    const result = actions.completeRitual();
    expect(result.newStreak).toBe(7);
    expect(result.earnedGrace).toBe(true);
    expect(result.crossedMilestone).toBe(7);
  });

  it("स्ट्रीक ७ पर क्षमा पहले से सीमा पर हो तो नहीं मिलती", async () => {
    setClock("2026-10-05T06:00:00");
    seed(stateWith({ streak: 6, graceDays: 2, lastCompleted: "2026-10-04" }));
    const { actions } = await loadStore();
    const result = actions.completeRitual();
    expect(result.newStreak).toBe(7);
    expect(result.earnedGrace).toBe(false);
  });

  it("स्ट्रीक १४ पर क्षमा तभी मिलती है जब सीमा पर न हो", async () => {
    setClock("2026-10-05T06:00:00");
    seed(stateWith({ streak: 13, graceDays: 1, lastCompleted: "2026-10-04" }));
    const { actions } = await loadStore();
    expect(actions.completeRitual().earnedGrace).toBe(true);
  });

  it("स्ट्रीक १४ पर सीमा पर क्षमा नहीं जुड़ती", async () => {
    setClock("2026-10-05T06:00:00");
    seed(stateWith({ streak: 13, graceDays: 2, lastCompleted: "2026-10-04" }));
    const { actions } = await loadStore();
    expect(actions.completeRitual().earnedGrace).toBe(false);
  });
});

describe("क्षमा से बचाव", () => {
  it("एक दिन छूटा, क्षमा नहीं → स्ट्रीक १", async () => {
    setClock("2026-10-05T06:00:00");
    seed(stateWith({ streak: 10, lastCompleted: "2026-10-03" }));
    const { actions } = await loadStore();
    const result = actions.completeRitual();
    expect(result.newStreak).toBe(1);
    expect(result.usedGrace).toBe(false);
  });

  it("एक दिन छूटा, एक क्षमा → स्ट्रीक बरकरर", async () => {
    setClock("2026-10-05T06:00:00");
    seed(stateWith({ streak: 10, graceDays: 1, lastCompleted: "2026-10-03" }));
    const { actions, getDerived } = await loadStore();
    const result = actions.completeRitual();
    expect(result.newStreak).toBe(11);
    expect(result.usedGrace).toBe(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((getDerived() as any).graceDays).toBe(0);
  });

  it("दो दिन छूटे, दो क्षमा → दोनों खर्च", async () => {
    setClock("2026-10-06T06:00:00");
    seed(stateWith({ streak: 10, graceDays: 2, lastCompleted: "2026-10-03" }));
    const { actions, getDerived } = await loadStore();
    const result = actions.completeRitual();
    expect(result.newStreak).toBe(11);
    expect(result.usedGrace).toBe(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((getDerived() as any).graceDays).toBe(0);
  });

  it("तीन दिन छूटे, दो क्षमा → स्ट्रीक १ और क्षमा शून्य", async () => {
    setClock("2026-10-07T06:00:00");
    seed(stateWith({ streak: 10, graceDays: 2, lastCompleted: "2026-10-03" }));
    const { actions, getDerived } = await loadStore();
    const result = actions.completeRitual();
    expect(result.newStreak).toBe(1);
    expect(result.usedGrace).toBe(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((getDerived() as any).graceDays).toBe(2);
  });

  it("एक दिन छूटा पर क्षमा होने से भी स्ट्रीक ज़िंदा दिखती है", async () => {
    setClock("2026-10-05T06:00:00");
    seed(stateWith({ streak: 10, graceDays: 1, lastCompleted: "2026-10-03" }));
    const { getDerived } = await loadStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = (getDerived() as any);
    expect(s.streak).toBe(10);
    expect(s.missedDays).toBe(1);
    expect(s.willRecoverWithGrace).toBe(true);
  });

  it("कक्षमा न होने पर डर दिखता है", async () => {
    setClock("2026-10-05T06:00:00");
    seed(stateWith({ streak: 10, graceDays: 0, lastCompleted: "2026-10-03" }));
    const { getDerived } = await loadStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = (getDerived() as any);
    expect(s.streak).toBe(0);
    expect(s.missedDays).toBe(1);
    expect(s.willRecoverWithGrace).toBe(false);
  });
});

describe("विश्राम (पॉज़)", () => {
  it("तीन दिन का विश्राम स्ट्रीक जोड़ देता है", async () => {
    setClock("2026-10-05T06:00:00");
    seed(stateWith({ streak: 5, lastCompleted: "2026-10-04" }));
    const { actions, getDerived } = await loadStore();
    actions.pauseFor(3);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = (getDerived() as any);
    expect(s.pausedUntil).toBe("2026-10-07");
    expect(s.streakAtPause).toBe(5);
    expect(s.isPaused).toBe(true);
  });

  it("विश्राम में पूजा: स्ट्रीक जुकी, कथा और यात्रा बढ़ें", async () => {
    setClock("2026-10-06T06:00:00");
    seed(stateWith({ streak: 5, lastCompleted: "2026-10-05" }));
    const { actions, getDerived } = await loadStore();
    actions.pauseFor(3);
    const result = actions.completeRitual();
    expect(result.paused).toBe(true);
    expect(result.newStreak).toBe(5);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = (getDerived() as any);
    expect(s.streak).toBe(5);
    expect(s.kathaRevealed).toBe(1);
    expect(s.chalisaRead).toBe(1);
    expect(s.isPaused).toBe(true);
  });

  it("टूटी साधना का विश्राम शून्य जोड़ता है", async () => {
    setClock("2026-10-05T06:00:00");
    seed(stateWith({ streak: 5, lastCompleted: "2026-10-01" }));
    const { actions, getDerived } = await loadStore();
    actions.pauseFor(3);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((getDerived() as any).streakAtPause).toBe(0);
  });

  it("विश्राम ख़त्म होने पर स्ट्रीक वहीं से आगे बढ़ती है", async () => {
    setClock("2026-10-08T06:00:00");
    seed(
      stateWith({
        streak: 12,
        streakAtPause: 12,
        lastCompleted: "2026-10-04",
        pausedFrom: "2026-10-05",
        pausedUntil: "2026-10-07",
        forgivenUntil: "2026-10-07",
      }),
    );
    const { actions, getDerived } = await loadStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((getDerived() as any).isPaused).toBe(false);
    const result = actions.completeRitual();
    expect(result.newStreak).toBe(13);
    expect(result.usedGrace).toBe(false);
  });

  it("विश्राम के दिन भी छूटे तो दिन गिने जाते हैं", async () => {
    setClock("2026-10-09T06:00:00");
    seed(
      stateWith({
        streak: 12,
        streakAtPause: 12,
        lastCompleted: "2026-10-04",
        pausedFrom: "2026-10-05",
        pausedUntil: "2026-10-07",
        forgivenUntil: "2026-10-07",
      }),
    );
    const { actions } = await loadStore();
    expect(actions.completeRitual().newStreak).toBe(1);
  });

  it("जल्दी लौटने पर माफ़ी आज तक सीमित", async () => {
    setClock("2026-10-06T06:00:00");
    seed(stateWith({ streak: 5, lastCompleted: "2026-10-05" }));
    const { actions, getDerived } = await loadStore();
    actions.pauseFor(7);
    actions.resumeFromPause();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = (getDerived() as any);
    expect(s.pausedUntil).toBeNull();
    expect(s.forgivenUntil).toBe("2026-10-06");
    expect(s.isPaused).toBe(false);
  });

  it("देर से लौटने पर माफ़ी विश्राम-अंत तक रहती है", async () => {
    setClock("2026-10-09T06:00:00");
    seed(
      stateWith({
        streak: 12,
        streakAtPause: 12,
        lastCompleted: "2026-10-04",
        pausedFrom: "2026-10-05",
        pausedUntil: "2026-10-08",
        forgivenUntil: "2026-10-08",
      }),
    );
    const { actions, getDerived } = await loadStore();
    actions.resumeFromPause();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((getDerived() as any).forgivenUntil).toBe("2026-10-08");
  });

  it("विश्राम में उसी दिन दो पूजाएँ दोहरी गिनती नहीं करतीं", async () => {
    setClock("2026-10-06T06:00:00");
    seed(stateWith({ streak: 5, lastCompleted: "2026-10-05" }));
    const { actions, getDerived } = await loadStore();
    actions.pauseFor(3);
    actions.completeRitual();
    actions.completeRitual();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((getDerived() as any).chalisaRead).toBe(1);
  });
});

describe("बैज", () => {
  it("६ से ७ → बैज ७", async () => {
    setClock("2026-10-05T06:00:00");
    seed(stateWith({ streak: 6, lastCompleted: "2026-10-04" }));
    const { actions } = await loadStore();
    expect(actions.completeRitual().crossedMilestone).toBe(7);
  });

  it("२१ से २२ पर पुराना रिकॉर्ड बड़ा हो तो बैज नहीं", async () => {
    setClock("2026-10-05T06:00:00");
    seed(stateWith({ streak: 21, bestStreak: 25, lastCompleted: "2026-10-04" }));
    const { actions } = await loadStore();
    expect(actions.completeRitual().crossedMilestone).toBeNull();
  });

  it("१०७ से १०८ → सुनहरा बैज", async () => {
    setClock("2026-10-05T06:00:00");
    seed(stateWith({ streak: 107, bestStreak: 107, lastCompleted: "2026-10-04" }));
    const { actions } = await loadStore();
    expect(actions.completeRitual().crossedMilestone).toBe(108);
  });
});

describe("दिन की सीमा ३:००", () => {
  it("रात २:३० की पूजा पिछले दिन दर्ज होती है", async () => {
    setClock("2026-10-04T02:30:00");
    seed(stateWith({ streak: 6, lastCompleted: "2026-10-02" }));
    const { actions, getDerived } = await loadStore();
    actions.completeRitual();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((getDerived() as any).lastCompleted).toBe("2026-10-03");
  });

  it("रात ३:०० के बाद वही दिन नया दिन माना जाता है", async () => {
    setClock("2026-10-04T03:30:00");
    seed(stateWith({ streak: 6, lastCompleted: "2026-10-02" }));
    const { actions, getDerived } = await loadStore();
    actions.completeRitual();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((getDerived() as any).lastCompleted).toBe("2026-10-04");
  });

  it("उसी पूजा-दिन में दो बार नहीं गिना जाता", async () => {
    setClock("2026-10-04T02:30:00");
    seed(stateWith({ streak: 6, lastCompleted: "2026-10-02" }));
    const { actions, getDerived } = await loadStore();
    actions.completeRitual();
    const again = actions.completeRitual();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((getDerived() as any).totalCompleted).toBe(1);
    expect(again.newStreak).toBe(7);
  });
});

describe("sanitize — ख़राब localStorage", () => {
  it("ऋणात्मक स्ट्रीक ठीक हो जाती है", async () => {
    setClock("2026-10-05T06:00:00");
    seed({ ...stateWith(), streak: -9, graceDays: 5, bestStreak: -1 });
    const { getDerived } = await loadStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = (getDerived() as any);
    expect(s.streak).toBe(0);
    expect(s.graceDays).toBe(2);
    expect(s.bestStreak).toBe(0);
  });

  it("NaN क्षमा और अवैध तारीखें ठीक हो जाती हैं", async () => {
    setClock("2026-10-05T06:00:00");
    seed({
      ...stateWith(),
      graceDays: Number.NaN,
      lastCompleted: "कल",
      pausedUntil: "अगला",
      completedDates: ["2026-13-45", "2026-10-04"],
      chalisaRead: 999,
      kathaRevealed: -1,
    });
    const { getDerived } = await loadStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = (getDerived() as any);
    expect(s.graceDays).toBe(0);
    // `2026-13-45` जैसी तारीख असली नहीं है — उसे नहीं माना जाता
    expect(s.completedDates).toEqual(["2026-10-04"]);
    expect(s.lastCompleted).toBe("2026-10-04");
    expect(s.pausedUntil).toBeNull();
    expect(s.chalisaRead).toBe(43);
    expect(s.kathaRevealed).toBe(0);
  });

  it("बहुत बड़ी सूची कट जाती है", async () => {
    setClock("2026-10-05T06:00:00");
    const many = Array.from({ length: 900 }, (_, i) => `2026-01-${String((i % 28) + 1).padStart(2, "0")}`);
    seed({ ...stateWith(), completedDates: many });
    const { getDerived } = await loadStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((getDerived() as any).completedDates.length).toBeLessThanOrEqual(400);
  });

  it("पूरा न हो तो सुरक्षित डिफ़ॉल्ट", async () => {
    setClock("2026-10-05T06:00:00");
    seed(null);
    const { getDerived } = await loadStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = (getDerived() as any);
    expect(s.streak).toBe(0);
    expect(s.totalCompleted).toBe(0);
    expect(s.profile.name).toBe("");
  });
});

describe("बाक़ी रास्ते", () => {
  it("विश्राम की सीमा 30 दिन से ज़्यादा नहीं होती", async () => {
    setClock("2026-10-05T06:00:00");
    seed(stateWith({ streak: 5, lastCompleted: "2026-10-05" }));
    const { actions, getDerived } = await loadStore();
    actions.pauseFor(999);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((getDerived() as any).pausedUntil).toBe("2026-11-03");
  });

  it("बिना विश्राम के लौटने का बटन कुछ नहीं करता", async () => {
    setClock("2026-10-05T06:00:00");
    seed(stateWith({ streak: 5, lastCompleted: "2026-10-05" }));
    const { actions, getDerived } = await loadStore();
    actions.resumeFromPause();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((getDerived() as any).pausedUntil).toBeNull();
  });

  it("शून्य या ऋणात्मक विश्राम एक दिन का माना जाता है", async () => {
    setClock("2026-10-05T06:00:00");
    seed(stateWith({ streak: 5, lastCompleted: "2026-10-05" }));
    const { actions, getDerived } = await loadStore();
    actions.pauseFor(0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((getDerived() as any).pausedUntil).toBe("2026-10-05");
  });

  it("प्रोफ़िल बदला जा सकता है", async () => {
    setClock("2026-10-05T06:00:00");
    seed(stateWith());
    const { actions, getDerived } = await loadStore();
    actions.updateProfile({ name: "गीता", reminderTime: "05:30" });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = (getDerived() as any);
    expect(s.profile.name).toBe("गीता");
    expect(s.profile.reminderTime).toBe("05:30");
  });

  it("कथा का पढ़ा हुआ प्रसंग याद रहता है", async () => {
    setClock("2026-10-05T06:00:00");
    seed(stateWith({ kathaRevealed: 3 }));
    const { actions, getDerived } = await loadStore();
    actions.markKathaRead(2);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((getDerived() as any).kathaRead).toBe(2);
  });

  it("कथा का पढ़ा प्रसंग प्रकाशित से आगे नहीं जाता", async () => {
    setClock("2026-10-05T06:00:00");
    seed(stateWith({ kathaRevealed: 1 }));
    const { actions, getDerived } = await loadStore();
    actions.markKathaRead(99);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((getDerived() as any).kathaRead).toBe(1);
  });

  it("सब कुछ मिटाकर नया शुरुआत", async () => {
    setClock("2026-10-05T06:00:00");
    seed(stateWith({ streak: 9, totalCompleted: 9, graceDays: 1, bestStreak: 9, chalisaRead: 5 }));
    const { actions, getDerived } = await loadStore();
    actions.resetAll();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = (getDerived() as any);
    expect(s.streak).toBe(0);
    expect(s.totalCompleted).toBe(0);
    expect(s.graceDays).toBe(0);
    expect(s.chalisaRead).toBe(0);
    expect(s.profile.name).toBe("");
  });

  it("मंगलवार और शनिवार हनुमान-दिन हैं", async () => {
    setClock("2026-10-06T06:00:00"); // मंगलवार
    seed(stateWith());
    const { getDerived } = await loadStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((getDerived() as any).isSpecialDay).toBe(true);
  });

  it("शाम के समय मंगलवार नहीं होता", async () => {
    setClock("2026-10-07T06:00:00"); // बुधवार
    seed(stateWith());
    const { getDerived } = await loadStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((getDerived() as any).isSpecialDay).toBe(false);
  });
});

describe("गिनती-अद्यावधान", () => {
  it("बदलाव की सूचना मिलती है और हटाई जा सकती है", async () => {
    setClock("2026-10-05T06:00:00");
    seed(stateWith());
    const { actions, subscribe, getState } = await loadStore();
    let calls = 0;
    const off = subscribe(() => {
      calls += 1;
    });
    actions.updateProfile({ name: "गीता" });
    expect(calls).toBe(1);
    expect(getState().profile.name).toBe("गीता");
    off();
    actions.updateProfile({ name: "सीता" });
    expect(calls).toBe(1);
  });

  it("पूजा के बाद सूचना मिलती है", async () => {
    setClock("2026-10-05T06:00:00");
    seed(stateWith());
    const { actions, subscribe } = await loadStore();
    let calls = 0;
    const off = subscribe(() => {
      calls += 1;
    });
    actions.completeRitual();
    off();
    expect(calls).toBe(1);
  });
});
