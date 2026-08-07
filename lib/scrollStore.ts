"use client";
/** Tiny mutable store bridging the GSAP deck and the R3F carousel.
 *
 *  Mutable and un-reactive on purpose: these are read once per frame inside
 *  `useFrame`, and routing scroll progress through React state would re-render
 *  the tree on every scroll frame. `CinemaDeck` is the only writer.
 *
 *  - `scrollRot` — the wind-up the ring arrives with, spent by the time the
 *    scene comes to rest.
 *  - `morph`   0→1 — ring unrolling into the stair.
 *  - `focus`   0→1 — position through the stair once it has formed; the
 *    carousel multiplies by the card count to get which card is attended.
 *
 *  All three sit at 0 under reduced motion, because `CinemaDeck` returns
 *  before it builds anything — which leaves the ring exactly as it was. */
export const showcase = { scrollRot: 0, morph: 0, focus: 0 };
