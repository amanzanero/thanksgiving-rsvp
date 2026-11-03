export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-[438px] flex-col gap-6 px-6 pt-15 pb-10">
      <header className="flex flex-col gap-3.5">
        <h1 className="font-display text-[44px] leading-[48px]">
          Thanksgiving at Andrew and Isabella&apos;s
        </h1>
        <p className="text-[21px] leading-7 text-muted">
          Come hungry, and tell us what you&apos;ll bring.
        </p>
      </header>
      <section className="flex flex-col gap-0.5">
        <p className="text-[22px] font-semibold">Thursday, November 26</p>
        <p className="text-xl">5:00 pm</p>
        <p className="text-xl">123 Example St, Anytown, CA 90000</p>
      </section>
    </main>
  );
}
