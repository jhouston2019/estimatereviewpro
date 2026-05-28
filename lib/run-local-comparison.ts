import {
  comparisonHasLineRows,
  parseComparisonResult,
  type ComparisonResult,
} from "@/lib/estimate-json-parse";

type FallbackModule = {
  buildFallbackComparison: (
    mode: string,
    carrierText: string,
    contractorText: string | null
  ) => ComparisonResult | null;
  resolveCompareMode: (contractorText: string | null) => string;
};

const fallback = require("./estimate-comparison-fallback.js") as FallbackModule;

/** Build comparison table in-browser when compare-estimates times out or fails. */
export function buildLocalComparison(
  carrierText: string,
  contractorText: string | null
): ComparisonResult | null {
  const mode = fallback.resolveCompareMode(contractorText);
  const raw = fallback.buildFallbackComparison(
    mode,
    carrierText.trim(),
    contractorText?.trim() || null
  );
  if (!raw) return null;
  const parsed = parseComparisonResult(raw);
  if (!parsed || !comparisonHasLineRows(parsed)) return null;
  return parsed;
}
