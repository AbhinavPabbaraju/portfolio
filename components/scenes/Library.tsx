"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Book } from "@/lib/data/library";
import { textArt, textW } from "@/lib/library/font";
import { LOGICAL_H, LOGICAL_W } from "@/lib/library/pixel";
import Px, { Box } from "@/components/library/Px";
import Room from "@/components/library/Room";

/** Break a title into lines that fit the plaque, on word boundaries. */
function wrap(str: string, max: number): string[] {
  const out: string[] = [];
  let line = "";
  for (const word of str.split(" ")) {
    if (line && (line + " " + word).length > max) { out.push(line); line = word; }
    else line = line ? line + " " + word : word;
  }
  if (line) out.push(line);
  return out.slice(0, 3);
}

interface Inspect { book: Book; at: { x: number; y: number } }

/** The plaque that appears when you hover a spine. Drawn in the same font as
 *  the shelf signs and clamped to the room's edges, so a book at the far end
 *  does not push its own label off the wall. */
function Plaque({ book, at }: Inspect) {
  const lines = wrap(book.title, 30);
  const w = Math.max(textW(book.author), ...lines.map(textW)) + 8;
  const h = lines.length * 7 + 12;
  const x = Math.min(Math.max(at.x - w / 2, 2), LOGICAL_W - w - 2);
  const y = Math.max(at.y - h - 4, 2);
  return (
    <g className="lib-plaque" pointerEvents="none">
      <Box x={x} y={y} w={w} h={h} c="0" opacity={0.92} />
      <Box x={x} y={y} w={w} h={1} c="9" />
      <Box x={x} y={y + h - 1} w={w} h={1} c="4" />
      {lines.map((l, i) => <Px key={i} art={textArt(l, "q")} x={x + 4} y={y + 4 + i * 7} />)}
      <Px art={textArt(book.author, "8")} x={x + 4} y={y + 5 + lines.length * 7} />
    </g>
  );
}

/** The reading room.
 *
 *  ── the scale is the whole trick ──
 *  Pixel art only survives at whole-number magnification. The frame therefore
 *  picks the smallest integer scale that still covers the viewport's height
 *  and sizes the room to exactly that; the room is wider than the screen at
 *  every scale, which is what there is to pan along. Letting the browser
 *  stretch the SVG to fit instead would put logical pixels on fractional
 *  device pixels, and the entire style depends on that never happening.
 *
 *  The pan itself belongs to `CinemaDeck`, which drives `.lib-room` across
 *  the scene's dwell — long scroll timelines live there, not in scenes. */
export default function Library() {
  const frame = useRef<HTMLDivElement>(null);
  const room = useRef<SVGSVGElement>(null);
  const [inspect, setInspect] = useState<Inspect | null>(null);

  const onInspect = useCallback((book: Book | null, at?: { x: number; y: number }) => {
    setInspect(book && at ? { book, at } : null);
  }, []);

  useEffect(() => {
    const fit = () => {
      const f = frame.current, r = room.current;
      if (!f || !r) return;
      const h = f.clientHeight;
      if (!h) return;
      /* nearest integer, not `ceil`: rounding up overshot by nearly a whole
         step at common heights and threw a fifth of the room off the top.
         Rounding lands within half a step either way, and the room's ceiling
         and floor are both near-black — so whether the surplus is crop or
         letterbox, it is the same colour as the frame behind it. */
      const scale = Math.max(1, Math.round(h / LOGICAL_H));
      r.setAttribute("width", String(LOGICAL_W * scale));
      r.setAttribute("height", String(LOGICAL_H * scale));
      /* centre the overflow vertically: the room is a whole number of pixels
         tall and the viewport is not, so a sliver goes at each end rather
         than all of it off the top */
      r.style.top = Math.round((h - LOGICAL_H * scale) / 2) + "px";
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (frame.current) ro.observe(frame.current);
    return () => ro.disconnect();
  }, []);

  return (
    <section className="block library" id="writing">
      <div className="lib-frame" ref={frame}>
        <svg
          className="lib-room" ref={room}
          viewBox={`0 0 ${LOGICAL_W} ${LOGICAL_H}`}
          preserveAspectRatio="xMinYMin meet"
          role="img"
          aria-label="A two-storey reading room. Books on the shelves link out to papers and articles."
        >
          <Room onInspect={onInspect} />
          {inspect && <Plaque {...inspect} />}
        </svg>
        <p className="lib-hint">scroll to walk the room · click a lit spine</p>
      </div>
    </section>
  );
}
