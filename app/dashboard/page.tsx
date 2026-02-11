import Link from "next/link";
import { createSupabaseServerComponentClient } from "@/lib/supabaseServer";

export default async function DashboardPage() {
  const supabase = createSupabaseServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("user_id", user?.id ?? "")
    .order("created_at", { ascending: false });

  const tier = (profile as any)?.tier ?? "free";

  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1e3a8a] shadow-lg shadow-[#1e3a8a]/30">
              <span className="text-xs font-black text-white">ER</span>
            </div>
            <span className="text-sm font-semibold text-slate-50">
              Estimate Review Pro
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-xs font-medium text-slate-200">
            <Link
              href="/dashboard"
              className="rounded-full bg-slate-900 px-3 py-1.5 text-blue-300"
            >
              Dashboard
            </Link>
            <Link
              href="/account"
              className="rounded-full border border-slate-700 px-3 py-1.5 hover:border-slate-500 hover:text-slate-50"
            >
              Account
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-8">
        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-300">
              Dashboard
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50">
              Your estimate reviews
            </h1>
            <p className="mt-1 text-xs text-slate-300">
              Upload new estimates, download AI reports, and re‑run analysis as
              claims evolve.
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-3 text-xs text-slate-200 md:items-end">
            <Link
              href="/dashboard/upload"
              className="inline-flex items-center justify-center rounded-full bg-[#1e3a8a] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-[#1e3a8a]/40 hover:bg-[#1e40af]"
            >
              New review
            </Link>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>
                Current plan:{" "}
                <span className="font-semibold text-slate-100">
                  {tier === "pro"
                    ? "Unlimited"
                    : tier === "oneoff"
                    ? "One‑off"
                    : "Free"}
                </span>
              </span>
              {tier !== "pro" && (
                <Link
                  href="/account"
                  className="ml-1 font-semibold text-blue-300 hover:underline hover:underline-offset-4"
                >
                  Upgrade
                </Link>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 text-xs text-slate-200 shadow-lg shadow-slate-950/60">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <h2 className="text-xs font-semibold text-slate-100">
              Past reports
            </h2>
            <p className="text-[11px] text-slate-400">
              We keep a full history of your PDF exports for audit and
              record‑keeping.
            </p>
          </div>
          <div className="mt-3 space-y-2">
            {!reviews || reviews.length === 0 ? (
              <p className="text-[11px] text-slate-400">
                No reviews yet. Start by uploading a contractor and carrier
                estimate.
              </p>
            ) : (
              <div className="divide-y divide-slate-900/80">
                {reviews.map((review: any) => (
                  <div
                    key={review.id}
                    className="flex flex-col items-start justify-between gap-3 py-3 md:flex-row md:items-center"
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-slate-100">
                        Estimate review
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Created{" "}
                        {new Date(review.created_at).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-200">
                        Ready
                      </span>
                      {review.pdf_report_url && (
                        <a
                          href={review.pdf_report_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-full border border-slate-700 px-3 py-1 font-semibold hover:border-slate-500 hover:text-slate-50"
                        >
                          Download PDF
                        </a>
                      )}
                      <Link
                        href={`/dashboard/review/${review.id}`}
                        className="inline-flex items-center rounded-full border border-slate-700 px-3 py-1 font-semibold hover:border-slate-500 hover:text-slate-50"
                      >
                        View details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}


