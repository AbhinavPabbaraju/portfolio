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
- `ShopFacade.tsx` is a machine-ported SVG, geometry preserved 1:1. Don't
  reformat it. (Its palette was hue-rotated into the street's violet family;
  every warm tone — wood, lanterns, window light — was left alone.)

### The street: one frame, three planes

The exterior is a **full-bleed, one-viewport frame** (`.cafe-exterior`,
`100svh`, clipped on both axes) and the scene covers it.
`lib/diner/scene.ts` is the one coordinate system: a 1600×1100 grid whose
`GROUND` (y=740) is the single line everything stands on, plus the pole
specs and the `sag()` helper. Both planes are `xMidYMax slice` over the
frame, so they scale like `background-size:cover` and anchor on the road.

**The shop is `SHOP_UNITS` wide on that grid, not in CSS pixels** — this is
the load-bearing decision. As a fixed 820px against artwork that grew with
the window, a wide screen blew the street up around a shop that stayed put:
poles drifted onto the facade, cables sagged across the sign, and the sky
was scaled off the top of a box only as tall as its contents. Tied to the
same scale, the picture is identical at every size and only its resolution
changes — shop x410–1190, poles at 300 and 1300, cable fan clearing the
sign by 11 units, always. That budget is thin: `SHOP_UNITS` and the sag
table in `Overhead.tsx` move together, because a bigger shop raises its own
roof line into the wires. `sync()` derives the scale, the road and the
shop's box; `.cafe-stage` states the same sums in CSS for the first paint.

The grid is deeper than the drawing (`VB_TOP` is 240 above it) so a tall
window crops sky rather than flanks. Everything that makes the scene read as
a street — trees, poles, lamps, houses — lives in the margins.

- `Backdrop.tsx` — the far plane, behind the facade. Sky, moon, clouds, three
  bands of city, the wet road, both sakura, the flank houses. Hand-authored
  on the grid; the two trees are one `<defs>` drawing placed twice, the
  second mirrored.
- `Overhead.tsx` — the near plane, `.cafe-wires`, drawn **in front of** the
  facade. Two poles and every cable between them. It has to be in front: the
  poles stand on the near kerb and the facade owns the middle of the grid, so
  a cable web drawn behind it is one nobody sees. It fades on the veil's own
  curve when the camera pushes in — the veil lives inside the stage and
  cannot reach a sibling above it.
- Wires anchor on insulator coordinates taken from the pole specs, so a span
  cannot end anywhere but on hardware. Sag is the only thing making them read
  as cable, and the fan bottoms out at y≈351 against a sign top at y≈362.
- **Neither plane may be translated.** They exactly cover the frame with the
  crop anchored on the kerb, so any `y` on them opens a strip of bare page
  along an edge. The deck's parallax is a scale about `50% 100%` for that
  reason — near plane travels further than far, which is the depth.
- Clouds drift one way, not back and forth. Each bank is drawn twice a grid
  width apart and travels exactly `-100%` per cycle — one viewBox width on an
  SVG element — so the trailing copy lands where the leading one started and
  the loop has no seam. `alternate` is what made the old sky read as a slider.
- Both sakura are one `<defs>` drawing, the right one mirrored and set back.
  The crown is a blurred mass first, then clusters in three tones (underside,
  body, lit rim) — fading one tone leaves it flat and the gaps read as holes.
  Every cluster carries its own `rotate()`: one drawing repeated fifty times
  puts its specular highlight at the same offset fifty times, and that is
  what reads as polka dots.
- A lamp's bulb and the pool it throws are in different planes. They stay in
  step only by sharing a class — `.lampFlick{v}` on the bulb, `.lampGlow{v}`
  on the road, identical duration and delay. `LAMPS` in `scene.ts` is the
  list; adding a lamp means adding a variant to both rules.

### The menu's margins

`MenuFlourish.tsx` is the engraved pilaster either side of the paper menu —
the room's furniture, filling margins that were dead space. Three stacked
pieces (cap, rod, waist, rod, flipped cap) rather than one tall SVG, because
the menu's height is whatever five dishes come to and a single drawing
stretched to that would distort or letterbox. Strokes are
`non-scaling-stroke`: hairline at any size is what makes it read as engraving.
It is drawn in `--paper` at low alpha — the menu's own material, embossed, not
a second decorative language — and hidden below **1120px**, where the column's
gutters are all the margin there is. `.menu-scene` is shared with the photo
gallery, so the ornament is mounted from `Diner`, not from that class.

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
- Sections carry **no numbered label**. "01 — Showcase" and its five siblings
  read as a table of contents pasted over a page meant to be one continuous
  shot, and made each scene announce itself before you could look at it.
  `SectionHead` is title + optional aside; the asides stay, because one of
  them ("scroll to pan · click a card") is the carousel's only usage hint.
- `.eyebrow` survives for `app/not-found.tsx` alone. It is an `inline-flex`
  row, so its label has to stay a **single element** — a fragment makes every
  text run its own flex item, each taking the `.7em` gap.

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
- The diner section is head + one viewport, and `CinemaDeck` rests anything
  taller than the viewport with its *bottom* on the bottom of the screen — so
  at rest the visible window is exactly the frame and the section head has
  scrolled away. That only holds while `.cafe{padding-bottom:0}`.
- On a phone the grid is cropped so hard that a shop scaled off it would be
  wider than the window, so `sync()` floors the shop at the gutter. The poles
  are outside the crop by then; the cables still cross the sky, arriving from
  off frame on both sides, which is correct rather than a loose end.
- Dead CSS remains for unported legacy features (loader, dock, trail, badge).
  `Nav.tsx` is superseded by `CardNav.tsx` and unused. Safe to prune, but check
  before deleting — some of it is waiting on a follow-up.
- Photo gallery polaroids are placeholders.
