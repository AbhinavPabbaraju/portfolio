"use client";

/* ════════════════════════════════════════════════════════════
   One AudioContext, one mute preference, for the whole page.

   Everything that makes a sound here is synthesised. Nothing is fetched:
   a UI tick is a few dozen bytes of maths, where a set of sample files is
   a handful of requests on the critical path of a page whose entire point
   is that it scrolls smoothly.

   The context is shared rather than one-per-component for two reasons.
   Browsers cap how many you may open, and autoplay policy has to be
   unlocked exactly once — with a context each, the rain bed and the
   carousel would each wait for their own first gesture.
   ════════════════════════════════════════════════════════════ */

const STORE_KEY = "site-sound-muted";

let ctx: AudioContext | null = null;
let bus: GainNode | null = null;
let muted = false;
let unlocking = false;
const listeners = new Set<() => void>();

/** Read the stored preference. Call once on the client before first paint
 *  logic depends on it; falls back to sound-on, minus a reader who has asked
 *  the page to calm down — ambience nobody asked for is the audio equivalent
 *  of a parallax hijack. */
export function resolveMuted(): boolean {
  let stored: string | null = null;
  try { stored = localStorage.getItem(STORE_KEY); } catch { /* private mode */ }
  if (stored === "1") return true;
  if (stored === "0") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export const isMuted = () => muted;

export function setMuted(next: boolean) {
  muted = next;
  try { localStorage.setItem(STORE_KEY, next ? "1" : "0"); } catch { /* private mode */ }
  if (bus && ctx) {
    bus.gain.cancelScheduledValues(ctx.currentTime);
    bus.gain.setTargetAtTime(next ? 0 : 1, ctx.currentTime, 0.12);
  }
  listeners.forEach((f) => f());
}

/** Adopt the resolved preference without writing it back — the reader has not
 *  chosen anything yet, and storing a default would mean a later change of
 *  system setting could never move it. */
export function adoptMuted(next: boolean) {
  muted = next;
  if (bus && ctx) bus.gain.value = next ? 0 : 1;
  listeners.forEach((f) => f());
}

/** Returns an unsubscribe suitable for a `useEffect` cleanup — hence the
 *  braces: `Set.delete` yields a boolean, which is not a valid destructor. */
export function onMuteChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

/** The shared context, created on first need so a reader who never reaches a
 *  sounding scene never pays for one. `null` where Web Audio is missing. */
export function audio(): { ctx: AudioContext; bus: GainNode } | null {
  if (ctx && bus) return { ctx, bus };
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  bus = ctx.createGain();
  bus.gain.value = muted ? 0 : 1;
  bus.connect(ctx.destination);
  return { ctx, bus };
}

/** Autoplay policy will not open a context before the reader has interacted
 *  with the page. Try, and if refused, wait for the first gesture anywhere and
 *  try again — rather than pretending we are audible. */
export function unlock(after?: () => void) {
  const a = audio();
  if (!a) return;
  void a.ctx.resume().then(() => {
    if (a.ctx.state === "running") { after?.(); return; }
    arm(after);
  }).catch(() => arm(after));
}

function arm(after?: () => void) {
  if (unlocking) return;
  unlocking = true;
  const go = () => {
    document.removeEventListener("pointerdown", go);
    document.removeEventListener("keydown", go);
    unlocking = false;
    const a = audio();
    void a?.ctx.resume().then(() => after?.());
  };
  document.addEventListener("pointerdown", go);
  document.addEventListener("keydown", go);
}

export const running = () => ctx?.state === "running";

/** A short struck tick — the sound a card makes arriving at centre.
 *
 *  Two voices: a sine at `freq` for pitch, and a noise burst through a
 *  bandpass an octave above for the attack, which is what stops it reading as
 *  a test tone. Both on a fast exponential decay, because a UI sound that
 *  rings is a UI sound you get sick of. */
export function tick({ freq = 440, gain = 0.06, decay = 0.13 } = {}) {
  if (muted) return;
  const a = audio();
  if (!a || a.ctx.state !== "running") return;
  const { ctx: c, bus: out } = a;
  const t = c.currentTime;

  const env = c.createGain();
  env.gain.setValueAtTime(gain, t);
  env.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  env.connect(out);

  const osc = c.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.82, t + decay);
  osc.connect(env);
  osc.start(t);
  osc.stop(t + decay + 0.02);

  /* 30ms of noise is plenty for an attack transient; any longer and it turns
     into a hiss sitting under the tone. */
  const n = c.createBuffer(1, Math.ceil(c.sampleRate * 0.03), c.sampleRate);
  const d = n.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = c.createBufferSource();
  src.buffer = n;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = freq * 2;
  bp.Q.value = 1.1;
  const nEnv = c.createGain();
  nEnv.gain.setValueAtTime(gain * 0.5, t);
  nEnv.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  src.connect(bp).connect(nEnv).connect(out);
  src.start(t);
}
