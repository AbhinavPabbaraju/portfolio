# CLAUDE.md

Scroll-driven single-page portfolio. Next.js 15 App Router, TypeScript,
Tailwind v4, GSAP + ScrollTrigger, Framer Motion, React Three Fiber, Lenis.

## Commands

```bash
npm run dev          # http://localhost:3000
npm run typecheck    # tsc --noEmit
npm run build        # always run before calling a change done
```

There is no test suite and no linter configured. `typecheck` + `build` are the
only automated gates — neither one catches an animation regression, so say
plainly when a change has not been looked at in a browser.

## Architecture

- `app/page.tsx` composes the scenes in scroll order; `CinemaDeck` mounts last
  and is the only thing that knows about the page as a whole.
- `components/scenes/CinemaDeck.tsx` — the pin deck. Each scene pins when
  fully on screen, holds still for `HOLD` viewports of dead scroll, then
  recedes over `DEPART` and lets the next one up. Those two constants set the
  pace of the whole page — tune there, nowhere else. `pinSpacing` must stay
  **true**: under `false` the next scene tracks the wheel 1:1 regardless of
  pin length, so the hold cannot exist. It reaches into the DOM by selector
  on purpose; scenes stay unaware of it.
- `components/diner/Diner.tsx` — a React state machine (`null | menu | photo`);
  GSAP timelines are effects driven by it.
- `lib/data/projects.ts` is the single source of truth: each project renders as
  a menu dish, a carousel card and a serve-overlay detail.
- `lib/motion.ts` — every curve, duration and scrub value. `:root` in
  `app/globals.css` mirrors it.
- `Backdrop.tsx` / `ShopFacade.tsx` are machine-ported SVGs, geometry preserved
  1:1. Don't reformat them.

### Dish labs

Two projects serve an interactive model instead of a paragraph. `ServeOverlay`
holds the `LABS` map (project id → component); adding a third is one entry
plus a component. Both are imported eagerly, not via `next/dynamic` — the
serve overlay opens on a GSAP timeline that fades a transform-centred block
in, and a panel arriving one chunk later resizes it mid-fade.

- `RaftPlayground` (Phalanx) over `lib/raft/simulator.ts` — a seeded cluster
  driven by `hooks/useRaftClock.ts`.
- `RiccPlayground` (ricc) over `lib/ricc/` — a real compiler, not a canned
  script: lexer → Pratt parser → TAC → five block-local passes → live
  intervals → linear scan → x86-64. `compile()` is pure and total; every
  panel is its output for whatever is in the editor, and a bad program comes
  back as a `CompileError` with a line and column.
- Shell and controls are shared as `.lab` / `.lab-btn` / `.lab-controls` /
  `.lab-status` / `.lab-fineprint` / `.lab-live`. Anything still named
  `.raft-*` or `.ricc-*` belongs to that lab alone. A new lab reuses the
  `.lab-*` set and namespaces the rest.
- A lab is far taller than the paragraph the serving was sized for, so
  `.serve.has-lab .serve-detail` caps its height and scrolls internally.
  Any scrollable box inside the serving needs `data-lenis-prevent`, or the
  wheel moves the page instead.

## Motion rules

These exist because each one was a visible bug on this page. Breaking one
brings the stutter back.

- **One vocabulary.** Three eases, one duration scale, exactly two scrub values
  (`SCRUB.lead` / `SCRUB.trail`), all from `lib/motion.ts`. Never hand-write a
  bezier, a duration or a scrub number in a component. Mixing scrub amounts
  across neighbouring elements is what reads as jitter — vary *distance*, which
  is the parallax, never *timing*, which is noise.
- **Lenis owns scroll travel.** Use `scrollToTarget()` from `lib/lenis.ts`.
  Never `scrollIntoView({behavior:"smooth"})`, never `html{scroll-behavior:
  smooth}` — a native animation and Lenis fight over the same scroll position
  the whole way there.
- **Depth is scale + opacity. Never `filter`.** Scrubbing `blur()` or
  `brightness()` across a pinned section repaints a full viewport every frame,
  and blurred body copy reads as a rendering fault. On a near-black page,
  fading toward the background dims identically and stays on the compositor.
- **No fixed per-frame steps.** Anything hand-rolled advances by delta time via
  `lerpFactor` / `decay`. A `x += (target - x) * 0.1` loop runs ~2.4× fast on a
  144Hz display and lurches on every dropped frame.
- **Expensive loops idle offscreen.** R3F canvases take `frameloop` from an
  IntersectionObserver; rAF loops bail early when not visible. The hero field,
  the transmission glass band and `donut.c` are each costly enough to matter on
  their own.
- **Any layout mutation calls `refreshDeck()`.** Height changes (diner mode
  switches, the ASCII wordmark building, web fonts landing) leave every pin on
  stale measurements otherwise.
- **Animate `transform`, not layout.** Especially on fixed, backdrop-filtered
  chrome, where animating `top` relayouts and re-blurs the strip every frame.
- **Scroll listeners:** rAF-throttle them and give any threshold a deadband
  (`hooks/useScrolledPast.ts`). A bare `scrollY > n` toggles repeatedly as a
  Lenis ease-out crosses the line.
- Reduced motion is honoured at every entry point — check it before adding a
  loop, not after.

The one deliberate overshoot on the page is the hanko seal
(`.seal`, `cubic-bezier(.2,1.4,.4,1)`). A stamp is struck, not eased. Leave it.

## Design tokens

On `:root` in `app/globals.css`. Use the token, not the literal:

- radius `--r-sm|md|lg|xl` = 2 / 6 / 14 / 39, plus `--r-pill`
- spacing `--s-1`…`--s-6` off an 11px base
- motion `--ease-out|in-out|in`, `--dur-xs|sm|md|lg|scene`
- breakpoints: **768px** page collapses to one column, **992px** wide
  side-by-side compositions collapse first. A couple of decoration-only
  queries (`.flank` 1100, `.alley-link` 1280) keep their own thresholds and
  say so inline.
- display headings are weight **700** with ~`-.024em` tracking; card titles 600.
  Keep the weights loaded in `layout.tsx` in step with what the stylesheet
  asks for — a missing weight doesn't fall back visibly, it silently matches
  up to the next one and collapses the step between two tiers.
- **Canvas never gets the font swap.** A 2D or WebGL painter bakes in whatever
  face was loaded the moment it drew. `AsciiGlitchName` and the Showcase card
  textures both wait on `document.fonts.ready` and repaint; anything new that
  paints type into a canvas has to do the same or it's a race.
- `.eyebrow` is an `inline-flex` row, so its label has to stay a **single
  element** — `SectionHead` wraps it for that reason. Passing a fragment makes
  every text run its own flex item, each taking the `.7em` gap.

Legacy CSS ships wholesale beneath the Tailwind `@theme` layer —
preserve-the-design-first, migrate selectors to utilities gradually.

## Known constraints

- The supplied brand spec names **Brier** and **Mona Sans Variable**. Neither is
  in the project and neither can be installed from this environment; the site
  runs Syne / Inter / JetBrains Mono via `next/font`. The spec's *ratios* (tight
  display leading, negative tracking) are applied to those faces instead. Don't
  silently swap font families in — ask.
- The same spec's `body: 12px / weight 800` is **not** applied and shouldn't be:
  at that size and weight body copy fails WCAG AA. It reads like a micro-label
  style, not body.
- The share card (`app/opengraph-image.tsx`) renders in next/og's default face,
  not Syne. `ImageResponse` needs a TTF/OTF/WOFF it can embed, and the only
  copies here are the hashed **WOFF2** build outputs, which it won't take.
- The Showcase carousel is still pointer-only — drag to spin, click to open.
  The five projects are all reachable from the menu below, so nothing is lost,
  but the carousel itself has no keyboard path.
- Dead CSS remains for unported legacy features (loader, dock, trail, badge).
  `Nav.tsx` is superseded by `CardNav.tsx` and unused. Safe to prune, but check
  before deleting — some of it is waiting on a follow-up.
- Photo gallery polaroids are placeholders.
