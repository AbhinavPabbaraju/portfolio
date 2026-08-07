/** Stage 3 — the tree, flattened into three-address code.
 *
 *  Every instruction reads at most two operands and writes at most one
 *  destination, which is the property that makes everything downstream
 *  tractable: the optimizer can pattern-match a line at a time, and the
 *  register allocator only ever has two live inputs to find homes for.
 *
 *  Lowering is deliberately naive. `let a = 3 * 4;` becomes a multiply
 *  into a fresh temp and then a copy into `a`, rather than multiplying
 *  straight into `a`. That redundant copy is not an oversight — it is
 *  what copy propagation and dead code elimination are shown removing
 *  two stages later. A front end that is clever here has nothing left
 *  to teach the middle. */

import { CompileError, type Token } from "./lexer";
import type { BinOp, Expr, Stmt } from "./parser";

export type Operand =
  | { k: "imm"; value: number }
  | { k: "name"; id: string };

export type Instr =
  /** The incoming argument, materialised into a name the rest of the
   *  IR can treat like any other. Defining it here rather than special
   *  casing a register means it gets an interval and a home like
   *  everything else — and gets deleted if the program never reads it. */
  | { op: "param"; dst: string; index: number }
  | { op: "copy"; dst: string; src: Operand }
  | { op: "bin"; dst: string; o: BinOp; a: Operand; b: Operand }
  | { op: "neg"; dst: string; a: Operand }
  | { op: "label"; name: string }
  | { op: "jump"; target: string }
  /** Jump when `cond` is zero — the shape `if (x) {…}` lowers to. */
  | { op: "branch"; cond: Operand; target: string }
  | { op: "ret"; src: Operand };

export const imm = (value: number): Operand => ({ k: "imm", value });
export const name = (id: string): Operand => ({ k: "name", id });

export const sameOperand = (a: Operand, b: Operand): boolean =>
  a.k === "imm" && b.k === "imm" ? a.value === b.value
    : a.k === "name" && b.k === "name" ? a.id === b.id
      : false;

/** The name an instruction writes, or null for the ones that write
 *  nothing. Used by every pass and by liveness, so it lives here. */
export function defOf(i: Instr): string | null {
  return i.op === "copy" || i.op === "bin" || i.op === "neg" || i.op === "param" ? i.dst : null;
}

/** The names an instruction reads, in order. */
export function usesOf(i: Instr): string[] {
  const pick = (...ops: Operand[]) => ops.filter((o) => o.k === "name").map((o) => (o as { id: string }).id);
  switch (i.op) {
    case "copy": return pick(i.src);
    case "bin": return pick(i.a, i.b);
    case "neg": return pick(i.a);
    case "branch": return pick(i.cond);
    case "ret": return pick(i.src);
    default: return [];
  }
}

/** Rewrite every operand an instruction reads. Passes that substitute
 *  a value for a name all go through this, so none of them has to
 *  re-enumerate the instruction shapes. */
export function mapUses(i: Instr, f: (o: Operand) => Operand): Instr {
  switch (i.op) {
    case "copy": return { ...i, src: f(i.src) };
    case "bin": return { ...i, a: f(i.a), b: f(i.b) };
    case "neg": return { ...i, a: f(i.a) };
    case "branch": return { ...i, cond: f(i.cond) };
    case "ret": return { ...i, src: f(i.src) };
    default: return i;
  }
}

export const showOperand = (o: Operand): string => (o.k === "imm" ? String(o.value) : o.id);

/** One instruction as ricc prints it. Labels sit in the left margin;
 *  everything else is indented under them. */
export function showInstr(i: Instr): string {
  switch (i.op) {
    case "param": return `${i.dst} = param ${i.index}`;
    case "copy": return `${i.dst} = ${showOperand(i.src)}`;
    case "bin": return `${i.dst} = ${showOperand(i.a)} ${i.o} ${showOperand(i.b)}`;
    case "neg": return `${i.dst} = -${showOperand(i.a)}`;
    case "label": return `${i.name}:`;
    case "jump": return `goto ${i.target}`;
    case "branch": return `ifz ${showOperand(i.cond)} goto ${i.target}`;
    case "ret": return `ret ${showOperand(i.src)}`;
  }
}

/** The one incoming argument. Predeclared, so a program can read it
 *  without a declaration syntax the subset does not have. */
export const PARAM = "n";

export interface Lowered {
  code: Instr[];
  /** Source names in declaration order — the temps come after these. */
  variables: string[];
}

export function lower(program: Stmt[], tokens: Token[]): Lowered {
  const code: Instr[] = [];
  const variables: string[] = [PARAM];

  /* Lexical scope, one set per block. A name declared inside a block is
     gone when the block ends, which is the only thing that stops a
     program from reading a value the path it took never wrote —
     the IR would happily allocate it a register full of nothing.
     Shadowing is rejected rather than renamed: the IR shares one flat
     namespace with the source, so two live `x` would have to become
     `x` and `x.1`, and every panel below would then be showing names
     the programmer never wrote. */
  const scopes: Set<string>[] = [new Set([PARAM])];
  const declaredIn = (id: string) => scopes.find((s) => s.has(id));
  const scoped = <T,>(body: () => T): T => {
    scopes.unshift(new Set());
    try { return body(); } finally { scopes.shift(); }
  };

  /* Temps must not collide with a source name, and the source is the
     one thing this generator does not control. Skip past any taken. */
  const taken = new Set(tokens.filter((t) => t.kind === "ident").map((t) => t.text));
  let tempN = 0;
  const temp = (): string => {
    let id = `t${tempN++}`;
    while (taken.has(id)) id = `t${tempN++}`;
    return id;
  };

  let labelN = 0;
  const label = () => `L${labelN++}`;

  const emit = (i: Instr) => { code.push(i); };

  function evalExpr(e: Expr): Operand {
    switch (e.k) {
      case "int":
        return imm(e.value);

      case "var":
        if (!declaredIn(e.name))
          throw new CompileError(`"${e.name}" is not in scope here`, e.at.line, e.at.col);
        return name(e.name);

      case "neg": {
        const a = evalExpr(e.operand);
        const dst = temp();
        emit({ op: "neg", dst, a });
        return name(dst);
      }

      case "bin": {
        /* Left before right, always. The subset has no side effects, so
           the order is unobservable — but pinning it keeps the IR
           reproducible, which is what makes the panels below diffable. */
        const a = evalExpr(e.left);
        const b = evalExpr(e.right);
        const dst = temp();
        emit({ op: "bin", dst, o: e.op, a, b });
        return name(dst);
      }
    }
  }

  function lowerStmts(stmts: Stmt[]) {
    for (const s of stmts) {
      switch (s.k) {
        case "let": {
          if (s.name === PARAM)
            throw new CompileError(`"${PARAM}" is the incoming argument and is already in scope`, s.at.line, s.at.col);
          const where = declaredIn(s.name);
          if (where === scopes[0])
            throw new CompileError(`"${s.name}" is already declared in this block`, s.at.line, s.at.col);
          if (where)
            throw new CompileError(`"${s.name}" would shadow an outer declaration — pick another name`, s.at.line, s.at.col);
          const value = evalExpr(s.init);
          scopes[0].add(s.name);
          variables.push(s.name);
          emit({ op: "copy", dst: s.name, src: value });
          break;
        }

        case "assign": {
          if (!declaredIn(s.name))
            throw new CompileError(`"${s.name}" is assigned before it is declared`, s.at.line, s.at.col);
          emit({ op: "copy", dst: s.name, src: evalExpr(s.value) });
          break;
        }

        case "return":
          emit({ op: "ret", src: evalExpr(s.value) });
          break;

        case "if": {
          const otherwise = label();
          emit({ op: "branch", cond: evalExpr(s.cond), target: otherwise });
          scoped(() => lowerStmts(s.then));
          if (!s.else) {
            emit({ op: "label", name: otherwise });
            break;
          }
          const end = label();
          emit({ op: "jump", target: end });
          emit({ op: "label", name: otherwise });
          scoped(() => lowerStmts(s.else!));
          emit({ op: "label", name: end });
          break;
        }

        case "while": {
          /* Condition at the top and a jump back at the bottom. The
             back edge is what the interval builder later looks for. */
          const top = label(), end = label();
          emit({ op: "label", name: top });
          emit({ op: "branch", cond: evalExpr(s.cond), target: end });
          scoped(() => lowerStmts(s.body));
          emit({ op: "jump", target: top });
          emit({ op: "label", name: end });
          break;
        }
      }
    }
  }

  emit({ op: "param", dst: PARAM, index: 0 });
  lowerStmts(program);

  /* Falling off the end returns 0, so the emitted function always has
     a defined value in rax on every path out. */
  if (code[code.length - 1]?.op !== "ret") emit({ op: "ret", src: imm(0) });

  return { code, variables };
}
