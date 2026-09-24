/**
 * Runs once when the server starts. Warms the library search caches so the
 * first visit to the library (and every genre / author shortcut) is instant.
 * Set PREWARM_CATALOG=false to skip it.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.PREWARM_CATALOG === "false") return;
  const [{ prewarmCatalog }, { prewarmWikisource }, { GENRES, TURKISH_AUTHORS }] = await Promise.all([
    import("./lib/catalog.server"),
    import("./lib/wikisource.server"),
    import("./lib/catalog"),
  ]);
  // Don't delay start-up; warm in the background.
  setTimeout(() => {
    void prewarmCatalog(GENRES.map((g) => g.topic));
    void prewarmWikisource(TURKISH_AUTHORS);
  }, 2000);
}
