"use client";

import { paginate } from "@inktype/core";

export interface LoadedBook {
  id: number;
  title: string;
  author: string;
  language: string;
  text: string;
}

const pageCache = new Map<string, string[]>();

/** Paginate once per book per session (pagination is deterministic). */
export function pagesFor(key: string, text: string): string[] {
  const hit = pageCache.get(key);
  if (hit) return hit;
  const pages = paginate(text);
  pageCache.set(key, pages);
  return pages;
}

export async function loadGutenbergBook(id: number): Promise<LoadedBook> {
  const res = await fetch(`/api/books/${id}/text`);
  const json = (await res.json().catch(() => ({}))) as LoadedBook & { error?: string };
  if (!res.ok) throw new Error(json.error ?? "Could not load this book.");
  return json;
}

export async function loadWikisourceWork(lang: string, title: string): Promise<LoadedBook> {
  const res = await fetch(`/api/wikisource/text?${new URLSearchParams({ lang, title })}`);
  const json = (await res.json().catch(() => ({}))) as {
    title?: string;
    author?: string;
    language?: string;
    text?: string;
    error?: string;
  };
  if (!res.ok || !json.text) throw new Error(json.error ?? "Could not load this work.");
  return { id: 0, title: json.title ?? title, author: json.author ?? "", language: json.language ?? lang, text: json.text };
}

const warmed = new Set<string>();

/**
 * Start downloading a book's text before it is opened (on hover/focus/touch).
 * The server caches it and the browser keeps the response, so opening the
 * book right after is instant.
 */
export function warmBook(bookKey: string): void {
  if (warmed.has(bookKey)) return;
  warmed.add(bookKey);
  let url: string | null = null;
  const g = /^gutenberg:(\d+)$/.exec(bookKey);
  if (g) url = `/api/books/${g[1]}/text`;
  const p = /^pga:(\d{7})$/.exec(bookKey);
  if (p) url = `/api/pga/${p[1]}/text`;
  const w = /^wikisource:(\w+):(.+)$/.exec(bookKey);
  if (w) url = `/api/wikisource/text?${new URLSearchParams({ lang: w[1]!, title: w[2]! })}`;
  if (url) fetch(url, { priority: "low" } as RequestInit).catch(() => warmed.delete(bookKey));
}

export async function loadPgaBook(id: string): Promise<LoadedBook> {
  const res = await fetch(`/api/pga/${id}/text`);
  const json = (await res.json().catch(() => ({}))) as LoadedBook & { error?: string };
  if (!res.ok) throw new Error(json.error ?? "Could not load this book.");
  return json;
}
