import Link from "next/link";
import { createSupabaseServerComponentClient } from "@/lib/supabaseServer";
import { getBillingSnapshot } from "@/lib/billing/getBillingSnapshot";
import { PaymentActivationNotice } from "@/components/billing/PaymentActivationNotice";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string; subscription?: string }>;
}) {
  const sp = await searchParams;
  const paymentReturn =
    sp.payment === "success" || sp.subscription === "success";
  const supabase = await createSupabaseServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("user_id", user?.id ?? "")
    .order("created_at", { ascending: false });

  let billingPlan = "—";
  let billingStatusLabel = "—";
  let renewalLabel: string | null = null;
  let usedReviews = 0;
  let limitReviews = 0;
  let planType: string | null = null;
  let hasTeam = false;

  if (user?.id) {
    const snap = await getBillingSnapshot(supabase, user.id);
    billingPlan = snap.plan === "none" ? "—" : snap.plan;
    billingStatusLabel = snap.status === "active" ? "Active" : "Inactive";
    renewalLabel = snap.renewal_date
      ? new Date(snap.renewal_date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : null;
    usedReviews = snap.usage;
    limitReviews = snap.reviews_limit;
    planType = snap.plan === "none" ? null : snap.plan;
    hasTeam = snap.has_team;
  }

  const tier =
    planType === "single"
      ? "oneoff"
      : planType === "professional" ||
          planType === "enterprise" ||
          planType === "premier" ||
          hasTeam
        ? "pro"
        : "free";

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
            <Link
              href="/pricing"
              className="rounded-full bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#2563EB]/40 transition hover:bg-[#1E40AF]"
            >
              Buy another review
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-8">
        <PaymentActivationNotice enabled={paymentReturn} />

        <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg shadow-slate-950/50">
          <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-300">
            Billing &amp; usage
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-medium text-slate-500">Current plan</p>
              <p className="mt-1 text-sm font-semibold capitalize text-slate-100">
                {billingPlan}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500">
                Billing status
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-100">
                {billingStatusLabel}
              </p>
            </div>
            {renewalLabel && (
              <div>
                <p className="text-[11px] font-medium text-slate-500">Renewal</p>
                <p className="mt-1 text-sm text-slate-200">{renewalLabel}</p>
              </div>
            )}
            <div>
              <p className="text-[11px] font-medium text-slate-500">Reviews</p>
              <p className="mt-1 text-sm text-slate-200">
                {limitReviews > 0
                  ? `${usedReviews} of ${limitReviews} reviews used`
                  : `${usedReviews} reviews used`}
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/account"
              className="inline-flex items-center justify-center rounded-full border border-slate-600 px-4 py-2 text-xs font-semibold text-slate-100 hover:border-slate-400"
            >
              Manage billing
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-full bg-[#1e3a8a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1e40af]"
            >
              Upgrade plan
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-full border border-blue-500/50 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-200 hover:bg-blue-500/20"
            >
              Buy more reviews
            </Link>
          </div>
        </section>

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
          <div className="flex w-full flex-col items-stretch gap-3 text-xs text-slate-200 md:w-auto md:items-end">
            <Link
              href="/upload"
              className="inline-flex w-full items-center justify-center rounded-full bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#2563EB]/40 transition hover:bg-[#1E40AF] md:w-auto"
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


