"use client";

/**
 * Animated backgrounds behind the text. Each scene is a small canvas
 * renderer tinted by the current theme; everything stays low-contrast so the
 * text remains the focus. With reduced motion a single still frame is drawn.
 */

import { useEffect, useRef } from "react";
import { reducedMotion } from "./fx";

type RGB = [number, number, number];

interface Scene {
  init(w: number, h: number): void;
  draw(c: CanvasRenderingContext2D, w: number, h: number, t: number, dt: number): void;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const rgba = ([r, g, b]: RGB, a: number) => `rgba(${r},${g},${b},${a})`;

function parse(varName: string): RGB {
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim().split(/\s+/).map(Number);
  return [v[0] ?? 255, v[1] ?? 255, v[2] ?? 255];
}

function makeScene(kind: string, fg: RGB, accent: RGB): Scene | null {
  switch (kind) {
    case "night-sky": {
      let stars: { x: number; y: number; r: number; p: number; s: number }[] = [];
      let shoot: { x: number; y: number; vx: number; vy: number; life: number } | null = null;
      return {
        init(w, h) {
          stars = Array.from({ length: Math.round((w * h) / 9000) }, () => ({ x: rand(0, w), y: rand(0, h), r: rand(0.3, 1.3), p: rand(0, 6), s: rand(0.5, 2) }));
        },
        draw(c, w, h, t, dt) {
          for (const s of stars) {
            c.fillStyle = rgba([255, 255, 255], 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * s.s + s.p)));
            c.beginPath();
            c.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            c.fill();
          }
          if (!shoot && Math.random() < dt * 0.08) shoot = { x: rand(w * 0.2, w), y: rand(0, h * 0.4), vx: -rand(400, 600), vy: rand(150, 250), life: 0.9 };
          if (shoot) {
            shoot.life -= dt;
            shoot.x += shoot.vx * dt;
            shoot.y += shoot.vy * dt;
            const g = c.createLinearGradient(shoot.x, shoot.y, shoot.x - shoot.vx * 0.12, shoot.y - shoot.vy * 0.12);
            g.addColorStop(0, rgba([255, 255, 255], Math.max(0, shoot.life)));
            g.addColorStop(1, "rgba(255,255,255,0)");
            c.strokeStyle = g;
            c.lineWidth = 1.2;
            c.beginPath();
            c.moveTo(shoot.x, shoot.y);
            c.lineTo(shoot.x - shoot.vx * 0.12, shoot.y - shoot.vy * 0.12);
            c.stroke();
            if (shoot.life <= 0) shoot = null;
          }
        },
      };
    }
    case "snow": {
      let flakes: { x: number; y: number; r: number; v: number; p: number }[] = [];
      return {
        init(w, h) {
          flakes = Array.from({ length: Math.round((w * h) / 12000) }, () => ({ x: rand(0, w), y: rand(0, h), r: rand(0.8, 2.6), v: rand(15, 45), p: rand(0, 6) }));
        },
        draw(c, w, h, t, dt) {
          c.fillStyle = rgba([255, 255, 255], 0.55);
          for (const f of flakes) {
            f.y += f.v * dt;
            f.x += Math.sin(t + f.p) * 12 * dt;
            if (f.y > h + 4) {
              f.y = -4;
              f.x = rand(0, w);
            }
            c.globalAlpha = f.r / 3;
            c.beginPath();
            c.arc(f.x, f.y, f.r, 0, Math.PI * 2);
            c.fill();
          }
          c.globalAlpha = 1;
        },
      };
    }
    case "aurora":
      return {
        init() {},
        draw(c, w, h, t) {
          const bands: [RGB, number][] = [
            [[63, 208, 166], 0],
            [accent, 2],
            [[111, 123, 255], 4],
          ];
          c.globalCompositeOperation = "lighter";
          for (const [col, ph] of bands) {
            const cx = w * (0.5 + 0.35 * Math.sin(t * 0.07 + ph));
            const g = c.createRadialGradient(cx, -h * 0.1, 0, cx, -h * 0.1, h * 0.7);
            g.addColorStop(0, rgba(col, 0.16));
            g.addColorStop(1, rgba(col, 0));
            c.fillStyle = g;
            c.fillRect(0, 0, w, h);
          }
          c.globalCompositeOperation = "source-over";
        },
      };
    case "rain": {
      let drops: { x: number; y: number; l: number; v: number }[] = [];
      return {
        init(w, h) {
          drops = Array.from({ length: Math.round(w / 8) }, () => ({ x: rand(0, w), y: rand(0, h), l: rand(8, 18), v: rand(500, 800) }));
        },
        draw(c, w, h, _t, dt) {
          c.strokeStyle = rgba(fg, 0.14);
          c.lineWidth = 1;
          c.beginPath();
          for (const d of drops) {
            d.y += d.v * dt;
            d.x -= d.v * 0.08 * dt;
            if (d.y > h) {
              d.y = -d.l;
              d.x = rand(0, w + 40);
            }
            c.moveTo(d.x, d.y);
            c.lineTo(d.x + d.l * 0.08, d.y - d.l);
          }
          c.stroke();
        },
      };
    }
    case "digital-rain": {
      const GLYPHS = "01アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789";
      const size = 14;
      let cols: number[] = [];
      let acc = 0;
      return {
        init(w, h) {
          cols = Array.from({ length: Math.ceil(w / size) }, () => rand(-h / size, 0));
        },
        draw(c, w, h, _t, dt) {
          acc += dt;
          c.font = `${size}px ui-monospace, monospace`;
          for (let i = 0; i < cols.length; i++) {
            const y = cols[i]!;
            for (let k = 0; k < 14; k++) {
              const gy = (Math.floor(y) - k) * size;
              if (gy < 0 || gy > h) continue;
              c.fillStyle = k === 0 ? rgba([220, 255, 230], 0.35) : rgba(accent, 0.22 * (1 - k / 14));
              c.fillText(GLYPHS[(i * 7 + Math.floor(y) - k + Math.floor(acc * 3)) % GLYPHS.length]!, i * size, gy);
            }
            cols[i] = y > h / size + 14 ? rand(-20, 0) : y + dt * (6 + (i % 5));
          }
        },
      };
    }
    case "underwater": {
      let bubbles: { x: number; y: number; r: number; v: number; p: number }[] = [];
      return {
        init(w, h) {
          bubbles = Array.from({ length: 28 }, () => ({ x: rand(0, w), y: rand(0, h), r: rand(1.5, 5), v: rand(20, 50), p: rand(0, 6) }));
        },
        draw(c, w, h, t, dt) {
          const g = c.createLinearGradient(0, 0, 0, h);
          g.addColorStop(0, rgba(accent, 0.1));
          g.addColorStop(1, rgba([0, 20, 40], 0.25));
          c.fillStyle = g;
          c.fillRect(0, 0, w, h);
          // Caustic light ripples near the surface.
          for (let i = 0; i < 5; i++) {
            const x = w * (i / 5 + 0.1 * Math.sin(t * 0.4 + i));
            const rg = c.createRadialGradient(x, 0, 0, x, 0, h * 0.35);
            rg.addColorStop(0, rgba([255, 255, 255], 0.05));
            rg.addColorStop(1, "rgba(255,255,255,0)");
            c.fillStyle = rg;
            c.fillRect(0, 0, w, h);
          }
          c.strokeStyle = rgba([200, 240, 255], 0.3);
          for (const b of bubbles) {
            b.y -= b.v * dt;
            b.x += Math.sin(t * 2 + b.p) * 10 * dt;
            if (b.y < -10) {
              b.y = h + 10;
              b.x = rand(0, w);
            }
            c.beginPath();
            c.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            c.stroke();
          }
        },
      };
    }
    case "light-shafts":
      return {
        init() {},
        draw(c, w, h, t) {
          c.save();
          c.globalCompositeOperation = "lighter";
          for (let i = 0; i < 6; i++) {
            const x = w * (i / 6) + Math.sin(t * 0.15 + i * 1.7) * 60;
            const width = 60 + 40 * Math.sin(t * 0.2 + i);
            const g = c.createLinearGradient(x, 0, x + h * 0.5, h);
            g.addColorStop(0, rgba([255, 244, 214], 0.07));
            g.addColorStop(1, "rgba(255,244,214,0)");
            c.fillStyle = g;
            c.beginPath();
            c.moveTo(x, 0);
            c.lineTo(x + width, 0);
            c.lineTo(x + width + h * 0.5, h);
            c.lineTo(x + h * 0.5, h);
            c.closePath();
            c.fill();
          }
          c.restore();
        },
      };
    case "candlelight":
      return {
        init() {},
        draw(c, w, h, t) {
          const flicker = 0.85 + 0.1 * Math.sin(t * 7) + 0.05 * Math.sin(t * 13.3);
          const g = c.createRadialGradient(w / 2, h * 1.05, 0, w / 2, h * 1.05, h * 0.9);
          g.addColorStop(0, `rgba(255,170,80,${0.22 * flicker})`);
          g.addColorStop(0.5, `rgba(255,140,60,${0.08 * flicker})`);
          g.addColorStop(1, "rgba(255,140,60,0)");
          c.fillStyle = g;
          c.fillRect(0, 0, w, h);
        },
      };
    case "hearth": {
      let embers: { x: number; y: number; v: number; p: number; life: number }[] = [];
      return {
        init(w, h) {
          embers = Array.from({ length: 40 }, () => ({ x: rand(0, w), y: rand(h * 0.5, h), v: rand(20, 60), p: rand(0, 6), life: rand(0, 1) }));
        },
        draw(c, w, h, t, dt) {
          const flicker = 0.8 + 0.2 * Math.sin(t * 5) * Math.sin(t * 2.3);
          const g = c.createLinearGradient(0, h, 0, h * 0.4);
          g.addColorStop(0, `rgba(255,110,40,${0.28 * flicker})`);
          g.addColorStop(1, "rgba(255,110,40,0)");
          c.fillStyle = g;
          c.fillRect(0, 0, w, h);
          for (const e of embers) {
            e.y -= e.v * dt;
            e.x += Math.sin(t * 2 + e.p) * 15 * dt;
            e.life -= dt * 0.25;
            if (e.life <= 0 || e.y < h * 0.3) Object.assign(e, { x: rand(0, w), y: h + 5, life: 1 });
            c.fillStyle = `rgba(255,${150 + Math.round(80 * e.life)},80,${0.7 * e.life})`;
            c.beginPath();
            c.arc(e.x, e.y, 1.3, 0, Math.PI * 2);
            c.fill();
          }
        },
      };
    }
    default:
      return null;
  }
}

/** The CRT look is a static CSS overlay; every other scene draws on canvas. */
export function Background({ kind, themeKey }: { kind: string; themeKey: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || kind === "none" || kind === "crt") return;
    const ctx = canvas.getContext("2d");
    const scene = makeScene(kind, parse("--fg"), parse("--accent"));
    if (!ctx || !scene) return;

    let w = 0;
    let h = 0;
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      scene.init(w, h);
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(canvas);

    let raf = 0;
    let last = performance.now();
    const start = last;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, w, h);
      scene.draw(ctx, w, h, (now - start) / 1000, dt);
      if (!reducedMotion() && document.visibilityState === "visible") raf = requestAnimationFrame(frame);
      else raf = 0;
    };
    raf = requestAnimationFrame(frame);
    const onVisible = () => {
      if (document.visibilityState === "visible" && !raf && !reducedMotion()) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [kind, themeKey]);

  if (kind === "none") return null;
  if (kind === "crt") {
    return (
      <div aria-hidden className="crt-overlay pointer-events-none absolute inset-0 z-0" />
    );
  }
  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 z-0 h-full w-full" />;
}
