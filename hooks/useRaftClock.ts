"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { RaftCluster, TICK_MS, type RaftEvent, type Snapshot } from "@/lib/raft/simulator";

interface Options {
  playing: boolean;
  /** 1 = one simulated tick per TICK_MS of real time. */
  speed: number;
  /** The element the clock watches — offscreen, nothing runs. */
  host: React.RefObject<HTMLElement | null>;
  /** Reduced motion runs no clock at all; Step is the only way forward. */
  paused?: boolean;
}

/** The playground's only timer.
 *
 *  One rAF loop drives the whole thing. It accumulates real elapsed time
 *  and spends it in whole logical ticks, so the simulation runs at the
 *  same rate on a 60Hz and a 144Hz display — a fixed step per frame
 *  would run this 2.4× fast on the latter. Speed lives in a ref so
 *  dragging the slider retunes the loop instead of tearing it down and
 *  losing the accumulator.
 *
 *  An IntersectionObserver parks it when the panel scrolls away, and the
 *  frame delta is clamped so returning to a backgrounded tab resumes
 *  rather than fast-forwarding through a minute of consensus. */
export function useRaftClock(cluster: RaftCluster, { playing, speed, host, paused }: Options) {
  const [snapshot, setSnapshot] = useState<Snapshot>(() => cluster.snapshot());
  const [events, setEvents] = useState<RaftEvent[]>([]);
  const speedRef = useRef(speed);
  const visible = useRef(true);

  speedRef.current = speed;

  /** One tick, by hand. Also how the Step button works. */
  const step = useCallback(() => {
    const produced = cluster.step();
    setSnapshot(cluster.snapshot());
    if (produced.length) setEvents(produced);
  }, [cluster]);

  /** Re-read the cluster without advancing it — after a reset or a kill. */
  const sync = useCallback((produced: RaftEvent[] = []) => {
    setSnapshot(cluster.snapshot());
    setEvents(produced);
  }, [cluster]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => { visible.current = entries[0].isIntersecting; }, { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [host]);

  useEffect(() => {
    if (!playing || paused) return;
    let raf = 0;
    let last = 0;
    let acc = 0;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!last) { last = now; return; }
      const dt = Math.min(now - last, 250);
      last = now;
      if (!visible.current) return;

      acc += dt;
      const stepMs = TICK_MS / Math.max(0.25, speedRef.current);
      /* Cap catch-up: a long frame should drop ticks, not spend the
         next second replaying them. */
      let steps = 0;
      const produced: RaftEvent[] = [];
      while (acc >= stepMs && steps < 4) {
        produced.push(...cluster.step());
        acc -= stepMs;
        steps++;
      }
      if (acc > stepMs) acc = stepMs;
      if (!steps) return;
      setSnapshot(cluster.snapshot());
      if (produced.length) setEvents(produced);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, paused, cluster]);

  return { snapshot, events, step, sync };
}
