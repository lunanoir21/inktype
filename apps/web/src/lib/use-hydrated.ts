"use client";

import { useStore } from "./store";

/**
 * True once localStorage data has been loaded. Pages that render reader data
 * wait for this to avoid a hydration mismatch and a flash of empty state.
 */
export function useHydrated(): boolean {
  return useStore((s) => s.hydrated);
}
