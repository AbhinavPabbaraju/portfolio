"use client";
import { useEffect, useRef, useState } from "react";
import { adoptMuted, audio, isMuted, onMuteChange, resolveMuted, setMuted as setSiteMuted, unlock } from "@/lib/audio";

/* ════════════════════════════════════════════════════════════
   The street has a sound.

   Synthesised rather than streamed. A convincing drizzle is shaped
   noise, and shaping it here costs a few hundred bytes and loops
   forever with no seam, where a recording good enough not to tile
   audibly is a multi-hundred-KB asset on the critical path of a page
   whose whole point is that it scrolls smoothly.
   ════════════════════════════════════════════════════════════ */

/** Peak master gain. This is scenery, not a soundtrack — at 0.055 it sits
 *  under speech and under a video playing in another tab. */
const LEVEL = 0.055;

/** Seconds of fade whenever the bed arrives or leaves. Long, because rain
 *  that switches on is a click, and rain that swells in is weather. */
const FADE = 0.9;

interface Bed {
  ctx: AudioContext;
  master: GainNode;
  source: AudioBufferSourceNode;
  lfo: OscillatorNode;
}

export default function RainAudio() {
  const host = useRef<HTMLDivElement>(null);
  const bed = useRef<Bed | null>(null);
  const onScreen = useRef(false);
  const mutedRef = useRef(false);
  const sync = useRef<() => void>(() => {});

  /* Default on, and the same value on the server, so first paint agrees with
     itself. The stored preference and the reduced-motion read both land in an
     effect below and may flip it a tick later. */
  const [muted, setMuted] = useState(false);
  /* Whether sound is actually coming out — not what we asked for. Autoplay
     policy can hold the context suspended until the reader touches the page,
     and the meter should tell the truth about that rather than claim to be
     playing into silence. */
  const [live, setLive] = useState(false);

  /* ---- the graph, built once and only when the scene first comes up ---- */
  useEffect(() => {
    let dead = false;
    let disarm: (() => void) | null = null;
    let park = 0;

    const build = (): Bed | null => {
      if (bed.current) return bed.current;
      /* The page's one context, shared with the carousel's ticks so autoplay
         policy is unlocked once rather than per component. */
      const shared = audio();
      if (!shared) return null;
      const { ctx, bus } = shared;

      /* Four seconds of decorrelated stereo noise. Both channels independent,
         which is what gives the bed width instead of a point source in the
         middle of your head. Shorter than four and the loop point becomes a
         tick you can hear once you know to listen for it. */
      const buf = ctx.createBuffer(2, ctx.sampleRate * 4, ctx.sampleRate);
      for (let c = 0; c < buf.numberOfChannels; c++) {
        const d = buf.getChannelData(c);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      const source = ctx.createBufferSource();
      source.buffer = buf;
      source.loop = true;

      /* Raw noise is static. Rain is what's left after you take the rumble off
         the bottom, the fizz off the top, and scoop out the boxy middle. */
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass"; hp.frequency.value = 240; hp.Q.value = 0.5;
      const scoop = ctx.createBiquadFilter();
      scoop.type = "peaking"; scoop.frequency.value = 1100; scoop.Q.value = 0.8; scoop.gain.value = -5;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass"; lp.frequency.value = 3200; lp.Q.value = 0.6;

      /* A slow swell over the top. Rain that holds one exact level is the tell
         that gives away a loop; this wanders across ~17 seconds. */
      const swell = ctx.createGain();
      swell.gain.value = 0.8;
      const lfo = ctx.createOscillator();
      lfo.type = "sine"; lfo.frequency.value = 0.06;
      const depth = ctx.createGain();
      depth.gain.value = 0.2;
      lfo.connect(depth);
      depth.connect(swell.gain);

      const master = ctx.createGain();
      master.gain.value = 0;

      source.connect(hp).connect(scoop).connect(lp).connect(swell).connect(master);
      /* Into the shared bus, not the destination — that bus is what the mute
         rides, so one control silences the bed and the ticks together. */
      master.connect(bus);
      source.start();
      lfo.start();

      bed.current = { ctx, master, source, lfo };
      return bed.current;
    };

    /* Autoplay policy will not let us open a context before the reader has
       interacted with the page. Rather than lie about it, wait for the first
       gesture anywhere and try again then. */
    const arm = () => {
      if (disarm) return;
      const go = () => { disarm?.(); disarm = null; run(); };
      document.addEventListener("pointerdown", go);
      document.addEventListener("keydown", go);
      disarm = () => {
        document.removeEventListener("pointerdown", go);
        document.removeEventListener("keydown", go);
      };
    };

    const run = async () => {
      const want = onScreen.current && !mutedRef.current;

      if (!want) {
        const b = bed.current;
        setLive(false);
        if (!b) return;
        b.master.gain.cancelScheduledValues(b.ctx.currentTime);
        b.master.gain.setTargetAtTime(0, b.ctx.currentTime, FADE / 3);
        /* Suspend once the fade has actually finished, so an offscreen scene
           costs nothing — the same reason the canvases take their frameloop
           from an observer. Re-check on the way in: the reader may have
           scrolled back before the timer landed. */
        window.clearTimeout(park);
        park = window.setTimeout(() => {
          const now = bed.current;
          if (now && !(onScreen.current && !mutedRef.current)) void now.ctx.suspend();
        }, FADE * 1000);
        return;
      }

      window.clearTimeout(park);
      const b = build();
      if (!b) return;
      try { await b.ctx.resume(); } catch { /* handled by the state check below */ }
      if (dead) return;
      if (b.ctx.state !== "running") { arm(); setLive(false); return; }
      b.master.gain.cancelScheduledValues(b.ctx.currentTime);
      b.master.gain.setTargetAtTime(LEVEL, b.ctx.currentTime, FADE / 3);
      setLive(true);
    };

    sync.current = () => { void run(); };

    const io = new IntersectionObserver(
      ([e]) => { onScreen.current = e.isIntersecting; void run(); },
      { threshold: 0 },
    );
    if (host.current) io.observe(host.current);

    return () => {
      dead = true;
      io.disconnect();
      disarm?.();
      window.clearTimeout(park);
      const b = bed.current;
      if (b) {
        try { b.source.stop(); b.lfo.stop(); } catch { /* already stopped */ }
        b.master.disconnect();
        void b.ctx.close();
        bed.current = null;
      }
    };
  }, []);

  /* ---- adopt the site-wide preference, and follow it if it changes ---- */
  useEffect(() => {
    const resolved = resolveMuted();
    adoptMuted(resolved);
    setMuted(resolved);
    return onMuteChange(() => setMuted(isMuted()));
  }, []);

  /* ---- intent reaches the graph ---- */
  useEffect(() => {
    mutedRef.current = muted;
    sync.current();
  }, [muted]);

  return (
    <div className="rain-audio" ref={host}>
      <span className="rain-label" aria-hidden>sound</span>
      {/* The switch is Richard Tsang's "dry-rabbit-69" (uiverse.io, MIT) —
          geometry and the 3D panel flip kept 1:1, colours moved onto our
          tokens and the class names namespaced. A checkbox rather than the
          button this used to be: it is a binary setting, so `checked` carries
          the state natively and the panels can go `aria-hidden`. Their
          "off"/"on" text would otherwise become the label's accessible name,
          which reads as "off on" whichever way the switch is thrown. */}
      <label className={`rain-switch${live ? " is-live" : ""}`}>
        <input
          className="rs-cb"
          type="checkbox"
          aria-label="Sound"
          checked={!muted}
          onChange={() => {
            const next = !muted;
            setSiteMuted(next);                       // persists, and fades the shared bus
            setMuted(next);
            if (!next) unlock();                      // a gesture is in hand: use it
          }}
        />
        <span className="rs-box" aria-hidden>
          <span className="rs-off">off</span>
          <span className="rs-on">on</span>
        </span>
      </label>
    </div>
  );
}
