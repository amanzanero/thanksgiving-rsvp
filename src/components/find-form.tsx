"use client";

import Link from "next/link";
import { useActionState } from "react";
import { lookupAction, type LookupState } from "@/app/actions";
import { BackLink, Button, ErrorBox, Field, Help, Honeypot, Title } from "./ui";

export function FindForm() {
  const [state, action, pending] = useActionState<LookupState, FormData>(lookupAction, {});
  return (
    <form action={action} className="flex flex-1 flex-col gap-6">
      <BackLink href="/" />
      <div className="flex flex-col gap-2.5">
        <Title>Find your spot</Title>
        <Help>Type your name the way you signed up. Capital letters don&apos;t matter.</Help>
      </div>
      <Field label="First name" name="firstName" defaultValue={state.first} autoComplete="given-name" required maxLength={60} />
      <Field label="Last name" name="lastName" defaultValue={state.last} autoComplete="family-name" required maxLength={60} />
      <Honeypot />
      {state.error && <ErrorBox>{state.error}</ErrorBox>}
      <div className="mt-auto" />
      <Button type="submit" disabled={pending}>
        {state.error && !state.limited ? "Try again" : state.limited ? "Try again" : "Find me"}
      </Button>
      {state.error && !state.limited && (
        <Link href="/join" className="flex min-h-12 items-center justify-center text-[19px] font-semibold underline underline-offset-4">
          I&apos;m coming
        </Link>
      )}
    </form>
  );
}
