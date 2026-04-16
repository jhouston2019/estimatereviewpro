"use client";

import { useCallback } from "react";
import { netlifyFunctionUrl } from "@/lib/netlify-function-url";
import {
  formatStrategyLabel,
  type AnalysisResult,
  type ComparisonResult,
} from "./step2-analysis-panel";

type ClaimMeta = {
  insuredName: string;
  carrierName: string;
  claimType: string;
  state: string;
  policyNumber: string;
  claimNumber: string;
  dateOfLoss: string;
  adjusterName: string;
  responseDeadline: string;
};

type Props = {
  accessToken: string;
  analysis: AnalysisResult | null;
  comparison: ComparisonResult | null;
  strategy: string | null;
  claimMeta: ClaimMeta;
  onBack: () => void;
  onGoToLetter: () => void;
  onStartOver: () => void;
  announce: (message: string) => void;
};

function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
}

const SUMMARY_DIVIDER = "---------------------------------------";

/**
 * True loss band + estimated gap for summary export and on-screen gap card.
 * midpoint = (trueLossRange.low + trueLossRange.high) / 2
 * gap = midpoint − carrierAmount (does not use disputedAmount).
 * If gap <= 0, the label is "Within carrier range" instead of a dollar amount.
 */
export function getSummaryIdentifiedGap(
  analysis: AnalysisResult,
  _claimMeta: ClaimMeta
): {
  displayLow: number;
  displayHigh: number;
  estimatedGap: number;
  estimatedGapLabel: string;
} {
  const c = Number(analysis.carrierAmount);
  const displayLow = Number(analysis.trueLossRange.low);
  const displayHigh = Number(analysis.trueLossRange.high);
  const mid = (displayLow + displayHigh) / 2;
  const estimatedGap = mid - c;
  const estimatedGapLabel =
    estimatedGap > 0 ? formatMoney(estimatedGap) : "Within carrier range";
  return {
    displayLow,
    displayHigh,
    estimatedGap,
    estimatedGapLabel,
  };
}

function titleCaseRisk(level: string): string {
  const x = String(level || "").toLowerCase();
  if (x === "low") return "Low";
  if (x === "high") return "High";
  if (x === "moderate" || x === "medium") return "Moderate";
  return level ? level.charAt(0).toUpperCase() + level.slice(1) : "—";
}

/** Plain-text summary for PDF/DOCX (Times Roman in generator; structure matters). */
export function buildSummaryText(
  analysis: AnalysisResult | null,
  comparison: ComparisonResult | null,
  claimMeta: ClaimMeta,
  strategy: string | null
): string {
  const claimLines: string[] = [
    "CLAIM IDENTIFICATION",
    alignClaimLine("Policy Number:", claimMeta.policyNumber || "—"),
    alignClaimLine("Claim Number:", claimMeta.claimNumber || "—"),
    alignClaimLine("Insured Name:", claimMeta.insuredName?.trim() || "—"),
    alignClaimLine("Date of Loss:", claimMeta.dateOfLoss || "—"),
    alignClaimLine("Adjuster Name:", claimMeta.adjusterName || "—"),
    alignClaimLine("Carrier Name:", claimMeta.carrierName?.trim() || "—"),
  ];

  const gapSection: string[] = ["IDENTIFIED GAP"];
  if (analysis) {
    const { carrierAmount, riskLevel } = analysis;
    const { displayLow, displayHigh, estimatedGapLabel } =
      getSummaryIdentifiedGap(analysis, claimMeta);
    gapSection.push(
      alignClaimLine("Carrier Amount:", formatMoney(carrierAmount)),
      alignClaimLine(
        "True Loss Range:",
        `${formatMoney(displayLow)} – ${formatMoney(displayHigh)}`
      ),
      alignClaimLine("Estimated Gap:", estimatedGapLabel),
      alignClaimLine("Risk Level:", titleCaseRisk(riskLevel))
    );
  } else {
    gapSection.push(
      alignClaimLine("Carrier Amount:", "—"),
      alignClaimLine("True Loss Range:", "—"),
      alignClaimLine("Estimated Gap:", "—"),
      alignClaimLine("Risk Level:", "—")
    );
  }

  const bullets = (items: string[], emptyLine: string) =>
    items.length > 0
      ? items.map((t) => `  • ${t}`).join("\n")
      : `  • ${emptyLine}`;

  const scopeItems =
    analysis?.scopeOmissions?.length ? analysis.scopeOmissions : [];
  const pricingItems =
    analysis?.pricingFlags?.length ? analysis.pricingFlags : [];
  const codeItems =
    analysis?.codeUpgradeGaps?.length ? analysis.codeUpgradeGaps : [];
  const opItems = analysis?.opFindings?.length ? analysis.opFindings : [];
  const procItems =
    analysis?.proceduralDefects?.length ? analysis.proceduralDefects : [];
  const angleItems =
    analysis?.disputeAngles?.length ? analysis.disputeAngles : [];
  const actionItems =
    analysis?.actionItems?.length ? analysis.actionItems : [];
  const docItems =
    analysis?.requiredDocuments?.length ? analysis.requiredDocuments : [];
  const escItems =
    analysis?.escalationOptions?.length ? analysis.escalationOptions : [];

  const strategyLabel =
    strategy && strategy.trim()
      ? formatStrategyLabel(strategy)
      : analysis
        ? formatStrategyLabel(analysis.recommendedStrategy)
        : "—";

  const parts: string[] = [
    "ESTIMATE REVIEW PRO — FINDINGS SUMMARY",
    "=======================================",
    "",
    ...claimLines,
    "",
    SUMMARY_DIVIDER,
    "",
    ...gapSection,
    "",
    SUMMARY_DIVIDER,
    "",
    "SCOPE OMISSIONS",
    bullets(scopeItems, "None identified."),
    "",
    "PRICING SUPPRESSION FLAGS",
    bullets(pricingItems, "None identified."),
    "",
    "CODE UPGRADE GAPS",
    bullets(codeItems, "None identified."),
    "",
    "O&P FINDINGS",
    bullets(opItems, "None identified."),
    "",
    "PROCEDURAL DEFECTS",
    bullets(procItems, "None identified."),
    "",
    SUMMARY_DIVIDER,
    "",
  ];

  if (comparison) {
    parts.push(
      "COMPARISON SUMMARY",
      alignClaimLine("Total Carrier:", formatMoney(comparison.totalCarrier)),
      alignClaimLine(
        "Total Contractor/Recon:",
        formatMoney(comparison.totalContractor)
      ),
      alignClaimLine("Total Gap:", formatMoney(comparison.totalDelta)),
      "",
      SUMMARY_DIVIDER,
      ""
    );
  }

  parts.push(
    "SELECTED STRATEGY",
    strategyLabel,
    "",
    "DISPUTE ANGLES",
    bullets(angleItems, "None identified."),
    "",
    "ACTION ITEMS",
    bullets(actionItems, "None identified."),
    "",
    "REQUIRED DOCUMENTS",
    bullets(docItems, "None identified."),
    "",
    "ESCALATION OPTIONS",
    bullets(escItems, "None identified."),
    "",
    SUMMARY_DIVIDER,
    "",
    "This summary was generated by Estimate Review Pro.",
    "Findings are based on structured analysis of submitted documents.",
    "This is not legal advice."
  );

  return parts.join("\n");
}

function alignClaimLine(label: string, value: string): string {
  const w = 22;
  const base = label.length <= w ? label.padEnd(w) : `${label} `;
  return `${base}${value}`;
}

function strategyRationaleFromAnalysis(
  analysis: AnalysisResult | null,
  strategy: string | null
): string {
  if (!analysis) return "—";
  const { carrierAmount, trueLossRange, riskLevel } = analysis;
  const { low, high } = trueLossRange;
  const mid = (low + high) / 2;
  const gap = mid - carrierAmount;
  const gapNote =
    Number.isFinite(gap) && Math.abs(gap) > 0.01
      ? `Modeled band midpoint ${formatMoney(mid)} vs carrier total ${formatMoney(carrierAmount)} (difference about ${formatMoney(Math.abs(gap))}). `
      : "";
  const strat =
    strategy && strategy.trim()
      ? formatStrategyLabel(strategy)
      : formatStrategyLabel(analysis.recommendedStrategy);
  return `${gapNote}Risk level from analysis: ${riskLevel}. Selected strategy: ${strat}. Findings below are taken only from the structured analysis output (not legal advice).`;
}

export function Step5SummaryPanel({
  accessToken,
  analysis,
  comparison,
  strategy,
  claimMeta,
  onBack,
  onGoToLetter,
  onStartOver,
  announce,
}: Props) {
  const downloadPdf = useCallback(async () => {
    const text = buildSummaryText(analysis, comparison, claimMeta, strategy);
    const res = await fetch(netlifyFunctionUrl("generate-pdf"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ text, fileName: "wizard-summary.pdf" }),
    });
    const ct = res.headers.get("content-type") || "";
    if (!res.ok || ct.includes("application/json")) {
      await res.text().catch(() => "");
      announce("PDF download failed. Please try again.");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wizard-summary.pdf";
    a.click();
    URL.revokeObjectURL(url);
    announce("Summary PDF downloaded.");
  }, [announce]);

  const downloadWord = useCallback(async () => {
    const root = document.getElementById("erp-step5-print-root");
    if (!root) {
      announce("Print region missing.");
      return;
    }
    const text = root.innerText;
    const res = await fetch(netlifyFunctionUrl("generate-docx"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ text, fileName: "wizard-summary.docx" }),
    });
    const ct = res.headers.get("content-type") || "";
    if (!res.ok || ct.includes("application/json")) {
      await res.text().catch(() => "");
      announce("Word download failed. Please try again.");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wizard-summary.docx";
    a.click();
    URL.revokeObjectURL(url);
    announce("Summary Word document downloaded.");
  }, [accessToken, analysis, announce, claimMeta, comparison, strategy]);

  const carrierNameDisplay = claimMeta.carrierName?.trim() || "—";

  const a = analysis;
  const omissions = a?.scopeOmissions?.length
    ? a.scopeOmissions
    : ["None listed."];
  const pricing = a?.pricingFlags?.length ? a.pricingFlags : ["None listed."];
  const codes = a?.codeUpgradeGaps?.length
    ? a.codeUpgradeGaps
    : ["None listed."];
  const ops = a?.opFindings?.length ? a.opFindings : ["None listed."];
  const procs = a?.proceduralDefects?.length
    ? a.proceduralDefects
    : ["None listed."];
  const actions = a?.actionItems?.length ? a.actionItems : ["None listed."];
  const docs = a?.requiredDocuments?.length
    ? a.requiredDocuments
    : ["None listed."];
  const esc = a?.escalationOptions?.length
    ? a.escalationOptions
    : ["None listed."];

  const sectionHeading =
    "text-xs font-semibold uppercase tracking-wide text-slate-500 border-l-4 border-blue-400 pl-2";

  const gm = a ? getSummaryIdentifiedGap(a, claimMeta) : null;

  return (
    <div className="text-[#475569]">
      <h2
        id="erp-step5-heading"
        className="text-2xl font-bold text-[#1E293B]"
      >
        Step 5 — Summary
      </h2>
      <p className="mt-2 text-sm text-[#475569]">
        Complete findings summary. Export as PDF or Word.
      </p>

      <div
        id="erp-step5-print-root"
        className="mt-6 space-y-6 text-sm text-[#1E293B]"
      >
        <section id="erp-step5-claim-block" className="rounded-lg bg-gray-50 p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-slate-500">Insured name</p>
              <p className="text-sm font-medium text-slate-800">
                {claimMeta.insuredName?.trim() || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Policy number</p>
              <p className="text-sm font-medium text-slate-800">
                {claimMeta.policyNumber || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Claim number</p>
              <p className="text-sm font-medium text-slate-800">
                {claimMeta.claimNumber || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Date of loss</p>
              <p className="text-sm font-medium text-slate-800">
                {claimMeta.dateOfLoss || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Adjuster name</p>
              <p className="text-sm font-medium text-slate-800">
                {claimMeta.adjusterName || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Carrier name</p>
              <p className="text-sm font-medium text-slate-800">
                {carrierNameDisplay}
              </p>
            </div>
          </div>
        </section>

        <section
          id="erp-step5-gap-card"
          className="rounded-lg bg-slate-50 p-6 text-[#1E293B]"
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {a ? formatMoney(a.carrierAmount) : "—"}
              </p>
              <p className="mt-1 text-xs text-slate-500">Carrier amount</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {gm
                  ? `${formatMoney(gm.displayLow)} – ${formatMoney(gm.displayHigh)}`
                  : "—"}
              </p>
              <p className="mt-1 text-xs text-slate-500">True loss range</p>
            </div>
            <div>
              <p
                className={`text-2xl font-bold ${
                  !gm
                    ? "text-slate-400"
                    : gm.estimatedGap > 0
                      ? "text-green-600"
                      : "text-slate-400"
                }`}
              >
                {gm ? gm.estimatedGapLabel : "—"}
              </p>
              <p className="mt-1 text-xs text-slate-500">Estimated gap</p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-0">
            <div className="border-b border-slate-100 pb-3">
              <h3 className={sectionHeading}>Scope omissions</h3>
              <div className="py-2">
                {!a?.scopeOmissions?.length ? (
                  <p className="text-sm italic text-slate-400">None identified.</p>
                ) : (
                  <ul
                    id="erp-step5-scope-list"
                    className="list-disc space-y-0.5 pl-5 text-sm"
                  >
                    {omissions.map((t, i) => (
                      <li key={i} id={`erp-step5-scope-${i + 1}`}>
                        {t}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="border-b border-slate-100 pb-3">
              <h3 className={sectionHeading}>Pricing suppression flags</h3>
              <div className="py-2">
                {!a?.pricingFlags?.length ? (
                  <p className="text-sm italic text-slate-400">None identified.</p>
                ) : (
                  <ul
                    id="erp-step5-pricing-list"
                    className="list-disc space-y-0.5 pl-5 text-sm"
                  >
                    {pricing.map((t, i) => (
                      <li key={i} id={`erp-step5-pricing-${i + 1}`}>
                        {t}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="border-b border-slate-100 pb-3">
              <h3 className={sectionHeading}>Code upgrade gaps</h3>
              <div className="py-2">
                {!a?.codeUpgradeGaps?.length ? (
                  <p className="text-sm italic text-slate-400">None identified.</p>
                ) : (
                  <ul
                    id="erp-step5-code-list"
                    className="list-disc space-y-0.5 pl-5 text-sm"
                  >
                    {codes.map((t, i) => (
                      <li key={i} id={`erp-step5-code-${i + 1}`}>
                        {t}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="border-b border-slate-100 pb-3">
              <h3 className={sectionHeading}>O&amp;P findings</h3>
              <div className="py-2">
                {!a?.opFindings?.length ? (
                  <p className="text-sm italic text-slate-400">None identified.</p>
                ) : (
                  <ul
                    id="erp-step5-op-list"
                    className="list-disc space-y-0.5 pl-5 text-sm"
                  >
                    {ops.map((t, i) => (
                      <li key={i} id={`erp-step5-op-${i + 1}`}>
                        {t}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
              <h3 className={sectionHeading}>Procedural defects</h3>
              <div className="py-2">
                {!a?.proceduralDefects?.length ? (
                  <p className="text-sm italic text-slate-400">None identified.</p>
                ) : (
                  <ul
                    id="erp-step5-procedural-list"
                    className="list-disc space-y-0.5 pl-5 text-sm"
                  >
                    {procs.map((t, i) => (
                      <li key={i} id={`erp-step5-proc-${i + 1}`}>
                        {t}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-0">
            {comparison && (
              <section
                id="erp-step5-comparison-block"
                className="mb-4 rounded-lg bg-slate-50 p-4"
              >
                <h3 className={sectionHeading}>Comparison totals</h3>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xl font-bold text-slate-800">
                      {formatMoney(comparison.totalCarrier)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Total carrier</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-slate-800">
                      {formatMoney(comparison.totalContractor)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Total contractor / recon
                    </p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-slate-800">
                      {formatMoney(comparison.totalDelta)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Total delta</p>
                  </div>
                </div>
              </section>
            )}

            <section
              id="erp-step5-strategy-block"
              className="border-b border-slate-100 pb-3"
            >
              <h3 className={sectionHeading}>Selected strategy</h3>
              <p className="py-2 text-sm font-medium text-[#1E293B]">
                {strategy ? formatStrategyLabel(strategy) : "—"}
              </p>
              <p className="text-sm text-[#475569]">
                {strategyRationaleFromAnalysis(analysis, strategy)}
              </p>
            </section>

            <section className="pb-2 pt-2">
              <h3 className={sectionHeading}>Action items</h3>
              {!a?.actionItems?.length ? (
                <p className="py-2 text-sm italic text-slate-400">None listed.</p>
              ) : (
                <ul
                  id="erp-step5-action-list"
                  className="space-y-0.5 py-2 text-[#1E293B]"
                >
                  {actions.map((t, i) => (
                    <li key={i} id={`erp-step5-action-${i + 1}`} className="flex gap-2">
                      <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0" />
                      <span className="text-sm">{t}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>

        <section className="border-b border-slate-100 pb-3">
          <h3 className={sectionHeading}>Required documents</h3>
          <div className="py-2">
            {!a?.requiredDocuments?.length ? (
              <p className="text-sm italic text-slate-400">None listed.</p>
            ) : (
              <ul id="erp-step5-docs-list" className="list-disc space-y-0.5 pl-5 text-sm">
                {docs.map((t, i) => (
                  <li key={i} id={`erp-step5-doc-${i + 1}`}>
                    {t}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="pb-2">
          <h3 className={sectionHeading}>Escalation options</h3>
          <div className="py-2">
            {!a?.escalationOptions?.length ? (
              <p className="text-sm italic text-slate-400">None listed.</p>
            ) : (
              <ul
                id="erp-step5-escalation-list"
                className="list-disc space-y-0.5 pl-5 text-sm"
              >
                {esc.map((t, i) => (
                  <li key={i} id={`erp-step5-escalation-${i + 1}`}>
                    {t}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-200 pt-6">
        <button
          id="erp-step5-download-pdf"
          type="button"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#1E293B] hover:bg-slate-50"
          onClick={() => void downloadPdf()}
        >
          Download PDF
        </button>
        <button
          id="erp-step5-download-word"
          type="button"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#1E293B] hover:bg-slate-50"
          onClick={() => void downloadWord()}
        >
          Download Word
        </button>
      </div>

      <div className="mt-10 flex flex-wrap gap-4 border-t border-slate-200 pt-6">
        <button
          id="erp-step5-back"
          type="button"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#475569] hover:bg-slate-50"
          onClick={onBack}
        >
          Back
        </button>
        <button
          id="erp-step5-go-to-letter"
          type="button"
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          onClick={onGoToLetter}
        >
          Generate Letter (Optional)
        </button>
        <button
          id="erp-step5-start-over"
          type="button"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#1E293B] hover:bg-slate-50"
          onClick={onStartOver}
        >
          Start over
        </button>
      </div>
    </div>
  );
}
