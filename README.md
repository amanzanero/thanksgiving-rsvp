# thanksgiving-rsvp

A small RSVP site for one Thanksgiving. See `planning/scope.md` for what it does and `planning/design.md` for the design.

## Run it locally

```bash
npm install
npm run dev:local
```

That starts a local Postgres (PGlite, nothing to install), applies migrations, seeds the event and bring list, and runs the dev server. The first run writes `.env.local`; the host passphrase there is `pumpkinpie`.

Guests use http://localhost:3000. The host view is http://localhost:3000/host.

## Deploy

Railway deploys `main` automatically (project `peaceful-celebration`, service `thanksgiving-rsvp`, Postgres in the same project).

Deploy settings live on the Railway service, not in the repo. This service is new, and Railway no longer reads `railway.json` for new services. On the service:

- **Pre-deploy command:** `node scripts/migrate.mjs && node scripts/seed.mjs`. It runs in its own container before each deploy. Migrations are safe to repeat, and the seed does nothing once an event exists.
- **Health check path:** `/api/health`
- **Variables:** `DATABASE_URL` (reference to the Postgres service), `SESSION_SECRET`, `HOST_PASSPHRASE`.

A **redeploy reuses the previous deployment's settings**. To apply a changed setting, push a commit or change a variable so Railway starts a fresh deployment.

## Tests

```bash
npm test
```

Tests run the real migrations against an in-memory Postgres.

## Database

Postgres through Drizzle. The schema is in `src/db/schema.ts`. After changing it, run `npm run db:generate` and commit the new file in `drizzle/`.

## Where things are

- `src/server/guest.ts`: sign up, edit, cancel, lookup, and the rule that hides names from visitors who are not signed up.
- `src/server/host.ts`: guest list, merge, bring list editing, event details, change log.
- `src/app`: guest pages at the top level, host pages under `/host`.
