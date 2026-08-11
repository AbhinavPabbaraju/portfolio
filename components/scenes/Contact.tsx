"use client";
import { useEffect, useRef } from "react";
import RotatingWord from "@/components/ui/RotatingWord";
import GhostPill from "@/components/ui/GhostPill";
import Footer from "@/components/chrome/Footer";

/** donut.c, but it's my website — spinning live, zero images, all math. */
function useDonut(ref: React.RefObject<HTMLPreElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = "donut.c — paused (reduced motion)";
      return;
    }
    let A = 0, B = 0, raf = 0, last = 0;
    const W = 64, H = 24;
    const chars = ".,-~:;=!*#$@";

    /* The torus kept spinning at the top of the page, eight scenes above
       where anyone can see it. */
    let visible = false;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: "150px" });
    io.observe(el);

    /* Reused across frames rather than reallocating 1,536 cells at 20fps. */
    const b: string[] = new Array(W * H);
    const z: number[] = new Array(W * H);

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      if (t - last < 50) return; // ~20fps like the original
      last = t;
      b.fill(" ");
      z.fill(0);
      const cA = Math.cos(A), sA = Math.sin(A), cB = Math.cos(B), sB = Math.sin(B);
      for (let j = 0; j < 6.28; j += 0.07) {
        const ct = Math.cos(j), st = Math.sin(j);
        for (let i = 0; i < 6.28; i += 0.02) {
          const sp = Math.sin(i), cp = Math.cos(i);
          const h = ct + 2;
          const D = 1 / (sp * h * sA + st * cA + 5);
          const t2 = sp * h * cA - st * sA;
          const x = Math.floor(W / 2 + 24 * D * (cp * h * cB - t2 * sB));
          const y = Math.floor(H / 2 + 12 * D * (cp * h * sB + t2 * cB));
          const o = x + W * y;
          const N = Math.floor(
            8 * ((st * sA - sp * ct * cA) * cB - sp * ct * sA - st * cA - cp * ct * sB),
          );
          if (y >= 0 && y < H && x >= 0 && x < W && D > z[o]) {
            z[o] = D;
            b[o] = chars[Math.max(N, 0)];
          }
        }
      }
      let out = "";
      for (let k = 0; k < W * H; k++) out += (k % W ? "" : "\n") + b[k];
      el.textContent = out;
      A += 0.05; B += 0.025;
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, [ref]);
}

export default function Contact() {
  const donut = useRef<HTMLPreElement>(null);
  useDonut(donut);
  return (
    <section className="contact" id="contact">
      <div className="wrap">
        <h2>
          Let’s build<br />
          something <RotatingWord words={["fast", "big", "bold", "effective", "correct", "that lasts"]} />
          <span className="rotor-dot">.</span>
        </h2>
        <p className="sub">
          Open to internships and collaborations in systems, low-latency, and infrastructure.
          Fastest reply is by email. <span className="hand">— no really, email me :)</span>
        </p>
        <div className="cta-row">
          <GhostPill href="mailto:pabhinav2006@gmail.com">Email me</GhostPill>
          <GhostPill href="https://github.com/AbhinavPabbaraju" target="_blank" rel="noopener noreferrer">GitHub ↗</GhostPill>
          <GhostPill href="https://www.linkedin.com/in/abhinav-pabbaraju" target="_blank" rel="noopener noreferrer">LinkedIn ↗</GhostPill>
        </div>
        {/* The transmissive glass band used to sit here, between the CTAs and
            the donut. Two showpieces stacked under the one thing this section
            exists to do pushed the headline and the email button off the top
            of the screen — and its in-canvas type read "SAY HELLO ↗", which is
            what the buttons above it already say. It was also the most
            expensive thing on the page: transmission re-renders the scene to
            an offscreen buffer every frame. */}
        <pre className="ascii donut" ref={donut} aria-hidden />
        <div className="ascii-cap">^ donut.c, but it’s my website — spinning live, zero images, all math</div>
      </div>
      <Footer />
    </section>
  );
}
