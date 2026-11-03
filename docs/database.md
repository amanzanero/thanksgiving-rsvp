# Database

- Postgres through Drizzle. Schema: `src/db/schema.ts`.
- After changing the schema, run `npm run db:generate` and commit the new files in `drizzle/`.
- The Postgres client uses `prepare: false`.
- Local PGlite needs `DB_POOL_MAX=1`. Railway does not.
- `scripts/migrate.mjs` and `scripts/seed.mjs` run before each Railway deploy. Migrations are safe to repeat, and the seed does nothing once an event exists.
