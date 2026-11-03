import { redirect } from "next/navigation";
import { RsvpWizard } from "@/components/rsvp-wizard";
import { Page } from "@/components/ui";
import { getBringList } from "@/server/guest";
import { db, getViewer } from "@/server/context";

export const dynamic = "force-dynamic";

export default async function Join() {
  if (await getViewer()) redirect("/change");
  const items = await getBringList(db(), null);
  return (
    <Page>
      <RsvpWizard mode="new" items={items} />
    </Page>
  );
}
