"use client";
import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MeshTransmissionMaterial, Text } from "@react-three/drei";
import * as THREE from "three";
import { lerpFactor } from "@/lib/motion";

/** A transmissive glass lens drifting over in-canvas type — it refracts
 *  whatever sits behind it. Pointer-follow with lerp; float when idle. */
function Lens() {
  const mesh = useRef<THREE.Mesh>(null!);
  const target = useRef(new THREE.Vector2(0, 0));
  const { viewport } = useThree();

  useFrame(({ pointer, clock }, delta) => {
    const active = Math.abs(pointer.x) > 0.001 || Math.abs(pointer.y) > 0.001;
    if (active) {
      target.current.set(
        (pointer.x * viewport.width) / 2.4,
        (pointer.y * viewport.height) / 2.6,
      );
    } else {
      const t = clock.elapsedTime;
      target.current.set(Math.sin(t * 0.5) * 1.4, Math.cos(t * 0.7) * 0.4);
    }
    const k = lerpFactor(0.08, delta);        // same follow at 60Hz and 144Hz
    mesh.current.position.x += (target.current.x - mesh.current.position.x) * k;
    mesh.current.position.y += (target.current.y - mesh.current.position.y) * k;
    mesh.current.rotation.z = clock.elapsedTime * 0.15;
  });

  return (
    <mesh ref={mesh} position={[0, 0, 1.4]}>
      <torusGeometry args={[0.9, 0.42, 32, 64]} />
      <MeshTransmissionMaterial
        transmission={1}
        thickness={1.3}
        roughness={0.08}
        ior={1.18}
        chromaticAberration={0.05}
        anisotropicBlur={0.2}
        distortion={0.12}
        distortionScale={0.4}
        temporalDistortion={0.1}
      />
    </mesh>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={1.4} />
      <directionalLight position={[3, 4, 6]} intensity={1.2} />
      <Text
        position={[0, 0, 0]}
        fontSize={1.15}
        letterSpacing={-0.02}
        color="#e8eef1"
        anchorX="center"
        anchorY="middle"
      >
        SAY HELLO ↗
      </Text>
      <Lens />
    </>
  );
}

export default function FluidGlass() {
  const band = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);

  /* Transmission renders the scene to an offscreen buffer every frame —
     easily the most expensive thing on the page, and it was running from
     first paint while the contact section sat eight scenes below the fold. */
  useEffect(() => {
    const el = band.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setLive(e.isIntersecting), { rootMargin: "150px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="glass-band" ref={band} aria-hidden>
      <Canvas
        camera={{ fov: 35, position: [0, 0, 7] }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 1.5]}
        frameloop={live ? "always" : "never"}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
