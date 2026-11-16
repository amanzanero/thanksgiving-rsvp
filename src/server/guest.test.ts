import { beforeEach, describe, expect, it } from "vitest";
import { itemId, createTestDb } from "@/test/db";
import {
  cancelEntry,
  getBringList,
  GuestError,
  lookupByName,
  resolveViewer,
  signUp,
  updateEntry,
  type Db,
} from "./guest";
import { getChangeLog } from "./host";

let db: Db;
beforeEach(async () => {
  db = await createTestDb();
});

const join = async (first: string, last: string, extra: Partial<Parameters<typeof signUp>[1]> = {}) =>
  signUp(db, { firstName: first, lastName: last, partySize: 2, ...extra });

describe("visibility", () => {
  it("shows first name and last initial to a visitor who is not signed up", async () => {
    await join("Sue", "Smith", { itemIds: [await itemId(db, "Turkey")] });
    const list = await getBringList(db, null);
    const turkey = list.find((i) => i.label === "Turkey")!;
    expect(turkey.status).toBe("taken");
    expect(turkey.claimers).toEqual(["Sue S."]);
    expect(turkey.mine).toBe(false);
    expect(JSON.stringify(list)).not.toContain("Smith");
  });

  it("shows other guests' names to a signed-up guest, and marks your own dish", async () => {
    const sue = await join("Sue", "Smith", { itemIds: [await itemId(db, "Turkey")] });
    const bob = await join("Bob", "Jones", { itemIds: [await itemId(db, "Drinks")] });
    const list = await getBringList(db, bob.entryId);
    expect(list.find((i) => i.label === "Turkey")!.claimers).toEqual(["Sue S."]);
    expect(list.find((i) => i.label === "Drinks")!.mine).toBe(true);
    expect(sue.entryId).not.toBe(bob.entryId);
  });

  it("stops resolving the browser after cancelling", async () => {
    const sue = await join("Sue", "Smith");
    expect(await resolveViewer(db, sue.token)).not.toBeNull();
    await cancelEntry(db, sue.entryId);
    expect(await resolveViewer(db, sue.token)).toBeNull();
  });
});

describe("sign up and lookup", () => {
  it("finds an entry by name ignoring case and extra spaces", async () => {
    const { entryId } = await join("Sue", "Smith");
    expect((await lookupByName(db, "  sue ", "SMITH"))?.id).toBe(entryId);
    expect(await lookupByName(db, "Sue", "Smyth")).toBeNull();
  });

  it("rejects the same name twice", async () => {
    await join("Sue", "Smith");
    await expect(join("sue", "smith")).rejects.toMatchObject({ code: "name_taken" });
  });

  it("lets a cancelled guest sign up again", async () => {
    const first = await join("Sue", "Smith");
    await cancelEntry(db, first.entryId);
    const again = await join("Sue", "Smith", { partySize: 5 });
    expect(again.entryId).toBe(first.entryId);
    expect((await resolveViewer(db, again.token))?.partySize).toBe(5);
  });

  it("validates input", async () => {
    await expect(join("", "Smith")).rejects.toBeInstanceOf(GuestError);
    await expect(join("Sue", "Smith", { partySize: 0 })).rejects.toMatchObject({ code: "invalid_input" });
    await expect(join("Sue", "Smith", { partySize: 51 })).rejects.toMatchObject({ code: "invalid_input" });
  });

  it("ignores expired or unknown tokens", async () => {
    expect(await resolveViewer(db, "nope")).toBeNull();
    expect(await resolveViewer(db, undefined)).toBeNull();
  });
});

describe("claims", () => {
  it("stops the last unit being taken twice", async () => {
    const turkey = await itemId(db, "Turkey");
    await join("Sue", "Smith", { itemIds: [turkey] });
    await expect(join("Bob", "Jones", { itemIds: [turkey] })).rejects.toMatchObject({ code: "item_taken" });
  });

  it("lets two guests share an item that needs two", async () => {
    const rolls = await itemId(db, "Rolls");
    await join("Sue", "Smith", { itemIds: [rolls] });
    await join("Bob", "Jones", { itemIds: [rolls] });
    await expect(join("Amy", "Lee", { itemIds: [rolls] })).rejects.toMatchObject({ code: "item_taken" });
  });

  it("adds a guest dish, and removes it again when released", async () => {
    const sue = await join("Sue", "Smith", { newDishes: ["Green bean casserole"] });
    let list = await getBringList(db, null);
    expect(list.map((i) => i.label)).toContain("Green bean casserole");
    await updateEntry(db, sue.entryId, { itemIds: [] });
    list = await getBringList(db, null);
    expect(list.map((i) => i.label)).not.toContain("Green bean casserole");
  });

  it("releases dishes when a guest cancels", async () => {
    const turkey = await itemId(db, "Turkey");
    const sue = await join("Sue", "Smith", { itemIds: [turkey] });
    await cancelEntry(db, sue.entryId);
    const list = await getBringList(db, null);
    expect(list.find((i) => i.label === "Turkey")!.status).toBe("needed");
  });

  it("logs sign up, claim, edit, release and cancel", async () => {
    const turkey = await itemId(db, "Turkey");
    const sue = await join("Sue", "Smith", { itemIds: [turkey] });
    await updateEntry(db, sue.entryId, { partySize: 4 });
    await cancelEntry(db, sue.entryId);
    const actions = (await getChangeLog(db)).map((r) => r.action);
    expect(actions).toEqual(expect.arrayContaining(["sign_up", "claim", "edit", "release", "cancel"]));
  });
});
