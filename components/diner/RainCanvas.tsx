"use client";
import { useEffect, useRef } from "react";

interface Drop { far: boolean; x: number; y: number; len: number; sp: number; o: number; drift: number }
interface Splash { x: number; y: number; life: number }

/** Canvas drizzle over the backstreet: two depth layers + ground splashes. */
export default function RainCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { cv.remove(); return; }
    const ctx = cv.getContext("2d")!;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;

    /** Rain fills whatever box the element actually occupies, and the
     *  count scales with that area so a wide screen gets a full street
     *  of rain rather than the same handful of drops stretched thin. */
    const size = () => {
      const r = cv.getBoundingClientRect();
      if (!r.width || !r.height) return;
      W = r.width; H = r.height;
      cv.width = W * DPR; cv.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      stock();
    };

    const mobile = window.innerWidth < 760;
    const drops: Drop[] = [];

    const splashes: Splash[] = [];
    const reset = (d: Drop, init = false) => {
      d.far = Math.random() < 0.45;
      d.x = Math.random() * (W + 140) - 70;
      d.y = init ? Math.random() * H : -30 - Math.random() * 90;
      d.len = d.far ? 6 + Math.random() * 8 : 11 + Math.random() * 15;
      d.sp = (d.far ? 0.55 : 1) * (H * 0.012 + Math.random() * H * 0.012);
      d.o = d.far ? 0.04 + Math.random() * 0.06 : 0.08 + Math.random() * 0.12;
      d.drift = (d.far ? 0.8 : 1.4) + Math.random() * 0.9;
    };

    /** One drop per ~11k css px of surface, floored so a short box still
     *  rains and capped so an ultrawide one cannot run away with the
     *  frame budget. */
    const stock = () => {
      const want = mobile ? 55 : Math.max(90, Math.min(340, Math.round((W * H) / 11000)));
      while (drops.length > want) drops.pop();
      while (drops.length < want) { const d = {} as Drop; reset(d, true); drops.push(d); }
    };

    /* Measured from the element, not the window. The diner sets its own
       heights after mount and the stage sizes off an aspect-ratio, so a
       one-shot measure on mount latched a stale box and the rain fell in
       whatever strip that happened to be. */
    size();
    const ro = new ResizeObserver(size);
    ro.observe(cv);

    let running = false, raf = 0;
    const io = new IntersectionObserver((es) => { running = es[0].isIntersecting; }, { threshold: 0 });
    io.observe(cv);

    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!running || !W) return;
      ctx.clearRect(0, 0, W, H);
      ctx.lineCap = "round";
      for (const d of drops) {
        d.y += d.sp; d.x -= d.drift;
        if (d.y > H * 0.965) {
          if (!d.far && Math.random() < 0.35)
            splashes.push({ x: d.x, y: H * (0.965 + Math.random() * 0.028), life: 1 });
          reset(d);
        }
        ctx.strokeStyle = `rgba(176,188,232,${d.o})`;
        ctx.lineWidth = d.far ? 0.8 : 1.1;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.drift * 2.4, d.y - d.len);
        ctx.stroke();
      }
      for (let j = splashes.length - 1; j >= 0; j--) {
        const s = splashes[j];
        s.life -= 0.07;
        if (s.life <= 0) { splashes.splice(j, 1); continue; }
        const r = (1 - s.life) * 6.5 + 1.5;
        ctx.strokeStyle = `rgba(176,188,232,${s.life * 0.16})`;
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, r, r * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); };
  }, []);
  return <canvas className="rain-fx" ref={ref} aria-hidden />;
}
