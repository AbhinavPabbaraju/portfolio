"use client";
import { forwardRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { DUR, EASE } from "@/lib/motion";

interface Props { visible: boolean; onLeave: () => void }

/** Inside the vending machine — one undeveloped print until the film arrives.
 *
 *  This used to be six numbered slots reading "photo 01 · loading film"
 *  through 06, which claimed six photographs exist and are merely late. They
 *  do not. One honest card says the same thing without the false count, and
 *  it takes the fourth horizontal scroll region off the page: a strip you
 *  drag along needs more than one thing in it to be worth dragging.
 *
 *  Framer Motion brings the print in; GSAP handles the camera getting here. */
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
            <div className="photo-strip is-empty">
              <motion.figure
                className="polaroid"
                initial={reduce ? false : { y: 26, opacity: 0 }}
                animate={visible ? { y: 0, opacity: 1 } : {}}
                transition={{ duration: DUR.md, delay: 0.35, ease: EASE.out }}
              >
                <div className="ph" />
                <figcaption>the roll is still in the camera</figcaption>
              </motion.figure>
            </div>
            <p className="photo-tip">nothing developed yet — come back when the light has been good</p>
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
