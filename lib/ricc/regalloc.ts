/** Stage 5 — live intervals, then linear scan.
 *
 *  Graph colouring models interference exactly and pays for it. Linear
 *  scan gives up the exact model: it flattens the function into one
 *  numbered list, approximates each value's life as a single span from
 *  its first write to its last read, and then does one left-to-right
 *  walk allocating registers to spans. It is much less precise and much
 *  faster, which is the trade ricc makes.
 *
 *  The one thing the approximation cannot get away with is a loop. A
 *  value written before a loop and read inside it is live for the whole
 *  loop, including the part of it that sits textually *after* the last
 *  read — because control comes back around. Every interval touching a
 *  back edge is therefore stretched to the end of that loop. Skip this
 *  and the allocator hands the register to someone else mid-loop, and
 *  the program is quietly wrong on the second iteration. */

import { defOf, usesOf, type Instr } from "./tac";

/** Callee-saved and deliberately few: four is small enough that an
 *  ordinary program spills, which is the part worth watching. rax, rdx
 *  and r10 are held back as scratch for the emitter. */
export const REGISTERS = ["rbx", "r12", "r13", "r14"] as const;
export type Register = (typeof REGISTERS)[number];

export interface Interval {
  id: string;
  /** Instruction indices, inclusive. */
  start: number;
  end: number;
  /** Where the last actual read is. Below `end` when a loop stretched
   *  the interval past it — the gap is the part of the range the value
   *  is held for the sake of the next iteration, and nothing else. */
  lastUse: number;
  stretched: boolean;
  location: Location;
}

export type Location =
  | { k: "reg"; reg: Register }
  /** Slot n lives at [rbp-8n]. */
  | { k: "spill"; slot: number };

export interface Allocation {
  intervals: Interval[];
  /** Name to home, for the emitter. */
  homes: Map<string, Location>;
  spills: number;
  /** Which registers were touched — the prologue saves exactly these. */
  used: Register[];
  /** Back edges as [top, bottom] index pairs, for drawing the loops. */
  loops: [number, number][];
  length: number;
}

/** First write to last read, over the linear instruction order. */
function rawIntervals(code: Instr[]): Map<string, { start: number; end: number }> {
  const span = new Map<string, { start: number; end: number }>();
  const touch = (id: string, at: number) => {
    const e = span.get(id);
    if (!e) span.set(id, { start: at, end: at });
    else { e.start = Math.min(e.start, at); e.end = Math.max(e.end, at); }
  };

  code.forEach((instr, at) => {
    const d = defOf(instr);
    if (d !== null) touch(d, at);
    for (const u of usesOf(instr)) touch(u, at);
  });

  return span;
}

/** A backward jump is a loop. Its body is everything between the label
 *  it targets and the jump itself. */
function backEdges(code: Instr[]): [number, number][] {
  const labelAt = new Map<string, number>();
  code.forEach((i, at) => { if (i.op === "label") labelAt.set(i.name, at); });

  const out: [number, number][] = [];
  code.forEach((i, at) => {
    const target = i.op === "jump" ? i.target : i.op === "branch" ? i.target : null;
    if (target === null) return;
    const to = labelAt.get(target);
    if (to !== undefined && to < at) out.push([to, at]);
  });
  return out;
}

export function allocate(code: Instr[]): Allocation {
  const loops = backEdges(code);
  const raw = rawIntervals(code);

  const intervals: Interval[] = [];
  for (const [id, { start, end }] of raw) {
    let last = end;
    /* Repeat until stable: stretching an interval into one loop can
       push it into an enclosing loop that it did not previously
       overlap. Nested loops need the second lap. */
    for (let changed = true; changed;) {
      changed = false;
      for (const [top, bottom] of loops) {
        if (start <= bottom && last >= top && last < bottom) { last = bottom; changed = true; }
      }
    }
    intervals.push({ id, start, end: last, lastUse: end, stretched: last > end, location: { k: "spill", slot: 0 } });
  }

  /* Linear scan proper: intervals in order of start, an active set kept
     in order of end. */
  intervals.sort((a, b) => a.start - b.start || a.end - b.end);

  const free: Register[] = [...REGISTERS];
  let active: Interval[] = [];
  let spills = 0;
  const used = new Set<Register>();

  const expire = (at: number) => {
    const keep: Interval[] = [];
    for (const iv of active) {
      if (iv.end < at && iv.location.k === "reg") free.push(iv.location.reg);
      else keep.push(iv);
    }
    active = keep;
  };

  for (const iv of intervals) {
    expire(iv.start);

    if (free.length) {
      const reg = free.shift()!;
      iv.location = { k: "reg", reg };
      used.add(reg);
    } else {
      /* Spill the interval that lives longest, not the new one by
         default — whoever is holding a register the furthest into the
         future is the one whose register buys the most. */
      const victim = active.reduce((worst, c) => (c.end > worst.end ? c : worst), active[0]);
      if (victim && victim.end > iv.end && victim.location.k === "reg") {
        iv.location = victim.location;
        victim.location = { k: "spill", slot: ++spills };
        active = active.filter((a) => a !== victim);
      } else {
        iv.location = { k: "spill", slot: ++spills };
      }
    }

    if (iv.location.k === "reg") {
      active.push(iv);
      active.sort((a, b) => a.end - b.end);
    }
  }

  const homes = new Map<string, Location>();
  for (const iv of intervals) homes.set(iv.id, iv.location);

  return {
    intervals: [...intervals].sort((a, b) => a.start - b.start || a.id.localeCompare(b.id)),
    homes,
    spills,
    used: REGISTERS.filter((r) => used.has(r)),
    loops,
    length: code.length,
  };
}
