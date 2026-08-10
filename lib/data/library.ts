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
   library full of dead links is worse than an empty one. All of them were
   walked on 2026-08-10; the one that had rotted (LinkedIn's "The Log") now
   points at its last capture, and is the only archive link on the wall.
   `dl.acm.org` answers a script with a 403 and a browser with the paper —
   that is their bot wall, not a dead link. */
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
      { title: "A Mathematical Theory of Communication", author: "Shannon, 1948", weight: 3,
        href: "https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf" },
      { title: "Programming as Theory Building", author: "Naur, 1985", weight: 1,
        href: "https://pages.cs.wisc.edu/~remzi/Naur.pdf" },
      { title: "The Rise of Worse Is Better", author: "Richard Gabriel, 1991", weight: 1,
        href: "https://www.dreamsongs.com/RiseOfWorseIsBetter.html" },
      { title: "Out of the Tar Pit", author: "Moseley & Marks, 2006", weight: 2,
        href: "https://curtclifton.net/papers/MoseleyMarks06a.pdf" },
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
      { title: "Impossibility of Distributed Consensus with One Faulty Process", author: "Fischer, Lynch & Paterson, 1985", weight: 1,
        href: "https://groups.csail.mit.edu/tds/papers/Lynch/jacm85.pdf" },
      { title: "The Google File System", author: "Ghemawat, Gobioff & Leung, 2003", weight: 2,
        href: "https://static.googleusercontent.com/media/research.google.com/en//archive/gfs-sosp2003.pdf" },
      { title: "Spanner: Google’s Globally-Distributed Database", author: "Corbett et al., 2012", weight: 2,
        href: "https://research.google/pubs/spanner-googles-globally-distributed-database-2/" },
      { title: "How to Do Distributed Locking", author: "Martin Kleppmann, 2016", weight: 1,
        href: "https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html" },
      { title: "Jepsen: Analyses", author: "Kyle Kingsbury", weight: 3,
        href: "https://jepsen.io/analyses" },
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
      { title: "Efficiently Computing Static Single Assignment Form", author: "Cytron et al., 1991", weight: 1,
        href: "https://dl.acm.org/doi/10.1145/115372.115320" },
      { title: "SSA-based Compiler Design", author: "Rastello & Bouchez Tichadou", weight: 3,
        href: "https://pfalcon.github.io/ssabook/latest/book-full.pdf" },
      { title: "Regular Expression Matching Can Be Simple And Fast", author: "Russ Cox, 2007", weight: 1,
        href: "https://swtch.com/~rsc/regexp/regexp1.html" },
      { title: "Pratt Parsers: Expression Parsing Made Easy", author: "Bob Nystrom, 2011", weight: 1,
        href: "https://journal.stuffwithstuff.com/2011/03/19/pratt-parsers-expression-parsing-made-easy/" },
      { title: "Let’s Build a Compiler", author: "Jack Crenshaw, 1988", weight: 2,
        href: "https://compilers.iecc.com/crenshaw/" },
      { title: "The Compiler Writer Resource Page", author: "Quentin Carbonneaux", weight: 1,
        href: "https://c9x.me/compile/bib/" },
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
      { title: "Hints for Computer System Design", author: "Butler Lampson, 1983", weight: 1,
        href: "https://www.microsoft.com/en-us/research/publication/hints-for-computer-system-design/" },
      { title: "Big Ball of Mud", author: "Foote & Yoder, 1997", weight: 2,
        href: "http://www.laputan.org/mud/" },
      { title: "A Plea for Lean Software", author: "Niklaus Wirth, 1995", weight: 1,
        href: "https://cr.yp.to/bib/1995/wirth.pdf" },
      { title: "The Cathedral and the Bazaar", author: "Eric S. Raymond, 1997", weight: 3,
        href: "http://www.catb.org/~esr/writings/cathedral-bazaar/" },
      { title: "Simple Made Easy", author: "Rich Hickey, 2011", weight: 2,
        href: "https://www.infoq.com/presentations/Simple-Made-Easy/" },
    ],
  },
  {
    label: "SYSTEMS", floor: "lower", slot: 0,
    books: [
      { title: "What Every Programmer Should Know About Memory", author: "Ulrich Drepper, 2007", weight: 3,
        href: "https://lwn.net/Articles/250967/" },
      /* LinkedIn took the original down some time after this list was written;
         this is the last capture of it. An archive link is not a nice thing to
         have on a shelf, but it beats the 404 that was here. */
      { title: "The Log: What Every Software Engineer Should Know", author: "Jay Kreps, 2013", weight: 2,
        href: "https://web.archive.org/web/20240105095933/https://engineering.linkedin.com/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying" },
      { title: "Systems Design Explains the World", author: "apenwarr, 2020", weight: 1,
        href: "https://apenwarr.ca/log/20201227" },
      { title: "Operating Systems: Three Easy Pieces", author: "Arpaci-Dusseau", weight: 3,
        href: "https://pages.cs.wisc.edu/~remzi/OSTEP/" },
      { title: "What Every Computer Scientist Should Know About Floating-Point", author: "David Goldberg, 1991", weight: 2,
        href: "https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html" },
      { title: "A Guide to Undefined Behavior in C and C++", author: "John Regehr, 2010", weight: 1,
        href: "https://blog.regehr.org/archives/213" },
      { title: "The Byte Order Fallacy", author: "Rob Pike, 2012", weight: 1,
        href: "https://commandcenter.blogspot.com/2012/04/byte-order-fallacy.html" },
      { title: "Files Are Fraught With Peril", author: "Dan Luu, 2019", weight: 1,
        href: "https://danluu.com/deconstruct-files/" },
      { title: "The Night Watch", author: "James Mickens, 2013", weight: 1,
        href: "https://www.usenix.org/system/files/1311_05-08_mickens.pdf" },
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
      { title: "Linux perf Examples", author: "Brendan Gregg", weight: 2,
        href: "https://www.brendangregg.com/perf.html" },
      { title: "Gallery of Processor Cache Effects", author: "Igor Ostrovsky, 2010", weight: 1,
        href: "http://igoro.com/archive/gallery-of-processor-cache-effects/" },
      { title: "The LMAX Disruptor", author: "Thompson et al., 2011", weight: 1,
        href: "https://lmax-exchange.github.io/disruptor/disruptor.html" },
      { title: "Producing Wrong Data Without Doing Anything Obviously Wrong", author: "Mytkowicz et al., 2009", weight: 1,
        href: "https://dl.acm.org/doi/10.1145/1508284.1508275" },
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
      { title: "Parse, Don’t Validate", author: "Alexis King, 2019", weight: 1,
        href: "https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/" },
      { title: "The Wrong Abstraction", author: "Sandi Metz, 2016", weight: 1,
        href: "https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction" },
      { title: "Write Code That Is Easy to Delete", author: "tef, 2016", weight: 1,
        href: "https://programmingisterrible.com/post/139222674273/write-code-that-is-easy-to-delete-not-easy-to" },
      { title: "The Law of Leaky Abstractions", author: "Joel Spolsky, 2002", weight: 1,
        href: "https://www.joelonsoftware.com/2002/11/11/the-law-of-leaky-abstractions/" },
      { title: "Falsehoods Programmers Believe About Names", author: "Patrick McKenzie, 2010", weight: 1,
        href: "https://www.kalzumeus.com/2010/06/17/falsehoods-programmers-believe-about-names/" },
      { title: "Programming Sucks", author: "Peter Welch, 2014", weight: 2,
        href: "https://www.stilldrinking.org/programming-sucks" },
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
