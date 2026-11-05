"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { mergeAction } from "@/app/host/actions";
import type { MergeConflict } from "@/server/host";
import { Button, ErrorBox, Field, Sheet, Title, Help } from "./ui";
import { Stepper } from "./rsvp-wizard";

export function MergeForm({
  ids,
  entries,
  defaultName,
  defaultPartySize,
  conflicts,
}: {
  ids: string[];
  entries: { id: string; name: string; partySize: number }[];
  defaultName: string;
  defaultPartySize: number;
  conflicts: MergeConflict[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [name, setName] = useState(defaultName);
  const [party, setParty] = useState(defaultPartySize);
  const [keep, setKeep] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);

  const pick = (c: MergeConflict, entryId: string) =>
    setKeep((k) => {
      const cur = k[c.itemId] ?? [];
      if (c.quantityNeeded === 1) return { ...k, [c.itemId]: [entryId] };
      return { ...k, [c.itemId]: cur.includes(entryId) ? cur.filter((x) => x !== entryId) : [...cur, entryId].slice(-c.quantityNeeded) };
    });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const missing = conflicts.find((c) => !(keep[c.itemId]?.length));
    if (missing) return setError(`Pick who keeps ${missing.label}.`);
    start(async () => {
      const res = await mergeAction({ ids, displayName: name, partySize: party, keep });
      if (res?.error) setError(res.error);
    });
  }

  return (
    <Sheet className="flex flex-col gap-4.5 p-7">
      <form onSubmit={submit} className="flex flex-col gap-4.5" noValidate>
        <h2 className="font-display text-[28px]/8">Merge {entries.length} entries</h2>
        <p className="text-lg/6 text-muted">
          {entries.map((e) => e.name).join(" and ")} become one entry. Both browsers will open the merged entry.
        </p>
        <Field label="Name on the list" name="displayName" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
        <p className="text-[19px] font-semibold" id="merge-party">
          Total people
        </p>
        <Stepper value={party} onChange={setParty} labelId="merge-party" />
        <p className="text-[17px]/5.75  text-muted">
          {entries.map((e) => e.partySize).join(" and ")} {entries.length > 1 ? "were" : "was"} entered, so sizes aren&apos;t added together. Change it if that&apos;s wrong.
        </p>
        {conflicts.map((c) => (
          <fieldset key={c.itemId} className="flex flex-col gap-2.5">
            <legend className="font-display text-[22px]/7">
              {c.label}: only {c.quantityNeeded} needed
            </legend>
            <p className="text-lg text-muted">Both entries claimed it. Who keeps it?</p>
            {c.claimants.map((cl) => {
              const on = keep[c.itemId]?.includes(cl.entryId);
              return (
                <label key={cl.entryId} className={`flex min-h-18 cursor-pointer items-center gap-4 rounded-2xl p-4 ${on ? "bg-green-tint" : "bg-tablecloth"}`}>
                  <input
                    type={c.quantityNeeded === 1 ? "radio" : "checkbox"}
                    name={`keep-${c.itemId}`}
                    checked={!!on}
                    onChange={() => pick(c, cl.entryId)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden
                    className={`flex size-7 shrink-0 items-center justify-center rounded-lg peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-action ${on ? "bg-action" : "border-2 border-line bg-sheet"}`}
                  >
                    {on && (
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                        <path d="m4 10.5 4 4 8-9" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className="text-[21px] font-medium">{cl.name}</span>
                </label>
              );
            })}
          </fieldset>
        ))}
        {error && <ErrorBox>{error}</ErrorBox>}
        <Button type="submit" disabled={pending}>
          Merge entries
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
      </form>
    </Sheet>
  );
}

export { Title, Help };
