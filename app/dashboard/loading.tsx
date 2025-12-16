export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 animate-pulse rounded-xl bg-slate-800" />
            <div className="h-4 w-32 animate-pulse rounded bg-slate-800" />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-7 w-20 animate-pulse rounded-full bg-slate-800" />
            <div className="h-7 w-20 animate-pulse rounded-full bg-slate-800" />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-8">
        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-2">
            <div className="h-3 w-24 animate-pulse rounded bg-slate-800" />
            <div className="h-6 w-48 animate-pulse rounded bg-slate-800" />
            <div className="h-3 w-64 animate-pulse rounded bg-slate-800" />
          </div>
          <div className="h-9 w-32 animate-pulse rounded-full bg-slate-800" />
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 shadow-lg shadow-slate-950/60">
          <div className="space-y-4">
            <div className="h-4 w-32 animate-pulse rounded bg-slate-800" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-4"
                >
                  <div className="space-y-2">
                    <div className="h-3 w-32 animate-pulse rounded bg-slate-800" />
                    <div className="h-2 w-48 animate-pulse rounded bg-slate-800" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-7 w-24 animate-pulse rounded-full bg-slate-800" />
                    <div className="h-7 w-24 animate-pulse rounded-full bg-slate-800" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

