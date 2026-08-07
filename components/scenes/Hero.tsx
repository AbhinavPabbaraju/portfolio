"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import * as THREE from "three";
import AsciiGlitchName from "@/components/ui/AsciiGlitchName";
import { DUR, EASE, prefersReducedMotion } from "@/lib/motion";

/* ---- volumetric fresnel field (R3F port of the legacy hero) ---- */
const FRESNEL = {
  vertex: `varying vec3 vN; varying vec3 vV;
    void main(){ vN = normalize(normalMatrix * normal);
      vec4 mv = modelViewMatrix * vec4(position,1.0);
      vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
  fragment: `uniform vec3 uColor; uniform float uPower;
    varying vec3 vN; varying vec3 vV;
    void main(){ float f = pow(1.0 - abs(dot(vN,vV)), uPower);
      gl_FragColor = vec4(uColor, f*.85); }`,
};

function Solid({ geo, color, pos, speed }: {
  geo: THREE.BufferGeometry; color: string; pos: [number, number, number]; speed: number;
}) {
  const mesh = useRef<THREE.Mesh>(null!);
  /* useRef(new ShaderMaterial()) rebuilt and threw away a material on every
     render; useMemo builds one and disposes it with the component. */
  const mat = useMemo(
    () => new THREE.ShaderMaterial({
      vertexShader: FRESNEL.vertex, fragmentShader: FRESNEL.fragment,
      uniforms: { uColor: { value: new THREE.Color(color) }, uPower: { value: 2.2 } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }),
    [color],
  );
  useEffect(() => () => mat.dispose(), [mat]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * speed;
    mesh.current.rotation.x = t * 0.4;
    mesh.current.rotation.y = t * 0.55;
    mesh.current.position.y = pos[1] + Math.sin(t) * 0.28;
  });
  return <mesh ref={mesh} geometry={geo} material={mat} position={pos} />;
}

function Field() {
  const geos = useMemo(() => [
    new THREE.IcosahedronGeometry(1.5, 1),
    new THREE.TorusKnotGeometry(0.9, 0.26, 96, 12),
    new THREE.OctahedronGeometry(1.1, 0),
  ], []);
  useEffect(() => () => geos.forEach((g) => g.dispose()), [geos]);
  return (
    <>
      <fog attach="fog" args={["#0c141b", 6, 14]} />
      <Solid geo={geos[0]} color="#5b93b3" pos={[-2.6, 0.4, -2]} speed={0.24} />
      <Solid geo={geos[1]} color="#86b0a6" pos={[2.8, -0.5, -3]} speed={0.18} />
      <Solid geo={geos[2]} color="#8fbcd4" pos={[0.6, 1.2, -5]} speed={0.3} />
    </>
  );
}

/* ---- terminal loop: rolling filenames on the tail -f line ---- */
const TAIL = ["phalanx/raft.go", "ricc/regalloc.cpp", "f1/montecarlo.ts", "lob/match_engine.cpp"];
function TermLoop() {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setI((v) => (v + 1) % TAIL.length), 2400);
    return () => clearInterval(t);
  }, [reduce]);
  return (
    <span className="tloop">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={TAIL[i]} className="w"
          initial={reduce ? false : { y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={reduce ? undefined : { y: "-100%", opacity: 0 }}
          transition={{ duration: DUR.sm, ease: EASE.out }}
        >
          {TAIL[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/* ---- the little car laps the telemetry track ---- */
function useLapCar(svg: React.RefObject<SVGSVGElement | null>, running: boolean) {
  const lap = useRef(0);                       // survives pausing, so the car resumes
  useEffect(() => {
    const root = svg.current;
    if (!root || !running || prefersReducedMotion()) return;
    const path = root.querySelector<SVGPathElement>("#lapPath");
    const car = root.querySelector<SVGGElement>("#lapCar");
    if (!path || !car) return;

    /* Sample the track once. Two `getPointAtLength` calls per frame meant
       re-walking the path geometry sixty times a second for a 20px car. */
    const len = path.getTotalLength();
    const N = 480;
    const pts = Array.from({ length: N + 1 }, (_, i) => path.getPointAtLength((i / N) * len));
    const angles = pts.map((p, i) => {
      const a = i < N ? p : pts[N - 1];
      const b = i < N ? pts[i + 1] : p;
      return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    });

    let raf = 0, last = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = last ? Math.min(now - last, 50) / 1000 : 0;
      last = now;
      lap.current = (lap.current + dt * 0.096) % 1;   // one lap ≈ 10.4s, wall-clock
      const i = Math.floor(lap.current * N);
      const p = pts[i];
      car.setAttribute("transform", `translate(${p.x},${p.y}) rotate(${angles[i]})`);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [svg, running]);
}

/** True while the section is anywhere near the viewport. Everything the
 *  hero renders — WebGL field, ASCII wordmark, lap car — is expensive and
 *  none of it was pausing once you scrolled past it. */
function useOnScreen(ref: React.RefObject<HTMLElement | null>) {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return on;
}

export default function Hero() {
  const lap = useRef<SVGSVGElement>(null);
  const section = useRef<HTMLElement>(null);
  const onScreen = useOnScreen(section);
  useLapCar(lap, onScreen);
  return (
    <section className="hero" ref={section}>
      <div id="field" aria-hidden>
        <Canvas
          camera={{ fov: 50, position: [0, 0, 6.5] }}
          gl={{ alpha: true, antialias: true }}
          dpr={[1, 2]}
          frameloop={onScreen ? "always" : "never"}
        >
          <Field />
        </Canvas>
      </div>
      <span className="flank fl-l" aria-hidden>Prove the correctness</span>
      <span className="flank fl-r" aria-hidden>Chase the latency</span>
      <div className="wrap hero-inner">
        <div className="status-row">
          <span className="chip"><span className="sq" />Systems Engineer</span>
          <span className="chip"><span className="sq" />Low-latency · Distributed</span>
          <span className="chip live"><span className="sq" />Hyderabad, IN · CSE ’24–’28</span>
        </div>
        <h1 className="name">
          <span className="sr-only">Abhinav Pabbaraju</span>
          <AsciiGlitchName />
        </h1>
        <p className="tagline">
          I work where <b>correctness and speed fight each other</b> — distributed consensus, compiler
          backends, GPU physics, order books. Chasing the{" "}
          <span className="scrib-wrap">
            fastest lap
            <svg viewBox="0 0 120 44" aria-hidden>
              <path className="scrib drawable" d="M8,30 C18,8 96,4 110,18 C118,27 92,40 46,40 C18,40 4,32 12,20 C22,6 88,2 114,12" />
            </svg>
          </span>{" "}
          in software.
        </p>
        <div className="termline" aria-label="currently working on">
          <span className="ps">abby@systems:~$</span>
          <span>tail -f</span>
          <TermLoop />
          <span className="caret" aria-hidden />
        </div>
        <div className="hero-meta">
          <div className="cell"><div className="k">Focus</div><div className="v">Systems<small>·LL</small></div></div>
          <div className="cell"><div className="k">Building</div><div className="v">F1<small>·2026</small></div></div>
          <div className="cell"><div className="k">Shipped</div><div className="v">14K+<small>LOC</small></div></div>
          <div className="cell"><div className="k">Next</div><div className="v">LOB<small>·µs</small></div></div>
        </div>
      </div>
      <svg id="lap" ref={lap} viewBox="0 0 1200 220" preserveAspectRatio="none" aria-hidden>
        <path className="track" id="lapPath" d="M-40,170 C120,170 150,60 300,60 S480,180 620,180 S760,40 900,40 S1080,150 1240,150" />
        <g id="lapCar">
          <ellipse className="car-glow" cx={0} cy={0} rx={14} ry={5} opacity={0.25} />
          <rect className="car-body" x={-11} y={-4} width={22} height={8} rx={4} />
          <rect className="car-body" x={6} y={-2.5} width={7} height={5} rx={2.5} opacity={0.7} />
          <circle cx={-6} cy={5} r={3} fill="#101a23" stroke="#8fbcd4" strokeWidth={1.4} />
          <circle cx={6} cy={5} r={3} fill="#101a23" stroke="#8fbcd4" strokeWidth={1.4} />
        </g>
      </svg>
    </section>
  );
}
