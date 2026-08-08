"use client";
import { useMemo, useRef, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useState } from "react";
import * as THREE from "three";
import { PROJECTS } from "@/lib/data/projects";
import { showcase } from "@/lib/scrollStore";
import { scrollToTarget } from "@/lib/lenis";
import { decay, lerpFactor, smoothstep } from "@/lib/motion";
import { isMuted, tick, unlock } from "@/lib/audio";
import RainPattern from "@/components/ui/RainPattern";

/* ════════════════════════════════════════════════════════════
   Two arrangements of the same five cards, blended by one number.

   `showcase.morph` 0→1 unrolls the ring into a flat row; the meshes never
   unmount, so this is a genuine move rather than one thing crossfading into
   another. `showcase.focus` then pans the row sideways, so each card enters
   from the right, takes the middle, and leaves to the left. Both come from
   `CinemaDeck`, which owns every long scroll timeline on the page.

   The pan is finite by construction. `walk` runs from half a slot before the
   first card to half a slot past the last, there is no wrap and nothing to
   loop back to — so the pin releases and the page carries on to the next
   scene. Attention is a pure function of distance from centre rather than a
   sequence, which is also what makes it safe to scrub: drag backwards and
   every card retakes exactly the state it held on the way down.

   Depth here is scale and opacity and nothing else, per the motion contract —
   a focused card is nearer and brighter, never sharper.
   ════════════════════════════════════════════════════════════ */

/** The card plane, and the camera that frames it. One source for both, since
 *  the row below is fitted to the frustum the two of them describe. */
const CARD = { w: 1.9, h: 2.38 };
const FOV = 42;
const CAM = { y: 0.4, zWide: 8.2, zNarrow: 9.4 };

/** The card holding the middle: how far forward it comes, and how dim the ones
 *  either side of it sit. */
const ATTEND = { z: 0.7, resting: 0.3 };

/** Size the row to the frame we actually have.
 *
 *  A row does not have to pack into the frame the way the earlier diagonal
 *  did — cards enter from one side and leave by the other, so only the card in
 *  the middle has to fit. That makes the constraint simple: it is the largest
 *  thing on screen, and because it also sits `ATTEND.z` nearer the camera,
 *  perspective magnifies it. Solve for that and the rest follows.
 *
 *  Height binds on a wide frame and width binds on a phone, so both are
 *  checked and the smaller wins. Spacing is then just under the centred card's
 *  own width, which leaves its neighbours clear of it at every viewport
 *  without ever being so far out that the row reads as separate objects. */
function fitRow(camZ: number, aspect: number) {
  const halfH = Math.tan(((FOV * Math.PI) / 180) / 2) * camZ;
  const halfW = halfH * aspect;
  const gain = camZ / (camZ - ATTEND.z);
  const SAFE = 0.94;
  const attend = Math.min(
    ((halfH - CAM.y) * 2 * SAFE) / (CARD.h * gain),   // camera sits above origin
    (halfW * 2 * 0.44) / (CARD.w * gain),
  );
  return { attend, scale: 0.66 * attend, dx: CARD.w * attend * 0.95 };
}

/* ---- card texture: same 2D painting as the legacy build ---- */
function roundRect(x: CanvasRenderingContext2D, a: number, b: number, w: number, h: number, r: number) {
  x.beginPath(); x.moveTo(a + r, b);
  x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r);
  x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath();
}
function cardTexture(p: (typeof PROJECTS)[number]) {
  const W = 512, H = 640;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d")!;
  x.fillStyle = "#142230"; roundRect(x, 6, 6, W - 12, H - 12, 26); x.fill();
  x.strokeStyle = p.card.hot ? "#5b93b3" : p.live ? "#86b0a6" : "#35526b";
  x.lineWidth = p.card.hot || p.live ? 4 : 3; roundRect(x, 6, 6, W - 12, H - 12, 26); x.stroke();
  x.font = "600 34px 'JetBrains Mono', monospace";
  x.fillStyle = p.live ? "#86b0a6" : "#5b93b3";
  x.fillText(p.card.pos, 44, 84);
  x.strokeStyle = "#22384a"; x.lineWidth = 2;
  x.beginPath(); x.moveTo(44, 112); x.lineTo(W - 44, 112); x.stroke();
  x.font = "700 56px 'Syne', sans-serif"; x.fillStyle = "#e8eef1";
  x.fillText(p.name, 44, 300);
  x.font = "400 28px 'Inter', sans-serif"; x.fillStyle = "#9fb3bd";
  x.fillText(p.card.s, 44, 348);
  x.font = "500 30px 'JetBrains Mono', monospace";
  x.fillStyle = p.live ? "#86b0a6" : "#8fbcd4";
  x.fillText(p.card.m, 44, H - 96);
  x.font = "400 22px 'JetBrains Mono', monospace"; x.fillStyle = "#7b94a1";
  x.fillText("open ↓", 44, H - 52);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

interface RingState { rot: number; vel: number; dragging: boolean; lastX: number; moved: number }

function Ring({ onPick, shared, onGrab }: {
  onPick: (id: string) => void;
  shared: React.MutableRefObject<RingState>;
  onGrab: (g: boolean) => void;
}) {
  const group = useRef<THREE.Group>(null!);
  const { size, camera } = useThree();
  const mobile = size.width < 760;
  const R = mobile ? 2.6 : 3.4;
  const camZ = mobile ? CAM.zNarrow : CAM.zWide;
  useEffect(() => {
    camera.position.z = camZ;                        // responsive framing, like the original
    camera.updateProjectionMatrix();
  }, [camZ, camera]);

  /* Re-solved on resize, so the run never has to survive a frame measured for
     a frustum it is no longer in. */
  const row = useMemo(
    () => fitRow(camZ, size.width / size.height),
    [camZ, size.width, size.height],
  );

  const state = shared;

  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(CARD.w, CARD.h, 12, 12);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      pos.setZ(i, -(vx * vx) * 0.12);          // subtle cylindrical bend
    }
    g.computeVertexNormals();
    return g;
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);

  /* The card faces are painted into a 2D canvas, and canvas takes no part in
     the font swap — whatever is loaded when `fillText` runs is baked in for
     good. Painting during the first render is a race with Syne and JetBrains
     Mono arriving, so paint once now and repaint when the faces are actually
     there. `AsciiGlitchName` waits on the same promise for the same reason. */
  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    let live = true;
    (document.fonts?.ready ?? Promise.resolve()).then(() => { if (live) setFontsReady(true); });
    return () => { live = false; };
  }, []);
  const textures = useMemo(() => PROJECTS.map(cardTexture), [fontsReady]);
  useEffect(() => () => textures.forEach((t) => t.dispose()), [textures]);

  /** Scroll progress, smoothed. The store is written raw from ScrollTrigger;
   *  easing it here is what keeps the unroll and the hand-offs from stepping
   *  on a coarse wheel, and it is the same lerp the ring's rotation already
   *  rode. Per second, never per frame. */
  const eased = useRef({ m: 0, f: 0 });
  /** Which card last held the middle, so an arrival ticks once. */
  const nearest = useRef<number | null>(null);

  useFrame((_, delta) => {
    /* Every rate here is per second: the ring used to spin ~2.4× faster on
       a 144Hz display than on a 60Hz one, and lurched on any dropped frame. */
    const dt = Math.min(delta, 0.05);
    const s = state.current;
    if (!s.dragging) {
      s.rot += (s.vel * 60 + 0.132) * dt;
      s.vel *= decay(0.225, dt);
    }

    const k = lerpFactor(0.12, dt);
    const e = eased.current;
    e.m += (showcase.morph - e.m) * k;
    e.f += (showcase.focus - e.f) * k;
    const m = e.m;

    const g = group.current;
    /* The spin decays to nothing as the row takes over — an arrangement meant
       to be read head-on should not also be turning. Drag still moves
       `s.rot`, it simply stops reaching the group once the row has formed. */
    g.rotation.y += ((s.rot + showcase.scrollRot) * (1 - m) - g.rotation.y) * k;

    const n = g.children.length;
    /* Half a slot of run-in and run-out, so the pan opens and closes on an
       empty frame rather than with a card already parked in the middle. */
    const walk = -0.5 + e.f * n;

    g.children.forEach((c, i) => {
      const th = (i / n) * Math.PI * 2;

      /* ── the ring ──
         `facing` is +1 for the card nearest the camera. Solved rather than
         read off a world matrix: the matrices are a frame stale at this point
         in the loop, and a card's world z on a group turned by `ry` is just
         R·sin(θ − ry). */
      const ringX = Math.cos(th) * R, ringZ = Math.sin(th) * R;
      const facing = Math.max(0, Math.sin(th - g.rotation.y));
      const ringScale = 1 + facing * 0.08;
      const ringOp = 0.45 + facing * 0.55;
      const ringRotY = Math.PI / 2 - th;

      /* ── the row ──
         A single line of cards that the scroll pans sideways: card `i` sits
         `(i - walk)` slots from centre, so each one enters from the right,
         passes through the middle and leaves to the left. Attention is a pure
         function of distance from centre, which is what makes it safe to
         scrub — drag it backwards and every card retakes exactly the state it
         had on the way down, with no sequence to unwind.

         `walk` runs from just before the first card to just past the last, so
         the pan starts and finishes empty and the pin can release. Finite by
         construction: there is no wrap, and nothing to loop back to. */
      const slot = i - walk;
      const away = Math.min(1, Math.abs(slot));
      const near = smoothstep(1 - away);            // 1 at centre, 0 a slot out

      const rowX = slot * row.dx;
      const rowY = 0;
      const rowZ = ATTEND.z * near;
      const rowScale = row.scale + (row.attend - row.scale) * near;
      /* Cards off centre turn away from the viewer. Depth is still scale and
         opacity; this is orientation, and it is what stops a row of flat
         planes reading as a contact sheet. */
      const rowRotY = -Math.sign(slot) * 0.34 * (1 - near);
      const rowOp = ATTEND.resting + (1 - ATTEND.resting) * near;

      /* ── blend ── */
      c.position.set(
        ringX + (rowX - ringX) * m,
        rowY * m,
        ringZ + (rowZ - ringZ) * m,
      );
      c.rotation.y = ringRotY + (rowRotY - ringRotY) * m;
      c.scale.setScalar(ringScale + (rowScale - ringScale) * m);
      const mat = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
      mat.opacity = ringOp + (rowOp - ringOp) * m;
    });

    /* ── one tick per arrival ──
       `Math.round(walk)` is the index of whichever card is nearest centre, so
       it changes exactly when a new one takes the middle — once per arrival,
       in either scroll direction, and never mid-slot. Gated on the row having
       actually formed, so the unroll is silent. */
    if (m > 0.5) {
      const at = Math.round(walk);
      const was = nearest.current;
      if (was !== null && at !== was && at >= 0 && at < n) {
        /* A step up the ladder per card, so the run reads as a sequence
           rather than the same blip five times. */
        tick({ freq: 300 * Math.pow(1.1892, at), gain: 0.05 });
      }
      nearest.current = at;
    } else {
      nearest.current = null;
    }
  });

  const onDown = useCallback((e: React.PointerEvent) => {
    const s = state.current;
    s.dragging = true; s.lastX = e.clientX; s.moved = 0;
    onGrab(true);
    (e.target as Element).setPointerCapture(e.pointerId);
  }, [onGrab, state]);
  const onMove = useCallback((e: React.PointerEvent) => {
    const s = state.current;
    if (!s.dragging) return;
    const dx = e.clientX - s.lastX; s.lastX = e.clientX;
    s.moved += Math.abs(dx);
    s.vel = dx * 0.0045;
    s.rot += s.vel;
  }, [state]);
  const onUp = useCallback(() => { state.current.dragging = false; onGrab(false); }, [onGrab, state]);

  return (
    <group
      ref={group}
      rotation-x={-0.1}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {PROJECTS.map((p, i) => {
        const th = (i / PROJECTS.length) * Math.PI * 2;
        return (
          <mesh
            key={p.id}
            geometry={geo}
            position={[Math.cos(th) * R, 0, Math.sin(th) * R]}
            /* A Y-rotation α turns the plane's front normal (+Z) to
               (sin α, 0, cos α); outward at this seat is (cos θ, 0, sin θ),
               so α = π/2 − θ. Negating it points every card at the middle of
               the ring and DoubleSide quietly serves you the mirrored back. */
            rotation={[0, Math.PI / 2 - th, 0]}
            onClick={(e) => {
              e.stopPropagation();
              if (state.current.moved < 6) onPick(p.id);
            }}
          >
            {/* keyed on the repaint so the material is rebuilt with the new
                map rather than relying on an in-place texture swap */}
            <meshBasicMaterial key={String(fontsReady)} map={textures[i]} transparent side={THREE.DoubleSide} />
          </mesh>
        );
      })}
    </group>
  );
}

export default function Showcase() {
  const pick = useCallback((id: string) => {
    const goto = (window as unknown as { gotoDish?: (sel: string) => void }).gotoDish;
    if (goto) goto(`#${id}`);
    else scrollToTarget(`#${id}`, { block: "center" });
  }, []);
  const shared = useRef<RingState>({ rot: 0, vel: 0, dragging: false, lastX: 0, moved: 0 });
  const stageRef = useRef<HTMLDivElement>(null);
  const [grabbing, setGrabbing] = useState(false);
  const [live, setLive] = useState(true);

  /* horizontal wheel spins the ring; offscreen pauses the frameloop */
  useEffect(() => {
    const el = stageRef.current!;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        shared.current.vel += e.deltaX * 0.0006;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    const io = new IntersectionObserver((es) => {
      setLive(es[0].isIntersecting);
      /* Ask for the context as the scene approaches rather than on the first
         tick: `unlock` may have to wait for a gesture, and it should already
         be waiting by the time a card reaches the middle. */
      if (es[0].isIntersecting && !isMuted()) unlock();
    }, { threshold: 0 });
    io.observe(el);
    return () => { el.removeEventListener("wheel", onWheel); io.disconnect(); };
  }, []);

  return (
    <section className="showcase" id="showcase">
      <div className="sc-head"><div className="wrap">
        <span className="section-num">scroll to pan · click a card</span>
      </div></div>
      <div className="stage" ref={stageRef}>
        {/* First in the stage, so it lands under `.core` — both sit at z-index
            0 and DOM order is what separates them. */}
        <RainPattern />
        <div className="core" aria-hidden>
          <div>
            <div className="big">WORK</div>
            <div className="small">05 entries · season 2026</div>
          </div>
        </div>
        <Canvas
          aria-label="3D project carousel"
          style={{ position: "absolute", inset: 0, cursor: grabbing ? "grabbing" : "grab", touchAction: "pan-y" }}
          camera={{ fov: FOV, near: 0.1, far: 50, position: [0, CAM.y, CAM.zWide] }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
          frameloop={live ? "always" : "never"}
        >
          <Ring onPick={pick} shared={shared} onGrab={setGrabbing} />
        </Canvas>
        <div className="hint">
          <span className="annot">
            <span className="hand" style={{ fontSize: "1.5rem" }}>keep scrolling</span>
            <svg viewBox="0 0 52 30" aria-hidden><path className="scrib live drawable" d="M4,24 C18,26 34,20 44,8 M36,8 L45,7 L44,16" strokeWidth={2} /></svg>
          </span>
        </div>
      </div>
    </section>
  );
}
