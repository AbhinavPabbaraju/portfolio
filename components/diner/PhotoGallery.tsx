"use client";
import { forwardRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { DUR, EASE } from "@/lib/motion";

const SLOTS = [1, 2, 3, 4, 5, 6];

interface Props { visible: boolean; onLeave: () => void }

/** Inside the vending machine — placeholder polaroids until the film arrives.
 *  Framer Motion staggers the prints; GSAP handles the camera getting here. */
const PhotoGallery = forwardRef<HTMLDivElement, Props>(function PhotoGallery({ visible, onLeave }, ref) {
  const reduce = useReducedMotion();
  return (
    <div className="photo-inside" ref={ref} hidden>
      <div className="menu-scene">
        <div className="fold-wrap">
          <article className="menu-card photo-card" id="photoCard">
            <div className="sheen" aria-hidden />
            <header className="menu-head">
              <div className="mh-title"><span lang="ja">写真</span> <span className="mh-en">· FIELD PHOTOS</span></div>
              <div className="mh-sub">dispensed by the machine outside — one coin, one memory</div>
              <div className="mh-rule" aria-hidden />
            </header>
            <div className="photo-strip" tabIndex={0} aria-label="Photo collection, scroll horizontally">
              {SLOTS.map((n, i) => (
                <motion.figure
                  className="polaroid"
                  key={n}
                  initial={reduce ? false : { y: 26, opacity: 0 }}
                  animate={visible ? { y: 0, opacity: 1 } : {}}
                  transition={{ duration: DUR.md, delay: 0.35 + i * 0.09, ease: EASE.out }}
                >
                  <div className="ph" />
                  <figcaption>photo {String(n).padStart(2, "0")} · loading film</figcaption>
                </motion.figure>
              ))}
            </div>
            <p className="photo-tip">drag or scroll sideways — prints from the roll, coming soon</p>
            <footer className="menu-foot">
              <span>film · Hyderabad → wherever the light is good</span>
              <span>shot by Abhinav Pabbaraju</span>
            </footer>
          </article>
        </div>
      </div>
      <button className="leave" type="button" onClick={onLeave}>← step back outside</button>
    </div>
  );
});
export default PhotoGallery;
