"use client";
import { useEffect, useState, type ReactNode } from "react";
import { PAL } from "@/lib/library/pixel";
import { ROOM, STAIR, pixelLine } from "@/lib/library/scene";
import { textArt, textW } from "@/lib/library/font";
import { COLD, GREEN, Glow } from "./Light";
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

/** The moon.
 *
 *  At 4×4 it was the same size as the stars around it and only its being
 *  square told them apart — which is not a moon, it is a big star. Seven
 *  across is the smallest disc that still steps like a circle rather than a
 *  cut corner.
 *
 *  Shaded along the lower-left limb and given two maria, because a plain
 *  white disc reads as a hole punched in the glass. `w` is the same
 *  moon-blue the stars are dimmed with, so the shading is the moon's own
 *  colour turned down rather than a second grey introduced to the palette. */
const MOON = [
  "..FFF..",
  ".FFFFF.",
  "FFFFwFF",
  "FFFFFFF",
  "wFFwFFF",
  ".wwFFF.",
  "..www..",
];

/** A star, on a clock of its own.
 *
 *  A star twinkles because the air in front of it moves, which has nothing to
 *  do with the star — so all of them run the same short scintillation and the
 *  only thing that differs is duration and delay. One shared animation makes
 *  thirteen pixels blink in unison, which is a string of fairy lights rather
 *  than a sky. Five clocks, dealt round, is enough that they never fall back
 *  into step; the diner's `.bstar` does the same thing with the same names.
 *
 *  The dip lives on the wrapper and the pixel keeps its own opacity, so the
 *  two multiply — and under reduced motion, where the animation is dropped,
 *  the star is simply left lit at the value it was drawn at. */
const CLOCKS = ["", "s2", "s3", "s4", "s5"];

function Star({ x, y, i, dim }: { x: number; y: number; i: number; dim?: boolean }) {
  return (
    <g className={`libstar ${CLOCKS[i % CLOCKS.length]}`.trim()}>
      <Box x={x} y={y} w={1} h={1} c="F" opacity={dim ? 0.7 : 1} />
    </g>
  );
}

/** The arched night window. The only cold light in the room, which is what
 *  makes every lamp in it read as warm.
 *
 *  Both curves are the *same* circle drawn at two radii — the trim at `r+3`,
 *  the glass at `r` — so the stone ring is three pixels thick all the way
 *  round by construction. Stepping one arch and then insetting it by a
 *  constant, which is what the first version did, thickens the ring towards
 *  the springing and pinches it at the apex.
 *
 *  It is glazed like a real window: a centre mullion sill-to-apex and transoms
 *  across it. Four enormous panes read as a picture of a window; a grid of
 *  small ones reads as glass, because the muntins are what catch the light. */
export function Window({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const r = Math.floor(w / 2);
  const cx = x + r;              // the centre line of the light
  const spring = y + r;          // where the arch lands on the jambs
  const bottom = y + h;
  /** half-width of a circle of radius `rad`, `rad - i` rows above its centre */
  const half = (i: number, rad: number) =>
    Math.round(Math.sqrt(Math.max(0, rad * rad - (rad - i) * (rad - i))));

  const arch = (rad: number, top: number, fill: string, key: string) =>
    Array.from({ length: rad }, (_, i) => {
      const hw = half(i, rad);
      return <rect key={`${key}${i}`} x={cx - hw} y={top + i} width={hw * 2} height={1} fill={fill} />;
    });

  return (
    <g>
      {/* What the glass puts on the wall around it, drawn first — so it lands
          on the plaster and the stone reveal stays crisp over the top of it.
          A window this size on a near-black wall with nothing spilling off it
          is a picture of a window hung on the wall rather than a hole in it.
          Faint on purpose: it is the moon, and it is competing with four
          lamps. */}
      <Glow x={cx} y={y + 40} rx={r + 14} ry={Math.round(h / 2) + 14} gain={1.3} ramp={COLD} />

      {/* stone surround: the arch, then the jambs carried down to the sill */}
      {arch(r + 3, y - 3, PAL.G, "t")}
      <Box x={cx - r - 3} y={spring} w={w + 6} h={bottom - spring} c="G" />

      {/* the light itself */}
      {arch(r, y, PAL.E, "g")}
      <Box x={cx - r} y={spring} w={w} h={bottom - spring} c="E" />
      {/* the horizon: town light bleeding up into the bottom of the sky */}
      <Box x={cx - r} y={bottom - 9} w={w} h={6} c="u" />
      <Box x={cx - r} y={bottom - 3} w={w} h={3} c="v" opacity={0.5} />
      {[[-22, 2], [-14, 1], [-6, 2], [5, 1], [13, 2], [21, 1]].map(([dx, lw], i) => (
        <Box key={`c${i}`} x={cx + dx} y={bottom - 5} w={lw} h={1} c="F" opacity={0.55} />
      ))}

      {/* Stars, kept off the muntin lines so none of them reads as a join,
          and each one on its own clock — see `Star`. */}
      {[[-20, 12], [-9, 22], [-24, 30], [11, 8], [19, 18], [6, 34], [-15, 41], [22, 38]].map(
        ([dx, dy], i) => <Star key={`s${i}`} x={cx + dx} y={y + dy} i={i} dim={!!(i % 3)} />
      )}
      {/* the moon, in its own haze. The glow goes down first: a disc with a
          hard edge and nothing around it is a sticker on the glass, and the
          haze is the only thing saying the sky it sits in has air in it */}
      <Glow x={cx + 10} y={y + 25} rx={10} ry={10} gain={1.6} ramp={COLD} />
      <Px art={MOON} x={cx + 7} y={y + 22} />

      {/* glazing bars: centre mullion, the springing transom, two below it */}
      <Box x={cx - 1} y={y + 2} w={2} h={h - 2} c="4" />
      {[spring, spring + Math.round((bottom - spring) / 3), spring + Math.round(((bottom - spring) * 2) / 3)]
        .map((ty, i) => <Box key={`h${i}`} x={cx - r} y={ty} w={w} h={1} c="4" />)}
      {/* and one across the arch, clipped to the curve at that height */}
      <Box x={cx - half(Math.round(r / 2), r)} y={y + Math.round(r / 2)}
        w={half(Math.round(r / 2), r) * 2} h={1} c="4" />

      {/* sill: a projecting stone course, its top edge catching the room */}
      <Box x={cx - r - 6} y={bottom} w={w + 12} h={1} c="7" />
      <Box x={cx - r - 6} y={bottom + 1} w={w + 12} h={3} c="G" />
      <Box x={cx - r - 4} y={bottom + 4} w={w + 8} h={2} c="5" />
      <Box x={cx - r - 4} y={bottom + 6} w={w + 8} h={1} c="0" opacity={0.5} />
    </g>
  );
}

/** The way out, and the sign over it that is the only green in the room.
 *
 *  Glazed over the lock rail, panelled under it — which is what makes it read
 *  as a door out of the building rather than a cupboard. The night behind the
 *  glass is the same `E` as the window's, so the two cold lights in the room
 *  agree with each other; four flat panels with nothing behind them, which is
 *  what this was, said "wall" instead.
 *
 *  Every panel and the glazed light are sunk by the same one-pixel rule:
 *  shadow along the top and left, wood highlight along the bottom and right.
 *  Invert that pair and the same drawing reads as raised. */
export function ExitDoor({ x, y, h }: { x: number; y: number; h: number }) {
  const w = 46;
  const glass = { x: x + 7, y: y + 7, w: w - 14, h: 28 };
  const panelTop = y + 44, panelH = h - 44 - 8;

  /** a sunk opening: the 1px bevel that makes a rectangle a recess */
  const sunk = (bx: number, by: number, bw: number, bh: number) => (
    <>
      <Box x={bx - 1} y={by - 1} w={bw + 2} h={1} c="0" opacity={0.55} />
      <Box x={bx - 1} y={by - 1} w={1} h={bh + 2} c="0" opacity={0.55} />
      <Box x={bx - 1} y={by + bh} w={bw + 2} h={1} c="6" />
      <Box x={bx + bw} y={by - 1} w={1} h={bh + 1} c="6" />
    </>
  );

  return (
    <g>
      {/* casing: architrave, reveal, and a head with a small cornice on it */}
      <Box x={x - 6} y={y - 6} w={w + 12} h={h + 6} c="5" />
      <Box x={x - 7} y={y - 9} w={w + 14} h={3} c="6" />
      <Box x={x - 7} y={y - 6} w={w + 14} h={1} c="4" />
      <Box x={x - 3} y={y - 3} w={w + 6} h={h + 3} c="4" />

      {/* the leaf */}
      <Box x={x} y={y} w={w} h={h} c="5" />
      <Box x={x} y={y} w={1} h={h} c="6" />
      <Box x={x + w - 1} y={y} w={1} h={h} c="4" />

      {/* the spill off the glazed light, on the leaf and the casing around it.
          Same faint moonlight as the window's, at the size of the opening
          throwing it — the two cold lights in this room have to agree about
          how much light there is outside */}
      <Glow x={glass.x + Math.round(glass.w / 2)} y={glass.y + Math.round(glass.h / 2)}
        rx={Math.round(glass.w / 2) + 13} ry={Math.round(glass.h / 2) + 12} gain={1.3} ramp={COLD} />

      {/* the glazed light, and the night on the other side of it */}
      {sunk(glass.x, glass.y, glass.w, glass.h)}
      <Box x={glass.x} y={glass.y} w={glass.w} h={glass.h} c="E" />
      <Box x={glass.x} y={glass.y + glass.h - 7} w={glass.w} h={4} c="u" />
      <Box x={glass.x} y={glass.y + glass.h - 3} w={glass.w} h={3} c="v" opacity={0.45} />
      {/* the same sky as the window's, seen through a smaller hole — so the
          same stars, on the same five clocks */}
      <Star x={glass.x + 4} y={glass.y + 5} i={1} dim />
      <Star x={glass.x + 19} y={glass.y + 9} i={3} dim />
      <Star x={glass.x + 12} y={glass.y + 3} i={0} />
      <Star x={glass.x + 8} y={glass.y + glass.h - 5} i={2} dim />
      <Star x={glass.x + 24} y={glass.y + glass.h - 5} i={4} dim />
      {/* glazing bars, and the sill the light sits on */}
      <Box x={glass.x + Math.floor(glass.w / 2) - 1} y={glass.y} w={2} h={glass.h} c="4" />
      <Box x={glass.x} y={glass.y + Math.floor(glass.h / 2)} w={glass.w} h={1} c="4" />
      <Box x={x + 4} y={y + 37} w={w - 8} h={3} c="6" />
      <Box x={x + 4} y={y + 40} w={w - 8} h={1} c="4" />

      {/* two sunk panels under the lock rail */}
      {[0, 1].map((c) => {
        const px = x + 6 + c * 18;
        return (
          <g key={c}>
            {sunk(px, panelTop, 16, panelH)}
            <Box x={px} y={panelTop} w={16} h={panelH} c="4" />
            <Box x={px + 2} y={panelTop + 2} w={12} h={panelH - 4} c="J" />
          </g>
        );
      })}

      {/* brass: a back plate, the knob, and the kick strip along the bottom */}
      <Box x={x + w - 11} y={y + 42} w={4} h={12} c="4" />
      <Box x={x + w - 10} y={y + 43} w={2} h={10} c="K" />
      <Box x={x + w - 13} y={y + 46} w={3} h={3} c="K" />
      <Box x={x + w - 13} y={y + 46} w={3} h={1} c="a" opacity={0.35} />
      <Box x={x + 4} y={y + h - 6} w={w - 8} h={2} c="K" opacity={0.5} />

      {/* threshold: the shadow a door sits in, which is what puts it in a wall */}
      <Box x={x - 6} y={y + h} w={w + 12} h={2} c="0" opacity={0.65} />

      {/* the sign, and the wash of green it throws down the casing */}
      <ExitSign x={x + Math.round(w / 2)} y={y - 22} />
    </g>
  );
}

/** The lit EXIT box. Centred on `x`, sitting on `y`.
 *
 *  It is the only saturated cold-adjacent colour in the room, so it has to
 *  *light* something or it reads as a sticker: the two washes below it are the
 *  whole reason it looks switched on. */
export function ExitSign({ x, y }: { x: number; y: number }) {
  const w = textW("EXIT") + 9, h = 11;
  const left = x - Math.round(w / 2);
  return (
    <g>
      {/* the bloom it sits in, drawn first so the box is the brightest thing
          inside its own glow */}
      <Glow x={x} y={y + Math.round(h / 2)} rx={Math.round(w / 2) + 7} ry={h} gain={1.6} ramp={GREEN} />
      <Box x={left} y={y} w={w} h={h} c="0" />
      <Box x={left + 1} y={y + 1} w={w - 2} h={h - 2} c="C" />
      <Box x={left + 1} y={y + 1} w={w - 2} h={1} c="D" opacity={0.5} />
      <Px art={textArt("EXIT", "D")} x={left + 5} y={y + 3} />
      {/* the cord it hangs off, and the wash it puts down the casing. Three
          stacked bars stepping outwards is a diagram of a fade rather than
          one; this is the same drawing as every other light in the room, in
          the one colour that is not warm. */}
      <Box x={x - 1} y={y - 3} w={2} h={3} c="4" />
      <Glow x={x} y={y + h + 5} rx={Math.round(w / 2) + 9} ry={9} gain={2.6} ramp={GREEN} />
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

/** Ivy trailing off a ledge. The reference has it everywhere, and it is what
 *  keeps a room made of straight lines from reading as a spreadsheet.
 *
 *  The first version stepped the stem on a fixed `i % 3` cycle and every vine
 *  in the room came out the same vine: same kinks in the same places, three
 *  identical ropes hanging off one rail. This one wanders on a seed, so two
 *  vines differ the way two plants do. It is seeded rather than random for the
 *  usual reason — the server and the client have to draw the same plant.
 *
 *  A vine starts at a tuft, not at a point. A strand that begins as a 2px stem
 *  in mid-air reads as a wire; the mass at the top is what makes it read as
 *  something growing over the edge of something else. */
export function Vine({ x, y, len, seed = 1 }: { x: number; y: number; len: number; seed?: number }) {
  let s = seed || 1;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;

  const parts: ReactNode[] = [];
  let dx = 0;
  for (let i = 0; i < len; i++) {
    if (rnd() < 0.35) dx += rnd() < 0.5 ? 1 : -1;
    dx = Math.max(-3, Math.min(3, dx));
    const tip = i > len - 3;                       // the last of it thins out
    const sw = tip ? 1 : 2;
    parts.push(
      <rect key={`s${i}`} x={x + dx} y={y + i * 2} width={sw} height={2} fill={PAL[i % 2 ? "x" : "y"]} />
    );
    /* leaves alternate sides: two on the same side in a row and the strand
       stops hanging and starts leaning */
    if (!tip && i > 0 && rnd() < 0.55) {
      const side = i % 2 ? 1 : -1;
      const lw = 2 + (rnd() < 0.4 ? 1 : 0);
      const lx = side > 0 ? x + dx + sw : x + dx - lw;
      parts.push(
        <g key={`l${i}`}>
          <rect x={lx} y={y + i * 2} width={lw} height={2} fill={PAL.y} />
          <rect x={side > 0 ? lx : lx + lw - 1} y={y + i * 2} width={1} height={1} fill={PAL.x} />
        </g>
      );
    }
  }

  return (
    <g>
      {/* the tuft it grows out of */}
      <Box x={x - 4} y={y - 3} w={10} h={3} c="x" />
      <Box x={x - 3} y={y - 5} w={7} h={2} c="y" />
      <Box x={x - 1} y={y - 6} w={3} h={1} c="y" />
      {parts}
    </g>
  );
}

/** A pot hung from the ceiling, of which the reference has one over each end
 *  of the balcony. Three strands of unequal length: cut them the same and the
 *  plant reads as a tassel. */
export function HangingPot({ x, y, cord = 10, seed = 3 }: { x: number; y: number; cord?: number; seed?: number }) {
  return (
    <g>
      <Box x={x} y={y} w={1} h={cord} c="0" />
      <Box x={x - 4} y={y + cord} w={9} h={2} c="4" />
      <Box x={x - 5} y={y + cord + 2} w={11} h={5} c="5" />
      <Box x={x - 4} y={y + cord + 7} w={9} h={2} c="4" />
      {/* the crown sits over the rim, so the pot reads as full */}
      <Box x={x - 7} y={y + cord} w={15} h={3} c="x" />
      <Box x={x - 6} y={y + cord - 2} w={13} h={2} c="y" />
      <Box x={x - 3} y={y + cord - 4} w={7} h={2} c="y" />
      <Vine x={x - 7} y={y + cord + 3} len={9} seed={seed} />
      <Vine x={x + 1} y={y + cord + 8} len={14} seed={seed * 7 + 1} />
      <Vine x={x + 6} y={y + cord + 4} len={6} seed={seed * 13 + 5} />
    </g>
  );
}

/** The reading poster on the pier between two bookcases — a library's one
 *  piece of editorial, and the thing that stops the wall being only shelves.
 *
 *  Set in the same 3×5 font as the shelf signs and centred line by line. The
 *  pier is sized around the widest line this can hold (`BAY_GAP` in
 *  `scene.ts`); a longer word than that is a wider pier, not a smaller font,
 *  because there is no smaller font. */
export function Poster({ x, y, lines }: { x: number; y: number; lines: string[] }) {
  const inner = Math.max(...lines.map(textW)) - 1;
  const w = inner + 8, h = lines.length * 6 + 7;
  const left = x - Math.round(w / 2);
  return (
    <g>
      <Box x={left + 1} y={y + 1} w={w} h={h} c="0" opacity={0.55} />
      <Box x={left} y={y} w={w} h={h} c="4" />
      <Box x={left + 1} y={y + 1} w={w - 2} h={h - 2} c="r" />
      <Box x={left + 1} y={y + 1} w={w - 2} h={1} c="L" />
      {lines.map((l, i) => (
        <Px key={i} art={textArt(l, "4")}
          x={left + 4 + Math.round((inner - (textW(l) - 1)) / 2)} y={y + 4 + i * 6} />
      ))}
      {/* a rule top and bottom: the difference between a poster and a note */}
      <Box x={left + 4} y={y + 2} w={inner} h={1} c="s" />
      <Box x={left + 4} y={y + h - 4} w={inner} h={1} c="s" />
    </g>
  );
}

/** The sandwich board at the foot of the stairs.
 *
 *  It was a twelve-pixel sprite with no words on it, which at this camera
 *  distance is a piece of litter on the floor. A board that says something is
 *  the only reason to have a board, and it is the one place in the room the
 *  library speaks in its own voice. */
export function QuietBoard({ x, base }: { x: number; base: number }) {
  const lines = ["QUIET", "PLEASE", "THANK", "YOU!"];
  const inner = Math.max(...lines.map(textW)) - 1;
  const w = inner + 8, h = lines.length * 6 + 6;
  const top = base - h - 10;
  return (
    <g>
      {/* the legs it stands on, drawn first so the board sits over them */}
      <Box x={x + 4} y={base - 14} w={3} h={14} c="5" />
      <Box x={x + w - 7} y={base - 14} w={3} h={14} c="5" />
      <Box x={x + 4} y={base - 14} w={1} h={14} c="6" />
      <Box x={x + w - 7} y={base - 14} w={1} h={14} c="6" />
      <Box x={x + 2} y={base - 1} w={w - 4} h={2} c="0" opacity={0.5} />
      {/* frame, slate, and the chalk on it */}
      <Box x={x} y={top} w={w} h={h} c="5" />
      <Box x={x} y={top} w={w} h={1} c="6" />
      <Box x={x + 2} y={top + 2} w={w - 4} h={h - 4} c="1" />
      {lines.map((l, i) => (
        <Px key={i} art={textArt(l, "r")}
          x={x + 4 + Math.round((inner - (textW(l) - 1)) / 2)} y={top + 4 + i * 6} />
      ))}
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
