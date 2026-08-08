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
