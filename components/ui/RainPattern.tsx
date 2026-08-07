"use client";
import { useEffect, useRef, useState } from "react";

/** Falling-rain backdrop for a section that would otherwise be bare.
 *
 *  Pure CSS — the pattern is `.rainbg` in `globals.css` ("quiet-snail-9" by
 *  SelfMadeSystem, uiverse.io, MIT). All this adds is the gate.
 *
 *  It needs one: the effect animates `background-position` across 36 gradient
 *  layers, which cannot be composited, so it repaints its whole box every
 *  frame for as long as it runs. The animation is therefore authored `paused`
 *  and only `.is-live` sets it running, which is the same contract the R3F
 *  canvases take their `frameloop` from. Reduced motion drops the animation in
 *  CSS and leaves the pattern standing still, so the texture survives without
 *  the motion.
 *
 *  `ground` is the colour the dot grid paints with — the grid is what chops the
 *  streaks into dashes, and it has to match whatever the section's background
 *  actually is, or it reads as a visible dot grid instead of disappearing into
 *  it. Defaults to the page ground.
 */
export default function RainPattern({ ground }: { ground?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    /* A little margin so it is already running by the time it is looked at,
       rather than starting the instant its top edge crosses. */
    const io = new IntersectionObserver(([e]) => setLive(e.isIntersecting), { rootMargin: "120px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`rainbg${live ? " is-live" : ""}`}
      style={ground ? ({ "--rainbg-ground": ground } as React.CSSProperties) : undefined}
      aria-hidden
    />
  );
}
