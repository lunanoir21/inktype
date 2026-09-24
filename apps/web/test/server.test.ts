import { describe, expect, it } from "vitest";
import { buildQuery, parseOpds } from "@/lib/catalog.server";
import { isPrivateAddress } from "@/lib/import.server";
import { hashPassword, validateCredentials, verifyPassword } from "@/lib/auth.server";
import { hexToRgb } from "@/lib/themes";
import { displayAuthor } from "@/lib/utils";

describe("catalog", () => {
  it("builds Gutenberg query syntax", () => {
    expect(buildQuery({ search: "war and peace", topic: "s.history", language: "en" })).toBe(
      "war and peace s.history l.en",
    );
    expect(buildQuery({ topic: "evil(); drop", language: "english" })).toBe("");
  });

  it("parses OPDS entries and skips navigation", () => {
    const xml = `<feed><link rel="next" href="x"/>
      <entry><id>https://www.gutenberg.org/ebooks/search.opds/?sort=x</id><title>Sort</title></entry>
      <entry><id>https://www.gutenberg.org/ebooks/1342.opds</id><title>Pride &amp; Prejudice</title><content type="text">Jane Austen</content></entry>
    </feed>`;
    const { books, hasNext } = parseOpds(xml);
    expect(hasNext).toBe(true);
    expect(books).toHaveLength(1);
    expect(books[0]).toMatchObject({ id: 1342, title: "Pride & Prejudice", author: "Jane Austen" });
  });
});

describe("url import guard", () => {
  it.each([
    ["127.0.0.1", true],
    ["10.1.2.3", true],
    ["172.20.0.1", true],
    ["192.168.1.1", true],
    ["169.254.169.254", true],
    ["::1", true],
    ["fd00::1", true],
    ["::ffff:127.0.0.1", true],
    ["93.184.216.34", false],
    ["2606:4700::1111", false],
  ])("%s private=%s", (ip, expected) => {
    expect(isPrivateAddress(ip)).toBe(expected);
  });
});

describe("auth", () => {
  it("hashes and verifies passwords", async () => {
    const hash = await hashPassword("correct horse");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("correct horse", hash)).toBe(true);
    expect(await verifyPassword("wrong horse", hash)).toBe(false);
  });

  it("validates credentials", () => {
    expect(validateCredentials("ab", "longenough")).toMatch(/Username/);
    expect(validateCredentials("reader", "short")).toMatch(/Password/);
    expect(validateCredentials("reader_1", "longenough")).toBeNull();
  });
});

describe("helpers", () => {
  it("converts hex colors", () => {
    expect(hexToRgb("#fff")).toEqual([255, 255, 255]);
    expect(hexToRgb("1d2021")).toEqual([29, 32, 33]);
  });
  it("formats Gutenberg author names", () => {
    expect(displayAuthor("Austen, Jane")).toBe("Jane Austen");
  });
});

describe("wikisource", async () => {
  const { extractWikisourceHtml } = await import("@/lib/wikisource.server");
  it("keeps the work and drops headers, notices and licences", () => {
    const html = `<div class="mw-parser-output">
      <div id="headerContainer" class="ws-noexport"><span id="header_title_text">Kaşağı</span>
        <span id="header_author_text"><span class="fn">Ömer Seyfettin</span></span></div>
      <table class="ambox"><tr><td>Bu çalışmanın düzen ve biçim olarak…</td></tr></table>
      <p>Bu hikâyeyi bana annem anlatırdı.</p><p>Çocukluk&nbsp;günleri.</p>
      <div class="licenseContainer">Kamu malı</div></div>`;
    const out = extractWikisourceHtml(html);
    expect(out.author).toBe("Ömer Seyfettin");
    expect(out.text).toBe("Bu hikâyeyi bana annem anlatırdı.\n\nÇocukluk günleri.");
  });

  it("cuts licence and reference sections and stray notices", async () => {
    const { cleanWikisourceText } = await import("@/lib/wikisource.server");
    const text = [
      "“",
      "→Benzer başlıklı diğer eserlere bakınız.",
      "Bu çalışmanın düzen ve biçim olarak Vikikaynak standartlarına ulaşması için elden geçirilmesi gerekmektedir.",
      "Harici dosya",
      "Ses",
      "Ela Gözlü Nazlı Dilber, Mülkiye Toper. (TRT Dinle)",
      "Korkma, sönmez bu şafaklarda yüzen al sancak;[1]",
      "Bu maddede yer alan eserin telif bilgisi belirsizdir.",
      "Bu eser, kültürel öneminden ötürü kamuya maledilmiştir.",
    ].join("\n\n");
    expect(cleanWikisourceText(text)).toBe("Korkma, sönmez bu şafaklarda yüzen al sancak;");
  });
});
