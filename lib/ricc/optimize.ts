/** Stage 4 — five passes over the IR.
 *
 *  Every pass here is *block-local* except dead code elimination: state
 *  is dropped at a label and after any jump, so nothing is assumed
 *  across an edge the pass has not proved. That is the honest version
 *  of these passes and it is also why the order below matters —
 *
 *    1. constants first, because folding turns names into numbers and
 *       every later pass gets easier when it sees a number;
 *    2. algebraic identities next, on the now-folded operands;
 *    3. CSE once the expressions are in their simplest form, so two
 *       spellings of the same thing have become one spelling;
 *    4. copy propagation late, to forward every copy the three passes
 *       above just created as well as the ones lowering left behind;
 *    5. dead code last, to delete everything the other four orphaned.
 *
 *  Run in any other order and each pass still works — it just finds
 *  less. Real compilers close the loop and iterate; this one makes a
 *  single ordered sweep because a sweep is what can be read. */

import {
  defOf, mapUses, sameOperand, showInstr, showOperand, usesOf,
  type Instr, type Operand,
} from "./tac";
import type { BinOp } from "./parser";

/** One line of a pass's report, aligned 1:1 with what the pass was
 *  given. No pass inserts instructions, so this alignment holds and the
 *  playground can show before and after on the same row. */
export interface PassRow {
  before: string;
  /** null when the pass deleted this instruction. */
  after: string | null;
  changed: boolean;
}

export interface PassResult {
  id: string;
  name: string;
  note: string;
  rows: PassRow[];
  out: Instr[];
  rewritten: number;
  removed: number;
}

/** A block ends at a jump and a new one begins at a label. Anything a
 *  pass learned inside the old block is not valid in the new one. */
const endsBlock = (i: Instr) => i.op === "jump" || i.op === "branch" || i.op === "ret";

function report(id: string, name: string, note: string, input: Instr[], out: (Instr | null)[]): PassResult {
  const rows: PassRow[] = input.map((instr, k) => {
    const next = out[k];
    const before = showInstr(instr);
    if (next === null) return { before, after: null, changed: true };
    const after = showInstr(next);
    return { before, after, changed: after !== before };
  });
  return {
    id, name, note, rows,
    out: out.filter((i): i is Instr => i !== null),
    rewritten: rows.filter((r) => r.changed && r.after !== null).length,
    removed: rows.filter((r) => r.after === null).length,
  };
}

/* ── 1. constant folding and propagation ─────────────────────────── */

function fold(o: BinOp, a: number, b: number): number | null {
  switch (o) {
    case "+": return a + b;
    case "-": return a - b;
    case "*": return a * b;
    /* Leave a division by zero exactly where the programmer wrote it.
       Folding it would mean inventing a value for something that has
       none, and the trap belongs at run time. */
    case "/": return b === 0 ? null : Math.trunc(a / b);
    case "%": return b === 0 ? null : a % b;
    case "<": return a < b ? 1 : 0;
    case "<=": return a <= b ? 1 : 0;
    case ">": return a > b ? 1 : 0;
    case ">=": return a >= b ? 1 : 0;
    case "==": return a === b ? 1 : 0;
    case "!=": return a !== b ? 1 : 0;
  }
}

function constants(input: Instr[]): PassResult {
  const known = new Map<string, number>();
  const out: Instr[] = [];

  for (const instr of input) {
    if (instr.op === "label") known.clear();

    /* Substitute first: a use rewritten to a literal is what lets the
       fold below see two constants where the source had two names. */
    let next = mapUses(instr, (o) => {
      if (o.k !== "name") return o;
      const v = known.get(o.id);
      return v === undefined ? o : { k: "imm", value: v };
    });

    if (next.op === "bin" && next.a.k === "imm" && next.b.k === "imm") {
      const v = fold(next.o, next.a.value, next.b.value);
      if (v !== null) next = { op: "copy", dst: next.dst, src: { k: "imm", value: v } };
    } else if (next.op === "neg" && next.a.k === "imm") {
      next = { op: "copy", dst: next.dst, src: { k: "imm", value: -next.a.value } };
    }

    const dst = defOf(next);
    if (dst !== null) {
      if (next.op === "copy" && next.src.k === "imm") known.set(dst, next.src.value);
      else known.delete(dst);
    }
    if (endsBlock(next)) known.clear();

    out.push(next);
  }

  return report(
    "const", "Constant folding + propagation",
    "Anything computable now is computed now. A name whose value is a known literal is replaced by that literal, which is what lets the next arithmetic on it fold too — the substitution and the fold feed each other in one forward walk.",
    input, out,
  );
}

/* ── 2. algebraic simplification ─────────────────────────────────── */

/** Identities that hold for every integer, so they need no knowledge of
 *  the operands beyond their shape. `x * 0` is the one that pays for
 *  the pass: it turns a multiply into a literal without either operand
 *  being known. */
function simplifyOne(i: Instr): Instr | null {
  if (i.op !== "bin") return null;
  const { dst, o, a, b } = i;
  const isImm = (x: Operand, v: number) => x.k === "imm" && x.value === v;
  const copy = (src: Operand): Instr => ({ op: "copy", dst, src });

  if (o === "+" && isImm(b, 0)) return copy(a);
  if (o === "+" && isImm(a, 0)) return copy(b);
  if (o === "-" && isImm(b, 0)) return copy(a);
  if (o === "-" && sameOperand(a, b)) return copy({ k: "imm", value: 0 });
  if (o === "*" && (isImm(a, 0) || isImm(b, 0))) return copy({ k: "imm", value: 0 });
  if (o === "*" && isImm(b, 1)) return copy(a);
  if (o === "*" && isImm(a, 1)) return copy(b);
  if (o === "/" && isImm(b, 1)) return copy(a);
  if (o === "%" && isImm(b, 1)) return copy({ k: "imm", value: 0 });
  /* `x - x` is 0 for every x, but `x / x` is not — x can be zero. */
  if ((o === "==" || o === "<=" || o === ">=") && sameOperand(a, b) && a.k === "name") return copy({ k: "imm", value: 1 });
  if ((o === "!=" || o === "<" || o === ">") && sameOperand(a, b) && a.k === "name") return copy({ k: "imm", value: 0 });
  return null;
}

function algebra(input: Instr[]): PassResult {
  const out = input.map((i) => simplifyOne(i) ?? i);
  return report(
    "algebra", "Algebraic simplification",
    "Identities that hold for every integer, so no operand has to be known: adding zero, multiplying by one, comparing a name with itself. Multiplying by zero is the one that earns the pass — it deletes a multiply without knowing either side.",
    input, out,
  );
}

/* ── 3. common subexpression elimination ─────────────────────────── */

const COMMUTATIVE = new Set<BinOp>(["+", "*", "==", "!="]);

/** The expression an instruction computes, as a string. Commutative
 *  operands are sorted, so `a + b` and `b + a` hash to one key and the
 *  second one is found. */
function exprKey(i: Extract<Instr, { op: "bin" }>): string {
  const a = showOperand(i.a), b = showOperand(i.b);
  const [x, y] = COMMUTATIVE.has(i.o) && b < a ? [b, a] : [a, b];
  return `${i.o}|${x}|${y}`;
}

function cse(input: Instr[]): PassResult {
  let available = new Map<string, string>();
  const out: Instr[] = [];

  for (const instr of input) {
    if (instr.op === "label") available = new Map();

    let next: Instr = instr;
    if (instr.op === "bin") {
      const key = exprKey(instr);
      const had = available.get(key);
      if (had !== undefined && had !== instr.dst) next = { op: "copy", dst: instr.dst, src: { k: "name", id: had } };
    }

    const dst = defOf(next);
    if (dst !== null) {
      /* Writing a name invalidates every expression that reads it and
         every entry that was answered by it. */
      for (const [key, holder] of available)
        if (holder === dst || key.split("|").includes(dst)) available.delete(key);
      if (next.op === "bin") available.set(exprKey(next), dst);
    }
    if (endsBlock(next)) available = new Map();

    out.push(next);
  }

  return report(
    "cse", "Common subexpression elimination",
    "The second time a block computes the same expression from the same unmodified operands, it reads the first result instead. Writing to a name invalidates every recorded expression that mentioned it — that invalidation is the whole correctness argument.",
    input, out,
  );
}

/* ── 4. copy propagation ─────────────────────────────────────────── */

function copies(input: Instr[]): PassResult {
  let alias = new Map<string, string>();
  const out: Instr[] = [];

  for (const instr of input) {
    if (instr.op === "label") alias = new Map();

    const next = mapUses(instr, (o) => (o.k === "name" && alias.has(o.id) ? { k: "name", id: alias.get(o.id)! } : o));

    const dst = defOf(next);
    if (dst !== null) {
      for (const [from, to] of alias)
        if (from === dst || to === dst) alias.delete(from);
      if (next.op === "copy" && next.src.k === "name" && next.src.id !== dst) alias.set(dst, next.src.id);
    }
    if (endsBlock(next)) alias = new Map();

    out.push(next);
  }

  return report(
    "copy", "Copy propagation",
    "Lowering emitted a temp and then copied it into the variable; the passes above emitted more copies of their own. This forwards readers past all of them, to the name that actually holds the value. It deletes nothing — it only makes the copies unread, which is the next pass's cue.",
    input, out,
  );
}

/* ── 5. dead code elimination ────────────────────────────────────── */

function dead(input: Instr[]): PassResult {
  const live: (Instr | null)[] = [...input];

  /* To a fixpoint: removing one instruction can be what makes the
     instruction that fed it dead in turn. Conservative across control
     flow on purpose — a name read anywhere at all counts as read, so
     no analysis of which edges reach which use is needed. */
  for (;;) {
    const read = new Set<string>();
    for (const i of live) if (i) for (const u of usesOf(i)) read.add(u);

    let cut = 0;
    for (let k = 0; k < live.length; k++) {
      const i = live[k];
      if (!i) continue;
      const dst = defOf(i);
      /* copy / bin / neg are the only pure instructions; a jump, a
         branch, a label and a return all have to stay. */
      if (dst !== null && !read.has(dst)) { live[k] = null; cut++; }
    }
    if (!cut) break;
  }

  return report(
    "dce", "Dead code elimination",
    "A pure instruction whose destination is never read again is deleted, and deleting it can strand whatever fed it — so this runs to a fixpoint. It is the pass that collects the debris of the other four.",
    input, live,
  );
}

/** All five, in order, each fed the previous one's output. */
export function optimize(code: Instr[]): PassResult[] {
  const passes: PassResult[] = [];
  let current = code;
  for (const run of [constants, algebra, cse, copies, dead]) {
    const result = run(current);
    passes.push(result);
    current = result.out;
  }
  return passes;
}
