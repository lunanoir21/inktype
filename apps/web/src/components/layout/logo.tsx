import { cn } from "@/lib/utils";

/**
 * The Inktype mark: a keycap holding a serif dotless i, whose dot is the
 * cursor. Drawn with theme colours so it fits every theme.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" aria-hidden className={cn("h-6 w-6", className)}>
      <rect x="12" y="12" width="76" height="76" rx="18" stroke="currentColor" strokeWidth="7" />
      <path d="M15 68h70v4a14 14 0 0 1-14 14H29a14 14 0 0 1-14-14z" fill="currentColor" opacity=".16" />
      <path d="M40 38h14v26h6v6H38v-6h6V44h-4z" fill="currentColor" />
      <circle cx="49" cy="26" r="6.5" fill="rgb(var(--accent))" />
    </svg>
  );
}

/** Mark plus wordmark. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className="font-serif text-[1.15rem] font-semibold italic tracking-tight">Inktype</span>
    </span>
  );
}
