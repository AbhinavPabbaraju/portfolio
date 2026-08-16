"use client";
import { BAYS, type Book } from "@/lib/data/library";
import { textArt, textW } from "@/lib/library/font";
import { BLEED, HEADROOM, LOGICAL_H, LOGICAL_W, PAL, tone } from "@/lib/library/pixel";
import { BAY_W, BAY_X0, EAST, LAMPS, ROOM, TABLES, bayX, pierX } from "@/lib/library/scene";
import Bookcase from "./Bookcase";
import { COLD, Glow, Shaft } from "./Light";
import {
  CardCatalogue, Clock, ExitDoor, Frame, HangingPot, Noticeboard, Poster, QuietBoard, Stair, Vine,
  Window,
} from "./Fixtures";
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

/** Someone at a table, seen from behind and slightly side-on, leaning into
 *  the work. A face at this size is a smudge, so there is no face: the tilt of
 *  the head and the slope of the shoulders carry the whole read.
 *
 *  The palette arrives at render time (`readerPal`) rather than being baked
 *  into the map. Three people drawn in the room's own near-black were three
 *  identical dark lumps; the coat colour is the only thing at this scale that
 *  says they are different people. */
const READER = [
  ".....hhhhh.....",
  "....hhhhhhh....",
  "...hhhhhhhhh...",
  "...hhhhhhhhh...",
  "...hhhhhhhhs...",
  "....hhhhhhss...",
  ".....hhhhss....",
  "......ssss.....",
  "....dcccccC....",
  "...dcccccccC...",
  "..dcccccccccC..",
  "..dcccccccccC..",
  ".dcccccccccccC.",
  ".dcccccccccccC.",
  "ddcccccccccccCC",
  "ddcccccccccccCC",
  "ddcccccccccccCC",
];

/** Hair, skin, coat and its two shaded edges — lit from the right, because
 *  that is the end of the table the banker's lamp stands on. */
const readerPal = (coat: string, hair: string) => ({
  h: hair, s: "#8a6a52",
  c: coat, C: tone(coat, 1.45), d: tone(coat, 0.6),
});

/** The laptop that is the only thing in the room lit from inside. */
const LAPTOP = [
  "..sssssss..",
  ".sFFFFFFFs.",
  ".sFFFFFFFs.",
  ".sFFFFFFFs.",
  ".sFFFFFFFs.",
  "sssssssssss",
  ".ttttttttt.",
];

/** Where the floorboards fall, measured down from the wall junction. The gaps
 *  widen as they come forward, which is the room's only perspective — 4, then
 *  five more, then six, and so on.
 *
 *  Generated rather than listed because the floor now runs `BLEED` past the
 *  bottom of the authored room (see `fitScale`), and a hand-written list would
 *  have to be re-counted every time that number moved. The first eight values
 *  are the ones this replaced, unchanged. */
/** Where the floor starts going into shadow: one row below the near chairs'
 *  feet, which stand eight in front of a table's front legs at `floor + 50`. */
const FORE = ROOM.floor + 60;

const BOARDS = (() => {
  const out = [4];
  for (let gap = 5; out[out.length - 1] < LOGICAL_H - ROOM.floor + BLEED; gap++)
    out.push(out[out.length - 1] + gap);
  return out;
})();

/** Table clutter: the difference between a table and a plank. */
const MUG = [
  "LLLLL.",
  "rrrrrt",
  "rrrrrt",
  "rrrrr.",
  ".sss..",
];

const STACK = [
  "..fffffff..",
  "..fffffff..",
  ".iiiiiiiii.",
  ".iiiiiiiii.",
  "kkkkkkkkk..",
  "kkkkkkkkk..",
];

/** An open book, left face up where somebody stopped reading. The gap up the
 *  middle is the whole sprite: fill it and this is a bread roll. */
const OPEN_BOOK = [
  "...L.L...",
  "..LL.LL..",
  ".LLL.LLL.",
  "LLLL.LLLL",
  "gggg.gggg",
];

/** A pot plant, of which the reference has one in every corner.
 *
 *  The pot is drawn a step up the wood ramp from the floorboards it stands on.
 *  Filled in `4`, which is the floor's own colour, the plant appeared to be
 *  growing straight out of the boards. */
const PLANT = [
  "...x.y.x...",
  "..xyyxyyx..",
  ".xyyyxyyyx.",
  "xxyyyyyyyxx",
  ".xxyyyyyxx.",
  "..xxyyyxx..",
  "...xxyxx...",
  ".....4.....",
  "...66666...",
  "..6555556..",
  "..6555556..",
  "...66666...",
];

/** The tall one that stands in a corner and softens it. Wider and twice the
 *  height of the little pot, with fronds that break the wall line — a room
 *  this rectilinear needs at least one thing in it with no straight edge. */
const TALL_PLANT = [
  ".......x.......",
  "....x..y..x....",
  "...xy.xyx.yx...",
  "..xyyxyyyxyyx..",
  ".xyyyyxyxyyyyx.",
  "xyyyyyyyyyyyyyx",
  ".xyyyyyyyyyyyx.",
  "..xxyyyyyyyxx..",
  "...xyyyyyyyx...",
  "....xxyyyxx....",
  "..x..xxyxx..x..",
  ".xy...xyx...yx.",
  "..xy..xyx..yx..",
  "......4x4......",
  ".....55555.....",
  "....6666666....",
  "...666666666...",
  "...655555556...",
  "...655555556...",
  "...655555556...",
  "....6666666....",
  ".....55555.....",
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

/* Where a lamp's light is drawn: `Light.tsx`. Nothing in this file invents a
   glow of its own — a beam is a bloom, a shaft and a pool, and all three are
   stated in coordinates taken off the sprite that throws them. */

export default function Room({ onInspect }: { onInspect: (b: Book | null, at?: { x: number; y: number }) => void }) {
  const upper = BAYS.filter((b) => b.floor === "upper");
  const lower = BAYS.filter((b) => b.floor === "lower");

  return (
    <g shapeRendering="crispEdges">
      {/* ══ the shell ══
          It starts `HEADROOM` above the room and ends `BLEED` below it. Both
          ends are the same idea: the frame is a viewport, the room is a fixed
          number of rows, and what the drawing does not reach the frame's own
          background does — badly. Above, the surplus is ceiling and the page's
          fixed bar stands on it; below, it is floor. */}
      <Box x={0} y={-HEADROOM} w={LOGICAL_W} h={LOGICAL_H + BLEED + HEADROOM} c="2" />
      <Box x={0} y={-HEADROOM} w={LOGICAL_W} h={ROOM.ceiling + HEADROOM} c="1" />
      <Box x={0} y={ROOM.ceiling - 3} w={LOGICAL_W} h={3} c="4" />
      {/* the upper storey sits in its own darker band, which is what makes the
          balcony read as a shelf of space rather than a painted line */}
      <Box x={0} y={ROOM.ceiling} w={LOGICAL_W} h={ROOM.railTop - ROOM.ceiling} c="1" />
      {/* ceiling joists, receding across the room — carried up through the
          headroom, so the dark behind the bar is the room's ceiling rather
          than a flat panel that happens to be the same colour */}
      {Array.from({ length: 14 }, (_, i) => (
        <Box key={i} x={i * 108 + 30} y={-HEADROOM} w={7} h={ROOM.ceiling + HEADROOM} c="4" />
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
      <Frame x={pierX(1) - 7} y={44} w={14} h={30} />
      <Frame x={pierX(2) - 8} y={50} w={16} h={22} />
      <Frame x={pierX(3) - 7} y={52} w={14} h={26} />
      {/* the window stops clear of the balustrade: at 100 tall its sill was
          buried behind the balusters and the room had a window with no bottom */}
      <Window x={EAST + 88} y={20} w={62} h={86} />

      {/* ══ the balcony ══ */}
      <Box x={0} y={ROOM.railTop} w={LOGICAL_W} h={3} c="6" />
      {Array.from({ length: Math.ceil(LOGICAL_W / 9) }, (_, i) => (
        <Box key={i} x={i * 9 + 3} y={ROOM.railTop + 3} w={3} h={ROOM.slab - ROOM.railTop - 3} c="5" />
      ))}
      <Box x={0} y={ROOM.slab} w={LOGICAL_W} h={3} c="7" />
      <Box x={0} y={ROOM.slab + 3} w={LOGICAL_W} h={ROOM.slabH - 3} c="4" />
      <Box x={0} y={ROOM.slab + ROOM.slabH} w={LOGICAL_W} h={4} c="0" opacity={0.7} />
      {/* ivy over the front edge of the balcony. Lengths and seeds all differ:
          the eye reads three identical strands as a pattern and a dozen
          different ones as a plant that has been there a while. */}
      {[
        [bayX(0) + 38, 17, 5], [bayX(0) + 132, 9, 12], [pierX(1) + 4, 24, 23],
        [bayX(1) + 50, 13, 31], [bayX(2) + 40, 21, 44], [bayX(2) + 118, 8, 57],
        [pierX(3) + 8, 27, 66], [bayX(3) + 58, 11, 79], [bayX(3) + 168, 16, 88],
        [EAST + 46, 14, 97], [EAST + 210, 20, 103],
      ].map(([vx, len, seed]) => (
        <Vine key={vx} x={vx} y={ROOM.slab + 6} len={len} seed={seed} />
      ))}

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
      {/* The pier at the middle of the wall is the room's noticeboard for
          things that are not notices: the clock, and under it the one piece of
          editorial a library allows itself. Both centred on the same line, so
          the pier reads as one composition rather than two objects that
          happened to land near each other. */}
      <Clock x={pierX(2)} y={182} r={15} />
      <Poster x={pierX(2)} y={204} lines={["A BOOK", "A DAY", "KEEPS", "REALITY", "AWAY"]} />

      {/* ══ the east end: the way out ══
          Everything on this wall stops *on* the floor line, because the floor
          is painted after it. At 272 the door's bottom rail, its kick plate
          and the last row of the catalogue's drawers were all drawn and then
          buried under the boards — a door with no threshold, standing in a
          floor rather than in a wall. */}
      <CardCatalogue x={EAST + 6} y={ROOM.floor - 72} w={62} h={72} />
      <ExitDoor x={EAST + 96} y={ROOM.floor - 78} h={78} />
      <Noticeboard x={EAST + 180} y={196} w={70} h={52} />
      <Box x={EAST + 176} y={ROOM.signL} w={78} h={9} c="4" />
      <Px art={textArt("NOTICES", "9")} x={EAST + 180} y={ROOM.signL + 2} />

      {/* ══ the west end: the stairs up ══ */}
      <Stair x1={BAY_X0 - 18} />

      {/* ══ the floor ══
          Boards, and the gaps between them widen towards the front. Evenly
          spaced lines are what a *wall* of planking looks like, and that is
          exactly how the floor read: a second wainscot below the shelves that
          the furniture appeared to be hanging on. Spacing that opens up as it
          comes forward is the only perspective a flat elevation gets, and it
          is what puts the tables on a floor instead of against it.

          Lines only — no butt joints. Cross-marks were tried and every one of
          them landed as a header course: horizontal rules plus verticals at a
          regular offset is the drawing of a brick wall, not a floor, and the
          room grew a patio the moment they went in.

          The floor is the one thing drawn past the bottom of the room, by
          `BLEED`: the frame is a viewport and the room is a fixed number of
          rows, so whatever the two disagree by lands here — as more floor
          coming forward, never as bare frame under the boards. `fitScale`
          picks the scale that keeps that surplus small. */}
      <Box x={0} y={ROOM.floor} w={LOGICAL_W} h={LOGICAL_H + BLEED - ROOM.floor} c="4" />
      <Box x={0} y={ROOM.floor} w={LOGICAL_W} h={2} c="6" />
      {BOARDS.map((d) => (
        <g key={d}>
          <Box x={0} y={ROOM.floor + d} w={LOGICAL_W} h={1} c="0" opacity={0.32} />
          <Box x={0} y={ROOM.floor + d + 1} w={LOGICAL_W} h={1} c="5" opacity={0.22} />
        </g>
      ))}

      {/* ══ what the two lights of glass let in ══
          The window and the door are the room's only cold light, and until
          now neither of them put anything on anything: two bright holes in a
          wall with the woodwork below them as black as if they were shuttered.

          They are drawn here rather than with their own fixtures for the same
          reason the lamps are — a cast has to land on the balcony and the
          floorboards, and both of those are painted after the east wall is.
          Drawn up there it would be buried under them.

          Faint is the whole point. This is the moon against four lamps, and
          the window's job in this room is to be the one cold thing that makes
          every warm thing read as warm. Turn it up and it stops being night
          outside. */}
      <Shaft x={EAST + 119} y={112} h={ROOM.slab - 112} mouth={28} spread={38} gain={0.9} ramp={COLD} />
      <Glow x={EAST + 119} y={ROOM.railTop + 1} rx={34} ry={2} gain={1.7} ramp={COLD} />
      <Glow x={EAST + 119} y={ROOM.slab + 1} rx={38} ry={2} gain={1.9} ramp={COLD} />
      {/* and what comes under the door: a patch of night on the boards at the
          threshold. No shaft for this one — the glass is at head height and
          the panelling below it is solid, so light on the door's own bottom
          rail would be light arriving from inside the door. */}
      <Glow x={EAST + 119} y={ROOM.floor + 11} rx={36} ry={11} gain={2} ramp={COLD} />

      {/* ══ lamps, and what they throw ══
          Every number below is read off the `PENDANT` map rather than chosen:
          the sprite is eleven wide, so its centre line is `x+5`; row 5 is the
          shade's mouth and rows 6–7 are the filament, so the light leaves at
          `y+6` and no lower. The old drawing started at `y+8` and two pixels
          wider than the shade, which is a beam with a gap between it and the
          lamp that is supposedly casting it.

          The far end matters as much: a shaft is run to the surface it
          actually falls on — the balcony's front edge upstairs, the
          floorboards down here — and that surface is given a pool. Light
          that stops in mid-air at a horizontal line, which is what the old
          fixed `h` did at both storeys, is the same fault upside down. */}
      {LAMPS.map((l) => {
        const cx = l.x + 5;                                   // the sprite's centre line
        const bulb = l.y + 6;                                 // the row the filament is on
        const up = l.floor === "upper";
        const land = up ? ROOM.slab : ROOM.floor;             // what it falls on
        return (
          <g key={`${l.x}-${l.y}`}>
            <Box x={cx} y={l.y - 16} w={1} h={16} c="0" />
            <Px art={PENDANT} x={l.x} y={l.y} />
            <Shaft x={cx} y={bulb} h={land - bulb} mouth={5} spread={30} gain={1.5} />
            {/* the bloom, over the shade rather than under it — a bulb is the
                one thing in the room brighter than its own fixture */}
            <Glow x={cx} y={bulb + 2} rx={10} ry={7} gain={2.4} />
            {up ? (
              /* Upstairs the beam lands on two horizontal edges seen edge-on
                 — the handrail first, the balcony deck behind it — so what it
                 puts there are streaks. A round pool, which is what this was,
                 lands on the balcony's *vertical* fascia and reads as a stain
                 on the woodwork rather than as light on a floor. */
              <>
                <Glow x={cx} y={ROOM.railTop + 1} rx={30} ry={2} gain={1.9} />
                <Glow x={cx} y={ROOM.slab + 1} rx={36} ry={2} gain={2.1} />
              </>
            ) : (
              <Glow x={cx} y={ROOM.floor + 14} rx={48} ry={14} gain={2.1} />
            )}
          </g>
        );
      })}

      {/* ══ the reading floor ══
          Everything here stands *in front of* the wall, so its base sits
          below the floor line rather than on it. The first pass had the
          tables floating at the junction, which read as furniture glued to
          the bookcases.

          ── where the depth comes from ──
          A flat elevation has exactly one way to say "further away", and it is
          overlap. So the group is drawn strictly back to front — rug, far
          chairs, the reader, the back legs, the top, the front legs, what is
          on the table, and last the near chair — and each thing crosses the
          one behind it. The far chairs also stand ten pixels *higher*, because
          the floor recedes: feet further from the eye land further up the
          board. Those two rules are the whole trick; a table drawn as one
          slab on two posts, which is what this was, has no way to use either. */}
      {TABLES.map((t) => {
        const top = ROOM.floor + 16;        // the working surface
        const base = ROOM.floor + 50;       // where the front legs meet the boards
        const legTop = top + 9;
        const backFoot = base - 10;         // the far pair, set back up the floor
        const rugTop = base - 20;
        return (
          <g key={t.x}>
            {/* rug: seven bands, each a little wider than the one behind it, so
                the thing on the floor is the first object in the room with
                perspective. Three pixels of flare a band and no more — at
                seven it stopped being a rug in a room and became a staircase */}
            {Array.from({ length: 7 }, (_, i) => {
              const pad = 24 + i * 3;
              return (
                <g key={`r${i}`}>
                  <Box x={t.x - pad} y={rugTop + i * 4} w={t.w + pad * 2} h={4} c="I" />
                  {i > 0 && i < 6 && (
                    <Box x={t.x - pad + 6} y={rugTop + i * 4} w={t.w + pad * 2 - 12} h={4} c="H" />
                  )}
                </g>
              );
            })}
            {Array.from({ length: 9 }, (_, i) => (
              <Box key={`f${i}`} x={t.x - 42 + i * Math.round((t.w + 84) / 9)}
                y={rugTop + 28} w={3} h={2} c="z" opacity={0.6} />
            ))}
            {/* the dark the table sits over */}
            <Box x={t.x} y={legTop} w={t.w} h={base - legTop} c="0" opacity={0.22} />

            {/* far chairs, and whoever is still in one */}
            <Chair x={t.x + 16} base={backFoot} far />
            <Chair x={t.x + t.w - 44} base={backFoot} far />
            {t.occupied && (
              <Px art={READER} pal={readerPal(t.coat, t.hair)} x={t.x + 18} y={top - 17} />
            )}

            {/* back legs: darker, inset, and stopping short of the boards */}
            <Box x={t.x + 26} y={legTop} w={5} h={backFoot - legTop} c="4" />
            <Box x={t.x + t.w - 31} y={legTop} w={5} h={backFoot - legTop} c="4" />

            {/* the top: surface, front edge, and the shadow it casts under
                itself — three values are what give a plank thickness */}
            <Box x={t.x - 6} y={top} w={t.w + 12} h={3} c="7" />
            <Box x={t.x - 6} y={top + 3} w={t.w + 12} h={4} c="6" />
            <Box x={t.x - 6} y={top + 7} w={t.w + 12} h={2} c="4" />
            <Box x={t.x + 2} y={legTop} w={t.w - 4} h={4} c="5" />
            <Box x={t.x + 2} y={legTop + 4} w={t.w - 4} h={1} c="4" />

            {/* front legs, lit down one edge, with the stretcher between them */}
            {[t.x + 6, t.x + t.w - 13].map((lx) => (
              <g key={lx}>
                <Box x={lx} y={legTop} w={7} h={base - legTop} c="5" />
                <Box x={lx} y={legTop} w={1} h={base - legTop} c="6" />
                <Box x={lx + 6} y={legTop} w={1} h={base - legTop} c="4" />
              </g>
            ))}
            <Box x={t.x + 12} y={base - 15} w={t.w - 24} h={3} c="4" />
            <Box x={t.x + 12} y={base - 15} w={t.w - 24} h={1} c="5" />
            <Box x={t.x - 2} y={base - 1} w={t.w + 4} h={3} c="0" opacity={0.5} />

            {/* ── on the table ──
                The lamp's foot sits *on* the surface. It used to be posted at
                `top - 19` with a ten-pixel sprite, which hung it nine pixels
                clear of the wood with its light pooling on nothing. */}
            {/* the pool goes down *before* the lamp, so the lamp stands in its
                own light rather than under a wash laid over the top of it —
                and it is clamped to the two ends of the plank, because the
                flat 64-wide bar this replaced ran off the edge into the air */}
            <Glow x={t.x + t.w - 31} y={top + 3} rx={46} ry={7} gain={2.3}
              x0={t.x - 6} x1={t.x + t.w + 6} />
            <Px art={DESK_LAMP} x={t.x + t.w - 36} y={top - 10} />
            {/* six pixels of shaft, from the filament to the wood: a banker's
                shade is opaque, so what it throws is a short cone under the
                rim, not a beam */}
            <Shaft x={t.x + t.w - 31} y={top - 6} h={6} mouth={5} spread={12} gain={1.8} step={1} />
            {/* and the bloom stays *under* the rim. Given the pendant's own
                halo it swallowed the shade, and that shade is the only
                saturated colour on the ground floor — a green lamp washed
                warm is a beige lamp. */}
            <Glow x={t.x + t.w - 31} y={top - 3} rx={8} ry={3} gain={1.8} />
            {t.occupied ? (
              <>
                <Px art={LAPTOP} x={t.x + 52} y={top - 7} />
                <Glow x={t.x + 57} y={top + 1} rx={13} ry={4} gain={1.9}
                  ramp={COLD} x0={t.x - 6} x1={t.x + t.w + 6} />
                {/* the forearm, drawn after the top so it rests on it */}
                <rect x={t.x + 34} y={top - 3} width={16} height={3} fill={tone(t.coat, 1.1)} />
                <rect x={t.x + 48} y={top - 3} width={4} height={2} fill="#8a6a52" />
                <Px art={MUG} x={t.x + 104} y={top - 5} />
              </>
            ) : (
              <>
                <Px art={STACK} x={t.x + 34} y={top - 6} />
                <Px art={OPEN_BOOK} x={t.x + 74} y={top - 4} />
                <Px art={MUG} x={t.x + 96} y={top - 5} />
              </>
            )}

            {/* the near chairs, last of all: their backs cross the table's front
                edge, which is the whole reason they read as being this side of
                it rather than tucked under the far side */}
            <Chair x={t.x + 8} base={base + 8} />
            <Chair x={t.x + t.w - 32} base={base + 8} />
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
      <Box x={1128} y={ROOM.floor + 12} w={13} h={4} c="l" />
      <Box x={1129} y={ROOM.floor + 8} w={11} h={4} c="n" />

      <QuietBoard x={152} base={ROOM.floor + 42} />

      {/* ══ the greenery ══
          A library that has been lived in grows things. Everything here is in
          the gaps the furniture leaves — between two rugs, in the corner the
          stair turns, either side of the way out — so the plants read as a
          room nobody has tidied rather than as decoration on a grid. */}
      <Px art={TALL_PLANT} x={519} y={ROOM.floor + 4} />
      <Px art={TALL_PLANT} x={829} y={ROOM.floor + 4} />
      <Px art={TALL_PLANT} x={EAST - 40} y={ROOM.floor + 2} />
      <Px art={PLANT} x={122} y={ROOM.floor + 8} />
      <Px art={PLANT} x={EAST + 74} y={ROOM.floor - 12} />
      <Px art={PLANT} x={EAST + 268} y={ROOM.floor - 12} />
      {/* on the balcony deck, where the eye travels along the rail */}
      <Px art={PLANT} x={LOGICAL_W - 44} y={ROOM.slab - 12} />
      <Px art={PLANT} x={bayX(1) - 6} y={ROOM.slab - 12} />
      <Px art={PLANT} x={bayX(3) + BAY_W - 6} y={ROOM.slab - 12} />
      {/* hung off the ceiling at both ends of the room, and their ivy is the
          only thing that crosses in front of the upper shelves */}
      <HangingPot x={150} y={ROOM.ceiling} cord={7} seed={11} />
      <HangingPot x={EAST + 34} y={ROOM.ceiling} cord={5} seed={29} />
      <HangingPot x={EAST + 232} y={ROOM.ceiling} cord={12} seed={47} />
      <Vine x={bayX(0) + 2} y={ROOM.ceiling} len={14} seed={53} />
      <Vine x={bayX(2) + BAY_W - 4} y={ROOM.ceiling} len={11} seed={71} />

      {/* ── the floor falls away in front of you ──
          Four lamps hang over the middle of the room and nothing lights the
          near edge of it, so the boards go into shadow as they come forward.
          Stepped bands rather than a gradient, like every other fall-off in
          here.

          It starts a row below the nearest chair, so nothing standing on the
          floor is dimmed by it, and it runs the whole depth of the `BLEED`.
          That is the other half of its job: on a window the room does not
          exactly fit, the surplus boards below the furniture are the far end
          of this shadow rather than a lit floor with nothing standing on it. */}
      {Array.from({ length: 14 }, (_, i) => (
        <rect key={i} x={0} y={FORE + i * 16} width={LOGICAL_W} height={16}
          fill={PAL["0"]} opacity={Math.min(0.92, 0.05 + i * 0.085)} />
      ))}

      {/* the room falls away at both ends rather than stopping at a cut */}
      <rect x={0} y={-HEADROOM} width={26} height={LOGICAL_H + BLEED + HEADROOM}
        fill={PAL["0"]} opacity={0.55} />
      <rect x={LOGICAL_W - 26} y={-HEADROOM} width={26} height={LOGICAL_H + BLEED + HEADROOM}
        fill={PAL["0"]} opacity={0.55} />
    </g>
  );
}

/** A ladderback chair, 24 wide, standing with its feet on `base`.
 *
 *  `far` is the whole of the perspective: a chair on the other side of the
 *  table is drawn a step down the palette, so it sits back into the dark
 *  instead of competing with the one in front of it. Its own back legs are
 *  darker again and land higher than the front pair, which is the only thing
 *  that stops four posts in a row reading as a bench. */
function Chair({ x, base, far = false }: { x: number; base: number; far?: boolean }) {
  /* A far chair is a silhouette, not a dimmer version of a near one. Drawn a
     step *down* the wood ramp it came out at `4`, which is the floorboards'
     own colour, and two chairs a table's depth away disappeared into the
     floor completely. Against a lit floor the thing further away is the
     darker shape — so it goes below the ramp, not along it. */
  const frame = far ? "J" : "5";
  const lit = far ? "5" : "7";
  return (
    <g>
      {/* A one-pixel dark line around the back, because the near chair's whole
          job is to overlap the table and the table is the same wood. Without
          it the top rail and the table's front edge are one shape and the
          chair reads as a moulding on the furniture behind it. */}
      <Box x={x - 1} y={base - 39} w={26} h={1} c="0" opacity={0.7} />
      <Box x={x - 1} y={base - 38} w={1} h={5} c="0" opacity={0.7} />
      <Box x={x + 24} y={base - 38} w={1} h={5} c="0" opacity={0.7} />
      <Box x={x + 1} y={base - 34} w={1} h={16} c="0" opacity={0.55} />
      <Box x={x + 22} y={base - 34} w={1} h={16} c="0" opacity={0.55} />
      <Box x={x - 2} y={base - 20} w={28} h={1} c="0" opacity={0.6} />

      {/* back legs, set in and stopping short of the front pair */}
      <Box x={x + 5} y={base - 15} w={4} h={11} c="4" />
      <Box x={x + 15} y={base - 15} w={4} h={11} c="4" />
      {/* the back: two posts, a top rail, two ladder splats */}
      <Box x={x + 2} y={base - 36} w={4} h={22} c={frame} />
      <Box x={x + 18} y={base - 36} w={4} h={22} c={frame} />
      <Box x={x} y={base - 38} w={24} h={4} c={lit} />
      <Box x={x + 6} y={base - 32} w={12} h={3} c="4" />
      <Box x={x + 6} y={base - 26} w={12} h={3} c="4" />
      {/* seat, with the front edge that gives it a thickness */}
      <Box x={x - 1} y={base - 19} w={26} h={4} c={lit} />
      <Box x={x - 1} y={base - 15} w={26} h={2} c="4" />
      {/* front legs and the stretcher between them */}
      <Box x={x + 1} y={base - 13} w={5} h={13} c={frame} />
      <Box x={x + 18} y={base - 13} w={5} h={13} c={frame} />
      <Box x={x + 1} y={base - 13} w={1} h={13} c={lit} />
      <Box x={x + 18} y={base - 13} w={1} h={13} c={lit} />
      <Box x={x + 4} y={base - 6} w={17} h={2} c="4" />
      <Box x={x - 2} y={base - 1} w={28} h={2} c="0" opacity={0.55} />
    </g>
  );
}
