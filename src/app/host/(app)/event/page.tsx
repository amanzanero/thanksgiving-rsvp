import { EventForm } from "@/components/event-form";
import { Title } from "@/components/ui";
import { toFormParts } from "@/lib/event-format";
import { requireEvent } from "@/server/context";

export const dynamic = "force-dynamic";

export default async function EventPage() {
  const ev = await requireEvent();
  return (
    <>
      <Title className="hidden md:block md:text-[42px] md:leading-[46px]">Event details</Title>
      <EventForm values={{ title: ev.title, address: ev.address, ...toFormParts(ev.startsAt) }} />
    </>
  );
}
