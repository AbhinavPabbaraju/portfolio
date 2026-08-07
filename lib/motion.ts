"use client";

/* ════════════════════════════════════════════════════════════
   One motion vocabulary for the whole site.

   Three engines animate this page — GSAP owns the scroll deck,
   Framer Motion owns component transitions, CSS owns hover state —
   and they were each inventing their own curves and durations.
   Everything now spends the same three eases and the same duration
   scale, so a hover, a card swap and a scene change feel like one
   system rather than three. CSS mirrors these in :root.
   ════════════════════════════════════════════════════════════ */

export type Bezier = [number, number, number, number];

/** Arrivals, hovers, anything that lands. Mirrors CSS `--ease-out`. */
export const EASE_OUT: Bezier = [0.22, 0.61, 0.36, 1];
/** State changes that travel both ways — panels, camera pushes. */
export const EASE_IN_OUT: Bezier = [0.65, 0.05, 0.36, 1];
/** Departures — things leaving the frame accelerate away. */
export const EASE_IN: Bezier = [0.55, 0.06, 0.68, 0.19];

export const EASE = { out: EASE_OUT, inOut: EASE_IN_OUT, in: EASE_IN };

/** GSAP's named equivalents of the same three curves. */
export const G_EASE = { out: "power2.out", inOut: "power2.inOut", in: "power2.in" } as const;

/** Seconds. `sm` for controls, `md` for components, `scene` for cinematics. */
export const DUR = { xs: 0.2, sm: 0.35, md: 0.55, lg: 0.8, scene: 1.1 } as const;

/** Scrub smoothing, and only these two values.
 *  Anything leading the scroll uses `lead`, anything trailing it uses
 *  `trail`. The deck previously mixed ten different scrub numbers plus
 *  `scrub: true`: neighbouring elements were being smoothed by different
 *  amounts against the same scroll input, which is what read as stutter.
 *
 *  A scrub number is seconds of catch-up: the tween chases the position
 *  the scroll implies rather than snapping to it, so a larger number is
 *  a longer, softer glide. It is the same mechanism anime.js exposes as
 *  `sync: 0..1` on a ScrollObserver, inverted — there, closer to zero is
 *  slower; here, larger is slower.
 *
 *  Raised from 0.5 / 0.85. The **ratio** between them is what must not
 *  move: 1.69 before, 1.69 after. Two elements smoothed by different
 *  amounts against one scroll input is the stutter this pair exists to
 *  prevent, so they get scaled together or not at all. */
export const SCRUB = { lead: 0.8, trail: 1.35 } as const;

/** How hard Lenis damps the scroll position itself, per frame.
 *
 *  Lower is smoother and heavier; higher tracks the wheel more literally.
 *  This lived as a bare number in the provider, which put the single most
 *  consequential smoothing value on the page outside the one file that is
 *  supposed to hold every one of them. Everything else is downstream of
 *  it: the deck scrubs against the position Lenis has already smoothed,
 *  so this and `SCRUB` compound. */
export const SCROLL_LERP = 0.075;

/** Anchor travel — expo out, so long jumps arrive without a hard stop. */
export const expoOut = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

/** Ease-in-out for values interpolated inside a frameloop, where a CSS or
 *  GSAP curve cannot reach — the R3F carousel's scroll phases, mainly. It
 *  lives here for the same reason the eases do: so a component never has to
 *  invent its own shape. Clamps, so callers can hand it raw progress. */
export const smoothstep = (t: number) => {
  const x = t < 0 ? 0 : t > 1 ? 1 : t;
  return x * x * (3 - 2 * x);
};

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Frame-rate–independent lerp factor. `k` is the fraction a 60fps frame
 *  should cover; this returns the fraction *this* frame should cover.
 *  Hand-rolled `x += (target - x) * k` loops otherwise run ~2.4× faster on
 *  a 144Hz display and lurch whenever a frame is dropped. */
export const lerpFactor = (k: number, deltaSeconds: number) =>
  1 - Math.pow(1 - k, Math.min(deltaSeconds, 0.1) * 60);

/** Same idea for a decay toward a resting value (`half` = half-life, s). */
export const decay = (half: number, deltaSeconds: number) =>
  Math.pow(0.5, Math.min(deltaSeconds, 0.1) / half);
