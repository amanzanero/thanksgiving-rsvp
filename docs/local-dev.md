# Local development

```bash
npm install
npm run dev:local
```

This starts a local Postgres (PGlite, no install needed), applies migrations, seeds the event and bring list, and runs the dev server at http://localhost:3000. The first run writes `.env.local`.

- Host passphrase locally: `pumpkinpie`. Host view: http://localhost:3000/host.
- Use `127.0.0.1` for a second browser identity. Cookies are separate from `localhost`.
- Local PGlite needs `DB_POOL_MAX=1`.
