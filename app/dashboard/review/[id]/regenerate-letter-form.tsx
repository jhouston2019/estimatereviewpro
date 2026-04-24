"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { netlifyFunctionUrl } from "@/lib/netlify-function-url";
import {
  createSupabaseBrowserClient,
  wizardFetch,
} from "@/lib/supabaseClient";

const STRATEGY_CODES = new Set<string>([
  "FULL_SUPPLEMENT_DEMAND",
  "PARTIAL_DISPUTE",
  "DEMAND_REINSPECTION",
  "INVOKE_APPRAISAL",
  "OTHER_CUSTOM",
]);

const LETTER_TYPE_OPTIONS = [
  { label: "Demand Letter", value: "SUPPLEMENT_DEMAND" as const },
  { label: "Appeal Letter", value: "DISPUTE" as const },
  {
    label: "Supplemental Request",
    value: "REINSPECTION_REQUEST" as const,
  },
];

type Props = {
  reviewId: string;
  analysisJson: unknown;
  comparisonJson: unknown;
  strategy: string;
  claimType: string;
  initialLetterType: string | null;
};

function parseJsonIfString(raw: unknown): unknown {
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function mergeAnalysisForLetter(
  analysis: unknown,
  comparison: unknown
): Record<string, unknown> {
  const parsed = parseJsonIfString(analysis);
  const body =
    parsed !== null &&
    parsed !== undefined &&
    typeof parsed === "object" &&
    !Array.isArray(parsed)
      ? { ...(parsed as Record<string, unknown>) }
      : {};
  if (comparison != null) {
    body.estimateComparison = parseJsonIfString(comparison) ?? comparison;
  }
  return body;
}

export function RegenerateLetterForm({
  reviewId,
  analysisJson,
  comparisonJson,
  strategy,
  claimType,
  initialLetterType,
}: Props) {
  const validInitial =
    initialLetterType &&
    LETTER_TYPE_OPTIONS.some((o) => o.value === initialLetterType)
      ? initialLetterType
      : LETTER_TYPE_OPTIONS[0].value;

  const [letterType, setLetterType] = useState<string>(validInitial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsedAnalysis = parseJsonIfString(analysisJson);
    if (
      parsedAnalysis === null ||
      parsedAnalysis === undefined ||
      (typeof parsedAnalysis !== "object" && typeof parsedAnalysis !== "string")
    ) {
      setError("This review has no saved analysis to generate a letter from.");
      return;
    }
    setLoading(true);
    try {
      const strat = STRATEGY_CODES.has(strategy)
        ? strategy
        : "FULL_SUPPLEMENT_DEMAND";
      const analysisPayload = mergeAnalysisForLetter(
        parsedAnalysis,
        comparisonJson
      );
      const res = await wizardFetch(
        netlifyFunctionUrl("generate-estimate-letter"),
        {
          method: "POST",
          body: JSON.stringify({
            analysis: analysisPayload,
            strategy: strat,
            claimType: claimType || "",
            letterType,
            tone: "FORMAL_PROFESSIONAL",
          }),
        }
      );
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        setError(
          `Could not generate letter (HTTP ${res.status}). ${
            t ? t.slice(0, 200) : ""
          }`
        );
        return;
      }
      const ct = (res.headers.get("content-type") || "").toLowerCase();
      if (ct.includes("application/json")) {
        setError("Letter service returned an unexpected response.");
        return;
      }
      const text = await res.text();
      if (!text.trim()) {
        setError("The letter response was empty.");
        return;
      }
      const supabase = createSupabaseBrowserClient();
      const { error: upErr } = await supabase
        .from("reviews")
        .update({ letter_text: text, letter_type: letterType })
        .eq("id", reviewId);
      if (upErr) {
        setError(upErr.message);
        return;
      }
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-4 sm:flex-row sm:flex-wrap sm:items-end"
    >
      <div className="min-w-[200px] flex-1">
        <label
          htmlFor="erp-regenerate-letter-type"
          className="text-[11px] font-medium text-slate-500"
        >
          Letter type
        </label>
        <select
          id="erp-regenerate-letter-type"
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
          value={letterType}
          onChange={(e) => setLetterType(e.target.value)}
          disabled={loading}
        >
          {LETTER_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Generating…" : "Generate New Letter"}
      </button>
      {error ? (
        <p className="w-full text-sm text-red-300" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
