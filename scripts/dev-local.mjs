// One command for local and cloud sessions: starts a local Postgres (PGlite), migrates, seeds,
// then runs the dev server. No Postgres install needed.
import { spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";

const PORT = 5433;

if (!existsSync(".env.local")) {
  writeFileSync(
    ".env.local",
    [
      `DATABASE_URL=postgres://postgres:postgres@127.0.0.1:${PORT}/postgres`,
      "DB_POOL_MAX=1",
      "HOST_PASSPHRASE=pumpkinpie",
      `SESSION_SECRET=${randomBytes(32).toString("hex")}`,
      "",
    ].join("\n"),
  );
  console.log("Wrote .env.local with a local database and the host passphrase 'pumpkinpie'.");
}

mkdirSync(".pglite", { recursive: true });
const db = spawn(
  "npx",
  ["pglite-server", "--db=.pglite/data", `--port=${PORT}`, "--host=127.0.0.1", "--max-connections=10"],
  { stdio: "inherit" },
);

const up = () =>
  new Promise((resolve) => {
    const s = net.connect(PORT, "127.0.0.1");
    s.once("connect", () => (s.destroy(), resolve(true)));
    s.once("error", () => resolve(false));
  });
for (let i = 0; i < 60 && !(await up()); i++) await new Promise((r) => setTimeout(r, 500));
if (!(await up())) {
  db.kill();
  throw new Error("The local database did not start.");
}

for (const script of ["scripts/migrate.mjs", "scripts/seed.mjs"]) {
  const r = spawnSync("node", [script], { stdio: "inherit" });
  if (r.status !== 0) {
    db.kill();
    process.exit(r.status ?? 1);
  }
}

const web = spawn("npx", ["next", "dev", ...process.argv.slice(2)], { stdio: "inherit" });
const stop = () => {
  web.kill();
  db.kill();
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
web.on("exit", (code) => {
  db.kill();
  process.exit(code ?? 0);
});
