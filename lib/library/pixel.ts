/** Pixel-art primitives for the library.
 *
 *  ── why this exists ──
 *  The diner is smooth vector illustration; this room is pixel art, and the
 *  two are drawn by different rules. Vector art is authored as curves and
 *  scaled freely. Pixel art is authored as *pixels* — hand-placed, on a grid,
 *  at one fixed low resolution — and its whole charm is that nothing in it is
 *  smooth. Scale it by a non-integer factor and every block quietly becomes a
 *  different width, which is exactly the mush the style exists to avoid.
 *
 *  So: everything here is drawn on an integer grid at `LOGICAL_W × LOGICAL_H`,
 *  and the room is only ever displayed at a whole-number multiple of that.
 *  `shape-rendering:crispEdges` does the rest.
 *
 *  Sprites are written as character maps because that is how pixel art is
 *  actually authored — you can read the drawing in the source, and editing it
 *  means editing a picture rather than a list of coordinates. `.` and a space
 *  are transparent; every other character is a palette key.
 */

/** The room's logical resolution — and, because the display scale is an
 *  integer, this is also the camera.
 *
 *  More logical pixels in the same viewport means each one is drawn smaller,
 *  which means you see more room: pulling this number up is stepping
 *  backwards through the door. At 320 tall a 1000px viewport lands on a 3×
 *  scale, so the eye takes in a whole two-storey wall and the foreground
 *  floor at once, the way the reference does — rather than the 5× close-up
 *  the first pass had, which framed two shelves and a table leg. */
export const LOGICAL_W = 1500;
export const LOGICAL_H = 320;

/** How far the drawing carries on *below* the room, in logical pixels.
 *
 *  The room is a fixed number of rows tall and the frame it is shown in is a
 *  viewport, so the two only agree by accident — see `fitScale`. Whatever is
 *  left over is given to the floor, and this is how much floor there is to
 *  give: more boards, drawn past the bottom of the authored room, seen only
 *  as far down as the frame reaches. Two hundred covers the worst case a
 *  1× screen can ask for (a ~510px frame, where the scale below is a whole
 *  step too small and the one above slices the tables). It costs a box and a
 *  dozen board lines whether it is seen or not. */
export const BLEED = 200;

/** How far the ceiling carries on *above* the room, in logical pixels.
 *
 *  The page's chrome — a 62px bar — is fixed over the top of every scene. Every
 *  other one has section padding for it to float over; this one is a picture
 *  running to the top edge, so the bar was landing on the cornice and the bay
 *  signs. The room is inset by the height of the bar and this is what goes
 *  behind it: more ceiling, so the bar sits on the room's own dark rather than
 *  on a cut. Sixty-four rows is the whole bar even at 1×. */
export const HEADROOM = 64;

/** How much worse a cropped row is than an empty one, choosing a scale.
 *  Overshoot cuts the bottom off the drawing — the near chairs first, then
 *  the tables — and undershoot only asks for more floorboards. */
const CROP_COST = 3;

/** The scale to draw the room at, for `clearH` CSS pixels of frame on a screen
 *  of `dpr` device pixels to the CSS pixel.
 *
 *  `clearH` is the frame *less the page chrome standing over it* — the room
 *  has to fit in the part of the frame you can actually see, not in the part
 *  it occupies.
 *
 *  Height only. Width takes care of itself: the room is 1500 logical pixels
 *  across, so at any scale this returns it is wider than any frame short
 *  enough to have asked for that scale, and the surplus width is the walk.
 *
 *  Two rules pull against each other here.
 *
 *  Pixel art survives only at a whole-number magnification — but whole
 *  numbers of *device* pixels, not of CSS ones. On a 2× screen a CSS scale of
 *  2.5 puts every logical pixel on exactly five device pixels and is precisely
 *  as crisp as 3 is, so the scale moves in steps of `1/dpr`. That alone is
 *  most of this: on any retina screen the steps are fine enough that the room
 *  lands within a few rows of the frame whatever its height.
 *
 *  And the room has to *fill* the frame. It is shown top-anchored, so the
 *  ceiling is always exactly at the top edge and the mismatch all lands at the
 *  bottom: either the drawing runs out above the bottom of the frame, or it
 *  carries on past it. The first is the one that reads as broken — bare frame
 *  under the floorboards — and the second is only ever more floor, which
 *  `BLEED` provides. So of the two scales either side of an exact fit, take
 *  whichever costs less, counting a cropped row as `CROP_COST` empty ones.
 *
 *  This is what replaced rounding to the nearest whole CSS pixel. That put a
 *  1512×830 laptop on 3×, a 960-tall room in an 830 frame, and cropped 65px
 *  off *both* ends — the shelf signs at the top, the chair legs at the
 *  bottom — with no scale available that did any better. */
export function fitScale(clearH: number, dpr: number) {
  const step = 1 / (dpr > 0 ? dpr : 1);
  const under = Math.max(step, Math.floor(clearH / LOGICAL_H / step) * step);
  const over = under + step;
  const cost = (s: number) => {
    const rows = clearH / s;                       // logical rows in the clear
    return rows >= LOGICAL_H ? rows - LOGICAL_H : (LOGICAL_H - rows) * CROP_COST;
  };
  return Math.max(1, cost(over) < cost(under) ? over : under);
}

/* ── the palette ──
   Deliberately small. A limited palette is what makes pixel art cohere: the
   same twenty-odd values recur everywhere, so a lamp and a book spine and a
   floorboard all belong to one room. Keys are single characters so a sprite
   row stays readable as a picture. */
export const PAL = {
  /* dark structure — walls, shadow, the room's own night */
  "0": "#0b0908", // void / deepest shadow
  "1": "#151110", // wall in shadow
  "2": "#1e1815", // wall
  "3": "#2a211c", // wall lit
  "4": "#3a2c23", // wood dark
  "5": "#4d3a2c", // wood
  "6": "#654a36", // wood lit
  "7": "#836043", // wood highlight
  /* warm light — the lamps and everything they touch */
  "8": "#8a6a3a", // lamp falloff
  "9": "#c9a55c", // lamp warm
  a: "#f0d79a",   // lamp core
  b: "#fff4d2",   // bulb
  /* the banker's-lamp green */
  c: "#1f3a2c",
  d: "#2f5c40",
  e: "#4a8a5c",
  /* book spines — muted, so the lit ones can stand out */
  f: "#5e2b2b", // deep red
  g: "#7d3a33", // red
  h: "#2f4553", // slate blue
  i: "#3c6070", // blue
  j: "#33452f", // green
  k: "#4a6b3c", // olive
  l: "#5a4630", // tan
  m: "#6d5a3a", // sand
  n: "#43304a", // plum
  o: "#5c4160", // violet
  /* the lit spines — a real link, catching lamp light. `p` is the gilt cloth
     the whole wall used to be bound in; the rest of the bindings live with the
     uppercase keys below, and `LIT_COLOURS` is the rotation. `q` is the gilt
     itself: the bands and the lettering, on every binding. */
  p: "#c8a44e",
  q: "#e8cf8a",
  /* paper, signage, glass */
  r: "#d8cbaa",
  s: "#9c8f74",
  t: "#6f6553",
  /* night outside the window */
  u: "#141c2e",
  v: "#26314d",
  w: "#8fa2c4",
  /* foliage */
  x: "#24422c",
  y: "#38603f",
  z: "#0f1412", // rug / floor shadow
  /* Uppercase keys carry the fixtures. Thirty-six lowercase slots ran out at
     the bookshelves, and a sprite map is case-sensitive, so the second half
     of the alphabet is simply the second half of the palette. */
  A: "#3a2a1c", // cork
  B: "#6b533a", // cork lit
  C: "#1e6b41", // exit green
  D: "#7fe0a6", // exit green lit
  E: "#101a2c", // glass, unlit
  F: "#cfdaf5", // moon, stars, glass highlight
  G: "#574434", // plaster / stone trim
  H: "#5f2a26", // rug
  I: "#421d1b", // rug shadow
  J: "#241a14", // under-stair dark
  K: "#9a7a4e", // brass
  L: "#e6e0cc", // paper
  /* ── the rest of the lit bindings ──
     One saturated cousin per muted family in the lowercase spine block, at
     roughly twice its lightness. That gap is the whole job: a linked book has
     to lift off the wall it is standing in, from across the room, at three
     logical pixels wide. Several are the site's own tokens — `--shu`,
     `--accent`, `--ember` — so the room is bound in the same inks as the
     page it sits in. */
  M: "#b8492f", // vermilion   — the lit cousin of f/g
  N: "#5b93b3", // steel blue  — h/i
  O: "#6ea45a", // leaf        — j/k
  P: "#9a6bb0", // violet      — n/o
  Q: "#3d9b8a", // teal
  R: "#c4693c", // ember
  S: "#bf5a70", // rose
  /* ── the light itself ──
     Distinct from `8`/`9`/`a`, which are the *fixtures*: brass, an enamel
     shade, a lit filament. Those are gold and this is amber, and light drawn
     in the colour of the lamp it comes out of reads as more lamp rather than
     as illumination. Both values are the diner's — `#f2a656` is what lights
     that street — so the two scenes are lit by the same bulb even though one
     is curves and this one is pixels. */
  T: "#f2a656", // lamp amber — the body of a beam
  U: "#ffcf9a", // hot spill  — the first pixels off a bulb
} as const;

export type PalKey = keyof typeof PAL;

/** The bindings a linked spine can be bound in, in rotation order.
 *
 *  Every link on the wall used to be `p`, and a shelf of identical gold
 *  spines reads as a row of bookmarks somebody has left in a book rather than
 *  as books. What marks a spine as pullable is the gilt band across it, not
 *  its colour — so the colour is free to vary, and varying it is what makes
 *  the wall look like a library instead of a menu. */
export const LIT_COLOURS = ["p", "M", "N", "O", "P", "Q", "R", "S"] as const;

/** A darker or lighter cousin of a colour, for sprites whose palette is not
 *  known until render — the readers, whose coats are the only thing telling
 *  one from another. Two tones is all a sprite this size can carry; a third
 *  step is a gradient, and there are no gradients here. */
export const tone = (hex: string, f: number) =>
  "#" + [1, 3, 5].map((i) =>
    Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * f))
      .toString(16).padStart(2, "0")
  ).join("");

/** One run of identical pixels: a rect in logical space. */
export interface Run {
  x: number; y: number; w: number; h: number; fill: string;
}

/** Turn a character map into as few rectangles as possible.
 *
 *  Two passes: run-length encode each row, then merge a run into the one
 *  directly above it when they share x, width and colour. A flat wall that
 *  would be thousands of 1×1 pixels comes out as a handful of rects, which is
 *  the difference between a room that renders and a room that crawls. */
export function rasterise(art: string[], pal: Record<string, string> = PAL): Run[] {
  const rows: Run[][] = art.map((row, y) => {
    const out: Run[] = [];
    let i = 0;
    while (i < row.length) {
      const ch = row[i];
      let j = i + 1;
      while (j < row.length && row[j] === ch) j++;
      if (ch !== "." && ch !== " ") {
        const fill = pal[ch];
        if (fill) out.push({ x: i, y, w: j - i, h: 1, fill });
      }
      i = j;
    }
    return out;
  });

  const merged: Run[] = [];
  const open = new Map<string, Run>();       // key: x|w|fill, still growing
  rows.forEach((row, y) => {
    const seen = new Set<string>();
    for (const r of row) {
      const key = `${r.x}|${r.w}|${r.fill}`;
      seen.add(key);
      const prev = open.get(key);
      if (prev && prev.y + prev.h === y) prev.h += 1;
      else {
        const fresh = { ...r };
        open.set(key, fresh);
        merged.push(fresh);
      }
    }
    for (const key of [...open.keys()]) if (!seen.has(key)) open.delete(key);
  });
  return merged;
}
