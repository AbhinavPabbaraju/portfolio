"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Book } from "@/lib/data/library";
import { textArt, textW } from "@/lib/library/font";
import { LOGICAL_H, LOGICAL_W, fitScale } from "@/lib/library/pixel";
import Px, { Box } from "@/components/library/Px";
import Room from "@/components/library/Room";
import { refreshDeck } from "@/lib/lenis";

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
 *  Pixel art only survives at whole-number magnification — of *device* pixels,
 *  which is what `fitScale` picks, and why the room is not simply stretched to
 *  the frame. The room is wider than the screen at every scale it picks, which
 *  is what there is to pan along.
 *
 *  The height is the part that has no exact answer: the frame is a viewport
 *  and the room is 320 rows, so the two never agree. The SVG covers the frame
 *  and the drawing hangs from the top of it, so the ceiling meets the top edge
 *  and the disagreement — however it falls — lands on the floor at the bottom,
 *  where the drawing carries on for another `BLEED` rows. What this replaced
 *  sized the SVG to the room instead and centred it, which split the mismatch
 *  between the two ends: at 830px tall it cropped 65px off each, taking the
 *  shelf signs off the top and the chairs' legs off the bottom.
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
    /* The room's width changes in steps, and the deck's walk along the wall is
       measured from it. A step therefore is a layout mutation and has to
       refresh the deck, or the walk keeps travelling the distance measured for
       the previous scale. (Only a step: a frame that changes height without
       crossing one leaves the width alone, and there is nothing to refresh.) */
    let lastScale = 0;
    const fit = () => {
      const f = frame.current, r = room.current;
      if (!f || !r) return;
      const h = f.clientHeight;
      if (!h) return;
      /* `fitScale` is where the whole argument lives: whole *device* pixels,
         and of the two scales either side of an exact fit, the one that costs
         less. What it cannot do is make the room exactly a viewport tall, so
         the leftover is placed rather than split — the SVG covers the frame
         and the room hangs from the top of it, which puts the ceiling on the
         top edge and the surplus, whichever way it goes, at the bottom. That
         is the end the drawing has `BLEED` for.

         The room's own scale therefore lives in the viewBox, not in the
         element's size: `h / scale` rows across `h` pixels is exactly
         `scale`, and no rounding of a height can make it anything else. */
      const scale = fitScale(h, window.devicePixelRatio || 1);
      r.setAttribute("width", String(LOGICAL_W * scale));
      r.setAttribute("height", String(h));
      r.setAttribute("viewBox", `0 0 ${LOGICAL_W} ${h / scale}`);
      if (scale !== lastScale) {
        const first = lastScale === 0;
        lastScale = scale;
        /* next frame, so this never re-enters a refresh that is already
           running (a refresh resizes nothing, but ResizeObserver can fire
           inside one) */
        if (!first) requestAnimationFrame(refreshDeck);
      }
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
