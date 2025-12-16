"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { StatusBadge } from "@/components/StatusBadge";
import { DownloadPDFButton } from "./review/DownloadPDFButton";
import type { Database } from "@/lib/database.types";

type Review = Database["public"]["Tables"]["reviews"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default function DashboardPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createSupabaseBrowserClient();
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        // Fetch profile
        const profileResult = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        const profileData = profileResult.data as Profile | null;
        setProfile(profileData);

        // Check subscription
        const tier = profileData?.tier ?? "free";
        if (tier === "free") {
          router.push("/pricing?upgrade=required");
          return;
        }

        // Fetch reviews
        const { data: reviewsData, error: reviewsError } = await (supabase
          .from("reviews")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }) as any);

        if (reviewsError) {
          setError("Failed to load reviews");
        } else {
          setReviews(reviewsData || []);
        }
        
        setLoading(false);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard");
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  const tier = profile?.tier ?? "free";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          <span className="text-xs text-slate-300">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-950">
        <Header tier={tier} />
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-8">
          <div className="rounded-3xl border border-rose-500/40 bg-rose-950/20 p-6">
            <p className="text-sm font-semibold text-rose-200">Error</p>
            <p className="mt-2 text-xs text-rose-300">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      <Header tier={tier} />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-8">
        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300">
              Dashboard
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50">
              Your estimate reviews
            </h1>
            <p className="mt-1 text-xs text-slate-300">
              Upload new estimates, download AI reports, and re‑run analysis as claims evolve.
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-3 text-xs text-slate-200 md:items-end">
            <Link
              href="/dashboard/upload"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-sky-400 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md shadow-amber-500/40 hover:brightness-105"
            >
              New review
            </Link>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>
                Current plan:{" "}
                <span className="font-semibold text-slate-100">
                  {tier === "pro" ? "Unlimited" : tier === "oneoff" ? "One‑off" : "Free"}
                </span>
              </span>
              {tier !== "pro" && (
                <Link
                  href="/account"
                  className="ml-1 font-semibold text-amber-300 hover:underline hover:underline-offset-4"
                >
                  Upgrade
                </Link>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 text-xs text-slate-200 shadow-lg shadow-slate-950/60">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <h2 className="text-xs font-semibold text-slate-100">Past reports</h2>
            <p className="text-[11px] text-slate-400">
              We keep a full history of your PDF exports for audit and record‑keeping.
            </p>
          </div>
          <div className="mt-3">
            {reviews.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-900">
                  <svg
                    className="h-8 w-8 text-slate-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-slate-300">No reviews yet</p>
                <p className="mt-1 text-xs text-slate-400">
                  Start by uploading a contractor and carrier estimate.
                </p>
                <Link
                  href="/dashboard/upload"
                  className="mt-4 inline-block rounded-full bg-amber-400 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-300"
                >
                  Upload your first estimate
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-900/80">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="flex flex-col items-start justify-between gap-3 py-3 md:flex-row md:items-center"
                  >
                    <div className="flex-1 space-y-1">
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
                      <StatusBadge status={review.status} />
                      {review.pdf_report_url && (
                        <div className="inline-flex items-center rounded-full border border-slate-700 px-3 py-1 font-semibold hover:border-slate-500 hover:text-slate-50">
                          <DownloadPDFButton pdfUrl={review.pdf_report_url} compact />
                        </div>
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

function Header({ tier }: { tier: string }) {
  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-400 to-sky-500 shadow-lg shadow-amber-500/30">
            <span className="text-xs font-black text-slate-950">ER</span>
          </div>
          <span className="text-sm font-semibold text-slate-50">
            Estimate Review Pro
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-xs font-medium text-slate-200">
          <Link
            href="/dashboard"
            className="rounded-full bg-slate-900 px-3 py-1.5 text-amber-300"
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
  );
}
