"use client";
import { useEffect, useState } from "react";

/** Has the page scrolled past the top band?
 *
 *  Two things read this — the news bar retracts, the nav slides up to take
 *  its place — and they used to run separate listeners against a bare
 *  `scrollY > 24`. Resting anywhere near that line (or arriving there on a
 *  Lenis ease-out, which crosses it several times) toggled both bars on and
 *  off together. The gap between `enter` and `exit` gives it a deadband,
 *  and the rAF throttle keeps the two in the same frame. */
export function useScrolledPast(enter = 72, exit = 24) {
  const [past, setPast] = useState(false);

  useEffect(() => {
    let raf = 0;
    let cur = false;
    const read = () => {
      raf = 0;
      const y = window.scrollY;
      const next = cur ? y > exit : y > enter;
      if (next !== cur) { cur = next; setPast(next); }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [enter, exit]);

  return past;
}
