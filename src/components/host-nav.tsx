"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/host/actions";

const items = [
  { href: "/host", label: "Guests" },
  { href: "/host/bring-list", label: "Bring list" },
  { href: "/host/log", label: "Log" },
  { href: "/host/event", label: "Event" },
];

function useActive() {
  const path = usePathname();
  return (href: string) => (href === "/host" ? path === "/host" || path.startsWith("/host/merge") : path.startsWith(href));
}

/** Sidebar from md up. */
export function HostSidebar({ title }: { title: string }) {
  const active = useActive();
  return (
    <aside className="hidden w-[280px] shrink-0 flex-col gap-2 bg-sheet p-7 md:flex">
      <p className="font-display text-[25px] leading-[29px]">{title}</p>
      <p className="text-lg text-muted">Host view</p>
      <nav aria-label="Host" className="mt-5 flex flex-col gap-2">
        {items.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active(i.href) ? "page" : undefined}
            className={`flex h-[52px] items-center rounded-xl px-4 text-[19px] ${active(i.href) ? "bg-green-tint font-semibold" : "font-medium text-muted"}`}
          >
            {i.label}
          </Link>
        ))}
      </nav>
      <form action={logoutAction} className="mt-auto">
        <button className="flex min-h-12 w-full items-center justify-center text-[19px] font-semibold underline underline-offset-4">Sign out</button>
      </form>
    </aside>
  );
}

/** Tabs below md. */
export function HostTabs() {
  const active = useActive();
  return (
    <nav aria-label="Host" className="flex gap-1 rounded-[14px] bg-hairline p-1 md:hidden">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          aria-current={active(i.href) ? "page" : undefined}
          className={`flex h-11 flex-auto items-center justify-center rounded-[10px] px-2 text-base font-semibold whitespace-nowrap ${active(i.href) ? "bg-sheet text-ink" : "text-muted"}`}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
