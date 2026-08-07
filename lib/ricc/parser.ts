/** Stage 2 — tokens to a tree.
 *
 *  Statements by recursive descent, expressions by Pratt. Pratt is the
 *  reason there is no cascade of one-rule-per-precedence-level functions
 *  here: precedence is a number attached to the operator, and the loop
 *  reads it. Adding `%` at the same level as `*` is one line in BP. */

import { CompileError, type Token } from "./lexer";

/** Where a node came from. Only the nodes that can fail a later
 *  semantic check carry one — an undefined name has to point somewhere. */
export interface Pos { line: number; col: number }

export type Expr =
  | { k: "int"; value: number }
  | { k: "var"; name: string; at: Pos }
  | { k: "bin"; op: BinOp; left: Expr; right: Expr }
  | { k: "neg"; operand: Expr };

export type BinOp = "+" | "-" | "*" | "/" | "%" | "<" | "<=" | ">" | ">=" | "==" | "!=";

export type Stmt =
  | { k: "let"; name: string; init: Expr; at: Pos }
  | { k: "assign"; name: string; value: Expr; at: Pos }
  | { k: "if"; cond: Expr; then: Stmt[]; else: Stmt[] | null }
  | { k: "while"; cond: Expr; body: Stmt[] }
  | { k: "return"; value: Expr };

/** Left binding power. Higher binds tighter; `0` means "not an infix
 *  operator", which is also what ends an expression. */
const BP: Record<string, number> = {
  "==": 3, "!=": 3,
  "<": 4, "<=": 4, ">": 4, ">=": 4,
  "+": 5, "-": 5,
  "*": 6, "/": 6, "%": 6,
};

/** Unary minus binds tighter than any infix operator, so `-a * b`
 *  parses as `(-a) * b`. */
const UNARY_BP = 8;

export function parse(tokens: Token[]): Stmt[] {
  let pos = 0;

  const peek = () => tokens[pos];
  const next = () => tokens[pos++];
  const at = (text: string) => peek().text === text && peek().kind !== "ident";

  const fail = (msg: string): never => {
    const t = peek();
    throw new CompileError(`${msg}, found "${t.text}"`, t.line, t.col);
  };

  const expect = (text: string): Token => {
    if (!at(text)) fail(`Expected "${text}"`);
    return next();
  };

  /** The Pratt loop. `minBp` is the precedence floor this call will
   *  swallow; anything looser is left for the caller to bind. */
  function expr(minBp = 0): Expr {
    let left = prefix();
    for (;;) {
      const t = peek();
      if (t.kind !== "op") break;
      const bp = BP[t.text] ?? 0;
      /* `<=` stops a `bp >= minBp` loop from re-consuming at the same
         level, which is what makes these operators left-associative. */
      if (bp === 0 || bp <= minBp) break;
      next();
      left = { k: "bin", op: t.text as BinOp, left, right: expr(bp) };
    }
    return left;
  }

  function prefix(): Expr {
    const t = next();
    if (t.kind === "int") return { k: "int", value: Number(t.text) };
    if (t.kind === "ident") return { k: "var", name: t.text, at: { line: t.line, col: t.col } };
    if (t.text === "-") return { k: "neg", operand: expr(UNARY_BP) };
    if (t.text === "(") {
      const inner = expr();
      expect(")");
      return inner;
    }
    throw new CompileError(`Expected a value, found "${t.text}"`, t.line, t.col);
  }

  function block(): Stmt[] {
    expect("{");
    const out: Stmt[] = [];
    while (!at("}")) {
      if (peek().kind === "eof") fail("Unclosed block, expected \"}\"");
      out.push(stmt());
    }
    expect("}");
    return out;
  }

  function stmt(): Stmt {
    const t = peek();

    if (t.text === "let" && t.kind === "keyword") {
      next();
      const name = next();
      if (name.kind !== "ident") throw new CompileError(`Expected a name after "let", found "${name.text}"`, name.line, name.col);
      expect("=");
      const init = expr();
      expect(";");
      return { k: "let", name: name.text, init, at: { line: name.line, col: name.col } };
    }

    if (t.text === "if" && t.kind === "keyword") {
      next();
      expect("(");
      const cond = expr();
      expect(")");
      const then = block();
      let otherwise: Stmt[] | null = null;
      if (at("else")) { next(); otherwise = block(); }
      return { k: "if", cond, then, else: otherwise };
    }

    if (t.text === "while" && t.kind === "keyword") {
      next();
      expect("(");
      const cond = expr();
      expect(")");
      return { k: "while", cond, body: block() };
    }

    if (t.text === "return" && t.kind === "keyword") {
      next();
      const value = expr();
      expect(";");
      return { k: "return", value };
    }

    if (t.kind === "ident") {
      next();
      expect("=");
      const value = expr();
      expect(";");
      return { k: "assign", name: t.text, value, at: { line: t.line, col: t.col } };
    }

    return fail("Expected a statement");
  }

  const program: Stmt[] = [];
  while (peek().kind !== "eof") program.push(stmt());
  if (!program.length) throw new CompileError("Nothing to compile", 1, 1);
  return program;
}

/** The tree as indented text — one node per line, which is how the
 *  playground draws it and how ricc's own `-dump-ast` prints it. */
export function formatAst(program: Stmt[]): string[] {
  const out: string[] = [];
  const line = (depth: number, text: string) => out.push(`${"  ".repeat(depth)}${text}`);

  const walkExpr = (e: Expr, depth: number) => {
    switch (e.k) {
      case "int": return line(depth, `Int ${e.value}`);
      case "var": return line(depth, `Var ${e.name}`);
      case "neg": line(depth, "Neg"); return walkExpr(e.operand, depth + 1);
      case "bin":
        line(depth, `Bin ${e.op}`);
        walkExpr(e.left, depth + 1);
        walkExpr(e.right, depth + 1);
    }
  };

  const walkStmts = (stmts: Stmt[], depth: number) => {
    for (const s of stmts) {
      switch (s.k) {
        case "let": line(depth, `Let ${s.name}`); walkExpr(s.init, depth + 1); break;
        case "assign": line(depth, `Assign ${s.name}`); walkExpr(s.value, depth + 1); break;
        case "return": line(depth, "Return"); walkExpr(s.value, depth + 1); break;
        case "if":
          line(depth, "If");
          walkExpr(s.cond, depth + 1);
          line(depth + 1, "then");
          walkStmts(s.then, depth + 2);
          if (s.else) { line(depth + 1, "else"); walkStmts(s.else, depth + 2); }
          break;
        case "while":
          line(depth, "While");
          walkExpr(s.cond, depth + 1);
          line(depth + 1, "do");
          walkStmts(s.body, depth + 2);
          break;
      }
    }
  };

  line(0, "Program");
  walkStmts(program, 1);
  return out;
}
