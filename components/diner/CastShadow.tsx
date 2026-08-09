import { type Caster, shadowBand, shadowOf } from "@/lib/diner/scene";

/** Contact, middle, tail: `[t0, t1, alpha, blur key]`. Sharp and dark where the
 *  object meets the ground, wide and faint by the end. The bands overlap
 *  slightly so the blur of one covers the seam of the next. */
const BANDS: [number, number, number, string][] = [
  [0, 0.28, 1, "A"],
  [0.24, 0.66, 0.62, "B"],
  [0.6, 1, 0.3, "C"],
];

/** Drop this into a plane's `<defs>`. Three blurs, because the penumbra grows
 *  with distance from whatever is casting it.
 *
 *  `ns` namespaces the ids. Every plane is a separate `<svg>` but they are all
 *  one HTML document, and ids are document-scoped — three planes each
 *  declaring `shA` is three elements with one id, which is invalid and leaves
 *  `url(#shA)` resolving to whichever happens to come first. The rest of this
 *  scene already prefixes for the same reason (`nblur`, `oblur`).
 *
 *  `scale` is for planes on a different grid: the facade is drawn 1000 units
 *  across where the street gives it 780, so a two-unit penumbra there is 2.56
 *  of its own units. Without it the shop's shadows come out softer than the
 *  street's by exactly that ratio. */
export function ShadowFilters({ ns, scale = 1 }: { ns: string; scale?: number }) {
  return (
    <>
      {/* Softened by half from where these started. A thirteen-unit blur on a
          tail that is itself only thirty long does not read as a penumbra — it
          reads as a smudge with no shape in it, and four smudges near each
          other read as dirt on the lens. */}
      {([["A", 1.4], ["B", 3.6], ["C", 7]] as const).map(([k, sd]) => (
        <filter key={k} id={`${ns}sh${k}`} x="-60%" y="-120%" width="220%" height="340%">
          <feGaussianBlur stdDeviation={sd * scale} />
        </filter>
      ))}
    </>
  );
}

/** One thing standing on the ground, and the lamp that finds it. */
export interface Occluder {
  light: Caster;
  /** base centre, and the line its feet stand on */
  x: number;
  y: number;
  /** how wide it is, and the height it reaches */
  w: number;
  top: number;
  /** a hand on the dial for things that are not solid — a bicycle is a few
   *  tubes and two rims and does not put down a bicycle-shaped hole in the
   *  light. Halving it is the whole of that model; anything finer is drawing
   *  spokes. */
  opacity?: number;
  cap?: number;
}

/** Every shadow one lamp throws.
 *
 *  ── why this takes a *list* ──
 *  Each shadow is three bands at three blurs, and a filter is the most
 *  expensive thing an SVG can ask for: it forces the renderer to rasterise the
 *  filtered subtree into an offscreen buffer, and the deck rescales this whole
 *  plane on every frame of the parallax, so anything filtered is re-rasterised
 *  the whole way down the scroll. Drawn a shadow at a time this was ninety
 *  filter regions in a scene the motion rules already warn about. Grouped by
 *  blur it is three — one buffer per softness, however many shadows go in it.
 *
 *  ── and why it takes a whole lamp ──
 *  The group carries that lamp's `.lampGlow` class, so its shadows stutter
 *  with it. Not decoration: while the bulb is out there is no light at those
 *  spots for anything to block, so the shadows genuinely are not there either.
 *  A shadow that held steady through a flicker would be the one thing in the
 *  scene still insisting the light was painted on. */
export default function CastShadows({
  ns, v, objects, tint = "#07051a", strength = 0.75,
}: {
  ns: string;
  /** the flicker class every object in this group is lit by */
  v: string;
  objects: Occluder[];
  /** Never black. In shadow you still get whatever the sky and the rest of the
   *  street are giving, and on this road that is violet — a black shadow is a
   *  hole cut in the picture rather than a place the light did not reach. */
  tint?: string;
  strength?: number;
}) {
  const cast = objects
    .map((o) => ({ o, s: shadowOf(o.light, o.x, o.y, o.w, o.top, o.cap) }))
    .filter(({ s }) => s.k > 0.02);
  if (!cast.length) return null;

  return (
    <g className={`lampGlow ${v}`.trim()} fill={tint} pointerEvents="none">
      {BANDS.map(([t0, t1, a, k]) => (
        <g key={k} filter={`url(#${ns}sh${k})`}>
          {cast.map(({ o, s }) => (
            <path
              key={`${o.x}-${o.top}`} d={shadowBand(s, t0, t1)}
              opacity={(s.dark * a * (o.opacity ?? 1) * strength).toFixed(3)}
            />
          ))}
        </g>
      ))}
    </g>
  );
}
