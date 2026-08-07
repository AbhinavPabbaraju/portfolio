"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { RaftCluster, MAX_LOG, TICK_MS, type Message, type RaftEvent, type RaftNode } from "@/lib/raft/simulator";
import { useRaftClock } from "@/hooks/useRaftClock";
import { DUR, EASE_OUT } from "@/lib/motion";

/* Ring geometry, in the SVG's own viewBox. */
const VB = 320;
const C = VB / 2;
const RING = 106;
const NODE_R = 27;

/** In-flight messages are bounded by the protocol, but cap what gets
 *  drawn anyway — a burst during a contested election is the one moment
 *  this could ask for a few dozen extra elements per frame. */
const MAX_DOTS = 24;
/** How many log cells fit on a row before the front is elided. */
const LOG_WINDOW = 14;

const ROLE_LABEL: Record<RaftNode["role"], string> = {
  leader: "leader",
  candidate: "candidate",
  follower: "follower",
};

/** Where a message is, as a fraction of its trip, at a given tick.
 *  Framer tweens between consecutive ticks, so travel reads as continuous
 *  while the position itself stays the simulator's, not the animation's. */
function progress(m: Message, tick: number): number {
  const span = Math.max(1, m.arrivesAt - m.sentAt);
  return Math.min(1, Math.max(0, (tick - m.sentAt) / span));
}

function dotClass(m: Message): string {
  switch (m.kind) {
    case "vote-req": return "is-vote";
    case "vote-res": return m.granted ? "is-yes" : "is-no";
    case "append": return m.entries && m.entries.length ? "is-append" : "is-beat";
    case "append-res": return m.success ? "is-yes" : "is-no";
  }
}

/** One line of plain English for the live region. A tick can produce
 *  several events; announce the one that changed the most. */
function announce(events: RaftEvent[]): string | null {
  const pick = (kind: RaftEvent["kind"]) => events.find((e) => e.kind === kind);
  const leader = pick("leader");
  if (leader && leader.kind === "leader") return `Node ${leader.nodeId} elected leader, term ${leader.term}.`;
  const down = pick("down");
  if (down && down.kind === "down") return `Node ${down.nodeId} taken offline.`;
  const up = pick("up");
  if (up && up.kind === "up") return `Node ${up.nodeId} back online.`;
  const candidate = pick("candidate");
  if (candidate && candidate.kind === "candidate") return `Node ${candidate.nodeId} standing for election, term ${candidate.term}.`;
  const commit = pick("commit");
  if (commit && commit.kind === "commit") return `Entry ${commit.index} committed: ${commit.command}.`;
  return null;
}

export default function RaftPlayground() {
  const host = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion() ?? false;

  /* One cluster for the life of the mount. The serve overlay unmounts
     this on close, which is also what stops the clock. */
  const cluster = useMemo(() => new RaftCluster({ size: 5, seed: 20260804 }), []);

  const [playing, setPlaying] = useState(!reduced);
  const [speed, setSpeed] = useState(1);
  const [message, setMessage] = useState("");

  const { snapshot, events, step, sync } = useRaftClock(cluster, {
    playing,
    speed,
    host,
    paused: reduced,
  });

  useEffect(() => {
    const line = announce(events);
    if (line) setMessage(line);
  }, [events]);

  const toggle = useCallback((id: number) => {
    sync(cluster.toggleNode(id));
  }, [cluster, sync]);

  const reset = useCallback(() => {
    cluster.reset();
    sync([]);
    setMessage("Cluster reset. Five followers, term 0, empty logs.");
  }, [cluster, sync]);

  const size = snapshot.nodes.length;
  const pts = useMemo(
    () => Array.from({ length: size }, (_, i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / size;
      return { x: C + RING * Math.cos(a), y: C + RING * Math.sin(a) };
    }),
    [size],
  );

  /* Every pair, drawn once — the links are context, not data. */
  const links = useMemo(() => {
    const out: { key: string; a: { x: number; y: number }; b: { x: number; y: number } }[] = [];
    for (let i = 0; i < pts.length; i++)
      for (let j = i + 1; j < pts.length; j++)
        out.push({ key: `${i}-${j}`, a: pts[i], b: pts[j] });
    return out;
  }, [pts]);

  const dots = snapshot.messages.slice(0, MAX_DOTS);
  /* One tick of real time at the current speed — the tween that carries
     a dot from where it was last tick to where it is now. */
  const travel = reduced ? 0 : TICK_MS / speed / 1000;
  const leader = snapshot.leaderId;
  const aliveCount = snapshot.nodes.filter((n) => n.alive).length;
  const quorum = Math.floor(size / 2) + 1;

  return (
    <div className="lab raft" ref={host}>
      <p className="lab-note">
        Five pots, one recipe. The leader takes every order and copies it to the others before
        it counts as served, so the counter can lose a pot mid-service and dinner still arrives.
        Take one offline below and watch the rest hold a vote, pick a new leader, and catch the
        stragglers back up.
      </p>

      <div className="raft-stage">
        <svg className="raft-ring" viewBox={`0 0 ${VB} ${VB}`} role="group" aria-label="Cluster of five nodes. Select a node to take it offline or bring it back.">
          <g className="raft-links" aria-hidden>
            {links.map((l) => <line key={l.key} x1={l.a.x} y1={l.a.y} x2={l.b.x} y2={l.b.y} />)}
          </g>

          <g className="raft-dots" aria-hidden>
            <AnimatePresence initial={false}>
              {dots.map((m) => {
                const a = pts[m.from], b = pts[m.to];
                if (!a || !b) return null;
                const p = progress(m, snapshot.tick);
                return (
                  <motion.circle
                    key={m.id}
                    className={`raft-dot ${dotClass(m)}`}
                    r={m.kind === "append" && m.entries?.length ? 4.6 : 3.4}
                    /* cx/cy are SVG attributes, not transforms — scaling a
                       circle here would move it, since an SVG transform
                       origin is the viewBox corner, not the shape. */
                    initial={{ cx: a.x, cy: a.y, opacity: 0 }}
                    animate={{ cx: a.x + (b.x - a.x) * p, cy: a.y + (b.y - a.y) * p, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      cx: { duration: travel, ease: "linear" },
                      cy: { duration: travel, ease: "linear" },
                      opacity: { duration: reduced ? 0 : DUR.xs, ease: EASE_OUT },
                    }}
                  />
                );
              })}
            </AnimatePresence>
          </g>

          {snapshot.nodes.map((n, i) => {
            const at = pts[i];
            const committed = n.commitIndex;
            const label =
              `Node ${n.id}, ${n.alive ? ROLE_LABEL[n.role] : "offline"}, term ${n.currentTerm}, ` +
              `${n.log.length} entries, ${committed} committed. ` +
              `Press to bring it ${n.alive ? "down" : "back"}.`;
            return (
              <g
                key={n.id}
                className={`raft-node role-${n.alive ? n.role : "dead"}`}
                transform={`translate(${at.x} ${at.y})`}
                role="button"
                tabIndex={0}
                aria-pressed={!n.alive}
                aria-label={label}
                onClick={() => toggle(n.id)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter" && e.key !== " ") return;
                  e.preventDefault();
                  toggle(n.id);
                }}
              >
                <circle className="raft-focus" r={NODE_R + 7} />
                {n.alive && n.role === "candidate" && !reduced && (
                  <motion.circle
                    className="raft-halo"
                    initial={{ r: NODE_R, opacity: 0.55 }}
                    animate={{ r: [NODE_R, NODE_R + 9, NODE_R], opacity: [0.55, 0, 0.55] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
                <circle className="raft-disc" r={NODE_R} />
                <text className="raft-id" y={-4}>N{n.id}</text>
                <text className="raft-term" y={11}>t{n.currentTerm}</text>
                {n.alive && n.role === "leader" && <text className="raft-crown" y={-NODE_R - 9}>leader</text>}
                {!n.alive && <text className="raft-crown" y={-NODE_R - 9}>down</text>}
              </g>
            );
          })}
        </svg>

        <div className="raft-roster">
          <div className="raft-roster-head">
            <span>node</span>
            <span>state</span>
            <span>log — committed entries are solid</span>
          </div>
          {snapshot.nodes.map((n) => {
            const elided = Math.max(0, n.log.length - LOG_WINDOW);
            const cells = n.log.slice(elided);
            return (
              <div className={`raft-row role-${n.alive ? n.role : "dead"}`} key={n.id}>
                <span className="raft-row-id">N{n.id}</span>
                <span className="raft-row-state">
                  {n.alive ? ROLE_LABEL[n.role] : "offline"}
                  <em>t{n.currentTerm}</em>
                </span>
                <span className="raft-cells">
                  {elided > 0 && <i className="raft-elide">+{elided}</i>}
                  {cells.map((entry, k) => {
                    const index = elided + k + 1;
                    return (
                      <i
                        key={index}
                        className={`raft-cell ${index <= n.commitIndex ? "is-committed" : "is-pending"}`}
                        title={`${index}. ${entry.command} (term ${entry.term})`}
                      />
                    );
                  })}
                  {!cells.length && <i className="raft-empty">empty</i>}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="raft-legend" aria-hidden>
        <span><i className="raft-key is-vote" />RequestVote</span>
        <span><i className="raft-key is-append" />AppendEntries</span>
        <span><i className="raft-key is-beat" />heartbeat</span>
        <span><i className="raft-key is-yes" />yes / ack</span>
        <span><i className="raft-key is-no" />no / retry</span>
      </div>

      <div className="lab-controls">
        <button
          type="button"
          className="lab-btn is-primary"
          onClick={() => setPlaying((p) => !p)}
          disabled={reduced}
          aria-label={playing ? "Pause the cluster" : "Run the cluster"}
        >
          {playing ? "Pause" : "Play"}
        </button>
        <button type="button" className="lab-btn" onClick={step} aria-label="Advance the cluster one tick">
          Step
        </button>
        <button type="button" className="lab-btn" onClick={reset} aria-label="Reset the cluster to term zero">
          Reset
        </button>
        <label className="raft-speed">
          <span>speed</span>
          <input
            type="range"
            min={0.5} max={4} step={0.5}
            value={speed}
            disabled={reduced}
            onChange={(e) => setSpeed(Number(e.target.value))}
            aria-label="Simulation speed"
          />
          <em>{speed.toFixed(1)}×</em>
        </label>
      </div>

      <p className="lab-status">
        tick {snapshot.tick} · {aliveCount} of {size} up · quorum {quorum} ·{" "}
        {leader === null ? "no leader — an election is due" : `leader N${leader}`}
        {snapshot.logFull && ` · log full at ${MAX_LOG} — real Raft would snapshot and compact here`}
        {aliveCount < quorum && " · no quorum, so nothing can commit until a node comes back"}
      </p>

      {reduced && (
        <p className="lab-status">
          Reduced motion is on, so the clock is off. Use Step to advance the cluster one tick at a time.
        </p>
      )}

      <p className="lab-fineprint">
        A teaching model, not the real thing — Phalanx itself is Go. This one skips log compaction,
        snapshotting, persistence and network partitions, and its only failure mode is the one you
        control. Same seed, same clicks, same run.
      </p>

      <p className="lab-live" role="status" aria-live="polite">{message}</p>
    </div>
  );
}
