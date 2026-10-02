/**
 * पूजा की धुन — पूरी तरह Web Audio से बनाई गई, कोई audio file नहीं।
 * हर आवाज़ पहले user gesture के बाद ही चलनी चाहिए (browser policy)।
 *
 *  1. playTempleBell() — पूजा पूरी होने पर एक कोमल घंटी
 *  2. startChanting()  — पूजा के दौरान बहुत हल्का "ॐ" drone, धीरे-धीरे
 *  3. playChime()      — बैज मिलने पर हल्की सी धुन
 */

let context: AudioContext | null = null;
let chanting: ChantNodes | null = null;

type ChantNodes = {
  gain: GainNode;
  voices: OscillatorNode[];
  lfo: OscillatorNode;
};

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  context ??= new Ctor();
  if (context.state === "suspended") void context.resume();
  return context;
}

function partial(
  ctx: AudioContext,
  frequency: number,
  gainValue: number,
  start: number,
  duration: number,
  type: OscillatorType = "sine",
) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, gainValue), start + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.1);
}

/** पूजा पूरी होने पर — नरम, प्यार भरी घंटी (पुरानी version से धीमी और मद्धम) */
export function playTempleBell() {
  const ctx = getContext();
  if (!ctx) return;

  const now = ctx.currentTime + 0.06;
  // मूल स्वर + हल्के overtone — घंटी की गूँज, पर धीमी
  partial(ctx, 523.25, 0.15, now, 2.8); // C5 — मुख्य
  partial(ctx, 784.0, 0.055, now, 2.1); // G5
  partial(ctx, 1046.5, 0.04, now, 1.5); // C5 ×2
  partial(ctx, 261.63, 0.09, now + 0.5, 3.6); // C4 — गूँज
}

/** बैज या पूजा पूरी होने पर — दो हल्के नोट्स */
export function playChime() {
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime + 0.02;
  partial(ctx, 783.99, 0.1, now, 1.0);
  partial(ctx, 1046.5, 0.085, now + 0.16, 1.2);
}

/**
 * बहुत हल्का "ॐ" drone — 60 सेकंड के लिए।
 * तीन हार्मोनिक + 0.18Hz का धीमा तरंग, इसलिए साँस जैसा लगता है, गाना नहीं।
 */
export function startChanting() {
  const ctx = getContext();
  if (!ctx || chanting) return;

  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, ctx.currentTime);
  master.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 2.5);
  master.connect(ctx.destination);

  // धीमी तरंग (साँस जैसा उठना-गिरना)
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 0.18;
  lfoGain.gain.value = 0.022;
  lfo.connect(lfoGain).connect(master.gain);
  lfo.start();

  const voices: OscillatorNode[] = [];
  // ॐ का सुर — C3, G3, C4 (बहुत धीमा, बहुत हल्का)
  for (const [frequency, level] of [
    [130.81, 1],
    [196.0, 0.5],
    [261.63, 0.28],
  ] as const) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    gain.gain.value = level;
    osc.connect(gain).connect(master);
    osc.start();
    voices.push(osc);
  }

  chanting = { gain: master, voices, lfo };
}

export function stopChanting() {
  const ctx = getContext();
  if (!ctx || !chanting) return;

  const { gain, voices, lfo } = chanting;
  chanting = null;

  const now = ctx.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(Math.max(0.0002, gain.gain.value), now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

  window.setTimeout(() => {
    for (const voice of voices) voice.stop();
    lfo.stop();
    gain.disconnect();
  }, 1400);
}

export function isChanting(): boolean {
  return chanting !== null;
}

/** उपयोगकर्ता के पहले टैप पर audio context खोलना (ताकि बाद में आवाज़ आ सके) */
export function unlockAudio() {
  getContext();
}