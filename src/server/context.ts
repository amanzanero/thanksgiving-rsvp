import "server-only";
import { cookies, headers } from "next/headers";
import { getDb } from "@/db";
import { getEvent, resolveViewer, type Db } from "./guest";
import { HOST_COOKIE, verifyHostSessionValue } from "./session";

export const GUEST_COOKIE = "rsvp_token";

export const db = () => getDb() as unknown as Db;

export async function getViewer() {
  const jar = await cookies();
  return resolveViewer(db(), jar.get(GUEST_COOKIE)?.value);
}

export async function isHost() {
  const jar = await cookies();
  return verifyHostSessionValue(jar.get(HOST_COOKIE)?.value);
}

export async function requireEvent() {
  const ev = await getEvent(db());
  if (!ev) throw new Error("No event yet. Run npm run db:seed.");
  return ev;
}

export async function clientKey() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}
