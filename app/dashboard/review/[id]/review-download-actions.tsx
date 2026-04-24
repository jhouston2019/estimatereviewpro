"use client";

import { useCallback, useMemo, useState } from "react";
import { netlifyFunctionUrl } from "@/lib/netlify-function-url";
import type { AnalysisResult, ComparisonResult } from "@/lib/estimate-json-parse";
import {
  buildAnalysisExportPlainText,
  buildComparisonExportPlainText,
  buildFullReportPlainText,
  buildSummaryExportPlainText,
  rawJsonExportPlainText,
} from "@/lib/review-export-text";
import { wizardFetch } from "@/lib/supabaseClient";

type Props = {
  reportTitle: string;
  createdLabel: string;
  analysis: AnalysisResult | null;
  analysisRaw: unknown;
  comparison: ComparisonResult | null;
  comparisonRaw: unknown;
  summaryJson: unknown;
  hasSummary: boolean;
  letterText: string | null;
  safeBaseFileName: string;
};

function triggerBlobDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export function ReviewDownloadActions({
  reportTitle,
  createdLabel,
  analysis,
  analysisRaw,
  comparison,
  comparisonRaw,
  summaryJson,
  hasSummary,
  letterText,
  safeBaseFileName,
}: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const analysisTextResolved = useMemo((): string | null => {
    if (analysis) return buildAnalysisExportPlainText(analysis);
    if (analysisRaw != null)
      return rawJsonExportPlainText("Analysis (raw)", analysisRaw);
    return null;
  }, [analysis, analysisRaw]);
  const canExportAnalysis = Boolean(analysisTextResolved?.trim());

  const getComparisonText = useCallback((): string | null => {
    if (comparison) return buildComparisonExportPlainText(comparison);
    if (comparisonRaw != null)
      return rawJsonExportPlainText("Comparison (raw)", comparisonRaw);
    return null;
  }, [comparison, comparisonRaw]);

  const doPdf = useCallback(
    async (text: string, fileName: string) => {
      const res = await wizardFetch(netlifyFunctionUrl("generate-pdf"), {
        method: "POST",
        body: JSON.stringify({ text, fileName }),
      });
      const ct = res.headers.get("content-type") || "";
      if (!res.ok || ct.includes("application/json")) {
        await res.text().catch(() => "");
        throw new Error("PDF request failed.");
      }
      return res.blob();
    },
    []
  );

  const doDocx = useCallback(
    async (text: string, fileName: string) => {
      const res = await wizardFetch(netlifyFunctionUrl("generate-docx"), {
        method: "POST",
        body: JSON.stringify({ text, fileName }),
      });
      const ct = res.headers.get("content-type") || "";
      if (!res.ok || ct.includes("application/json")) {
        await res.text().catch(() => "");
        throw new Error("Word export request failed.");
      }
      return res.blob();
    },
    []
  );

  const onAnalysisPdf = useCallback(async () => {
    setErr(null);
    const text = analysisTextResolved;
    if (!text?.trim()) {
      setErr("No analysis data to export.");
      return;
    }
    setBusy("analysis-pdf");
    try {
      const blob = await doPdf(
        text,
        `${safeBaseFileName}-analysis.pdf`
      );
      triggerBlobDownload(blob, `${safeBaseFileName}-analysis.pdf`);
    } catch (e) {
      setErr(
        e instanceof Error ? e.message : "Download failed. Try again."
      );
    } finally {
      setBusy(null);
    }
  }, [analysisTextResolved, doPdf, safeBaseFileName]);

  const onFullReportPdf = useCallback(async () => {
    setErr(null);
    const analysisText = analysisTextResolved;
    if (!analysisText?.trim()) {
      setErr("No analysis data; full report is not available.");
      return;
    }
    const comparisonText = getComparisonText();
    const summaryText = hasSummary
      ? buildSummaryExportPlainText(summaryJson)
      : null;
    const full = buildFullReportPlainText({
      reportTitle,
      createdLabel,
      analysisText,
      comparisonText: comparisonText?.trim() ? comparisonText : null,
      summaryText: summaryText?.trim() && hasSummary ? summaryText : null,
      letterText: letterText?.trim() ? letterText : null,
    });
    setBusy("full-pdf");
    try {
      const blob = await doPdf(
        full,
        `${safeBaseFileName}-full-report.pdf`
      );
      triggerBlobDownload(blob, `${safeBaseFileName}-full-report.pdf`);
    } catch (e) {
      setErr(
        e instanceof Error ? e.message : "Download failed. Try again."
      );
    } finally {
      setBusy(null);
    }
  }, [
    analysisTextResolved,
    createdLabel,
    doPdf,
    getComparisonText,
    hasSummary,
    letterText,
    reportTitle,
    safeBaseFileName,
    summaryJson,
  ]);

  const onLetterDocx = useCallback(async () => {
    setErr(null);
    const t = letterText?.trim();
    if (!t) {
      setErr("No letter text to export. Generate a letter first.");
      return;
    }
    setBusy("letter-docx");
    try {
      const blob = await doDocx(
        t,
        `${safeBaseFileName}-letter.docx`
      );
      triggerBlobDownload(blob, `${safeBaseFileName}-letter.docx`);
    } catch (e) {
      setErr(
        e instanceof Error ? e.message : "Download failed. Try again."
      );
    } finally {
      setBusy(null);
    }
  }, [doDocx, letterText, safeBaseFileName]);

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg shadow-slate-950/50">
      <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-300">
        Downloads
      </h2>
      <p className="mt-2 text-sm text-slate-400">
        Exports use the same PDF and Word services as the upload wizard.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={onAnalysisPdf}
          disabled={busy !== null || !canExportAnalysis}
          className="rounded-lg border border-slate-600 bg-slate-800/80 px-4 py-2.5 text-left text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === "analysis-pdf" ? "Working…" : "Download Analysis (PDF)"}
        </button>
        <button
          type="button"
          onClick={onFullReportPdf}
          disabled={busy !== null || !canExportAnalysis}
          className="rounded-lg border border-slate-600 bg-slate-800/80 px-4 py-2.5 text-left text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === "full-pdf" ? "Working…" : "Download Full Report (PDF)"}
        </button>
        <button
          type="button"
          onClick={onLetterDocx}
          disabled={busy !== null || !letterText?.trim()}
          className="rounded-lg border border-slate-600 bg-slate-800/80 px-4 py-2.5 text-left text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === "letter-docx" ? "Working…" : "Download Letter (Word)"}
        </button>
      </div>
      {err ? (
        <p className="mt-3 text-sm text-amber-300" role="alert">
          {err}
        </p>
      ) : null}
    </section>
  );
}
