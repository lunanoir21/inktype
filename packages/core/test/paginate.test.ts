import { describe, expect, it } from "vitest";
import { paginate, splitSentences } from "../src/paginate";
import { normalizeTypography, toParagraphs } from "../src/normalize";
import { stripGutenbergBoilerplate } from "../src/gutenberg";

const lorem = (n: number) =>
  Array.from({ length: n }, (_, i) => `This is sentence number ${i + 1}, and it has a few words in it.`).join(" ");

describe("normalize", () => {
  it("maps typographic characters to typeable ones", () => {
    expect(normalizeTypography("“Hi” — it’s…")).toBe('"Hi" -- it\'s...');
  });
  it("joins hard-wrapped lines and splits paragraphs", () => {
    expect(toParagraphs("one\ntwo\n\nthree\n\n* * *\n")).toEqual(["one two", "three"]);
  });
});

describe("splitSentences", () => {
  it("splits on terminal punctuation but not abbreviations", () => {
    expect(splitSentences('Mr. Darcy bowed. "Indeed!" she said. J. Smith left.')).toEqual([
      "Mr. Darcy bowed.",
      '"Indeed!"',
      "she said.",
      "J. Smith left.",
    ]);
  });
});

describe("paginate", () => {
  it("creates pages near the target size ending at sentence breaks", () => {
    const pages = paginate(lorem(60));
    expect(pages.length).toBeGreaterThan(5);
    for (const page of pages.slice(0, -1)) {
      expect(page.length).toBeGreaterThan(200);
      expect(page.length).toBeLessThan(600);
      expect(page.endsWith(".")).toBe(true);
    }
  });

  it("is deterministic", () => {
    expect(paginate(lorem(40))).toEqual(paginate(lorem(40)));
  });

  it("keeps paragraph breaks as newlines", () => {
    const pages = paginate("First paragraph here.\n\nSecond paragraph here.");
    expect(pages).toEqual(["First paragraph here.\nSecond paragraph here."]);
  });

  it("splits very long sentences", () => {
    const long = Array.from({ length: 200 }, () => "word").join(" ") + ".";
    const pages = paginate(long);
    expect(pages.length).toBeGreaterThan(1);
    for (const p of pages) expect(p.length).toBeLessThanOrEqual(595);
  });

  it("loses no words", () => {
    const text = lorem(50);
    const joined = paginate(text).join(" ").replace(/\n/g, " ");
    expect(joined.split(/\s+/).length).toBe(text.split(/\s+/).length);
  });
});

describe("gutenberg", () => {
  it("strips header and footer", () => {
    const raw = `Header junk\n*** START OF THE PROJECT GUTENBERG EBOOK PRIDE ***\n\nIt is a truth.\n\n*** END OF THE PROJECT GUTENBERG EBOOK PRIDE ***\nLicense`;
    expect(stripGutenbergBoilerplate(raw)).toBe("It is a truth.");
  });
});

describe("skipFrontMatter", async () => {
  const { skipFrontMatter } = await import("../src/gutenberg");
  const body = "It was a dark night. ".repeat(400);
  it("skips title page and table of contents", () => {
    const text = `THE BOOK\n\nPUBLISHER\n\nCONTENTS\n\nCHAPTER I. The Start\nCHAPTER II. The Middle\nCHAPTER III. The End\n\nCHAPTER I.\n\n${body}\n\nCHAPTER II.\n\n${body}`;
    expect(skipFrontMatter(text).startsWith("CHAPTER I.\n\nIt was")).toBe(true);
  });
  it("leaves texts without chapters untouched", () => {
    expect(skipFrontMatter(body)).toBe(body);
  });
});

describe("illustrations", () => {
  it("removes illustration blocks but keeps chapter headings inside them", () => {
    const raw = "[Illustration: PRIDE\n\n\nChapter I.]\n\nIt is a truth. [Illustration: A cat] Yes.";
    expect(stripGutenbergBoilerplate(raw)).toBe("Chapter I.\n\n\nIt is a truth.  Yes.");
  });
});
