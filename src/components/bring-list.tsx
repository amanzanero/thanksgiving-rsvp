import Link from "next/link";
import type { BringItem } from "@/server/guest";
import { Divider, Pill, Sheet } from "./ui";

export function noteFor(it: BringItem): string | null {
  const names = [...(it.mine ? ["You"] : []), ...it.claimers];
  const who = names.join(", ");
  if (it.quantityNeeded > 1) {
    const count = it.claimed >= it.quantityNeeded ? `${it.quantityNeeded} covered` : `${it.claimed} of ${it.quantityNeeded} covered`;
    return who ? `${who} · ${count}` : `${it.quantityNeeded} needed`;
  }
  return who || null;
}

export function BringRow({
  label,
  note: n,
  pill,
  href,
}: {
  label: string;
  note?: string | null;
  pill: React.ReactNode;
  href?: string;
}) {
  const body = (
    <>
      <div className="flex min-w-0 flex-col wrap-anywhere">
        <span className="text-xl font-medium">{label}</span>
        {n && <span className="text-base text-muted">{n}</span>}
      </div>
      <span aria-hidden className="mb-1 h-5.5 min-w-4 flex-1 self-center max-[359px]:min-w-0 max-[359px]:border-transparent border-b-2 border-dotted border-line" />
      {pill}
    </>
  );
  const cls = "flex items-center gap-3 py-3.5";
  return href ? (
    <Link href={href} className={`${cls} -mx-2 rounded-xl px-2 active:bg-hairline/60`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/**
 * The bring list on the home page. Dishes that are still needed come first and are tappable,
 * with a clear way to add your own. Covered dishes follow, with who is bringing them.
 */
export function BringList({
  items,
  hint,
  pickHref,
  addHref,
}: {
  items: BringItem[];
  hint: string;
  pickHref: (id: string) => string;
  addHref: string;
}) {
  const needed = items.filter((i) => i.status === "needed");
  const covered = items.filter((i) => i.status === "taken");
  return (
    <Sheet className="flex flex-col gap-5 px-5 pt-6 pb-5">
      <div>
        <h2 className="font-display text-[30px]/8.5">What to bring</h2>
        <p className="mt-1 text-lg/6 text-muted">{hint}</p>
      </div>

      <section aria-label="Still needed">
        <h3 className="text-[17px] font-bold tracking-wide text-amber uppercase">Still needed ({needed.length})</h3>
        {needed.length === 0 && <p className="py-3 text-lg text-muted">Everything on the list is covered. Add your own below.</p>}
        {needed.map((it, i) => (
          <div key={it.id}>
            {i > 0 && <Divider />}
            <BringRow label={it.label} note={noteFor(it)} pill={<Pill kind="needed" />} href={pickHref(it.id)} />
          </div>
        ))}
        <Link
          href={addHref}
          className="mt-3 flex h-16 items-center justify-center rounded-2xl border-2 border-dashed border-ink text-xl font-semibold"
        >
          + Add your own dish
        </Link>
      </section>

      {covered.length > 0 && (
        <section aria-label="Already on the table">
          <h3 className="text-[17px] font-bold tracking-wide text-green uppercase">Already on the table ({covered.length})</h3>
          {covered.map((it, i) => (
            <div key={it.id}>
              {i > 0 && <Divider />}
              <BringRow label={it.label} note={noteFor(it)} pill={it.mine ? <Pill kind="you" /> : <Pill kind="taken" />} />
            </div>
          ))}
        </section>
      )}
    </Sheet>
  );
}
