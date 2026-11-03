import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import * as schema from "@/db/schema";
import { GuestError, type Db } from "./guest";

const { event, entry, entryName, browserLink, item, claim, changeLog } = schema;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

const HOST = "Host";

async function hostLog(
  tx: Tx | Db,
  action: (typeof schema.logAction.enumValues)[number],
  target: string,
  before?: unknown,
  after?: unknown,
) {
  await tx.insert(changeLog).values({ actor: HOST, action, target, before: before ?? null, after: after ?? null });
}

// ---- Guests ---------------------------------------------------------------

export async function listGuests(db: Db) {
  const entries = await db
    .select()
    .from(entry)
    .where(and(eq(entry.status, "coming"), isNull(entry.mergedIntoId)))
    .orderBy(asc(entry.createdAt));
  const claims = await db
    .select({ entryId: claim.entryId, label: item.label })
    .from(claim)
    .innerJoin(item, eq(claim.itemId, item.id))
    .where(isNull(item.removedAt));
  const guests = entries.map((e) => ({
    id: e.id,
    name: e.displayName,
    partySize: e.partySize,
    dishes: claims.filter((c) => c.entryId === e.id).map((c) => c.label),
  }));
  return { guests, totals: { entries: guests.length, people: guests.reduce((n, g) => n + g.partySize, 0) } };
}

// ---- Bring list -----------------------------------------------------------

export async function hostBringList(db: Db) {
  const items = await db.select().from(item).where(isNull(item.removedAt)).orderBy(asc(item.sortOrder), asc(item.createdAt));
  const claims = await db
    .select({ itemId: claim.itemId, quantity: claim.quantity, name: entry.displayName })
    .from(claim)
    .innerJoin(entry, eq(claim.entryId, entry.id))
    .where(and(eq(entry.status, "coming"), isNull(entry.mergedIntoId)));
  return items.map((it) => {
    const mine = claims.filter((c) => c.itemId === it.id);
    const claimed = mine.reduce((n, c) => n + c.quantity, 0);
    return {
      id: it.id,
      label: it.label,
      quantityNeeded: it.quantityNeeded,
      claimed,
      claimers: mine.map((c) => c.name),
      status: claimed > it.quantityNeeded ? ("conflict" as const) : claimed === it.quantityNeeded ? ("taken" as const) : ("needed" as const),
    };
  });
}

function validateLabel(label: string) {
  const l = label.normalize("NFKC").trim().replace(/\s+/g, " ");
  if (!l) throw new GuestError("invalid_input", "Enter an item name.");
  if (l.length > 80) throw new GuestError("invalid_input", "That item name is too long.");
  return l;
}

function validateQty(n: number) {
  if (!Number.isInteger(n) || n < 1 || n > 50) throw new GuestError("invalid_input", "How many are needed must be between 1 and 50.");
  return n;
}

export async function addItem(db: Db, label: string, quantityNeeded: number) {
  const l = validateLabel(label);
  const q = validateQty(quantityNeeded);
  await db.transaction(async (tx) => {
    const [{ max }] = await tx.select({ max: sql<number>`coalesce(max(${item.sortOrder}), 0)::int` }).from(item);
    await tx.insert(item).values({ label: l, quantityNeeded: q, addedBy: "host", sortOrder: max + 1 });
    await hostLog(tx, "host_change", l, null, { added: true, quantityNeeded: q });
  });
}

export async function editItem(db: Db, id: string, label: string, quantityNeeded: number) {
  const l = validateLabel(label);
  const q = validateQty(quantityNeeded);
  await db.transaction(async (tx) => {
    const [it] = await tx.select().from(item).where(and(eq(item.id, id), isNull(item.removedAt))).for("update");
    if (!it) throw new GuestError("not_found", "That item isn't on the list.");
    const [{ n }] = await tx
      .select({ n: sql<number>`coalesce(sum(${claim.quantity}), 0)::int` })
      .from(claim)
      .where(eq(claim.itemId, id));
    if (q < n) throw new GuestError("invalid_input", `${n} already claimed this. Remove claims first, or keep it at ${n} or more.`);
    await tx.update(item).set({ label: l, quantityNeeded: q }).where(eq(item.id, id));
    await hostLog(tx, "host_change", it.label, { label: it.label, quantityNeeded: it.quantityNeeded }, { label: l, quantityNeeded: q });
  });
}

export async function removeItem(db: Db, id: string) {
  await db.transaction(async (tx) => {
    const [it] = await tx.select().from(item).where(and(eq(item.id, id), isNull(item.removedAt))).for("update");
    if (!it) throw new GuestError("not_found", "That item isn't on the list.");
    const claimers = await tx
      .select({ name: entry.displayName })
      .from(claim)
      .innerJoin(entry, eq(claim.entryId, entry.id))
      .where(eq(claim.itemId, id));
    await tx.delete(claim).where(eq(claim.itemId, id));
    await tx.update(item).set({ removedAt: new Date() }).where(eq(item.id, id));
    await hostLog(tx, "host_change", it.label, { removed: false, claimedBy: claimers.map((c) => c.name) }, { removed: true });
  });
}

// ---- Event ----------------------------------------------------------------

export async function updateEvent(db: Db, input: { title: string; startsAt: Date; address: string }) {
  const title = input.title.trim();
  const address = input.address.trim();
  if (!title || !address) throw new GuestError("invalid_input", "Title and address can't be empty.");
  await db.transaction(async (tx) => {
    const [before] = await tx.select().from(event).limit(1);
    if (before) await tx.update(event).set({ title, address, startsAt: input.startsAt }).where(eq(event.id, 1));
    else await tx.insert(event).values({ id: 1, title, address, startsAt: input.startsAt });
    await hostLog(
      tx,
      "host_change",
      "event details",
      before ? { title: before.title, address: before.address, startsAt: before.startsAt.toISOString() } : null,
      { title, address, startsAt: input.startsAt.toISOString() },
    );
  });
}

// ---- Change log -----------------------------------------------------------

export async function getChangeLog(db: Db, limit = 200) {
  return db.select().from(changeLog).orderBy(desc(changeLog.at), desc(changeLog.id)).limit(limit);
}

// ---- Merge ----------------------------------------------------------------

export type MergeConflict = {
  itemId: string;
  label: string;
  quantityNeeded: number;
  claimants: { entryId: string; name: string; quantity: number }[];
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function loadSelected(tx: Tx | Db, ids: string[]) {
  const unique = [...new Set(ids)];
  if (unique.length < 2) throw new GuestError("invalid_input", "Pick at least two entries to merge.");
  if (!unique.every((i) => UUID.test(i))) throw new GuestError("not_found", "One of those entries isn't on the list anymore.");
  const rows = await tx
    .select()
    .from(entry)
    .where(and(inArray(entry.id, unique), eq(entry.status, "coming"), isNull(entry.mergedIntoId)))
    .orderBy(asc(entry.createdAt));
  if (rows.length !== unique.length) throw new GuestError("not_found", "One of those entries isn't on the list anymore.");
  return rows;
}

function defaultMergedName(names: { first: string; last: string }[]) {
  const lasts = new Set(names.map((n) => n.last.toLowerCase()));
  const firsts = names.map((n) => n.first);
  const join = (xs: string[]) => (xs.length <= 2 ? xs.join(" and ") : `${xs.slice(0, -1).join(", ")}, and ${xs[xs.length - 1]}`);
  if (lasts.size === 1) return `${join(firsts)} ${names[0].last}`;
  return join(names.map((n) => `${n.first} ${n.last}`));
}

export async function previewMerge(db: Db, ids: string[]) {
  const rows = await loadSelected(db, ids);
  const names = await db.select().from(entryName).where(inArray(entryName.entryId, rows.map((r) => r.id)));
  const claims = await db
    .select({ itemId: claim.itemId, entryId: claim.entryId, quantity: claim.quantity, label: item.label, needed: item.quantityNeeded })
    .from(claim)
    .innerJoin(item, eq(claim.itemId, item.id))
    .where(and(inArray(claim.entryId, rows.map((r) => r.id)), isNull(item.removedAt)));

  const conflicts: MergeConflict[] = [];
  for (const itemId of new Set(claims.map((c) => c.itemId))) {
    const cs = claims.filter((c) => c.itemId === itemId);
    const total = cs.reduce((n, c) => n + c.quantity, 0);
    if (total > cs[0].needed) {
      conflicts.push({
        itemId,
        label: cs[0].label,
        quantityNeeded: cs[0].needed,
        claimants: cs.map((c) => ({ entryId: c.entryId, name: rows.find((r) => r.id === c.entryId)!.displayName, quantity: c.quantity })),
      });
    }
  }

  return {
    entries: rows.map((r) => ({ id: r.id, name: r.displayName, partySize: r.partySize })),
    // Sizes are not added: two spouses who each said 6 are the same 6 people.
    defaultPartySize: Math.max(...rows.map((r) => r.partySize)),
    defaultName: defaultMergedName(rows.map((r) => ({ first: names.find((n) => n.entryId === r.id)?.firstName ?? r.displayName, last: names.find((n) => n.entryId === r.id)?.lastName ?? "" }))),
    conflicts,
  };
}

/**
 * Merges entries into the earliest one. `keep` maps each conflicted item to the
 * entry ids that keep it. Names, browser links and dishes move to the survivor.
 */
export async function mergeEntries(
  db: Db,
  input: { ids: string[]; displayName: string; partySize: number; keep?: Record<string, string[]> },
) {
  const name = input.displayName.normalize("NFKC").trim().replace(/\s+/g, " ");
  if (!name || name.length > 120) throw new GuestError("invalid_input", "Enter a name for the merged entry.");
  if (!Number.isInteger(input.partySize) || input.partySize < 1 || input.partySize > 50) {
    throw new GuestError("invalid_input", "Party size must be between 1 and 50.");
  }

  return db.transaction(async (tx) => {
    const rows = await loadSelected(tx, input.ids);
    const ids = rows.map((r) => r.id);
    const survivor = rows[0];

    const claims = await tx
      .select({ id: claim.id, itemId: claim.itemId, entryId: claim.entryId, quantity: claim.quantity, label: item.label, needed: item.quantityNeeded })
      .from(claim)
      .innerJoin(item, eq(claim.itemId, item.id))
      .where(and(inArray(claim.entryId, ids), isNull(item.removedAt)));

    const before = {
      entries: rows.map((r) => ({ id: r.id, name: r.displayName, partySize: r.partySize })),
      claims: claims.map((c) => ({ entryId: c.entryId, item: c.label, quantity: c.quantity })),
    };

    const merged: { itemId: string; quantity: number }[] = [];
    for (const itemId of new Set(claims.map((c) => c.itemId))) {
      const cs = claims.filter((c) => c.itemId === itemId);
      const total = cs.reduce((n, c) => n + c.quantity, 0);
      let kept = cs;
      if (total > cs[0].needed) {
        const keepers = input.keep?.[itemId];
        if (!keepers?.length) throw new GuestError("invalid_input", `Pick who keeps ${cs[0].label}.`);
        kept = cs.filter((c) => keepers.includes(c.entryId));
        const keptTotal = kept.reduce((n, c) => n + c.quantity, 0);
        if (!kept.length || keptTotal > cs[0].needed) throw new GuestError("invalid_input", `Only ${cs[0].needed} needed for ${cs[0].label}.`);
      }
      merged.push({ itemId, quantity: kept.reduce((n, c) => n + c.quantity, 0) });
    }

    await tx.delete(claim).where(inArray(claim.id, claims.map((c) => c.id)));
    if (merged.length) await tx.insert(claim).values(merged.map((m) => ({ itemId: m.itemId, entryId: survivor.id, quantity: m.quantity })));

    await tx.update(entryName).set({ entryId: survivor.id }).where(inArray(entryName.entryId, ids));
    await tx.update(browserLink).set({ entryId: survivor.id }).where(inArray(browserLink.entryId, ids));
    const others = ids.filter((i) => i !== survivor.id);
    await tx.update(entry).set({ mergedIntoId: survivor.id, updatedAt: new Date() }).where(inArray(entry.id, others));
    await tx.update(entry).set({ displayName: name, partySize: input.partySize, updatedAt: new Date() }).where(eq(entry.id, survivor.id));

    await hostLog(tx, "merge", name, before, {
      id: survivor.id,
      name,
      partySize: input.partySize,
      claims: merged.length,
    });
    return survivor.id;
  });
}
