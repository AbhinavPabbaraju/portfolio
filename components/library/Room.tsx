"use client";
import { BAYS, type Book } from "@/lib/data/library";
import { textArt, textW } from "@/lib/library/font";
import { LOGICAL_H, LOGICAL_W, PAL } from "@/lib/library/pixel";
import { BAY_W, BAY_X0, EAST, LAMPS, ROOM, TABLES, bayX } from "@/lib/library/scene";
import Bookcase from "./Bookcase";
import { CardCatalogue, Clock, ExitDoor, Frame, Noticeboard, Stair, Vine, Window } from "./Fixtures";
import Px, { Box } from "./Px";

/* ── sprites ──
   Written as pictures, read as pictures. See `pixel.ts`. */

/** A hanging lamp: enamel shade, hot filament, the cord it hangs on. */
const PENDANT = [
  "....222....",
  "...44444...",
  "..4466644..",
  ".446666644.",
  "44666666644",
  "99999999999",
  "...bbbbb...",
  ".....a.....",
];

/** A banker's lamp — the green shade every reading table in the reference
 *  has, and the only saturated colour on the ground floor. */
const DESK_LAMP = [
  "...ddddd...",
  "..ddeeedd..",
  ".ddeeeeedd.",
  "ccceeeeeccc",
  "....bbb....",
  ".....8.....",
  ".....8.....",
  ".....8.....",
  "...55555...",
  "..5444445..",
];

/** Someone at a table, seen from behind and slightly side-on. A face at this
 *  size is a smudge, so there is no face: posture carries the whole read. */
const READER = [
  "....333....",
  "...33333...",
  "..3333333..",
  "..3333333..",
  "...33333...",
  "....333....",
  "...11111...",
  "..1111111..",
  ".111111111.",
  "11111111111",
  "11311111311",
  "11111111111",
  "11111111111",
  "11111111111",
  "1111111111.",
  ".111111111.",
];

const LAPTOP = [
  "..wwwwwww..",
  ".wFFFFFFFw.",
  ".wFFFFFFFw.",
  ".wFFFFFFFw.",
  "wwwwwwwwwww",
  ".111111111.",
];

/** A pot plant, of which the reference has one in every corner. */
const PLANT = [
  "...x.y.x...",
  "..xyyxyyx..",
  ".xyyyxyyyx.",
  "xxyyyyyyyxx",
  ".xxyyyyyxx.",
  "..xxyyyxx..",
  "...xxyxx...",
  ".....4.....",
  "...55555...",
  "..5444445..",
  "..5444445..",
  "...55555...",
];

/** The sandwich board by the stairs. */
const QUIET = [
  "..44444444..",
  ".4rrrrrrrr4.",
  ".4rrrrrrrr4.",
  ".4rrrrrrrr4.",
  ".4rrrrrrrr4.",
  ".4rrrrrrrr4.",
  "..44444444..",
  "..4......4..",
  ".4........4.",
];

function Sign({ label, x, y }: { label: string; x: number; y: number }) {
  const w = textW(label);
  return (
    <g>
      <Box x={x - 4} y={y - 3} w={w + 7} h={11} c="4" />
      <Box x={x - 3} y={y - 2} w={w + 5} h={9} c="5" />
      <Box x={x - 3} y={y - 2} w={w + 5} h={1} c="6" />
      <Px art={textArt(label, "9")} x={x} y={y} />
    </g>
  );
}

/** The pool a lamp throws. Pixel art has no gradients, so depth is a few
 *  discrete steps of the same warm value — never a blur. */
function Pool({ x, y, h, w = 8 }: { x: number; y: number; h: number; w?: number }) {
  return (
    <g fill={PAL["9"]} pointerEvents="none">
      <polygon points={`${x - w},${y} ${x + w},${y} ${x + w * 3},${y + h} ${x - w * 3},${y + h}`} opacity={0.07} />
      <polygon points={`${x - w * 0.6},${y} ${x + w * 0.6},${y} ${x + w * 2},${y + h} ${x - w * 2},${y + h}`} opacity={0.07} />
      <polygon points={`${x - w * 0.3},${y} ${x + w * 0.3},${y} ${x + w},${y + h} ${x - w},${y + h}`} opacity={0.1} />
    </g>
  );
}

export default function Room({ onInspect }: { onInspect: (b: Book | null, at?: { x: number; y: number }) => void }) {
  const upper = BAYS.filter((b) => b.floor === "upper");
  const lower = BAYS.filter((b) => b.floor === "lower");

  return (
    <g shapeRendering="crispEdges">
      {/* ══ the shell ══ */}
      <Box x={0} y={0} w={LOGICAL_W} h={LOGICAL_H} c="2" />
      <Box x={0} y={0} w={LOGICAL_W} h={ROOM.ceiling} c="1" />
      <Box x={0} y={ROOM.ceiling - 3} w={LOGICAL_W} h={3} c="4" />
      {/* the upper storey sits in its own darker band, which is what makes the
          balcony read as a shelf of space rather than a painted line */}
      <Box x={0} y={ROOM.ceiling} w={LOGICAL_W} h={ROOM.railTop - ROOM.ceiling} c="1" />
      {/* ceiling joists, receding across the room */}
      {Array.from({ length: 14 }, (_, i) => (
        <Box key={i} x={i * 108 + 30} y={0} w={7} h={ROOM.ceiling} c="4" />
      ))}

      {/* ══ upper storey ══ */}
      {upper.map((bay) => (
        <g key={bay.label}>
          <Sign label={bay.label} x={bayX(bay.slot) + Math.round((BAY_W - textW(bay.label)) / 2)} y={ROOM.signU} />
          <Bookcase
            bay={bay} x={bayX(bay.slot)} top={ROOM.bayU.top}
            h={ROOM.bayU.h} rows={ROOM.bayU.rows} onInspect={onInspect}
          />
        </g>
      ))}
      <Frame x={bayX(1) - 16} y={44} w={14} h={30} />
      <Frame x={bayX(3) - 16} y={52} w={14} h={26} />
      <Window x={EAST + 88} y={22} w={62} h={100} />

      {/* ══ the balcony ══ */}
      <Box x={0} y={ROOM.railTop} w={LOGICAL_W} h={3} c="6" />
      {Array.from({ length: Math.ceil(LOGICAL_W / 9) }, (_, i) => (
        <Box key={i} x={i * 9 + 3} y={ROOM.railTop + 3} w={3} h={ROOM.slab - ROOM.railTop - 3} c="5" />
      ))}
      <Box x={0} y={ROOM.slab} w={LOGICAL_W} h={3} c="7" />
      <Box x={0} y={ROOM.slab + 3} w={LOGICAL_W} h={ROOM.slabH - 3} c="4" />
      <Box x={0} y={ROOM.slab + ROOM.slabH} w={LOGICAL_W} h={4} c="0" opacity={0.7} />
      <Vine x={bayX(0) + 40} y={ROOM.slab + 6} len={16} />
      <Vine x={bayX(2) - 30} y={ROOM.slab + 6} len={22} />
      <Vine x={EAST + 40} y={ROOM.slab + 6} len={13} />

      {/* ══ lower storey ══ */}
      {lower.map((bay) => (
        <g key={bay.label}>
          <Sign label={bay.label} x={bayX(bay.slot) + Math.round((BAY_W - textW(bay.label)) / 2)} y={ROOM.signL} />
          <Bookcase
            bay={bay} x={bayX(bay.slot)} top={ROOM.bayL.top}
            h={ROOM.bayL.h} rows={ROOM.bayL.rows} onInspect={onInspect}
          />
        </g>
      ))}
      <Clock x={bayX(2) - 10} y={200} r={15} />

      {/* ══ the east end: the way out ══ */}
      <CardCatalogue x={EAST + 6} y={196} w={62} h={76} />
      <ExitDoor x={EAST + 96} y={190} h={82} />
      <Noticeboard x={EAST + 180} y={196} w={70} h={52} />
      <Box x={EAST + 176} y={ROOM.signL} w={78} h={9} c="4" />
      <Px art={textArt("NOTICES", "9")} x={EAST + 180} y={ROOM.signL + 2} />

      {/* ══ the west end: the stairs up ══ */}
      <Stair x1={BAY_X0 - 18} />

      {/* ══ the floor ══ */}
      <Box x={0} y={ROOM.floor} w={LOGICAL_W} h={LOGICAL_H - ROOM.floor} c="4" />
      <Box x={0} y={ROOM.floor} w={LOGICAL_W} h={2} c="6" />
      {Array.from({ length: 6 }, (_, i) => (
        <Box key={i} x={0} y={ROOM.floor + 6 + i * 7} w={LOGICAL_W} h={1} c="0" opacity={0.35} />
      ))}

      {/* ══ lamps, and what they throw ══ */}
      {LAMPS.map((l) => (
        <g key={`${l.x}-${l.y}`}>
          <Box x={l.x + 5} y={l.y - 16} w={1} h={16} c="0" />
          <Px art={PENDANT} x={l.x} y={l.y} />
          <Pool x={l.x + 5} y={l.y + 8} h={l.floor === "upper" ? 112 : 108} w={10} />
        </g>
      ))}

      {/* ══ the reading floor ══
          Everything here stands *in front of* the wall, so its base sits
          below the floor line rather than on it. The first pass had the
          tables floating at the junction, which read as furniture glued to
          the bookcases. */}
      {TABLES.map((t) => {
        const top = ROOM.floor + 16;        // the table's surface
        const base = ROOM.floor + 48;       // where its legs meet the boards
        return (
          <g key={t.x}>
            {/* rug first — everything else stands on it */}
            <Box x={t.x - 32} y={base - 4} w={t.w + 64} h={12} c="I" />
            <Box x={t.x - 32} y={base - 4} w={t.w + 64} h={1} c="H" opacity={0.7} />
            <Box x={t.x - 26} y={base - 1} w={t.w + 52} h={6} c="H" opacity={0.3} />
            {Array.from({ length: 7 }, (_, i) => (
              <Box key={i} x={t.x - 20 + i * Math.round((t.w + 40) / 7)} y={base} w={2} h={5} c="z" opacity={0.5} />
            ))}

            <Chair x={t.x - 20} base={base} />
            <Chair x={t.x + t.w + 4} base={base} />

            {/* whoever is still here, behind the table so the top overlaps
                them — which is the only depth cue a flat elevation gets */}
            {t.occupied && <Px art={READER} x={t.x + 30} y={top - 24} />}

            <Box x={t.x - 4} y={top} w={t.w + 8} h={4} c="7" />
            <Box x={t.x - 4} y={top + 4} w={t.w + 8} h={5} c="5" />
            <Box x={t.x - 4} y={top + 9} w={t.w + 8} h={2} c="4" />
            <Box x={t.x + 10} y={top + 11} w={6} h={base - top - 11} c="5" />
            <Box x={t.x + t.w - 16} y={top + 11} w={6} h={base - top - 11} c="5" />
            <Box x={t.x + 8} y={base - 1} w={t.w - 16} h={2} c="0" opacity={0.5} />

            <Box x={t.x + t.w - 62} y={top} w={58} h={4} c="9" opacity={0.22} />
            <Px art={DESK_LAMP} x={t.x + t.w - 36} y={top - 19} />
            <Pool x={t.x + t.w - 31} y={top - 12} h={14} w={8} />
            {t.occupied
              ? <Px art={LAPTOP} x={t.x + 56} y={top - 7} />
              : (
                <>
                  <Box x={t.x + 30} y={top - 4} w={26} h={4} c="l" />
                  <Box x={t.x + 30} y={top - 8} w={26} h={4} c="g" />
                  <Box x={t.x + 70} y={top - 3} w={30} h={3} c="L" />
                </>
              )}
          </g>
        );
      })}

      {/* the walkway: a returns trolley, a stool, a stack nobody reshelved */}
      <Box x={470} y={ROOM.floor + 6} w={34} h={4} c="5" />
      <Box x={472} y={ROOM.floor + 10} w={3} h={12} c="4" />
      <Box x={499} y={ROOM.floor + 10} w={3} h={12} c="4" />
      <Box x={474} y={ROOM.floor + 1} w={9} h={5} c="g" />
      <Box x={485} y={ROOM.floor + 2} w={8} h={4} c="i" />
      <Box x={790} y={ROOM.floor + 8} w={18} h={3} c="6" />
      <Box x={791} y={ROOM.floor + 11} w={3} h={9} c="4" />
      <Box x={804} y={ROOM.floor + 11} w={3} h={9} c="4" />
      <Box x={1044} y={ROOM.floor + 12} w={13} h={4} c="l" />
      <Box x={1045} y={ROOM.floor + 8} w={11} h={4} c="n" />

      <Px art={QUIET} x={176} y={ROOM.floor - 9} />
      <Px art={PLANT} x={EAST + 260} y={ROOM.floor - 12} />
      <Px art={PLANT} x={EAST - 34} y={ROOM.floor - 12} />
      <Px art={PLANT} x={LOGICAL_W - 44} y={ROOM.slab - 12} />

      {/* the room falls away at both ends rather than stopping at a cut */}
      <rect x={0} y={0} width={26} height={LOGICAL_H} fill={PAL["0"]} opacity={0.55} />
      <rect x={LOGICAL_W - 26} y={0} width={26} height={LOGICAL_H} fill={PAL["0"]} opacity={0.55} />
    </g>
  );
}

function Chair({ x, base }: { x: number; base: number }) {
  return (
    <g>
      <Box x={x} y={base - 32} w={5} h={32} c="5" />          {/* back post */}
      <Box x={x} y={base - 32} w={18} h={4} c="6" />          {/* top rail */}
      <Box x={x + 2} y={base - 26} w={14} h={3} c="4" />      {/* splat */}
      <Box x={x + 2} y={base - 21} w={14} h={3} c="4" />
      <Box x={x - 2} y={base - 15} w={22} h={4} c="6" />      {/* seat */}
      <Box x={x - 2} y={base - 11} w={22} h={2} c="4" />
      <Box x={x} y={base - 9} w={5} h={9} c="5" />            {/* legs */}
      <Box x={x + 14} y={base - 9} w={5} h={9} c="5" />
      <Box x={x - 3} y={base - 1} w={25} h={2} c="0" opacity={0.55} />
    </g>
  );
}
