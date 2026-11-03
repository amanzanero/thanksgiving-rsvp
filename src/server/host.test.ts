import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb, itemId } from "@/test/db";
import { fromFormParts, toFormParts } from "@/lib/event-format";
import { describeLog } from "@/lib/log-format";
import { getBringList, lookupByName, resolveViewer, signUp, updateEntry, type Db } from "./guest";
import {
  addItem,
  editItem,
  getChangeLog,
  hostBringList,
  listGuests,
  mergeEntries,
  previewMerge,
  removeGuest,
  removeItem,
  updateEvent,
} from "./host";
import { createHostSessionValue, passphraseMatches, verifyHostSessionValue } from "./session";

let db: Db;
beforeEach(async () => {
  db = await createTestDb();
});

describe("remove guest", () => {
  it("releases the spot and dishes, logs it as the host, and lets them sign up again", async () => {
    const drinks = await itemId(db, "Drinks");
    const sue = await signUp(db, { firstName: "Sue", lastName: "Smith", partySize: 3, itemIds: [drinks], newDishes: ["Green bean casserole"] });

    const name = await removeGuest(db, sue.entryId);
    expect(name).toBe("Sue Smith");

    const { guests, totals } = await listGuests(db);
    expect(guests).toHaveLength(0);
    expect(totals).toEqual({ entries: 0, people: 0 });
    const bring = await hostBringList(db);
    expect(bring.find((i) => i.label === "Drinks")?.status).toBe("needed");
    expect(bring.find((i) => i.label === "Green bean casserole")).toBeUndefined();

    const removed = (await getChangeLog(db)).find((r) => r.action === "cancel")!;
    expect(removed.actor).toBe("Host");
    expect(describeLog(removed).title).toBe("Host removed Sue Smith");
    expect(describeLog(removed).detail).toContain("Drinks");

    await expect(removeGuest(db, sue.entryId)).rejects.toMatchObject({ code: "not_found" });
    await expect(removeGuest(db, "nope")).rejects.toMatchObject({ code: "not_found" });

    await signUp(db, { firstName: "Sue", lastName: "Smith", partySize: 2 });
    expect((await listGuests(db)).guests).toHaveLength(1);
  });
});

describe("merge", () => {
  async function twoParks() {
    const drinks = await itemId(db, "Drinks");
    const linda = await signUp(db, { firstName: "Linda", lastName: "Park", partySize: 6, itemIds: [] });
    const ray = await signUp(db, { firstName: "Ray", lastName: "Park", partySize: 6, itemIds: [] });
    // Both claimed the single Drinks item (possible after a race or a host edit).
    const { claim } = await import("@/db/schema");
    await db.insert(claim).values([
      { itemId: drinks, entryId: linda.entryId },
      { itemId: drinks, entryId: ray.entryId },
    ]);
    return { linda, ray, drinks };
  }

  it("previews the largest size, a joined name and the conflict", async () => {
    const { linda, ray, drinks } = await twoParks();
    const p = await previewMerge(db, [linda.entryId, ray.entryId]);
    expect(p.defaultPartySize).toBe(6);
    expect(p.defaultName).toBe("Linda and Ray Park");
    expect(p.conflicts).toHaveLength(1);
    expect(p.conflicts[0].itemId).toBe(drinks);
  });

  it("requires a choice for a conflict, then moves everything to one entry", async () => {
    const { linda, ray, drinks } = await twoParks();
    const ids = [linda.entryId, ray.entryId];
    await expect(mergeEntries(db, { ids, displayName: "Linda and Ray Park", partySize: 6 })).rejects.toMatchObject({ code: "invalid_input" });
    const survivor = await mergeEntries(db, { ids, displayName: "Linda and Ray Park", partySize: 6, keep: { [drinks]: [ray.entryId] } });

    const { guests, totals } = await listGuests(db);
    expect(guests).toHaveLength(1);
    expect(guests[0]).toMatchObject({ id: survivor, name: "Linda and Ray Park", partySize: 6, dishes: ["Drinks"] });
    expect(totals).toEqual({ entries: 1, people: 6 });

    // Both phones now land on the merged entry, and either name finds it.
    expect((await resolveViewer(db, linda.token))?.id).toBe(survivor);
    expect((await resolveViewer(db, ray.token))?.id).toBe(survivor);
    expect((await lookupByName(db, "ray", "park"))?.id).toBe(survivor);
    expect((await lookupByName(db, "LINDA", "Park"))?.id).toBe(survivor);

    const merge = (await getChangeLog(db)).find((r) => r.action === "merge")!;
    expect(describeLog(merge).detail).toContain("Linda Park (6) and Ray Park (6) became Linda and Ray Park (6)");
  });

  it("keeps ownership of a guest-added dish through a merge", async () => {
    const linda = await signUp(db, { firstName: "Linda", lastName: "Park", partySize: 6 });
    const ray = await signUp(db, { firstName: "Ray", lastName: "Park", partySize: 6, newDishes: ["Green bean casserole"] });
    const survivor = await mergeEntries(db, { ids: [linda.entryId, ray.entryId], displayName: "Linda and Ray Park", partySize: 6 });
    expect((await getBringList(db, null)).map((i) => i.label)).toContain("Green bean casserole");
    await updateEntry(db, survivor, { itemIds: [] });
    expect((await getBringList(db, null)).map((i) => i.label)).not.toContain("Green bean casserole");
  });

  it("refuses ids that are not real entries", async () => {
    await expect(previewMerge(db, ["a", "b"])).rejects.toMatchObject({ code: "not_found" });
  });

  it("refuses a single entry", async () => {
    const a = await signUp(db, { firstName: "A", lastName: "B", partySize: 1 });
    await expect(mergeEntries(db, { ids: [a.entryId], displayName: "x", partySize: 1 })).rejects.toMatchObject({ code: "invalid_input" });
  });
});

describe("items", () => {
  it("adds, edits and removes, releasing claims", async () => {
    await addItem(db, "Cranberry sauce", 1);
    let list = await hostBringList(db);
    const cran = list.find((i) => i.label === "Cranberry sauce")!;
    expect(cran.status).toBe("needed");

    const sue = await signUp(db, { firstName: "Sue", lastName: "Smith", partySize: 2, itemIds: [cran.id] });
    await expect(editItem(db, cran.id, "Cranberry sauce", 1)).resolves.toBeUndefined();
    await expect(editItem(db, await itemId(db, "Rolls"), "Rolls", 0)).rejects.toMatchObject({ code: "invalid_input" });

    await removeItem(db, cran.id);
    list = await hostBringList(db);
    expect(list.map((i) => i.label)).not.toContain("Cranberry sauce");
    expect((await getBringList(db, sue.entryId)).map((i) => i.label)).not.toContain("Cranberry sauce");
  });

  it("will not lower the amount needed below what is claimed", async () => {
    const rolls = await itemId(db, "Rolls");
    await signUp(db, { firstName: "A", lastName: "A", partySize: 1, itemIds: [rolls] });
    await signUp(db, { firstName: "B", lastName: "B", partySize: 1, itemIds: [rolls] });
    await expect(editItem(db, rolls, "Rolls", 1)).rejects.toMatchObject({ code: "invalid_input" });
  });
});

describe("event", () => {
  it("converts form values to and from the event time zone", () => {
    const d = fromFormParts("2026-11-26", "17:00")!;
    expect(d.toISOString()).toBe("2026-11-27T01:00:00.000Z");
    expect(toFormParts(d)).toEqual({ date: "2026-11-26", time: "17:00" });
    // Summer time
    expect(fromFormParts("2026-07-04", "12:00")!.toISOString()).toBe("2026-07-04T19:00:00.000Z");
    expect(fromFormParts("nope", "12:00")).toBeNull();
  });

  it("updates and logs", async () => {
    await updateEvent(db, { title: "New", address: "Elsewhere", startsAt: new Date("2026-11-27T02:00:00Z") });
    expect((await getChangeLog(db))[0].action).toBe("host_change");
  });
});

describe("host session", () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = "test-secret";
    process.env.HOST_PASSPHRASE = "pie";
  });
  it("signs, verifies and expires", () => {
    const v = createHostSessionValue(1000);
    expect(verifyHostSessionValue(v, 2000)).toBe(true);
    expect(verifyHostSessionValue(v, 1000 + 13 * 60 * 60 * 1000)).toBe(false);
    expect(verifyHostSessionValue(v.replace(/.$/, "x"), 2000)).toBe(false);
    expect(verifyHostSessionValue(undefined)).toBe(false);
  });
  it("checks the passphrase", () => {
    expect(passphraseMatches("pie")).toBe(true);
    expect(passphraseMatches("cake")).toBe(false);
  });
});
