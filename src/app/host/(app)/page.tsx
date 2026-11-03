import { GuestTable } from "@/components/guest-table";
import { Title } from "@/components/ui";
import { listGuests } from "@/server/host";
import { db } from "@/server/context";
import { ButtonLink } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function Guests({ searchParams }: PageProps<"/host">) {
  const sp = await searchParams;
  const { guests, totals } = await listGuests(db());
  const merged = typeof sp.merged === "string" ? sp.merged : null;
  const removed = typeof sp.removed === "string" ? sp.removed : null;
  return (
    <>
      <Title className="hidden md:block md:text-[42px] md:leading-[46px]">Guests</Title>
      {merged && (
        <div role="status" className="flex items-center gap-2.5 rounded-[14px] bg-green-tint p-3.5 pl-4 text-[19px] font-semibold text-green">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="11" fill="#2F4F3A" />
            <path d="m7 12.5 3.5 3.5 6.5-7.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Merged. {merged} are now one entry.
        </div>
      )}
      {removed && (
        <div role="status" className="rounded-[14px] bg-green-tint p-3.5 pl-4 text-[19px] font-semibold text-green">
          Removed {removed}. Their spot and dishes are released.
        </div>
      )}
      <div className="flex gap-4">
        <Stat value={totals.entries} label="Entries" />
        <Stat value={totals.people} label="People coming" />
      </div>
      {guests.length === 0 ? (
        <div className="flex flex-col gap-3.5 rounded-3xl bg-sheet p-7">
          <h2 className="font-display text-[28px] leading-8">Nobody has signed up yet</h2>
          <p className="text-xl leading-[27px] text-muted">Send the guest link to family and friends. People show up here as they say they&apos;re coming.</p>
          <div className="md:w-fit">
            <ButtonLink href="/" className="md:px-10">View guest page</ButtonLink>
          </div>
        </div>
      ) : (
        <GuestTable guests={guests} />
      )}
    </>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col rounded-[18px] bg-sheet p-4 md:max-w-[220px]">
      <span className="font-display text-[40px] leading-[44px]">{value}</span>
      <span className="text-[17px] text-muted">{label}</span>
    </div>
  );
}
