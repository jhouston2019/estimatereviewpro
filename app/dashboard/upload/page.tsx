"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function UploadPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
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

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8">
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300">
            New review
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50">
            Upload estimates & documents
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-slate-300">
            Upload a contractor estimate plus the carrier estimate and any
            engineer or carrier letters. We&apos;ll extract line items, compare
            scopes, summarize reports, and generate a PDF for your file.
          </p>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 text-xs text-slate-200 shadow-lg shadow-slate-950/60">
          <UploadForm />
        </section>
      </main>
    </div>
  );
}

function UploadForm() {
  const router = useRouter();
  const [contractorFile, setContractorFile] = useState<File | null>(null);
  const [carrierFile, setCarrierFile] = useState<File | null>(null);
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"full" | "summary">("full");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>("");

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsUploading(true);
    setUploadProgress("Checking subscription...");

    try {
      const supabase = createSupabaseBrowserClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in to upload estimates");
      }

      // Check user's tier and subscription
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      const tier = profile?.tier ?? "free";

      // Business rules: Check if user can create review
      if (tier === "free") {
        setError(
          "Please upgrade to a paid plan to analyze estimates. Visit the pricing page."
        );
        setIsUploading(false);
        return;
      }

      if (tier === "oneoff") {
        // Check if they've already used their one-off review
        const { data: existingReviews } = await supabase
          .from("reviews")
          .select("id")
          .eq("user_id", user.id);

        if (existingReviews && existingReviews.length > 0) {
          setError(
            "You've already used your one-time review. Upgrade to unlimited for more."
          );
          setIsUploading(false);
          return;
        }
      }

      // Validate required files
      if (!contractorFile) {
        throw new Error("Contractor estimate is required");
      }

      setUploadProgress("Uploading contractor estimate...");

      // Upload contractor estimate
      const contractorFileName = `${user.id}/${Date.now()}-contractor-${contractorFile.name}`;
      const { data: contractorUpload, error: contractorError } =
        await supabase.storage
          .from("uploads")
          .upload(contractorFileName, contractorFile);

      if (contractorError) {
        throw new Error(`Failed to upload contractor estimate: ${contractorError.message}`);
      }

      const {
        data: { publicUrl: contractorUrl },
      } = supabase.storage.from("uploads").getPublicUrl(contractorFileName);

      let carrierUrl: string | null = null;
      if (carrierFile) {
        setUploadProgress("Uploading carrier estimate...");
        const carrierFileName = `${user.id}/${Date.now()}-carrier-${carrierFile.name}`;
        const { data: carrierUpload, error: carrierError } =
          await supabase.storage
            .from("uploads")
            .upload(carrierFileName, carrierFile);

        if (carrierError) {
          throw new Error(`Failed to upload carrier estimate: ${carrierError.message}`);
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("uploads").getPublicUrl(carrierFileName);
        carrierUrl = publicUrl;
      }

      let reportUrl: string | null = null;
      if (reportFile) {
        setUploadProgress("Uploading report document...");
        const reportFileName = `${user.id}/${Date.now()}-report-${reportFile.name}`;
        const { data: reportUpload, error: reportError } =
          await supabase.storage
            .from("uploads")
            .upload(reportFileName, reportFile);

        if (reportError) {
          throw new Error(`Failed to upload report: ${reportError.message}`);
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("uploads").getPublicUrl(reportFileName);
        reportUrl = publicUrl;
      }

      setUploadProgress("Creating review record...");

      // Create review record
      const { data: review, error: reviewError } = await supabase
        .from("reviews")
        .insert({
          user_id: user.id,
          contractor_estimate_url: contractorUrl,
          carrier_estimate_url: carrierUrl,
          ai_analysis_json: { status: "pending", mode } as any,
        })
        .select()
        .maybeSingle();

      if (reviewError || !review) {
        throw new Error("Failed to create review record");
      }

      setUploadProgress("Starting AI analysis...");

      // Trigger AI analysis pipeline
      const fileType = contractorFile.type.includes("pdf") ? "pdf" : "image";

      // Step 1: Analyze contractor estimate
      const analyzeResponse = await fetch("/.netlify/functions/analyze-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId: review.id,
          fileUrl: contractorUrl,
          fileType,
        }),
      });

      if (!analyzeResponse.ok) {
        throw new Error("Failed to analyze contractor estimate");
      }

      setUploadProgress("Comparing estimates...");

      // Step 2: Compare estimates (if carrier provided)
      if (carrierUrl && mode === "full") {
        await fetch("/.netlify/functions/compare-estimates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reviewId: review.id,
          }),
        });
      }

      // Step 3: Summarize report (if provided)
      if (reportUrl) {
        setUploadProgress("Summarizing carrier letter...");
        const reportFileType = reportFile!.type.includes("pdf") ? "pdf" : "image";
        await fetch("/.netlify/functions/summarize-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reviewId: review.id,
            reportUrl,
            fileType: reportFileType,
          }),
        });
      }

      // Step 4: Generate PDF
      if (mode === "full") {
        setUploadProgress("Generating PDF report...");
        await fetch("/.netlify/functions/generate-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reviewId: review.id,
          }),
        });
      }

      setUploadProgress("Complete! Redirecting...");

      // Redirect to review page
      router.push(`/dashboard/review/${review.id}`);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload and process estimates");
      setIsUploading(false);
      setUploadProgress("");
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleUpload}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="contractor"
            className="text-xs font-medium text-slate-200"
          >
            Contractor estimate{" "}
            <span className="text-[10px] text-rose-300">*</span>
          </label>
          <p className="text-[11px] text-slate-400">
            Required. PDF, JPG, or PNG. For Xactimate/Symbility, export the
            full estimate as a PDF.
          </p>
          <input
            id="contractor"
            name="contractor"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            required
            disabled={isUploading}
            onChange={(e) => setContractorFile(e.target.files?.[0] || null)}
            className="mt-1 block w-full cursor-pointer rounded-lg border border-dashed border-slate-700 bg-slate-950 px-3 py-6 text-[11px] text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-100 hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {contractorFile && (
            <p className="text-[10px] text-emerald-400">
              ✓ {contractorFile.name}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="carrier"
            className="text-xs font-medium text-slate-200"
          >
            Carrier estimate (optional)
          </label>
          <p className="text-[11px] text-slate-400">
            Upload the most recent carrier scope so we can compare line items
            and pricing.
          </p>
          <input
            id="carrier"
            name="carrier"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            disabled={isUploading}
            onChange={(e) => setCarrierFile(e.target.files?.[0] || null)}
            className="mt-1 block w-full cursor-pointer rounded-lg border border-dashed border-slate-700 bg-slate-950 px-3 py-6 text-[11px] text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-100 hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {carrierFile && (
            <p className="text-[10px] text-emerald-400">✓ {carrierFile.name}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="report" className="text-xs font-medium text-slate-200">
          Carrier letter or engineer report (optional)
        </label>
        <p className="text-[11px] text-slate-400">
          We&apos;ll summarize the technical reasoning and highlight key
          approval/denial points in plain English.
        </p>
        <input
          id="report"
          name="report"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          disabled={isUploading}
          onChange={(e) => setReportFile(e.target.files?.[0] || null)}
          className="mt-1 block w-full cursor-pointer rounded-lg border border-dashed border-slate-700 bg-slate-950 px-3 py-6 text-[11px] text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-100 hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
        />
        {reportFile && (
          <p className="text-[10px] text-emerald-400">✓ {reportFile.name}</p>
        )}
      </div>

      <fieldset className="mt-2 space-y-2 rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
        <legend className="px-1 text-xs font-medium text-slate-200">
          What should we generate?
        </legend>
        <div className="flex flex-col gap-2 text-[11px] text-slate-300 md:flex-row md:items-center">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="mode"
              value="full"
              checked={mode === "full"}
              onChange={(e) => setMode("full")}
              disabled={isUploading}
              className="h-3 w-3 rounded-full border-slate-500 bg-slate-900 text-amber-400 focus:ring-amber-400"
            />
            <span className="font-medium text-slate-100">
              Generate full review
            </span>
            <span className="text-slate-400">
              Line‑item comparison, discrepancies, summary, and PDF.
            </span>
          </label>
        </div>
        <div className="flex flex-col gap-2 text-[11px] text-slate-300 md:flex-row md:items-center">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="mode"
              value="summary"
              checked={mode === "summary"}
              onChange={(e) => setMode("summary")}
              disabled={isUploading}
              className="h-3 w-3 rounded-full border-slate-500 bg-slate-900 text-amber-400 focus:ring-amber-400"
            />
            <span className="font-medium text-slate-100">
              Generate summary only
            </span>
            <span className="text-slate-400">
              Skip line‑item comparison and focus on a narrative summary.
            </span>
          </label>
        </div>
      </fieldset>

      {error && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-950/30 p-4 text-xs text-rose-200">
          <p className="font-semibold">Error</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {isUploading && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-950/30 p-4 text-xs text-amber-100">
          <p className="font-semibold">Processing your review...</p>
          <p className="mt-1">{uploadProgress}</p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-900">
            <div className="h-full animate-pulse bg-gradient-to-r from-amber-400 to-sky-400" />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span>
            Secure upload via Supabase Storage. Files stay in your
            RLS‑protected bucket.
          </span>
        </div>
        <button
          type="submit"
          disabled={isUploading || !contractorFile}
          className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-sky-400 px-5 py-2 text-xs font-semibold text-slate-950 shadow-md shadow-amber-500/40 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isUploading ? "Processing..." : "Start Analysis"}
        </button>
      </div>
    </form>
  );
}
