import { redirect } from "next/navigation";
import { HostSidebar, HostTabs } from "@/components/host-nav";
import { logoutAction } from "@/app/host/actions";
import { isHost, requireEvent } from "@/server/context";

export const dynamic = "force-dynamic";

export default async function HostLayout({ children }: LayoutProps<"/host">) {
  if (!(await isHost())) redirect("/host/login");
  const ev = await requireEvent();
  return (
    <div className="flex min-h-dvh">
      <HostSidebar title={ev.title} />
      <div className="mx-auto flex w-full max-w-[1040px] min-w-0 flex-1 flex-col gap-6 px-6 pt-[60px] pb-10 md:px-12 md:pt-12">
        <div className="flex flex-col gap-2 md:hidden">
          <p className="font-display text-[38px] leading-[42px]">Host view</p>
          <p className="text-xl text-muted">{ev.title}</p>
        </div>
        <HostTabs />
        {children}
        <form action={logoutAction} className="md:hidden">
          <button className="flex min-h-12 w-full items-center justify-center text-[19px] font-semibold underline underline-offset-4">Sign out</button>
        </form>
      </div>
    </div>
  );
}
