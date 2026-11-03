# Deploy

Railway project `peaceful-celebration`, service `thanksgiving-rsvp`, deploys from `main`. Postgres is a Railway service in the same project.

- Deploy settings live on the Railway service, not in the repo. Railway does not read `railway.json` for new services.
- Pre-deploy command: `node scripts/migrate.mjs && node scripts/seed.mjs`
- Health check path: `/api/health`
- Variables on the app: `DATABASE_URL` (reference to Postgres), `SESSION_SECRET`, `HOST_PASSPHRASE`.
- A redeploy reuses the old deployment's settings. To apply a setting change, push a commit or change a variable.
- For Railway behaviour, check the Railway docs (`search-docs` and `fetch-docs` on the Railway MCP) before guessing.
