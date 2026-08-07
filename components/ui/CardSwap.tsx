"use client";
import { useEffect, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { DUR, EASE } from "@/lib/motion";

/** A tilted stack of cards; the front card tucks to the back on a timer.
 *  Pauses on hover. Reduced motion renders a static stack. */
export default function CardSwap({
  children, interval = 4200,
}: { children: ReactNode[]; interval?: number }) {
  const reduce = useReducedMotion();
  const n = children.length;
  const [front, setFront] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (reduce || paused) return;
    const t = setInterval(() => setFront((f) => (f + 1) % n), interval);
    return () => clearInterval(t);
  }, [reduce, paused, interval, n]);

  return (
    <div
      className="cardswap"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {children.map((child, i) => {
        const depth = (i - front + n) % n;      // 0 = front
        return (
          <motion.div
            className="cardswap-item"
            key={i}
            initial={false}
            animate={{
              x: depth * 22,
              y: depth * -16,
              scale: 1 - depth * 0.055,
              rotate: depth * 1.4,
              zIndex: n - depth,
              opacity: depth > 2 ? 0 : 1,
            }}
            transition={{ duration: DUR.lg, ease: EASE.inOut }}
          >
            {child}
          </motion.div>
        );
      })}
    </div>
  );
}
