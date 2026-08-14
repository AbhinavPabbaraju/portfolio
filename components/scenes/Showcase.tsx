"use client";
import { useCallback } from "react";
import { scrollToTarget } from "@/lib/lenis";
import RainPattern from "@/components/ui/RainPattern";
import Carousel from "@/components/showcase/Carousel";

/** The work, as a row of cards the scroll pans along.
 *
 *  This scene is composition only — the head, the backdrop, the word behind
 *  the row and the hint. Everything that moves lives in `Carousel`, and
 *  everything a card shows lives in `Card` and `previews`.
 *
 *  Opening a card hands off to the diner: `gotoDish` is the counter's own
 *  entry point, which serves the dish with its overlay rather than merely
 *  scrolling to it. `scrollToTarget` is the fallback for the window in which
 *  the diner has not mounted yet, and it goes through Lenis because nothing
 *  on this page is allowed to start a second scroll animation. */
export default function Showcase() {
  const open = useCallback((id: string) => {
    const goto = (window as unknown as { gotoDish?: (sel: string) => void }).gotoDish;
    if (goto) goto(`#${id}`);
    else scrollToTarget(`#${id}`, { block: "center" });
  }, []);

  return (
    <section className="showcase" id="showcase">
      <div className="sc-head"><div className="wrap">
        <span className="section-num">scroll to pan · click a card</span>
      </div></div>
      <div className="stage">
        {/* First in the stage, so it lands under `.core` — both sit at
            z-index 0 and DOM order is what separates them. */}
        <RainPattern />
        <div className="core" aria-hidden>
          <div>
            <div className="big">WORK</div>
            <div className="small">05 entries · season 2026</div>
          </div>
        </div>
        <Carousel onOpen={open} />
        <div className="hint">
          <span className="annot">
            <span className="hand" style={{ fontSize: "1.5rem" }}>keep scrolling</span>
            <svg viewBox="0 0 52 30" aria-hidden><path className="scrib live drawable" d="M4,24 C18,26 34,20 44,8 M36,8 L45,7 L44,16" strokeWidth={2} /></svg>
          </span>
        </div>
      </div>
    </section>
  );
}
