/** ricc, in the browser.
 *
 *  The real one is C++23 and emits an object file. This is the same
 *  pipeline, in the same order, small enough to watch: characters →
 *  tokens → tree → three-address code → five passes → live intervals
 *  and linear scan → x86-64. Nothing here is precomputed; every panel
 *  the playground draws is this function's output for whatever is in
 *  the editor.
 *
 *  It is deterministic and total: the same source always produces the
 *  same nine stages, and anything it cannot compile comes back as a
 *  `CompileError` with a line and a column rather than a throw. */

import { CompileError, lex, type Token } from "./lexer";
import { formatAst, parse } from "./parser";
import { lower, type Instr } from "./tac";
import { optimize, type PassResult } from "./optimize";
import { allocate, type Allocation } from "./regalloc";
import { emit, type AsmLine } from "./emit";

export { CompileError } from "./lexer";
export { PARAM, showInstr } from "./tac";
export { REGISTERS } from "./regalloc";
export { showLocation } from "./emit";
export type { Token } from "./lexer";
export type { Instr } from "./tac";
export type { PassResult, PassRow } from "./optimize";
export type { Allocation, Interval, Location, Register } from "./regalloc";
export type { AsmLine } from "./emit";

export interface Compilation {
  ok: true;
  tokens: Token[];
  ast: string[];
  ir: Instr[];
  passes: PassResult[];
  optimized: Instr[];
  alloc: Allocation;
  asm: AsmLine[];
  /** Instructions in, instructions out, and what allocation cost. */
  stats: { before: number; after: number; registers: number; spills: number };
}

export interface Failure {
  ok: false;
  message: string;
  line: number;
  col: number;
}

export type Result = Compilation | Failure;

export function compile(source: string): Result {
  try {
    const tokens = lex(source);
    const ast = parse(tokens);
    const { code } = lower(ast, tokens);
    const passes = optimize(code);
    const optimized = passes[passes.length - 1].out;
    const alloc = allocate(optimized);

    return {
      ok: true,
      tokens,
      ast: formatAst(ast),
      ir: code,
      passes,
      optimized,
      alloc,
      asm: emit(optimized, alloc),
      stats: {
        before: code.length,
        after: optimized.length,
        registers: alloc.used.length,
        spills: alloc.spills,
      },
    };
  } catch (e) {
    if (e instanceof CompileError) return { ok: false, message: e.message, line: e.line, col: e.col };
    throw e;
  }
}

export interface Preset { id: string; label: string; blurb: string; source: string }

/** Four programs, each chosen for one thing it makes the pipeline do.
 *  `n` is the incoming argument, so a program can be about something
 *  the optimizer is not allowed to know at compile time. */
export const PRESETS: Preset[] = [
  {
    id: "gcd",
    label: "gcd",
    blurb: "A loop, so the allocator has a back edge to reason about",
    /* The one that opens the lab, so it has to give every panel
       something: arithmetic the middle end can finish at compile time,
       and a loop that keeps three values live across the jump back. */
    source: `// Euclid, with some arithmetic the optimizer
// can finish before the program is ever run.
let a = n * 1 + 0;
let b = 21 * 22;
while (b != 0) {
  let t = a % b;
  a = b;
  b = t;
}
return a;`,
  },
  {
    id: "fold",
    label: "folding",
    blurb: "Everything the middle end can decide without running the program",
    source: `// Nothing here survives to run time except
// the parts that touch n.
let base = 3 * 4 + 2;
let scale = base * 0;
let total = base + scale;
let same = n * 1;
return total + same + (base - base);`,
  },
  {
    id: "cse",
    label: "redundancy",
    blurb: "The same expression, spelled twice",
    source: `// (n + 7) is computed three times in the
// source and once in the object code.
let a = (n + 7) * 2;
let b = 3 * (n + 7);
let c = a + b;
if (n + 7 > 100) {
  c = c - 1;
}
return c;`,
  },
  {
    id: "spill",
    label: "spilling",
    blurb: "More live values than there are registers",
    source: `// Six values live at once, four registers to
// put them in. Two of them end up on the stack.
let a = n * 3;
let b = n + 7;
let c = a - b;
let d = a * b;
let e = c + d;
let f = d - c;
return a + b + c + d + e + f;`,
  },
];
