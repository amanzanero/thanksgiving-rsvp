import { redirect } from "next/navigation";
import { RsvpWizard } from "@/components/rsvp-wizard";
import { Page } from "@/components/ui";
import { getBringList, type SignedInItem } from "@/server/guest";
import { db, getViewer } from "@/server/context";

export const dynamic = "force-dynamic";

export default async function Change() {
  const viewer = await getViewer();
  if (!viewer) redirect("/join");
  const items = (await getBringList(db(), viewer.id)) as SignedInItem[];
  const [firstName, ...rest] = viewer.displayName.split(" ");
  return (
    <Page>
      <RsvpWizard
        mode="edit"
        items={items}
        initial={{ firstName, lastName: rest.join(" "), partySize: viewer.partySize, selected: items.filter((i) => i.mine).map((i) => i.id) }}
      />
    </Page>
  );
}
