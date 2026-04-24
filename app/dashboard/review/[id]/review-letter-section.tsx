"use client";

import { useCallback, useEffect, useState } from "react";
import type { AnalysisResult, ComparisonResult } from "@/lib/estimate-json-parse";
import { labelForStoredLetterType } from "@/lib/review-letter-labels";
import {
  buildLetterPlaceholderValueMap,
  letterTextToReactNodes,
} from "@/lib/letter-placeholders-display";
import { RegenerateLetterForm } from "./regenerate-letter-form";
import { ReviewDownloadActions } from "./review-download-actions";

type Props = {
  reviewId: string;
  initialLetterText: string | null;
  initialLetterType: string | null;
  insuredName: string | null;
  strategyForLetter: string;
  analysis: AnalysisResult | null;
  analysisRaw: unknown;
  comparison: ComparisonResult | null;
  comparisonRaw: unknown;
  summaryJson: unknown;
  hasSummary: boolean;
  reportTitle: string;
  createdLabel: string;
  safeBaseFileName: string;
  /** Saved ClaimType from wizard is not on `reviews` today; pass "" until persisted. */
  claimType: string;
  aiAnalysisJson: unknown;
  aiComparisonJson: unknown;
};

const PLACEHOLDER_HIGHLIGHT =
  "rounded border border-amber-600/50 bg-amber-400/25 px-0.5 font-mono text-[0.9em] text-amber-100";

export function ReviewLetterSection({
  reviewId,
  initialLetterText,
  initialLetterType,
  insuredName,
  strategyForLetter,
  analysis,
  analysisRaw,
  comparison,
  comparisonRaw,
  summaryJson,
  hasSummary,
  reportTitle,
  createdLabel,
  safeBaseFileName,
  claimType,
  aiAnalysisJson,
  aiComparisonJson,
}: Props) {
  const [letterText, setLetterText] = useState<string | null>(initialLetterText);
  const [letterType, setLetterType] = useState<string | null>(initialLetterType);

  useEffect(() => {
    setLetterText(initialLetterText);
  }, [initialLetterText]);

  useEffect(() => {
    setLetterType(initialLetterType);
  }, [initialLetterType]);

  const onLetterUpdated = useCallback((newText: string, newType: string) => {
    setLetterText(newText);
    setLetterType(newType);
  }, []);

  const valueMap = buildLetterPlaceholderValueMap(insuredName, aiAnalysisJson);
  const letterBody = letterText?.trim() ? (
    <div className="mt-3 max-h-[min(28rem,70vh)] overflow-auto whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-950/80 p-4 text-left text-sm leading-relaxed text-slate-200">
      {letterTextToReactNodes(letterText, valueMap, PLACEHOLDER_HIGHLIGHT)}
    </div>
  ) : (
    <p className="mt-3 text-sm text-slate-500">
      No letter has been saved for this review yet. You can generate one below.
    </p>
  );

  return (
    <>
      <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg shadow-slate-950/50">
        <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-300">
          Letter
        </h2>
        <p className="mt-3 text-[11px] font-medium text-slate-500">
          Type:{" "}
          <span className="text-slate-200">
            {labelForStoredLetterType(letterType)}
          </span>
        </p>
        {letterBody}
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg shadow-slate-950/50">
        <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-300">
          Regenerate letter
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Uses the same letter service as the upload wizard, with the saved
          analysis and comparison. The new letter overwrites the stored letter
          for this review.
        </p>
        <RegenerateLetterForm
          reviewId={reviewId}
          analysisJson={aiAnalysisJson}
          comparisonJson={aiComparisonJson}
          strategy={strategyForLetter}
          claimType={claimType}
          initialLetterType={letterType ?? initialLetterType}
          onLetterUpdated={onLetterUpdated}
        />
      </section>

      <ReviewDownloadActions
        reportTitle={reportTitle}
        createdLabel={createdLabel}
        analysis={analysis}
        analysisRaw={analysisRaw}
        comparison={comparison}
        comparisonRaw={comparisonRaw}
        summaryJson={summaryJson}
        hasSummary={hasSummary}
        letterText={letterText}
        safeBaseFileName={safeBaseFileName}
      />
    </>
  );
}
