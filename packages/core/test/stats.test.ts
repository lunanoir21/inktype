import { describe, expect, it } from "vitest";
import { computeStreak, keyStats, series, summarize } from "../src/stats";
import { emptyData, mergeData, sanitizeData } from "../src/data";
import { htmlToText } from "../src/html";
import type { PageSession } from "../src/types";

function session(at: string, extra: Partial<PageSession> = {}): PageSession {
  return {
    id: at,
    at,
    bookKey: "custom:x",
    page: 0,
    chars: 300,
    durationMs: 60_000,
    wpm: 60,
    accuracy: 0.97,
    errors: 3,
    keyHits: { a: 10, space: 5 },
    keyMisses: { a: 2 },
    ...extra,
  };
}

describe("summaries", () => {
  it("time-weights average wpm", () => {
    const s = summarize([session("2026-01-01T10:00:00"), session("2026-01-02T10:00:00", { chars: 600 })]);
    expect(s.avgWpm).toBeCloseTo(90);
    expect(s.pages).toBe(2);
  });

  it("aggregates key stats", () => {
    const k = keyStats([session("2026-01-01T10:00:00")]);
    expect(k.a).toMatchObject({ hits: 10, misses: 2 });
    expect(k.a!.errorRate).toBeCloseTo(2 / 12);
  });
});

describe("streak", () => {
  const now = new Date("2026-03-10T15:00:00");
  it("counts consecutive days including today", () => {
    const s = computeStreak(
      ["2026-03-08T09:00:00", "2026-03-09T09:00:00", "2026-03-10T09:00:00"].map((d) => session(d)),
      now,
    );
    expect(s).toEqual({ current: 3, longest: 3, today: true });
  });
  it("keeps yesterday's streak alive", () => {
    const s = computeStreak([session("2026-03-09T09:00:00")], now);
    expect(s.current).toBe(1);
    expect(s.today).toBe(false);
  });
  it("breaks after a missed day", () => {
    const s = computeStreak([session("2026-03-07T09:00:00")], now);
    expect(s.current).toBe(0);
    expect(s.longest).toBe(1);
  });
});

describe("series", () => {
  it("returns one bucket per period", () => {
    const pts = series([session("2026-03-10T09:00:00")], "week", 4, new Date("2026-03-10T12:00:00"));
    expect(pts).toHaveLength(4);
    expect(pts[3]!.pages).toBe(1);
    expect(pts[0]!.pages).toBe(0);
  });
});

describe("data merge", () => {
  it("unions sessions and takes the latest progress", () => {
    const a = emptyData();
    const b = emptyData();
    a.sessions.push(session("2026-01-01T00:00:00"));
    b.sessions.push(session("2026-01-02T00:00:00"));
    const p = { bookKey: "gutenberg:1", source: "gutenberg" as const, title: "T", author: "A", pos: 0, totalPages: 10, completed: false };
    a.progress["gutenberg:1"] = { ...p, page: 2, updatedAt: "2026-01-01T00:00:00Z" };
    b.progress["gutenberg:1"] = { ...p, page: 5, updatedAt: "2026-01-02T00:00:00Z" };
    const m = mergeData(a, b);
    expect(m.sessions).toHaveLength(2);
    expect(m.progress["gutenberg:1"]!.page).toBe(5);
    expect(mergeData(b, a)).toEqual(m);
  });

  it("does not resurrect deleted custom texts", () => {
    const a = emptyData();
    const b = emptyData();
    const t = { id: "t1", title: "x", body: "y", createdAt: "2026", updatedAt: "2026" };
    a.customTexts.push(t);
    b.deletedCustomTexts.push("t1");
    expect(mergeData(a, b).customTexts).toHaveLength(0);
  });

  it("sanitizes garbage input", () => {
    const d = sanitizeData({ settings: { fontSize: "huge", font: "mono" }, sessions: [1, null] });
    expect(d.settings.fontSize).toBe(24);
    expect(d.settings.font).toBe("jetbrains-mono");
    expect(d.sessions).toEqual([]);
  });
});

describe("htmlToText", () => {
  it("extracts article text and drops scripts", () => {
    const html = `<html><head><title>My &amp; Page</title><script>evil()</script></head>
      <body><nav>Home About</nav><article><h1>Heading</h1><p>This is the first paragraph of the article, it is long enough.</p>
      <p>Second &ldquo;quoted&rdquo; paragraph.</p></article></body></html>`;
    const out = htmlToText(html);
    expect(out.title).toBe("My & Page");
    expect(out.text).toContain("This is the first paragraph");
    expect(out.text).toContain('Second "quoted" paragraph.');
    expect(out.text).not.toContain("evil");
    expect(out.text).not.toContain("Home About");
  });
});

describe("settings migration", () => {
  it("renames legacy values", () => {
    const d = sanitizeData({ settings: { font: "serif", cursorStyle: "caret", theme: "dark" } });
    expect(d.settings).toMatchObject({ font: "literata", cursorStyle: "line", theme: "ink" });
  });
});
