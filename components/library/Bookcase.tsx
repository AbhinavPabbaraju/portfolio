"use client";
import { PAL } from "@/lib/library/pixel";
import { BAY_W, shelfRow, type Spine } from "@/lib/library/scene";
import type { Bay, Book } from "@/lib/data/library";
import { Box } from "./Px";

/** How the linked books in a bay are spread across its shelves: round-robin
 *  down the rows, so no shelf is all links and none is all filler. */
function byRow(books: Book[], rows: number): Book[][] {
  const out: Book[][] = Array.from({ length: rows }, () => []);
  books.forEach((b, i) => out[i % rows].push(b));
  return out;
}

interface Props {
  bay: Bay;
  x: number;
  top: number;
  h: number;
  rows: number;
  /** the room tells a book what to say when the pointer lands on it */
  onInspect: (b: Book | null, at?: { x: number; y: number }) => void;
}

/** One bookcase: a frame, four shelves, and the wall of spines on them.
 *
 *  The linked spines are the only ones that are `<a>` elements, which is
 *  deliberate on two counts. The wall stays honest — filler is scenery and
 *  says so by not being clickable — and the tab order contains exactly the
 *  books that go somewhere, instead of four hundred decorative rectangles. */
export default function Bookcase({ bay, x, top, h, rows, onInspect }: Props) {
  const rowH = Math.floor(h / rows);
  const inner = BAY_W - 6;
  const shelves = byRow(bay.books, rows);

  return (
    <g>
      {/* carcass: dark inside, wood frame, a lit top edge */}
      <Box x={x} y={top} w={BAY_W} h={h} c="0" />
      <Box x={x} y={top} w={BAY_W} h={1} c="6" />
      <Box x={x} y={top} w={3} h={h} c="4" />
      <Box x={x + BAY_W - 3} y={top} w={3} h={h} c="4" />
      <Box x={x} y={top + h - 2} w={BAY_W} h={2} c="4" />

      {Array.from({ length: rows }, (_, r) => {
        const boardY = top + (r + 1) * rowH;
        const spines = shelfRow(inner, (bay.slot + 1) * 977 + r * 131, shelves[r], rowH);
        return (
          <g key={r}>
            {spines.map((s, i) => (
              <Spine
                key={i} s={s} x={x + 3 + s.x} bottom={boardY - 1}
                onInspect={onInspect}
              />
            ))}
            {/* the shelf board, drawn after the books so they sit *on* it */}
            <Box x={x + 3} y={boardY - 1} w={inner} h={1} c="6" />
            <Box x={x + 3} y={boardY} w={inner} h={1} c="4" />
          </g>
        );
      })}
    </g>
  );
}

function Spine({
  s, x, bottom, onInspect,
}: { s: Spine; x: number; bottom: number; onInspect: Props["onInspect"] }) {
  const y = bottom - s.h;
  const body = (
    <>
      <rect x={x} y={y} width={s.w} height={s.h} fill={PAL[s.colour as keyof typeof PAL]} />
      {/* a 1px darker edge down the right side is the whole of the shading —
          at this resolution that is all a spine needs to have a side */}
      <rect x={x + s.w - 1} y={y} width={1} height={s.h} fill={PAL["0"]} opacity={0.45} />
      {s.book && (
        <>
          {/* gilt bands: what marks a spine as one you can pull out */}
          <rect x={x} y={y + 2} width={s.w} height={1} fill={PAL.q} />
          <rect x={x} y={y + s.h - 4} width={s.w} height={1} fill={PAL.q} />
          <rect x={x} y={y} width={s.w} height={1} fill={PAL.b} opacity={0.7} />
        </>
      )}
    </>
  );

  if (!s.book) return body;

  return (
    <a
      className="lib-book"
      href={s.book.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${s.book.title} — ${s.book.author}. Opens in a new tab.`}
      onMouseEnter={() => onInspect(s.book!, { x: x + s.w / 2, y })}
      onMouseLeave={() => onInspect(null)}
      onFocus={() => onInspect(s.book!, { x: x + s.w / 2, y })}
      onBlur={() => onInspect(null)}
    >
      {body}
    </a>
  );
}
