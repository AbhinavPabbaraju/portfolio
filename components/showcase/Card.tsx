"use client";
import type { Project } from "@/lib/data/projects";
import { PREVIEWS } from "./previews";

/** One project, as a card on the carousel.
 *
 *  A real element rather than a texture, which is the whole reason the
 *  carousel came out of WebGL: the preview is inline SVG on the page's own
 *  tokens, the type is selectable, and the thing is a `<button>` — so it takes
 *  focus, answers Enter and Space, and appears in the tab order. The canvas
 *  version could do none of that, and "the carousel has no keyboard path" was
 *  a standing entry in the README's known constraints.
 *
 *  Nothing here knows where it is in the row. Position, scale, opacity and
 *  turn are all set by `Carousel` from one number, and a card that reached for
 *  its own offset would be a second source of truth for the same thing. The
 *  one exception is `centre`, which is not geometry: it gates the live dot, so
 *  a marquee-ish detail only animates on the card being read. */
export default function Card({
  project, centre, onOpen,
}: { project: Project; centre: boolean; onOpen: (id: string) => void }) {
  const Preview = PREVIEWS[project.id];
  return (
    <button
      type="button"
      className={`sc-card${project.live ? " is-live" : ""}${centre ? " is-centre" : ""}`}
      onClick={() => onOpen(project.id)}
      /* All five are tab stops, not just the one in the middle. Which card
         holds the centre is a fact about the scroll position, and hiding the
         other four from the keyboard would make the row's reach depend on how
         far down the page somebody happens to be. Focus lifts a card to full
         opacity wherever it sits — see `Slot`. */
      aria-label={`${project.name} — ${project.card.s}. Open the full entry.`}
    >
      <span className="sc-card-top">
        <span className="sc-pos">{project.card.pos}</span>
        {project.card.hot && <span className="sc-flag">おすすめ</span>}
        {project.live && <span className="sc-flag is-live">live</span>}
      </span>

      <span className="sc-shot">
        {Preview ? <Preview /> : null}
        {/* a hairline over the drawing, so the preview reads as a screen set
            into the card rather than as art printed on it */}
        <span className="sc-shot-edge" aria-hidden />
      </span>

      <span className="sc-card-body">
        <span className="sc-name">{project.name}</span>
        <span className="sc-sub">{project.card.s}</span>
      </span>

      <span className="sc-card-foot">
        <span className="sc-metric">{project.card.m}</span>
        <span className="sc-open">open ↓</span>
      </span>
    </button>
  );
}
