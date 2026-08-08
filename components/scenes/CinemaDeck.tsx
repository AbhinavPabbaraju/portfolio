"use client";
import { useEffect } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { showcase } from "@/lib/scrollStore";
import { SCRUB, prefersReducedMotion } from "@/lib/motion";

/** The scroll deck. Every scene pins when it is fully on screen and
 *  then *holds* — fixed, with nothing moving — for a set stretch of
 *  scrolling, before receding and letting the next one up. Plus
 *  per-element travel: fly in from below → settle for the readable
 *  middle → depart upward. GSAP-only, per the animation contract: long
 *  scroll timelines live here.
 *
 *  The dwell is an empty `.cine-hold` element after each pinned scene,
 *  not a longer pin. A longer pin buys nothing here: with
 *  `pinSpacing:false` the following content tracks the wheel 1:1
 *  regardless, so the hand-off always took one viewport and the extra
 *  was spent pinned and invisible. Real distance in the document is the
 *  only thing that makes the page hold, and the spacer is that
 *  distance — which is also how the reference this was modelled on
 *  (landonorris.com, Lenis + ScrollTrigger) does it: pin wrap, sticky
 *  item, spacer.
 *
 *  Depth is carried by scale + opacity, and by nothing else. The previous
 *  pass scrubbed `filter: brightness() blur()` across whole pinned
 *  sections, which repainted a full viewport of text and WebGL on every
 *  scroll frame — the dominant cost on the page — and blurred body copy
 *  reads as a rendering fault rather than a camera. Against a near-black
 *  background, fading toward that background dims identically and never
 *  leaves the compositor. */
/** Fraction of the showcase's hold spent unrolling the ring into the stair.
 *  The rest steps through the stair, one card at a time — so this also sets
 *  how much scroll each card gets. */
const UNROLL = 0.26;

export default function CinemaDeck() {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    /* On mobile the URL bar collapsing counts as a resize: ScrollTrigger
       would re-measure and re-place every pin mid-scroll, which is the
       jolt you get a second into any downward flick. */
    ScrollTrigger.config({ ignoreMobileResize: true });

    const ctx = gsap.context(() => {
      const SCENES = [".hero", ".kinetic", "#about", "#showcase", "#work", "#writing", "#now", "#contact"];
      SCENES.forEach((sel, i) => {
        const el = document.querySelector<HTMLElement>(sel);
        if (!el) return;
        el.classList.add("cine-scene");
        el.style.zIndex = String(i + 1);
      });

      /** How far a departing scene fades before it is fully hidden. */
      const DIM = 0.55;

      /** Where a scene comes to rest.
       *
       *  Every scene is at least `100svh`, so one that is exactly that
       *  rests dead centre either way. The ones that are taller — the
       *  diner, the carousel — have to be read to their bottom first;
       *  centring those would pin them with both ends off screen and
       *  leave no way to reach either. */
      const restPoint = (el: HTMLElement) => () =>
        el.offsetHeight <= window.innerHeight + 2 ? "center center" : "bottom bottom";

      const PIN = [".hero", "#about", "#showcase", "#work", "#writing", "#now"];
      PIN.forEach((sel) => {
        const el = document.querySelector<HTMLElement>(sel);
        if (!el) return;

        /* ── where the hold comes from ──
           An empty `.cine-hold` element sits after each pinned scene in
           the markup, and that element *is* the dwell. Once the scene
           pins it stays fixed while the spacer scrolls past underneath —
           nothing else has entered the viewport yet, because the next
           scene is still a spacer's height below it. Only then does the
           next scene climb over.

           This is why the pin keeps `pinSpacing:false`. A longer pin on
           its own buys nothing: the following content tracks the wheel
           1:1 either way, so the hand-off always took one viewport and
           the extra pin was spent hidden. Dwell has to be real distance
           in the document, and the spacer is that distance — measured
           here rather than restated, so CSS stays the one place it is
           set. */
        const spacer = el.nextElementSibling;
        const hold = spacer?.classList.contains("cine-hold")
          ? (spacer as HTMLElement).offsetHeight / window.innerHeight
          : 0;

        /* The spacer is sized in `vh`, so this ratio survives a resize
           even though the timeline's own durations are fixed at build. */
        const tl = gsap.timeline();
        tl.fromTo(el,
          { y: 0, scale: 1, rotation: 0, opacity: 1 },
          {
            y: "-12%", scale: 0.94, opacity: DIM, ease: "none", duration: 1,
            rotation: sel === "#showcase" ? -2.4 : 0,      // the camera banks leaving software space
          },
          hold);

        /* the hero's name pulls apart as it is covered, not while it holds */
        if (sel === ".hero") {
          el.querySelectorAll<HTMLElement>("h1.name .row").forEach((row, i) => {
            tl.to(row, {
              y: -(16 + i * 12) + "vh", x: (i % 2 ? 4 : -4) + "vw",
              ease: "none", duration: 1,
            }, hold);
          });
        }

        ScrollTrigger.create({
          trigger: el,
          start: restPoint(el),
          /* the spacer, then the one viewport the next scene needs to
             climb over. Px, resolved on every refresh — `+=n%` in an end
             offset reads against the trigger's own height, and these
             scenes are not all one viewport tall. */
          end: () => "+=" + window.innerHeight * (hold + 1),
          pin: true, pinSpacing: false, anticipatePin: 1, invalidateOnRefresh: true,
          animation: tl, scrub: SCRUB.lead,
          /* ── the carousel's own sequence, inside its own hold ──
             Hung off the pin's trigger rather than a second one so the
             phases cannot drift from the pin by a pixel: same start, same
             end, one source of progress.
             `hold / (hold + 1)` is where the dwell ends and the departure
             `tl` begins, so the sequence lands entirely inside the stretch
             the scene is fixed and was otherwise inert. The scene's pacing
             is untouched — the hold just has something in it now.
             Written into a plain object, not React state: this runs on
             every scroll frame, and the carousel reads it in `useFrame`. */
          onUpdate: sel === "#showcase"
            ? (self) => {
                const dwell = hold / (hold + 1);
                const t = dwell > 0 ? Math.min(1, self.progress / dwell) : 1;
                showcase.morph = Math.min(1, t / UNROLL);
                showcase.focus = t <= UNROLL ? 0 : (t - UNROLL) / (1 - UNROLL);
              }
            : undefined,
        });
      });

      /* arrival: the rising scene sharpens, brightens, unmasks */
      ["#about", "#showcase", "#work", "#writing", "#now", "#contact"].forEach((sel) => {
        const el = document.querySelector(sel);
        if (!el) return;
        /* no clip masks: reveal wipes read as cropping when scrubbed in
           reverse. Scale + lighting carry the arrival symmetrically. */
        gsap.fromTo(el,
          { scale: 0.97, opacity: DIM },
          {
            scale: 1, opacity: 1,
            ease: "none", immediateRender: false, transformOrigin: "50% 20%",
            scrollTrigger: { trigger: el, start: "top bottom", end: "top top", scrub: SCRUB.lead, invalidateOnRefresh: true },
          });
      });

      /* element choreography: fly in → settle → depart, per velocity.
         Distance varies per element — that's the parallax fan. Timing does
         not: two scrub values for the whole page, so nothing drifts out of
         step with the element beside it. */
      type V = { y?: [number, number]; x?: [number, number]; trail?: boolean };
      const fly = (sel: string, v: V | ((i: number) => V)) => {
        document.querySelectorAll<HTMLElement>(sel).forEach((el, i) => {
          const o = typeof v === "function" ? v(i) : v;
          el.classList.add("cin");
          const from: gsap.TweenVars = {};
          const inK: gsap.TweenVars = { duration: 0.55, ease: "power2.out" };
          const outK: gsap.TweenVars = { duration: 0.45, ease: "power2.in" };
          if (o.y) { from.y = o.y[0] + "vh"; inK.y = "0vh"; outK.y = o.y[1] + "vh"; }
          if (o.x) { from.x = o.x[0] + "vw"; inK.x = "0vw"; outK.x = o.x[1] + "vw"; }
          gsap.fromTo(el, from, {
            keyframes: [inK, outK], ease: "none",
            scrollTrigger: {
              trigger: el, start: "top bottom", end: "bottom top",
              scrub: o.trail ? SCRUB.trail : SCRUB.lead, invalidateOnRefresh: true,
            },
          });
        });
      };

      fly("#about .about-lead", { y: [16, -12], x: [-3, 2] });
      fly("#about .about-body", { y: [22, -8], trail: true });
      fly("#about .facts", { y: [10, -5], trail: true });
      fly("#about .stackloop", { y: [12, -6], x: [3, -3], trail: true });
      fly("#showcase .sc-head .section-num", { y: [8, -14], x: [4, -3] });
      fly("#work .block-head h2", { y: [14, -10], x: [-5, 4] });
      fly("#work .block-head .section-num", { y: [5, -13] });
      fly("#work .cafe-cap", { y: [8, -4], trail: true });
      fly("#writing .block-head h2", { y: [14, -10], x: [6, -4] });
      fly("#writing .note", (i) => ({
        y: [9 + i * 4, -(5 + i * 3)], x: [i % 2 ? 3 : -3, i % 2 ? -2 : 2],
      }));
      fly("#now .block-head", { y: [12, -9] });
      fly("#contact h2", { y: [15, -9], x: [-3, 2] });
      fly("#contact .sub", { y: [10, -5], trail: true });
      fly("#contact .cta-row", { y: [13, -4], trail: true });
      fly("#contact .donut", { y: [-5, 6], trail: true });
      fly("#contact .ascii-cap", { y: [-3, 4], trail: true });

      /* drawables: scribbles draw themselves on first approach.
         The transition itself lives in CSS (.drawable); this only arms the
         dash and releases it. */
      document.querySelectorAll<SVGPathElement>(".drawable").forEach((p) => {
        const len = p.getTotalLength();
        p.style.transition = "none";                 // arm without animating the dash on
        p.style.strokeDasharray = String(len);
        p.style.strokeDashoffset = String(len);
        void p.getBoundingClientRect();              // commit the armed state
        p.style.transition = "";                     // hand the curve back to CSS
        ScrollTrigger.create({
          trigger: p.closest("svg"), start: "top 85%", once: true,
          onEnter: () => { p.style.strokeDashoffset = "0"; },
        });
      });

      /* the carousel winds into place while arriving */
      ScrollTrigger.create({
        trigger: "#showcase", start: "top bottom", end: "top top",
        onUpdate: (self) => { showcase.scrollRot = (1 - self.progress) * 0.85; },
      });

      /* ── the diner street settles into place ──
         A dolly, not a slide. Both scene planes are `slice` over a frame they
         exactly cover, so translating either one opens a strip of bare page
         along an edge — there is no spare artwork below the kerb, which is
         where the crop is anchored. Scaling about that same anchor moves
         everything except the one line that must not move.
         The near plane travels further than the far one; that difference is
         the parallax. Timing is identical, per the one-vocabulary rule. */
      const dolly = (sel: string, from: number) => {
        const el = document.querySelector(sel);
        if (!el) return;
        gsap.fromTo(el, { scale: from, transformOrigin: "50% 100%" },
          { scale: 1, ease: "none",
            scrollTrigger: { trigger: "#work", start: "top bottom", end: "top top", scrub: SCRUB.trail, invalidateOnRefresh: true } });
      };
      dolly(".cafe-backdrop svg", 1.045);
      dolly(".cafe-wires svg", 1.1);
    });
    return () => ctx.revert();
  }, []);
  return null;
}
