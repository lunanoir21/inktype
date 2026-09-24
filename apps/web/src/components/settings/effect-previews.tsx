"use client";

/**
 * Option tiles that show what an effect does before you pick it. Hovering or
 * focusing a tile plays a small live demo on the tile itself; clicking selects
 * the effect and replays the demo (so it also works on touch screens).
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CursorStyle } from "@inktype/core";
import { cn } from "@/lib/utils";
import { CSS_TYPING_EFFECTS, type EffectInfo } from "@/lib/effects";
import { cursorTrail, readPalette, typingBurst } from "@/components/effects/fx";
import { Background } from "@/components/effects/background";
import { useT } from "@/lib/i18n";
import { cursorBox } from "@/lib/cursor-geometry";
import type { MessageKey } from "@/lib/i18n/messages";

type Kind = "typing" | "cursor" | "background";

const WORD = "Inktype";
const CSS_ONLY = new Set(["typewriter", "glow", "crunch", "float", "corrupt"]);

/** True while hovered, focused, or for a few seconds after a click. */
function usePlaying() {
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const [clicked, setClicked] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const replay = useCallback(() => {
    setClicked(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setClicked(false), 3500);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return {
    playing: hover || focus || clicked,
    replay,
    handlers: {
      onMouseEnter: () => setHover(true),
      onMouseLeave: () => setHover(false),
      onFocus: () => setFocus(true),
      onBlur: () => setFocus(false),
    },
  };
}

export function EffectTiles({
  kind,
  options,
  value,
  onChange,
  themeKey,
}: {
  kind: Kind;
  options: EffectInfo[];
  value: string;
  onChange: (id: string) => void;
  themeKey: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {options.map((o) => (
        <EffectTile
          key={o.id}
          kind={kind}
          effect={o}
          active={value === o.id}
          onSelect={() => onChange(o.id)}
          themeKey={themeKey}
        />
      ))}
    </div>
  );
}

function EffectTile({
  kind,
  effect,
  active,
  onSelect,
  themeKey,
}: {
  kind: Kind;
  effect: EffectInfo;
  active: boolean;
  onSelect: () => void;
  themeKey: string;
}) {
  const { playing, replay, handlers } = usePlaying();
  const t = useT();
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => {
        onSelect();
        replay();
      }}
      {...handlers}
      className={cn(
        "group overflow-hidden rounded-md border text-left transition-colors",
        active ? "border-accent bg-accent/10" : "border-line hover:border-fg/30",
      )}
      data-testid={`effect-${kind}-${effect.id}`}
    >
      <div className="relative h-12 overflow-hidden bg-surface/60" aria-hidden>
        {kind === "typing" && <TypingDemo effect={effect.id} playing={playing} />}
        {kind === "cursor" && <CursorDemo effect={effect.id} playing={playing} />}
        {kind === "background" && <BackgroundDemo kind={effect.id} playing={playing} themeKey={themeKey} />}
      </div>
      <div className={cn("px-2 py-1.5 text-[12px]", active ? "text-fg" : "text-muted group-hover:text-fg")}>
        {t(`fx.${effect.id}` as MessageKey)}
      </div>
    </button>
  );
}

/** Cursor shape tiles: the shape glides across a word on hover. */
export function CursorShapeTiles({
  options,
  value,
  onChange,
}: {
  options: { id: CursorStyle; label: string }[];
  value: CursorStyle;
  onChange: (id: CursorStyle) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {options.map((o) => (
        <CursorShapeTile key={o.id} shape={o.id} label={o.label} active={value === o.id} onSelect={() => onChange(o.id)} />
      ))}
    </div>
  );
}

function CursorShapeTile({ shape, label, active, onSelect }: { shape: CursorStyle; label: string; active: boolean; onSelect: () => void }) {
  const { playing, replay, handlers } = usePlaying();
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => {
        onSelect();
        replay();
      }}
      {...handlers}
      className={cn(
        "group overflow-hidden rounded-md border text-left transition-colors",
        active ? "border-accent bg-accent/10" : "border-line hover:border-fg/30",
      )}
    >
      <div className="h-11 overflow-hidden bg-surface/60 text-[15px]" aria-hidden>
        <CursorDemo effect="none" playing={playing} shape={shape} />
      </div>
      <div className={cn("px-2 py-1 text-center text-[11px] uppercase tracking-wide", active ? "text-fg" : "text-muted group-hover:text-fg")}>
        {label}
      </div>
    </button>
  );
}

/* ----------------------------------------------------------------- typing */

function TypingDemo({ effect, playing }: { effect: string; playing: boolean }) {
  const [typed, setTyped] = useState(playing ? 0 : WORD.length);
  const letters = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (!playing) {
      setTyped(WORD.length);
      return;
    }
    setTyped(0);
    let n = 0;
    const id = setInterval(() => {
      n = n >= WORD.length + 5 ? 0 : n + 1; // pause at the end, then loop
      setTyped(Math.min(n, WORD.length));
    }, 170);
    return () => clearInterval(id);
  }, [playing]);

  // Play the effect on the letter that was just typed.
  useLayoutEffect(() => {
    if (!playing || typed === 0 || effect === "none") return;
    const el = letters.current[typed - 1];
    if (!el) return;
    if (CSS_TYPING_EFFECTS.has(effect)) {
      const cls = `fx-${effect}`;
      el.classList.remove(cls);
      void el.offsetWidth;
      el.classList.add(cls);
      el.addEventListener("animationend", () => el.classList.remove(cls), { once: true });
    }
    if (!CSS_ONLY.has(effect)) {
      const r = el.getBoundingClientRect();
      typingBurst(effect, r.left + r.width / 2, r.bottom - r.height * 0.25, r.height, readPalette());
    }
  }, [typed, playing, effect]);

  return (
    <div className="flex h-full items-center justify-center font-serif text-base font-bold">
      {Array.from(WORD, (ch, i) => (
        <span
          key={i}
          ref={(el) => {
            letters.current[i] = el;
          }}
          className={i < typed ? "text-fg" : "text-muted/60"}
        >
          {ch}
        </span>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------- cursor */

const HIGHLIGHT_SHAPES = new Set<CursorStyle>(["high", "hunder", "hdot"]);

export function CursorDemo({ effect, playing, shape = "box" }: { effect: string; playing: boolean; shape?: CursorStyle }) {
  const [pos, setPos] = useState(0);
  const letters = useRef<(HTMLSpanElement | null)[]>([]);
  const cursor = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!playing) {
      setPos(0);
      return;
    }
    let n = 0;
    const id = setInterval(() => {
      n = (n + 1) % (WORD.length + 3);
      setPos(Math.min(n, WORD.length - 1));
    }, 180);
    return () => clearInterval(id);
  }, [playing]);

  useLayoutEffect(() => {
    const el = letters.current[pos];
    const c = cursor.current;
    if (!el || !c) return;
    const box = cursorBox(el, shape);
    c.style.transform = `translate(${box.x}px, ${box.y}px)`;
    c.style.width = `${box.w}px`;
    c.style.height = `${box.h}px`;
    if (playing && effect !== "none") {
      const r = el.getBoundingClientRect();
      cursorTrail(effect, r.left, r.top, r.width, r.height, readPalette());
    }
  }, [pos, playing, effect, shape]);

  return (
    <div className="flex h-full items-center justify-center">
      <span className="relative font-serif text-base font-bold text-muted">
        <span
          ref={cursor}
          className={cn(
            "pointer-events-none absolute left-0 top-0 transition-transform duration-150 ease-out",
            shape === "box" && "rounded-[2px] bg-accent/35",
            shape === "ebox" && "rounded-[2px] ring-[1.5px] ring-accent",
            ["line", "under", "hunder", "dot", "hdot"].includes(shape) && "rounded-full bg-accent",
            (shape === "high" || shape === "none") && "hidden",
            effect === "rainbow" && playing && "cursor-rainbow",
          )}
        />
        {Array.from(WORD, (ch, i) => (
          <span
            key={i}
            ref={(el) => {
              letters.current[i] = el;
            }}
            className={cn("relative", i < pos && "text-fg", i === pos && HIGHLIGHT_SHAPES.has(shape) && "text-accent")}
          >
            {ch}
          </span>
        ))}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------- background */

function BackgroundDemo({ kind, playing, themeKey }: { kind: string; playing: boolean; themeKey: string }) {
  if (kind === "none") {
    return <div className="flex h-full items-center justify-center font-serif text-sm text-muted">Aa</div>;
  }
  return (
    <div className="relative h-full w-full bg-bg">
      {/* Only animate while previewing; otherwise show a hint. */}
      {playing ? (
        <Background kind={kind} themeKey={themeKey} />
      ) : (
        <div className="absolute bottom-1 right-1.5 text-[10px] text-muted/70">▶</div>
      )}
      <div className="absolute inset-0 flex items-center justify-center font-serif text-sm font-bold text-fg/80">Aa</div>
    </div>
  );
}
