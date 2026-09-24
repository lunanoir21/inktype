"use client";

import { useEffect, useRef } from "react";
import { attachCanvas, resize } from "./fx";

/** Full-screen overlay canvas for typing and cursor particles. */
export function FxCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    attachCanvas(ref.current);
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      attachCanvas(null);
    };
  }, []);
  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[60] h-full w-full" />;
}
