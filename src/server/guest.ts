import { createHash, randomBytes } from "node:crypto";
import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";
import { nameKey } from "@/lib/name-key";
import * as schema from "@/db/schema";

const { event, entry, entryName, browserLink, item, claim, changeLog } = schema;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Db = PgDatabase<any, typeof schema>;

export type GuestErrorCode = "invalid_input" | "name_taken" | "item_taken" | "not_found";

export class GuestError extends Error {
  constructor(
    public code: GuestErrorCode,
    message: string,
  ) {
    super(message);
  }
}

const MAX_DISHES_ADDED = 5;

/** Browser memory lasts through the day after the event. */
const LINK_LIFETIME_AFTER_EVENT_MS = 48 * 60 * 60 * 1000;

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

function clean(s: string) {
  return s.normalize("NFKC").trim().replace(/\s+/g, " ");
}

function validateName(first: string, last: string) {
  const f = clean(first);
  const l = clean(last);
  if (!f) throw new GuestError("invalid_input", "Enter your first name.");
  if (!l) throw new GuestError("invalid_input", "Enter your last name.");
  if (f.length > 60 || l.length > 60) throw new GuestError("invalid_input", "That name is too long.");
  return { first: f, last: l };
}

function validateParty(n: number) {
  if (!Number.isInteger(n) || n < 1 || n > 50) {
    throw new GuestError("invalid_input", "Party size must be between 1 and 50.");
  }
  return n;
}

function validateDishes(labels: string[]) {
  const out = labels.map(clean).filter(Boolean);
  if (out.length > MAX_DISHES_ADDED) throw new GuestError("invalid_input", "That's too many dishes to add at once.");
  if (out.some((l) => l.length > 80)) throw new GuestError("invalid_input", "That dish name is too long.");
  return out;
}

export async function getEvent(db: Db) {
  const [row] = await db.select().from(event).limit(1);
  return row ?? null;
}

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

async function log(
  tx: Tx | Db,
  e: {
    actor: string;
    actorEntryId?: string;
    action: (typeof schema.logAction.enumValues)[number];
    target: string;
    before?: unknown;
    after?: unknown;
  },
) {
  await tx.insert(changeLog).values({
    actor: e.actor,
    actorEntryId: e.actorEntryId,
    action: e.action,
    target: e.target,
    before: e.before ?? null,
    after: e.after ?? null,
  });
}

// ---- Bring list -----------------------------------------------------------

export type PublicItem = {
  id: string;
  label: string;
  quantityNeeded: number;
  claimed: number;
  status: "taken" | "needed";
};

/** Only returned to a signed-up viewer. */
export type SignedInItem = PublicItem & {
  claimers: string[];
  mine: boolean;
};

/**
 * The visibility rule lives here. A viewer who is not signed up as coming gets
 * rows with no names at all, so names can't leak to the browser.
 */
export async function getBringList(db: Db, viewerEntryId: string | null): Promise<PublicItem[] | SignedInItem[]> {
  const items = await db
    .select()
    .from(item)
    .where(isNull(item.removedAt))
    .orderBy(asc(item.sortOrder), asc(item.createdAt));

  const claims = await db
    .select({
      itemId: claim.itemId,
      entryId: claim.entryId,
      quantity: claim.quantity,
      name: entry.displayName,
    })
    .from(claim)
    .innerJoin(entry, eq(claim.entryId, entry.id))
    .where(and(eq(entry.status, "coming"), isNull(entry.mergedIntoId)));

  const base = items.map((it) => {
    const mine = claims.filter((c) => c.itemId === it.id);
    const claimed = mine.reduce((n, c) => n + c.quantity, 0);
    return { it, mine, claimed };
  });

  if (!viewerEntryId) {
    return base.map(({ it, claimed }) => ({
      id: it.id,
      label: it.label,
      quantityNeeded: it.quantityNeeded,
      claimed,
      status: claimed >= it.quantityNeeded ? ("taken" as const) : ("needed" as const),
    }));
  }

  return base.map(({ it, mine, claimed }) => ({
    id: it.id,
    label: it.label,
    quantityNeeded: it.quantityNeeded,
    claimed,
    status: claimed >= it.quantityNeeded ? ("taken" as const) : ("needed" as const),
    claimers: mine.filter((c) => c.entryId !== viewerEntryId).map((c) => c.name),
    mine: mine.some((c) => c.entryId === viewerEntryId),
  }));
}

// ---- Identity -------------------------------------------------------------

export async function createBrowserLink(db: Db, entryId: string) {
  const ev = await getEvent(db);
  const base = ev ? ev.startsAt.getTime() : Date.now();
  const token = randomBytes(32).toString("base64url");
  await db.insert(browserLink).values({
    tokenHash: hashToken(token),
    entryId,
    expiresAt: new Date(base + LINK_LIFETIME_AFTER_EVENT_MS),
  });
  return token;
}

export type Viewer = { id: string; displayName: string; partySize: number };

/** Follows merges. Returns null when the guest isn't signed up as coming. */
export async function resolveViewer(db: Db, token: string | undefined): Promise<Viewer | null> {
  if (!token) return null;
  const [link] = await db.select().from(browserLink).where(eq(browserLink.tokenHash, hashToken(token)));
  if (!link || link.expiresAt.getTime() < Date.now()) return null;
  let [e] = await db.select().from(entry).where(eq(entry.id, link.entryId));
  for (let hops = 0; e?.mergedIntoId && hops < 10; hops++) {
    [e] = await db.select().from(entry).where(eq(entry.id, e.mergedIntoId));
  }
  if (!e || e.status !== "coming") return null;
  return { id: e.id, displayName: e.displayName, partySize: e.partySize };
}

/** Exact first plus last name match, ignoring case and extra spaces. Never returns a list. */
export async function lookupByName(db: Db, first: string, last: string): Promise<Viewer | null> {
  const key = nameKey(first, last);
  const [row] = await db
    .select({ entryId: entryName.entryId })
    .from(entryName)
    .where(eq(entryName.nameKey, key));
  if (!row) return null;
  let [e] = await db.select().from(entry).where(eq(entry.id, row.entryId));
  for (let hops = 0; e?.mergedIntoId && hops < 10; hops++) {
    [e] = await db.select().from(entry).where(eq(entry.id, e.mergedIntoId));
  }
  if (!e || e.status !== "coming") return null;
  return { id: e.id, displayName: e.displayName, partySize: e.partySize };
}

// ---- Claims ---------------------------------------------------------------

/** Applies the guest's wanted dishes, enforcing quantities under a row lock. */
export async function setClaims(tx: Tx, e: { id: string; displayName: string }, itemIds: string[], newDishes: string[]) {
  const wanted = [...new Set(itemIds)];

  if (wanted.length) {
    const rows = await tx
      .select()
      .from(item)
      .where(and(inArray(item.id, wanted), isNull(item.removedAt)))
      .for("update");
    if (rows.length !== wanted.length) throw new GuestError("not_found", "That dish isn't on the list anymore.");
  }

  const existing = await tx
    .select({ itemId: claim.itemId, label: item.label })
    .from(claim)
    .innerJoin(item, eq(claim.itemId, item.id))
    .where(eq(claim.entryId, e.id));
  const have = new Set(existing.map((c) => c.itemId));

  for (const c of existing) {
    if (wanted.includes(c.itemId)) continue;
    await tx.delete(claim).where(and(eq(claim.entryId, e.id), eq(claim.itemId, c.itemId)));
    const [it] = await tx.select().from(item).where(eq(item.id, c.itemId));
    if (it.addedBy === "guest" && it.addedByEntryId === e.id) {
      const [{ n }] = await tx
        .select({ n: sql<number>`count(*)::int` })
        .from(claim)
        .where(eq(claim.itemId, c.itemId));
      if (n === 0) await tx.update(item).set({ removedAt: new Date() }).where(eq(item.id, c.itemId));
    }
    await log(tx, { actor: e.displayName, actorEntryId: e.id, action: "release", target: c.label });
  }

  for (const itemId of wanted) {
    if (have.has(itemId)) continue;
    const [it] = await tx.select().from(item).where(eq(item.id, itemId));
    const [{ n }] = await tx
      .select({ n: sql<number>`coalesce(sum(${claim.quantity}), 0)::int` })
      .from(claim)
      .where(eq(claim.itemId, itemId));
    if (n >= it.quantityNeeded) {
      throw new GuestError("item_taken", `${it.label} was just taken. Pick something else.`);
    }
    await tx.insert(claim).values({ itemId, entryId: e.id });
    await log(tx, { actor: e.displayName, actorEntryId: e.id, action: "claim", target: it.label });
  }

  for (const label of newDishes) {
    const [{ max }] = await tx.select({ max: sql<number>`coalesce(max(${item.sortOrder}), 0)::int` }).from(item);
    const [created] = await tx
      .insert(item)
      .values({ label, addedBy: "guest", addedByEntryId: e.id, sortOrder: max + 1 })
      .returning();
    await tx.insert(claim).values({ itemId: created.id, entryId: e.id });
    await log(tx, { actor: e.displayName, actorEntryId: e.id, action: "claim", target: label, after: { added: true } });
  }
}

// ---- Sign up, edit, cancel ------------------------------------------------

export type SignUpInput = {
  firstName: string;
  lastName: string;
  partySize: number;
  itemIds?: string[];
  newDishes?: string[];
};

export async function signUp(db: Db, input: SignUpInput): Promise<{ entryId: string; token: string }> {
  const { first, last } = validateName(input.firstName, input.lastName);
  const partySize = validateParty(input.partySize);
  const dishes = validateDishes(input.newDishes ?? []);
  const key = nameKey(first, last);
  const displayName = `${first} ${last}`;

  const entryId = await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ entryId: entryName.entryId })
      .from(entryName)
      .where(eq(entryName.nameKey, key));

    let id: string;
    if (existing) {
      const [e] = await tx.select().from(entry).where(eq(entry.id, existing.entryId));
      // A cancelled guest can come back. Anyone else uses "Already signed up?".
      if (e.status !== "cancelled" || e.mergedIntoId) {
        throw new GuestError("name_taken", "That name is already signed up. Tap Already signed up to find it.");
      }
      id = e.id;
      await tx.update(entry).set({ status: "coming", partySize, updatedAt: new Date() }).where(eq(entry.id, id));
    } else {
      const [created] = await tx.insert(entry).values({ displayName, partySize }).returning();
      id = created.id;
      await tx.insert(entryName).values({ entryId: id, firstName: first, lastName: last, nameKey: key });
    }

    await log(tx, { actor: displayName, actorEntryId: id, action: "sign_up", target: displayName, after: { partySize } });
    await setClaims(tx, { id, displayName }, input.itemIds ?? [], dishes);
    return id;
  });

  const token = await createBrowserLink(db, entryId);
  return { entryId, token };
}

export type EditInput = { partySize?: number; itemIds?: string[]; newDishes?: string[] };

export async function updateEntry(db: Db, entryId: string, input: EditInput) {
  await db.transaction(async (tx) => {
    const [e] = await tx.select().from(entry).where(eq(entry.id, entryId));
    if (!e || e.status !== "coming") throw new GuestError("not_found", "We couldn't find your spot.");
    if (input.partySize !== undefined) {
      const partySize = validateParty(input.partySize);
      if (partySize !== e.partySize) {
        await tx.update(entry).set({ partySize, updatedAt: new Date() }).where(eq(entry.id, e.id));
        await log(tx, {
          actor: e.displayName,
          actorEntryId: e.id,
          action: "edit",
          target: "party size",
          before: { partySize: e.partySize },
          after: { partySize },
        });
      }
    }
    if (input.itemIds !== undefined || input.newDishes) {
      const current = await tx.select({ itemId: claim.itemId }).from(claim).where(eq(claim.entryId, e.id));
      await setClaims(tx, e, input.itemIds ?? current.map((c) => c.itemId), validateDishes(input.newDishes ?? []));
    }
  });
}

/** Releases the spot and every dish. The row stays so the log still makes sense. */
export async function cancelEntry(db: Db, entryId: string) {
  await db.transaction(async (tx) => {
    const [e] = await tx.select().from(entry).where(eq(entry.id, entryId));
    if (!e || e.status !== "coming") throw new GuestError("not_found", "We couldn't find your spot.");
    const released = await tx
      .select({ label: item.label })
      .from(claim)
      .innerJoin(item, eq(claim.itemId, item.id))
      .where(eq(claim.entryId, e.id));
    await setClaims(tx, e, [], []);
    await tx.update(entry).set({ status: "cancelled", updatedAt: new Date() }).where(eq(entry.id, e.id));
    await log(tx, {
      actor: e.displayName,
      actorEntryId: e.id,
      action: "cancel",
      target: e.displayName,
      before: { status: "coming", partySize: e.partySize, dishes: released.map((r) => r.label) },
      after: { status: "cancelled" },
    });
  });
}
