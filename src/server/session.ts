import { createHmac, timingSafeEqual } from "node:crypto";

const HOST_SESSION_MS = 12 * 60 * 60 * 1000;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not set");
  return s;
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

export function createHostSessionValue(now = Date.now()) {
  const exp = String(now + HOST_SESSION_MS);
  return `${exp}.${sign(exp)}`;
}

export function verifyHostSessionValue(value: string | undefined, now = Date.now()): boolean {
  if (!value) return false;
  const [exp, sig] = value.split(".");
  if (!exp || !sig) return false;
  const expected = sign(exp);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  return Number(exp) > now;
}

export function passphraseMatches(input: string): boolean {
  const expected = process.env.HOST_PASSPHRASE;
  if (!expected) return false;
  const h = (s: string) => createHmac("sha256", "passphrase").update(s).digest();
  return timingSafeEqual(h(input), h(expected));
}

export const HOST_COOKIE = "host_session";
export const HOST_SESSION_SECONDS = HOST_SESSION_MS / 1000;
