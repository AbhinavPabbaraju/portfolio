"use client";
import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { lerpFactor } from "@/lib/motion";

const CONTENT =
  "PERFORMANCE <b>×</b> X86-64 <b>×</b> SYSTEMS <b>×</b> <span class=\"v\">RUST</span> <b>×</b> C++23 <b>×</b> LOW-LATENCY <b>×</b> <span class=\"v\">P99</span> <b>×</b> ";

/** Velocity-reactive marquee — scroll speed boosts travel. GSAP-owned. */
export default function KineticStrip() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.querySelectorAll<HTMLElement>(".k-row").forEach((row) => {
      const unit = row.querySelector("span")!;
      unit.innerHTML = CONTENT.repeat(3);
      row.appendChild(unit.cloneNode(true));
    });
    if (reduce) return;

    const rows = Array.from(el.querySelectorAll<HTMLElement>(".k-row"));
    const speed = { v: 1, target: 1 };
    const st = ScrollTrigger.create({
      onUpdate(self) {
        /* Aim at the boost instead of snapping to it — jumping straight to
           3× on the first fast frame was itself a visible hitch. */
        speed.target = Math.max(speed.target, 1 + Math.min(Math.abs(self.getVelocity()) / 900, 3.2));
      },
    });

    const offsets = rows.map(() => 0);
    /* Everything below is per second, not per frame. The old loop advanced
       a fixed step per tick, so the strip crawled at 30Hz and sprinted on a
       144Hz display. */
    const tick = (_time: number, deltaMs: number) => {
      const dt = Math.min(deltaMs, 50) / 1000;
      speed.v += (speed.target - speed.v) * lerpFactor(0.22, dt);
      speed.target += (1 - speed.target) * lerpFactor(0.04, dt);
      rows.forEach((row, i) => {
        const dir = row.classList.contains("alt") ? 1 : -1;
        offsets[i] = (offsets[i] + dir * 2.4 * speed.v * dt) % 50;
        /* Each row holds the content twice, so 50% of its own width is one
           full copy and wrapping there is seamless. A row travelling right
           has to sit one copy to the LEFT of its origin, otherwise the
           translation is positive and drags a widening empty gap in behind
           it until the modulo snaps back. */
        row.style.transform = `translate3d(${offsets[i] - (dir > 0 ? 50 : 0)}%,0,0)`;
      });
    };
    gsap.ticker.add(tick);
    return () => { gsap.ticker.remove(tick); st.kill(); };
  }, []);

  return (
    <div className="kinetic" ref={root} aria-hidden>
      <div className="k-row"><span /></div>
      <div className="k-row alt"><span /></div>
    </div>
  );
}
