/** Stage 6 — x86-64, NASM syntax, System V.
 *
 *  Every value now has a home: a callee-saved register or a slot at a
 *  fixed offset from rbp. The emitter's whole job is to respect that
 *  and to obey the one rule the instruction set will not bend on —
 *  no instruction may have two memory operands. rax is kept out of the
 *  allocator's hands so there is always somewhere to stage a value that
 *  lives in memory; rdx is reserved because `idiv` writes it whether
 *  the program asked for a remainder or not. */

import { showInstr, type Instr, type Operand } from "./tac";
import type { Allocation, Location } from "./regalloc";

export interface AsmLine {
  text: string;
  /** Index of the IR instruction this came from, for cross-highlighting. */
  from: number | null;
  /** Shown to the right, in comment colour. */
  comment?: string;
  label?: boolean;
}

const SETCC: Record<string, string> = {
  "<": "setl", "<=": "setle", ">": "setg", ">=": "setge", "==": "sete", "!=": "setne",
};

const ARITH: Record<string, string> = { "+": "add", "-": "sub" };

export const showLocation = (l: Location): string =>
  l.k === "reg" ? l.reg : `[rbp-${l.slot * 8}]`;

export function emit(code: Instr[], alloc: Allocation): AsmLine[] {
  const out: AsmLine[] = [];
  let at: number | null = null;

  const line = (text: string, comment?: string) => out.push({ text, from: at, comment });
  const labelLine = (text: string) => out.push({ text, from: at, label: true });

  const home = (id: string): Location => alloc.homes.get(id) ?? { k: "spill", slot: 0 };
  const isMem = (id: string) => home(id).k === "spill";

  /** An operand as NASM sees it. */
  const val = (o: Operand): string => (o.k === "imm" ? String(o.value) : showLocation(home(o.id)));

  /** Stage an operand in rax, which is where every computation starts. */
  const intoRax = (o: Operand) => line(`mov rax, ${val(o)}`);

  /** Land rax in a destination. Never two memory operands: rax is a
   *  register, so this is always legal however dst is housed. */
  const fromRax = (dst: string) => line(`mov ${showLocation(home(dst))}, rax`);

  const frame = alloc.spills ? Math.ceil((alloc.spills * 8) / 16) * 16 : 0;

  out.push({ text: "  global main", from: null });
  out.push({ text: "  section .text", from: null });
  out.push({ text: "", from: null });
  out.push({ text: "main:", from: null, label: true });
  out.push({ text: "  push rbp", from: null });
  out.push({ text: "  mov rbp, rsp", from: null });
  if (frame) out.push({ text: `  sub rsp, ${frame}`, from: null, comment: `${alloc.spills} spill slot${alloc.spills === 1 ? "" : "s"}` });
  /* Callee-saved by the ABI, so whatever the allocator handed out has
     to be given back. Exactly the registers it used, no more. */
  for (const r of alloc.used) out.push({ text: `  push ${r}`, from: null, comment: r === alloc.used[0] ? "callee-saved" : undefined });

  code.forEach((instr, index) => {
    at = index;
    const note = showInstr(instr);

    switch (instr.op) {
      /* System V puts the first integer argument in rdi, which the
         allocator never hands out — so this is always a plain move. */
      case "param":
        line(`mov ${showLocation(home(instr.dst))}, rdi`, note);
        break;

      case "label":
        labelLine(`${instr.name}:`);
        break;

      case "jump":
        line(`jmp ${instr.target}`, note);
        break;

      case "branch": {
        /* No register operand means no implied width, so the size has
           to be spelled out for the assembler. */
        if (instr.cond.k === "imm") { intoRax(instr.cond); line("cmp rax, 0"); }
        else if (isMem(instr.cond.id)) line(`cmp qword ${val(instr.cond)}, 0`, note);
        else line(`cmp ${val(instr.cond)}, 0`, note);
        line(`je ${instr.target}`);
        break;
      }

      case "ret":
        intoRax(instr.src);
        line("jmp .epilogue", note);
        break;

      case "copy": {
        const dst = showLocation(home(instr.dst));
        if (instr.src.k === "imm") {
          line(isMem(instr.dst) ? `mov qword ${dst}, ${instr.src.value}` : `mov ${dst}, ${instr.src.value}`, note);
        } else if (isMem(instr.dst) && isMem(instr.src.id)) {
          intoRax(instr.src);
          fromRax(instr.dst);
          out[out.length - 2].comment = note;
        } else {
          line(`mov ${dst}, ${val(instr.src)}`, note);
        }
        break;
      }

      case "neg":
        intoRax(instr.a);
        line("neg rax", note);
        fromRax(instr.dst);
        break;

      case "bin": {
        const { o, a, b } = instr;
        intoRax(a);
        out[out.length - 1].comment = note;

        if (o === "+" || o === "-") {
          line(`${ARITH[o]} rax, ${val(b)}`);
        } else if (o === "*") {
          /* The three-operand form is the only one that takes an
             immediate; the two-operand form takes a register or memory. */
          line(b.k === "imm" ? `imul rax, rax, ${b.value}` : `imul rax, ${val(b)}`);
        } else if (o === "/" || o === "%") {
          line("cqo", "sign-extend rax into rdx:rax");
          if (b.k === "imm") { line(`mov r10, ${b.value}`); line("idiv r10"); }
          else if (isMem(b.id)) line(`idiv qword ${val(b)}`);
          else line(`idiv ${val(b)}`);
          if (o === "%") line("mov rax, rdx", "remainder");
        } else {
          line(`cmp rax, ${val(b)}`);
          line(`${SETCC[o]} al`);
          line("movzx rax, al", "0 or 1, zero-extended");
        }

        fromRax(instr.dst);
        break;
      }
    }
  });

  at = null;
  out.push({ text: "", from: null });
  out.push({ text: ".epilogue:", from: null, label: true });
  for (const r of [...alloc.used].reverse()) out.push({ text: `  pop ${r}`, from: null });
  out.push({ text: "  leave", from: null, comment: frame ? "mov rsp, rbp / pop rbp" : undefined });
  out.push({ text: "  ret", from: null });

  /* Everything above was written unindented for readability here; the
     assembler does not care, but the panel does. */
  return out.map((l) => (l.label || l.from === null || l.text === "" ? l : { ...l, text: `  ${l.text}` }));
}
