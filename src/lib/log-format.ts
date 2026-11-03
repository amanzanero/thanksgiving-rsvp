type Row = {
  actor: string;
  action: string;
  target: string;
  before: unknown;
  after: unknown;
};

const obj = (v: unknown) => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});

/** Turns a change log row into plain sentences for the host. */
export function describeLog(r: Row): { title: string; detail: string } {
  const b = obj(r.before);
  const a = obj(r.after);
  switch (r.action) {
    case "sign_up":
      return { title: `${r.actor} signed up`, detail: `Party of ${a.partySize ?? "?"}` };
    case "edit":
      return {
        title: `${r.actor} changed ${r.target}`,
        detail: `${b.partySize ?? ""} to ${a.partySize ?? ""}`.trim(),
      };
    case "cancel": {
      const dishes = Array.isArray(b.dishes) ? (b.dishes as string[]) : [];
      return {
        title: `${r.actor} cancelled`,
        detail: dishes.length ? `Spot released. ${dishes.join(", ")} back to Still needed` : "Spot released",
      };
    }
    case "claim":
      return { title: `${r.actor} claimed ${r.target}`, detail: a.added ? "Added their own dish" : "" };
    case "release":
      return { title: `${r.actor} released ${r.target}`, detail: "Back on the list" };
    case "merge": {
      const from = Array.isArray(b.entries)
        ? (b.entries as { name: string; partySize: number }[]).map((e) => `${e.name} (${e.partySize})`).join(" and ")
        : "";
      return {
        title: `${r.actor} merged ${Array.isArray(b.entries) ? b.entries.length : "two"} entries`,
        detail: `${from} became ${a.name} (${a.partySize})`,
      };
    }
    default:
      return { title: `${r.actor} changed ${r.target}`, detail: summarize(b, a) };
  }
}

function summarize(b: Record<string, unknown>, a: Record<string, unknown>) {
  const keys = Object.keys(a);
  if (!keys.length) return "";
  return keys.map((k) => `${k}: ${b[k] ?? "none"} to ${a[k]}`).join(". ");
}

const LOG_TZ = "America/Los_Angeles";
const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: LOG_TZ }).format(d);

/** "Today, 6:40 pm", "Yesterday, 9:03 pm", or "Nov 1, 8:45 am". */
export function formatLogTime(at: Date, now = new Date()): string {
  const time = new Intl.DateTimeFormat("en-US", { timeZone: LOG_TZ, hour: "numeric", minute: "2-digit" })
    .format(at)
    .replace(" AM", " am")
    .replace(" PM", " pm");
  if (dayKey(at) === dayKey(now)) return `Today, ${time}`;
  if (dayKey(at) === dayKey(new Date(now.getTime() - 24 * 60 * 60 * 1000))) return `Yesterday, ${time}`;
  const day = new Intl.DateTimeFormat("en-US", { timeZone: LOG_TZ, month: "short", day: "numeric" }).format(at);
  return `${day}, ${time}`;
}
