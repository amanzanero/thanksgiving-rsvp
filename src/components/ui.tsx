import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary";

const buttonBase =
  "flex min-h-16 w-full items-center justify-center rounded-2xl px-6 py-3 text-center text-[22px] leading-7 font-bold text-balance transition-colors disabled:opacity-60";
const buttonVariants: Record<Variant, string> = {
  primary: "bg-action text-sheet hover:bg-[#264030]",
  secondary: "bg-green-tint text-ink hover:bg-[#cfddcc]",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={`${buttonBase} ${buttonVariants[variant]} ${className}`} {...props} />;
}

export function ButtonLink({
  href,
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`${buttonBase} ${buttonVariants[variant]} ${className}`}>
      {children}
    </Link>
  );
}

export function TextLink({
  href,
  children,
  tone = "ink",
}: {
  href: string;
  children: ReactNode;
  tone?: "ink" | "amber";
}) {
  return (
    <Link
      href={href}
      className={`flex min-h-12 items-center justify-center px-2 text-[19px] font-semibold underline underline-offset-4 ${tone === "amber" ? "text-amber" : ""}`}
    >
      {children}
    </Link>
  );
}

export function TextButton({
  tone = "ink",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "ink" | "amber" }) {
  return (
    <button
      className={`flex min-h-12 items-center justify-center px-2 text-[19px] font-semibold underline underline-offset-4 ${tone === "amber" ? "text-amber" : ""} ${className}`}
      {...props}
    />
  );
}

export function BackLink({ href }: { href: string }) {
  return (
    <Link href={href} className="-ml-1 flex min-h-12 w-fit items-center gap-1 text-[19px] font-semibold">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Back
    </Link>
  );
}

export function Pill({ kind, children }: { kind: "needed" | "taken" | "you" | "conflict"; children?: ReactNode }) {
  const styles = {
    needed: "bg-amber-tint text-amber",
    conflict: "bg-amber-tint text-amber",
    taken: "bg-green-tint text-green",
    you: "bg-green text-sheet",
  }[kind];
  const label = children ?? { needed: "Still needed", conflict: "Conflict", taken: "Taken", you: "You" }[kind];
  return <span className={`shrink-0 rounded-full px-3.5 py-1.5 text-base font-bold ${styles}`}>{label}</span>;
}

export function Sheet({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl bg-sheet p-5 ${className}`}>{children}</div>;
}

export function Title({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h1 className={`font-display text-[40px] leading-[44px] ${className}`}>{children}</h1>;
}

export function Help({ children }: { children: ReactNode }) {
  return <p className="text-[20px] leading-[27px] text-muted">{children}</p>;
}

export function ErrorBox({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <div id={id} role="alert" className="rounded-2xl bg-amber-tint p-4 text-[19px] leading-[26px] font-medium">
      {children}
    </div>
  );
}

export function Field({
  label,
  name,
  defaultValue,
  error,
  type = "text",
  autoComplete,
  required,
  ...rest
}: {
  label: string;
  name: string;
  defaultValue?: string;
  error?: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name" | "type" | "defaultValue">) {
  const id = `f-${name}`;
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={id} className="text-[19px] font-semibold">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`min-h-16 w-full max-w-full min-w-0 appearance-none rounded-[14px] border-2 border-line px-5 py-3 text-left text-[22px] ${error ? "bg-amber-tint" : "bg-sheet"}`}
        {...rest}
      />
      {error && (
        <p id={`${id}-error`} className="text-[19px] font-semibold text-amber">
          {error}
        </p>
      )}
    </div>
  );
}

/** Bots fill this. People never see it. */
export function Honeypot() {
  return (
    <div aria-hidden className="absolute left-[-9999px] size-0 overflow-hidden">
      <label>
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}

export function Divider() {
  return <div className="h-px bg-hairline" role="separator" />;
}

export function Page({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <main className={`relative mx-auto flex min-h-dvh w-full max-w-[438px] flex-col gap-6 px-6 pt-[60px] pb-10 ${className}`}>
      {children}
    </main>
  );
}
