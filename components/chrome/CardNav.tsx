"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useScrolledPast } from "@/hooks/useScrolledPast";
import { DUR, EASE } from "@/lib/motion";

const GROUPS = [
  { label: "Work", links: [
    { href: "#showcase", label: "Showcase" },
    { href: "#work", label: "Systems Diner" },
    { href: "#now", label: "Now" },
  ]},
  { label: "Writing", links: [
    { href: "#writing", label: "Field notes" },
  ]},
  { label: "Contact", links: [
    { href: "#contact", label: "Say hello" },
    { href: "https://github.com/AbhinavPabbaraju", label: "GitHub ↗", external: true },
    { href: "https://www.linkedin.com/in/abhinav-pabbaraju", label: "LinkedIn ↗", external: true },
  ]},
];

/** Isolated so the once-a-second tick re-renders eleven characters rather
 *  than the whole header and the open nav panel underneath it. */
function Clock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const read = () =>
      setTime(new Date().toLocaleTimeString("en-IN", { hour12: false, timeZone: "Asia/Kolkata" }) + " IST");
    read();
    const t = setInterval(read, 1000);
    return () => clearInterval(t);
  }, []);
  return <span className="clock">{time}</span>;
}

/** Card-style navigation: compact bar that expands into link cards. */
export default function CardNav() {
  const [open, setOpen] = useState(false);
  const scrolled = useScrolledPast();
  const root = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const isOpen = useRef(false);
  isOpen.current = open;

  useEffect(() => {
    /* Escape has to hand focus back to the control that opened the panel,
       or the next Tab restarts from the top of the document. */
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !isOpen.current) return;
      setOpen(false);
      toggle.current?.focus({ preventScroll: true });
    };
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, []);

  return (
    <header className={`cardnav${scrolled ? " scrolled" : ""}`} ref={root}>
      <div className="cn-bar wrap">
        <a className="cn-brand" href="#main">AP</a>
        <Clock />
        <button
          className="cn-toggle" type="button" ref={toggle}
          aria-expanded={open} aria-controls="cn-panel"
          onClick={() => setOpen((v) => !v)}
        >
          <span className={`cn-lines${open ? " x" : ""}`} aria-hidden><i /><i /></span>
          Menu
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav
            id="cn-panel" className="cn-panel wrap" aria-label="Primary"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: DUR.md, ease: EASE.inOut }}
          >
            <div className="cn-cards">
              {GROUPS.map((g, gi) => (
                <motion.div
                  className="cn-card" key={g.label}
                  initial={{ y: 18, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: DUR.sm, delay: 0.06 + gi * 0.06, ease: EASE.out }}
                >
                  {/* a nav label, not a document heading — three h2s named
                      Work/Writing/Contact ahead of the page's own outline */}
                  <p className="cn-card-label">{g.label}</p>
                  <ul>
                    {g.links.map((l) => (
                      <li key={l.label}>
                        <a
                          href={l.href}
                          {...("external" in l && l.external
                            ? { target: "_blank", rel: "noopener noreferrer" }
                            : {})}
                          onClick={() => setOpen(false)}
                        >
                          {l.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
