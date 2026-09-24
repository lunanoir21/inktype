"use client";

import { create } from "zustand";

/**
 * Ephemeral UI state (not persisted).
 * - `typing`: the reader is actively typing; app chrome fades out.
 * - `settingsOpen` / `settingsExpanded`: the right-hand settings drawer.
 */
interface UiState {
  typing: boolean;
  setTyping: (typing: boolean) => void;
  settingsOpen: boolean;
  settingsExpanded: boolean;
  openSettings: (open?: boolean) => void;
  toggleExpanded: () => void;
}

export const useUi = create<UiState>()((set) => ({
  typing: false,
  setTyping: (typing) => set((s) => (s.typing === typing ? s : { typing })),
  settingsOpen: false,
  settingsExpanded: false,
  openSettings: (open) =>
    set((s) => {
      const next = open ?? !s.settingsOpen;
      return { settingsOpen: next, settingsExpanded: next ? s.settingsExpanded : false, typing: false };
    }),
  toggleExpanded: () => set((s) => ({ settingsExpanded: !s.settingsExpanded })),
}));
