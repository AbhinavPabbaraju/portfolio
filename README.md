# Abhinav Pabbaraju — portfolio

Production-grade Next.js migration of the single-file portfolio. One continuous
scroll-driven world: hero → about → showcase → Systems Diner → writing → contact.

## Stack & animation contract
- **Next.js 15 (App Router) + TypeScript + Tailwind v4**
- **GSAP + ScrollTrigger** — long scroll timelines only: the layered pin deck
  (`components/scenes/CinemaDeck.tsx`) and the diner cinematics (`components/diner/Diner.tsx`).
- **Framer Motion** — component animations: rotating headline word, terminal loop,
  polaroid stagger, sticker-drop Now cards.
- **React Three Fiber** — WebGL: hero fresnel field, cylindrical project carousel.
- **Lenis** — smooth scroll, driven by the GSAP ticker (`providers/SmoothScroll.tsx`).

### Motion rules
`lib/motion.ts` is the only place curves and durations are defined; `:root` in
`globals.css` mirrors it. Three eases, one duration scale, **two** scrub values.
Don't hand-write a bezier or a scrub number in a component.

- **Scroll travel goes through Lenis.** `scrollToTarget()` in `lib/lenis.ts`, never
  `scrollIntoView({behavior:"smooth"})` and never `html{scroll-behavior:smooth}` —
  a native animation and Lenis fight over the same scroll position the whole way.
- **Depth is scale + opacity, never `filter`.** Scrubbing `blur()`/`brightness()`
  across a pinned section repaints a full viewport per frame; against a near-black
  page, fading toward the background dims identically on the compositor.
- **No fixed per-frame steps.** Anything hand-rolled advances by delta time
  (`lerpFactor` / `decay`), or it runs 2.4× fast on a 144Hz display.
- **Expensive loops idle offscreen.** WebGL canvases take `frameloop` from an
  IntersectionObserver; rAF loops bail early when not visible.
- **Any layout mutation calls `refreshDeck()`**, or the pins run on stale
  measurements.

## Architecture notes
- `lib/data/projects.ts` is the single source of truth: each project renders as a
  menu dish, a carousel card, and a serve-overlay detail.
- The diner is a React state machine (`Diner.tsx`); GSAP timelines are effects.
  Any height change calls `refreshDeck()` + an instant Lenis snap so the pin deck
  never runs on stale measurements.
- The big street/shop SVGs were machine-ported from the legacy build 1:1
  (`Backdrop.tsx`, `ShopFacade.tsx`).
- Legacy CSS ships wholesale in `app/globals.css` beneath a Tailwind `@theme`
  token layer — preserve-the-design-first; migrate selectors to utilities gradually.
- Design tokens live on `:root`: radius `--r-sm|md|lg|xl` (2/6/14/39), spacing
  `--s-1…--s-6` off an 11px base, motion `--ease-*`/`--dur-*`. Layout collapses at
  768px, wide side-by-side compositions at 992px; a couple of decoration-only
  queries keep their own thresholds and say so inline.

## Run
```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

## Known follow-ups
- Photo gallery polaroids are placeholders — drop real images into `PhotoGallery.tsx`.
- Legacy extras not yet ported: preloader ink-wipe, pixel cursor trail, laser beam,
  magnifying dock, ASCII name easter egg.
- Dead legacy CSS (loader/dock/trail selectors) can be pruned once follow-ups land.
