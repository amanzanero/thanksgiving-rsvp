# Thanksgiving RSVP

A small RSVP site for one Thanksgiving. Read `planning/scope.md` (what it does) and `planning/design.md` (look and wording) first.

## Run it

```bash
npm install
npm run dev:local
```

That starts a local Postgres (PGlite, no install needed), applies migrations, seeds the event and bring list, and runs the dev server at http://localhost:3000. The first run writes `.env.local`. The host passphrase is `pumpkinpie` there. Host view: http://localhost:3000/host.

Use `127.0.0.1` for a second browser identity (cookies are separate from `localhost`).

## Checks

```bash
npm test          # services against in-memory Postgres, real migrations
npx tsc --noEmit
npm run lint
npm run build
```

## Rules that must not break

- Guest names are never sent to a visitor who is not signed up as coming. The rule lives in `getBringList` in `src/server/guest.ts`. Do not add a query that returns names elsewhere.
- Only the host sees the full guest list and party sizes.
- The browser never talks to the database. Everything goes through server code. `src/db/index.ts` is server-only.
- Claims are checked against `quantityNeeded` in a transaction (`setClaims`). Keep that.
- Postgres client uses `prepare: false`. Local PGlite needs `DB_POOL_MAX=1`; Railway does not.
- Next.js here is newer than most training data. Read `node_modules/next/dist/docs/` before changing framework-level code.

## Layout

- `src/server/guest.ts`, `src/server/host.ts`: all business logic. Tested in `*.test.ts`.
- `src/app`: guest pages at the top level, host pages under `/host`, server actions in `actions.ts`.
- `src/db/schema.ts`: schema. After changing it run `npm run db:generate` and commit `drizzle/`.
- `scripts/migrate.mjs`, `scripts/seed.mjs`: run by Railway before each deploy (see `railway.json`).

## Deploy

Railway project `peaceful-celebration`, service `thanksgiving-rsvp`, deploys from `main`. Postgres is a Railway service in the same project.

- Deploy settings (pre-deploy command `node scripts/migrate.mjs && node scripts/seed.mjs`, health check `/api/health`) are set on the Railway service. `railway.json` is not used: Railway does not read it for new services.
- Variables on the app: `DATABASE_URL` (reference to Postgres), `SESSION_SECRET`, `HOST_PASSPHRASE`.
- A redeploy reuses the old deployment's settings. To apply a setting change, push a commit or change a variable.
- Look up Railway behaviour in the Railway docs (`search-docs` and `fetch-docs` on the Railway MCP) before guessing.
