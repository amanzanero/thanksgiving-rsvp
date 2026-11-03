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

Railway deploys `main` automatically. Before each deploy it runs `scripts/migrate.mjs` and `scripts/seed.mjs` (see `railway.json`), then checks `/api/health`. The app needs three variables: `DATABASE_URL` (a reference to the Postgres service), `SESSION_SECRET`, and `HOST_PASSPHRASE`.

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
