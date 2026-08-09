import { CASTERS, GROUND, POLE_L, POLE_R, VB_W, VIEWBOX, sag, type PoleSpec } from "@/lib/diner/scene";
import CastShadows, { ShadowFilters } from "./CastShadow";

/* ── why this is its own layer ──
   The poles stand on the near kerb, closer to the camera than the shop, so
   their cables cross *in front of* its roofline — that is the whole reason
   the street reads as a street and not as a stage flat with a sky painted
   behind it. Everything in <Backdrop/> is drawn behind the facade, and the
   facade owns the middle of the grid, so a cable web drawn back there is a
   cable web nobody ever sees.

   Same grid, same box, same ground line: both planes are `xMidYMax slice`
   over the same full-viewport stage, so they cover and crop identically and
   the only thing between them is the facade. */

const WIRE = "#14102c";

/** A crossarm with an insulator at each end and a pin on top of the shaft. */
function Arm({ x, y, half }: { x: number; y: number; half: number }) {
  return (
    <g>
      {/* the diagonal braces under the arm — without them a crossarm reads
          as a plank balanced on a stick */}
      <g stroke="#1b1638" strokeWidth="2.4" fill="none">
        <path d={`M${x - half * 0.66},${y + 4} L${x - 3},${y + 26}`} />
        <path d={`M${x + half * 0.66},${y + 4} L${x + 3},${y + 26}`} />
      </g>
      <rect x={x - half} y={y - 4} width={half * 2} height="8" rx="1.5" fill="#1e1840" />
      <rect x={x - half} y={y - 4} width={half * 2} height="1.6" fill="#3c3168" opacity=".5" />
      {[x - half, x + half].map((ix) => (
        <g key={ix}>
          <rect x={ix - 1.6} y={y - 11} width="3.2" height="8" fill="#231c48" />
          <circle cx={ix} cy={y - 12} r="3" fill="#2f2758" />
          <circle cx={ix} cy={y - 13.4} r="1.9" fill="#443a72" />
        </g>
      ))}
    </g>
  );
}

/** One utility pole: shaft, three crossarms, a transformer, a lamp.
 *  Both poles on the street are this component; they differ only in their
 *  spec, which is also what the cables are hung off, so a wire can never
 *  end anywhere but on an insulator. */
function Pole({ spec, sign, flick = "" }: { spec: PoleSpec; sign?: string[]; flick?: string }) {
  const { x, top, pin, arms, lamp } = spec;
  const dir = Math.sign(lamp.hx - x) || 1;
  const { hx, hy } = lamp;
  return (
    <g>
      {/* the shaft: a taper, not a rectangle — 18 units at the butt down to
          11 at the top, with the head rounded off */}
      <path
        d={`M${x - 9},${GROUND} L${x - 5.6},${top + 8} Q${x},${top} ${x + 5.6},${top + 8} L${x + 9},${GROUND} Z`}
        fill="#120e28"
      />
      {/* the city is behind and the nearest bulb is to one side, so the
          shaft carries a cold rim on one edge and a warm one on the other */}
      <rect x={x + 4.2} y={top + 14} width="1.6" height={GROUND - top - 14} fill="#6b5aa8" opacity=".18" />
      <rect x={x - 6.2 + (dir < 0 ? 0 : 10.8)} y={lamp.y - 40} width="1.5" height={GROUND - lamp.y + 40} fill="#f2a656" opacity=".12" />

      {arms.map((a) => <Arm key={a.y} x={x} y={a.y} half={a.half} />)}
      {/* pin insulator on top of the first arm */}
      <rect x={x - 1.8} y={pin} width="3.6" height={arms[0].y - pin - 3} fill="#231c48" />
      <circle cx={x} cy={pin} r="3.2" fill="#2f2758" />
      <circle cx={x} cy={pin - 1.6} r="2" fill="#443a72" />

      {/* transformer. A pole feeding service drops needs somewhere to step
          the voltage down; without one the crossarms carry wire to nothing. */}
      <g>
        <rect x={x + 11} y={arms[2].y + 34} width="26" height="46" rx="10" fill="#171232" stroke="#2e2758" strokeWidth="1.3" />
        <rect x={x + 17} y={arms[2].y + 28} width="14" height="7" rx="2" fill="#241d4a" />
        <line x1={x + 7} y1={arms[2].y + 46} x2={x + 12} y2={arms[2].y + 46} stroke="#241d4a" strokeWidth="2" />
        <line x1={x + 7} y1={arms[2].y + 66} x2={x + 12} y2={arms[2].y + 66} stroke="#241d4a" strokeWidth="2" />
        {/* the conduit it drops into, strapped down the shaft */}
        <line x1={x + 9} y1={arms[2].y + 82} x2={x + 9} y2={GROUND - 24} stroke="#1b1638" strokeWidth="2.4" />
      </g>

      {/* the sign every Japanese pole carries, wrapped round the shaft */}
      {sign && (
        <g>
          <rect x={x - 14} y={lamp.y + 44} width="28" height={sign.length * 21 + 14} rx="3"
                fill="#181139" stroke="#4a3d78" strokeWidth="1.2" />
          <g fill="#cbb6f0" opacity=".82" textAnchor="middle"
             style={{ fontFamily: "var(--f-serif)", fontWeight: 700, fontSize: "15px" }}>
            {sign.map((ch, i) => (
              <text key={ch + i} x={x} y={lamp.y + 63 + i * 21}>{ch}</text>
            ))}
          </g>
        </g>
      )}

      {/* step bolts, base collar, and the shadow that stops it hovering */}
      <g stroke="#2a2250" strokeWidth="2" strokeLinecap="round">
        <line x1={x - 9} y1={GROUND - 130} x2={x + 1} y2={GROUND - 130} />
        <line x1={x - 9} y1={GROUND - 104} x2={x + 1} y2={GROUND - 104} />
        <line x1={x - 9} y1={GROUND - 78} x2={x + 1} y2={GROUND - 78} />
      </g>
      <rect x={x - 9} y={GROUND - 12} width="18" height="12" rx="2" fill="#0d0a20" />
      <ellipse cx={x} cy={GROUND + 1} rx="17" ry="3.4" fill="#050310" opacity=".55" />

      {/* ── the lamp ──
          The arm reaches *away* from the shop, over the kerb — both where
          the road is visible and where the pool it throws can land. */}
      <g>
        <path d={`M${x + dir * 6},${lamp.y} C${x + dir * 44},${lamp.y - 16} ${hx - dir * 20},${hy - 24} ${hx},${hy - 10}`}
              fill="none" stroke="#1b1638" strokeWidth="4.5" strokeLinecap="round" />
        <path d={`M${x + dir * 6},${lamp.y + 22} L${x + dir * 40},${lamp.y - 8}`}
              fill="none" stroke="#1b1638" strokeWidth="2.6" />
        <path d={`M${hx - 14},${hy - 10} L${hx + 14},${hy - 10} L${hx + 9},${hy + 2} L${hx - 9},${hy + 2} Z`} fill="#1e1840" />
        <g className={`lampFlick ${flick}`}>
          <ellipse cx={hx} cy={hy + 2} rx="8" ry="3.6" fill="#ffe0b0" />
          <circle cx={hx} cy={hy + 4} r="27" fill="#f2a656" opacity=".26" filter="url(#oblur)" />
          <polygon points={`${hx - 15},${hy + 5} ${hx + 15},${hy + 5} ${hx + 82},${GROUND} ${hx - 82},${GROUND}`}
                   fill="#f2a656" opacity=".05" filter="url(#oblur)" />
        </g>
      </g>
    </g>
  );
}

/* ── the spans ──
   Every wire either lands on an insulator or leaves the frame; none of them
   stops in open air. Each one is a continuous run — it arrives from off
   frame, is tied at a pole, and carries on — so where it crosses a shaft it
   simply passes behind, which is what the draw order below is for.

   Sag is what sells them, and it is the one number the shop competes for:
   the deepest part of every span is dead over its roof sign. The fan bottoms
   out at y≈351 and the sign's top edge sits at y≈362, so it clears by 11
   units — and because the shop is a fixed width *on this grid*, it clears by
   those same 11 units at every window size. That fixed budget is what lets
   the sag be this deep; it is also thin, so `SHOP_UNITS` and these numbers
   move together or the wires end up across the sign.

   Within that budget no two spans cross: each arm's shorter inner span rides
   above its longer outer one, and each arm rides above the one below it. */
const OUTER_L = POLE_L.arms.map((a) => [POLE_L.x - a.half, a.y] as const);
const INNER_L = POLE_L.arms.map((a) => [POLE_L.x + a.half, a.y] as const);
const OUTER_R = POLE_R.arms.map((a) => [POLE_R.x + a.half, a.y] as const);
const INNER_R = POLE_R.arms.map((a) => [POLE_R.x - a.half, a.y] as const);

/** [left anchor, right anchor, sag, stroke width] */
const SPANS: [readonly [number, number], readonly [number, number], number, number][] = [
  [[POLE_L.x, POLE_L.pin], [POLE_R.x, POLE_R.pin], 88, 1.2],
  [OUTER_L[0], INNER_R[0], 96, 1.5],
  [INNER_L[0], OUTER_R[0], 86, 1.4],
  [OUTER_L[1], INNER_R[1], 90, 1.3],
  [INNER_L[1], OUTER_R[1], 80, 1.2],
  [OUTER_L[2], INNER_R[2], 82, 1.2],
  [INNER_L[2], OUTER_R[2], 72, 1.1],
];

/** the same wires carrying on past the poles, to the next pole off frame */
const STUBS: [string, number][] = [
  [sag(-30, OUTER_L[0][1] - 30, OUTER_L[0][0], OUTER_L[0][1], 22), 1.5],
  [sag(-30, OUTER_L[1][1] - 26, OUTER_L[1][0], OUTER_L[1][1], 18), 1.3],
  [sag(-30, OUTER_L[2][1] - 22, OUTER_L[2][0], OUTER_L[2][1], 14), 1.2],
  [sag(OUTER_R[0][0], OUTER_R[0][1], VB_W + 30, OUTER_R[0][1] - 28, 20), 1.4],
  [sag(OUTER_R[1][0], OUTER_R[1][1], VB_W + 30, OUTER_R[1][1] - 24, 16), 1.2],
  [sag(OUTER_R[2][0], OUTER_R[2][1], VB_W + 30, OUTER_R[2][1] - 20, 12), 1.1],
];

/** The overhead plane: two poles, the cables between them, their lamps. */
export default function Overhead() {
  return (
    <svg viewBox={VIEWBOX} preserveAspectRatio="xMidYMax slice">
      <defs>
        <filter id="oblur" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <ShadowFilters ns="o" />
      </defs>

      {/* ── what the poles take out of the road ──
          A shadow is drawn in the same plane as the thing casting it, always.
          The two planes are scaled differently by the deck's parallax, so a
          pole drawn here with its shadow drawn in `Backdrop` would come apart
          from it on the first scrub — the pole would walk out of its own
          shadow. The lamps are allowed to be in the other plane, because a few
          units of drift in a shadow's *direction* is invisible where the same
          drift in its *anchor* is not.

          Each pole gets the two lamps that are actually near it. The other two
          are three hundred units away and, by the time inverse-square is done
          with them, contribute a shadow nobody could see — drawing them anyway
          is how a scene ends up with four shadows under everything, which is
          the look of a render with the lights left on by mistake.

          Both lamps on each side sit outboard of their pole, so the two
          shadows agree about direction and stack into one darker rake instead
          of crossing. That is a fact about where the lamp arms reach, not a
          convenience: the arms point away from the shop, and so does the
          light, and so does the shadow. */}
      {([
        ["", CASTERS.poleL, POLE_L], ["l3", CASTERS.kerbL, POLE_L],
        ["l2", CASTERS.poleR, POLE_R], ["l4", CASTERS.kerbR, POLE_R],
      ] as const).map(([v, light, pole]) => (
        <CastShadows key={`${v}-${pole.x}`} ns="o" v={v}
          objects={[{ light, x: pole.x, y: GROUND, w: 18, top: pole.top }]} />
      ))}

      <g fill="none" strokeLinecap="round" stroke={WIRE}>
        {/* pass-over traffic: high, edge to edge, tied to poles off frame */}
        <path d={sag(-30, 84, VB_W + 30, 108, 26)} strokeWidth="1.1" opacity=".8" />
        <path d={sag(-30, 112, VB_W + 30, 138, 34)} strokeWidth="1.2" opacity=".85" />

        {STUBS.map(([d, w], i) => <path key={`s${i}`} d={d} strokeWidth={w} />)}
        {SPANS.map(([[x1, y1], [x2, y2], drop, w], i) => (
          <path key={`m${i}`} d={sag(x1, y1, x2, y2, drop)} strokeWidth={w} />
        ))}

        {/* service drops — one to a rooftop on the left, two to the houses
            in the right-hand alley. Each is tapped off a span at an
            insulator and each one lands on something. */}
        <path d={`M${OUTER_L[2][0]},${OUTER_L[2][1]} C250,390 228,500 210,604`} strokeWidth="1.1" />
        <path d={`M${OUTER_R[2][0] - 8},${OUTER_R[2][1]} C1360,392 1408,486 1438,556`} strokeWidth="1.1" />
        <path d={`M${OUTER_R[1][0] - 6},${OUTER_R[1][1]} C1420,350 1520,470 1574,572`} strokeWidth="1" />
      </g>
      <g fill="#2f2758">
        <circle cx={OUTER_L[2][0]} cy={OUTER_L[2][1]} r="2.2" />
        <circle cx={OUTER_R[2][0] - 8} cy={OUTER_R[2][1]} r="2.2" />
        <circle cx={OUTER_R[1][0] - 6} cy={OUTER_R[1][1]} r="2" />
      </g>

      {/* the poles last: the shafts and arms close over every wire end */}
      <Pole spec={POLE_L} sign={["未", "来", "を", "味", "わ", "う"]} />
      <Pole spec={POLE_R} flick="l2" />
    </svg>
  );
}
