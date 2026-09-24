# Contributing to Inktype

Thanks for helping! Inktype is small and friendly — issues, bug reports, ideas and pull requests
are all welcome.

## Ground rules

- **Free forever.** Features are never gated, metered or monetized.
- **No tracking.** Don't add analytics, telemetry, third-party scripts, remote fonts or anything
  that makes the browser contact a third party. External data goes through the Inktype server.
- **The text is the product.** UI should stay quiet and typographic. When in doubt, remove chrome.
- **Local first.** Everything must work without an account and, where possible, offline.

## Getting set up

```bash
pnpm install
cp apps/web/.env.example apps/web/.env
pnpm db:migrate
pnpm dev
```

## Before you open a pull request

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e   # needs: pnpm --filter @inktype/web exec playwright install chromium
```

CI runs the same checks on every push.

## Where things live

- Typing, pagination, stats and data merging belong in `packages/core`. Keep it framework-free and
  add unit tests in `packages/core/test` for any behaviour change.
- React UI lives in `apps/web/src/components`; pages and API routes in `apps/web/src/app`.
- Database changes: edit `apps/web/prisma/schema.prisma`, then run
  `pnpm db:migrate --name <change>` and commit the generated migration.

## Code style

- TypeScript strict mode; avoid `any`.
- Prettier settings are in `.prettierrc` (100 columns, double quotes, trailing commas).
- Comment the _why_, not the _what_. Every module starts with a short explanation of its role.
- Colors come from theme tokens (`bg`, `fg`, `muted`, `accent`, `error`, `surface`, `line`) —
  never hard-code colors in components, so custom themes keep working.

## Commit messages

Short imperative subject (“Add sepia theme”, “Fix cursor drift on resize”), with a body explaining
the reasoning when it isn't obvious.

## Reporting bugs

Please include your browser, OS, keyboard layout (and whether you used a touch keyboard), and the
book or text you were typing when it happened.
