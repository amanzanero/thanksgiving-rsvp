# thanksgiving-rsvp

A small RSVP site for one Thanksgiving. See `planning/scope.md` for what it does and `planning/design.md` for the design.

## Run it locally

There is no Postgres to install. `npm run db:local` starts a local one (PGlite) on port 5433 and keeps its data in `.pglite/`.

```bash
npm install
cp .env.example .env.local
```

Set these in `.env.local`:

```
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5433/postgres
DB_POOL_MAX=1
HOST_PASSPHRASE=pick-something
SESSION_SECRET=any-long-random-string
```

Then, in one terminal:

```bash
npm run db:local
```

and in another:

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

Guests use http://localhost:3000. The host view is http://localhost:3000/host.

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
