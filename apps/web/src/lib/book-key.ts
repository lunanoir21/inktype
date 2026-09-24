/**
 * Book keys identify a text across progress, sessions and URLs:
 *   gutenberg:<id>          e.g. gutenberg:1342
 *   wikisource:<lang>:<title>  e.g. wikisource:tr:Kaşağı
 *   custom:<uuid>
 */

export function bookHref(bookKey: string): string {
  const i = bookKey.indexOf(":");
  const source = bookKey.slice(0, i);
  const rest = bookKey.slice(i + 1);
  return `/read/${source}/${encodeURIComponent(rest)}`;
}
