"use client";
import type Lenis from "lenis";
import { ScrollTrigger } from "@/lib/gsap";
import { DUR, expoOut, prefersReducedMotion } from "@/lib/motion";

/** Module-level singleton so any component can drive scroll. */
let lenis: Lenis | null = null;
export const setLenis = (l: Lenis | null) => { lenis = l; };
export const getLenis = () => lenis;

/** Instant, deterministic scroll — used when the diner changes height. */
export function scrollToY(y: number) {
  if (lenis) lenis.scrollTo(y, { immediate: true });
  else window.scrollTo(0, y);
}

/** Height of the fixed chrome currently overlapping the top of the page,
 *  measured rather than hardcoded — the news bar retracts on scroll. */
function chromeOffset() {
  let h = 0;
  for (const sel of [".newsbar", ".cardnav"]) {
    const el = document.querySelector<HTMLElement>(sel);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    if (r.bottom > 0) h = Math.max(h, r.bottom);
  }
  return h;
}

/** The one way to travel to a target.
 *
 *  Everything routes through here — nav anchors, the carousel hand-off,
 *  the diner's `gotoDish`. Native `scrollIntoView({behavior:"smooth"})`
 *  and `html{scroll-behavior:smooth}` each run their own animation on top
 *  of Lenis's, and the two fight over the same scroll position for the
 *  length of the journey, which is the shudder you feel on a nav click. */
export function scrollToTarget(
  target: string | HTMLElement,
  { block = "start", offset = 0 }: { block?: "start" | "center"; offset?: number } = {},
) {
  const el = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
  if (!el) return;

  let off = offset - (block === "start" ? chromeOffset() + 12 : 0);
  if (block === "center") {
    off -= Math.max(0, (window.innerHeight - el.getBoundingClientRect().height) / 2);
  }

  const reduce = prefersReducedMotion();
  if (lenis) {
    lenis.scrollTo(el, { offset: off, duration: reduce ? 0 : DUR.scene, easing: expoOut });
    return;
  }
  const y = el.getBoundingClientRect().top + window.scrollY + off;
  window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
}

/** Re-measure the scroll deck after any layout mutation. */
export function refreshDeck() {
  ScrollTrigger.refresh();
}
