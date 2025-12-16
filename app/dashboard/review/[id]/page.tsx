"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { StatusBadge } from "@/components/StatusBadge";
import { SectionCard } from "@/components/SectionCard";
import { DataTable } from "@/components/DataTable";
import { PollingLoader } from "@/components/PollingLoader";
import { DownloadPDFButton } from "../DownloadPDFButton";
import type { Database } from "@/lib/database.types";

type Review = Database["public"]["Tables"]["reviews"]["Row"];

export default function ReviewDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const fetchReview = async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error: fetchError } = await (supabase
        .from("reviews")
        .select("*")
        .eq("id", params.id)
        .eq("user_id", user.id)
        .single() as any);

      if (fetchError || !data) {
        setError("Review not found");
        setLoading(false);
        return;
      }

      setReview(data);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Failed to load review");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReview();
  }, [params.id]);

  // Polling effect
  useEffect(() => {
    if (!review) return;
    
    const status = review.status;
    if (status === "complete" || status === "error") return;

    const interval = setInterval(() => {
      fetchReview();
    }, 5000);

    return () => clearInterval(interval);
  }, [review?.status]);

  const handleRetry = async () => {
    if (!review) return;
    
    setIsRetrying(true);
    try {
      await fetch("/.netlify/functions/compare-estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: review.id }),
      });
      
      setTimeout(() => {
        fetchReview();
        setIsRetrying(false);
      }, 2000);
    } catch (err) {
      setIsRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <PollingLoader message="Loading review..." />
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-950">
        <Header />
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
          <SectionCard title="Error" variant="error">
            <p className="text-xs text-slate-300">{error || "Review not found"}</p>
            <Link
              href="/dashboard"
              className="mt-4 inline-block text-xs font-semibold text-amber-300 hover:underline"
            >
              ← Back to dashboard
            </Link>
          </SectionCard>
        </main>
      </div>
    );
  }

  const analysis = review.ai_analysis_json as any;
  const comparison = review.ai_comparison_json as any;
  const summary = review.ai_summary_json as any;
  const isProcessing = !["complete", "error"].includes(review.status);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      <Header />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
        {/* Status Header */}
        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300">
              Review Details
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50">
              Estimate Analysis
            </h1>
            <p className="mt-1 text-xs text-slate-300">
              Created {new Date(review.created_at).toLocaleString()}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={review.status} />
            {review.pdf_report_url && (
              <DownloadPDFButton pdfUrl={review.pdf_report_url} />
            )}
          </div>
        </section>

        {/* Processing Indicator */}
        {isProcessing && (
          <PollingLoader message={`Processing: ${review.status.replace(/_/g, " ")}...`} />
        )}

        {/* Error State */}
        {review.status === "error" && (
          <SectionCard title="Error Occurred" variant="error">
            <p className="text-xs text-slate-300">
              {(review as any).error_message || "An error occurred during processing"}
            </p>
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="mt-4 inline-flex items-center rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-600 disabled:opacity-50"
            >
              {isRetrying ? "Retrying..." : "Retry Analysis"}
            </button>
          </SectionCard>
        )}

        {/* Financial Summary */}
        {comparison?.summary && (
          <SectionCard title="Financial Summary" variant="success">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                  Contractor Total
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-50">
                  ${comparison.summary.contractorTotal?.toFixed(2) || "0.00"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                  Carrier Total
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-50">
                  ${comparison.summary.carrierTotal?.toFixed(2) || "0.00"}
                </p>
              </div>
              <div className="rounded-2xl border border-rose-500/40 bg-rose-950/20 p-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-rose-300">
                  Difference
                </p>
                <p className="mt-2 text-2xl font-semibold text-rose-200">
                  ${Math.abs(comparison.summary.difference || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </SectionCard>
        )}

        {/* Key Findings */}
        {comparison?.summary?.keyFindings && comparison.summary.keyFindings.length > 0 && (
          <SectionCard title="Key Findings" variant="warning">
            <ul className="space-y-2 text-xs text-slate-200">
              {comparison.summary.keyFindings.map((finding: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
                  <span>{finding}</span>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}

        {/* Missing Items */}
        {comparison?.missingItems && comparison.missingItems.length > 0 && (
          <SectionCard
            title="Missing Items"
            description="Items found in contractor estimate but not in carrier estimate"
            variant="error"
          >
            <DataTable
              columns={[
                { key: "description", label: "Description" },
                { key: "trade", label: "Trade" },
                { key: "qty", label: "Qty", align: "right" },
                { key: "total", label: "Total", align: "right", render: (val) => `$${val?.toFixed(2) || "0.00"}` },
                { key: "reason", label: "Reason" },
              ]}
              data={comparison.missingItems.map((item: any) => ({
                description: item.item?.description || "N/A",
                trade: item.item?.trade || "N/A",
                qty: `${item.item?.qty || 0} ${item.item?.unit || ""}`,
                total: item.item?.total || 0,
                reason: item.reason || "",
              }))}
              emptyMessage="No missing items found"
            />
          </SectionCard>
        )}

        {/* Underpriced Items */}
        {comparison?.underpricedItems && comparison.underpricedItems.length > 0 && (
          <SectionCard
            title="Underpriced Items"
            description="Items where carrier pricing is significantly lower than contractor"
            variant="warning"
          >
            <DataTable
              columns={[
                { key: "description", label: "Description" },
                { key: "contractorPrice", label: "Contractor", align: "right", render: (val) => `$${val?.toFixed(2) || "0.00"}` },
                { key: "carrierPrice", label: "Carrier", align: "right", render: (val) => `$${val?.toFixed(2) || "0.00"}` },
                { key: "difference", label: "Difference", align: "right", render: (val) => `$${val?.toFixed(2) || "0.00"}` },
                { key: "percent", label: "%", align: "right", render: (val) => `${val?.toFixed(1) || "0"}%` },
              ]}
              data={comparison.underpricedItems.map((item: any) => ({
                description: item.contractorItem?.description || "N/A",
                contractorPrice: item.contractorItem?.total || 0,
                carrierPrice: item.carrierItem?.total || 0,
                difference: item.priceDifference || 0,
                percent: item.percentDifference || 0,
              }))}
              emptyMessage="No underpriced items found"
            />
          </SectionCard>
        )}

        {/* Carrier Report Summary */}
        {summary?.plainEnglishSummary && (
          <SectionCard title="Carrier Letter Summary">
            {summary.approvalStatus && (
              <div className="mb-4">
                <StatusBadge status={summary.approvalStatus} />
              </div>
            )}
            <p className="text-xs leading-relaxed text-slate-300">
              {summary.plainEnglishSummary}
            </p>

            {summary.keyFindings && summary.keyFindings.length > 0 && (
              <div className="mt-4">
                <p className="text-[11px] font-semibold text-slate-400">Key Points:</p>
                <ul className="mt-2 space-y-1 text-xs text-slate-300">
                  {summary.keyFindings.map((finding: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-slate-500" />
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {summary.recommendedNextSteps && summary.recommendedNextSteps.length > 0 && (
              <div className="mt-4">
                <p className="text-[11px] font-semibold text-slate-400">
                  Recommended Next Steps:
                </p>
                <ol className="mt-2 space-y-1 text-xs text-slate-300">
                  {summary.recommendedNextSteps.map((step: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-semibold text-amber-400">{idx + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </SectionCard>
        )}

        {/* Line Items Table */}
        {analysis?.lineItems && analysis.lineItems.length > 0 && (
          <SectionCard
            title="Contractor Line Items"
            description={`${analysis.lineItems.length} items extracted from contractor estimate`}
          >
            <DataTable
              columns={[
                { key: "trade", label: "Trade" },
                { key: "description", label: "Description" },
                { key: "qty", label: "Qty", align: "right" },
                { key: "unit_price", label: "Unit Price", align: "right", render: (val) => `$${val?.toFixed(2) || "0.00"}` },
                { key: "total", label: "Total", align: "right", render: (val) => `$${val?.toFixed(2) || "0.00"}` },
              ]}
              data={analysis.lineItems}
              emptyMessage="No line items found"
            />
            <div className="mt-4 flex justify-end border-t border-slate-800 pt-3">
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-400">Total:</p>
                <p className="text-lg font-semibold text-slate-50">
                  ${analysis.summary?.totalAmount?.toFixed(2) || "0.00"}
                </p>
              </div>
            </div>
          </SectionCard>
        )}

        {/* PDF Download Section */}
        {!review.pdf_report_url && review.status !== "error" && (
          <SectionCard title="PDF Report">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
              <span className="text-xs text-slate-300">Generating PDF report...</span>
            </div>
          </SectionCard>
        )}
      </main>
    </div>
  );
}

function Header() {
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
        <Link
          href="/dashboard"
          className="text-xs font-semibold text-slate-200 hover:underline hover:underline-offset-4"
        >
          Back to dashboard
        </Link>
      </div>
    </header>
  );
}
