"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import {
  compile, PRESETS, REGISTERS, showInstr, showLocation,
  type AsmLine, type Compilation, type Instr, type PassResult, type Register, type Token,
} from "@/lib/ricc";

/* ── stages ──────────────────────────────────────────────────────────
   Ten panels in pipeline order. The five passes are their own stages
   rather than one "optimizer" panel, because the whole point is that
   each of them does a different, nameable thing to the same list. */

type StageId = "tokens" | "ast" | "ir" | "pass" | "alloc" | "asm";
type Phase = "front" | "middle" | "back";
interface Stage { id: StageId; label: string; title: string; phase: Phase; pass?: number }

/** The rail groups by phase rather than running ten equal tabs, because
 *  the grouping is the thing a reader most needs told: the front end
 *  turns source into a list, the middle end does five different things
 *  to that one list — which is why those five panels look alike — and
 *  the back end gives the list a machine to run on. */
const PHASES: { id: Phase; label: string; job: string }[] = [
  { id: "front", label: "front end", job: "source becomes a list" },
  { id: "middle", label: "middle end", job: "the list gets shorter" },
  { id: "back", label: "back end", job: "the list gets a machine" },
];

const STAGES: Stage[] = [
  { id: "tokens", phase: "front", label: "lex", title: "Lexical analysis" },
  { id: "ast", phase: "front", label: "parse", title: "Parsing" },
  { id: "ir", phase: "front", label: "IR", title: "Lowering to three-address code" },
  { id: "pass", phase: "middle", label: "fold", title: "Constant folding + propagation", pass: 0 },
  { id: "pass", phase: "middle", label: "algebra", title: "Algebraic simplification", pass: 1 },
  { id: "pass", phase: "middle", label: "CSE", title: "Common subexpression elimination", pass: 2 },
  { id: "pass", phase: "middle", label: "copies", title: "Copy propagation", pass: 3 },
  { id: "pass", phase: "middle", label: "DCE", title: "Dead code elimination", pass: 4 },
  { id: "alloc", phase: "back", label: "allocate", title: "Live intervals + linear scan" },
  { id: "asm", phase: "back", label: "x86-64", title: "Code emission" },
];

/** Auto-advance dwell. Long enough to read a short panel, and the only
 *  timing value in the component — nothing here animates, it steps. */
const DWELL_MS = 2200;

/** What the program weighs at this stage, and in what unit.
 *
 *  One readout, carried the whole way down, is the thread that makes
 *  the middle end legible: walk the five passes and the number falls.
 *  Each stage names its own unit rather than pretending tokens and
 *  instructions are the same currency. */
function measure(stage: Stage, r: Compilation): { n: number; unit: string } {
  switch (stage.id) {
    /* The scanner's EOF token is real to the parser and noise to a
       reader counting what they typed. */
    case "tokens": return { n: r.tokens.length - 1, unit: "tokens" };
    case "ast": return { n: r.ast.length, unit: "nodes" };
    case "ir": return { n: r.ir.length, unit: "instructions" };
    case "pass": return { n: r.passes[stage.pass!].out.length, unit: "instructions" };
    case "alloc": return { n: r.alloc.intervals.length, unit: "live values" };
    case "asm": return { n: r.asm.filter((l) => l.text.trim() && !l.label).length, unit: "machine instructions" };
  }
}

/* ── panel-local rendering ───────────────────────────────────────── */

const TOKEN_CLASS: Record<Token["kind"], string> = {
  keyword: "is-kw", ident: "is-id", int: "is-num", op: "is-op", punct: "is-punct", eof: "is-eof",
};

/** Which colour a name's home earns it, shared by the interval chart,
 *  the roster and the assembly so the same value reads as the same
 *  thing in all three panels. */
const REG_CLASS: Record<Register, string> = {
  rbx: "r0", r12: "r1", r13: "r2", r14: "r3",
};

const MNEMONICS = /^(mov|movzx|add|sub|imul|idiv|cqo|neg|cmp|set[a-z]+|je|jmp|push|pop|leave|ret)$/;
const REGNAMES = /^(rax|rbx|rcx|rdx|rsi|rdi|rbp|rsp|r8|r9|r1[0-5]|al)$/;

/** Assembly, coloured. A word-level split is enough: this emitter's
 *  output has no strings and no comments of its own. */
function AsmText({ text }: { text: string }) {
  const parts = text.split(/([A-Za-z_.][A-Za-z0-9_.]*|-?\d+)/g);
  return (
    <>
      {parts.map((p, k) => {
        if (!p) return null;
        if (MNEMONICS.test(p)) return <b key={k} className="asm-op">{p}</b>;
        if (REGNAMES.test(p)) return <b key={k} className="asm-reg">{p}</b>;
        if (/^-?\d+$/.test(p)) return <b key={k} className="asm-num">{p}</b>;
        if (/^(qword|ptr)$/.test(p)) return <b key={k} className="asm-size">{p}</b>;
        if (/^[A-Za-z_.]/.test(p)) return <b key={k} className="asm-label">{p}</b>;
        return <span key={k}>{p}</span>;
      })}
    </>
  );
}

function CodeList({ code }: { code: Instr[] }) {
  return (
    <ol className="ricc-code">
      {code.map((instr, k) => (
        <li key={k} className={instr.op === "label" ? "is-label" : undefined}>
          <i className="ln">{k}</i>
          <span>{showInstr(instr)}</span>
        </li>
      ))}
    </ol>
  );
}

/** Before and after, stacked rather than columned.
 *
 *  Two narrow columns of monospace at this panel's width wrapped every
 *  interesting line and made the untouched majority — which is most of
 *  any single pass — look like a table of duplicates. A rewrite reads
 *  better as one line becoming another underneath it, and it costs
 *  height only on the rows that actually changed. */
function PassPanel({ pass }: { pass: PassResult }) {
  const idle = !pass.rewritten && !pass.removed;
  return (
    <>
      <p className="ricc-blurb">{pass.note}</p>
      <ol className="ricc-diff">
        {pass.rows.map((row, k) => (
          <li key={k} className={row.after === null ? "is-cut" : row.changed ? "is-hit" : undefined}>
            <i className="ln">{k}</i>
            <span className="was">{row.before}</span>
            {row.after !== null && row.changed && <span className="now">{row.after}</span>}
            {row.after === null && <i className="tag">cut</i>}
          </li>
        ))}
      </ol>
      <p className="ricc-tally">
        {idle
          ? "Nothing to do on this program. Any one pass finds nothing most of the time — it is the five of them in order that pay."
          : `${pass.rewritten} rewritten · ${pass.removed} deleted`}
      </p>
    </>
  );
}

function AllocPanel({ result }: { result: Compilation }) {
  const { alloc } = result;
  const span = Math.max(1, alloc.length);
  const pct = (n: number) => `${(n / span) * 100}%`;

  return (
    <>
      <p className="ricc-blurb">
        Each bar is one value&apos;s life, from the instruction that writes it to the last one that
        reads it. Linear scan walks them left to right and hands out the four registers as they
        come; when all four are busy it spills whichever bar reaches furthest right, because that
        is the one whose register buys the most.
        {alloc.loops.length > 0 && " The shaded band is a loop — anything live inside it stays live to the bottom of it, since control comes back around."}
      </p>

      <div className="ricc-chart">
        {alloc.intervals.map((iv) => {
          const home = iv.location;
          const cls = home.k === "reg" ? `is-reg ${REG_CLASS[home.reg]}` : "is-spill";
          return (
            <div className="ricc-lane" key={iv.id}>
              <i className="ricc-lane-id">{iv.id}</i>
              <div className="ricc-track">
                {alloc.loops.map(([top, bottom], k) => (
                  <i
                    key={k} className="ricc-loopband" aria-hidden
                    style={{ left: pct(top), width: pct(bottom - top + 1) }}
                  />
                ))}
                <i
                  className={`ricc-bar ${cls}`}
                  style={{ left: pct(iv.start), width: pct(iv.end - iv.start + 1) }}
                />
                {iv.stretched && (
                  <i
                    className="ricc-stretch" aria-hidden
                    style={{ left: pct(iv.lastUse + 1), width: pct(iv.end - iv.lastUse) }}
                  />
                )}
              </div>
              <i className="ricc-lane-home">
                {home.k === "reg" ? home.reg : showLocation(home)}
              </i>
            </div>
          );
        })}
      </div>

      <p className="ricc-tally">
        {alloc.intervals.length} value{alloc.intervals.length === 1 ? "" : "s"} ·{" "}
        {REGISTERS.length} allocatable registers ·{" "}
        {alloc.spills
          ? `${alloc.spills} spilled to the stack`
          : "nothing spilled — every value fit in a register"}
        {alloc.intervals.some((i) => i.stretched) && " · a loop stretched at least one interval past its last read"}
      </p>
    </>
  );
}

function AsmPanel({ asm }: { asm: AsmLine[] }) {
  return (
    <>
      <p className="ricc-blurb">
        System V, NASM syntax. rax stages every value, because no x86 instruction may name two
        memory operands and a spilled value is a memory operand. rdx is held back too — <code>idiv</code>{" "}
        writes it whether the program wanted a remainder or not.
      </p>
      <ol className="ricc-asm">
        {asm.map((l, k) => (
          <li key={k} className={l.label ? "is-label" : undefined}>
            <span><AsmText text={l.text} /></span>
            {l.comment && <em>; {l.comment}</em>}
          </li>
        ))}
      </ol>
    </>
  );
}

/* ── the lab ─────────────────────────────────────────────────────── */

export default function RiccPlayground() {
  const host = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion() ?? false;

  const [source, setSource] = useState(PRESETS[0].source);
  const [presetId, setPresetId] = useState(PRESETS[0].id);
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(false);

  /* The whole pipeline, recomputed on every keystroke. It is a few
     hundred microseconds on these program sizes — there is nothing to
     debounce and nothing to memoise beyond the source itself. */
  const result = useMemo(() => compile(source), [source]);

  const current = STAGES[stage];
  const last = STAGES.length - 1;

  const pick = useCallback((id: string) => {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setPresetId(preset.id);
    setSource(preset.source);
    setStage(0);
    setPlaying(false);
  }, []);

  /* Auto-advance. A discrete step on a timer, not an animation — but it
     still parks when the panel is off screen, and reduced motion never
     starts it at all. */
  useEffect(() => {
    if (!playing || reduced) return;
    if (stage >= last) { setPlaying(false); return; }

    let timer = 0;
    const el = host.current;
    let visible = true;

    /* `timer` is cleared on fire as well as on cancel. Without that, a
       tick that lands while the panel is off screen leaves a stale id
       behind, the observer's re-arm below sees a timer that is really
       long gone, and the walk never resumes when you scroll back. */
    const arm = () => {
      timer = window.setTimeout(() => {
        timer = 0;
        if (visible) setStage((s) => Math.min(last, s + 1));
      }, DWELL_MS);
    };

    const io = el
      ? new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (!visible) { window.clearTimeout(timer); timer = 0; }
        else if (!timer) arm();
      }, { threshold: 0 })
      : null;
    io?.observe(el!);
    arm();

    return () => { window.clearTimeout(timer); io?.disconnect(); };
  }, [playing, stage, last, reduced]);

  /** Arrows, Home and End move the selection; the moved-to tab takes
   *  focus, which is what makes the single tab stop navigable. */
  const onRailKey = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    const to = delta ? stage + delta : e.key === "Home" ? 0 : e.key === "End" ? last : -1;
    if (to < 0 || to > last) return;
    e.preventDefault();
    setStage(to);
    setPlaying(false);
    e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[to]?.focus();
  }, [stage, last]);

  /* A broken program has no stages to show, so stop walking through
     them — but keep whatever the reader was looking at, so fixing the
     typo puts them back where they were. */
  useEffect(() => { if (!result.ok) setPlaying(false); }, [result.ok]);

  const stats = result.ok ? result.stats : null;

  return (
    <div className="ricc" ref={host}>
      <p className="ricc-note">
        The kitchen, with the pass door open. Type on the left and the whole pipeline reruns on the
        right — lexer, Pratt parser, three-address code, five optimization passes, live intervals,
        linear-scan allocation, x86-64. Nothing below is canned; every panel is this source compiled
        just now. <code>n</code> is the argument the function is called with, so the optimizer has
        something it is not allowed to know.
      </p>

      <div className="ricc-grid">
        <div className="ricc-editor">
          <div className="ricc-presets" role="group" aria-label="Example programs">
            {PRESETS.map((p) => (
              <button
                key={p.id} type="button"
                className={`ricc-chip${p.id === presetId ? " is-on" : ""}`}
                onClick={() => pick(p.id)}
                aria-pressed={p.id === presetId}
                title={p.blurb}
              >
                {p.label}
              </button>
            ))}
          </div>

          <label className="ricc-srclabel" htmlFor="ricc-src">source</label>
          <textarea
            id="ricc-src"
            className={`ricc-src${result.ok ? "" : " is-bad"}`}
            spellCheck={false}
            value={source}
            rows={9}
            onChange={(e) => { setSource(e.target.value); setPresetId(""); }}
            aria-describedby="ricc-diag"
          />

          {/* Only what the panel's own readout does not already say —
              the instruction count lives up there now. */}
          <p className="ricc-diag" id="ricc-diag" role="status" aria-live="polite">
            {result.ok
              ? `${stats!.registers} register${stats!.registers === 1 ? "" : "s"} used${stats!.spills ? ` · ${stats!.spills} value${stats!.spills === 1 ? "" : "s"} spilled to the stack` : " · nothing spilled"}`
              : `line ${result.line}, column ${result.col} — ${result.message}`}
          </p>
        </div>

        <div className="ricc-stagebox">
          {/* A real tablist, so it owes the real contract: one tab stop
              for the whole rail and arrows to move within it. Tabbing
              past ten stages to reach the buttons below is not a rail,
              it is an obstacle. The phase wrappers are presentational so
              the grouping stays visual and the tabs stay direct
              children as far as assistive tech is concerned. */}
          <div className="ricc-line" role="tablist" aria-label="Compiler stage" onKeyDown={onRailKey}>
            {PHASES.map((phase) => (
              <div className="ricc-phase" key={phase.id} role="presentation">
                <i className="ricc-phase-tag">{phase.label}<em>{phase.job}</em></i>
                <div className="ricc-stops" role="presentation">
                  {STAGES.map((s, k) => (s.phase !== phase.id ? null : (
                    <button
                      key={`${s.id}${s.pass ?? ""}${k}`} type="button" role="tab"
                      id={`ricc-tab-${k}`} aria-controls="ricc-panel"
                      className={`ricc-stop${k === stage ? " is-on" : ""}${k < stage ? " is-done" : ""}`}
                      aria-selected={k === stage}
                      tabIndex={k === stage ? 0 : -1}
                      onClick={() => { setStage(k); setPlaying(false); }}
                    >
                      {s.label}
                    </button>
                  )))}
                </div>
              </div>
            ))}
          </div>

          <div
            className="ricc-panel" data-lenis-prevent
            id="ricc-panel" role="tabpanel" aria-labelledby={`ricc-tab-${stage}`}
            tabIndex={0} aria-live="polite"
          >
            {result.ok && (
              /* The one number carried the whole way down. Walking the
                 middle end and watching it fall is the point of the
                 middle end. */
              <div className="ricc-head">
                <h4 className="ricc-title">{current.title}</h4>
                <p className="ricc-count">
                  <b>{measure(current, result).n}</b>
                  <em>{measure(current, result).unit}</em>
                </p>
              </div>
            )}

            {!result.ok ? (
              <p className="ricc-error">
                <b>line {result.line}, column {result.col}</b>
                {result.message}
              </p>
            ) : current.id === "tokens" ? (
              <>
                <p className="ricc-blurb">
                  One pass over the characters. Each token knows where it came from, which is the
                  only reason an error two stages later can point at a line and a column.
                </p>
                <div className="ricc-tokens">
                  {result.tokens.map((t, k) => (
                    <i key={k} className={`tok ${TOKEN_CLASS[t.kind]}`} title={`${t.kind} · line ${t.line}`}>{t.text}</i>
                  ))}
                </div>
              </>
            ) : current.id === "ast" ? (
              <>
                <p className="ricc-blurb">
                  Statements by recursive descent, expressions by Pratt — precedence is a number on
                  the operator, so the tree comes out shaped like the arithmetic rather than like
                  the grammar.
                </p>
                <pre className="ricc-tree">{result.ast.join("\n")}</pre>
              </>
            ) : current.id === "ir" ? (
              <>
                <p className="ricc-blurb">
                  Two operands in, one destination out. Lowering is deliberately naive — the
                  redundant copies it leaves behind are what the next five panels remove.
                </p>
                <CodeList code={result.ir} />
              </>
            ) : current.id === "pass" ? (
              <PassPanel pass={result.passes[current.pass!]} />
            ) : current.id === "alloc" ? (
              <AllocPanel result={result} />
            ) : (
              <AsmPanel asm={result.asm} />
            )}
          </div>
        </div>
      </div>

      <div className="lab-controls">
        <button
          type="button" className="lab-btn"
          onClick={() => { setStage((s) => Math.max(0, s - 1)); setPlaying(false); }}
          disabled={stage === 0}
        >
          ← Back
        </button>
        <button
          type="button" className="lab-btn is-primary"
          onClick={() => { setStage((s) => Math.min(last, s + 1)); setPlaying(false); }}
          disabled={stage === last}
        >
          Next stage →
        </button>
        <button
          type="button" className="lab-btn"
          onClick={() => setPlaying((p) => !p)}
          disabled={reduced || !result.ok || stage === last}
          aria-label={playing ? "Stop walking through the stages" : "Walk through the stages"}
        >
          {playing ? "Stop" : "Walk it"}
        </button>
      </div>

      <p className="lab-fineprint">
        A teaching model, not the real thing — ricc itself is C++23 and emits an object file. This
        one takes a much smaller language (one integer type, one argument, no functions and no
        arrays), runs its passes block-locally in a single sweep rather than iterating to a
        fixpoint, and hands linear scan four callee-saved registers so that an ordinary program
        spills where a real allocation would not. What it does share is the shape: the same phases,
        in the same order, each one a total function of the one before it.
      </p>
    </div>
  );
}
