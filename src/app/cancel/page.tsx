import { redirect } from "next/navigation";
import { ButtonLink, Button, Help, Page, Title } from "@/components/ui";
import { getBringList, type SignedInItem } from "@/server/guest";
import { cancelAction } from "@/app/actions";
import { db, getViewer } from "@/server/context";

export const dynamic = "force-dynamic";

export default async function Cancel() {
  const viewer = await getViewer();
  if (!viewer) redirect("/");
  const dishes = ((await getBringList(db(), viewer.id)) as SignedInItem[]).filter((i) => i.mine).map((i) => i.label.toLowerCase());
  const dishText = dishes.length ? ` and your ${dishes.length > 1 ? "dishes" : "dish"}, ${dishes.join(", ")}, go back to Still needed` : "";
  return (
    <Page>
      <div className="flex flex-col gap-2.5">
        <Title>Release your spot?</Title>
        <Help>
          You&apos;ll come off the list{dishText}. Andrew and Isabella will see that you cancelled.
        </Help>
      </div>
      <div className="mt-auto" />
      <ButtonLink href="/">Keep my spot</ButtonLink>
      <form action={cancelAction}>
        <Button type="submit" variant="secondary">
          I can&apos;t make it anymore
        </Button>
      </form>
    </Page>
  );
}
