import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  bigserial,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const entryStatus = pgEnum("entry_status", ["coming", "cancelled"]);
export const itemAddedBy = pgEnum("item_added_by", ["host", "guest"]);
export const logAction = pgEnum("log_action", [
  "sign_up",
  "edit",
  "cancel",
  "claim",
  "release",
  "merge",
  "host_change",
]);

/** One event, one row. The host passphrase lives in an env var, not here. */
export const event = pgTable(
  "event",
  {
    id: integer("id").primaryKey().default(1),
    title: text("title").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    address: text("address").notNull(),
  },
  (t) => [check("event_single_row", sql`${t.id} = 1`)],
);

/**
 * A guest or merged group. `displayName` is what the host and other guests see
 * ("Sue Smith", or "Sue and Bob Smith" after a merge). A merged-away entry keeps
 * its row and points at the survivor through `mergedIntoId`.
 */
export const entry = pgTable(
  "entry",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    displayName: text("display_name").notNull(),
    partySize: integer("party_size").notNull(),
    status: entryStatus("status").notNull().default("coming"),
    mergedIntoId: uuid("merged_into_id").references((): AnyPgColumn => entry.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("entry_party_size_range", sql`${t.partySize} BETWEEN 1 AND 50`),
    index("entry_status_idx").on(t.status),
  ],
);

/**
 * Every name that finds an entry. A normal entry has one. A merged entry has
 * one per original name, so lookup works with any of them. `nameKey` is unique,
 * so the same name can't sign up twice (that guest uses "Already signed up?").
 */
export const entryName = pgTable(
  "entry_name",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entryId: uuid("entry_id")
      .notNull()
      .references(() => entry.id, { onDelete: "cascade" }),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    nameKey: text("name_key").notNull(),
  },
  (t) => [unique("entry_name_key_unique").on(t.nameKey), index("entry_name_entry_idx").on(t.entryId)],
);

/** Browser memory. Only a hash of the cookie token is stored. A merge repoints rows. */
export const browserLink = pgTable(
  "browser_link",
  {
    tokenHash: text("token_hash").primaryKey(),
    entryId: uuid("entry_id")
      .notNull()
      .references(() => entry.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("browser_link_entry_idx").on(t.entryId)],
);

export const item = pgTable(
  "item",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    label: text("label").notNull(),
    quantityNeeded: integer("quantity_needed").notNull().default(1),
    addedBy: itemAddedBy("added_by").notNull(),
    addedByEntryId: uuid("added_by_entry_id").references(() => entry.id, { onDelete: "set null" }),
    sortOrder: integer("sort_order").notNull().default(0),
    removedAt: timestamp("removed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check("item_quantity_positive", sql`${t.quantityNeeded} >= 1`)],
);

/** Total claimed per item must stay within `quantityNeeded`. The app checks this in a transaction. */
export const claim = pgTable(
  "claim",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    itemId: uuid("item_id")
      .notNull()
      .references(() => item.id, { onDelete: "cascade" }),
    entryId: uuid("entry_id")
      .notNull()
      .references(() => entry.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("claim_item_entry_unique").on(t.itemId, t.entryId),
    check("claim_quantity_positive", sql`${t.quantity} >= 1`),
    index("claim_entry_idx").on(t.entryId),
  ],
);

/** Append only. `actor` is "Host" or the guest's display name at the time. */
export const changeLog = pgTable(
  "change_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
    actor: text("actor").notNull(),
    actorEntryId: uuid("actor_entry_id"),
    action: logAction("action").notNull(),
    target: text("target").notNull(),
    before: jsonb("before"),
    after: jsonb("after"),
  },
  (t) => [index("change_log_at_idx").on(t.at)],
);
