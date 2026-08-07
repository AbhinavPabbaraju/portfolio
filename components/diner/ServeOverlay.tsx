"use client";
import { forwardRef } from "react";
import type { Project } from "@/lib/data/projects";
import ServeBowl from "./ServeBowl";
import RaftPlayground from "@/components/scenes/RaftPlayground";
import RiccPlayground from "@/components/scenes/RiccPlayground";

interface Props { project: Project | null; onClose: () => void }

/** Dishes that come with something to play with. A paragraph about
 *  consensus is a worse explanation than five nodes you can kill, and a
 *  paragraph about register allocation is a worse explanation than the
 *  allocator running on code you typed. The detail block widens for
 *  these; everything else about the serving is unchanged.
 *
 *  Both labs are imported eagerly rather than through `next/dynamic`:
 *  the serve overlay is opened by a GSAP timeline that fades a
 *  transform-centred block in, and a panel that arrives one chunk later
 *  would resize it mid-fade. */
const LABS: Record<string, () => React.ReactElement> = {
  "p-phalanx": RaftPlayground,
  "p-ricc": RiccPlayground,
};

/** The serving: a bowl slides across the counter and becomes the project.
 *  GSAP drives the timeline from Diner; this component is the stage. */
const ServeOverlay = forwardRef<HTMLDivElement, Props>(function ServeOverlay({ project, onClose }, ref) {
  const Lab = project ? LABS[project.id] : undefined;
  return (
    <div
      className={`serve${Lab ? " has-lab" : ""}`} id="serve" hidden ref={ref}
      role="dialog" aria-modal="true"
      aria-labelledby={project ? "serveName" : undefined}
      aria-label={project ? undefined : "Dish detail"}
    >
      <button className="serve-close" type="button" onClick={onClose}>
        <span lang="ja">ごちそうさま</span> · close ✕
      </button>
      {/* A lab can outgrow the serving, which is a fixed stage — so the
          detail block scrolls inside itself, and Lenis has to be told
          to let the wheel land here instead of moving the page. */}
      <div className="serve-detail" id="serveDetail" data-lenis-prevent>
        {project && (
          <>
            <div className="sd-course" lang="ja">{project.course}</div>
            <h3 id="serveName">{project.name}</h3>
            <div className="sd-sub">{project.sub}</div>
            <p className="sd-desc">{project.desc}</p>
            {Lab && <Lab />}
            <p className="sd-prep"><span>Prepared with</span> {project.prep}</p>
            <div className="sd-links">
              <a href={project.recipeHref} target="_blank" rel="noopener noreferrer">{project.recipeLabel}</a>
            </div>
          </>
        )}
      </div>
      <div className="s-counter" aria-hidden />
      <ServeBowl />
    </div>
  );
});
export default ServeOverlay;
