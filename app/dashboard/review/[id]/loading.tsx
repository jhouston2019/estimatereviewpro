export default function ReviewLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 animate-pulse rounded-xl bg-slate-800" />
            <div className="h-4 w-32 animate-pulse rounded bg-slate-800" />
          </div>
          <div className="h-3 w-32 animate-pulse rounded bg-slate-800" />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-2">
            <div className="h-3 w-24 animate-pulse rounded bg-slate-800" />
            <div className="h-6 w-48 animate-pulse rounded bg-slate-800" />
            <div className="h-3 w-64 animate-pulse rounded bg-slate-800" />
          </div>
          <div className="flex gap-3">
            <div className="h-9 w-40 animate-pulse rounded-full bg-slate-800" />
            <div className="h-9 w-32 animate-pulse rounded-full bg-slate-800" />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 shadow-lg shadow-slate-950/60">
          <div className="h-4 w-32 animate-pulse rounded bg-slate-800" />
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
              >
                <div className="h-3 w-24 animate-pulse rounded bg-slate-800" />
                <div className="mt-2 h-8 w-32 animate-pulse rounded bg-slate-800" />
              </div>
            ))}
          </div>
        </section>

        {[1, 2].map((i) => (
          <section
            key={i}
            className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 shadow-lg shadow-slate-950/60"
          >
            <div className="h-4 w-32 animate-pulse rounded bg-slate-800" />
            <div className="mt-4 space-y-3">
              {[1, 2, 3].map((j) => (
                <div
                  key={j}
                  className="h-20 animate-pulse rounded-xl bg-slate-900/60"
                />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}

