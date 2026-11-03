# Architecture

## Layout

- `src/server/guest.ts`, `src/server/host.ts`: all business logic. Tested in `*.test.ts`.
- `src/app`: guest pages at the top level, host pages under `/host`, server actions in `actions.ts`.
- `src/db/schema.ts`: schema.

## Rules

- Everything goes through server code. The browser never talks to the database.
- Claims are checked against `quantityNeeded` in a transaction (`setClaims`). Keep that.
- Guest name visibility is enforced in `getBringList`. See the root AGENTS.md.
