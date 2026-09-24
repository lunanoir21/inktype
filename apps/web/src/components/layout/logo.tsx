/** Wordmark: the name set in the reading serif, with an ink drop for the dot. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={className}>
      <span className="font-serif text-[1.15rem] font-medium italic tracking-tight">Inktype</span>
      <span aria-hidden className="ml-0.5 inline-block h-[0.4rem] w-[0.4rem] -translate-y-px rounded-full bg-accent" />
    </span>
  );
}
