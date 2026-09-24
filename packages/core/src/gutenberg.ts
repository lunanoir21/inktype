/**
 * Helpers for Project Gutenberg plain-text files.
 */

const START_MARKERS = [
  /\*{3}\s*START OF (?:THE|THIS) PROJECT GUTENBERG E?BOOK[^*]*\*{3}/i,
  /\*END\*THE SMALL PRINT!/i,
  /START OF THE PROJECT GUTENBERG/i,
];

const END_MARKERS = [
  /\*{3}\s*END OF (?:THE|THIS) PROJECT GUTENBERG E?BOOK/i,
  /End of (?:the )?Project Gutenberg(?:'s)?/i,
  /END OF THE PROJECT GUTENBERG/i,
];

/** Lines that are pure boilerplate and never belong to the book's body. */
const NOISE_LINES = [
  /^\s*produced by .*$/gim,
  /^\s*(?:transcriber'?s? note|e-?text prepared by).*$/gim,
  /^\s*\[?illustration[^\]\n]*\]?\s*$/gim,
];

/**
 * Remove the Project Gutenberg license header and footer, returning only the
 * body of the book. Falls back to the full text when no markers are present.
 */
export function stripGutenbergBoilerplate(raw: string): string {
  let text = raw.replace(/\r\n?/g, "\n");

  for (const marker of START_MARKERS) {
    const match = marker.exec(text);
    if (match) {
      // Skip the rest of the marker line.
      const lineEnd = text.indexOf("\n", match.index + match[0].length);
      text = text.slice(lineEnd === -1 ? match.index + match[0].length : lineEnd + 1);
      break;
    }
  }

  for (const marker of END_MARKERS) {
    const match = marker.exec(text);
    if (match) {
      text = text.slice(0, match.index);
      break;
    }
  }

  // Illustration blocks, possibly spanning lines: "[Illustration: A cat]".
  // Some editions hide the chapter heading inside one; keep that line.
  text = text.replace(/\[Illustration:?([^\]]*)\]/gi, (_, inner: string) => {
    const heading = /^\s*(?:chapter|book|part|stave|letter)\b.*$/im.exec(inner);
    return heading ? `\n${heading[0].trim()}\n` : "";
  });

  for (const noise of NOISE_LINES) text = text.replace(noise, "");
  // Underscore/emphasis markup used by Gutenberg for italics: _word_.
  text = text.replace(/_([^_\n]+)_/g, "$1");

  return text.trim();
}

const CHAPTER_ONE =
  /^[ \t]*(?:CHAPTER|Chapter|BOOK|Book|PART|Part|STAVE|Stave|LETTER|Letter)[ .]+(?:I|1|ONE|One|THE FIRST|The First)\b(?![A-Za-z])[^\n\]]*$/gm;
const ANY_CHAPTER = /^[ \t]*(?:CHAPTER|Chapter|BOOK|Book|PART|Part|STAVE|Stave|LETTER|Letter)[ .]+(?:[IVXLC]+|\d+|[A-Z][a-z]+)\b/m;

/**
 * Skip front matter (title pages, publisher notes, tables of contents, lists
 * of illustrations) by starting at the first real "Chapter I" heading.
 *
 * A heading counts as a table-of-contents entry when another chapter heading
 * follows within a few lines; those are skipped. Only the first 15% of the
 * book is searched, and the text is returned unchanged when nothing matches.
 */
export function skipFrontMatter(text: string): string {
  const head = text.slice(0, Math.floor(text.length * 0.15));
  CHAPTER_ONE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = CHAPTER_ONE.exec(head)) !== null) {
    const end = match.index + match[0].length;
    const isToc = ANY_CHAPTER.test(text.slice(end, end + 700));
    if (!isToc) return match.index > 0 ? text.slice(match.index).trim() : text;
  }
  return text;
}
