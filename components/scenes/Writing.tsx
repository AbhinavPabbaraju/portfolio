import SectionHead from "@/components/ui/SectionHead";
import { NOTES } from "@/lib/data/projects";

export default function Writing() {
  return (
    <section className="block" id="writing">
      <div className="wrap">
        <SectionHead eyebrow="03 — Writing" title="Notes from the pit wall." aside="field notes · in progress" />
        <div className="notes">
          {NOTES.map((n) => (
            <a
              className="note" href={n.href} key={n.title}
              {...(n.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              <span className="date">{n.date}</span>
              <span className="nt"><span className="topic">{n.topic}</span>{n.title}</span>
              {/* the arrow already means "leaves the page", so it is the
                  one that carries the label rather than the row */}
              <span className="read">
                {n.read}
                <span className="arw" aria-hidden>↗</span>
                {n.external && <span className="sr-only"> — opens on Medium in a new tab</span>}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
