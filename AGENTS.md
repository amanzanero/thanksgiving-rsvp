<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Thanksgiving RSVP

A small RSVP site for one Thanksgiving (Next.js, Drizzle, Postgres). What it does: `planning/scope.md`. Look and wording: `planning/design.md`.

## Commands

```bash
npm run dev:local   # local Postgres (PGlite), migrations, seed, dev server on :3000
npm test            # services against in-memory Postgres, real migrations
npx tsc --noEmit
npm run lint
npm run build
```

## Rules that must not break

- Anyone with the link sees who is bringing what, but only as first name and last initial ("Andrew M."). This is decided. It lives in `getBringList` and `shortName` in `src/server/guest.ts`. Full names stay out of public queries.
- Only the host sees the full guest list and party sizes.
- The browser never talks to the database. `src/db/index.ts` is server-only.

## More detail

- [Architecture and code layout](docs/architecture.md)
- [Local development](docs/local-dev.md)
- [Database and migrations](docs/database.md)
- [Deploy (Railway)](docs/deploy.md)
