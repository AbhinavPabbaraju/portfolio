import { LIT_COLOURS, LOGICAL_H, LOGICAL_W } from "./pixel";
import { ALL_BOOKS, type Book } from "@/lib/data/library";

/** The room, in logical pixels. Every number here is an integer because
 *  every number here is a pixel — see `pixel.ts` for why that matters.
 *
 *  Read it top to bottom and it is the elevation of a two-storey reading
 *  room: ceiling, a sign strip, the upper bays, the balcony that carries
 *  them, a second sign strip, the lower bays, and then floor — with enough
 *  floor left over to put furniture on, which the first pass did not have. */
export const ROOM = {
  ceiling: 12,
  signU: 14,
  bayU: { top: 26, h: 90, rows: 5 },
  railTop: 116,
  slab: 136,
  slabH: 10,
  signL: 152,
  bayL: { top: 164, h: 86, rows: 5 },
  /* The floor line is the wall/floor junction, and everything in front of it
     is foreground: tables, chairs, whoever is still working. The first pass
     left 48px for all of that and the furniture ended up stacked against the
     bottom shelf; this is the room's front third and it needs the space. */
  floor: 250,
  height: LOGICAL_H,
  width: LOGICAL_W,
} as const;

/** A bay is one bookcase: five shelves behind a frame, with a carved sign
 *  over it. Four along each storey on the same rhythm, so the wall reads as
 *  one piece of joinery — what varies is the architecture between them. */
export const BAY_W = 200;
/** The pier between two bookcases is not spacing, it is wall — and wall is
 *  where a library hangs the things that are not books: the clock, the reading
 *  poster, a framed print. At 20 it was too thin to carry any of them; the
 *  clock alone is 30 across and sat overlapping the spines either side of it.
 *  Wide enough for the widest thing that hangs on it, and no wider. */
export const BAY_GAP = 42;
export const BAY_X0 = 214;         // everything left of this is the staircase

export const bayX = (slot: number) => BAY_X0 + slot * (BAY_W + BAY_GAP);

/** The centre line of the pier *before* a bay. Everything mounted on a pier
 *  is centred on this, so nothing has to know how wide the pier is. */
export const pierX = (slot: number) => bayX(slot) - Math.round(BAY_GAP / 2);

/** Where the room stops being shelves. The right-hand end carries the window,
 *  the way out, and the noticeboard nobody has cleared since term started. */
export const EAST = bayX(3) + BAY_W + BAY_GAP;

/** Where the lamps hang, and what they light. A pixel-art room gets its
 *  depth from pools of light on a dark ground, not from gradients.
 *
 *  Pendants hang in the gaps *between* bookcases, never over one. A lamp in
 *  front of a shelf lights the spines from the wrong side and its pool reads
 *  as a column of glowing books rather than as light in the room. */
export const LAMPS = [
  { x: pierX(0) - 5, y: 16, floor: "upper" as const },
  { x: pierX(2) - 5, y: 16, floor: "upper" as const },
  { x: pierX(1) - 5, y: 154, floor: "lower" as const },
  { x: pierX(3) - 5, y: 154, floor: "lower" as const },
];

/** Reading tables on the ground floor, with the rug each one stands on.
 *
 *  Spread evenly along the shelf wall rather than aligned to the bays: a table
 *  centred under every bookcase turns the room into a grid, and the reference
 *  has the furniture on its own rhythm. `coat` is the reader's jacket — at
 *  eleven pixels tall the colour is the only thing telling two people apart. */
const tableAt = (sixth: number) =>
  Math.round(BAY_X0 + ((bayX(3) + BAY_W - BAY_X0) * sixth) / 6) - 75;

export const TABLES = [
  { x: tableAt(1), w: 150, occupied: true, coat: "#33405e", hair: "#191413" },
  { x: tableAt(3), w: 150, occupied: false, coat: "#3c2b33", hair: "#241b18" },
  { x: tableAt(5), w: 150, occupied: true, coat: "#5a2a2c", hair: "#2b1d17" },
];

/* ── the wall of books ──
   Most spines on a real shelf are not a link to anything; they are the wall
   the linked ones sit in. Filler is generated, deterministically, from a
   seeded generator so the server and the client agree — the same reason the
   diner's city windows are seeded rather than random.

   The linked books are placed *into* that wall at spread-out indices rather
   than clustered at the start of a row, so the eye finds them the way it
   finds a book on a real shelf: by the one catching the light. */

const FILLER_COLOURS = ["f", "g", "h", "i", "j", "k", "l", "m", "n", "o"];

/* ── what colour a link is bound in ──
   Handed out in wall order, so the rotation carries across bay boundaries and
   the whole room gets an even spread rather than each bookcase repeating the
   same short cycle. `byRow` deals books round-robin down five shelves, so two
   books sharing a shelf are five apart in this rotation — and 5 and 8 are
   coprime, so a shelf never shows one binding twice.

   Keyed off the book object rather than its index within a row: a row's
   contents depend on how many shelves the bay has, and a spine that changed
   colour when the room reflowed would be a different book to look at. */
const BINDING = new Map<Book, string>(
  ALL_BOOKS.map((b, i) => [b, LIT_COLOURS[i % LIT_COLOURS.length]]),
);
const binding = (b: Book) => BINDING.get(b) ?? LIT_COLOURS[0];

export interface Spine {
  x: number;          // left edge, within the bay's interior
  w: number;
  h: number;          // how far it rises off the shelf board
  colour: string;     // palette key
  book?: Book;        // set when this spine is a real link
  /** a stack laid flat at the end of a row, as there always is in a library
   *  where somebody has been half-way through reshelving */
  flat?: boolean;
}

/** Fill one shelf row, dropping the row's linked books into it. */
export function shelfRow(width: number, seed: number, books: Book[], rowH: number): Spine[] {
  let s = seed || 1;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;

  const spines: Spine[] = [];
  let x = 1;
  while (x < width - 4) {
    if (rnd() < 0.05) x += 1 + Math.floor(rnd() * 4);        // a gap where one is out
    if (x >= width - 4) break;
    const w = 4 + Math.floor(rnd() * 5);
    if (x + w > width - 1) break;
    spines.push({
      x, w,
      h: rowH - 3 - Math.floor(rnd() * 4),
      colour: FILLER_COLOURS[Math.floor(rnd() * FILLER_COLOURS.length)],
    });
    x += w;
  }

  /* the tail of a row that stopped short becomes a flat stack — the detail
     that stops every shelf reading as a comb */
  if (x < width - 16 && rnd() < 0.6) {
    spines.push({ x: x + 2, w: width - x - 4, h: 3 + Math.floor(rnd() * 4), colour: "l", flat: true });
  }

  if (books.length && spines.length) {
    /* Books go in at evenly spaced slots, nudged off those slots by the row's
       own seed, then to the nearest free standing spine either side. Every
       part of that is load-bearing:

       — even spacing alone put the links of all five shelves at the same few
         indices, and since every row is the same width with the same spine
         widths, the same indices are the same x. The bay came out with two
         lit columns running floor to ceiling, which reads as architecture,
         not as books somebody shelved.
       — the nudge is drawn from `rnd()`, so it differs per row (the seed is
         `slot` and `r`) and per book, and stays identical between server and
         client. Half a step either way is enough to break the columns and
         small enough that the row is still evenly covered.
       — the nearest-free walk matters twice: the old version returned early
         when a slot landed on the flat stack, and overwrote itself when two
         books rounded to one index. Either way a link vanished off the wall
         with nothing to click and nothing in the tab order. */
    const step = spines.length / (books.length + 1);
    const taken = new Set<number>();
    books.forEach((b, i) => {
      const at = step * (i + 1) + (rnd() - 0.5) * step;
      const ideal = Math.max(0, Math.min(spines.length - 1, Math.round(at)));
      let idx = -1;
      for (let d = 0; d < spines.length && idx < 0; d++) {
        for (const c of d === 0 ? [ideal] : [ideal - d, ideal + d]) {
          if (c < 0 || c >= spines.length || spines[c].flat || taken.has(c)) continue;
          idx = c;
          break;
        }
      }
      if (idx < 0) return;                       // a row of nothing but stack
      taken.add(idx);
      spines[idx] = {
        ...spines[idx],
        w: 4 + (b.weight ?? 2) * 2,
        h: rowH - 2,
        colour: binding(b),
        book: b,
      };
    });
  }
  return spines;
}

/** Bresenham: the integer points on a line between two pixels.
 *
 *  Pixel art has no diagonals — it has staircases of whole pixels, and this
 *  is the algorithm that decides which ones. It replaced a "stepped line"
 *  helper that divided the span into equal segments and rounded, which is a
 *  different thing and a worse one: it left a dead ternary picking the wrong
 *  end of each segment, so every clock hand and stair rail drawn with it sat
 *  one segment off. Bresenham has no ends to pick. */
export function pixelLine(x0: number, y0: number, x1: number, y1: number) {
  const pts: { x: number; y: number }[] = [];
  let x = Math.round(x0), y = Math.round(y0);
  const ex = Math.round(x1), ey = Math.round(y1);
  const dx = Math.abs(ex - x), dy = -Math.abs(ey - y);
  const sx = x < ex ? 1 : -1, sy = y < ey ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    pts.push({ x, y });
    if (x === ex && y === ey) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x += sx; }
    if (e2 <= dx) { err += dx; y += sy; }
  }
  return pts;
}

/** The staircase, in whole pixels.
 *
 *  A flight is the same step repeated, so both dimensions have to be integers
 *  or no two steps come out the same size — which is exactly what went wrong
 *  the first time: 104 of rise over 13 steps divides cleanly, 180 of run does
 *  not, and rounding gave alternating 13- and 14-wide treads. Fix the rise and
 *  the run, then let them decide how many steps there are and where the flight
 *  starts. Nothing here is allowed to be a fraction. */
export const STAIR = {
  rise: 8,
  run: 14,
  get steps() { return (ROOM.floor - ROOM.slab - ROOM.slabH) / this.rise; },
  /** height of the handrail above the nosing */
  rail: 30,
};
