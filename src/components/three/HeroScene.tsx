"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { MonogramM } from "./MonogramM";
import { Particles } from "./Particles";

type Props = { simplified: boolean; reducedMotion: boolean };

export default function HeroScene({ simplified, reducedMotion }: Props) {
  return (
    <Canvas
      camera={{ position: [0, 0, 9], fov: 40 }}
      dpr={simplified ? 1 : [1, 1.75]}
      gl={{ antialias: !simplified, powerPreference: "high-performance" }}
      frameloop={reducedMotion ? "demand" : "always"}
      aria-hidden
    >
      <color attach="background" args={["#090909"]} />
      <fog attach="fog" args={["#090909", 13, 24]} />

      {/* Reflexos procedurais: sem dependência de HDR externo */}
      <Environment resolution={simplified ? 128 : 256}>
        <Lightformer form="rect" intensity={4} position={[-5, 2, 3]} scale={[6, 2, 1]} />
        <Lightformer
          form="rect"
          intensity={2.5}
          position={[5, -1, 4]}
          scale={[4, 6, 1]}
          color="#ff7a18"
        />
        <Lightformer form="ring" intensity={2} position={[0, 4, -4]} scale={4} color="#ffffff" />
      </Environment>

      <directionalLight position={[4, 5, 6]} intensity={1.1} />
      <pointLight position={[-4, -2, 3]} intensity={18} color="#ff6a00" distance={12} />

      <MonogramM reducedMotion={reducedMotion} />

      <Particles count={simplified ? 60 : 160} animate={!reducedMotion} />
    </Canvas>
  );
}
