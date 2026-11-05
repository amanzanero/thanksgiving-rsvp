"use client";

import { useActionState } from "react";
import { eventAction, type FormState } from "@/app/host/actions";
import { Button, ErrorBox, Field } from "./ui";

export function EventForm({ values }: { values: { title: string; date: string; time: string; address: string } }) {
  const [state, action, pending] = useActionState<FormState, FormData>(eventAction, { values });
  const v = state.values ?? values;
  const saved = !state.error && state !== undefined && state.values && state.values !== values;
  return (
    <form action={action} className="flex max-w-165 flex-col gap-5 rounded-3xl bg-sheet p-6 md:p-8">
      <Field label="Title" name="title" defaultValue={v.title} required maxLength={120} />
      <div className="grid gap-4 sm:max-md:grid-cols-2 lg:grid-cols-2">
        <Field label="Date" name="date" type="date" defaultValue={v.date} required />
        <Field label="Time" name="time" type="time" defaultValue={v.time} required />
      </div>
      <Field label="Address" name="address" defaultValue={v.address} required maxLength={200} />
      {state.error && <ErrorBox>{state.error}</ErrorBox>}
      {saved && (
        <p role="status" className="text-[19px] font-semibold text-green">
          Saved.
        </p>
      )}
      <div className="md:w-fit">
        <Button type="submit" disabled={pending} className="md:min-w-60">
          Save changes
        </Button>
      </div>
    </form>
  );
}
