import { redirect } from "next/navigation";
import { HostLoginForm } from "@/components/host-login-form";
import { isHost } from "@/server/context";

export const dynamic = "force-dynamic";

export default async function HostLogin() {
  if (await isHost()) redirect("/host");
  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-[490px] flex-col justify-center px-6 py-10">
      <div className="rounded-[28px] bg-sheet p-9">
        <HostLoginForm />
      </div>
    </main>
  );
}
