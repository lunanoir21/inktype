"use client";

/**
 * The client-side store. All reader data lives in one `InktypeData` document
 * persisted to localStorage — no account required. When the reader signs in to
 * a self-hosted server, the same document is merged with the server copy.
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  emptyData,
  sanitizeData,
  type BookProgress,
  type CustomText,
  type InktypeData,
  type PageSession,
  type Settings,
} from "@inktype/core";
import { uid } from "./utils";

export { STORAGE_KEY } from "./storage-key";
import { STORAGE_KEY } from "./storage-key";

interface StoreState {
  data: InktypeData;
  hydrated: boolean;
  updateSettings: (patch: Partial<Settings>) => void;
  saveProgress: (progress: Omit<BookProgress, "updatedAt">) => void;
  recordSession: (session: PageSession) => void;
  addCustomText: (text: { title: string; body: string; sourceUrl?: string }) => string;
  updateCustomText: (id: string, patch: Partial<Pick<CustomText, "title" | "body">>) => void;
  deleteCustomText: (id: string) => void;
  replaceData: (data: InktypeData) => void;
  resetAll: () => void;
}

const now = () => new Date().toISOString();

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      data: emptyData(),
      hydrated: false,

      updateSettings: (patch) =>
        set((s) => ({
          data: { ...s.data, settings: { ...s.data.settings, ...patch, updatedAt: now() } },
        })),

      saveProgress: (progress) =>
        set((s) => ({
          data: {
            ...s.data,
            lastBookKey: progress.bookKey,
            progress: { ...s.data.progress, [progress.bookKey]: { ...progress, updatedAt: now() } },
          },
        })),

      recordSession: (session) =>
        set((s) => ({ data: { ...s.data, sessions: [...s.data.sessions, session] } })),

      addCustomText: ({ title, body, sourceUrl }) => {
        const id = uid();
        const text: CustomText = { id, title, body, sourceUrl, createdAt: now(), updatedAt: now() };
        set((s) => ({ data: { ...s.data, customTexts: [text, ...s.data.customTexts] } }));
        return id;
      },

      updateCustomText: (id, patch) =>
        set((s) => ({
          data: {
            ...s.data,
            customTexts: s.data.customTexts.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: now() } : t)),
          },
        })),

      deleteCustomText: (id) =>
        set((s) => {
          const progress = { ...s.data.progress };
          delete progress[`custom:${id}`];
          return {
            data: {
              ...s.data,
              progress,
              customTexts: s.data.customTexts.filter((t) => t.id !== id),
              deletedCustomTexts: [...s.data.deletedCustomTexts, id],
              lastBookKey: s.data.lastBookKey === `custom:${id}` ? null : s.data.lastBookKey,
            },
          };
        }),

      replaceData: (data) => set({ data: sanitizeData(data) }),

      resetAll: () => set({ data: emptyData() }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      // Rehydrated from Providers after mount, so server and first client render match.
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ data: s.data }),
      merge: (persisted, current) => ({
        ...current,
        data: sanitizeData((persisted as { data?: unknown } | undefined)?.data),
      }),
      onRehydrateStorage: () => () => {
        useStore.setState({ hydrated: true });
      },
    },
  ),
);

/** Settings selector shorthand. */
export const useSettings = () => useStore((s) => s.data.settings);
