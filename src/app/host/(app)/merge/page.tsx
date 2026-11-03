import { redirect } from "next/navigation";
import { GuestTable } from "@/components/guest-table";
import { MergeForm } from "@/components/merge-form";
import { BackLink } from "@/components/ui";
import { GuestError } from "@/server/guest";
import { listGuests, previewMerge } from "@/server/host";
import { db } from "@/server/context";

export const dynamic = "force-dynamic";

export default async function Merge({ searchParams }: PageProps<"/host/merge">) {
  const sp = await searchParams;
  const ids = (typeof sp.ids === "string" ? sp.ids : "").split(",").filter(Boolean);
  let preview;
  try {
    preview = await previewMerge(db(), ids);
  } catch (e) {
    if (e instanceof GuestError) redirect("/host");
    throw e;
  }
  const { guests } = await listGuests(db());
  return (
    <div className="flex flex-col gap-6">
      <BackLink href="/host" />
      <div className="flex flex-col gap-7 xl:flex-row xl:items-start">
        <div className="hidden min-w-0 flex-1 xl:block">
          <GuestTable guests={guests} selectable={false} highlight={ids} />
        </div>
        <div className="xl:w-[400px] xl:shrink-0">
          <MergeForm ids={ids} {...preview} />
        </div>
      </div>
    </div>
  );
}
