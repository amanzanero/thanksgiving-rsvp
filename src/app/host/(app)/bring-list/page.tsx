import Link from "next/link";
import { BringRow } from "@/components/bring-list";
import { ButtonLink, Divider, Pill, Sheet, Title } from "@/components/ui";
import { hostBringList } from "@/server/host";
import { db } from "@/server/context";

export const dynamic = "force-dynamic";

export default async function BringListPage() {
  const items = await hostBringList(db());
  return (
    <>
      <Title className="hidden md:block md:text-[42px] md:leading-[46px]">Bring list</Title>
      <Sheet className="px-5 py-3.5 min-[360px]:px-7">
        {items.length === 0 && <p className="py-4 text-lg text-muted">Nothing on the list yet. Add the first item.</p>}
        {items.map((it, i) => {
          const note = it.claimers.length ? it.claimers.join(" and ") : it.quantityNeeded > 1 ? `${it.claimed} of ${it.quantityNeeded} claimed` : null;
          return (
            <div key={it.id}>
              {i > 0 && <Divider />}
              <Link href={`/host/bring-list/${it.id}`} className="block rounded-lg" aria-label={`Edit ${it.label}`}>
                <BringRow label={it.label} note={note} pill={<Pill kind={it.status} />} />
              </Link>
            </div>
          );
        })}
      </Sheet>
      <p className="text-lg/6 text-muted">Names show here because you are the host. Guests who have not signed up only see Taken. Tap an item to edit it.</p>
      <div className="md:w-fit">
        <ButtonLink href="/host/bring-list/new" variant="secondary" className="md:min-w-[220px]">
          Add an item
        </ButtonLink>
      </div>
    </>
  );
}
