"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";

/** Contorno do "M" (unidades de 0–8, origem no canto inferior esquerdo). */
const OUTLINE: [number, number][] = [
  [0, 0],
  [2, 0],
  [2, 4.6],
  [4, 1.8],
  [6, 4.6],
  [6, 0],
  [8, 0],
  [8, 6.6],
  [6.6, 8],
  [4.9, 8],
  [4, 6.6],
  [3.1, 8],
  [0, 8],
];

/** Barra de acento laranja alojada no vão inferior do M. */
const ACCENT: [number, number][] = [
  [2.7, 0],
  [5.3, 0],
  [5.0, 0.55],
  [3.0, 0.55],
];

const toShape = (pts: [number, number][]) => {
  const s = new THREE.Shape();
  pts.forEach(([x, y], i) => (i === 0 ? s.moveTo(x, y) : s.lineTo(x, y)));
  s.closePath();
  return s;
};

type Props = { reducedMotion: boolean };

export function MonogramM({ reducedMotion }: Props) {
  const group = useRef<THREE.Group>(null);

  const body = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(toShape(OUTLINE), {
      depth: 1.5,
      bevelEnabled: true,
      bevelThickness: 0.14,
      bevelSize: 0.12,
      bevelSegments: 4,
    });
    g.translate(-4, -4, -0.75);
    return g;
  }, []);

  const accent = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(toShape(ACCENT), {
      depth: 1.7,
      bevelEnabled: false,
    });
    g.translate(-4, -4, -0.85);
    return g;
  }, []);

  useEffect(() => {
    const g = group.current;
    if (!g || reducedMotion) return;
    const tween = gsap.fromTo(
      g.scale,
      { x: 0.2, y: 0.2, z: 0.2 },
      { x: 0.4, y: 0.4, z: 0.4, duration: 1.8, ease: "expo.out" },
    );
    const spin = gsap.fromTo(g.rotation, { y: -1.6 }, { y: 0, duration: 2.2, ease: "power4.out" });
    return () => {
      tween.kill();
      spin.kill();
    };
  }, [reducedMotion]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g || reducedMotion) return;
    const t = state.clock.elapsedTime;
    const targetY = state.pointer.x * 0.45 + Math.sin(t * 0.4) * 0.08;
    const targetX = -state.pointer.y * 0.25;
    const k = 1 - Math.exp(-delta * 3);
    g.rotation.y += (targetY - g.rotation.y) * k * (t > 2.2 ? 1 : 0);
    g.rotation.x += (targetX - g.rotation.x) * k;
    g.position.y = Math.sin(t * 0.8) * 0.06;
  });

  return (
    <group ref={group} scale={reducedMotion ? 0.4 : 0.2}>
      <mesh geometry={body}>
        <meshStandardMaterial
          color="#c9c9cc"
          metalness={1}
          roughness={0.28}
          envMapIntensity={1.3}
        />
      </mesh>
      <mesh geometry={accent}>
        <meshStandardMaterial
          color="#ff6a00"
          emissive="#ff6a00"
          emissiveIntensity={0.9}
          metalness={0.4}
          roughness={0.35}
        />
      </mesh>
    </group>
  );
}
