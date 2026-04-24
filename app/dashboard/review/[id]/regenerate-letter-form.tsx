"use client";

import { useMemo, useState, type FormEvent } from "react";
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

const LETTER_TYPE_OPTIONS: { label: string; value: string }[] = [
  { label: "Demand Letter", value: "SUPPLEMENT_DEMAND" },
  { label: "Appeal Letter", value: "DISPUTE" },
  { label: "Supplemental Request", value: "REINSPECTION_REQUEST" },
  { label: "Custom Letter", value: "CUSTOM" },
];

const OPTION_VALUES = new Set(LETTER_TYPE_OPTIONS.map((o) => o.value));

const CUSTOM_PLACEHOLDER =
  "Describe the letter you need, include any specific points, responses to carrier, or additional context...";

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
  const validInitial = useMemo(() => {
    if (initialLetterType && OPTION_VALUES.has(initialLetterType)) {
      return initialLetterType;
    }
    return LETTER_TYPE_OPTIONS[0].value;
  }, [initialLetterType]);

  const [letterType, setLetterType] = useState<string>(validInitial);
  const [customInstructions, setCustomInstructions] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
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
      const body: Record<string, unknown> = {
        analysis: analysisPayload,
        strategy: strat,
        claimType: claimType || "",
        letterType,
        tone: "FORMAL_PROFESSIONAL",
      };
      if (letterType === "CUSTOM") {
        body.customInstructions = customInstructions;
      }
      if (additionalNotes.trim()) {
        body.additionalNotes = additionalNotes.trim();
      }
      const res = await wizardFetch(
        netlifyFunctionUrl("generate-estimate-letter"),
        {
          method: "POST",
          body: JSON.stringify(body),
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
      className="mt-4 flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
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
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:opacity-50 sm:self-end"
          disabled={loading}
        >
          {loading ? "Generating…" : "Generate New Letter"}
        </button>
      </div>

      {letterType === "CUSTOM" ? (
        <div>
          <label
            htmlFor="erp-regenerate-custom-instructions"
            className="text-[11px] font-medium text-slate-500"
          >
            Custom letter instructions
          </label>
          <textarea
            id="erp-regenerate-custom-instructions"
            rows={4}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
            placeholder={CUSTOM_PLACEHOLDER}
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            disabled={loading}
          />
        </div>
      ) : null}

      <div>
        <label
          htmlFor="erp-regenerate-additional-notes"
          className="text-[11px] font-medium text-slate-500"
        >
          Additional notes or context (optional)
        </label>
        <textarea
          id="erp-regenerate-additional-notes"
          rows={3}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
          placeholder="Optional context for any letter type — carrier responses, dates, or themes to stress."
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
          disabled={loading}
        />
      </div>

      {error ? (
        <p className="text-sm text-red-300" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
