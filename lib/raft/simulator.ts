/* ════════════════════════════════════════════════════════════
   A teaching model of Raft — not an implementation of it.

   Phalanx runs the real thing in Go. This is a small deterministic
   state machine that mimics its behaviour closely enough to watch:
   randomized election timeouts, RequestVote and AppendEntries as
   messages with travel time, majority elections, log replication,
   commit on majority. Same shape, none of the hard parts.

   What it deliberately leaves out — each one is a place where the
   real system does substantially more work:

   - No log compaction and no snapshotting. The log only grows, so
     the client stops issuing commands at MAX_LOG. Real Raft snapshots
     the state machine and truncates behind it.
   - No persistence. A node that dies and comes back keeps its term,
     vote and log because they live in the same object. Real Raft
     fsyncs those three before replying to anything, and rebuilds
     commitIndex from the leader — here we keep it across a restart.
   - The network never loses, duplicates or reorders a message, and
     never partitions. The only failure modelled is a dead node, which
     drops what is addressed to it.
   - Entries per AppendEntries are capped for legibility, not by size.
   - No client session tracking, no read leases, no membership change,
     no pre-vote.

   Nothing here touches React or the DOM. It advances only when
   something calls `step()`; there is no wall clock inside this file.
   ════════════════════════════════════════════════════════════ */

/** One logical step. The UI decides how much real time that is. */
export const TICK_MS = 100;

/** Ticks. Election timeouts are drawn from this range per node, per
 *  term — the spread is the whole reason split votes resolve. */
const ELECTION_MIN = 10;
const ELECTION_MAX = 20;
/** Ticks between heartbeats. Comfortably inside ELECTION_MIN. */
const HEARTBEAT = 4;
/** Ticks a message spends in flight. */
const DELAY_MIN = 1;
const DELAY_MAX = 3;
/** Ticks between client writes, once there is a leader to take them. */
const CLIENT_EVERY = 14;
/** Entries carried by a single AppendEntries — a legibility cap. */
const MAX_ENTRIES_PER_MSG = 4;
/** Where the client stops ordering. Real Raft would snapshot here. */
export const MAX_LOG = 48;

export type Role = "follower" | "candidate" | "leader";

export type MessageKind = "vote-req" | "vote-res" | "append" | "append-res";

export interface LogEntry {
  /** The term the entry was created in — this is what makes a log
   *  position comparable between two nodes. */
  term: number;
  command: string;
}

export interface RaftNode {
  id: number;
  role: Role;
  currentTerm: number;
  votedFor: number | null;
  /** 1-based in Raft's language: entry `i` is `log[i - 1]`. */
  log: LogEntry[];
  /** Highest index known committed. 0 means nothing is. */
  commitIndex: number;
  alive: boolean;
  /** Ticks without hearing from a leader before standing for election. */
  electionTimeout: number;
  electionElapsed: number;
  heartbeatElapsed: number;
  /** Who has voted for this node in the current term (leaders only care). */
  votes: number[];
  /** Leader bookkeeping, indexed by node id. */
  nextIndex: number[];
  matchIndex: number[];
}

export interface Message {
  id: number;
  kind: MessageKind;
  from: number;
  to: number;
  term: number;
  /** Both in ticks, so travel can be drawn as a fraction of the trip. */
  sentAt: number;
  arrivesAt: number;
  /** vote-res */
  granted?: boolean;
  /** vote-req */
  lastLogIndex?: number;
  lastLogTerm?: number;
  /** append */
  prevLogIndex?: number;
  prevLogTerm?: number;
  entries?: LogEntry[];
  leaderCommit?: number;
  /** append-res */
  success?: boolean;
  matchIndex?: number;
}

export type RaftEvent =
  | { kind: "candidate"; nodeId: number; term: number }
  | { kind: "leader"; nodeId: number; term: number }
  | { kind: "commit"; index: number; command: string }
  | { kind: "down"; nodeId: number }
  | { kind: "up"; nodeId: number };

export interface Snapshot {
  tick: number;
  nodes: RaftNode[];
  messages: Message[];
  leaderId: number | null;
  /** True once the client has nowhere left to write. */
  logFull: boolean;
}

export interface ClusterOptions {
  size?: number;
  seed?: number;
}

/** mulberry32 — small, fast, and good enough that a seed reproduces a
 *  run exactly. Every random choice in the simulation draws from this
 *  one stream, so the same seed and the same sequence of kill/revive
 *  clicks always replay identically. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Diner-flavoured keys, so the log reads like an order pad. */
const KEYS = ["broth", "tare", "noodle", "chashu", "egg", "nori", "menma", "scallion"];

export class RaftCluster {
  readonly size: number;
  readonly seed: number;
  tick = 0;
  nodes: RaftNode[] = [];
  messages: Message[] = [];

  private rand: () => number;
  private nextMessageId = 1;
  private clientElapsed = 0;
  private orderNo = 0;
  private pending: RaftEvent[] = [];

  constructor(options: ClusterOptions = {}) {
    this.size = options.size ?? 5;
    this.seed = options.seed ?? 20260804;
    this.rand = mulberry32(this.seed);
    this.reset();
  }

  /** Back to term 0, empty logs, everyone alive, same seed. */
  reset(): void {
    this.rand = mulberry32(this.seed);
    this.tick = 0;
    this.messages = [];
    this.nextMessageId = 1;
    this.clientElapsed = 0;
    this.orderNo = 0;
    this.pending = [];
    this.nodes = Array.from({ length: this.size }, (_, id) => ({
      id,
      role: "follower" as Role,
      currentTerm: 0,
      votedFor: null,
      log: [],
      commitIndex: 0,
      alive: true,
      electionTimeout: this.randomTimeout(),
      electionElapsed: 0,
      heartbeatElapsed: 0,
      votes: [],
      nextIndex: new Array(this.size).fill(1),
      matchIndex: new Array(this.size).fill(0),
    }));
  }

  /** Advance one logical tick. Returns what happened, for announcing. */
  step(): RaftEvent[] {
    this.tick++;
    this.pending = [];
    this.deliver();
    this.advanceTimers();
    this.acceptClientWrite();
    this.advanceCommit();
    const events = this.pending;
    this.pending = [];
    return events;
  }

  /** Pure read. Clones enough that React can compare renders. */
  snapshot(): Snapshot {
    const leader = this.nodes.find((n) => n.alive && n.role === "leader");
    return {
      tick: this.tick,
      nodes: this.nodes.map((n) => ({
        ...n,
        log: n.log.slice(),
        votes: n.votes.slice(),
        nextIndex: n.nextIndex.slice(),
        matchIndex: n.matchIndex.slice(),
      })),
      messages: this.messages.slice(),
      leaderId: leader ? leader.id : null,
      logFull: this.logLength() >= MAX_LOG,
    };
  }

  /** Kill a live node, revive a dead one. The visitor's only input. */
  toggleNode(id: number): RaftEvent[] {
    const n = this.nodes[id];
    if (!n) return [];
    this.pending = [];
    if (n.alive) {
      n.alive = false;
      /* Term, vote and log survive the crash — they are the three things
         real Raft writes to disk. Everything volatile stops here. */
      n.role = "follower";
      n.votes = [];
      n.electionElapsed = 0;
      n.heartbeatElapsed = 0;
      this.pending.push({ kind: "down", nodeId: id });
    } else {
      n.alive = true;
      n.role = "follower";
      n.votes = [];
      n.electionElapsed = 0;
      n.electionTimeout = this.randomTimeout();
      this.pending.push({ kind: "up", nodeId: id });
    }
    const events = this.pending;
    this.pending = [];
    return events;
  }

  // ── internals ──────────────────────────────────────────────

  private get majority(): number {
    return Math.floor(this.size / 2) + 1;
  }

  private randomTimeout(): number {
    return ELECTION_MIN + Math.floor(this.rand() * (ELECTION_MAX - ELECTION_MIN + 1));
  }

  private logLength(): number {
    return this.nodes.reduce((max, n) => Math.max(max, n.log.length), 0);
  }

  private send(m: Omit<Message, "id" | "sentAt" | "arrivesAt">): void {
    const delay = DELAY_MIN + Math.floor(this.rand() * (DELAY_MAX - DELAY_MIN + 1));
    this.messages.push({
      ...m,
      id: this.nextMessageId++,
      sentAt: this.tick,
      arrivesAt: this.tick + delay,
    });
  }

  private deliver(): void {
    if (!this.messages.length) return;
    const inFlight: Message[] = [];
    for (const m of this.messages) {
      if (m.arrivesAt > this.tick) {
        inFlight.push(m);
        continue;
      }
      /* A dead node's inbox is the floor. Messages already in flight
         *from* a node that has since died still arrive — the network
         had them before the crash. */
      const to = this.nodes[m.to];
      if (!to.alive) continue;
      switch (m.kind) {
        case "vote-req": this.onVoteRequest(to, m); break;
        case "vote-res": this.onVoteResponse(to, m); break;
        case "append": this.onAppend(to, m); break;
        case "append-res": this.onAppendResponse(to, m); break;
      }
    }
    this.messages = inFlight;
  }

  private advanceTimers(): void {
    for (const n of this.nodes) {
      if (!n.alive) continue;
      if (n.role === "leader") {
        n.heartbeatElapsed++;
        if (n.heartbeatElapsed >= HEARTBEAT) {
          n.heartbeatElapsed = 0;
          this.broadcastAppend(n);
        }
      } else {
        n.electionElapsed++;
        if (n.electionElapsed >= n.electionTimeout) this.startElection(n);
      }
    }
  }

  /** The counter takes an order. Only a leader can accept one. */
  private acceptClientWrite(): void {
    const leader = this.nodes.find((n) => n.alive && n.role === "leader");
    if (!leader) return;
    if (leader.log.length >= MAX_LOG) return;
    this.clientElapsed++;
    if (this.clientElapsed < CLIENT_EVERY) return;
    this.clientElapsed = 0;
    const key = KEYS[this.orderNo % KEYS.length];
    this.orderNo++;
    leader.log.push({ term: leader.currentTerm, command: `set ${key}=${this.orderNo}` });
    leader.matchIndex[leader.id] = leader.log.length;
    /* Push it out now rather than waiting for the next heartbeat —
       replication should look like a response to the write. */
    this.broadcastAppend(leader);
    leader.heartbeatElapsed = 0;
  }

  /** §5.3/§5.4.2: an entry commits once a majority stores it, and only
   *  if it was created in the leader's own term. Counting entries from
   *  an earlier term is the bug Figure 8 exists to warn about. */
  private advanceCommit(): void {
    for (const leader of this.nodes) {
      if (!leader.alive || leader.role !== "leader") continue;
      leader.matchIndex[leader.id] = leader.log.length;
      for (let i = leader.log.length; i > leader.commitIndex; i--) {
        if (leader.log[i - 1].term !== leader.currentTerm) break;
        const stored = leader.matchIndex.filter((mi) => mi >= i).length;
        if (stored < this.majority) continue;
        for (let j = leader.commitIndex + 1; j <= i; j++) {
          this.pending.push({ kind: "commit", index: j, command: leader.log[j - 1].command });
        }
        leader.commitIndex = i;
        break;
      }
    }
  }

  private startElection(n: RaftNode): void {
    n.role = "candidate";
    n.currentTerm++;
    n.votedFor = n.id;
    n.votes = [n.id];
    n.electionElapsed = 0;
    n.electionTimeout = this.randomTimeout();
    this.pending.push({ kind: "candidate", nodeId: n.id, term: n.currentTerm });
    if (n.votes.length >= this.majority) {
      this.becomeLeader(n);
      return;
    }
    const lastLogIndex = n.log.length;
    const lastLogTerm = lastLogIndex ? n.log[lastLogIndex - 1].term : 0;
    for (const peer of this.nodes) {
      if (peer.id === n.id) continue;
      this.send({ kind: "vote-req", from: n.id, to: peer.id, term: n.currentTerm, lastLogIndex, lastLogTerm });
    }
  }

  private becomeLeader(n: RaftNode): void {
    n.role = "leader";
    n.votes = [];
    n.heartbeatElapsed = 0;
    n.nextIndex = new Array(this.size).fill(n.log.length + 1);
    n.matchIndex = new Array(this.size).fill(0);
    n.matchIndex[n.id] = n.log.length;
    this.pending.push({ kind: "leader", nodeId: n.id, term: n.currentTerm });
    this.broadcastAppend(n);
  }

  /** Any message carrying a higher term makes you a follower of it,
   *  whatever you were doing. This is the rule that makes the whole
   *  protocol converge. */
  private stepDown(n: RaftNode, term: number): void {
    n.currentTerm = term;
    n.role = "follower";
    n.votedFor = null;
    n.votes = [];
    n.electionElapsed = 0;
    n.electionTimeout = this.randomTimeout();
  }

  private broadcastAppend(leader: RaftNode): void {
    for (const peer of this.nodes) {
      if (peer.id === leader.id) continue;
      this.sendAppend(leader, peer.id);
    }
  }

  private sendAppend(leader: RaftNode, to: number): void {
    const next = Math.max(1, leader.nextIndex[to]);
    const prevLogIndex = next - 1;
    const prevLogTerm = prevLogIndex > 0 ? leader.log[prevLogIndex - 1].term : 0;
    const entries = leader.log.slice(prevLogIndex, prevLogIndex + MAX_ENTRIES_PER_MSG);
    this.send({
      kind: "append",
      from: leader.id,
      to,
      term: leader.currentTerm,
      prevLogIndex,
      prevLogTerm,
      entries,
      leaderCommit: leader.commitIndex,
    });
  }

  private onVoteRequest(n: RaftNode, m: Message): void {
    if (m.term > n.currentTerm) this.stepDown(n, m.term);

    const lastIndex = n.log.length;
    const lastTerm = lastIndex ? n.log[lastIndex - 1].term : 0;
    /* §5.4.1 — never vote for a candidate whose log is behind yours,
       or a committed entry could be lost. */
    const upToDate =
      (m.lastLogTerm ?? 0) > lastTerm ||
      ((m.lastLogTerm ?? 0) === lastTerm && (m.lastLogIndex ?? 0) >= lastIndex);

    const granted =
      m.term === n.currentTerm &&
      (n.votedFor === null || n.votedFor === m.from) &&
      upToDate;

    if (granted) {
      n.votedFor = m.from;
      n.electionElapsed = 0;
    }
    this.send({ kind: "vote-res", from: n.id, to: m.from, term: n.currentTerm, granted });
  }

  private onVoteResponse(n: RaftNode, m: Message): void {
    if (m.term > n.currentTerm) { this.stepDown(n, m.term); return; }
    if (n.role !== "candidate" || m.term !== n.currentTerm) return;
    if (!m.granted || n.votes.includes(m.from)) return;
    n.votes.push(m.from);
    if (n.votes.length >= this.majority) this.becomeLeader(n);
  }

  private onAppend(n: RaftNode, m: Message): void {
    if (m.term < n.currentTerm) {
      this.send({ kind: "append-res", from: n.id, to: m.from, term: n.currentTerm, success: false, matchIndex: 0 });
      return;
    }
    if (m.term > n.currentTerm) this.stepDown(n, m.term);
    /* A current-term leader exists, so stand down and stop counting. */
    n.role = "follower";
    n.electionElapsed = 0;

    const prevLogIndex = m.prevLogIndex ?? 0;
    const entries = m.entries ?? [];
    const consistent =
      prevLogIndex <= n.log.length &&
      (prevLogIndex === 0 || n.log[prevLogIndex - 1].term === (m.prevLogTerm ?? 0));

    if (!consistent) {
      /* The leader will walk nextIndex back a step and try again. */
      this.send({ kind: "append-res", from: n.id, to: m.from, term: n.currentTerm, success: false, matchIndex: 0 });
      return;
    }

    for (let i = 0; i < entries.length; i++) {
      const index = prevLogIndex + i + 1;
      if (n.log.length >= index) {
        if (n.log[index - 1].term === entries[i].term) continue;
        /* Conflicting entry: everything from here on is wrong. */
        n.log.length = index - 1;
      }
      n.log.push(entries[i]);
    }

    const matchIndex = prevLogIndex + entries.length;
    if ((m.leaderCommit ?? 0) > n.commitIndex) {
      n.commitIndex = Math.min(m.leaderCommit ?? 0, n.log.length);
    }
    this.send({ kind: "append-res", from: n.id, to: m.from, term: n.currentTerm, success: true, matchIndex });
  }

  private onAppendResponse(n: RaftNode, m: Message): void {
    if (m.term > n.currentTerm) { this.stepDown(n, m.term); return; }
    if (n.role !== "leader" || m.term !== n.currentTerm) return;

    if (m.success) {
      const match = m.matchIndex ?? 0;
      n.matchIndex[m.from] = Math.max(n.matchIndex[m.from], match);
      n.nextIndex[m.from] = n.matchIndex[m.from] + 1;
      /* Still behind? Keep feeding it rather than waiting a heartbeat. */
      if (n.nextIndex[m.from] <= n.log.length) this.sendAppend(n, m.from);
    } else {
      n.nextIndex[m.from] = Math.max(1, n.nextIndex[m.from] - 1);
      this.sendAppend(n, m.from);
    }
  }
}
