"use client";
import { useScrolledPast } from "@/hooks/useScrolledPast";

/** System-voice announcement strip (Abyss, mono, ember bullets). */
export default function NewsBar() {
  const hidden = useScrolledPast();
  return (
    /* Not `role="status"`: the copy is static, so the live region only ever
       fired once — reading the whole strip over the top of the page title on
       load. A labelled landmark leaves it where it belongs, in the tour. */
    <aside className={`newsbar${hidden ? " hide" : ""}`} aria-label="Site announcements">
      <div className="nb-inner">
        {/* No date. A strip that stamps a month is a promise to edit it every
            month, and a stale one reads as an abandoned site — which is the
            opposite of what an announcement bar is for. The items are all
            standing facts, so they age without a timestamp. */}
        <span className="nb-txt">
          News<em>•</em>F1 2026 dashboard is live<em>•</em>Monte Carlo engine — 10K sims per run
        </span>
        <a className="nb-btn" href="https://f1-dashboard-mu.vercel.app" target="_blank" rel="noopener noreferrer">
          Watch ↗
        </a>
      </div>
    </aside>
  );
}
