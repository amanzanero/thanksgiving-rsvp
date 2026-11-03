import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "@/db/schema";
import type { Db } from "@/server/guest";

/** A fresh in-memory Postgres with the real migrations applied. */
export async function createTestDb() {
  const client = new PGlite();
  const dir = path.resolve(process.cwd(), "drizzle");
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    for (const stmt of readFileSync(path.join(dir, f), "utf8").split("--> statement-breakpoint")) await client.exec(stmt);
  }
  const db = drizzle(client, { schema }) as unknown as Db;
  await db.insert(schema.event).values({
    id: 1,
    title: "Test dinner",
    startsAt: new Date("2026-11-27T01:00:00Z"),
    address: "1 Test St",
  });
  const items = [
    ["Turkey", 1],
    ["Rolls", 2],
    ["Drinks", 1],
  ] as const;
  await db.insert(schema.item).values(items.map(([label, q], i) => ({ label, quantityNeeded: q, addedBy: "host" as const, sortOrder: i })));
  return db;
}

export async function itemId(db: Db, label: string) {
  const rows = await db.select().from(schema.item);
  return rows.find((r) => r.label === label)!.id;
}
