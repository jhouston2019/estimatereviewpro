"use client";

import {
  formatStrategyLabel,
  type AnalysisResult,
} from "./step2-analysis-panel";

type Props = {
  analysis: AnalysisResult | null;
  strategy: string | null;
  onStrategyChange: (code: string) => void;
  onBack: () => void;
  onNext: () => void | Promise<void>;
  continueLoading?: boolean;
  announce: (message: string) => void;
};

function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
}

function riskSentence(level: AnalysisResult["riskLevel"]): string {
  if (level === "low") return "The analysis rated overall risk as low.";
  if (level === "high") return "The analysis rated overall risk as high.";
  return "The analysis rated overall risk as moderate.";
}

function buildAutoRationale(analysis: AnalysisResult): string {
  const { carrierAmount, trueLossRange, riskLevel, recommendedStrategy } =
    analysis;
  const { low, high } = trueLossRange;
  const bandMid = (low + high) / 2;
  const gapToMid = bandMid - carrierAmount;
  const gapNote =
    Number.isFinite(gapToMid) && Math.abs(gapToMid) > 0.01
      ? ` The midpoint of the modeled true-loss band is ${formatMoney(bandMid)}, which differs from the extracted carrier total by about ${formatMoney(Math.abs(gapToMid))}.`
      : "";
  return (
    `Extracted carrier total ${formatMoney(carrierAmount)}; modeled true-loss range ${formatMoney(low)} to ${formatMoney(high)}.${gapNote} ${riskSentence(riskLevel)} The analysis output recommends ${formatStrategyLabel(recommendedStrategy)} given these modeled figures and the listed findings (not legal advice).`
  );
}

function cardRationale(
  code: string,
  analysis: AnalysisResult | null
): string {
  if (!analysis) {
    return "Run analysis on Step 1 to populate strategy context.";
  }
  const nOmit = analysis.scopeOmissions.length;
  const nPrice = analysis.pricingFlags.length;
  const nAngles = analysis.disputeAngles.length;
  const base = `Based on the same analysis: ${nOmit} scope omission note(s), ${nPrice} pricing flag(s), ${nAngles} dispute angle(s).`;
  switch (code) {
    case "FULL_SUPPLEMENT_DEMAND":
      return `${base} A full supplement demand aligns when line-item gaps and omissions are the main drivers.`;
    case "PARTIAL_DISPUTE":
      return `${base} A partial dispute fits when only part of the scope or dollars remains contested.`;
    case "DEMAND_REINSPECTION":
      return `${base} Re-inspection is appropriate when scope or field conditions need verification before dollars are finalized.`;
    case "INVOKE_APPRAISAL":
      return `${base} Appraisal may apply when valuation remains materially apart after documented findings.`;
    case "OTHER_CUSTOM":
      return `${base} A custom path covers outcomes that do not match the other four templates.`;
    default:
      return base;
  }
}

function cardRisk(analysis: AnalysisResult | null): string {
  if (!analysis) return "—";
  return `Risk level from analysis: ${analysis.riskLevel}.`;
}

function cardOutcome(code: string, analysis: AnalysisResult | null): string {
  if (!analysis) return "—";
  const { low, high } = analysis.trueLossRange;
  switch (code) {
    case "FULL_SUPPLEMENT_DEMAND":
      return `Aim to align payment closer to the modeled band (${formatMoney(low)}–${formatMoney(high)}) via documented line items.`;
    case "PARTIAL_DISPUTE":
      return "Target a narrower set of line items or dollar items still in contention.";
    case "DEMAND_REINSPECTION":
      return "Seek a revised scope or photos-supported review before finalizing totals.";
    case "INVOKE_APPRAISAL":
      return "Use when valuation remains materially apart after the documented line findings.";
    case "OTHER_CUSTOM":
      return "Define the next action in writing using the analysis lists as support.";
    default:
      return "—";
  }
}

type CardDef = {
  id: string;
  key: string;
  code: string;
};

const STRATEGY_CARDS: CardDef[] = [
  { id: "erp-step4-card-full-supplement", key: "full-supplement", code: "FULL_SUPPLEMENT_DEMAND" },
  { id: "erp-step4-card-partial-dispute", key: "partial-dispute", code: "PARTIAL_DISPUTE" },
  { id: "erp-step4-card-reinspection", key: "reinspection", code: "DEMAND_REINSPECTION" },
  { id: "erp-step4-card-appraisal", key: "appraisal", code: "INVOKE_APPRAISAL" },
  { id: "erp-step4-card-other", key: "other", code: "OTHER_CUSTOM" },
];

export function Step4StrategyPanel({
  analysis,
  strategy,
  onStrategyChange,
  onBack,
  onNext,
  continueLoading = false,
  announce,
}: Props) {
  const handleNext = async () => {
    if (!strategy) {
      announce("Choose a strategy before continuing.");
      return;
    }
    if (continueLoading) return;
    await onNext();
  };

  return (
    <div className="text-[#475569]">
      <h2
        id="erp-step4-heading"
        className="text-2xl font-bold text-[#1E293B]"
      >
        Step 4 — Strategy
      </h2>

      <aside
        id="erp-step4-auto-rationale"
        className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-[#1E293B]"
      >
        {analysis ? (
          buildAutoRationale(analysis)
        ) : (
          "No analysis is loaded. Return to earlier steps to run analysis before choosing a strategy."
        )}
      </aside>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {STRATEGY_CARDS.map(({ id, key, code }) => {
          const selected = strategy === code;
          const recommended =
            analysis?.recommendedStrategy === code;
          return (
            <div
              key={id}
              id={id}
              role="button"
              tabIndex={0}
              onClick={() => onStrategyChange(code)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onStrategyChange(code);
                }
              }}
              className={`relative cursor-pointer rounded-xl border p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                selected
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              {recommended && (
                <span className="absolute right-3 top-3 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                  Recommended
                </span>
              )}
              <div
                id={`erp-step4-card-${key}-title`}
                className="pr-24 text-base font-semibold text-[#1E293B]"
              >
                {formatStrategyLabel(code)}
              </div>
              <p
                id={`erp-step4-card-${key}-rationale`}
                className="mt-2 text-sm text-[#475569]"
              >
                {cardRationale(code, analysis)}
              </p>
              <p
                id={`erp-step4-card-${key}-risk`}
                className="mt-2 text-sm text-[#475569]"
              >
                {cardRisk(analysis)}
              </p>
              <p
                id={`erp-step4-card-${key}-outcome`}
                className="mt-2 text-sm text-[#1E293B]"
              >
                {cardOutcome(code, analysis)}
              </p>
              <div
                id={`erp-step4-card-${key}-select`}
                className="mt-3 text-sm font-semibold text-blue-700"
              >
                {selected ? "Selected" : "Click this card to select"}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-10 flex flex-wrap gap-4 border-t border-slate-200 pt-6">
        <button
          id="erp-step4-back"
          type="button"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#475569] hover:bg-slate-50"
          onClick={onBack}
        >
          Back
        </button>
        <button
          id="erp-step4-next"
          type="button"
          disabled={!strategy || continueLoading}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => void handleNext()}
        >
          {continueLoading ? "Generating…" : "Continue"}
        </button>
      </div>
    </div>
  );
}
