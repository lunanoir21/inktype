/**
 * Cursor geometry based on real glyph metrics.
 *
 * An inline <span>'s box covers the font's whole content area (its ascent +
 * descent), which is not centred on the visible letters: most fonts reserve
 * more room above than the tallest letter needs. Positioning the cursor on
 * that box makes it look lopsided. Instead we measure the font with canvas —
 * baseline, ascender height and descender depth — and build the cursor from
 * the visible ink, with equal padding above and below.
 */

import type { CursorStyle } from "@inktype/core";

interface Metrics {
  size: number;
  /** Height of ascenders above the baseline (H, d, l …). */
  ascent: number;
  /** Depth of descenders below the baseline (g, p, y …). */
  descent: number;
  /** The font's content-area ascent/descent (what the span box uses). */
  fontAscent: number;
  fontDescent: number;
}

const cache = new Map<string, Metrics>();
let ctx: CanvasRenderingContext2D | null = null;

if (typeof document !== "undefined") {
  // Metrics measured with a fallback font are wrong once the web font arrives.
  document.fonts?.addEventListener?.("loadingdone", () => cache.clear());
}

export function fontMetrics(el: HTMLElement): Metrics {
  const cs = getComputedStyle(el);
  const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const hit = cache.get(font);
  if (hit) return hit;

  const size = parseFloat(cs.fontSize) || 16;
  ctx ??= document.createElement("canvas").getContext("2d");
  let m: Metrics = { size, ascent: size * 0.72, descent: size * 0.22, fontAscent: size * 0.92, fontDescent: size * 0.26 };
  if (ctx) {
    ctx.font = font;
    const tall = ctx.measureText("Hdlkbfh");
    const deep = ctx.measureText("gjpqy");
    m = {
      size,
      ascent: tall.actualBoundingBoxAscent || m.ascent,
      descent: deep.actualBoundingBoxDescent || m.descent,
      fontAscent: tall.fontBoundingBoxAscent || m.fontAscent,
      fontDescent: tall.fontBoundingBoxDescent || m.fontDescent,
    };
  }
  // Only cache once the real font is in use.
  if (!document.fonts || document.fonts.check(font)) cache.set(font, m);
  return m;
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Where to draw a cursor of the given style over a character span, in the
 * span's offset-parent coordinates. `atEnd` places it after the character.
 */
export function cursorBox(el: HTMLElement, style: CursorStyle, atEnd = false): Box {
  const m = fontMetrics(el);
  const spanH = el.offsetHeight;
  // Map font units onto the rendered span (they match up to rounding).
  const scale = spanH / (m.fontAscent + m.fontDescent) || 1;
  const baseline = el.offsetTop + m.fontAscent * scale;
  const pad = Math.max(1, m.size * 0.08);
  const top = baseline - m.ascent - pad;
  const bottom = baseline + m.descent + pad;
  const left = atEnd ? el.offsetLeft + el.offsetWidth : el.offsetLeft;
  const width = atEnd ? 2 : Math.max(el.offsetWidth, m.size * 0.28);
  const bar = Math.max(2, Math.round(m.size * 0.08));

  switch (style) {
    case "line":
      return { x: left - bar / 2, y: top, w: bar, h: bottom - top };
    case "under":
    case "hunder":
      return { x: left, y: baseline + Math.max(2, m.descent * 0.45), w: width, h: bar };
    case "dot":
    case "hdot": {
      const d = Math.max(4, Math.round(m.size * 0.18));
      return { x: left + width / 2 - d / 2, y: top - d - 1, w: d, h: d };
    }
    default:
      // box, ebox (and a hidden reference box for high/none)
      return { x: left - 1, y: top, w: width + 2, h: bottom - top };
  }
}
