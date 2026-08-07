import type { ReactNode } from "react";

export default function SectionHead({
  eyebrow, title, aside,
}: { eyebrow: ReactNode; title?: ReactNode; aside?: string }) {
  return (
    <div className="block-head">
      <div>
        {/* `.eyebrow` is an inline-flex row whose only items are the ember dot
            and the label, so the label stays one element — a bare fragment
            would split into an anonymous flex item per text run and take the
            .7em gap between each. */}
        <span className="eyebrow"><span>{eyebrow}</span></span>
        {title && <h2 style={{ marginTop: "var(--s-2)" }}>{title}</h2>}
      </div>
      {aside && <span className="section-num">{aside}</span>}
    </div>
  );
}
