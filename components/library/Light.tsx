import { PAL, type PalKey } from "@/lib/library/pixel";

/** ── light, in whole pixels ──
 *
 *  A lamp in this room is three drawings, not one: the **bloom** sitting on
 *  the bulb, the **shaft** that leaves it, and the **pool** where that shaft
 *  lands. The old room drew only the middle piece, and drew it as three
 *  polygons — which is what put every beam in the wrong place twice over. It
 *  started eight pixels *below* the bulb and left two pixels *wider* than the
 *  shade it was supposed to be coming out of, so the light began with a hard
 *  horizontal edge floating in mid-air with a gap between it and the lamp.
 *  Nothing downstream of that reads as light, however well it falls off.
 *
 *  So the rules here are:
 *
 *  — **A shaft starts on the filament, at the width of the shade's mouth.**
 *    Those two numbers come off the sprite, never guessed.
 *  — **It ends on a surface**, and that surface gets a pool. Light that stops
 *    in the air is the same bug at the other end of the beam.
 *  — **Falloff is many small steps, never a gradient and never a blur.** Three
 *    bands is a stencil; forty is a fade. Each step is a whole-pixel rect, so
 *    the diagonal comes out as a staircase — which is the one thing the
 *    renderer must not be allowed to antialias for us.
 *
 *  Both are built from nested shells running outer flare → body → hot core,
 *  and how many there are is the difference between the two: a shaft's three
 *  are structural and fixed, a glow's are its falloff and scale with how big
 *  it is. */

/** Outer, body, core. Amber outside and cream in the middle is the whole of
 *  the warmth: a beam drawn in one value is a wedge of paint. */
export const WARM: readonly PalKey[] = ["T", "a", "U"];
/** The exit sign, which is the only light in the room that is not a lamp. */
export const GREEN: readonly PalKey[] = ["C", "C", "D"];
/** Everything cold: the moon through both lights of glass, and the laptop
 *  somebody is still working at. One ramp rather than three, because what
 *  separates them is how much of it there is — `gain` — not what colour it
 *  is. The window is the reason every lamp in this room reads as warm, and it
 *  can only go on doing that job if it is drawn in the opposite direction. */
export const COLD: readonly PalKey[] = ["w", "w", "F"];
/* `v`, the night sky's own blue, was tried for the outer ring and is wrong:
   it is darker than the floorboards it lands on, so the pool at the threshold
   came out as a bruise with a navy rim rather than as light. Moonlight on
   brown wood really is this grey — the blue in it belongs to the glass. */

/** The shaft's three shells — outer flare, body, hot core — as a fraction of
 *  its half-width, and what each is worth. They composite, so the middle of a
 *  beam is worth about `PEAK × gain`. */
const SHELL = [1, 0.6, 0.28];
const ALPHA = [0.055, 0.07, 0.08];
/** What the centre of any light in this room comes to, before `gain`. Every
 *  falloff below is solved backwards from this so that a big soft glow and a
 *  small hot one agree about how bright the middle is. */
const PEAK = 0.19;

/** How many rings a `Glow` is built from.
 *
 *  Three is plenty for a bulb and nowhere near enough for a window: at ninety
 *  pixels across, three nested ellipses are three visible contour lines, and
 *  the moon came out as a grey smudge with an outline drawn round it. So the
 *  count comes off the size — a ring every three or four pixels of radius —
 *  and the per-ring alpha is solved from `PEAK` rather than fixed, or a glow
 *  would get brighter simply for being bigger. */
const rings = (r: number) => Math.max(3, Math.min(16, Math.round(r / 3.5)));

/** The rows of a filled ellipse, in whole pixels — the only round thing light
 *  is allowed to draw, and the same algorithm the clock's case uses. */
function ellipseRows(cx: number, cy: number, rx: number, ry: number) {
  const rows: { x: number; y: number; w: number }[] = [];
  for (let dy = -ry; dy <= ry; dy++) {
    const hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy / (ry || 1)) ** 2)));
    if (hw > 0) rows.push({ x: cx - hw, y: cy + dy, w: hw * 2 });
  }
  return rows;
}

/** A soft round light: the bloom on a bulb and the pool where a shaft lands
 *  are the same drawing at two sizes and two flattenings.
 *
 *  `x0`/`x1` clamp it to the surface it is lying on. A pool is light on a
 *  *thing* — one that runs off the end of the table it is supposed to be
 *  lying on is light on nothing, which is how the old table lamp's flat bar
 *  ended up hanging over the edge in mid-air. */
export function Glow({
  x, y, rx, ry, gain = 1, ramp = WARM, x0, x1,
}: {
  x: number; y: number; rx: number; ry: number;
  gain?: number; ramp?: readonly PalKey[]; x0?: number; x1?: number;
}) {
  const n = rings(Math.max(rx, ry));
  const peak = Math.min(0.92, PEAK * gain);
  /* what one ring is worth, so that `n` of them stacked come to `peak` */
  const a = +(1 - (1 - peak) ** (1 / n)).toFixed(4);
  return (
    <g pointerEvents="none">
      {Array.from({ length: n }, (_, k) => {
        const f = (n - k) / n;                              // outermost first
        /* outermost ring gets the flare colour, innermost the hot core */
        const c = ramp[Math.min(ramp.length - 1, Math.floor((k / n) * ramp.length))];
        return (
          /* opacity on the group, not the rect: rows within one ring never
             overlap, so they must not be allowed to composite with each other
             and seam along every row boundary */
          <g key={k} fill={PAL[c]} opacity={a}>
            {ellipseRows(x, y, Math.max(1, Math.round(rx * f)), Math.max(0, Math.round(ry * f)))
              .map((r, i) => {
                const l = Math.max(r.x, x0 ?? -Infinity);
                const rr = Math.min(r.x + r.w, x1 ?? Infinity);
                return rr > l
                  ? <rect key={i} x={l} y={r.y} width={rr - l} height={1} />
                  : null;
              })}
          </g>
        );
      })}
    </g>
  );
}

/** The beam itself, stepped down the room in whole pixels.
 *
 *  `mouth` is the half-width of the shade's opening and `spread` the
 *  half-width where it lands, so the cone is stated in terms of the lamp at
 *  one end and the surface at the other. Brightness dies as it travels, with
 *  a floor under the curve — a beam that reaches zero before it lands leaves
 *  the pool below it looking switched on by nothing. */
export function Shaft({
  x, y, h, mouth, spread, gain = 1, step = 3, ramp = WARM,
}: {
  x: number; y: number; h: number; mouth: number; spread: number;
  gain?: number; step?: number; ramp?: readonly PalKey[];
}) {
  const bands = Math.max(1, Math.ceil(h / step));
  return (
    <g pointerEvents="none">
      {Array.from({ length: bands }, (_, i) => {
        const t = (i + 0.5) / bands;
        const hw = mouth + (spread - mouth) * t;
        const f = gain * (0.2 + 0.8 * (1 - t) ** 1.2);
        const by = y + i * step;
        const bh = Math.min(step, y + h - by);
        return ramp.map((c, k) => {
          const w = Math.max(1, Math.round(hw * 2 * SHELL[k]));
          return (
            <rect
              key={`${i}-${k}`} x={x - Math.round(w / 2)} y={by} width={w} height={bh}
              fill={PAL[c]} opacity={+(ALPHA[k] * f).toFixed(3)}
            />
          );
        });
      })}
    </g>
  );
}
