import { redirect } from "next/navigation";
import { RsvpWizard } from "@/components/rsvp-wizard";
import { Page } from "@/components/ui";
import { getBringList } from "@/server/guest";
import { db, getViewer } from "@/server/context";

export const dynamic = "force-dynamic";

export default async function Change({ searchParams }: PageProps<"/change">) {
  const sp = await searchParams;
  const viewer = await getViewer();
  if (!viewer) redirect("/join");
  const items = await getBringList(db(), viewer.id);
  const [firstName, ...rest] = viewer.displayName.split(" ");
  return (
    <Page>
      <RsvpWizard
        mode="edit"
        items={items}
        preselect={typeof sp.dish === "string" ? sp.dish : undefined}
        openAdd={sp.add === "1"}
        initial={{ firstName, lastName: rest.join(" "), partySize: viewer.partySize, selected: items.filter((i) => i.mine).map((i) => i.id) }}
      />
    </Page>
  );
}
