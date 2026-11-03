import { count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { event, item } from "./schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const client = postgres(url, { max: 1, prepare: false });
const db = drizzle(client);

async function main() {
  await db
    .insert(event)
    .values({
      id: 1,
      title: "Thanksgiving at Andrew and Isabella's",
      startsAt: new Date("2026-11-26T17:00:00-08:00"),
      address: "20635 Calle Bella, Yorba Linda, CA 92887",
    })
    .onConflictDoNothing();

  const [{ n }] = await db.select({ n: count() }).from(item);
  if (n === 0) {
    const items = [
      ["Turkey", 1],
      ["Mashed potatoes", 1],
      ["Dinner rolls", 2],
      ["Pumpkin pie", 2],
      ["Drinks", 1],
      ["Ice", 1],
    ] as const;
    await db.insert(item).values(
      items.map(([label, quantityNeeded], i) => ({
        label,
        quantityNeeded,
        addedBy: "host" as const,
        sortOrder: i,
      })),
    );
  }
}

main()
  .then(() => console.log("Seeded."))
  .finally(() => client.end());
