import SectionHead from "@/components/ui/SectionHead";
import { STACK } from "@/lib/data/stack";

export default function About() {
  return (
    <section className="block" id="about">
      <div className="wrap">
        <SectionHead title="The short version." />
        <div className="about-grid">
          {/* The lead and the spec sheet stack in one column on purpose. The
              lead is four lines of display type and the prose beside it runs
              three times that, so leaving the wider column holding only the
              lead opened a void under it the height of the fact table. */}
          <div className="about-intro">
            <p className="about-lead">
              Third-year CS &amp; Engineering student who likes the hard, unglamorous parts of computing —
              the ones where a system has to stay <b>correct when everything fails</b>, and{" "}
              <b>fast when it doesn’t</b>.
            </p>
            <div className="facts">
              <div className="fact"><span className="fk">Study</span><span className="fv">CSE · 2024–2028</span></div>
              <div className="fact"><span className="fk">Domains</span><span className="fv">Distributed · Compilers · GPU · HFT</span></div>
              <div className="fact"><span className="fk">Stack</span><span className="fv">Go · C++23 · Rust · TS · CUDA</span></div>
              <div className="fact"><span className="fk">Certs</span><span className="fv">NVIDIA DLI · Harvard CS50</span></div>
            </div>
          </div>
          <div className="about-body">
            <p>
              My work lives close to the metal: Raft consensus and linearizability checking, compiler
              backends emitting x86-64, GPU N-body physics, and the kind of tail-latency thinking trading
              systems demand. I care about numbers that don’t lie — p99s, instruction counts, throughput
              under chaos.
            </p>
            <p>
              Off the clock I’m building an F1 analytics engine, turning CS papers I like into running
              code, and generally trying to make software that would survive a wet Sunday at Spa.
            </p>
          </div>
        </div>
        <div className="stackloop" aria-label="Tools of the trade">
          <div className="sl-track">
            {[0, 1].map((set) => (
              <div className="sl-set" key={set} aria-hidden={set === 1}>
                {STACK.map((s) => (
                  <span className="sl-chip" title={s.title} key={s.title}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d={s.path} /></svg>
                    <span className="sr-only">{s.title}</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
