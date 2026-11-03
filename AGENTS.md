<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes. APIs, conventions, and file structure may all differ from your training data. Before changing framework-level code (routing, caching, server actions, config), read the relevant guide in `node_modules/next/dist/docs/` and heed deprecation notices.

This block is written and re-added by `next dev` (see `node_modules/next/dist/server/lib/generate-agent-files.js`). Committing it with your work keeps the tree clean.

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

- Guest names are never sent to a visitor who is not signed up as coming. The rule lives in `getBringList` in `src/server/guest.ts`. Do not add another query that returns names.
- Only the host sees the full guest list and party sizes.
- The browser never talks to the database. `src/db/index.ts` is server-only.

## More detail

- [Architecture and code layout](docs/architecture.md)
- [Local development](docs/local-dev.md)
- [Database and migrations](docs/database.md)
- [Deploy (Railway)](docs/deploy.md)
