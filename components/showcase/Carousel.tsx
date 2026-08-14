"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, type MotionValue } from "framer-motion";
import { PROJECTS, type Project } from "@/lib/data/projects";
import { showcase } from "@/lib/scrollStore";
import { decay, lerpFactor, prefersReducedMotion, smoothstep } from "@/lib/motion";
import { isMuted, tick, unlock } from "@/lib/audio";
import Card from "./Card";

/* ════════════════════════════════════════════════════════════
   The row, and the one number that arranges it.

   Every card's position, size, brightness and turn is a pure function of
   `offset` — how many slots it sits from the middle — and of nothing else.
   That is the whole idea, and it buys three things:

   — **It scrubs.** Attention is a function of distance, not a sequence, so
     dragging the page backwards makes every card retake exactly the state it
     held on the way down. There is nothing to unwind.
   — **There is no index to get wrong.** No "current slide" that can disagree
     with what is on screen, no wrap-around, no clone elements at the ends.
   — **It is finite by construction.** `walk` runs from half a slot before the
     first card to half a slot past the last. Nothing loops, so the pan opens
     on an empty frame, closes on an empty frame, and the pin can release.

   ── why this is DOM and not WebGL ──
   It was a `<Canvas>` of textured planes with the cards painted into a 2D
   canvas as bitmaps. Real elements cost the ring-unroll that only 3D could
   do, and buy back: previews that are inline SVG on the page's own tokens
   rather than baked pixels, type that is selectable and reflows at any size,
   and cards that are `<button>`s — focusable, in the tab order and operable
   from the keyboard, which the canvas never was.

   ── who drives it ──
   `CinemaDeck` still owns the scroll timeline and still writes `morph` and
   `focus` into `scrollStore`; none of that changed. This reads them once per
   frame and never through React state, because the row must not re-render the
   tree on every scroll frame. Motion values carry the numbers from that loop
   to the compositor without touching React at all.
   ════════════════════════════════════════════════════════════ */

const N = PROJECTS.length;

/** How far out the falloff runs. Past two slots a card is off the side of the
 *  stage anyway, and clamping is what stops the fifth one being drawn at four
 *  times the distance and an opacity below zero. */
const FAR = 2;

/** The row. Distances are in **slots** and converted to pixels by the
 *  measured pitch at the very end, so every number here survives a resize. */
const ROW = {
  pitch: 0.94,        // slot pitch, as a fraction of a card's own width
  /** Exponent under 1, so gaps close as cards travel out and the ends of the
   *  row stay on the stage instead of marching off to the horizon. */
  crowd: 0.86,
  scale: 0.09,        // shrink per slot
  fade: 0.29,         // dim per slot
  turn: 7,            // degrees of Y-turn per slot
  depth: 58,          // px of translateZ per slot
};

/** The stack the row is dealt from. `morph` runs 0→1 over the first stretch of
 *  the scene's hold and blends between the two arrangements, so this is a
 *  genuine move rather than one thing crossfading into another — the same
 *  contract the WebGL ring had with the row it unrolled into. */
const DECK = { spread: 0.045, lift: 7, tilt: 4, scale: 0.84 };

const mix = (a: number, b: number, m: number) => a + (b - a) * m;
const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/** One card's geometry, given where it is and how far the deck has opened.
 *
 *  Pulled out of the component so all five cards provably share it, and pure
 *  so it can be reasoned about without a browser. `x` comes back in slots and
 *  is scaled by the pitch by the caller; `y` and `z` are already pixels. */
function place(i: number, walk: number, m: number) {
  /* the deck, centred on the middle card by index — at `morph` 0 the row has
     not formed yet and `walk` does not mean anything */
  const d = i - (N - 1) / 2;
  /* the row: `slot` is signed distance from the middle, in card widths. Card
     `i` enters from the right, takes the middle, and leaves to the left. */
  const slot = i - walk;
  const away = Math.min(Math.abs(slot), FAR);

  return {
    x: mix(d * DECK.spread, Math.sign(slot) * Math.abs(slot) ** ROW.crowd, m),
    y: mix(Math.abs(d) * DECK.lift, 0, m),
    scale: mix(DECK.scale - Math.abs(d) * 0.015, 1 - away * ROW.scale, m),
    opacity: mix(1 - Math.min(Math.abs(d), 3) * 0.16, 1 - away * ROW.fade, m),
    /* Cards off centre turn away from the viewer. Depth is still scale and
       opacity per the motion contract; this is orientation, and it is what
       stops a line of flat rectangles reading as a contact sheet. */
    rotateY: mix(0, -Math.sign(slot) * away * ROW.turn, m),
    rotateZ: mix(d * DECK.tilt, 0, m),
    z: mix(0, -away * ROW.depth, m),
  };
}

/** The smoothed row position, and how far the deck has opened. Both are
 *  written by the one loop below and read by every card. */
interface Rig {
  walk: MotionValue<number>;
  morph: MotionValue<number>;
  pitch: MotionValue<number>;
  focused: MotionValue<number>;
}

export default function Carousel({ onOpen }: { onOpen: (id: string) => void }) {
  const stage = useRef<HTMLDivElement>(null);
  const [centre, setCentre] = useState(Math.round((N - 1) / 2));
  const [grabbing, setGrabbing] = useState(false);

  const walk = useMotionValue(-0.5);
  const morph = useMotionValue(0);
  const pitch = useMotionValue(320);
  const focused = useMotionValue(-1);
  /** the wind-up the row arrives with, spent by the time the scene rests */
  const drift = useMotionValue(0);
  const rig = useMemo<Rig>(() => ({ walk, morph, pitch, focused }), [walk, morph, pitch, focused]);
  const railX = useTransform(drift, (d) => d * 90);

  /* The hand on the row. `nudge` is the only thing a pointer may write; see
     the note on the drag handlers for why it is a nudge and not a position. */
  const hand = useRef({ down: false, lastX: 0, moved: 0, nudge: 0 });

  /* ── the pitch ──
     Card width is a CSS clamp, so the only honest way to know the slot pitch
     is to measure a card. Re-measured on resize: a row laid out for a width
     it is no longer at is exactly what made the WebGL version re-solve its
     frustum on every resize. No layout is mutated here, so the deck needs no
     refresh — the stage keeps its height whatever the cards do. */
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const measure = () => {
      const slot = el.querySelector<HTMLElement>(".sc-slot");
      if (slot?.offsetWidth) pitch.set(slot.offsetWidth * ROW.pitch);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [pitch]);

  /* ── the loop ──
     One rAF, delta-timed, reading the mutable store and writing motion
     values. React is not involved, so the tree does not re-render as the page
     scrolls — the only `setState` here fires once per card arrival. It idles
     the moment the section leaves the viewport, per the motion contract.

     Under reduced motion `CinemaDeck` never builds its timeline, so `morph`
     and `focus` would sit at zero forever — which in a DOM row means five
     cards stacked on top of each other rather than a scene at rest. So the
     loop never starts, the values are parked at "row formed, middle card
     attended", and the stylesheet turns the whole thing into a plain
     scrollable row. */
  useEffect(() => {
    if (prefersReducedMotion()) {
      morph.set(1);
      walk.set((N - 1) / 2);
      return;
    }
    const el = stage.current;
    if (!el) return;

    let raf = 0, last = 0, live = false;
    const e = { m: 0, f: 0, drift: 0 };
    let at: number | null = null;

    const frame = (t: number) => {
      const dt = last ? Math.min((t - last) / 1000, 0.05) : 0.016;
      last = t;
      const k = lerpFactor(0.12, dt);

      e.m += (showcase.morph - e.m) * k;
      e.f += (showcase.focus - e.f) * k;
      e.drift += (showcase.scrollRot - e.drift) * k;
      /* the nudge decays back to nothing, so scroll stays the single source
         of where the row is — see the drag handlers */
      if (!hand.current.down) hand.current.nudge *= decay(0.19, dt);

      /* Half a slot of run-in and run-out, so the pan opens and closes on an
         empty frame rather than with a card already parked in the middle. */
      const w = -0.5 + e.f * N + hand.current.nudge;
      walk.set(w);
      morph.set(e.m);
      drift.set(e.drift);

      /* ── one tick per arrival ──
         `Math.round(w)` is the index of whichever card holds the middle, so
         it changes exactly when a new one takes it — once, in either
         direction, never mid-slot. Gated on the row having actually formed,
         so dealing the deck out is silent. */
      if (e.m > 0.5) {
        const now = clamp(Math.round(w), 0, N - 1);
        if (at !== null && now !== at) {
          setCentre(now);
          /* a step up the ladder per card, so five arrivals read as a run
             rather than as the same blip five times */
          tick({ freq: 300 * Math.pow(1.1892, now), gain: 0.05 });
        }
        at = now;
      } else {
        at = null;
      }
      raf = requestAnimationFrame(frame);
    };

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting === live) return;
      live = entry.isIntersecting;
      if (live) {
        last = 0;
        raf = requestAnimationFrame(frame);
        /* ask for the audio context as the scene approaches rather than on
           the first arrival: `unlock` may have to wait for a gesture, and it
           should already be waiting by the time a card reaches the middle */
        if (!isMuted()) unlock();
      } else {
        cancelAnimationFrame(raf);
      }
    }, { threshold: 0 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── drag, and why it springs back ──
     Scroll owns where the row is: that is the deal the whole page runs on,
     and `lib/lenis.ts` owns scroll travel. A drag therefore cannot *set* the
     position — the next scrubbed frame would take it straight back, and the
     two would fight for as long as you held on. So a drag adds a nudge that
     decays to nothing: the row gives under the hand and settles, which reads
     as "this is attached to the page" rather than as a slider that does not
     work. Clicking still opens a card, and `moved` is what tells a click from
     the end of a drag. */
  const onDown = useCallback((ev: React.PointerEvent) => {
    hand.current.down = true;
    hand.current.lastX = ev.clientX;
    hand.current.moved = 0;
    setGrabbing(true);
    (ev.currentTarget as Element).setPointerCapture(ev.pointerId);
  }, []);

  const onMove = useCallback((ev: React.PointerEvent) => {
    const h = hand.current;
    if (!h.down) return;
    const dx = ev.clientX - h.lastX;
    h.lastX = ev.clientX;
    h.moved += Math.abs(dx);
    /* clamped, so a hard flick cannot throw the row past its own ends */
    h.nudge = clamp(h.nudge - dx / (pitch.get() || 320), -1.1, 1.1);
  }, [pitch]);

  const onUp = useCallback(() => {
    hand.current.down = false;
    setGrabbing(false);
  }, []);

  /* A horizontal wheel — a trackpad swipe — is the same gesture as a drag and
     gets the same nudge. Vertical is left alone: that is the page, and the
     page is what pans the row. */
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const onWheel = (ev: WheelEvent) => {
      if (Math.abs(ev.deltaX) <= Math.abs(ev.deltaY)) return;
      ev.preventDefault();
      hand.current.nudge = clamp(hand.current.nudge + ev.deltaX / (pitch.get() || 320), -1.1, 1.1);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [pitch]);

  const open = useCallback((id: string) => {
    if (hand.current.moved < 6) onOpen(id);
  }, [onOpen]);

  return (
    <div
      className={`sc-track${grabbing ? " is-grabbing" : ""}`}
      ref={stage}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <motion.div className="sc-rail" style={{ x: railX }}>
        {PROJECTS.map((p, i) => (
          <Slot key={p.id} i={i} rig={rig} project={p} centre={i === centre} onOpen={open} />
        ))}
      </motion.div>
    </div>
  );
}

/** One positioned slot.
 *
 *  Split out because the transforms are a stack of hooks and hooks cannot be
 *  called in a loop inside the parent. Everything about *where* a card is
 *  lives here; everything about how it *looks* lives in `Card`, which never
 *  learns its own offset — a card that reached for that would be a second
 *  source of truth for the same number. */
function Slot({
  i, rig, project, centre, onOpen,
}: {
  i: number; rig: Rig; project: Project; centre: boolean; onOpen: (id: string) => void;
}) {
  const { walk, morph, pitch, focused } = rig;
  const geo = [walk, morph];
  const x = useTransform([...geo, pitch], ([w, m, p]: number[]) => place(i, w, m).x * p);
  const y = useTransform(geo, ([w, m]: number[]) => place(i, w, m).y);
  const scale = useTransform(geo, ([w, m]: number[]) => place(i, w, m).scale);
  const rotateY = useTransform(geo, ([w, m]: number[]) => place(i, w, m).rotateY);
  const rotateZ = useTransform(geo, ([w, m]: number[]) => place(i, w, m).rotateZ);
  const z = useTransform(geo, ([w, m]: number[]) => place(i, w, m).z);
  const zIndex = useTransform(walk, (w: number) => 100 - Math.round(Math.abs(i - w) * 10));
  /* A focused card is lifted to full wherever it sits. Every card is a tab
     stop, and a focus ring drawn at 0.4 opacity is a focus ring nobody can
     find — this is the one thing allowed to override the geometry, and it is
     an accessibility floor rather than a piece of styling. */
  const opacity = useTransform(
    [...geo, focused],
    ([w, m, f]: number[]) => (f === i ? 1 : place(i, w, m).opacity),
  );

  return (
    <motion.div
      className="sc-slot"
      style={{ x, y, scale, rotateY, rotateZ, z, opacity, zIndex }}
      onFocus={() => focused.set(i)}
      onBlur={() => { if (focused.get() === i) focused.set(-1); }}
    >
      <Card project={project} centre={centre} onOpen={onOpen} />
    </motion.div>
  );
}
