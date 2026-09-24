import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Random id that works in every browser (crypto.randomUUID needs a secure context). */
export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto && globalThis.isSecureContext) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** "Austen, Jane" -> "Jane Austen" */
export function displayAuthor(name: string): string {
  const parts = name.split(", ");
  if (parts.length === 2 && !/\d/.test(parts[1] ?? "")) return `${parts[1]} ${parts[0]}`;
  return name;
}
