export const EVENT_TZ = "America/Los_Angeles";

export function formatEvent(startsAt: Date) {
  const date = new Intl.DateTimeFormat("en-US", {
    timeZone: EVENT_TZ,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(startsAt);
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: EVENT_TZ,
    hour: "numeric",
    minute: "2-digit",
  })
    .format(startsAt)
    .replace(" AM", " am")
    .replace(" PM", " pm");
  return { date, time };
}

/** Form values for the host's event editor, in the event's time zone. */
export function toFormParts(startsAt: Date) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: EVENT_TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(startsAt)
      .map((x) => [x.type, x.value]),
  );
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

/** "2026-11-26" and "17:00" in the event's time zone to a real instant. */
export function fromFormParts(date: string, time: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{2}):(\d{2})$/.exec(time);
  if (!m || !t) return null;
  const asUtc = Date.UTC(+m[1], +m[2] - 1, +m[3], +t[1], +t[2]);
  if (Number.isNaN(asUtc)) return null;
  let guess = asUtc;
  for (let i = 0; i < 2; i++) {
    const shown = toFormParts(new Date(guess));
    const [sy, sm, sd] = shown.date.split("-").map(Number);
    const [sh, smin] = shown.time.split(":").map(Number);
    const shownUtc = Date.UTC(sy, sm - 1, sd, sh, smin);
    guess += asUtc - shownUtc;
  }
  return new Date(guess);
}
