"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { HeroFallback } from "./HeroFallback";

const HeroScene = dynamic(() => import("@/components/three/HeroScene"), {
  ssr: false,
  loading: () => <HeroFallback />,
});

type Mode = { webgl: boolean; simplified: boolean; reducedMotion: boolean } | null;

function detect(): NonNullable<Mode> {
  let webgl = false;
  try {
    const c = document.createElement("canvas");
    webgl = !!(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    webgl = false;
  }
  const small = window.matchMedia("(max-width: 767px)").matches;
  const lowCores = (navigator.hardwareConcurrency ?? 8) <= 4;
  return {
    webgl,
    simplified: small || lowCores,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  };
}

export function Hero3D() {
  const [mode, setMode] = useState<Mode>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMode(detect()));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="absolute inset-0">
      <div className="absolute inset-x-0 top-0 h-[52%] lg:inset-y-0 lg:right-0 lg:left-auto lg:h-auto lg:w-[55%]">
        {mode?.webgl ? (
          <HeroScene simplified={mode.simplified} reducedMotion={mode.reducedMotion} />
        ) : (
          <HeroFallback />
        )}
      </div>
      {/* vinheta para garantir leitura do texto */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,#090909_8%,transparent_55%),linear-gradient(to_right,#090909cc,transparent_60%)]" />
    </div>
  );
}
