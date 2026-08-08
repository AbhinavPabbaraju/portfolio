import { LOGICAL_H, LOGICAL_W } from "./pixel";
import type { Book } from "@/lib/data/library";

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
export const BAY_GAP = 20;
export const BAY_X0 = 214;         // everything left of this is the staircase

export const bayX = (slot: number) => BAY_X0 + slot * (BAY_W + BAY_GAP);

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
  { x: bayX(0) - 14, y: 16, floor: "upper" as const },
  { x: bayX(2) - 14, y: 16, floor: "upper" as const },
  { x: bayX(1) - 14, y: 154, floor: "lower" as const },
  { x: bayX(3) - 14, y: 154, floor: "lower" as const },
];

/** Reading tables on the ground floor, with the rug each one stands on. */
export const TABLES = [
  { x: 250, w: 150, occupied: true },
  { x: 560, w: 150, occupied: false },
  { x: 870, w: 150, occupied: true },
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
    const step = spines.length / (books.length + 1);
    books.forEach((b, i) => {
      const idx = Math.min(spines.length - 1, Math.round(step * (i + 1)));
      if (spines[idx].flat) return;
      spines[idx] = {
        ...spines[idx],
        w: 4 + (b.weight ?? 2) * 2,
        h: rowH - 2,
        colour: "p",
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
