import { BringList } from "@/components/bring-list";
import { ButtonLink, Page, TextLink, Title } from "@/components/ui";
import { formatEvent } from "@/lib/event-format";
import { getBringList, type SignedInItem } from "@/server/guest";
import { db, getViewer, requireEvent } from "@/server/context";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const [ev, viewer] = await Promise.all([requireEvent(), getViewer()]);
  const items = await getBringList(db(), viewer?.id ?? null);
  const { date, time } = formatEvent(ev.startsAt);

  if (!viewer) {
    return (
      <Page>
        <header className="flex flex-col gap-3.5">
          <h1 className="font-display text-[44px] leading-[48px]">{ev.title}</h1>
          <p className="text-[21px] leading-7 text-muted">Come hungry, and tell us what you&apos;ll bring.</p>
        </header>
        <Details date={date} time={time} address={ev.address} />
        <div className="flex flex-col gap-2">
          <ButtonLink href="/join">I&apos;m coming</ButtonLink>
          <TextLink href="/find">Already signed up?</TextLink>
        </div>
        <BringList items={items} hint="Sign up to see who's bringing what." />
      </Page>
    );
  }

  const first = viewer.displayName.split(" ")[0];
  const mine = (items as SignedInItem[]).filter((i) => i.mine).map((i) => i.label);
  const saved = sp.saved === "1";
  return (
    <Page>
      {saved && (
        <div role="status" className="flex items-center gap-2.5 rounded-[14px] bg-green-tint p-3.5 pl-4 text-[19px] font-semibold text-green">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="11" fill="#2F4F3A" />
            <path d="m7 12.5 3.5 3.5 6.5-7.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Saved. You are on the list.
        </div>
      )}
      <Title>{saved ? `You're coming, ${first}.` : `Welcome back, ${first}.`}</Title>
      <div className="overflow-hidden rounded-[20px] shadow-[0_8px_20px_rgba(43,42,38,0.14)]">
        <div className="h-[52px] bg-hairline" />
        <div className="h-0.5 bg-line/35" />
        <div className="flex flex-col gap-1.5 bg-sheet p-6">
          <p className="font-display text-4xl leading-10">{viewer.displayName}</p>
          <p className="text-[21px] font-semibold">Party of {viewer.partySize}</p>
          <p className="text-xl text-muted">{mine.length ? `Bringing ${mine.map((m) => m.toLowerCase()).join(", ")}` : "Not bringing a dish yet"}</p>
        </div>
      </div>
      <ButtonLink href="/change" variant="secondary">
        Change anything
      </ButtonLink>
      <Details date={date} time={time} address={ev.address} />
      <BringList items={items} hint="You are signed up, so you can see who is bringing what." />
      <TextLink href="/cancel" tone="amber">
        I can&apos;t make it anymore
      </TextLink>
    </Page>
  );
}

function Details({ date, time, address }: { date: string; time: string; address: string }) {
  return (
    <section className="flex flex-col gap-0.5">
      <p className="text-[22px] font-semibold">{date}</p>
      <p className="text-xl">{time}</p>
      <p className="text-xl">{address}</p>
    </section>
  );
}
