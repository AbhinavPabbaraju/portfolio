"use client";
import { useEffect, useState } from "react";
import { PAL } from "@/lib/library/pixel";
import { ROOM, STAIR, pixelLine } from "@/lib/library/scene";
import { textArt } from "@/lib/library/font";
import Px, { Box } from "./Px";

/** The staircase to the balcony.
 *
 *  Every step is generated from one integer rise and one integer run, so all
 *  thirteen are identical by construction — the moment two differ by a pixel
 *  the whole flight reads as broken, which is what a fractional run did to
 *  the first version.
 *
 *  The mass under the flight is stacked rectangles rather than a `<polygon>`:
 *  a polygon hands the diagonal to the renderer, and the renderer antialiases
 *  it. Everything in this room is whole pixels or it is nothing.
 *
 *  It climbs leftward, so `x1` is the bottom step and the flight decides for
 *  itself where it starts. */
export function Stair({ x1 }: { x1: number }) {
  const { rise, run, steps, rail } = STAIR;
  return (
    <g>
      {Array.from({ length: steps }, (_, i) => {
        const sx = x1 - (i + 1) * run;          // this tread's left edge
        const sy = ROOM.floor - (i + 1) * rise; // and its walking surface
        return (
          <g key={i}>
            {/* the solid under this tread, carried down to the boards */}
            <rect x={sx} y={sy} width={run} height={ROOM.floor - sy} fill={PAL.J} />
            {/* riser, then the nosing that catches light along its front */}
            <rect x={sx} y={sy + 2} width={run} height={rise - 2} fill={PAL["5"]} />
            <rect x={sx} y={sy} width={run} height={2} fill={PAL["7"]} />
            <rect x={sx} y={sy + 2} width={1} height={rise - 2} fill={PAL["6"]} />
          </g>
        );
      })}
      {/* Handrail and balusters step on exactly the tread rhythm — same run,
          same rise — so the rail is parallel to the flight by construction
          rather than by a second calculation that can disagree with it. */}
      {Array.from({ length: steps }, (_, i) => {
        const sx = x1 - (i + 1) * run;
        const sy = ROOM.floor - (i + 1) * rise;
        return (
          <g key={`r${i}`}>
            <rect x={sx + 2} y={sy - rail} width={3} height={rail} fill={PAL["5"]} />
            <rect x={sx} y={sy - rail - 3} width={run} height={4} fill={PAL["6"]} />
            {/* the riser that joins this length of rail to the next one up.
                Without it each length floats a rise clear of its neighbour and
                the banister reads as a row of unconnected posts. */}
            {i < steps - 1 && (
              <rect x={sx} y={sy - rail - 3 - rise} width={4} height={rise + 1} fill={PAL["6"]} />
            )}
          </g>
        );
      })}
      {/* newel posts: the flight has to land on something at both ends */}
      <Box x={x1 - 2} y={ROOM.floor - rail - 8} w={6} h={rail + 8} c="6" />
      <Box x={x1 - steps * run - 2} y={ROOM.floor - steps * rise - rail - 8} w={6} h={rail + 10} c="6" />
      {/* the landing it arrives at */}
      <Box x={0} y={ROOM.floor - steps * rise} w={x1 - steps * run + 4} h={3} c="6" />
      <Box x={0} y={ROOM.floor - steps * rise + 3} w={x1 - steps * run + 4} h={ROOM.floor - (ROOM.floor - steps * rise) - 3} c="J" />
    </g>
  );
}

/** The arched night window. The only cold light in the room, which is what
 *  makes every lamp in it read as warm. */
export function Window({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const r = Math.floor(w / 2);
  return (
    <g>
      {/* the arch: a stepped quarter-circle each side, drawn as runs */}
      <Box x={x - 3} y={y + r} w={w + 6} h={h - r + 3} c="G" />
      {Array.from({ length: r }, (_, i) => {
        const dx = r - Math.round(Math.sqrt(r * r - (r - i) * (r - i)));
        return (
          <rect key={i} x={x - 3 + dx} y={y + i} width={w + 6 - dx * 2} height={1} fill={PAL.G} />
        );
      })}
      {/* glass */}
      <Box x={x} y={y + r} w={w} h={h - r} c="E" />
      {Array.from({ length: r - 2 }, (_, i) => {
        const j = i + 2;
        const dx = r - Math.round(Math.sqrt(r * r - (r - j) * (r - j)));
        return <rect key={`g${i}`} x={x + dx} y={y + j} width={w - dx * 2} height={1} fill={PAL.E} />;
      })}
      {/* the night in it: a scatter of stars and a low moon */}
      <Box x={x + 6} y={y + r + 6} w={1} h={1} c="F" />
      <Box x={x + 18} y={y + r + 14} w={1} h={1} c="F" />
      <Box x={x + 11} y={y + r + 26} w={1} h={1} c="F" />
      <Box x={x + 26} y={y + r + 8} w={1} h={1} c="F" />
      <Box x={x + 22} y={y + r + 34} w={1} h={1} c="F" />
      <Px art={["..FF.", ".FFFF", "FFFF.", ".FF.."]} x={x + w - 14} y={y + r + 10} />
      {/* mullions */}
      <Box x={x + Math.floor(w / 2) - 1} y={y + 4} w={2} h={h - 4} c="4" />
      <Box x={x} y={y + r + Math.floor((h - r) / 2)} w={w} h={2} c="4" />
      <Box x={x - 3} y={y + h} w={w + 6} h={3} c="5" />
    </g>
  );
}

/** The way out, and the sign over it that is the only green in the room. */
export function ExitDoor({ x, y, h }: { x: number; y: number; h: number }) {
  const w = 46;
  return (
    <g>
      <Box x={x - 4} y={y - 4} w={w + 8} h={h + 4} c="5" />
      <Box x={x} y={y} w={w} h={h} c="4" />
      {/* four panels, the way every institutional door has */}
      {[0, 1].map((c) => [0, 1].map((r) => (
        <g key={`${c}${r}`}>
          <Box x={x + 6 + c * 19} y={y + 8 + r * 34} w={14} h={26} c="J" />
          <Box x={x + 6 + c * 19} y={y + 8 + r * 34} w={14} h={1} c="5" />
        </g>
      )))}
      <Box x={x + w - 8} y={y + Math.floor(h / 2)} w={3} h={5} c="K" />
      {/* the sign, and the little pool it throws on the lintel */}
      <Box x={x + 2} y={y - 18} w={w - 4} h={12} c="C" />
      <Box x={x + 2} y={y - 18} w={w - 4} h={1} c="D" />
      <Px art={textArt("EXIT", "D")} x={x + 12} y={y - 15} />
      <Box x={x - 4} y={y - 5} w={w + 8} h={1} c="C" opacity={0.5} />
    </g>
  );
}

/** The noticeboard nobody has cleared since term started. */
export function Noticeboard({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const notes = [
    [4, 4, 18, 22], [26, 6, 14, 18], [44, 4, 20, 16],
    [6, 30, 22, 16], [32, 28, 16, 20], [52, 24, 12, 22],
  ];
  return (
    <g>
      <Box x={x - 2} y={y - 2} w={w + 4} h={h + 4} c="5" />
      <Box x={x} y={y} w={w} h={h} c="A" />
      {notes.map(([nx, ny, nw, nh], i) => (
        <g key={i}>
          <Box x={x + nx} y={y + ny} w={nw} h={nh} c={i % 3 === 0 ? "L" : "r"} />
          {/* two ruled lines are enough to say "there is writing on this" */}
          <Box x={x + nx + 2} y={y + ny + 4} w={nw - 5} h={1} c="t" />
          <Box x={x + nx + 2} y={y + ny + 8} w={nw - 7} h={1} c="t" />
          <Box x={x + nx + Math.floor(nw / 2)} y={y + ny - 1} w={2} h={2} c="H" />
        </g>
      ))}
    </g>
  );
}

/** The wall clock — showing the actual time, on the viewer's own clock.
 *
 *  Rendered handless on the server and given its hands after mount: the
 *  server has no idea what time it is where you are, and a clock that
 *  disagreed between the two would be a hydration mismatch. It re-reads every
 *  half minute, which is as often as a minute hand can possibly move.
 *
 *  The hands are Bresenham runs, not rotated rectangles. A `transform:rotate`
 *  would hand the diagonal back to the renderer to antialias, and a soft grey
 *  clock hand in a room with no soft edges anywhere else is the one detail
 *  that would give the whole thing away. */
export function Clock({ x, y, r }: { x: number; y: number; r: number }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const hand = (angleDeg: number, len: number, colour: string, thick = 1) => {
    const a = ((angleDeg - 90) * Math.PI) / 180;
    return pixelLine(x, y, x + Math.cos(a) * len, y + Math.sin(a) * len).map((p, i) => (
      <rect key={i} x={p.x} y={p.y} width={thick} height={thick} fill={colour} />
    ));
  };

  const mins = now ? now.getMinutes() : 0;
  const hours = now ? now.getHours() % 12 : 0;

  return (
    <g>
      {/* case, then face */}
      {Array.from({ length: r * 2 + 1 }, (_, i) => {
        const dy = i - r;
        const dx = Math.round(Math.sqrt(Math.max(0, r * r - dy * dy)));
        return <rect key={i} x={x - dx} y={y + dy} width={dx * 2} height={1} fill={PAL["5"]} />;
      })}
      {Array.from({ length: (r - 2) * 2 + 1 }, (_, i) => {
        const dy = i - (r - 2);
        const dx = Math.round(Math.sqrt(Math.max(0, (r - 2) * (r - 2) - dy * dy)));
        return <rect key={`f${i}`} x={x - dx} y={y + dy} width={dx * 2} height={1} fill={PAL.r} />;
      })}
      {/* twelve marks, the quarters heavier */}
      {Array.from({ length: 12 }, (_, i) => {
        const a = ((i * 30 - 90) * Math.PI) / 180;
        const big = i % 3 === 0;
        const rad = r - 3;
        return (
          <rect
            key={`t${i}`}
            x={Math.round(x + Math.cos(a) * rad) - (big ? 1 : 0)}
            y={Math.round(y + Math.sin(a) * rad) - (big ? 1 : 0)}
            width={big ? 2 : 1} height={big ? 2 : 1} fill={PAL["1"]}
          />
        );
      })}
      {now && (
        <>
          {hand(hours * 30 + mins * 0.5, r - 8, PAL["0"], 2)}
          {hand(mins * 6, r - 4, PAL["0"])}
        </>
      )}
      <Box x={x - 1} y={y - 1} w={2} h={2} c="H" />
    </g>
  );
}

/** A card catalogue — the drawer wall that used to be the index of a library,
 *  which is exactly what this room's index still is. */
export function CardCatalogue({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const cols = 6, rows = 5;
  const dw = Math.floor((w - 4) / cols), dh = Math.floor((h - 6) / rows);
  return (
    <g>
      <Box x={x} y={y} w={w} h={h} c="5" />
      <Box x={x} y={y} w={w} h={2} c="7" />
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => (
          <g key={`${r}${c}`}>
            <Box x={x + 2 + c * dw} y={y + 4 + r * dh} w={dw - 2} h={dh - 2} c="4" />
            <Box x={x + 2 + c * dw} y={y + 4 + r * dh} w={dw - 2} h={1} c="6" />
            <Box x={x + 2 + c * dw + Math.floor(dw / 2) - 2} y={y + 4 + r * dh + Math.floor(dh / 2) - 1} w={4} h={2} c="K" />
          </g>
        )))}
      <Box x={x - 1} y={y + h} w={w + 2} h={2} c="4" />
    </g>
  );
}

/** Ivy over the balcony rail. The reference has it everywhere, and it is what
 *  keeps a room made of straight lines from reading as a spreadsheet. */
export function Vine({ x, y, len }: { x: number; y: number; len: number }) {
  return (
    <g>
      {Array.from({ length: len }, (_, i) => {
        const w = i % 3 === 0 ? 3 : 2;
        const off = i % 4 < 2 ? 0 : 1;
        return (
          <g key={i}>
            <rect x={x + off} y={y + i * 2} width={w} height={2} fill={PAL[i % 2 ? "x" : "y"]} />
            {i % 3 === 1 && <rect x={x + off + w} y={y + i * 2} width={2} height={2} fill={PAL.x} />}
          </g>
        );
      })}
    </g>
  );
}

/** A framed print between the bays. */
export function Frame({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <g>
      <Box x={x} y={y} w={w} h={h} c="6" />
      <Box x={x + 2} y={y + 2} w={w - 4} h={h - 4} c="1" />
      <Box x={x + 3} y={y + h - 10} w={w - 6} h={7} c="x" />
      <Box x={x + 5} y={y + h - 14} w={6} h={5} c="y" />
      <Box x={x + w - 12} y={y + 6} w={4} h={4} c="9" />
    </g>
  );
}
