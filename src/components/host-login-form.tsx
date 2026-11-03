"use client";

import { useActionState } from "react";
import { loginAction, type FormState } from "@/app/host/actions";
import { Button, ErrorBox, Field, Help, Honeypot } from "./ui";

export function HostLoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, {});
  return (
    <form action={action} className="flex flex-col gap-5">
      <h1 className="font-display text-[38px] leading-[42px]">Host sign in</h1>
      <Help>Enter the host passphrase to see your guest list.</Help>
      <Field label="Passphrase" name="passphrase" type="password" autoComplete="current-password" required />
      <Honeypot />
      {state.error && <ErrorBox>{state.error}</ErrorBox>}
      <Button type="submit" disabled={pending}>
        Open host view
      </Button>
    </form>
  );
}
