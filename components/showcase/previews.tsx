/** ── what a card shows of the work ──
 *
 *  A project card with only type on it is a business card. What makes it read
 *  as a *project* is a picture of the thing running — so each of the five gets
 *  a small drawing of its own subject: a Raft cluster, a compiler pipeline, a
 *  galaxy, a task graph, a telemetry trace.
 *
 *  These are drawings rather than screenshots, and deliberately:
 *
 *  — There are no screenshots in this repo, and a card that waits on assets
 *    that do not exist ships as an empty box.
 *  — Two of the five already have a real interactive model in the serve
 *    overlay (`RaftPlayground`, `RiccPlayground`). Drawing the previews in the
 *    same language makes the card a *thumbnail of the lab*, so opening the
 *    dish is a continuation rather than a change of subject.
 *  — A photograph of a UI at 300×170 is an unreadable grey rectangle. A
 *    diagram of what the thing *does* survives being small, which is the only
 *    size a carousel card has.
 *
 *  All geometry is written out or comes from a closed form. Nothing is random,
 *  because the server and the client have to draw the same picture.
 *
 *  ── the slot ──
 *  `PREVIEWS` maps project id → drawing, the same shape as the `LABS` map in
 *  `ServeOverlay`. A project with no entry renders no preview and the card
 *  closes up around it, so a sixth project is not blocked on drawing for it —
 *  and swapping a drawing for a real screenshot later is one entry, not a
 *  rewrite.
 */

import type { CSSProperties, ReactNode } from "react";

/** ── how a token reaches a shape ──
 *
 *  Through `style`, and never through a presentation attribute.
 *  `fill="var(--accent)"` looks like it should work and does not: `var()` is
 *  substituted in CSS *declarations*, and a presentation attribute is not one.
 *  Browsers leave it unresolved and the shape renders black on a near-black
 *  card — which is to say, invisible. `style={C("accent")}` emits a real
 *  declaration and resolves. */
const C = (fill?: string | null, stroke?: string | null): CSSProperties => ({
  ...(fill ? { fill: `var(--${fill})` } : null),
  ...(stroke ? { stroke: `var(--${stroke})` } : null),
});

/** Every preview is drawn on this box and stretched into the card's slot. 16:9
 *  because that is the shape of a screenshot, which is what will eventually
 *  replace some of these. */
function Frame({ children, label }: { children: ReactNode; label: string }) {
  return (
    <svg viewBox="0 0 320 180" className="sc-prev" role="img" aria-label={label}
      preserveAspectRatio="xMidYMid slice">
      {children}
    </svg>
  );
}

/* ── Phalanx — a Raft cluster mid-replication ──
   Five peers, the leader lit and ringed, an append fanning out to the other
   four, and the log underneath with a commit index part way along it. The
   arrows are the point: five circles on their own are five circles, and what
   makes it a *cluster* is that one of them is talking to the rest. */
const PEERS = [
  { x: 42, y: 116 }, { x: 104, y: 90 }, { x: 160, y: 54 },
  { x: 216, y: 90 }, { x: 278, y: 116 },
];
const LEADER = 2;

function Phalanx() {
  return (
    <Frame label="Five Raft peers replicating from a leader, over a committed log">
      {/* the append in flight, under the peers it connects */}
      {PEERS.map((p, i) =>
        i === LEADER ? null : (
          <line key={`e${i}`} x1={PEERS[LEADER].x} y1={PEERS[LEADER].y} x2={p.x} y2={p.y}
            style={C(null, "accent")} strokeWidth="1.4" opacity=".42" strokeDasharray="3 4" />
        ),
      )}
      {PEERS.map((p, i) => {
        const lead = i === LEADER;
        return (
          <g key={`p${i}`}>
            {lead && (
              <circle cx={p.x} cy={p.y} r="17" fill="none" style={C(null, "accent-2")}
                strokeWidth="1.2" opacity=".5" />
            )}
            <circle cx={p.x} cy={p.y} r="10.5" strokeWidth="1.4"
              style={lead ? C("accent-2", "accent-2") : C("surface-2", "line-2")} />
            {/* the term each peer is on — a follower that agrees is the state
                worth showing, so they all read the same number */}
            <text x={p.x} y={p.y + 3.6} textAnchor="middle" className="sc-prev-mono"
              fontSize="9" style={C(lead ? "accent-ink" : "muted")}>7</text>
          </g>
        );
      })}
      <text x={PEERS[LEADER].x} y={PEERS[LEADER].y - 25} textAnchor="middle" className="sc-prev-mono"
        fontSize="8" letterSpacing="1.4" style={C("accent-2")}>LEADER</text>

      {/* the log: committed behind the index, accepted-not-committed ahead */}
      {Array.from({ length: 14 }, (_, i) => (
        <rect key={`l${i}`} x={22 + i * 20} y={144} width="16" height="14" rx="2" strokeWidth="1"
          style={i < 9 ? C("accent-2") : C("bg", "line-2")} opacity={i < 9 ? 0.88 : 1} />
      ))}
      {/* the commit index — a log with no mark on it is a row of boxes */}
      <line x1={202} y1={139} x2={202} y2={163} style={C(null, "live")} strokeWidth="1.6" />
      <text x={206} y={137} className="sc-prev-mono" fontSize="8" style={C("live")}>commit 9</text>
    </Frame>
  );
}

/* ── ricc — the pipeline, and what falls out of the end of it ──
   Six stages and the x86 they produce. The assembly is real output shape
   rather than filler: a register-allocated prologue is the one thing that says
   this compiler goes all the way down rather than stopping at an AST. */
const STAGES = ["src", "lex", "ast", "tac", "opt", "x86"];
const ASM: [string, string][] = [
  ["push", "rbp"],
  ["mov", "rbp, rsp"],
  ["mov", "eax, [rbp-4]"],
  ["imul", "eax, eax"],
];

function Ricc() {
  return (
    <Frame label="A compiler pipeline from source to x86-64, and the assembly it emits">
      {STAGES.map((s, i) => {
        const x = 12 + i * 50;
        const last = i === STAGES.length - 1;
        return (
          <g key={s}>
            <rect x={x} y={18} width="40" height="22" rx="4" strokeWidth="1.2"
              style={last ? C("accent-2", "accent-2") : C("surface-2", "line-2")} />
            <text x={x + 20} y={33} textAnchor="middle" className="sc-prev-mono" fontSize="10"
              style={C(last ? "accent-ink" : "muted")}>{s}</text>
            {i < STAGES.length - 1 && (
              <path d={`M${x + 42},29 L${x + 48},29`} style={C(null, "line-2")} strokeWidth="1.2" />
            )}
          </g>
        );
      })}
      <text x={232} y={53} textAnchor="middle" className="sc-prev-mono" fontSize="7.5"
        letterSpacing=".6" style={C("dim")}>5 block-local passes</text>

      <rect x={12} y={62} width="296" height="104" rx="6" strokeWidth="1" style={C("bg", "line")} />
      {ASM.map(([op, args], i) => (
        <g key={op}>
          <text x={26} y={86 + i * 22} className="sc-prev-mono" fontSize="11"
            style={C("accent")}>{op}</text>
          <text x={72} y={86 + i * 22} className="sc-prev-mono" fontSize="11"
            style={C("muted")}>{args}</text>
        </g>
      ))}
    </Frame>
  );
}

/* ── AVE — a galaxy, on a closed form ──
   Two logarithmic arms, `r = a·e^(bθ)`, sampled at a fixed step and jittered
   by a sine of the index rather than by a random number: the same picture on
   the server and in the browser, and no seeded generator to carry around.

   Brightness falls with radius and the core is three stacked discs. One flat
   scatter of dots reads as confetti; a galaxy is a bright middle. */
const AVE_PTS = (() => {
  const pts: { x: number; y: number; r: number; o: number }[] = [];
  const K = 190;
  for (let arm = 0; arm < 2; arm++) {
    for (let i = 0; i < K; i++) {
      const th = 0.3 + (i / K) * 4.1;
      const rad = 5.6 * Math.exp(0.52 * th);
      const a = th + arm * Math.PI + Math.sin(i * 1.7) * 0.07;
      const jitter = Math.sin(i * 2.9 + arm) * (1.6 + rad * 0.1);
      pts.push({
        x: 160 + Math.cos(a) * rad * 1.62 + jitter,
        y: 88 + Math.sin(a) * rad * 0.62 + jitter * 0.4,
        r: 0.45 + (1 - i / K) * 1.2,
        o: 0.12 + (1 - i / K) * 0.76,
      });
    }
  }
  return pts;
})();

function Ave() {
  return (
    <Frame label="A spiral galaxy of simulated bodies around a bright core">
      {/* the halo, three discs rather than a gradient — the same reason the
          library's lamps step: this page does not blur to make light */}
      <ellipse cx="160" cy="88" rx="120" ry="50" style={C("accent")} opacity=".05" />
      <ellipse cx="160" cy="88" rx="66" ry="27" style={C("accent")} opacity=".07" />
      <ellipse cx="160" cy="88" rx="30" ry="13" style={C("accent-2")} opacity=".13" />
      <ellipse cx="160" cy="88" rx="13" ry="6" style={C("accent-2")} opacity=".2" />
      {AVE_PTS.map((p, i) => (
        <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={p.r.toFixed(2)}
          style={C(i % 11 === 0 ? "ember" : "accent-2")} opacity={p.o.toFixed(2)} />
      ))}
      <circle cx="160" cy="88" r="3.6" fill="#ffffff" opacity=".92" />
      <text x="14" y="170" className="sc-prev-mono" fontSize="8.5" letterSpacing="1"
        style={C("dim")}>N-BODY · GPU</text>
      <text x="306" y="170" textAnchor="end" className="sc-prev-mono" fontSize="8.5"
        style={C("live")}>60 fps</text>
    </Frame>
  );
}

/* ── Penumbra — tasks on a graph instead of a list ──
   The edges are the argument the project makes, so they go down first. Two
   nodes are done and one is blocked: a graph where every node looks the same
   is a diagram of nothing. */
const NODES = [
  { x: 40, y: 48, s: "done" }, { x: 104, y: 30, s: "done" }, { x: 92, y: 104, s: "open" },
  { x: 166, y: 66, s: "open" }, { x: 150, y: 142, s: "block" }, { x: 236, y: 40, s: "open" },
  { x: 242, y: 118, s: "open" }, { x: 292, y: 78, s: "open" },
];
const EDGES = [[0, 1], [0, 2], [1, 3], [2, 3], [2, 4], [3, 5], [3, 6], [4, 6], [5, 7], [6, 7]];
const NODE_INK: Record<string, string> = { done: "live", open: "accent", block: "ember" };

function Penumbra() {
  return (
    <Frame label="A dependency graph of tasks, some done, one blocked">
      {EDGES.map(([a, b]) => (
        <line key={`${a}-${b}`} x1={NODES[a].x} y1={NODES[a].y} x2={NODES[b].x} y2={NODES[b].y}
          style={C(null, "line-2")} strokeWidth="1.4" opacity=".85" />
      ))}
      {NODES.map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r="11" strokeWidth="1.8" style={C("surface", NODE_INK[n.s])} />
          {n.s === "done" && (
            <path d={`M${n.x - 4.5},${n.y} l3.2,3.4 l6,-6.6`} fill="none" style={C(null, "live")}
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          )}
          {n.s === "block" && <rect x={n.x - 3} y={n.y - 3} width="6" height="6" rx="1" style={C("ember")} />}
        </g>
      ))}
      <text x="14" y="170" className="sc-prev-mono" fontSize="8.5" letterSpacing="1"
        style={C("dim")}>8 TASKS · 10 EDGES</text>
    </Frame>
  );
}

/* ── F1 2026 — a lap, traced ──
   A speed trace with the braking zones in it, because a smooth curve is a sine
   wave and a lap is not: what makes this read as telemetry is that it falls off
   a cliff four times and climbs back out. Sector bars below, one purple, which
   is the only notation this sport needs. */
/** One lap: four braking zones, and a plateau on every straight. The
 *  plateaus are the whole thing — a curve that only ever rises and falls is a
 *  sine wave, and a car that is flat out is *flat*. */
const LAP = [
  [12, 60], [22, 82], [33, 93], [45, 96], [57, 97], [67, 96],
  [73, 46], [79, 28],
  [87, 43], [97, 64], [109, 81], [121, 92], [133, 96], [143, 96],
  [149, 54], [156, 34],
  [164, 50], [174, 70], [186, 86], [198, 94], [209, 96],
  [215, 42], [221, 25],
  [229, 45], [239, 67], [251, 84], [263, 93], [275, 97], [286, 96],
  [293, 57], [300, 47], [308, 66],
];
const TRACE = LAP.map(([x, v]) => `${x},${136 - v}`).join(" ");
/** Two green sectors and a purple one. Purple is the only literal colour in
 *  any of these drawings, because it is not a value the page has an opinion
 *  about — it is this sport's notation for "nobody has been quicker", the way
 *  a chequered flag is not a brand colour. */
const SECTORS = [
  { x: 12, w: 94, c: "var(--live)", t: "28.4" },
  { x: 114, w: 94, c: "#9a6bb0", t: "31.1" },
  { x: 216, w: 92, c: "var(--live)", t: "26.9" },
];

function F1() {
  return (
    <Frame label="A speed trace over one lap, with sector times below">
      {[44, 76, 108].map((y) => (
        <line key={y} x1="12" y1={y} x2="308" y2={y} style={C(null, "line")} strokeWidth="1" opacity=".65" />
      ))}
      {/* the area under the trace, then the trace itself over it */}
      <polygon points={`12,136 ${TRACE} 308,136`} style={C("accent")} opacity=".2" />
      <polyline points={TRACE} fill="none" style={C(null, "accent-2")} strokeWidth="1.8"
        strokeLinejoin="round" strokeLinecap="round" />
      <text x="12" y="24" className="sc-prev-mono" fontSize="8.5" letterSpacing="1"
        style={C("dim")}>SPEED · KM/H</text>
      <g className="sc-prev-live">
        <circle cx="302" cy="20" r="3.2" style={C("live")} />
        <text x="293" y="24" textAnchor="end" className="sc-prev-mono" fontSize="8.5"
          letterSpacing="1" style={C("live")}>LIVE</text>
      </g>
      {/* three sectors; the middle one is the fastest anybody has gone */}
      {SECTORS.map((s) => (
        <g key={s.x}>
          {/* `style`, not `fill` — two of these three are a token, and a
              token in a presentation attribute is not substituted */}
          <rect x={s.x} y={150} width={s.w} height="4" rx="2" style={{ fill: s.c }} opacity=".9" />
          <text x={s.x} y={172} className="sc-prev-mono" fontSize="9" style={C("muted")}>{s.t}</text>
        </g>
      ))}
    </Frame>
  );
}

/** project id → its drawing. Same shape as `LABS` in `ServeOverlay`: a project
 *  with no entry simply has no preview, and the card closes up around it. */
export const PREVIEWS: Record<string, () => ReactNode> = {
  "p-phalanx": Phalanx,
  "p-ricc": Ricc,
  "p-ave": Ave,
  "p-penumbra": Penumbra,
  "p-f1": F1,
};
