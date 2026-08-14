"use client";
/** Tiny mutable store bridging the GSAP deck and the showcase carousel.
 *
 *  Mutable and un-reactive on purpose: these are read once per frame inside
 *  the carousel's own rAF loop, and routing scroll progress through React
 *  state would re-render the tree on every scroll frame. `CinemaDeck` is the
 *  only writer.
 *
 *  - `scrollRot` — the wind-up the row arrives with, spent by the time the
 *    scene comes to rest.
 *  - `morph`   0→1 — the deck of cards opening out into the row.
 *  - `focus`   0→1 — position along the row once it has formed; the carousel
 *    multiplies by the card count to get which card is attended.
 *
 *  All three sit at 0 under reduced motion, because `CinemaDeck` returns
 *  before it builds anything. A DOM row at `morph` 0 is five cards stacked on
 *  top of each other rather than a scene at rest, so the carousel checks the
 *  query itself and parks the values at "row formed" — see `Carousel`. */
export const showcase = { scrollRot: 0, morph: 0, focus: 0 };
