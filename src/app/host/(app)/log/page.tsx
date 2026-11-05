import { Divider, Sheet, Title } from "@/components/ui";
import { describeLog, formatLogTime } from "@/lib/log-format";
import { getChangeLog } from "@/server/host";
import { db } from "@/server/context";

export const dynamic = "force-dynamic";

export default async function Log() {
  const rows = await getChangeLog(db());
  return (
    <>
      <Title className="hidden md:block md:text-[42px]/11.5 ">Change log</Title>
      <Sheet className="px-7 py-2.5 md:max-w-190">
        {rows.length === 0 && <p className="py-4 text-lg text-muted">Nothing has changed yet.</p>}
        {rows.map((r, i) => {
          const d = describeLog(r);
          return (
            <div key={r.id}>
              {i > 0 && <Divider />}
              <div className="flex flex-col gap-0.5 py-3.5">
                <p className="text-[19px] font-medium">{d.title}</p>
                {d.detail && <p className="text-[17px] text-muted">{d.detail}</p>}
                <p className="text-[15px] text-muted">{formatLogTime(r.at)}</p>
              </div>
            </div>
          );
        })}
      </Sheet>
    </>
  );
}
