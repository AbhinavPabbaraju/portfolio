import { NOTES } from "./projects";

/** A book on the shelf. One entry, one link — the spine is the anchor.
 *
 *  `weight` is how thick the spine is drawn, on a 1–3 scale: a paper is
 *  slim, a book is fat. It is the only decoration here that carries meaning,
 *  which is the whole point of the room — the wall is readable before you
 *  have clicked anything. */
export interface Book {
  title: string;
  author: string;
  href: string;
  weight?: 1 | 2 | 3;
}

export interface Bay {
  /** the carved sign over the bay */
  label: string;
  floor: "upper" | "lower";
  /** which bay slot along the wall, left to right */
  slot: number;
  books: Book[];
}

/* ── the reading list ──
   These are links off the site, and they are the one part of this room that
   is a matter of taste rather than geometry. Treat the list as a draft to
   edit: it is your shelf, and a curated one says more than a long one.

   Every URL here is either a publisher's own stable location (ACM DOIs,
   llvm.org/pubs, the authors' own sites) or a canonical mirror, because a
   library full of dead links is worse than an empty one. Worth a pass to
   confirm before this goes out. */
export const BAYS: Bay[] = [
  {
    label: "THEORY", floor: "upper", slot: 0,
    books: [
      { title: "Go To Statement Considered Harmful", author: "Dijkstra, 1968", weight: 1,
        href: "https://dl.acm.org/doi/10.1145/362929.362947" },
      { title: "On the Criteria To Be Used in Decomposing Systems into Modules", author: "Parnas, 1972", weight: 1,
        href: "https://dl.acm.org/doi/10.1145/361598.361623" },
      { title: "Reflections on Trusting Trust", author: "Thompson, 1984", weight: 1,
        href: "https://dl.acm.org/doi/10.1145/358198.358210" },
      { title: "No Silver Bullet", author: "Brooks, 1987", weight: 2,
        href: "https://dl.acm.org/doi/10.1109/MC.1987.1663532" },
    ],
  },
  {
    label: "DISTRIBUTED", floor: "upper", slot: 1,
    books: [
      { title: "In Search of an Understandable Consensus Algorithm", author: "Ongaro & Ousterhout, 2014", weight: 2,
        href: "https://raft.github.io/raft.pdf" },
      { title: "Time, Clocks, and the Ordering of Events", author: "Lamport, 1978", weight: 1,
        href: "https://lamport.azurewebsites.net/pubs/time-clocks.pdf" },
      { title: "Paxos Made Simple", author: "Lamport, 2001", weight: 1,
        href: "https://lamport.azurewebsites.net/pubs/paxos-simple.pdf" },
      { title: "Dynamo: Amazon’s Highly Available Key-value Store", author: "DeCandia et al., 2007", weight: 2,
        href: "https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf" },
      { title: "Notes on Distributed Systems for Young Bloods", author: "Jeff Hodges, 2013", weight: 1,
        href: "https://www.somethingsimilar.com/2013/01/14/notes-on-distributed-systems-for-young-bloods/" },
    ],
  },
  {
    label: "COMPILERS", floor: "upper", slot: 2,
    books: [
      { title: "Crafting Interpreters", author: "Bob Nystrom", weight: 3,
        href: "https://craftinginterpreters.com/" },
      { title: "LLVM: A Compilation Framework for Lifelong Program Analysis", author: "Lattner & Adve, 2004", weight: 2,
        href: "https://llvm.org/pubs/2004-01-30-CGO-LLVM.pdf" },
      { title: "Linear Scan Register Allocation", author: "Poletto & Sarkar, 1999", weight: 1,
        href: "https://dl.acm.org/doi/10.1145/330249.330250" },
    ],
  },
  {
    label: "ARCHITECTURE", floor: "upper", slot: 3,
    books: [
      { title: "The UNIX Time-Sharing System", author: "Ritchie & Thompson, 1974", weight: 1,
        href: "https://dl.acm.org/doi/10.1145/361011.361061" },
      { title: "End-to-End Arguments in System Design", author: "Saltzer, Reed & Clark, 1984", weight: 1,
        href: "https://web.mit.edu/Saltzer/www/publications/endtoend/endtoend.pdf" },
      { title: "The Twelve-Factor App", author: "Adam Wiggins", weight: 2,
        href: "https://12factor.net/" },
    ],
  },
  {
    label: "SYSTEMS", floor: "lower", slot: 0,
    books: [
      { title: "What Every Programmer Should Know About Memory", author: "Ulrich Drepper, 2007", weight: 3,
        href: "https://lwn.net/Articles/250967/" },
      { title: "The Log: What Every Software Engineer Should Know", author: "Jay Kreps, 2013", weight: 2,
        href: "https://engineering.linkedin.com/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying" },
      { title: "Systems Design Explains the World", author: "apenwarr, 2020", weight: 1,
        href: "https://apenwarr.ca/log/20201227" },
    ],
  },
  {
    label: "PERFORMANCE", floor: "lower", slot: 1,
    books: [
      { title: "The Tail at Scale", author: "Dean & Barroso, 2013", weight: 1,
        href: "https://dl.acm.org/doi/10.1145/2408776.2408794" },
      { title: "Latency Numbers Every Programmer Should Know", author: "Jeff Dean / jboner", weight: 1,
        href: "https://gist.github.com/jboner/2841832" },
      { title: "The USE Method", author: "Brendan Gregg", weight: 2,
        href: "https://www.brendangregg.com/usemethod.html" },
      { title: "Flame Graphs", author: "Brendan Gregg", weight: 2,
        href: "https://www.brendangregg.com/flamegraphs.html" },
    ],
  },
  {
    label: "CRAFT", floor: "lower", slot: 2,
    books: [
      { title: "Teach Yourself Programming in Ten Years", author: "Peter Norvig", weight: 1,
        href: "https://norvig.com/21-days.html" },
      { title: "Choose Boring Technology", author: "Dan McKinley", weight: 1,
        href: "https://boringtechnology.club/" },
      { title: "The Grug Brained Developer", author: "grugbrain.dev", weight: 1,
        href: "https://grugbrain.dev/" },
    ],
  },
  {
    /* The last bay, and the payoff of the pan: everything before it is
       somebody else's work. `NOTES` stays the single source of truth, so a
       note written once shows up here and nowhere else needs touching. */
    label: "FIELD NOTES", floor: "lower", slot: 3,
    books: NOTES.map((n) => ({
      title: n.title,
      author: `${n.date} · ${n.read}`,
      href: n.href,
      weight: (n.read.startsWith("1") ? 3 : 2) as 1 | 2 | 3,
    })),
  },
];

/** Every real book on the wall, in wall order — used for the keyboard path
 *  and for anything that needs to count them. */
export const ALL_BOOKS: Book[] = BAYS.flatMap((b) => b.books);
