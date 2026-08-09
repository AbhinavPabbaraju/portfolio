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
  /* the lit spine — a real link, catching lamp light */
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
} as const;

export type PalKey = keyof typeof PAL;

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
