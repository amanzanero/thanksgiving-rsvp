"use client";

import { useActionState, useState } from "react";
import { itemAction, removeItemAction, type FormState } from "@/app/host/actions";
import { Stepper } from "./rsvp-wizard";
import { BackLink, Button, ErrorBox, Field, Help, TextButton, Title } from "./ui";

export function ItemForm({ item, claimers }: { item?: { id: string; label: string; quantityNeeded: number }; claimers?: string[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(itemAction, {});
  const [qty, setQty] = useState(item?.quantityNeeded ?? 1);
  const edit = !!item;
  return (
    <div className="flex max-w-[560px] flex-col gap-6">
      <BackLink href="/host/bring-list" />
      <div className="flex flex-col gap-2.5">
        <Title>{edit ? "Edit item" : "Add an item"}</Title>
        {!edit && <Help>Guests will see it on the bring list.</Help>}
      </div>
      <form action={action} className="flex flex-col gap-6">
        {item && <input type="hidden" name="id" value={item.id} />}
        <input type="hidden" name="quantity" value={qty} />
        <Field label="Item name" name="label" defaultValue={state.values?.label ?? item?.label ?? ""} required maxLength={80} />
        <div className="flex flex-col gap-3">
          <p className="text-[19px] font-semibold" id="qty-label">
            How many are needed?
          </p>
          <Stepper value={qty} onChange={setQty} labelId="qty-label" />
        </div>
        {edit && claimers && claimers.length > 0 && (
          <p className="text-lg leading-6 text-muted">{claimers.join(" and ")} claimed this. Removing it releases their claims.</p>
        )}
        {state.error && <ErrorBox>{state.error}</ErrorBox>}
        <Button type="submit" disabled={pending}>
          {edit ? "Save changes" : "Add item"}
        </Button>
      </form>
      {edit && (
        <form action={removeItemAction}>
          <input type="hidden" name="id" value={item.id} />
          <TextButton tone="amber" className="w-full">
            Remove item
          </TextButton>
        </form>
      )}
    </div>
  );
}
