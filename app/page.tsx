import Hero from "@/components/scenes/Hero";
import KineticStrip from "@/components/scenes/KineticStrip";
import About from "@/components/scenes/About";
import Showcase from "@/components/scenes/Showcase";
import Diner from "@/components/diner/Diner";
import Library from "@/components/scenes/Library";
import Now from "@/components/scenes/Now";
import Contact from "@/components/scenes/Contact";
import CinemaDeck from "@/components/scenes/CinemaDeck";

/** The dwell between two scenes.
 *
 *  Empty on purpose. Once a scene pins, this is the distance that has
 *  to scroll past before the next one is close enough to start climbing
 *  over it — so the scene you are reading holds still, on screen, for
 *  as long as this is tall. `CinemaDeck` measures it rather than
 *  restating it, and `--cine-hold` in `globals.css` is where the number
 *  lives. Under reduced motion nothing pins, so it collapses to zero.
 *
 *  It belongs here rather than inside each scene because the pause is
 *  between scenes; a scene should not know what follows it. */
const Hold = ({ long = false }: { long?: boolean }) => (
  <div className={long ? "cine-hold is-long" : "cine-hold"} aria-hidden />
);

export default function Home() {
  return (
    /* tabIndex -1 so the skip link can actually land focus here; the anchor
       handler in SmoothScroll focuses any target that opts in this way. */
    <main id="main" tabIndex={-1}>
      <Hero />
      <Hold />
      <KineticStrip />
      <About />
      <Hold />
      <Showcase />
      {/* long: the carousel's unroll-and-step sequence plays out in this hold */}
      <Hold long />
      <Diner />
      <Hold />
      {/* long: the walk along the shelves plays out in this hold */}
      <Library />
      <Hold long />
      <Now />
      <Hold />
      <Contact />
      <CinemaDeck />
    </main>
  );
}
