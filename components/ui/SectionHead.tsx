import type { ReactNode } from "react";

/** A section's title, and the quiet line of meta that sits opposite it.
 *
 *  There used to be a numbered label above the title — "01 — Showcase" — on
 *  every section. It read as a table of contents pasted over a page that is
 *  meant to be one continuous shot, and it made each scene announce itself
 *  before you could look at it. The page carries its own order now. */
export default function SectionHead({
  title, aside,
}: { title?: ReactNode; aside?: string }) {
  return (
    <div className="block-head">
      <div>{title && <h2>{title}</h2>}</div>
      {aside && <span className="section-num">{aside}</span>}
    </div>
  );
}
