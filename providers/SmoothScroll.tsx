"use client";
import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { setLenis, scrollToTarget } from "@/lib/lenis";
import { SCROLL_LERP } from "@/lib/motion";

/** Lenis smooth scroll, driven by the GSAP ticker so ScrollTrigger
 *  and Lenis share one clock (the documented integration). */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let lenis: Lenis | null = null;
    let tick: ((time: number) => void) | null = null;

    if (!reduce) {
      /* Slightly longer lerp than before: the deck's scrubbed scenes trail
         the scroll position, so a snappier scroll made the page feel like
         it was catching up to the pointer rather than moving with it.
         The value itself lives in lib/motion.ts with the rest of the
         motion vocabulary — it is the one smoothing number everything
         else on the page is measured against. */
      lenis = new Lenis({ lerp: SCROLL_LERP, wheelMultiplier: 1, touchMultiplier: 1.6 });
      setLenis(lenis);
      lenis.on("scroll", ScrollTrigger.update);
      tick = (time: number) => lenis!.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    }

    /* Anchors go through Lenis too, so in-page travel uses the same curve
       as the scroll wheel instead of the browser's native animation. */
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.<HTMLAnchorElement>('a[href^="#"]');
      const href = a?.getAttribute("href");
      if (!href || href.length < 2) return;
      const el = document.querySelector<HTMLElement>(href);
      if (!el) return;
      e.preventDefault();
      scrollToTarget(el);
      /* Preventing the default also cancels the focus move the browser would
         have made, which is what a skip link is for. Anything that declares
         itself a focus target gets it back — without scrolling, since Lenis
         is already on its way there. */
      if (el.hasAttribute("tabindex")) el.focus({ preventScroll: true });
      history.replaceState(null, "", href);
    };
    document.addEventListener("click", onClick);

    /* Web fonts land after the deck has already measured itself; without a
       refresh every pin sits a few hundred pixels off its scene. */
    let raf = 0;
    const settle = () => { raf = requestAnimationFrame(() => ScrollTrigger.refresh()); };
    document.fonts?.ready.then(settle);

    return () => {
      document.removeEventListener("click", onClick);
      cancelAnimationFrame(raf);
      if (tick) gsap.ticker.remove(tick);
      lenis?.destroy();
      setLenis(null);
    };
  }, []);
  return <>{children}</>;
}
