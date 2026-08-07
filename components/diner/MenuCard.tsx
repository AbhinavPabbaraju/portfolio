"use client";
import { forwardRef } from "react";
import { PROJECTS, type Project } from "@/lib/data/projects";
import MenuBowlIcon from "./MenuBowlIcon";

function Dish({ p, onTaste }: { p: Project; onTaste: (p: Project, btn: HTMLButtonElement) => void }) {
  return (
    <div className="dish" id={p.id}>
      <div className="d-course" aria-hidden>{p.course}</div>
      <div className="d-main">
        <div className="d-line">
          <h3>{p.live && <span className="d-live" aria-hidden />}{p.name}</h3>
          <span className="d-sub">{p.sub}</span>
          {p.tag && <span className="d-tag" lang="ja">{p.tag}</span>}
          <span className="d-dots" aria-hidden />
          <span className="d-price">{p.price}</span>
        </div>
        <p className="d-desc">{p.desc}</p>
        <p className="d-prep"><span>Prepared with</span> {p.prep}</p>
        <p className="d-also">
          <span>Customers also ordered</span>{" "}
          {p.also.map((a, i) => (
            <span key={a.id}>{i > 0 && " · "}<a href={`#${a.id}`}>{a.label}</a></span>
          ))}
        </p>
        <div className="d-cta">
          <button className="d-taste" type="button" onClick={(e) => onTaste(p, e.currentTarget)}>Taste</button>
          <a className="d-recipe" href={p.recipeHref} target="_blank" rel="noopener noreferrer">{p.recipeLabel}</a>
        </div>
      </div>
    </div>
  );
}

interface Props { onTaste: (p: Project, btn: HTMLButtonElement) => void; children?: React.ReactNode }

/** The paper menu — dishes are data-driven; the serve overlay mounts inside. */
const MenuCard = forwardRef<HTMLElement, Props>(function MenuCard({ onTaste, children }, ref) {
  return (
    <article className="menu-card" id="menuCard" ref={ref}>
      <div className="sheen" aria-hidden />
      <div className="seal" aria-hidden>AP</div>
      <header className="menu-head">
        <MenuBowlIcon />
        <div className="mh-title"><span lang="ja">深夜食堂</span> <span className="mh-en">· SYSTEMS DINER</span></div>
        <div className="mh-sub">five signature dishes, served nightly — <span lang="ja">いらっしゃいませ</span></div>
        <div className="mh-rule" aria-hidden />
      </header>
      {PROJECTS.map((p) => <Dish key={p.id} p={p} onTaste={onTaste} />)}
      <footer className="menu-foot">
        <span><span lang="ja">ごちそうさまでした</span> — thank you for dining</span>
        <span>chef · Abhinav Pabbaraju</span>
      </footer>
      {children}
    </article>
  );
});
export default MenuCard;
