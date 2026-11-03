import type { PublicItem, SignedInItem } from "@/server/guest";
import { Divider, Pill, Sheet } from "./ui";

type Row = PublicItem | SignedInItem;

export function noteFor(it: Row): string | null {
  if ("claimers" in it) {
    const names = [...(it.mine && it.claimers.length ? ["You"] : []), ...it.claimers];
    if (names.length) return names.join(" and ");
  }
  if (it.quantityNeeded > 1) return it.claimed > 0 && it.claimed < it.quantityNeeded ? `${it.claimed} of ${it.quantityNeeded} taken` : `${it.quantityNeeded} needed`;
  return null;
}

export function BringRow({
  label,
  note: n,
  pill,
}: {
  label: string;
  note?: string | null;
  pill: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-3.5">
      <div className="flex min-w-0 flex-col [overflow-wrap:anywhere]">
        <span className="text-xl font-medium">{label}</span>
        {n && <span className="text-base text-muted">{n}</span>}
      </div>
      <span aria-hidden className="mb-1 h-[22px] min-w-4 flex-1 self-center border-b-2 border-dotted border-line" />
      {pill}
    </div>
  );
}

export function BringList({ items, hint, title = "What to bring" }: { items: Row[]; hint: string; title?: string }) {
  return (
    <Sheet className="px-5 pt-6 pb-2.5">
      <h2 className="font-display text-[30px] leading-[34px]">{title}</h2>
      <p className="mt-1 mb-3 text-lg leading-6 text-muted">{hint}</p>
      {items.length === 0 && <p className="py-4 text-lg text-muted">Nothing on the list yet.</p>}
      {items.map((it, i) => (
        <div key={it.id}>
          {i > 0 && <Divider />}
          <BringRow
            label={it.label}
            note={noteFor(it)}
            pill={"mine" in it && it.mine ? <Pill kind="you" /> : <Pill kind={it.status} />}
          />
        </div>
      ))}
    </Sheet>
  );
}
