// One command for local and cloud sessions: starts a local Postgres (PGlite), migrates, seeds,
// then runs the dev server. No Postgres install needed.
import { spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

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
// Run the real entry points with this Node, not through npx, so stopping them actually stops them.
const bin = (p) => path.resolve("node_modules", p);
const db = spawn(
  process.execPath,
  [bin("@electric-sql/pglite-socket/dist/scripts/server.js"), "--db=.pglite/data", `--port=${PORT}`, "--host=127.0.0.1", "--max-connections=10"],
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

const web = spawn(process.execPath, [bin("next/dist/bin/next"), "dev", ...process.argv.slice(2)], { stdio: "inherit" });

const exited = (child) =>
  new Promise((resolve) => (child.exitCode !== null || child.signalCode !== null ? resolve() : child.once("exit", resolve)));

let stopping = false;
async function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  web.kill("SIGTERM");
  db.kill("SIGTERM");
  await Promise.all([exited(web), exited(db)]);
  process.exit(code);
}
process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));
web.on("exit", (code) => stop(code ?? 0));
db.on("exit", (code) => stop(code ?? 1));
