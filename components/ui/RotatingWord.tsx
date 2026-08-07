"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { DUR, EASE } from "@/lib/motion";

/** The contact headline's cycling adjective.
 *  Letters exit upward / enter from below with a per-character stagger;
 *  container width snaps while empty so wide words never clip. */
export default function RotatingWord({
  words,
  interval = 2600,
}: { words: string[]; interval?: number }) {
  const reduce = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const [width, setWidth] = useState<number | "auto">("auto");
  const ghost = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % words.length), interval);
    return () => clearInterval(t);
  }, [reduce, interval, words.length]);

  // measure the incoming word off-screen; snap width while the slot is empty
  useEffect(() => {
    if (ghost.current) setWidth(ghost.current.offsetWidth);
  }, [idx]);

  const word = words[idx];
  return (
    /* The width is animated, not assigned. Snapping it the instant the word
       changes shoved the rest of the headline sideways in a single frame
       while the letters were still rolling — the one hard cut in an
       otherwise continuous line. */
    <motion.span
      className="rotor"
      initial={false}
      animate={{ width }}
      transition={reduce ? { duration: 0 } : { duration: DUR.sm, ease: EASE.inOut }}
      aria-label={words[0]}
    >
      <span ref={ghost} aria-hidden style={{ position: "absolute", visibility: "hidden", whiteSpace: "nowrap" }}>
        {word}
      </span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={word} className="rotor-word" aria-hidden>
          {word.split("").map((ch, i) => (
            <motion.span
              key={`${word}-${i}`}
              className={`rl${ch === " " ? " sp" : ""}`}
              initial={reduce ? false : { y: "108%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              exit={reduce ? undefined : { y: "-108%", opacity: 0 }}
              transition={{ duration: DUR.sm, delay: i * 0.03, ease: EASE.out }}
            >
              {ch === " " ? "\u00a0" : ch}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
}
