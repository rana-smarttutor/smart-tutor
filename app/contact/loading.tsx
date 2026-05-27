export default function ContactLoading() {
  return (
    <main className="section-shell pb-24 pt-12 animate-pulse">
      <section className="mb-20">
        <div className="h-20 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-2xl mb-8" />
        <div className="h-10 w-3/4 bg-slate-100 dark:bg-slate-900 rounded-xl" />
      </section>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 rounded-3xl bg-slate-100 dark:bg-slate-900" />
            ))}
          </div>
          <div className="h-64 rounded-3xl bg-slate-100 dark:bg-slate-900" />
        </div>

        <div className="space-y-6">
          <div className="h-[400px] rounded-3xl bg-slate-100 dark:bg-slate-900" />
          <div className="h-32 rounded-3xl bg-slate-100 dark:bg-slate-900" />
          <div className="h-48 rounded-3xl bg-slate-100 dark:bg-slate-900" />
        </div>
      </div>
    </main>
  );
}
