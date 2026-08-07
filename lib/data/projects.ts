/** One source of truth: each project is simultaneously a menu dish,
 *  a carousel card, and a serve-overlay detail page. */

export interface Project {
  id: string;            // dom id, e.g. "p-phalanx"
  course: string;        // 一 二 三 四 五
  name: string;
  sub: string;           // dish styling, e.g. "house ramen"
  tag?: string;          // おすすめ / 本日の一品
  price: string;         // right-aligned metric line (plain text)
  desc: string;
  prep: string;
  also: { label: string; id: string }[];
  recipeHref: string;
  recipeLabel: string;
  live?: boolean;
  // carousel card
  card: { pos: string; s: string; m: string; hot?: boolean };
}

export const PROJECTS: Project[] = [
  {
    id: "p-phalanx", course: "一", name: "Phalanx", sub: "house ramen", tag: "おすすめ",
    price: "8.0K LOC · 115 tests",
    desc: "A distributed key-value broth, simmered on Raft. Five pots replicate every ladle — lose one mid-service and dinner still arrives. Linearizability-checked, chaos-tested, clean under the race detector.",
    prep: "Go, Raft, MVCC, segment WAL, Prometheus",
    also: [{ label: "ricc", id: "p-ricc" }, { label: "Penumbra", id: "p-penumbra" }],
    recipeHref: "https://github.com/AbhinavPabbaraju", recipeLabel: "recipe ↗",
    card: { pos: "P1", s: "Distributed KV · Raft", m: "8.0K LOC · 115 tests", hot: true },
  },
  {
    id: "p-ricc", course: "二", name: "ricc", sub: "hand-pulled noodles",
    price: "6.2K LOC · x86-64",
    desc: "Source dough kneaded through lexer, parser and five optimization passes, pulled thin over a TAC IR and plated by hand as x86-64 — linear-scan register allocation, no shortcuts.",
    prep: "C++23, Pratt parsing, TAC IR, NASM",
    also: [{ label: "Phalanx", id: "p-phalanx" }],
    recipeHref: "https://github.com/AbhinavPabbaraju", recipeLabel: "recipe ↗",
    card: { pos: "P2", s: "Optimizing compiler", m: "C++23 → x86-64" },
  },
  {
    id: "p-ave", course: "三", name: "AVE", sub: "galaxy donburi",
    price: "9 subsystems",
    desc: "A small universe over rice: N-body physics simmered on the GPU, four galaxy morphologies, collisions finished tableside at the Roche limit. Momentum conserved — the house guarantees it.",
    prep: "React Three Fiber, GLSL, GPU compute, Next.js",
    also: [{ label: "F1 2026", id: "p-f1" }],
    recipeHref: "https://github.com/AbhinavPabbaraju", recipeLabel: "recipe ↗",
    card: { pos: "P3", s: "GPU astrophysics", m: "9 subsystems" },
  },
  {
    id: "p-penumbra", course: "四", name: "Penumbra", sub: "yakitori, threaded",
    price: "41 tests · 14 themes",
    desc: "Tasks skewered on a graph instead of a list. Automations grill in the back kitchen; an AI copilot works the counter; everything served under test.",
    prep: "Node, Express, d3-force, RBAC, optimistic UI",
    also: [{ label: "Phalanx", id: "p-phalanx" }],
    recipeHref: "https://github.com/AbhinavPabbaraju", recipeLabel: "recipe ↗",
    card: { pos: "P4", s: "Task graph platform", m: "41 tests · 14 themes" },
  },
  {
    id: "p-f1", course: "五", name: "F1 2026", sub: "chef’s special, tonight only — every night", tag: "本日の一品",
    price: "10K+ sims · 3 live APIs", live: true,
    desc: "Tonight’s catch, streamed fresh: live telemetry from three APIs, a Monte Carlo pot simulating ten thousand championship seasons, and a 3D globe turning slowly behind the counter.",
    prep: "Jolpica, OpenF1, Open-Meteo, Monte Carlo",
    also: [{ label: "AVE", id: "p-ave" }],
    recipeHref: "https://f1-dashboard-mu.vercel.app", recipeLabel: "taste it live ↗",
    card: { pos: "LIVE", s: "Live analytics", m: "10K+ sims/run" },
  },
];

export interface Note {
  date: string; topic: string; title: string; read: string; href: string;
  /** Set for anything that leaves the site — the row opens in a new tab
   *  and gets the noopener pair. Internal notes stay in this one. */
  external?: boolean;
}

/** Published pieces first, newest first.
 *
 *  The four below them are unwritten: they are titles for posts that do
 *  not exist yet and their `href` goes nowhere. They read as shipped
 *  work on a page whose whole argument is that the numbers are real —
 *  either write them or cut them. */
export const NOTES: Note[] = [
  {
    date: "2026 · 05", topic: "Probability · Hashing",
    title: "Bloom Filters: The Mathematics of Acceptable Uncertainty",
    read: "9 min", external: true,
    href: "https://medium.com/@abhinavpabbaraju/bloom-filters-the-mathematics-of-acceptable-uncertainty-94d123bf7593",
  },
  {
    date: "2026 · 04", topic: "Data structures",
    title: "The Mathematics of Hashing: From Uniform Distribution to Collision Resistance",
    read: "7 min", external: true,
    href: "https://medium.com/@abhinavpabbaraju/the-mathematics-of-hashing-from-uniform-distribution-to-collision-resistance-5c805c2c8cd5",
  },
  { date: "2026 · 03", topic: "Distributed systems", title: "Making Raft boring: what 115 tests taught me about consensus", read: "8 min", href: "#writing" },
  { date: "2026 · 02", topic: "Compilers", title: "Register allocation without tears: linear scan in ricc", read: "11 min", href: "#writing" },
  { date: "2026 · 01", topic: "Performance", title: "The p99 is the product: designing for tail latency", read: "6 min", href: "#writing" },
  { date: "2025 · 12", topic: "F1 · Simulation", title: "Monte Carlo on the grid: simulating a championship 10,000 times", read: "9 min", href: "#writing" },
];
