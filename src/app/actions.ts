"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { rateLimit } from "@/lib/rate-limit";
import { cancelEntry, createBrowserLink, GuestError, lookupByName, signUp, updateEntry } from "@/server/guest";
import { clientKey, db, getViewer, GUEST_COOKIE } from "@/server/context";

export type ActionResult = { error?: string; code?: string };

const TOO_MANY = "Too many tries. Wait a minute, then try again.";

async function setGuestCookie(token: string) {
  const jar = await cookies();
  jar.set(GUEST_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

function toResult(e: unknown): ActionResult {
  if (e instanceof GuestError) return { error: e.message, code: e.code };
  throw e;
}

export type WizardInput = {
  firstName: string;
  lastName: string;
  partySize: number;
  itemIds: string[];
  newDishes: string[];
  website?: string;
};

export async function signUpAction(input: WizardInput): Promise<ActionResult> {
  if (input.website) redirect("/"); // honeypot: pretend it worked
  if (!rateLimit(`signup:${await clientKey()}`, 10, 10 * 60_000)) return { error: TOO_MANY, code: "rate_limit" };
  try {
    const { token } = await signUp(db(), input);
    await setGuestCookie(token);
  } catch (e) {
    return toResult(e);
  }
  redirect("/?saved=1");
}

export async function updateAction(input: Pick<WizardInput, "partySize" | "itemIds" | "newDishes">): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { error: "We couldn't find your spot. Tap Already signed up to find it.", code: "not_found" };
  try {
    await updateEntry(db(), viewer.id, input);
  } catch (e) {
    return toResult(e);
  }
  redirect("/?saved=1");
}

export type LookupState = { error?: string; first?: string; last?: string; limited?: boolean };

export async function lookupAction(_prev: LookupState, formData: FormData): Promise<LookupState> {
  const first = String(formData.get("firstName") ?? "");
  const last = String(formData.get("lastName") ?? "");
  if (formData.get("website")) redirect("/");
  if (!rateLimit(`lookup:${await clientKey()}`, 8, 60_000)) return { error: TOO_MANY, first, last, limited: true };
  if (!first.trim() || !last.trim()) return { error: "Enter your first and last name.", first, last };
  const found = await lookupByName(db(), first, last);
  if (!found) {
    return {
      error: `We can't find ${first.trim()} ${last.trim()}. Check the spelling, or tap I'm coming to sign up.`,
      first,
      last,
    };
  }
  await setGuestCookie(await createBrowserLink(db(), found.id));
  redirect("/");
}

export async function cancelAction() {
  const viewer = await getViewer();
  if (viewer) await cancelEntry(db(), viewer.id);
  redirect("/");
}
