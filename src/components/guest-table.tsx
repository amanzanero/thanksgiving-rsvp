"use client";

import Link from "next/link";
import { useState } from "react";
import { Sheet } from "./ui";

type Guest = { id: string; name: string; partySize: number; dishes: string[] };

export function GuestTable({ guests, selectable = true, highlight = [] }: { guests: Guest[]; selectable?: boolean; highlight?: string[] }) {
  const [picked, setPicked] = useState<string[]>([]);
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const on = (id: string) => (selectable ? picked.includes(id) : highlight.includes(id));

  return (
    <div className="flex flex-col gap-6">
      {selectable && (
        <p className="text-[19px] text-muted">
          {picked.length < 2 ? "Select two or more entries to merge duplicates." : `${picked.length} selected.`}
        </p>
      )}
      <Sheet className="@container p-2 md:p-4">
        <div className="hidden items-center gap-4 px-4 pb-2 text-base font-semibold text-muted @min-[560px]:flex">
          <span className="w-7" />
          <span className="flex-1">Name</span>
          <span className="w-[240px]">Dishes</span>
          <span className="w-[60px] text-right">People</span>
        </div>
        {guests.length === 0 && <p className="p-4 text-lg text-muted">Nobody yet.</p>}
        <ul className="flex flex-col gap-0.5">
          {guests.map((g) => (
            <li key={g.id}>
              <label className={`flex items-center gap-4 rounded-xl px-3 py-3.5 @min-[560px]:px-4 ${selectable ? "cursor-pointer" : ""} ${on(g.id) ? "bg-green-tint" : ""}`}>
                {selectable ? (
                  <input type="checkbox" className="peer sr-only" checked={picked.includes(g.id)} onChange={() => toggle(g.id)} />
                ) : (
                  <span className="sr-only">{on(g.id) ? "Selected" : ""}</span>
                )}
                <span
                  aria-hidden
                  className={`flex size-7 shrink-0 items-center justify-center rounded-lg peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-action ${on(g.id) ? "bg-action" : "border-2 border-line bg-sheet"}`}
                >
                  {on(g.id) && (
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                      <path d="m4 10.5 4 4 8-9" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className="flex min-w-0 flex-1 flex-col @min-[560px]:flex-row @min-[560px]:items-center @min-[560px]:gap-4">
                  <span className="min-w-0 flex-1 text-xl font-medium [overflow-wrap:anywhere]">{g.name}</span>
                  <span className="min-w-0 text-base text-muted [overflow-wrap:anywhere] @min-[560px]:w-[240px] @min-[560px]:text-lg">{g.dishes.length ? g.dishes.join(", ") : "No dish yet"}</span>
                </span>
                <span className="font-display text-[26px] @min-[560px]:w-[60px] @min-[560px]:text-right">{g.partySize}</span>
              </label>
            </li>
          ))}
        </ul>
      </Sheet>
      {selectable && picked.length >= 2 && (
        <Link
          href={`/host/merge?ids=${picked.join(",")}`}
          className="flex h-16 w-full items-center justify-center rounded-2xl bg-action px-6 text-[22px] font-bold text-sheet md:w-fit"
        >
          Merge {picked.length} selected
        </Link>
      )}
    </div>
  );
}
