/** One coordinate system for the whole backstreet.
 *
 *  Every part of the diner's exterior is drawn on this grid: the far plane
 *  (`Backdrop`), the near plane (`Overhead` — poles and cables), and the shop
 *  itself, which `Diner`'s `sync()` sizes and places from these numbers. They
 *  share them rather than restating them, because the one thing that must
 *  never drift is `GROUND`: it is the single line every building, tree, pole
 *  and stool in the scene stands on.
 *
 *  ── the scene is one picture, and it covers the viewport ──
 *  Both planes are `xMidYMax slice` over the full-viewport stage, so they
 *  scale like `background-size:cover` and anchor on the road. The shop is
 *  `SHOP_UNITS` wide *in grid units* and therefore scales with them, which is
 *  the whole point: it used to be a fixed 820 CSS px against artwork that
 *  grew with the window, so on a wide screen the street ballooned around a
 *  shop that stayed put — poles drifted onto the facade, cables sagged across
 *  the sign, and the sky was scaled clean off the top of the frame. Tie the
 *  two together and the composition is identical at every size: shop from
 *  x410 to x1190, poles just outside it at 300 and 1300, cable fan clearing
 *  the roof sign, always.
 *
 *  The grid is deeper than the picture needs (`VB_TOP` is 240 above the
 *  drawing) so that a tall window crops sky off the top rather than cropping
 *  the flanks — the trees, the poles and the lamps all live in the margins,
 *  and losing them is what makes the scene stop reading as a street. */
export const VB_W = 1600;
export const VB_TOP = -240;
export const VB_H = 1100;
/** the bottom edge of the grid: 120 units of near road below the kerb */
export const VB_BOTTOM = VB_TOP + VB_H;
export const GROUND = 740;
/** The shop's width on the grid. Every clearance in the scene is measured
 *  against this: raise it and the facade climbs, because its roof line is
 *  `GROUND - 0.518 · SHOP_UNITS`. At 780 the sign tops out at y≈362 and the
 *  cable fan bottoms at y≈351 — 11 units, and the reason the crossarms sit
 *  where they do. Grow the shop again and the fan has to come up with it. */
export const SHOP_UNITS = 780;
export const VIEWBOX = `0 ${VB_TOP} ${VB_W} ${VB_H}`;

/** A crossarm: how far below the pole top it sits, and its half-span.
 *  The insulators are at both ends, so `x ± half` are cable anchors. */
export interface Arm {
  y: number;
  half: number;
}

export interface PoleSpec {
  /** centre of the shaft */
  x: number;
  /** where the shaft stops */
  top: number;
  /** the pin insulator sitting on top of the first crossarm */
  pin: number;
  arms: [Arm, Arm, Arm];
  /** the lamp arm: where it leaves the shaft, and where the head hangs.
   *  Both arms point *away* from the shop, which is also where the road they
   *  are lighting is. */
  lamp: { y: number; hx: number; hy: number };
}

/** Left pole. Deliberately shorter than the reference's, which towers about
 *  1.9× the shop's height; this one is 1.5×. */
export const POLE_L: PoleSpec = {
  x: 300,
  top: 170,
  pin: 186,
  arms: [
    { y: 194, half: 62 },
    { y: 228, half: 50 },
    { y: 262, half: 38 },
  ],
  lamp: { y: 380, hx: 222, hy: 384 },
};

/** Right pole, deliberately not the left one's twin — a street where both
 *  poles top out at the same height reads as wallpaper. */
export const POLE_R: PoleSpec = {
  x: 1300,
  top: 184,
  pin: 200,
  arms: [
    { y: 208, half: 60 },
    { y: 242, half: 48 },
    { y: 276, half: 36 },
  ],
  lamp: { y: 392, hx: 1392, hy: 398 },
};

/** Every bulb on the street, with the flicker variant it runs on.
 *  A bulb and the pool it throws are drawn in different planes — the pole
 *  lamps hang in front of the shop, their light lands on a road drawn behind
 *  it — so they can only stay in step by sharing a class. `v` is that class:
 *  `.lampFlick{v}` on the bulb, `.lampGlow{v}` on the ground, identical
 *  duration and delay in CSS. */
export const LAMPS = [
  { x: POLE_L.lamp.hx, y: POLE_L.lamp.hy, v: "" },
  { x: POLE_R.lamp.hx, y: POLE_R.lamp.hy, v: "l2" },
  { x: 256, y: 556, v: "l3" },
  { x: 1528, y: 575, v: "l4" },
] as const;

/* ══ cast shadows ══

   ── the geometry, which is just similar triangles ──
   A point light at L, a point P on an object, and the shadow of P is where the
   ray L→P meets the ground. Split L into the point directly under it, `Lg`,
   and its height `H`; let P sit `h` above the ground over the base point `B`.
   The two triangles L-Lg-B and P-B-S are similar, so

       S = B + (B − Lg) · h / (H − h)

   and that is the whole of it. Three things fall straight out of that formula
   and every one of them is a thing hand-drawn shadows get wrong:

   · **Shadows are radial, never parallel.** Every one of them points directly
     away from `Lg` — the spot on the road under the bulb — so two objects
     either side of a lamp throw their shadows in opposite directions. Parallel
     shadows mean a light at infinity, which is the sun, and there is no sun in
     this scene.
   · **Only the part of an object below the bulb lands on the road.** As `h`
     climbs toward `H` the denominator goes to zero and the shadow runs off to
     the horizon; above `H` it inverts and is thrown into the sky behind. So a
     shadow is capped here, and what is cut off is not a shortcut — it is the
     part that genuinely does not fall on this road.
   · **The shadow of a `w`-wide object is `w·(1+k)` wide at the tip.** A shadow
     that keeps its width is a shadow from a light at infinity again.

   ── where the lights are, which is the one liberty taken ──
   This is an elevation: the whole street stands on `GROUND`, and the road
   below that line is depth, not height. If a bulb's ground point were *also*
   on `GROUND` every shadow would be exactly horizontal and infinitely thin —
   a lit street with no shadows in it at all.

   So each caster's ground point sits a little way *behind* the kerb line
   (`gy < GROUND`), which reads as the bulb being over the pavement rather than
   out over the road. Shadows then rake outward and toward the viewer, down the
   road — the same direction that lamp's pool already spreads. That agreement
   is the point: pool and shadow are two consequences of one position, and if
   they disagreed the eye would find it immediately.

   ── and the light that is not here ──
   Nothing in this scene is lit by a source outside it, so there is no fill and
   no key: every object is lit only by the bulbs drawn in the picture. That is
   also why a shadow's darkness is `1/(1+(d/reach)²)` — inverse-square, because
   a shadow is only ever as dark as the light it removes, and a lamp forty
   units away removes far more of it than one four hundred away. */

export interface Caster {
  /** the bulb itself, in picture coordinates */
  x: number;
  y: number;
  /** the point on the road directly beneath it — `gy` is above `GROUND` */
  gx: number;
  gy: number;
  /** the distance at which this lamp's contribution has halved */
  reach: number;
  /** the flicker class it runs on. A shadow belongs in `.lampGlow{v}` with the
   *  pool: when the lamp stutters the shadow has to go with it, because for
   *  that half-second there is no light there to block. */
  v: string;
}

const caster = (x: number, y: number, reach: number, v: string, setBack = 26): Caster =>
  ({ x, y, gx: x, gy: GROUND - setBack, reach, v });

/** The four street bulbs as shadow casters. Same order, same flicker classes
 *  as `LAMPS`, because they are the same four lamps seen from the other side:
 *  `LAMPS` is what they put down, this is what they take away. */
export const CASTERS = {
  poleL: caster(POLE_L.lamp.hx, POLE_L.lamp.hy, 300, ""),
  poleR: caster(POLE_R.lamp.hx, POLE_R.lamp.hy, 300, "l2"),
  kerbL: caster(272, 562, 210, "l3"),
  kerbR: caster(1528, 575, 210, "l4"),
} as const;

/* The shop's lit window is a caster too, but it belongs to the facade's own
   1000×620 grid rather than to this one, so it is declared there. Nothing on
   *this* grid is close enough to it to matter: the nearest thing that could
   catch a shadow from it is a pole five hundred units away, and inverse-square
   has finished with the shop long before that. */

/** One object's shadow, resolved. Lengths and widths are in grid units. */
export interface Shadow {
  /** the magnification at the tip */
  k: number;
  /** how dark it starts, before the band's own falloff */
  dark: number;
  /** a point along the shadow: `t` from 0 at the base to 1 at the tip */
  at: (t: number) => { x: number; y: number; hw: number };
}

/** Resolve the shadow an object throws from one caster.
 *
 *  `top` is the height it reaches, `by` the line its feet stand on, `w` how
 *  wide it is.
 *
 *  `cap` is the fraction of the light's own height past which the shadow stops
 *  being drawable — at 1 the formula divides by zero. Half, which puts the
 *  longest shadow at `k = 1`: the tip lands exactly as far past the object as
 *  the object is from the light's ground point. It was three-quarters, and on
 *  a wide window that is the wrong side of a hard limit — `slice` crops this
 *  grid to whatever the viewport gives it, and a short one leaves barely a
 *  hundred units of road on screen. A shadow reaching two-thirds of the way
 *  across that, blurred, is not a shadow any more; it is a stain. Half keeps
 *  every one of them inside the near quarter of the road at every aspect. */
export function shadowOf(
  c: Caster, bx: number, by: number, w: number, top: number, cap = 0.5,
): Shadow {
  const H = c.gy - c.y;
  const h = Math.min(by - top, H * cap);
  const k = Math.max(0, h) / Math.max(1, H - Math.max(0, h));
  const dx = bx - c.gx, dy = by - c.gy;
  const d = Math.hypot(dx, dy) || 1;
  return {
    k,
    dark: 1 / (1 + (d / c.reach) ** 2),
    at: (t: number) => ({
      x: bx + dx * k * t,
      y: by + dy * k * t,
      hw: (w / 2) * (1 + k * t),
    }),
  };
}

/** The quad of one slice of a shadow, from `t0` to `t1` along its length.
 *
 *  ── both edges are horizontal, and that is not a simplification ──
 *  What casts the shadow is the object's top edge: a horizontal segment of
 *  width `w` sitting `h` up. Run the projection on each of its two ends and
 *  the ±w/2 comes straight back out of the algebra —
 *
 *      S± = [bx + (bx − Lgx)·k] ± (w/2)(1+k)
 *
 *  — same y for both. So the shadow of a horizontal edge is a horizontal edge,
 *  and the shadow is the fan between the object's footprint and that. It only
 *  slides sideways; it never tilts.
 *
 *  The first version offset each edge along the *perpendicular* to the shadow,
 *  which for anything wide throwing sideways — the bench, at a hundred units
 *  across — swung its base round into a long diagonal parallelogram. That is
 *  what "dark patches" were: not shadows in the wrong place, shadows the wrong
 *  *shape*, because the bench's width was being treated as depth. It also
 *  needed a fudge factor to squash the depth axis back down, and the fudge is
 *  gone with it.
 *
 *  Sliced rather than drawn whole so each piece can carry its own blur: a
 *  shadow is sharp where the object touches the ground and loses its edge as
 *  it goes, because the penumbra widens with distance from the occluder. One
 *  blur over the whole shape gives a shadow equally vague at the foot, which
 *  is the clearest sign it was pasted on. */
export function shadowBand(s: Shadow, t0: number, t1: number): string {
  const a = s.at(t0), b = s.at(t1);
  const f = (n: number) => n.toFixed(1);
  return `M${f(a.x - a.hw)},${f(a.y)} L${f(a.x + a.hw)},${f(a.y)} `
    + `L${f(b.x + b.hw)},${f(b.y)} L${f(b.x - b.hw)},${f(b.y)} Z`;
}

/** A cable between two points, hanging under its own weight.
 *
 *  A cubic with both control points dropped by 4/3·`drop` passes exactly
 *  `drop` below the chord's midpoint, which is close enough to a catenary at
 *  this scale and costs one path instead of forty line segments. Sag is what
 *  sells overhead line: a straight wire between two poles reads as a drawn
 *  rule, and every span here gets a different one. */
export function sag(x1: number, y1: number, x2: number, y2: number, drop: number): string {
  const dx = (x2 - x1) / 3;
  const k = (drop * 4) / 3;
  return `M${x1},${y1} C${x1 + dx},${y1 + k} ${x2 - dx},${y2 + k} ${x2},${y2}`;
}
