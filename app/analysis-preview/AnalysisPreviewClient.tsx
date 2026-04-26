"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { netlifyFunctionUrl } from "@/lib/netlify-function-url";
import {
  extractImagesFromPDF,
  extractTextFromPDF,
} from "@/lib/estimate-pdf-extract";

const STORAGE_TEXT = "erp_extracted_text";
const STORAGE_RESUME = "erp_resume";

const LOADING_STEPS = [
  "Reading your estimate…",
  "Identifying coverage gaps…",
  "Building your analysis…",
] as const;

const LOADING_MS = 1500;

type PreviewResult = {
  estimate_type: string;
  confidence: string;
  summary: string;
  key_issues: string[];
  underpayment_risk: string;
  strategy: string;
  teaser: string[];
};

function riskStyle(risk: string): { label: string; className: string } {
  const x = risk.toLowerCase();
  if (x === "high")
    return { label: "High", className: "text-red-400 bg-red-950/50 ring-red-800" };
  if (x === "low")
    return {
      label: "Low",
      className: "text-emerald-400 bg-emerald-950/50 ring-emerald-800",
    };
  return {
    label: "Moderate",
    className: "text-amber-400 bg-amber-950/50 ring-amber-800",
  };
}

function LockIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 shrink-0 text-slate-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );
}

export function AnalysisPreviewClient() {
  const [phase, setPhase] = useState<"upload" | "loading" | "result">("upload");
  const [error, setError] = useState<string | null>(null);
  const [fileBusy, setFileBusy] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<PreviewResult | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const loadTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRaf = useRef<number | null>(null);
  const loadingStartRef = useRef(0);

  const clearLoadTimers = useCallback(() => {
    if (loadTimerRef.current) {
      clearInterval(loadTimerRef.current);
      loadTimerRef.current = null;
    }
    if (progressRaf.current) {
      cancelAnimationFrame(progressRaf.current);
      progressRaf.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearLoadTimers();
    };
  }, [clearLoadTimers]);

  const startLoadingPhase = useCallback(() => {
    setPhase("loading");
    setLoadingIndex(0);
    setProgress(0);
    loadingStartRef.current = performance.now();
    const totalMs = LOADING_STEPS.length * LOADING_MS;

    const tick = () => {
      const elapsed = performance.now() - loadingStartRef.current;
      const p = Math.min(100, (elapsed / totalMs) * 100);
      setProgress(p);
      progressRaf.current = requestAnimationFrame(tick);
    };
    progressRaf.current = requestAnimationFrame(tick);

    let idx = 0;
    loadTimerRef.current = setInterval(() => {
      idx += 1;
      if (idx < LOADING_STEPS.length) {
        setLoadingIndex(idx);
      } else {
        if (loadTimerRef.current) {
          clearInterval(loadTimerRef.current);
          loadTimerRef.current = null;
        }
      }
    }, LOADING_MS);
  }, []);

  const runPreview = useCallback(
    async (rawText: string) => {
      setError(null);
      const text = rawText.trim();
      if (text.length < 40) {
        setError("Not enough text to preview — try a longer file or paste.");
        return;
      }
      try {
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(STORAGE_TEXT, text);
        }
      } catch {
        setError("Could not save to browser storage. Allow storage and try again.");
        return;
      }

      startLoadingPhase();

      let previewRes: Response;
      try {
        previewRes = await fetch(netlifyFunctionUrl("analyze-estimate-preview"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentText: text }),
        });
      } catch {
        clearLoadTimers();
        setProgress(100);
        setPhase("upload");
        setError("Network error — check your connection and try again.");
        return;
      }

      clearLoadTimers();
      setProgress(100);

      if (!previewRes.ok) {
        const j = (await previewRes.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(j.error || "Preview could not be generated.");
        setPhase("upload");
        return;
      }

      const data = (await previewRes.json()) as PreviewResult;
      if (!data?.summary || !Array.isArray(data.key_issues)) {
        setError("Invalid preview response.");
        setPhase("upload");
        return;
      }
      setResult(data);
      setPhase("result");
    },
    [clearLoadTimers, startLoadingPhase]
  );

  const extractFileToText = useCallback(async (file: File): Promise<string> => {
    if (file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")) {
      return file.text();
    }
    const lower = file.name.toLowerCase();
    const isPdf =
      file.type === "application/pdf" || lower.endsWith(".pdf");
    if (isPdf) {
      const t = await extractTextFromPDF(file);
      if (t.trim().length >= 500) return t;
      const images = await extractImagesFromPDF(file);
      if (images.length === 0) {
        throw new Error("Could not read this PDF.");
      }
      const pageTexts: string[] = [];
      for (let i = 0; i < images.length; i++) {
        const ocrRes = await fetch(
          netlifyFunctionUrl("estimate-ocr-preview"),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              images: [images[i]!],
              fileName: file.name,
            }),
          }
        );
        if (!ocrRes.ok) {
          const err = (await ocrRes.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(err.error || `Page ${i + 1} read failed.`);
        }
        const ocrData = (await ocrRes.json()) as { text?: string };
        if (ocrData.text?.trim()) pageTexts.push(ocrData.text);
      }
      const full = pageTexts.join("\n\n");
      if (!full.trim()) throw new Error("No text could be read from this PDF.");
      return full;
    }
    if (file.type.startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(lower)) {
      const base64: string = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => {
          const dataUrl = String(r.result || "");
          const b = dataUrl.split(",")[1];
          if (b) resolve(b);
          else reject(new Error("Could not read image."));
        };
        r.onerror = () => reject(new Error("Could not read file."));
        r.readAsDataURL(file);
      });
      const ocrRes = await fetch(netlifyFunctionUrl("estimate-ocr-preview"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: [base64],
          fileName: file.name,
        }),
      });
      if (!ocrRes.ok) {
        const err = (await ocrRes.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(err.error || "Image read failed.");
      }
      const ocrData = (await ocrRes.json()) as { text?: string };
      if (!ocrData.text?.trim()) {
        throw new Error("No text could be read from this image.");
      }
      return ocrData.text;
    }
    throw new Error("Use PDF, an image, a .txt file, or paste text.");
  }, []);

  const onFile = useCallback(
    async (file: File | null) => {
      if (!file) return;
      setFileBusy(true);
      setError(null);
      try {
        const text = await extractFileToText(file);
        await runPreview(text);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not read that file.");
      } finally {
        setFileBusy(false);
      }
    },
    [extractFileToText, runPreview]
  );

  const onUnlock = useCallback(async () => {
    setCheckoutLoading(true);
    setError(null);
    try {
      if (typeof window === "undefined") return;
      const t = (window.sessionStorage.getItem(STORAGE_TEXT) || "").trim();
      if (!t) {
        setError("Your estimate text is missing. Please upload again.");
        setCheckoutLoading(false);
        return;
      }
      window.sessionStorage.setItem(STORAGE_RESUME, "true");
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType: "single" }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error || "Could not start checkout.");
    } catch {
      setError("Could not start checkout.");
    } finally {
      setCheckoutLoading(false);
    }
  }, []);

  const risk = result ? riskStyle(result.underpayment_risk) : null;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 md:py-16">
      {phase === "upload" && (
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white md:text-3xl">
              Upload Your Carrier Estimate
            </h1>
            <p className="mt-2 text-slate-400 md:text-lg">
              We&apos;ll identify gaps, suppressed pricing, and missing scope —
              in under 2 minutes.
            </p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-8">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-slate-600 bg-slate-950/50 px-4 py-12 transition hover:border-blue-500/50">
              <input
                type="file"
                className="sr-only"
                accept=".pdf,.txt,image/*,.png,.jpg,.jpeg,.webp"
                disabled={fileBusy}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  void onFile(f ?? null);
                }}
              />
              <span className="text-4xl" aria-hidden>
                📄
              </span>
              <span className="text-center text-sm font-semibold text-slate-200">
                {fileBusy ? "Processing…" : "Click to upload or drop a file"}
              </span>
              <span className="text-center text-xs text-slate-500">
                PDF, images, or plain text
              </span>
            </label>
            {error && (
              <p className="mt-4 text-center text-sm text-red-400" role="alert">
                {error}
              </p>
            )}
          </div>
        </div>
      )}

      {phase === "loading" && (
        <div className="space-y-8 text-center">
          <h2 className="text-xl font-semibold text-white">
            {LOADING_STEPS[loadingIndex] ?? LOADING_STEPS[LOADING_STEPS.length - 1]}
          </h2>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-blue-500 transition-[width] duration-300"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
          <p className="text-sm text-slate-500">
            This usually takes under a minute.
          </p>
        </div>
      )}

      {phase === "result" && result && risk && (
        <div className="space-y-8">
          <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900/50">
            <div className="border-b border-slate-800 px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full bg-blue-950/80 px-3 py-1 text-xs font-semibold text-blue-200 ring-1 ring-blue-800">
                  {result.estimate_type}
                </span>
                <span className="text-xs text-slate-500">
                  Confidence: {result.confidence}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${risk.className}`}
                >
                  Underpayment risk: {risk.label}
                </span>
              </div>
            </div>
            <div className="space-y-5 px-5 py-5">
              <p className="text-sm leading-relaxed text-slate-200">
                {result.summary}
              </p>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Key issues
                </p>
                <ul className="list-inside list-disc space-y-1.5 text-sm text-slate-300">
                  {result.key_issues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-slate-500">
                  + 4 more issues in full analysis
                </p>
              </div>
              <div className="rounded-lg border border-slate-600 bg-slate-950/60 px-4 py-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Strategy
                </p>
                <p className="text-sm leading-relaxed text-slate-200">
                  {result.strategy}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Included in full analysis
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.teaser.map((t, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs text-slate-500"
                    >
                      <LockIcon />
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-600 bg-slate-900/80 p-6 text-center">
            <h2 className="text-xl font-bold text-white">
              Your Full Analysis Is Ready
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
              See every missing line item, the Xactimate comparison table, and
              your demand letter — structured for negotiation or litigation.
            </p>
            <button
              type="button"
              onClick={() => void onUnlock()}
              disabled={checkoutLoading}
              className="mt-6 w-full max-w-sm rounded-lg bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow transition hover:bg-blue-700 disabled:opacity-50"
            >
              {checkoutLoading ? "Redirecting…" : "Unlock My Analysis — $49"}
            </button>
            <p className="mt-3 text-xs text-slate-500">
              One-time · No subscription required · Your letter is already
              written
            </p>
            {error && (
              <p className="mt-3 text-sm text-red-400" role="alert">
                {error}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
