import { describe, expect, it } from "vitest";
import {
  backspace,
  backspaceWord,
  charsMatch,
  createEngine,
  IDLE_CAP_MS,
  liveStats,
  typeChar,
  typeString,
} from "../src/engine";

describe("typing engine — block mode", () => {
  it("advances on correct input and finishes at the end", () => {
    const s = typeString(createEngine("abc"), "abc", 0);
    expect(s.pos).toBe(3);
    expect(s.finished).toBe(true);
    expect(s.errors).toBe(0);
    expect(s.marks).toEqual(["correct", "correct", "correct"]);
  });

  it("does not move past an error and records it", () => {
    let s = createEngine("abc");
    s = typeChar(s, "x", 0);
    expect(s.pos).toBe(0);
    expect(s.marks[0]).toBe("incorrect");
    expect(s.errors).toBe(1);
    expect(s.keyMisses).toEqual({ a: 1 });
    s = typeChar(s, "a", 10);
    expect(s.pos).toBe(1);
    expect(s.marks[0]).toBe("correct");
    expect(s.hadError[0]).toBe(true);
  });

  it("backspace clears the pending error mark but does not move", () => {
    let s = typeChar(createEngine("ab"), "a", 0);
    s = typeChar(s, "x", 1);
    s = backspace(s, 2);
    expect(s.pos).toBe(1);
    expect(s.marks[1]).toBe("pending");
  });

  it("never finishes on a wrong final character", () => {
    const s = typeString(createEngine("ab"), "ax", 0);
    expect(s.finished).toBe(false);
  });
});

describe("typing engine — advance mode", () => {
  it("moves past errors and allows fixing with backspace", () => {
    let s = createEngine("abc", { mode: "advance" });
    s = typeString(s, "ax", 0);
    expect(s.pos).toBe(2);
    expect(s.marks[1]).toBe("incorrect");
    expect(s.typed[1]).toBe("x");
    s = backspace(s, 1);
    expect(s.pos).toBe(1);
    expect(s.marks[1]).toBe("pending");
    s = typeString(s, "bc", 2);
    expect(s.finished).toBe(true);
    expect(s.errors).toBe(1);
    expect(s.hadError[1]).toBe(true);
  });

  it("finishes even with errors on the last char", () => {
    const s = typeString(createEngine("ab", { mode: "advance" }), "ax", 0);
    expect(s.finished).toBe(true);
  });

  it("ctrl+backspace removes the previous word", () => {
    let s = typeString(createEngine("one two three", { mode: "advance" }), "one tw", 0);
    s = backspaceWord(s, 1);
    expect(s.pos).toBe(4);
    s = backspaceWord(s, 2);
    expect(s.pos).toBe(0);
  });

  it("cannot backspace before a resumed start position", () => {
    let s = createEngine("hello world", { mode: "advance", startPos: 6 });
    s = backspace(s, 0);
    expect(s.pos).toBe(6);
  });
});

describe("matching", () => {
  it("accepts space or enter for paragraph breaks", () => {
    expect(charsMatch(" ", "\n")).toBe(true);
    expect(charsMatch("\n", "\n")).toBe(true);
    expect(charsMatch("a", "\n")).toBe(false);
  });
  it("optionally ignores accents and case", () => {
    expect(charsMatch("e", "é")).toBe(false);
    expect(charsMatch("e", "é", { ignoreAccents: true })).toBe(true);
    expect(charsMatch("a", "A", { ignoreCase: true })).toBe(true);
  });
});

describe("timing and stats", () => {
  it("caps idle gaps", () => {
    let s = typeChar(createEngine("abc"), "a", 0);
    s = typeChar(s, "b", 60_000);
    expect(s.activeMs).toBe(IDLE_CAP_MS);
  });

  it("computes wpm from correct chars over active time", () => {
    // 10 chars in 2 seconds -> 2 words / (1/30 min) = 60 wpm
    let s = createEngine("abcdefghijk");
    for (let i = 0; i <= 10; i++) s = typeChar(s, "abcdefghijk"[i]!, i * 200);
    const stats = liveStats(s, 2000);
    expect(Math.round(stats.wpm)).toBe(66); // 11 chars / 2s
    expect(stats.accuracy).toBe(1);
  });

  it("resumed prefix does not count towards wpm", () => {
    let s = createEngine("hello world", { startPos: 6 });
    s = typeString(s, "world", 0);
    expect(s.finished).toBe(true);
    expect(s.keystrokes).toBe(5);
  });
});

describe("pause/resume", () => {
  it("does not count paused time", async () => {
    const { pauseTiming, resumeTiming } = await import("../src/engine");
    let s = typeChar(createEngine("abcd"), "a", 0);
    s = typeChar(s, "b", 1000);
    s = pauseTiming(s, 2000);
    s = resumeTiming(s, 600_000);
    s = typeChar(s, "c", 601_000);
    expect(s.activeMs).toBe(3000);
  });
});

describe("skip punctuation", () => {
  it("types punctuation automatically", () => {
    let s = createEngine('"Hi," she said.', { skipPunctuation: true });
    expect(s.pos).toBe(1);
    s = typeString(s, "Hi", 0);
    expect(s.pos).toBe(5); // skipped ',' and '"'
    s = typeString(s, " she said", 1);
    expect(s.finished).toBe(true);
    expect(s.keystrokes).toBe(11);
  });

  it("backspace removes auto-typed punctuation too", () => {
    let s = createEngine("ab, cd", { skipPunctuation: true, mode: "advance" });
    s = typeString(s, "ab", 0);
    expect(s.pos).toBe(3);
    s = backspace(s, 1);
    expect(s.pos).toBe(1);
  });
});
