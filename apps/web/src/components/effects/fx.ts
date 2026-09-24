"use client";

/**
 * A tiny particle system drawn on one full-screen canvas. Typing effects and
 * cursor effects push particles here; the loop runs only while particles are
 * alive, so an idle page costs nothing.
 */

type Shape = "dot" | "square" | "shard" | "star" | "ring" | "petal" | "bolt" | "rect" | "blot" | "flame";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Seconds alive / total life. */
  age: number;
  life: number;
  size: number;
  color: string;
  shape: Shape;
  gravity: number;
  drag: number;
  rot: number;
  vr: number;
  /** Grow (positive) or shrink (negative) per second, as a factor of size. */
  grow: number;
  glow: boolean;
  w?: number;
  h?: number;
  wobble?: number;
  points?: [number, number][];
}

const particles: Particle[] = [];
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let raf = 0;
let last = 0;
const MAX = 600;

export const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function attachCanvas(el: HTMLCanvasElement | null): void {
  canvas = el;
  ctx = el?.getContext("2d") ?? null;
  resize();
}

export function resize(): void {
  if (!canvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)]!;

function add(p: Partial<Particle> & Pick<Particle, "x" | "y" | "color">): void {
  if (!ctx || reducedMotion()) return;
  if (particles.length >= MAX) particles.shift();
  particles.push({
    vx: 0, vy: 0, age: 0, life: 0.6, size: 3, shape: "dot", gravity: 0, drag: 0.9, rot: 0, vr: 0, grow: 0, glow: false,
    ...p,
  });
  if (!raf) {
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }
}

function drawStar(c: CanvasRenderingContext2D, r: number) {
  c.beginPath();
  for (let i = 0; i < 8; i++) {
    const rr = i % 2 === 0 ? r : r * 0.35;
    const a = (i * Math.PI) / 4;
    c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  c.closePath();
  c.fill();
}

function loop(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const c = ctx;
  if (!c || !canvas) {
    raf = 0;
    return;
  }
  c.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]!;
    p.age += dt;
    if (p.age >= p.life) {
      particles.splice(i, 1);
      continue;
    }
    p.vy += p.gravity * dt;
    const drag = Math.pow(p.drag, dt * 60);
    p.vx *= drag;
    p.vy *= drag;
    p.x += p.vx * dt + (p.wobble ? Math.sin(p.age * 6 + p.rot) * p.wobble * dt : 0);
    p.y += p.vy * dt;
    p.rot += p.vr * dt;
    const t = p.age / p.life;
    const size = Math.max(0.1, p.size * (1 + p.grow * p.age));
    c.save();
    c.globalAlpha = p.shape === "blot" ? 0.35 * (1 - t) : 1 - t * t;
    c.translate(p.x, p.y);
    c.rotate(p.rot);
    c.fillStyle = p.color;
    c.strokeStyle = p.color;
    if (p.glow) {
      c.shadowColor = p.color;
      c.shadowBlur = size * 3;
    }
    switch (p.shape) {
      case "dot":
      case "blot":
        c.beginPath();
        c.arc(0, 0, size, 0, Math.PI * 2);
        c.fill();
        break;
      case "square":
        c.fillRect(-size / 2, -size / 2, size, size);
        break;
      case "rect":
        c.fillRect(0, 0, p.w ?? size, p.h ?? size);
        break;
      case "shard":
        c.beginPath();
        c.moveTo(0, -size);
        c.lineTo(size * 0.8, size * 0.6);
        c.lineTo(-size * 0.6, size * 0.4);
        c.closePath();
        c.fill();
        break;
      case "star":
        drawStar(c, size);
        break;
      case "ring":
        c.lineWidth = 1.2;
        c.beginPath();
        c.arc(0, 0, size, 0, Math.PI * 2);
        c.stroke();
        break;
      case "petal":
        c.beginPath();
        c.ellipse(0, 0, size, size * 0.5, 0, 0, Math.PI * 2);
        c.fill();
        break;
      case "flame": {
        const g = c.createRadialGradient(0, 0, 0, 0, 0, size);
        g.addColorStop(0, "rgba(255,240,180,0.95)");
        g.addColorStop(0.4, p.color);
        g.addColorStop(1, "rgba(255,80,0,0)");
        c.fillStyle = g;
        c.beginPath();
        c.arc(0, 0, size, 0, Math.PI * 2);
        c.fill();
        break;
      }
      case "bolt":
        c.lineWidth = 1.5;
        c.beginPath();
        (p.points ?? []).forEach(([x, y], j) => (j ? c.lineTo(x, y) : c.moveTo(x, y)));
        c.stroke();
        break;
    }
    c.restore();
  }
  raf = particles.length ? requestAnimationFrame(loop) : 0;
  if (!particles.length) c.clearRect(0, 0, canvas.width, canvas.height);
}

export interface Palette {
  fg: string;
  accent: string;
  muted: string;
}

const FIRE = ["#ffb347", "#ff7b29", "#ffd166", "#ff5a1f"];
const CONFETTI = ["#ff5d8f", "#ffd166", "#06d6a0", "#4cc9f0", "#b388ff", "#ff9f1c"];

/** Burst for a correctly typed character centred at (x, y). */
export function typingBurst(effect: string, x: number, y: number, h: number, pal: Palette): void {
  switch (effect) {
    case "embers":
      for (let i = 0; i < 4; i++)
        add({ x: x + rand(-4, 4), y, vx: rand(-15, 15), vy: rand(-60, -30), life: rand(0.6, 1), size: rand(1, 2.2), color: pick(FIRE), glow: true, drag: 0.98, wobble: 20 });
      break;
    case "explode":
      for (let i = 0; i < 10; i++) {
        const a = rand(0, Math.PI * 2), s = rand(60, 160);
        add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.35, 0.6), size: rand(1, 2.4), color: pal.fg, drag: 0.9 });
      }
      break;
    case "fireworks":
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2, s = rand(80, 140);
        add({ x, y: y - h / 2, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.6, 0.9), size: 1.6, color: pick(CONFETTI), gravity: 160, drag: 0.93, glow: true });
      }
      break;
    case "shatter":
      for (let i = 0; i < 6; i++)
        add({ x: x + rand(-4, 4), y: y + rand(-h / 3, h / 3), vx: rand(-50, 50), vy: rand(-80, -10), life: 0.8, size: rand(2, 4), color: pal.fg, shape: "shard", gravity: 400, vr: rand(-10, 10), drag: 0.99 });
      break;
    case "sparkle":
      for (let i = 0; i < 3; i++)
        add({ x: x + rand(-10, 10), y: y + rand(-h / 2, h / 3), vx: rand(-10, 10), vy: rand(-20, 0), life: rand(0.4, 0.7), size: rand(2.5, 4.5), color: pal.accent, shape: "star", glow: true, grow: -1, vr: 3 });
      break;
    case "burn":
      for (let i = 0; i < 2; i++)
        add({ x: x + rand(-3, 3), y: y - h / 3, vx: rand(-8, 8), vy: rand(-45, -25), life: 0.7, size: rand(1, 1.8), color: pick(FIRE), glow: true, wobble: 25 });
      add({ x, y: y - h / 2, vy: -20, life: 1, size: 4, color: "rgba(140,140,140,0.35)", grow: 2, drag: 0.98 });
      break;
    case "shock":
      for (let i = 0; i < 3; i++) {
        const a = rand(0, Math.PI * 2);
        const pts: [number, number][] = [[0, 0]];
        let px = 0, py = 0;
        for (let k = 0; k < 4; k++) {
          px += Math.cos(a) * 6 + rand(-4, 4);
          py += Math.sin(a) * 6 + rand(-4, 4);
          pts.push([px, py]);
        }
        add({ x, y: y - h / 3, life: 0.16, color: "#9ad7ff", shape: "bolt", points: pts, glow: true, drag: 1 });
      }
      break;
    case "ink":
      add({ x, y: y - h / 3, life: 0.9, size: h * 0.35, color: pal.accent, shape: "blot", grow: 1.4, drag: 1 });
      break;
    case "pixelate":
      for (let i = 0; i < 6; i++)
        add({ x: x + rand(-6, 6), y: y + rand(-h / 2, 0), vx: rand(-30, 30), vy: rand(-30, 10), life: 0.45, size: rand(2, 4), color: pal.fg, shape: "square", drag: 0.9 });
      break;
  }
}

let hue = 0;

/** Particles left behind as the cursor moves to (x, y). `w`/`h` is the cursor box. */
export function cursorTrail(effect: string, x: number, y: number, w: number, h: number, pal: Palette): void {
  const cx = x + w / 2;
  const cy = y + h / 2;
  switch (effect) {
    case "afterimage":
      add({ x, y, life: 0.35, color: pal.accent, shape: "rect", w, h, drag: 1 });
      break;
    case "rainbow":
      hue = (hue + 18) % 360;
      for (let i = 0; i < 2; i++)
        add({ x: cx + rand(-3, 3), y: y + h - 2, vx: rand(-10, 10), vy: rand(5, 25), life: 0.6, size: 1.8, color: `hsl(${hue + i * 30} 90% 65%)`, glow: true });
      break;
    case "sand":
      for (let i = 0; i < 3; i++)
        add({ x: cx + rand(-4, 4), y: y + h, vx: rand(-15, 15), vy: rand(0, 20), life: 1, size: rand(0.8, 1.5), color: pick(["#d8b979", "#c9a45c", "#e8cf98"]), gravity: 300, drag: 0.99 });
      break;
    case "stardust":
      for (let i = 0; i < 2; i++)
        add({ x: cx + rand(-8, 8), y: cy + rand(-8, 8), vx: rand(-6, 6), vy: rand(-6, 6), life: rand(0.8, 1.4), size: rand(1, 2.2), color: pick([pal.accent, "#ffffff", "#ffe8a3"]), shape: "star", glow: true, vr: 2 });
      break;
    case "bubbles":
      add({ x: cx + rand(-4, 4), y: y + h, vx: rand(-5, 5), vy: rand(-45, -25), life: rand(0.9, 1.4), size: rand(2, 4), color: pal.accent, shape: "ring", wobble: 30, drag: 0.99 });
      break;
    case "lightning": {
      const pts: [number, number][] = [[0, 0]];
      let px = 0, py = 0;
      for (let k = 0; k < 5; k++) {
        px += rand(-6, 6);
        py += rand(3, 7);
        pts.push([px, py]);
      }
      add({ x: cx, y: y + h, life: 0.14, color: "#b9e6ff", shape: "bolt", points: pts, glow: true, drag: 1 });
      break;
    }
    case "flame":
      for (let i = 0; i < 3; i++)
        add({ x: cx + rand(-4, 4), y: y + h - 2, vx: rand(-8, 8), vy: rand(-50, -25), life: rand(0.35, 0.6), size: rand(3, 6), color: pick(FIRE), shape: "flame", grow: -1.2, drag: 0.97 });
      break;
    case "fireflies":
      if (Math.random() < 0.6)
        add({ x: cx + rand(-24, 24), y: cy + rand(-18, 18), vx: rand(-12, 12), vy: rand(-12, 12), life: rand(1.5, 2.5), size: rand(1.4, 2.2), color: "#d8ff6a", glow: true, wobble: 40, drag: 0.995 });
      break;
    case "petals":
      if (Math.random() < 0.7)
        add({ x: cx + rand(-6, 6), y: y + rand(0, h), vx: rand(-20, 20), vy: rand(10, 30), life: rand(1.2, 1.8), size: rand(2.5, 4), color: pick(["#ffc4d6", "#ffadc6", "#ffe0ea"]), shape: "petal", gravity: 30, vr: rand(-4, 4), wobble: 40, drag: 0.99 });
      break;
  }
}

/** Current theme colours as CSS colour strings, for particles. */
export function readPalette(): Palette {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => `rgb(${css.getPropertyValue(name).trim().split(/\s+/).join(",")})`;
  return { fg: v("--fg"), accent: v("--accent"), muted: v("--muted") };
}
