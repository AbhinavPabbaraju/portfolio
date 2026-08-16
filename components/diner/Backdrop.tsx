import type { ReactElement } from "react";
import { CASTERS, GROUND, LAMPS, VB_BOTTOM, VB_H, VB_TOP, VB_W, VIEWBOX } from "@/lib/diner/scene";
import CastShadows, { ShadowFilters } from "./CastShadow";

/* ── what stands on this plane, and what light finds it ──
   Base centre, width, and the height it reaches, for everything in this plane
   solid enough to put a hole in a lamp's throw. Kept as data next to the
   shadows rather than inline with the drawings, because the two flanks are 800
   units apart in the file and the point of the list is that you can see, in
   one place, that every occluder has been accounted for.

   `soft` is for things that are mostly air: a bicycle is a few tubes and two
   rims, and it does not put down a bicycle-shaped hole. Halving the density is
   the whole of the model — anything finer would be drawing spokes.

   The lamp each one is paired with is the lamp that is *near* it. The other
   three are hundreds of units away and inverse-square has finished with them
   long before they reach; drawing all four anyway is how a picture ends up
   with a cat's cradle of shadows under every object, which reads as a render
   with the lights left on rather than as a street. */
const OCCLUDERS: [x: number, w: number, top: number, lights: (keyof typeof CASTERS)[], soft?: number][] = [
  /* ── the left kerb ── everything here is west of both left lamps, so every
     shadow rakes away to the left and off the frame, which is correct: the
     lamps are between these objects and the shop.

     The crates, the planter and the two doorstep pots opposite were on this
     list and are not any more. They stand thirty units tall, which at half the
     lamp height is a shadow shorter than it is wide — and a dozen of those,
     blurred and overlapping, is not a lit street, it is a grubby one. What
     survives is what has the height to throw something with a shape. */
  [144, 86, 686, ["kerbL", "poleL"], 0.5],          // the bicycle
  /* The traffic mirror stands *between* the two left lamps, so it is the one
     object on the street that throws two shadows in opposite directions —
     which is the plainest possible demonstration that these are radial. */
  [236, 10, 632, ["kerbL", "poleL"]],
  /* The kerb lamp's own post, lit by the pole lamp above and behind it. A
     lamp post with no shadow of its own is the detail that gives away a scene
     where the lights were added last. */
  [256, 5, 576, ["poleL"]],
  /* The cherry. Only the trunk: the crown sits at y≈395, which is *above* the
     pole lamp's bulb and far above the kerb lamp's, and a mass above the bulb
     throws its shadow up into the air behind, not down onto the road. The
     drawing gets that for free from the height cap — but it is worth saying
     out loud, because a tree with no pool of shade under it looks like an
     oversight and is in fact the geometry. */
  [137, 60, 533, ["kerbL", "poleL"]],

  /* ── the right kerb ── */
  [1404, 48, 574, ["poleR", "kerbR"]],              // the second cherry's trunk
  [1512, 5, 588, ["poleR"]],                        // the alley lamp's post
];

/* ── the palette ──
   A backstreet at 2am is not black, it is violet: the sky over a lit city
   never gets darker than the light bouncing back off it. The scene used to
   sit in a slate/teal family that read as *unlit* rather than as *night*,
   and with nothing but value separating the planes there was no depth to
   fade into. Everything here is built out of one indigo→violet ramp, and
   the only warm light in the frame is diegetic — bulbs, windows, the shop. */
const NIGHT = {
  far: "#2c2056",   // the district beyond the block, hazed
  mid: "#1c1442",   // the block opposite
  near: "#130e2c",  // rooftops on this side of the road
  edge: "#2f2358",  // where a roofline catches the city glow
};

/** Windows that happen to still be on.
 *
 *  Deterministic — a seeded Lehmer generator, never `Math.random()`, so the
 *  server and the client paint the same city and hydration has nothing to
 *  argue about. Multiplier stays under 2^53 with a 2^31 state, so every
 *  engine agrees on every bit. */
const WIN = ["#7b8ae2", "#d073b8", "#f0b268", "#5ec9e0", "#9a7be0"];

function Windows({
  x, y, w, h, cols, rows, seed, lit = 0.4, dim = 1,
}: {
  x: number; y: number; w: number; h: number;
  cols: number; rows: number; seed: number; lit?: number; dim?: number;
}) {
  let s = seed;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const cw = w / cols, ch = h / rows;
  const out: ReactElement[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const on = rnd(), tone = rnd(), bright = rnd();
      if (on > lit) continue;
      out.push(
        <rect
          key={`${r}-${c}`}
          x={+(x + c * cw + cw * 0.24).toFixed(1)}
          y={+(y + r * ch + ch * 0.26).toFixed(1)}
          width={+(cw * 0.48).toFixed(1)}
          height={+(ch * 0.44).toFixed(1)}
          fill={WIN[Math.floor(tone * WIN.length)]}
          opacity={+((0.22 + bright * 0.42) * dim).toFixed(2)}
        />,
      );
    }
  }
  return <>{out}</>;
}

/** A cloud bank, drawn twice a grid-width apart so its drift can loop.
 *  The pair sits inside the animated wrapper; `bcloudDrift` moves it exactly
 *  `-100%` — which, on an SVG element with the default `transform-box:
 *  view-box`, is one grid width — so the second copy lands precisely where
 *  the first began and the cycle is invisible. */
function Bank({ cls, opacity, fill, shapes }: {
  cls: string; opacity: number; fill: string; shapes: [number, number, number, number][];
}) {
  const body = (
    <g filter="url(#ncloudB)" opacity={opacity}>
      {shapes.map(([cx, cy, rx, ry], i) => (
        <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} fill={fill} />
      ))}
    </g>
  );
  return (
    <g className={cls}>
      {body}
      <g transform={`translate(${VB_W},0)`}>{body}</g>
    </g>
  );
}

/** A block of buildings on one depth plane. `base` is always the road:
 *  a skyline whose feet do not all land on the same line reads as collage. */
function Block({ boxes, fill, base = 748 }: { boxes: [number, number, number][]; fill: string; base?: number }) {
  return (
    <g fill={fill}>
      {boxes.map(([x, top, w], i) => (
        <rect key={i} x={x} y={top} width={w} height={base - top} />
      ))}
    </g>
  );
}

/* Three depth planes. Read from the back: towers in haze, the block
   opposite, then the low rooftops on this side of the road. Nothing rises
   above y≈420 — the shop's own roofline sits there at every viewport, and a
   tower poking through it would break the one silhouette the eye is meant
   to follow. */
const FAR: [number, number, number][] = [
  [-20, 462, 170], [176, 424, 118], [318, 486, 152], [498, 440, 128],
  [652, 494, 164], [846, 430, 122], [994, 476, 150], [1176, 444, 118],
  [1320, 490, 142], [1494, 448, 126],
];
const MID: [number, number, number][] = [
  [40, 524, 138], [214, 552, 118], [372, 514, 152], [560, 556, 142],
  [744, 526, 158], [934, 552, 128], [1104, 518, 142], [1282, 556, 118],
  [1424, 528, 152],
];
const NEAR: [number, number, number][] = [
  [-10, 596, 132], [150, 620, 122], [302, 590, 140], [472, 622, 150],
  [664, 600, 158], [862, 624, 140], [1032, 596, 150], [1218, 622, 130],
  [1374, 602, 148], [1542, 626, 92],
];

/** Full-bleed night street: sky, moon, city, sakura, houses, wet road.
 *
 *  Everything here is the FAR plane — it is drawn behind the shop, and the
 *  shop covers the middle of this grid at every viewport. The margins are
 *  the only part reliably on screen, so that is where the scene's detail
 *  lives. The utility poles and their cables are the NEAR plane and are not
 *  in this file: they hang in front of the shop, in <Overhead/>. */
export default function Backdrop() {
  return (
    <svg viewBox={VIEWBOX} preserveAspectRatio="xMidYMax slice">
      <defs>
        {/* The six stops are the same ramp as before, remapped onto the
            deeper grid (y = VB_TOP + offset · VB_H) so nothing in the drawing
            changed colour, plus two above them for the new headroom. A tall
            window sees the top of this; a wide one crops it away. */}
        <linearGradient id="nsky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#06040f" />
          <stop offset=".11" stopColor="#080614" />
          <stop offset=".218" stopColor="#0a0817" />
          <stop offset=".375" stopColor="#120e28" />
          <stop offset=".562" stopColor="#1e1440" />
          <stop offset=".735" stopColor="#2b1b4e" />
          <stop offset=".874" stopColor="#3a2358" />
          <stop offset="1" stopColor="#472b60" />
        </linearGradient>

        {/* ── two sizes of the same blur, and why ──
            A filter region is a *percentage of the filtered element's own
            box*, so one filter shared between a lamp bulb and a pool of light
            three hundred units wide is sized for whichever needs the larger
            fraction — the bulb — and the pool then pays it. `nblur` at 260%
            square is 6.8× the area of a snug region, and the four road spills
            using it are the biggest filtered shapes in the scene: together
            they were 1.7M filter pixels to re-blur.

            The margin a Gaussian actually needs is about 3σ. `nblur` is σ=9,
            so 27 units; `nsoft` is σ=4, so 12. The `L` variants below are the
            smallest regions that still clear 3σ on the *large, flat* shapes
            they are used by — anything smaller and the blur clips against the
            region and leaves a hard edge where light should fade out. The
            originals stay for the small round ones, which genuinely need the
            wide box. Same picture, about a third of the pixels. */}
        <filter id="nblur" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter id="nblurL" x="-16%" y="-40%" width="132%" height="180%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter id="nsoft" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <filter id="nsoftL" x="-12%" y="-22%" width="124%" height="144%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        {/* the shop's own neon filter lives in the facade's SVG. Referencing
            it across documents works, but it also ties this plane's paint to
            an element that goes `hidden` the moment the camera pushes in —
            so the glow is redeclared here and the two stay independent. */}
        <filter id="nglow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {/* clouds want a far wider kernel than the lamp haloes do — at
            stdDeviation 9 an overcast bank still shows its edge */}
        <filter id="ncloudB" x="-40%" y="-120%" width="180%" height="340%">
          <feGaussianBlur stdDeviation="26" />
        </filter>

        {/* Overcast, lit from beneath by the city rather than from above by
            anything — so the underside is the bright edge and the top stays
            cold. Inverting that is what makes painted night clouds read as
            daytime clouds with the lights off. */}
        <linearGradient id="ncloud" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b3268" stopOpacity=".5" />
          <stop offset=".6" stopColor="#54468d" stopOpacity=".72" />
          <stop offset="1" stopColor="#6e5aa8" stopOpacity=".9" />
        </linearGradient>
        {/* the bank the moon is behind takes its light from above instead,
            which is the whole reason it reads as *the* lit cloud */}
        <linearGradient id="ncloudM" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b6b9f2" stopOpacity=".9" />
          <stop offset=".45" stopColor="#8d90d8" stopOpacity=".7" />
          <stop offset="1" stopColor="#5f5ba6" stopOpacity=".45" />
        </linearGradient>
        <radialGradient id="nmoonG">
          <stop offset="0" stopColor="#cfd4ff" stopOpacity=".45" />
          <stop offset=".45" stopColor="#8f96e0" stopOpacity=".16" />
          <stop offset="1" stopColor="#8f96e0" stopOpacity="0" />
        </radialGradient>
        <mask id="nmoonM">
          <circle cx="1352" cy="152" r="40" fill="#fff" />
          <circle cx="1376" cy="132" r="37" fill="#000" />
        </mask>

        {/* City glow off the far side of the block — the light the street
            borrows from a district it cannot see. This is what every
            roofline in front of it silhouettes against. */}
        <radialGradient id="ncity" cx=".5" cy="1" r=".62">
          <stop offset="0" stopColor="#7a4a8e" stopOpacity=".34" />
          <stop offset=".45" stopColor="#47306a" stopOpacity=".16" />
          <stop offset="1" stopColor="#1a1233" stopOpacity="0" />
        </radialGradient>
        {/* Distance haze, packed against the feet of the far band where the
            air is deepest. Depth here is what every other value in the scene
            is measured against. */}
        <linearGradient id="nhaze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a2a5e" stopOpacity="0" />
          <stop offset=".55" stopColor="#42305f" stopOpacity=".3" />
          <stop offset="1" stopColor="#503a6c" stopOpacity=".48" />
        </linearGradient>

        {/* Wet asphalt: brightest at the horizon where it mirrors the sky,
            darkest under the viewer. Wet road is *darker* than dry road —
            only the parts under a light come back up. Lighting the whole
            surface evenly is what makes CG streets look like plastic. */}
        <linearGradient id="nwet" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#37275a" stopOpacity=".96" />
          <stop offset=".45" stopColor="#221944" stopOpacity=".97" />
          <stop offset="1" stopColor="#150f2c" stopOpacity=".98" />
        </linearGradient>
        {/* A lamp's throw on wet ground: narrow at the pole, spreading and
            dimming down the surface toward the viewer. */}
        <linearGradient id="nthrow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f2a656" stopOpacity=".3" />
          <stop offset=".5" stopColor="#e08b3e" stopOpacity=".11" />
          <stop offset="1" stopColor="#e08b3e" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="npool" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5b4790" stopOpacity=".5" />
          <stop offset="1" stopColor="#1d1540" stopOpacity=".2" />
        </linearGradient>
        {/* neon, smeared down the road. One gradient per hue, because a
            reflection has to fade with distance and a flat rect reads as
            paint rather than as light on water. */}
        <linearGradient id="nstrkP" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff8fcb" stopOpacity=".3" />
          <stop offset="1" stopColor="#ff8fcb" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="nstrkC" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#69d6ee" stopOpacity=".26" />
          <stop offset="1" stopColor="#69d6ee" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="nstrkW" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffc27a" stopOpacity=".3" />
          <stop offset="1" stopColor="#ffc27a" stopOpacity="0" />
        </linearGradient>
        {/* ground fog: no hard edge anywhere, or the band reads as a shape
            sliding rather than as air moving */}
        <radialGradient id="nfog" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#8b7fc4" stopOpacity=".2" />
          <stop offset=".55" stopColor="#7a6fb4" stopOpacity=".1" />
          <stop offset="1" stopColor="#6a5fa4" stopOpacity="0" />
        </radialGradient>

        {/* ── blossom clusters, in three tones ──
            One cluster drawn at three exposures, not one drawn at three
            opacities: a canopy is a solid mass with light falling across it,
            so the crown catches the city glow, the body sits in local colour
            and the underside is in its own shade. Fading a single tone leaves
            the whole crown flat and the gaps between clusters read as holes
            punched in it. Cherry at night under sodium light is orchid, not
            pink — the highlight carries the hue and the mass stays low. */}
        <g id="npuffD">
          <circle r="13" fill="#42204c" />
          <circle cx="-11" cy="4" r="9" fill="#4c2557" />
          <circle cx="10" cy="3" r="9.5" fill="#4c2557" />
          <circle cx="-4" cy="-8" r="8.5" fill="#5a2c63" />
          <circle cx="6" cy="-9" r="7" fill="#68336f" />
          <circle cx="-2" cy="-3" r="2.4" fill="#834185" />
        </g>
        <g id="npuff">
          <circle r="13" fill="#5c2b66" />
          <circle cx="-11" cy="4" r="9" fill="#6d3576" />
          <circle cx="10" cy="3" r="9.5" fill="#6d3576" />
          <circle cx="-4" cy="-8" r="8.5" fill="#84418c" />
          <circle cx="6" cy="-9" r="7" fill="#9c4fa0" />
          <circle cx="-2" cy="-3" r="2" fill="#a866a8" />
          <circle cx="7" cy="-14" r="1.5" fill="#bb78b8" />
        </g>
        <g id="npuffL">
          <circle r="13" fill="#7c3a86" />
          <circle cx="-11" cy="4" r="9" fill="#8c4494" />
          <circle cx="10" cy="3" r="9.5" fill="#8c4494" />
          <circle cx="-4" cy="-8" r="8.5" fill="#a452a8" />
          <circle cx="6" cy="-9" r="7" fill="#bc63bd" />
          <circle cx="-2" cy="-3" r="2" fill="#c47ec4" />
          <circle cx="7" cy="-14" r="1.5" fill="#d795ce" />
        </g>
        {/* a smaller one — cherry flowers come in clusters of 2–5, so the
            canopy edge wants finer stipple than the big puff gives */}
        <g id="npuffS">
          <circle r="7" fill="#5c2b66" />
          <circle cx="-6" cy="2" r="5" fill="#6d3576" />
          <circle cx="5" cy="2" r="5.2" fill="#6d3576" />
          <circle cx="-2" cy="-4" r="4.6" fill="#84418c" />
          <circle cx="3" cy="-5" r="3.8" fill="#9c4fa0" />
          <circle cx="-1" cy="-1" r="1.4" fill="#c078bd" />
        </g>

        {/* ── one sakura, drawn once ──
            The left tree and the right tree are the same tree: placed by
            transform, the right one mirrored and pushed back, so the two
            silhouettes never read as a copy-paste. Trunk is a filled taper,
            not a constant-width stroke — ~52 units across at the root flare
            down to 18 where the limbs leave — and the limbs fan outward
            before they turn up, which is what gives an old cherry its
            vase-shaped crown. */}
        <g id="nsakura">
          {/* The crown as a mass, before a single cluster is drawn. Without
              it the canopy is a scatter of clusters with night sky between
              them; with it, the clusters are texture *on* a tree. Two ellipses
              so the mass is already lit top-to-bottom before the tonal bands
              go over it. */}
          <ellipse cx="128" cy="318" rx="96" ry="62" fill="#54265e" opacity=".55" filter="url(#nsoftL)" />
          <ellipse cx="128" cy="296" rx="74" ry="44" fill="#6f3578" opacity=".4" filter="url(#nsoftL)" />
          <ellipse cx="128" cy="352" rx="82" ry="36" fill="#3d1e48" opacity=".4" filter="url(#nsoftL)" />
          <path d="M96,618 C106,604 110,588 108,564 C106,532 110,514 112,486
                   C114,462 117,452 119,438 L137,438 C136,458 133,464 132,488
                   C130,516 134,536 136,564 C138,590 142,604 148,618 Z"
                fill="#150f28" />
          <path d="M132,600 C130,566 134,540 131,506 C129,478 133,462 134,442"
                fill="none" stroke="#221a38" strokeWidth="3" strokeLinecap="round" opacity=".55" />
          {/* horizontal lenticels — the one bark marking that reads as
              cherry and nothing else */}
          <g stroke="#2b2144" strokeWidth="1.5" strokeLinecap="round">
            <line x1="105" y1="600" x2="125" y2="599" opacity=".5" />
            <line x1="131" y1="588" x2="144" y2="587" opacity=".38" />
            <line x1="107" y1="572" x2="131" y2="571" opacity=".52" />
            <line x1="120" y1="562" x2="134" y2="561" opacity=".34" />
            <line x1="108" y1="544" x2="121" y2="543" opacity=".46" />
            <line x1="125" y1="532" x2="135" y2="531" opacity=".36" />
            <line x1="110" y1="518" x2="130" y2="517" opacity=".5" />
            <line x1="116" y1="506" x2="126" y2="505" opacity=".32" />
            <line x1="112" y1="490" x2="129" y2="489" opacity=".48" />
            <line x1="121" y1="476" x2="132" y2="475" opacity=".34" />
            <line x1="115" y1="458" x2="128" y2="457" opacity=".44" />
            <line x1="122" y1="448" x2="133" y2="447" opacity=".3" />
          </g>
          <g fill="none" stroke="#150f28" strokeWidth="7" strokeLinecap="round">
            <path d="M124,446 C104,436 82,432 58,428 C46,426 38,420 32,410" />
            <path d="M126,440 C112,414 100,392 84,372" />
            <path d="M129,436 C132,406 134,380 138,352" />
            <path d="M130,442 C152,424 174,410 198,400" />
            <path d="M129,438 C146,412 164,394 186,376" />
          </g>
          <g fill="none" stroke="#150f28" strokeWidth="4" strokeLinecap="round">
            <path d="M58,428 C50,414 44,404 38,392" />
            <path d="M82,432 C76,416 70,406 62,394" />
            <path d="M84,372 C76,358 70,350 62,338" />
            <path d="M100,392 C94,376 90,366 84,354" />
            <path d="M138,352 C136,332 138,318 142,302" />
            <path d="M134,380 C128,362 124,350 118,336" />
            <path d="M198,400 C206,386 212,376 220,364" />
            <path d="M174,410 C180,394 184,384 190,372" />
            <path d="M186,376 C194,360 200,350 208,338" />
            <path d="M164,394 C170,378 174,368 180,356" />
          </g>
          <g fill="none" stroke="#1b1434" strokeWidth="2.2" strokeLinecap="round">
            <path d="M38,392 C34,384 32,378 28,372" />
            <path d="M62,338 C58,330 56,324 52,316" />
            <path d="M142,302 C144,290 146,284 150,276" />
            <path d="M220,364 C226,354 230,348 236,340" />
            <path d="M208,338 C214,328 218,322 224,314" />
            <path d="M118,336 C114,326 112,318 108,308" />
            <path d="M84,354 C80,344 78,338 74,330" />
            <path d="M190,372 C194,362 197,356 201,348" />
            <path d="M32,410 C26,404 22,400 16,396" />
          </g>
          {/* ── the crown, painted back to front ──
              Underside first, then the body, then the lit rim. Clusters
              overlap heavily on purpose: a cherry in full bloom has no gaps,
              and the silhouette is scalloped by where the clusters *stop*,
              not by holes left between them. Opacity varies only slightly —
              the tone is doing the work, so the mass keeps its weight. */}
          <use href="#npuffD" transform="translate(122,356) scale(1.15) rotate(17)" opacity=".9" />
          <use href="#npuffD" transform="translate(88,360) scale(1.05) rotate(-7)" opacity=".9" />
          <use href="#npuffD" transform="translate(156,354) scale(1.1) rotate(8)" opacity=".9" />
          <use href="#npuffD" transform="translate(58,366) scale(.95) rotate(-24)" opacity=".88" />
          <use href="#npuffD" transform="translate(190,362) rotate(11)" opacity=".88" />
          <use href="#npuffD" transform="translate(110,378) scale(.95) rotate(9)" opacity=".84" />
          <use href="#npuffD" transform="translate(142,376) scale(.9) rotate(-5)" opacity=".84" />
          <use href="#npuffD" transform="translate(46,382) scale(.85) rotate(-38)" opacity=".8" />
          <use href="#npuffD" transform="translate(204,378) scale(.85) rotate(31)" opacity=".8" />
          <use href="#npuffD" transform="translate(170,382) scale(.8) rotate(-12)" opacity=".78" />
          <use href="#npuffD" transform="translate(72,390) scale(.75) rotate(44)" opacity=".74" />
          <use href="#npuffD" transform="translate(186,394) scale(.7) rotate(-7)" opacity=".7" />
          <use href="#npuffD" transform="translate(32,400) scale(.8) rotate(-9)" opacity=".72" />

          <use href="#npuff" transform="translate(128,304) scale(1.3) rotate(26)" opacity=".92" />
          <use href="#npuff" transform="translate(94,310) scale(1.2) rotate(-6)" opacity=".92" />
          <use href="#npuff" transform="translate(162,306) scale(1.25) rotate(7)" opacity=".92" />
          <use href="#npuff" transform="translate(62,320) scale(1.1) rotate(-31)" opacity=".9" />
          <use href="#npuff" transform="translate(196,316) scale(1.15) rotate(-11)" opacity=".9" />
          <use href="#npuff" transform="translate(140,326) scale(1.15) rotate(5)" opacity=".9" />
          <use href="#npuff" transform="translate(106,334) scale(1.1) rotate(13)" opacity=".88" />
          <use href="#npuff" transform="translate(178,330) scale(1.1) rotate(38)" opacity=".88" />
          <use href="#npuff" transform="translate(40,342) scale(1) rotate(-19)" opacity=".86" />
          <use href="#npuff" transform="translate(218,338) scale(1) rotate(12)" opacity=".86" />
          <use href="#npuff" transform="translate(150,292) scale(1) rotate(-44)" opacity=".9" />
          <use href="#npuff" transform="translate(78,294) scale(1) rotate(6)" opacity=".9" />
          <use href="#npuff" transform="translate(182,294) scale(.95) rotate(21)" opacity=".88" />
          <use href="#npuff" transform="translate(118,290) scale(.95) rotate(-9)" opacity=".9" />
          <use href="#npuff" transform="translate(28,360) scale(.9) rotate(-8)" opacity=".8" />
          <use href="#npuff" transform="translate(232,354) scale(.9) rotate(34)" opacity=".8" />

          <use href="#npuffL" transform="translate(128,258) scale(1.2) rotate(-27)" opacity=".92" />
          <use href="#npuffL" transform="translate(96,266) scale(1.1) rotate(-9)" opacity=".9" />
          <use href="#npuffL" transform="translate(160,264) scale(1.15) rotate(6)" opacity=".9" />
          <use href="#npuffL" transform="translate(70,284) scale(1) rotate(7)" opacity=".86" />
          <use href="#npuffL" transform="translate(188,280) scale(1.05) rotate(12)" opacity=".86" />
          <use href="#npuffL" transform="translate(142,248) scale(.9) rotate(41)" opacity=".88" />
          <use href="#npuffL" transform="translate(110,250) scale(.85) rotate(-15)" opacity=".86" />
          <use href="#npuffL" transform="translate(176,252) scale(.85) rotate(-6)" opacity=".84" />
          <use href="#npuffL" transform="translate(52,302) scale(.9) rotate(23)" opacity=".8" />
          <use href="#npuffL" transform="translate(206,298) scale(.95) rotate(-36)" opacity=".8" />
          <use href="#npuffL" transform="translate(128,286) scale(1.05) rotate(11)" opacity=".8" />
          <use href="#npuffL" transform="translate(84,258) scale(.75) rotate(29)" opacity=".78" />

          {/* fringe stipple, scalloping the silhouette edge */}
          <use href="#npuffS" transform="translate(128,240) rotate(-21)" opacity=".8" />
          <use href="#npuffS" transform="translate(96,244) rotate(3)" opacity=".76" />
          <use href="#npuffS" transform="translate(162,242) rotate(-42)" opacity=".76" />
          <use href="#npuffS" transform="translate(56,272) rotate(18)" opacity=".7" />
          <use href="#npuffS" transform="translate(198,266) rotate(-6)" opacity=".7" />
          <use href="#npuffS" transform="translate(30,314) rotate(36)" opacity=".64" />
          <use href="#npuffS" transform="translate(226,306) rotate(-30)" opacity=".64" />
          <use href="#npuffS" transform="translate(18,364) rotate(14)" opacity=".56" />
          <use href="#npuffS" transform="translate(240,356) rotate(25)" opacity=".56" />
          <use href="#npuffS" transform="translate(146,396) rotate(-11)" opacity=".54" />
          <use href="#npuffS" transform="translate(78,404) rotate(39)" opacity=".5" />
          <use href="#npuffS" transform="translate(210,398) rotate(-18)" opacity=".5" />

          {/* Bare limbs breaking back out through the bloom. This is the read
              that separates a cherry from a lollipop: the structure is never
              fully hidden, it surfaces at the crown and dives back under. */}
          <g fill="none" stroke="#1b1434" strokeLinecap="round" opacity=".8">
            <path d="M150,286 C160,280 168,278 178,280" strokeWidth="3.2" />
            <path d="M108,300 C98,294 90,292 80,293" strokeWidth="3" />
            <path d="M134,336 C138,326 140,318 139,308" strokeWidth="2.8" />
            <path d="M184,344 C192,338 198,334 205,330" strokeWidth="2.6" />
            <path d="M74,352 C66,346 60,343 52,342" strokeWidth="2.4" />
          </g>
          {/* fallen petals pooled at the roots */}
          <g fill="#a664a0" opacity=".22">
            <ellipse cx="98" cy="618" rx="4" ry="1.6" />
            <ellipse cx="146" cy="624" rx="3.4" ry="1.4" />
            <ellipse cx="176" cy="612" rx="3" ry="1.3" />
            <ellipse cx="66" cy="612" rx="3.2" ry="1.3" />
            <ellipse cx="126" cy="620" rx="2.6" ry="1.1" />
          </g>
        </g>
        <ShadowFilters ns="n" />
      </defs>

      <rect x="0" y={VB_TOP} width={VB_W} height={VB_H} fill="url(#nsky)" />

      {/* ── moon and stars ──
          The moon is a masked disc, not a disc with a sky-coloured disc
          bitten out of it: the sky here is a gradient, so a painted-in
          occluder only matches at one altitude. */}
      <g>
        <circle cx="1352" cy="152" r="112" fill="url(#nmoonG)" />
        <circle cx="1352" cy="152" r="40" fill="#e6e9ff" mask="url(#nmoonM)" opacity=".92" />
      </g>
      <g fill="#dbe2ff">
        <circle cx="96" cy="118" r="1.1" opacity=".45" />
        <circle cx="188" cy="62" r="1.3" opacity=".5" />
        <circle cx="292" cy="146" r="1" opacity=".35" />
        <circle cx="404" cy="88" r="1.2" opacity=".45" />
        <circle cx="486" cy="182" r=".9" opacity=".3" />
        <circle cx="612" cy="64" r="1.1" opacity=".4" />
        <circle cx="708" cy="152" r="1.3" opacity=".45" />
        <circle cx="836" cy="96" r="1" opacity=".35" />
        <circle cx="944" cy="188" r="1.2" opacity=".4" />
        <circle cx="1042" cy="72" r="1.1" opacity=".45" />
        <circle cx="1128" cy="164" r=".9" opacity=".3" />
        <circle cx="1214" cy="104" r="1.2" opacity=".4" />
        <circle cx="1466" cy="238" r="1" opacity=".35" />
        <circle cx="1552" cy="130" r="1.3" opacity=".45" />
        <circle cx="1590" cy="266" r="1" opacity=".3" />
        <circle cx="64" cy="248" r="1" opacity=".3" />
        <circle cx="252" cy="288" r=".9" opacity=".26" />
        <circle cx="530" cy="272" r="1" opacity=".28" />
        <circle cx="880" cy="286" r=".9" opacity=".26" />
        <circle cx="1180" cy="312" r="1" opacity=".24" />
        <circle className="bstar" cx="352" cy="196" r="1.4" />
        <circle className="bstar s2" cx="760" cy="118" r="1.5" />
        <circle className="bstar s3" cx="1096" cy="222" r="1.3" />
        <circle className="bstar s4" cx="1428" cy="330" r="1.2" />
        <circle className="bstar s5" cx="148" cy="176" r="1.3" />
        <circle className="bstar" cx="1516" cy="196" r="1.4" />
        <circle className="bstar s3" cx="212" cy="86" r="1.2" />
        <circle className="bstar s5" cx="560" cy="152" r="1.3" />
        <circle className="bstar s2" cx="912" cy="64" r="1.2" />
        <circle className="bstar s4" cx="1264" cy="146" r="1.4" />
        <circle className="bstar s3" cx="1592" cy="88" r="1.2" />
        <circle className="bstar s5" cx="64" cy="132" r="1.1" />
        <circle className="bstar s2" cx="440" cy="-42" r="1.3" />
        <circle className="bstar s4" cx="1020" cy="-96" r="1.2" />
        <circle className="bstar" cx="700" cy="-150" r="1.2" />
      </g>

      {/* ── cloud banks ──
          Four, at different heights and speeds, all drifting the same way:
          wind has a direction, and banks that slide back and forth read as a
          loop rather than as weather.

          Each bank is drawn twice, one grid-width apart, and the pair
          translates exactly one grid width per cycle — so the copy arrives at
          the position the original left and the loop has no seam to hide.
          The blur stays on the static child, never on the moving parent: its
          input never changes, so a 26px Gaussian is rasterised once and only
          the transform is touched per frame. */}
      <g>
        <Bank cls="bcloud" opacity={0.4} fill="url(#ncloudM)" shapes={[
          [1290, 168, 250, 40], [1436, 132, 188, 30], [1148, 198, 170, 26], [1370, 34, 240, 30],
        ]} />
        <Bank cls="bcloud c2" opacity={0.32} fill="url(#ncloud)" shapes={[
          [330, 152, 300, 38], [560, 184, 200, 26], [110, 198, 190, 24],
        ]} />
        <Bank cls="bcloud c3" opacity={0.24} fill="url(#ncloud)" shapes={[
          [800, 252, 430, 30], [1466, 272, 250, 24], [660, 46, 380, 34],
        ]} />
        <Bank cls="bcloud c4" opacity={0.16} fill="url(#ncloud)" shapes={[
          [520, 332, 470, 26], [1250, 352, 400, 22], [1060, -130, 440, 30], [240, 96, 330, 26],
        ]} />
      </g>

      {/* City glow, under everything built: every roofline from here down is
          read as a silhouette against it rather than as a shape floating in
          an unlit void. */}
      <rect x="-10" y="300" width="1620" height="470" fill="url(#ncity)" />

      {/* ── far band: the district beyond the block ── */}
      <Block boxes={FAR} fill={NIGHT.far} />
      <g fill={NIGHT.far}>
        {/* parapets and set-backs — the step is what reads as a roof */}
        <rect x="176" y="412" width="52" height="14" />
        <rect x="498" y="428" width="60" height="14" />
        <rect x="846" y="418" width="46" height="14" />
        <rect x="1176" y="432" width="54" height="14" />
        {/* rooftop water tank on its legs, the one silhouette that says
            "this is a city" without any detail at all */}
        <rect x="1020" y="446" width="46" height="28" rx="3" />
        <rect x="1028" y="474" width="5" height="18" />
        <rect x="1054" y="474" width="5" height="18" />
      </g>
      <g opacity=".62">
        <Windows x={-20} y={478} w={170} h={250} cols={5} rows={9} seed={3} dim={0.55} />
        <Windows x={176} y={440} w={118} h={288} cols={4} rows={10} seed={11} dim={0.55} />
        <Windows x={318} y={502} w={152} h={226} cols={5} rows={8} seed={29} dim={0.5} />
        <Windows x={498} y={456} w={128} h={272} cols={4} rows={9} seed={47} dim={0.5} />
        <Windows x={652} y={510} w={164} h={218} cols={5} rows={7} seed={71} dim={0.5} />
        <Windows x={846} y={446} w={122} h={282} cols={4} rows={10} seed={97} dim={0.5} />
        <Windows x={994} y={492} w={150} h={236} cols={5} rows={8} seed={131} dim={0.5} />
        <Windows x={1176} y={460} w={118} h={268} cols={4} rows={9} seed={167} dim={0.55} />
        <Windows x={1320} y={506} w={142} h={222} cols={5} rows={7} seed={199} dim={0.55} />
        <Windows x={1494} y={464} w={126} h={264} cols={4} rows={9} seed={233} dim={0.55} />
      </g>
      {/* masts, with the pinpoint red aircraft lamp every tall thing in a
          Japanese city carries */}
      <g stroke="#33265c" strokeWidth="2">
        <line x1="222" y1="412" x2="222" y2="368" />
        <line x1="878" y1="418" x2="878" y2="380" />
        <line x1="1204" y1="432" x2="1204" y2="396" />
      </g>
      <g fill="#e2564f">
        <circle cx="222" cy="366" r="1.9" opacity=".75" />
        <circle cx="1204" cy="394" r="1.9" opacity=".6" />
      </g>

      {/* ── the block opposite ── */}
      <Block boxes={MID} fill={NIGHT.mid} />
      <g>
        <Windows x={40} y={538} w={138} h={196} cols={4} rows={7} seed={311} />
        <Windows x={214} y={566} w={118} h={168} cols={4} rows={6} seed={347} />
        <Windows x={372} y={528} w={152} h={206} cols={5} rows={7} seed={389} />
        <Windows x={560} y={570} w={142} h={164} cols={4} rows={6} seed={419} />
        <Windows x={744} y={540} w={158} h={194} cols={5} rows={7} seed={461} />
        <Windows x={934} y={566} w={128} h={168} cols={4} rows={6} seed={503} />
        <Windows x={1104} y={532} w={142} h={202} cols={5} rows={7} seed={547} />
        <Windows x={1282} y={570} w={118} h={164} cols={4} rows={6} seed={577} />
        <Windows x={1424} y={542} w={152} h={192} cols={5} rows={7} seed={607} />
      </g>
      {/* four windows that are not on a timer — somebody is still up, and
          the room they are in blinks off and back once a cycle */}
      <g>
        <rect className="winf" x="86" y="556" width="14" height="17" fill="#f0b268" />
        <rect className="winf w2" x="1176" y="548" width="14" height="17" fill="#7b8ae2" />
        <rect className="winf w3" x="392" y="546" width="14" height="17" fill="#d073b8" />
        <rect className="winf w2" x="1478" y="562" width="14" height="17" fill="#f0b268" />
      </g>
      {/* rooflines catching the glow off the district behind */}
      <g fill={NIGHT.edge} opacity=".5">
        {MID.map(([x, top, w], i) => (
          <rect key={i} x={x} y={top} width={w} height="1.6" />
        ))}
      </g>

      {/* signage on the block opposite. Both sit in the margins on purpose:
          the shop covers this grid's middle at every viewport. */}
      <g>
        <rect x="1204" y="420" width="92" height="34" rx="3" fill="#170f30" stroke="#8f4a86" strokeWidth="1.2" />
        <text x="1250" y="443" textAnchor="middle" className="flick2" fill="#ff8fcb" filter="url(#nglow)"
              style={{ fontFamily: "var(--f-serif)", fontWeight: 700, fontSize: "17px", letterSpacing: ".08em" }}>
          リセット
        </text>
      </g>
      <g fill="#8fbcd4" filter="url(#nglow)"
         style={{ fontFamily: "var(--f-serif)", fontWeight: 700, fontSize: "15px" }}>
        <rect x="1538" y="418" width="22" height="96" rx="3" fill="#150f2c" stroke="#3d6f86" strokeWidth="1.2" />
        <text x="1549" y="440" textAnchor="middle">コ</text>
        <text x="1549" y="462" textAnchor="middle">ー</text>
        <text x="1549" y="484" textAnchor="middle" className="flick">ヒ</text>
        <text x="1549" y="506" textAnchor="middle">ー</text>
      </g>

      {/* ── rooftops on this side of the road ── */}
      <Block boxes={NEAR} fill={NIGHT.near} />
      <g fill={NIGHT.near}>
        <rect x="196" y="606" width="34" height="16" />
        <rect x="700" y="586" width="40" height="16" />
        <rect x="1064" y="580" width="36" height="16" />
        {/* aircon boxes and a stair bulkhead, the clutter every low roof has */}
        <rect x="352" y="576" width="30" height="14" rx="2" />
        <rect x="1252" y="608" width="28" height="14" rx="2" />
      </g>
      <g stroke="#2a2050" strokeWidth="1.6">
        <line x1="512" y1="622" x2="512" y2="592" />
        <line x1="1120" y1="596" x2="1120" y2="566" />
        <line x1="1420" y1="602" x2="1420" y2="576" />
      </g>

      {/* haze against the feet of the built band — this is what pushes the
          city back rather than merely tinting it */}
      <rect x="-10" y="380" width="1620" height="368" fill="url(#nhaze)" opacity=".7" />

      {/* ══ the road ══
          Drawn before anything in the near ground, so every tree, house and
          pole in front stands *on* it rather than in front of it. Read from
          the horizon down: kerb, the wet surface, then everything the lights
          put back on it. */}
      <g>
        <rect x="-10" y={GROUND - 3} width="1620" height="2" fill="#5f4a86" opacity=".45" />
        <rect x="-10" y={GROUND - 1} width="1620" height="9" fill="#0a0718" opacity=".55" />
        <rect x="-10" y={GROUND - 1} width="1620" height={VB_BOTTOM - GROUND + 1} fill="url(#nwet)" />

        {/* Everything a bulb puts on the ground is drawn here, in the road,
            while the bulbs themselves hang in their own planes — the pole
            lamps are not even in this SVG. They can only stay in step by
            sharing a class: identical duration and delay on elements that
            mount together cannot drift. */}
        {LAMPS.map(({ x, v }) => (
          <g className={`lampGlow ${v}`} key={`throw-${x}`}>
            {/* the wedge is blurred, not drawn hard: light on a surface has
                no outline, and an un-blurred one reads as a paper cut-out
                lying in the road */}
            <path d={`M${x - 32},${GROUND + 2} L${x + 32},${GROUND + 2} L${x + 94},${VB_BOTTOM} L${x - 94},${VB_BOTTOM} Z`}
                  fill="url(#nthrow)" filter="url(#nblurL)" />
            {/* the vertical smear directly beneath the bulb — the single
                strongest cue that a surface is wet */}
            <ellipse cx={x} cy={GROUND + 52} rx="16" ry="52" fill="#f2a656" opacity=".1" />
          </g>
        ))}

        {/* what the shop puts on the road below its own box. Its facade
            draws spill only as far as its street line; the frame's floor is
            below that, and the gap read as the light switching off. */}
        <ellipse cx="800" cy={GROUND + 8} rx="330" ry="70" fill="#f2a656" opacity=".07" filter="url(#nblurL)" />
        <ellipse cx="800" cy={GROUND + 64} rx="220" ry="52" fill="#ffcf9a" opacity=".045" filter="url(#nblurL)" />
        {/* The facade draws its own reflections, but its frame stops 80 units
            short of the bottom of the grid — so the last stretch of road in
            front of the shop, the part nearest the viewer, is this plane's to
            light. Without it the whole business of the wet street ends on a
            horizontal line that only the markup knows about.

            Ripple crests, not bars: an ellipse tapers at both ends, and a
            rectangle lying in the road is a rectangle lying in the road. They
            lengthen and thicken as they come forward, on the same
            foreshortening as the centre line. */}
        {/* The join itself. The facade's frame ends at grid y≈820 — 80 units
            of road short of the bottom — and everything it draws on the ground
            has to be gone by then or it gets cut off by its own viewBox. Which
            means the light *does* stop on a line, and no amount of fading
            inside the facade can fix that: the fix has to come from this side.
            This ellipse is centred on the join and reaches well above and
            below it, so the two halves of the road hand over inside a soft
            gradient instead of at an edge. */}
        <ellipse cx="800" cy="820" rx="300" ry="58" fill="#f2a656" opacity=".05" filter="url(#nblurL)" />
        <ellipse cx="800" cy={GROUND + 106} rx="252" ry="46" fill="#f2a656" opacity=".035" filter="url(#nblurL)" />
        <g fill="#ffcf9a" opacity=".055">
          <ellipse cx="800" cy={GROUND + 88} rx="228" ry="1.8" />
          <ellipse cx="792" cy={GROUND + 101} rx="188" ry="2.4" />
          <ellipse cx="808" cy={GROUND + 117} rx="268" ry="3" />
        </g>

        {/* neon coming back off the water. The shop's own spill is drawn by
            the facade; these are the city's, and they stop short of the
            bottom so the band never ends on a line. */}
        <g>
          <rect x="1246" y={GROUND + 2} width="4" height="86" fill="url(#nstrkP)" />
          <rect x="1258" y={GROUND + 2} width="2.4" height="64" fill="url(#nstrkP)" />
          <rect x="1546" y={GROUND + 2} width="3" height="72" fill="url(#nstrkC)" />
          <rect x="92" y={GROUND + 2} width="3" height="58" fill="url(#nstrkW)" />
          <rect x="1188" y={GROUND + 2} width="2" height="48" fill="url(#nstrkC)" />
          <rect x="418" y={GROUND + 2} width="2.6" height="66" fill="url(#nstrkW)" />
        </g>

        {/* painted centre line, foreshortened — the dashes lengthen and
            thicken as they come toward the viewer, which is the whole of the
            perspective cue at this distance */}
        <g fill="#8f7fb0" opacity=".14">
          <rect x="470" y="758" width="26" height="2" />
          <rect x="560" y="774" width="34" height="2.6" />
          <rect x="668" y="796" width="46" height="3.4" />
          <rect x="800" y="826" width="62" height="4.4" />
        </g>

        {/* utility covers — a drain at the kerb, a manhole out in the lane */}
        <g>
          <ellipse cx="1042" cy="782" rx="30" ry="8" fill="#0d0a1e" opacity=".8" />
          <ellipse cx="1042" cy="781" rx="30" ry="8" fill="none" stroke="#453470" strokeWidth=".8" opacity=".55" />
          <ellipse cx="1042" cy="781" rx="19" ry="5" fill="none" stroke="#3a2c60" strokeWidth=".7" opacity=".45" />
          <rect x="392" y="750" width="52" height="7" rx="1.5" fill="#0c0920" opacity=".75" />
          <g stroke="#4a3878" strokeWidth=".7" opacity=".38">
            <line x1="398" y1="751" x2="398" y2="756" />
            <line x1="408" y1="751" x2="408" y2="756" />
            <line x1="418" y1="751" x2="418" y2="756" />
            <line x1="428" y1="751" x2="428" y2="756" />
            <line x1="438" y1="751" x2="438" y2="756" />
          </g>
        </g>

        {/* Puddles. Each one is a hole in the road showing the sky, so it
            takes the violet of the air above it and a warm rim only where a
            lamp can actually reach it. Shapes are irregular on purpose — an
            even ellipse reads as a stain. */}
        <g>
          <path d="M156,806 C198,794 266,796 304,808 C328,816 300,830 246,831 C186,832 136,820 156,806 Z"
                fill="url(#npool)" />
          <g className="lampGlow">
            <path d="M166,808 C206,798 260,800 292,809" fill="none" stroke="#f2a656" strokeWidth="1.6" opacity=".22" />
            <ellipse cx="222" cy="816" rx="9" ry="15" fill="#f2a656" opacity=".16" />
          </g>

          <path d="M1330,820 C1374,806 1452,808 1494,822 C1522,832 1482,846 1422,847 C1358,848 1306,832 1330,820 Z"
                fill="url(#npool)" />
          <g className="lampGlow l2"><ellipse cx="1392" cy="830" rx="10" ry="17" fill="#f2a656" opacity=".15" /></g>

          <path d="M690,762 C716,757 754,758 772,764 C784,768 762,774 730,775 C700,775 678,767 690,762 Z"
                fill="url(#npool)" opacity=".7" />
          <path d="M1042,812 C1078,804 1126,806 1152,816 C1170,823 1140,834 1096,834 C1050,834 1024,820 1042,812 Z"
                fill="url(#npool)" opacity=".55" />
        </g>

        {/* cracks and grit — the road is old */}
        <g stroke="#0a0718" strokeWidth="1" opacity=".5" fill="none">
          <path d="M520,820 L556,802 L584,808 L612,792" />
          <path d="M556,802 L548,786" />
          <path d="M1180,776 L1216,766 L1244,771" />
        </g>
        <g fill="#6d5c9c" opacity=".18">
          <circle cx="640" cy="830" r="1.6" />
          <circle cx="672" cy="818" r="1.2" />
          <circle cx="900" cy="842" r="1.8" />
          <circle cx="1130" cy="802" r="1.3" />
          <circle cx="380" cy="824" r="1.4" />
          <circle cx="1290" cy="830" r="1.5" />
        </g>

        {/* weeds at the kerb, where nobody sweeps */}
        <g stroke="#2f3f4a" strokeWidth="1.2" fill="none" opacity=".5" strokeLinecap="round">
          <path d="M126,748 C124,740 120,736 116,732" />
          <path d="M128,748 C129,740 132,736 136,733" />
          <path d="M131,748 C132,741 135,738 139,736" />
          <path d="M1236,748 C1234,741 1231,737 1227,734" />
          <path d="M1239,748 C1240,741 1243,738 1247,735" />
        </g>

        {/* ── what the kerb takes back out of the road ──
            Last in the road group, so a shadow falls across the puddles, the
            markings and the grit the way it falls across everything else —
            and *after* the throws, because a shadow is not a dark shape laid
            on the ground, it is light that did not arrive. Draw it before the
            pools and it would be lighting itself back up.

            Still inside the road group, which means it is all behind the
            flanks: every object here is drawn later in this file and closes
            over the near end of its own shadow, which is what stops one
            looking like a mat the object is standing on. */}
        {(Object.keys(CASTERS) as (keyof typeof CASTERS)[]).map((k) => (
          <CastShadows
            key={k} ns="n" v={CASTERS[k].v}
            objects={OCCLUDERS.filter(([, , , ls]) => ls.includes(k))
              .map(([x, w, top, , soft]) => ({
                light: CASTERS[k], x, y: GROUND, w, top, opacity: soft ?? 1,
              }))}
          />
        ))}
      </g>

      {/* ═══ left flank: two sleeping houses, an old cherry, one lamp ═══ */}
      <g transform="translate(0,133)">
        <polygon points="14,506 58,472 102,506" fill="#1a1436" />
        <rect x="22" y="505" width="72" height="102" fill="#120d28" stroke="#2a2148" strokeWidth="1" />
        <rect x="34" y="524" width="14" height="17" fill="#d98a3f" opacity=".8" />
        <rect x="31" y="521" width="20" height="23" fill="none" stroke="#0c0920" strokeWidth="2" />
        <circle cx="41" cy="532" r="15" fill="#f2a656" opacity=".12" filter="url(#nsoft)" />
        <polygon points="128,528 164,500 200,528" fill="#171130" />
        <rect x="136" y="527" width="58" height="80" fill="#100c24" stroke="#241c42" strokeWidth="1" />
        <rect x="150" y="544" width="12" height="14" fill="#3c4f7a" opacity=".8" />
        <rect x="176" y="500" width="5" height="18" fill="#120d28" />
      </g>
      <use href="#nsakura" transform="translate(-3,29.3) scale(1.15)" />

      {/* the kerb lamp, standing between the tree and the pole */}
      <g>
        <line x1="256" y1="740" x2="256" y2="576" stroke="#2b2450" strokeWidth="5" />
        <path d="M256,576 q0,-13 13,-13" fill="none" stroke="#2b2450" strokeWidth="4" />
        <g className="lampFlick l3">
          <circle cx="272" cy="562" r="4.6" fill="#ffd9a0" />
          <circle cx="272" cy="564" r="23" fill="#f2a656" opacity=".3" filter="url(#nblur)" />
          <polygon points="260,570 286,570 306,740 240,740" fill="#f2a656" opacity=".05" />
        </g>
      </g>

      {/* ═══ right flank: a residential alley — houses, one lamp, a cherry ═══ */}
      <g transform="translate(10,128)">
        {/* house A — closest, gabled, one window still awake */}
        <polygon points="1338,458 1404,404 1470,458" fill="#221a44" />
        <path d="M1338,458 L1404,404 L1470,458" fill="none" stroke="#3a2d66" strokeWidth="2" />
        <path d="M1352,447 L1404,414 L1456,447" fill="none" stroke="#100c24" strokeWidth="2" opacity=".8" />
        <rect x="1332" y="456" width="144" height="7" rx="2" fill="#181239" />
        <rect x="1346" y="463" width="116" height="148" fill="#161038" stroke="#2c2352" strokeWidth="1.4" />
        <rect x="1358" y="482" width="26" height="30" fill="#d98a3f" opacity=".85" />
        <line x1="1371" y1="482" x2="1371" y2="512" stroke="#161038" strokeWidth="2.5" />
        <line x1="1358" y1="497" x2="1384" y2="497" stroke="#161038" strokeWidth="2.5" />
        <rect x="1354" y="478" width="34" height="38" fill="none" stroke="#0d0a20" strokeWidth="3" />
        <circle cx="1371" cy="497" r="17" fill="#f2a656" opacity=".14" filter="url(#nblur)" />
        <rect x="1414" y="540" width="38" height="71" fill="#22305c" />
        <g stroke="#0d0a20" strokeWidth="2">
          <line x1="1427" y1="540" x2="1427" y2="611" />
          <line x1="1440" y1="540" x2="1440" y2="611" />
        </g>
        <g stroke="#241c42" strokeWidth="3">
          <line x1="1332" y1="592" x2="1348" y2="592" />
          <line x1="1332" y1="602" x2="1348" y2="602" />
          <line x1="1337" y1="586" x2="1337" y2="610" />
        </g>
        {/* the 記憶 sign hangs off the eave, pointing down the gap */}
        <line x1="1466" y1="463" x2="1466" y2="476" stroke="#2a2150" strokeWidth="2.5" />
        <rect x="1452" y="476" width="28" height="56" rx="4" fill="#181239" stroke="#4a6f86" strokeWidth="1.4" />
        <text x="1466" y="500" textAnchor="middle" fill="#8fbcd4" opacity=".85"
              style={{ fontFamily: "var(--f-serif)", fontWeight: 700, fontSize: "18px" }}>記</text>
        <text x="1466" y="522" textAnchor="middle" fill="#8fbcd4" opacity=".85"
              style={{ fontFamily: "var(--f-serif)", fontWeight: 700, fontSize: "18px" }}>憶</text>

        {/* the gap itself: lamp, footpath, dark */}
        <rect x="1476" y="430" width="54" height="181" fill="#0b0820" />
        <line x1="1502" y1="610" x2="1502" y2="460" stroke="#2b2450" strokeWidth="5" />
        <path d="M1502,460 q0,-13 13,-13" fill="none" stroke="#2b2450" strokeWidth="4" />
        <g className="lampFlick l4">
          <circle cx="1518" cy="447" r="5" fill="#ffd9a0" />
          <circle className="alGlow" cx="1518" cy="450" r="28" fill="#f2a656" filter="url(#nblur)" />
          <polygon points="1504,456 1532,456 1554,610 1482,610" fill="#f2a656" opacity=".06" />
        </g>
        <path d="M1494,610 C1500,646 1512,672 1528,700" fill="none" stroke="#1d1740" strokeWidth="10" opacity=".8" strokeLinecap="round" />

        {/* house B — set back, smaller, mostly asleep */}
        <polygon points="1524,478 1574,438 1624,478" fill="#1c1540" />
        <path d="M1524,478 L1574,438 L1624,478" fill="none" stroke="#332a5c" strokeWidth="1.8" />
        <rect x="1519" y="476" width="110" height="6" rx="2" fill="#140f30" />
        <rect x="1532" y="482" width="86" height="129" fill="#130e2c" stroke="#261e46" strokeWidth="1.2" />
        <rect x="1544" y="502" width="18" height="22" fill="#42558a" opacity=".8" />
        <rect x="1540" y="498" width="26" height="30" fill="none" stroke="#0d0a20" strokeWidth="2.5" />
        <rect x="1584" y="548" width="24" height="63" fill="#1a2450" />
        <rect x="1596" y="500" width="16" height="10" rx="2" fill="#211a44" stroke="#332a5c" strokeWidth="1" />
      </g>
      {/* the same cherry as the left flank, mirrored and set back so the two
          silhouettes never resolve as one drawing used twice */}
      <use href="#nsakura" transform="translate(1516,171.4) scale(-.92,.92)" />

      {/* petals, drifting down out of both canopies */}
      <g>
        <circle className="petal" cx="148" cy="500" r="2.6" />
        <circle className="petal p2" cx="96" cy="478" r="2.2" />
        <circle className="petal p3" cx="196" cy="520" r="2.4" />
        <circle className="petal p6" cx="126" cy="466" r="2" />
        <circle className="petal p4" cx="1392" cy="520" r="2.4" />
        <circle className="petal p5" cx="1440" cy="496" r="2" />
      </g>

      {/* ══ ambient ══
          Drifting ground fog, low and slow. Two bands crossing in opposite
          directions at different speeds, so the movement never resolves into
          a single sliding sheet — that is the tell that gives away one
          animated layer pretending to be air. Both are transform-only, so
          this costs the compositor and nothing else. */}
      <g className="bfog" opacity=".5">
        <ellipse cx="420" cy="770" rx="440" ry="34" fill="url(#nfog)" />
        <ellipse cx="1180" cy="792" rx="380" ry="28" fill="url(#nfog)" />
      </g>
      <g className="bfog f2" opacity=".38">
        <ellipse cx="860" cy="806" rx="520" ry="30" fill="url(#nfog)" />
        <ellipse cx="180" cy="824" rx="300" ry="24" fill="url(#nfog)" />
      </g>

      {/* ══ foreground ══
          The nearest thing in this plane. It sits at the outer edges on
          purpose: the facade covers the middle of this grid at every
          viewport, so the margins are the only part reliably on screen.
          Values are the darkest in the scene and the rim light falls on the
          side facing the nearest bulb. */}
      <g transform="translate(0,130)">
        {/* stacked crates, the milk-crate kind every backstreet has */}
        <g fill="#0d0a1e" stroke="#2b2150" strokeWidth="1.1">
          <rect x="18" y="578" width="42" height="16" rx="1.5" />
          <rect x="20" y="594" width="42" height="16" rx="1.5" />
          <rect x="64" y="590" width="38" height="20" rx="1.5" />
        </g>
        <g stroke="#3a2d66" strokeWidth=".7" opacity=".5">
          <line x1="32" y1="578" x2="32" y2="594" />
          <line x1="46" y1="578" x2="46" y2="594" />
          <line x1="34" y1="594" x2="34" y2="610" />
          <line x1="48" y1="594" x2="48" y2="610" />
          <line x1="77" y1="590" x2="77" y2="610" />
          <line x1="89" y1="590" x2="89" y2="610" />
        </g>
        <g fill="#f2a656" opacity=".16">
          <rect x="58" y="578" width="1.6" height="16" />
          <rect x="60" y="594" width="1.6" height="16" />
          <rect x="100" y="590" width="1.6" height="20" />
        </g>

        {/* a bicycle against the wall — the most common object on a Japanese
            side street, and a silhouette that reads at any size */}
        <g stroke="#1c1640" strokeWidth="2.4" fill="none" strokeLinecap="round">
          <circle cx="118" cy="592" r="17" />
          <circle cx="170" cy="592" r="17" />
          <path d="M118,592 L140,566 L170,592" />
          <path d="M140,566 L128,592" />
          <path d="M140,566 L152,562" />
          <path d="M170,592 L166,562 L156,558" />
        </g>
        <path d="M160,556 L178,556 L175,568 L163,568 Z" fill="#140f30" stroke="#2b2150" strokeWidth="1.2" />
        <path d="M134,562 L146,562 L143,566 L137,566 Z" fill="#1c1640" />
        <g stroke="#f2a656" opacity=".2" strokeWidth="1.2" fill="none">
          <path d="M131,580 A17,17 0 0 1 133,603" />
          <path d="M183,580 A17,17 0 0 1 185,603" />
        </g>

        {/* planter by the door, half dead */}
        <path d="M186,596 L212,596 L209,610 L189,610 Z" fill="#100c24" stroke="#2b2150" strokeWidth="1.1" />
        <g stroke="#33452f" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity=".8">
          <path d="M194,596 C191,584 189,578 192,570" />
          <path d="M199,596 C200,582 203,576 208,570" />
          <path d="M203,596 C204,588 207,584 211,581" />
        </g>

        {/* convex traffic mirror — every blind corner in Japan has one, and
            it gives the flank a vertical it badly needed */}
        <line x1="238" y1="610" x2="238" y2="512" stroke="#3d3168" strokeWidth="4" />
        <line x1="240" y1="606" x2="240" y2="516" stroke="#f2a656" strokeWidth="1" opacity=".2" />
        <path d="M238,516 L230,510" stroke="#3d3168" strokeWidth="3" fill="none" />
        <ellipse cx="230" cy="504" rx="19" ry="17" fill="#251c4c" stroke="#40346c" strokeWidth="2" />
        <ellipse cx="235" cy="500" rx="7" ry="6" fill="#f2a656" opacity=".18" />
        <path d="M226,494 A15,13 0 0 1 241,500" fill="none" stroke="#8878b8" strokeWidth="1.4" opacity=".4" />
        <path d="M213,510 A19,17 0 0 0 247,510" fill="none" stroke="#0b0820" strokeWidth="2.4" />

        {/* contact shadows — the fix for everything appearing to hover */}
        <g fill="#050310" opacity=".5">
          <ellipse cx="42" cy="611" rx="30" ry="3.4" />
          <ellipse cx="86" cy="611" rx="24" ry="3" />
          <ellipse cx="144" cy="611" rx="62" ry="4" />
          <ellipse cx="199" cy="611" rx="16" ry="2.6" />
          <ellipse cx="238" cy="611" rx="10" ry="2.4" />
        </g>
      </g>

      {/* right kerb: the doorstep clutter of two houses */}
      <g transform="translate(-24,128)">
        <path d="M1556,594 L1578,594 L1575,611 L1559,611 Z" fill="#110c26" stroke="#2b2150" strokeWidth="1.1" />
        <g stroke="#33452f" strokeWidth="1.7" fill="none" strokeLinecap="round" opacity=".8">
          <path d="M1563,594 C1560,582 1559,574 1563,566" />
          <path d="M1568,594 C1569,580 1572,573 1578,568" />
          <path d="M1572,594 C1573,586 1576,581 1581,578" />
        </g>
        <path d="M1584,600 L1600,600 L1598,611 L1586,611 Z" fill="#110c26" stroke="#2b2150" strokeWidth="1.1" />
        <g stroke="#33452f" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity=".7">
          <path d="M1590,600 C1588,591 1588,586 1591,581" />
          <path d="M1594,600 C1595,591 1597,587 1601,584" />
        </g>
        <rect x="1528" y="556" width="18" height="22" rx="2" fill="#140f30" stroke="#302650" strokeWidth="1.1" />
        <circle cx="1537" cy="564" r="4" fill="none" stroke="#4a3c78" strokeWidth="1" />
        <line x1="1537" y1="578" x2="1537" y2="592" stroke="#241c46" strokeWidth="2.2" />
        <g fill="#050310" opacity=".5">
          <ellipse cx="1567" cy="611" rx="16" ry="2.8" />
          <ellipse cx="1592" cy="611" rx="12" ry="2.4" />
        </g>
      </g>

      {/* Fireflies. Six, not sixty — at this scale a swarm reads as noise on
          the screen rather than as life in the scene. Each drifts on its own
          duration so they never pulse in unison. */}
      <g fill="#e0c887">
        <circle className="bfly" cx="168" cy="682" r="1.8" />
        <circle className="bfly b2" cx="214" cy="646" r="1.5" />
        <circle className="bfly b3" cx="106" cy="710" r="1.6" />
        <circle className="bfly b4" cx="1352" cy="676" r="1.6" />
        <circle className="bfly b5" cx="1290" cy="702" r="1.4" />
        <circle className="bfly b6" cx="1418" cy="722" r="1.7" />
      </g>
    </svg>
  );
}
