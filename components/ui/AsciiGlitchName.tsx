"use client";
import { useEffect, useRef } from "react";
import { refreshDeck } from "@/lib/lenis";

/** The hero title rendered as living ASCII — faithful port of the legacy
 *  module: canvas-sampled type, per-row wave, scanline dimming, accent
 *  mapping for "raju", sage glitch rows, and a scramble-in reveal.
 *  Reduced motion renders the plain type instead. The real name lives in
 *  the h1 as sr-only text (owned by Hero). */
export default function AsciiGlitchName({
  l1 = "Abhinav", l2a = "Pabba", l2b = "raju",
}: { l1?: string; l2a?: string; l2b?: string }) {
  const wrap = useRef<HTMLSpanElement>(null);
  const reduce = useRef(false);

  useEffect(() => {
    reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce.current) return;

    const h1 = wrap.current!.closest("h1");
    if (!h1) return;
    h1.classList.add("asciified");
    const RAMP = " .:-=+*#%@";
    let cv: HTMLCanvasElement | null = null;
    let ctx2: CanvasRenderingContext2D;
    let cols = 0, rows = 0, S = 8, CW = 5;
    let grid: Float32Array | null = null;
    let accent: Uint8Array | null = null;
    let t = 0, prog = 0;
    const glitch = { until: 0, next: 800, row: 0, off: 0 };

    const build = () => {
      const fs = parseFloat(getComputedStyle(h1).fontSize);
      const lineH = fs * 0.92;
      S = Math.max(6, Math.round(lineH / 14));
      CW = S * 0.62;
      let R = Math.max(8, Math.round(lineH / S));
      cols = Math.floor(h1.clientWidth / CW);
      rows = Math.ceil(R * 2.3) + 2;

      // sample pass: red channel = all text, green = the accent "raju"
      const off = document.createElement("canvas");
      off.width = cols; off.height = rows;
      const o = off.getContext("2d", { willReadFrequently: true })!;
      const prep = () => {
        o.setTransform(1 / 0.62, 0, 0, 1, 0, 0);   // pre-stretch x so cell aspect keeps proportions
        o.textBaseline = "alphabetic";
        o.font = `700 ${R}px 'Syne', sans-serif`;
      };
      prep();
      const needW = Math.max(o.measureText(l1).width, o.measureText(l2a + l2b).width) / 0.62;
      if (needW > cols - 2) {                       // auto-fit when the face runs wide
        R = Math.max(8, Math.floor((R * (cols - 2)) / needW));
        rows = Math.ceil(R * 2.3) + 2;
        off.height = rows;
        prep();
      }
      o.fillStyle = "#f00";
      o.fillText(l1, 1, R * 1.0);
      o.fillText(l2a, 1, R * 2.18);
      const w2 = o.measureText(l2a).width;
      o.fillStyle = "#0f0";
      o.fillText(l2b, 1 + w2, R * 2.18);
      const d = o.getImageData(0, 0, cols, rows).data;
      grid = new Float32Array(cols * rows);
      accent = new Uint8Array(cols * rows);
      for (let i = 0; i < cols * rows; i++) {
        grid[i] = Math.max(d[i * 4], d[i * 4 + 1]) / 255;
        accent[i] = d[i * 4 + 1] > d[i * 4] ? 1 : 0;
      }
      if (!cv) {
        cv = document.createElement("canvas");
        cv.setAttribute("aria-hidden", "true");
        wrap.current!.appendChild(cv);
      }
      cv.width = Math.floor(cols * CW);
      cv.height = rows * S;
      cv.style.width = cv.width + "px";
      cv.style.height = cv.height + "px";
      ctx2 = cv.getContext("2d")!;

      /* The canvas replacing the fallback type changes the hero's height,
         and the hero is the deck's first pin. Without this the whole stack
         sits on stale measurements until the next resize — which is the
         lurch you get the first time you scroll off the hero. */
      refreshDeck();
    };

    const render = () => {
      t += 0.033;
      ctx2.clearRect(0, 0, cv!.width, cv!.height);
      ctx2.font = `${S}px 'JetBrains Mono', monospace`;
      ctx2.textBaseline = "top";
      const now = performance.now();
      if (now > glitch.next) {
        glitch.until = now + 110 + Math.random() * 170;
        glitch.next = glitch.until + 450 + Math.random() * 900;
        glitch.row = (Math.random() * rows) | 0;
        glitch.off = ((Math.random() * 10 - 5) | 0) || 3;
      }
      const glitching = now < glitch.until;
      for (let r = 0; r < rows; r++) {
        const wave = Math.sin(t * 1.7 + r * 0.33) * 1.15;
        const hot = glitching && Math.abs(r - glitch.row) < 2;
        const dim = r % 2 ? 0.72 : 1;
        for (let c = 0; c < cols; c++) {
          const sc = Math.round(c + wave + (hot ? glitch.off : 0));
          if (sc < 0 || sc >= cols) continue;
          const i = r * cols + sc;
          const v = grid![i];
          if (v < 0.14) continue;
          if (((r * 31 + c * 7) % 97) / 97 > prog) continue;   // scramble-in mask
          const ch = hot && Math.random() < 0.35
            ? RAMP[(1 + Math.random() * 8) | 0]
            : RAMP[Math.min(RAMP.length - 1, (v * RAMP.length) | 0)];
          ctx2.fillStyle = hot ? "#86b0a6"
            : accent![i] ? (v > 0.72 ? "#8fbcd4" : "#5b93b3")
            : v > 0.78 ? `rgba(232,238,241,${dim})` : `rgba(159,179,189,${dim * 0.9})`;
          ctx2.fillText(ch, c * CW, r * S);
        }
      }
    };

    let visible = true, last = 0, raf = 0, t0 = 0;
    const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0 });
    const hero = h1.closest(".hero");
    if (hero) io.observe(hero);

    let rt: ReturnType<typeof setTimeout>;
    const onResize = () => { clearTimeout(rt); rt = setTimeout(build, 180); };

    const ready = document.fonts ? document.fonts.ready : Promise.resolve();
    ready.then(() => {
      build();
      const loop = (now: number) => {
        raf = requestAnimationFrame(loop);
        if (!visible || !grid) return;
        if (now - last < 32) return;                // ~30fps, like the original
        last = now;
        if (!t0) t0 = now + 150;                    // scramble-in starts on first frame
        prog = Math.min(1, Math.max(0, (now - t0) / 1100));
        render();
      };
      raf = requestAnimationFrame(loop);
      window.addEventListener("resize", onResize);
    });

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", onResize);
      clearTimeout(rt);
      h1.classList.remove("asciified");
      cv?.remove();
    };
  }, [l1, l2a, l2b]);

  return (
    <span ref={wrap} className="ascii-name-host" aria-hidden>
      {/* reduced motion / pre-boot fallback: the plain type */}
      <span className="ascii-fallback">
        <span className="row"><span>{l1}</span></span>
        <span className="row"><span>{l2a}<span className="accent">{l2b}</span></span></span>
      </span>
    </span>
  );
}
