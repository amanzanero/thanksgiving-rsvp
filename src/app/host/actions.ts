"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fromFormParts } from "@/lib/event-format";
import { rateLimit } from "@/lib/rate-limit";
import { GuestError } from "@/server/guest";
import { addItem, editItem, mergeEntries, removeItem, updateEvent } from "@/server/host";
import { clientKey, db, isHost } from "@/server/context";
import { createHostSessionValue, HOST_COOKIE, HOST_SESSION_SECONDS, passphraseMatches } from "@/server/session";

export type HostResult = { error?: string };
export type FormState = { error?: string; values?: Record<string, string> };

async function requireHost() {
  if (!(await isHost())) redirect("/host/login");
}

function fail(e: unknown): HostResult {
  if (e instanceof GuestError) return { error: e.message };
  throw e;
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (formData.get("website")) redirect("/");
  if (!rateLimit(`host:${await clientKey()}`, 5, 60_000)) return { error: "Too many tries. Wait a minute, then try again." };
  const pass = String(formData.get("passphrase") ?? "");
  if (!passphraseMatches(pass)) return { error: "That passphrase doesn't match. Check it and try again." };
  const jar = await cookies();
  jar.set(HOST_COOKIE, createHostSessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: HOST_SESSION_SECONDS,
  });
  redirect("/host");
}

export async function logoutAction() {
  (await cookies()).delete(HOST_COOKIE);
  redirect("/host/login");
}

export async function mergeAction(input: {
  ids: string[];
  displayName: string;
  partySize: number;
  keep: Record<string, string[]>;
}): Promise<HostResult> {
  await requireHost();
  try {
    await mergeEntries(db(), input);
  } catch (e) {
    return fail(e);
  }
  redirect(`/host?merged=${encodeURIComponent(input.displayName)}`);
}

export async function itemAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireHost();
  const id = String(formData.get("id") ?? "");
  const label = String(formData.get("label") ?? "");
  const qty = Number(formData.get("quantity") ?? 1);
  try {
    if (id) await editItem(db(), id, label, qty);
    else await addItem(db(), label, qty);
  } catch (e) {
    return { ...fail(e), values: { label, quantity: String(qty) } };
  }
  redirect("/host/bring-list");
}

export async function removeItemAction(formData: FormData) {
  await requireHost();
  const id = String(formData.get("id") ?? "");
  try {
    await removeItem(db(), id);
  } catch (e) {
    if (!(e instanceof GuestError)) throw e;
  }
  redirect("/host/bring-list");
}

export async function eventAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireHost();
  const title = String(formData.get("title") ?? "");
  const address = String(formData.get("address") ?? "");
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const startsAt = fromFormParts(date, time);
  if (!startsAt) return { error: "Pick a date and time.", values: { title, address, date, time } };
  try {
    await updateEvent(db(), { title, address, startsAt });
  } catch (e) {
    return { ...fail(e), values: { title, address, date, time } };
  }
  return { values: { title, address, date, time }, error: undefined };
}
