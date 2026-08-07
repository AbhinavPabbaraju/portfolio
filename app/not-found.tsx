import type { Metadata } from "next";
import GhostPill from "@/components/ui/GhostPill";
import Footer from "@/components/chrome/Footer";

export const metadata: Metadata = { title: "404 — off the menu" };

/* A 404 in the diner's voice rather than the framework's. Deliberately static:
   no deck, no canvases, no Lenis-driven scenes — the page you land on when
   something is already wrong should be the cheapest one on the site. */
export default function NotFound() {
  return (
    <main className="nf" id="main" tabIndex={-1}>
      <div className="wrap">
        <span className="eyebrow"><span>404 — off the menu</span></span>
        <h1>Nothing&rsquo;s<br />cooking here.</h1>
        <p className="nf-sub">
          That page isn&rsquo;t on tonight&rsquo;s service. The kitchen is still open out
          front though — five dishes, counter seats only.{" "}
          <span className="hand">— mind the puddles</span>
        </p>
        <div className="cta-row">
          <GhostPill href="/">Back to the front</GhostPill>
          <GhostPill href="/#work">Tonight&rsquo;s menu</GhostPill>
          <GhostPill href="/#contact">Say hello</GhostPill>
        </div>
        <pre className="ascii nf-art" aria-hidden>{`
       ~    ~     ~
        \\   |    /
         \\  |   /
      ______________
      \\            /
       \\__________/
`}</pre>
        <p className="nf-cap">an empty bowl · the pot went cold on this one</p>
      </div>
      <Footer />
    </main>
  );
}
