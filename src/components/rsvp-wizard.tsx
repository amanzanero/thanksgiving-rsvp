"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { signUpAction, updateAction } from "@/app/actions";
import type { PublicItem, SignedInItem } from "@/server/guest";
import { noteFor, BringRow } from "./bring-list";
import { BackLink, Button, ErrorBox, Field, Help, Pill, Sheet, TextButton, Title, Divider } from "./ui";

type Row = PublicItem | SignedInItem;
type Step = "who" | "dishes" | "add";

export function RsvpWizard({
  mode,
  items,
  initial,
}: {
  mode: "new" | "edit";
  items: Row[];
  initial?: { firstName: string; lastName: string; partySize: number; selected: string[] };
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [step, setStep] = useState<Step>("who");
  const [first, setFirst] = useState(initial?.firstName ?? "");
  const [last, setLast] = useState(initial?.lastName ?? "");
  const [party, setParty] = useState(initial?.partySize ?? 2);
  const [selected, setSelected] = useState<string[]>(initial?.selected ?? []);
  const [added, setAdded] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<{ first?: string; last?: string; draft?: string }>({});
  const [formError, setFormError] = useState<{ message: string; code?: string } | null>(null);

  const edit = mode === "edit";
  const pickable = items.filter((i) => i.status === "needed" || ("mine" in i && i.mine));
  const taken = items.filter((i) => !pickable.includes(i));
  // A dish that was taken while this form was open drops out of the selection.
  const chosen = selected.filter((id) => pickable.some((p) => p.id === id));

  function next() {
    const e: typeof errors = {};
    if (!edit && !first.trim()) e.first = "Enter your first name.";
    if (!edit && !last.trim()) e.last = "Enter your last name.";
    setErrors(e);
    if (Object.keys(e).length) return;
    setFormError(null);
    setStep("dishes");
  }

  function submit(ids: string[], dishes: string[]) {
    setFormError(null);
    start(async () => {
      const res = edit
        ? await updateAction({ partySize: party, itemIds: ids, newDishes: dishes })
        : await signUpAction({ firstName: first, lastName: last, partySize: party, itemIds: ids, newDishes: dishes, website });
      if (res?.error) {
        setFormError({ message: res.error, code: res.code });
        if (res.code === "name_taken" || res.code === "invalid_input") setStep("who");
        if (res.code === "item_taken") router.refresh();
      }
    });
  }

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  const errorBox = formError && (
    <ErrorBox>
      {formError.message}
      {formError.code === "name_taken" && (
        <>
          {" "}
          <Link href="/find" className="underline">
            Already signed up?
          </Link>
        </>
      )}
    </ErrorBox>
  );

  if (step === "who") {
    return (
      <form
        className="flex flex-1 flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          next();
        }}
        noValidate
      >
        <BackLink href="/" />
        <div className="flex flex-col gap-2.5">
          <Title>{edit ? "Who's coming?" : "Who's coming?"}</Title>
          <Help>{edit ? "Change how many of you there are." : "Your name and how many of you there are. That is all we need."}</Help>
        </div>
        {errorBox}
        {!edit && (
          <>
            <Field label="First name" name="firstName" autoComplete="given-name" value={first} onChange={(e) => { setFirst(e.target.value); setErrors((x) => ({ ...x, first: undefined })); }} error={errors.first} maxLength={60} />
            <Field label="Last name" name="lastName" autoComplete="family-name" value={last} onChange={(e) => { setLast(e.target.value); setErrors((x) => ({ ...x, last: undefined })); }} error={errors.last} maxLength={60} />
            <div className="absolute left-[-9999px] size-0 overflow-hidden" aria-hidden>
              <input name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>
          </>
        )}
        <div className="flex flex-col gap-3">
          <p className="text-[19px] font-semibold" id="party-label">
            How many people, including you?
          </p>
          <Stepper value={party} onChange={setParty} labelId="party-label" />
        </div>
        <div className="mt-auto" />
        <Button type="submit">Next: pick a dish</Button>
      </form>
    );
  }

  if (step === "add") {
    return (
      <form
        className="flex flex-1 flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          const d = draft.trim().replace(/\s+/g, " ");
          if (!d) return setErrors({ draft: "Enter a dish name." });
          if (d.length > 80) return setErrors({ draft: "That dish name is too long." });
          setAdded((a) => [...a, d]);
          setDraft("");
          setErrors({});
          setStep("dishes");
        }}
        noValidate
      >
        <button type="button" onClick={() => setStep("dishes")} className="-ml-1 flex min-h-12 w-fit items-center gap-1 text-[19px] font-semibold">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
        <div className="flex flex-col gap-2.5">
          <Title>Add your dish</Title>
          <Help>Type what you&apos;re bringing. Everyone can see it on the list.</Help>
        </div>
        <Field label="Dish name" name="dish" value={draft} onChange={(e) => { setDraft(e.target.value); setErrors({}); }} error={errors.draft} placeholder="Grandma's green bean casserole" maxLength={80} autoFocus />
        <div className="mt-auto" />
        <Button type="submit">Add dish</Button>
      </form>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <button type="button" onClick={() => setStep("who")} className="-ml-1 flex min-h-12 w-fit items-center gap-1 text-[19px] font-semibold">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back
      </button>
      <div className="flex flex-col gap-2.5">
        <Title>What will you bring?</Title>
        <Help>Pick anything that is still needed. You can change this later.</Help>
      </div>
      {errorBox}
      <div className="flex flex-col gap-2.5" role="group" aria-label="Dishes still needed">
        {pickable.map((it) => (
          <PickRow key={it.id} label={it.label} checked={chosen.includes(it.id)} onChange={() => toggle(it.id)} />
        ))}
        {added.map((d, i) => (
          <PickRow key={`${d}-${i}`} label={d} checked onChange={() => setAdded((a) => a.filter((_, j) => j !== i))} />
        ))}
        <button
          type="button"
          onClick={() => setStep("add")}
          className="flex h-16 items-center justify-center rounded-2xl border-2 border-dashed border-ink text-xl font-semibold"
        >
          + Add your own dish
        </button>
      </div>
      {taken.length > 0 && (
        <Sheet className="px-5 pt-5 pb-2">
          <h2 className="text-xl font-semibold">Already taken</h2>
          {taken.map((it, i) => (
            <div key={it.id}>
              {i > 0 && <Divider />}
              <BringRow label={it.label} note={noteFor(it)} pill={<Pill kind="taken" />} />
            </div>
          ))}
        </Sheet>
      )}
      <TextButton type="button" onClick={() => submit([], [])} disabled={pending}>
        I&apos;m not bringing anything
      </TextButton>
      <div className="mt-auto" />
      <Button type="button" disabled={pending} onClick={() => submit(chosen, added)}>
        {edit ? "Save changes" : "Save my spot"}
      </Button>
    </div>
  );
}

function PickRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className={`flex min-h-18 cursor-pointer items-center gap-4 rounded-2xl p-4 ${checked ? "bg-green-tint" : "bg-sheet"}`}>
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        aria-hidden
        className={`flex size-7 shrink-0 items-center justify-center rounded-lg border-2 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-action ${checked ? "border-action bg-action" : "border-line bg-sheet"}`}
      >
        {checked && (
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="m4 10.5 4 4 8-9" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="text-[21px] font-medium">{label}</span>
    </label>
  );
}

export function Stepper({ value, onChange, labelId }: { value: number; onChange: (n: number) => void; labelId: string }) {
  const btn = "flex size-16 items-center justify-center rounded-full";
  return (
    <div className="flex items-center justify-between rounded-[20px] bg-sheet p-3" role="group" aria-labelledby={labelId}>
      <button type="button" aria-label="One fewer person" onClick={() => onChange(Math.max(1, value - 1))} className={`${btn} bg-hairline text-ink`}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
          <path d="M6 14h16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </button>
      <span className="font-display text-[56px]/15 " aria-live="polite">
        {value}
      </span>
      <button type="button" aria-label="One more person" onClick={() => onChange(Math.min(50, value + 1))} className={`${btn} bg-ink text-sheet`}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
          <path d="M14 6v16M6 14h16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
