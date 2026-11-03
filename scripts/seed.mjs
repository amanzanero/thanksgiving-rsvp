// First-run data: the event and the starting bring list. Does nothing once an event exists,
// so a host who edits or empties the list is never overwritten.
import postgres from "postgres";

try {
  process.loadEnvFile(".env.local");
} catch {
  // DATABASE_URL comes from the environment on Railway.
}

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const sql = postgres(url, { max: 1, prepare: false });
try {
  const [{ n }] = await sql`select count(*)::int as n from event`;
  if (n > 0) {
    console.log("Event already exists. Skipping seed.");
  } else {
    await sql.begin(async (tx) => {
      await tx`
        insert into event (id, title, starts_at, address)
        values (1, ${"Thanksgiving at Andrew and Isabella's"}, ${new Date("2026-11-26T17:00:00-08:00")}, ${"123 Example St, Anytown, CA 90000"})`;
      const items = [
        ["Turkey", 1],
        ["Mashed potatoes", 1],
        ["Dinner rolls", 2],
        ["Pumpkin pie", 2],
        ["Drinks", 1],
        ["Ice", 1],
      ];
      for (const [i, [label, qty]] of items.entries()) {
        await tx`insert into item (label, quantity_needed, added_by, sort_order) values (${label}, ${qty}, 'host', ${i})`;
      }
    });
    console.log("Seeded.");
  }
} finally {
  await sql.end();
}
