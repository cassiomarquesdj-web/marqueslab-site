"use client";

import { useEffect, useRef } from "react";

/**
 * Anel que acompanha o mouse. Só aparece com ponteiro preciso (desktop),
 * não esconde o cursor nativo e respeita prefers-reduced-motion.
 */
export function Cursor() {
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ring.current;
    if (!el) return;
    if (
      !window.matchMedia("(pointer: fine)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    let x = 0;
    let y = 0;
    let cx = 0;
    let cy = 0;
    let raf = 0;

    const tick = () => {
      cx += (x - cx) * 0.2;
      cy += (y - cy) * 0.2;
      el.style.transform = `translate3d(${cx - 18}px, ${cy - 18}px, 0)`;
      raf = requestAnimationFrame(tick);
    };

    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      el.style.opacity = "1";
      const interactive = (e.target as Element | null)?.closest(
        "a, button, input, textarea, select",
      );
      el.dataset.active = interactive ? "true" : "false";
    };
    const leave = () => (el.style.opacity = "0");

    raf = requestAnimationFrame(tick);
    window.addEventListener("pointermove", move);
    document.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div
      ref={ring}
      aria-hidden
      className="border-flame data-[active=true]:bg-flame/15 pointer-events-none fixed top-0 left-0 z-[100] hidden size-9 rounded-full border opacity-0 mix-blend-screen transition-[opacity,scale] duration-200 data-[active=true]:scale-150 [@media(pointer:fine)]:block"
    />
  );
}
