import "server-only";

/**
 * A small stale-while-revalidate cache for slow upstream APIs.
 * - Fresh entries are returned immediately.
 * - Stale entries are returned immediately and refreshed in the background.
 * - Concurrent requests for the same key share one upstream call.
 *
 * Caches live on globalThis under `name`, because Next bundles route handlers
 * and the start-up hook separately; this way they all share one cache.
 */
const store = globalThis as unknown as {
  __inktypeCaches?: Record<string, { entries: Map<string, unknown>; inflight: Map<string, Promise<unknown>> }>;
};

export function swrCache<T>(name: string, options: { freshMs: number; maxAgeMs: number; max: number }) {
  store.__inktypeCaches ??= {};
  const shared = (store.__inktypeCaches[name] ??= { entries: new Map(), inflight: new Map() });
  const entries = shared.entries as Map<string, { at: number; value: T }>;
  const inflight = shared.inflight as Map<string, Promise<T>>;

  const load = (key: string, fetcher: () => Promise<T>): Promise<T> => {
    const running = inflight.get(key);
    if (running) return running;
    const p = fetcher()
      .then((value) => {
        if (entries.size >= options.max) {
          const oldest = entries.keys().next().value;
          if (oldest !== undefined) entries.delete(oldest);
        }
        entries.delete(key);
        entries.set(key, { at: Date.now(), value });
        return value;
      })
      .finally(() => inflight.delete(key));
    inflight.set(key, p);
    return p;
  };

  return {
    async get(key: string, fetcher: () => Promise<T>): Promise<T> {
      const hit = entries.get(key);
      const age = hit ? Date.now() - hit.at : Infinity;
      if (hit && age < options.freshMs) return hit.value;
      if (hit && age < options.maxAgeMs) {
        load(key, fetcher).catch(() => undefined);
        return hit.value;
      }
      return load(key, fetcher);
    },
  };
}
