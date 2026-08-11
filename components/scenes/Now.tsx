"use client";
import { motion, useReducedMotion } from "framer-motion";
import SectionHead from "@/components/ui/SectionHead";
import { DUR, EASE } from "@/lib/motion";

const CARDS = [
  { n: "01", stat: "Building", h: "F1 2026 analytics",
    p: "Polishing the live dashboard — real APIs, a Monte Carlo championship simulator, and a 3D globe, all in a single premium-feel app.",
    link: { href: "https://f1-dashboard-mu.vercel.app", label: "open it ↗" }, tilt: -1.6 },
  { n: "02", stat: "Reimplementing", h: "Papers → code",
    p: "Working through PagedAttention as a mini-vLLM build — the best way to actually read a systems paper is to make it run.", tilt: 1.2 },
  { n: "03", stat: "Sharpening", h: "Systems & low-latency depth",
    p: "Pushing toward FAANG and HFT — an LMAX-style limit-order-book matching engine is next on the bench, chasing microseconds.", tilt: -0.8 },
];

/** Three lanes, three cards, all on screen.
 *
 *  These used to be a `CardSwap` stack — one card visible, the other two
 *  tucked behind it on a 4.2s timer. Three is few enough to just show, and
 *  the stack was costing twice over: it hid two thirds of the section's
 *  content, and it was the one thing on a scrub-driven page that moved on
 *  wall-clock time whether you were looking at it or not.
 *
 *  Cards drop in crooked like stickers — Framer Motion owns this. */
export default function Now() {
  const reduce = useReducedMotion();
  return (
    <section className="block" id="now">
      <div className="wrap">
        <SectionHead title="On the grid this season." />
        <p className="now-intro">
          Three lanes open at once: the F1 dashboard getting its final polish,
          a systems paper turning into running code, and the next benchmark on the bench.
        </p>
        <div className="now-grid">
          {CARDS.map((c, i) => (
            <motion.div
              className="now-card"
              key={c.n}
              initial={reduce ? false : { y: 46, rotate: c.tilt * 3, opacity: 0 }}
              whileInView={{ y: 0, rotate: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: DUR.md, delay: i * 0.1, ease: EASE.out }}
            >
              <span className="num-pill" aria-hidden>{c.n}</span>
              <div className="stat"><span className="dot" />{c.stat}</div>
              <h3>{c.h}</h3>
              <p>{c.p}</p>
              {c.link && (
                <a className="golink" href={c.link.href} target="_blank" rel="noopener noreferrer">{c.link.label}</a>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
