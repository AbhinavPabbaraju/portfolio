/** Stage 1 — characters to tokens.
 *
 *  A hand-written scanner, the way ricc's is: no regex table, no
 *  generator. Every token carries its line and column so a syntax error
 *  can point at the place it happened rather than at the whole program. */

export type TokenKind = "int" | "ident" | "keyword" | "op" | "punct" | "eof";

export interface Token {
  kind: TokenKind;
  text: string;
  line: number;
  col: number;
}

/** Thrown by every phase. The playground catches it and shows the
 *  message against the source instead of blanking the panel. */
export class CompileError extends Error {
  constructor(message: string, readonly line: number, readonly col: number) {
    super(message);
    this.name = "CompileError";
  }
}

const KEYWORDS = new Set(["let", "if", "else", "while", "return"]);

/* Longest match first, or `<=` lexes as `<` followed by a stray `=`. */
const OPERATORS = ["==", "!=", "<=", ">=", "+", "-", "*", "/", "%", "<", ">", "="];

const PUNCT = new Set(["(", ")", "{", "}", ";"]);

const isDigit = (c: string) => c >= "0" && c <= "9";
const isIdentStart = (c: string) => /[A-Za-z_]/.test(c);
const isIdentPart = (c: string) => /[A-Za-z0-9_]/.test(c);

export function lex(source: string): Token[] {
  const out: Token[] = [];
  let i = 0, line = 1, col = 1;

  const push = (kind: TokenKind, text: string, atCol: number) =>
    out.push({ kind, text, line, col: atCol });

  while (i < source.length) {
    const c = source[i];

    if (c === "\n") { i++; line++; col = 1; continue; }
    if (c === " " || c === "\t" || c === "\r") { i++; col++; continue; }

    /* Line comments only — the subset has no block comments to nest. */
    if (c === "/" && source[i + 1] === "/") {
      while (i < source.length && source[i] !== "\n") i++;
      continue;
    }

    if (isDigit(c)) {
      const start = i, at = col;
      while (i < source.length && isDigit(source[i])) { i++; col++; }
      /* Reject `12abc` here rather than letting the parser see two
         tokens that were never two tokens in the source. */
      if (i < source.length && isIdentPart(source[i]))
        throw new CompileError(`Bad number literal near "${source.slice(start, i + 1)}"`, line, at);
      push("int", source.slice(start, i), at);
      continue;
    }

    if (isIdentStart(c)) {
      const start = i, at = col;
      while (i < source.length && isIdentPart(source[i])) { i++; col++; }
      const text = source.slice(start, i);
      push(KEYWORDS.has(text) ? "keyword" : "ident", text, at);
      continue;
    }

    const op = OPERATORS.find((o) => source.startsWith(o, i));
    if (op) { push("op", op, col); i += op.length; col += op.length; continue; }

    if (PUNCT.has(c)) { push("punct", c, col); i++; col++; continue; }

    throw new CompileError(`Unexpected character "${c}"`, line, col);
  }

  out.push({ kind: "eof", text: "␄", line, col });
  return out;
}
