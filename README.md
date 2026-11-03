# thanksgiving-rsvp

A small RSVP site for one Thanksgiving. See `planning/scope.md` for what it does and `planning/design.md` for the design.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in DATABASE_URL, HOST_PASSPHRASE, SESSION_SECRET
npm run db:migrate
npm run db:seed
npm run dev
```

## Database

Postgres through Drizzle. The schema is in `src/db/schema.ts`. After changing it, run `npm run db:generate` and commit the new file in `drizzle/`.
