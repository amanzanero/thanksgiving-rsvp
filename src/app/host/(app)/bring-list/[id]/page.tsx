import { notFound } from "next/navigation";
import { ItemForm } from "@/components/item-form";
import { hostBringList } from "@/server/host";
import { db } from "@/server/context";

export const dynamic = "force-dynamic";

export default async function EditItem({ params }: PageProps<"/host/bring-list/[id]">) {
  const { id } = await params;
  const it = (await hostBringList(db())).find((i) => i.id === id);
  if (!it) notFound();
  return <ItemForm item={it} claimers={it.claimers} />;
}
