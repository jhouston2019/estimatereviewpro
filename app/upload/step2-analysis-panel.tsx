"use client";

import { useCallback, useMemo } from "react";
import { netlifyFunctionUrl } from "@/lib/netlify-function-url";

export type AnalysisResult = {
  carrierAmount: number;
  trueLossRange: { low: number; high: number };
  riskLevel: "low" | "moderate" | "high";
  scopeOmissions: string[];
  pricingFlags: string[];
  codeUpgradeGaps: string[];
  opFindings: string[];
  proceduralDefects: string[];
  disputeAngles: string[];
  actionItems: string[];
  requiredDocuments: string[];
  escalationOptions: string[];
  availableStrategies: string[];
  recommendedStrategy: string;
};

export type ComparisonResult = {
  mode: string;
  lineItems: Array<{
    trade: string;
    carrierItem: string;
    carrierAmount: number;
    contractorItem: string;
    contractorAmount: number;
    delta: number;
    flagged: boolean;
    reason: string;
  }>;
  totalCarrier: number;
  totalContractor: number;
  totalDelta: number;
};

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

export function parseComparisonResult(raw: unknown): ComparisonResult | null {
  if (!isRecord(raw)) return null;
  const mode = String(raw.mode || "UNKNOWN");
  const items = Array.isArray(raw.lineItems) ? raw.lineItems : [];
  const lineItems = items.map((row) => {
    const r = isRecord(row) ? row : {};
    return {
      trade: String(r.trade ?? ""),
      carrierItem: String(r.carrierItem ?? ""),
      carrierAmount: Number(r.carrierAmount) || 0,
      contractorItem: String(r.contractorItem ?? ""),
      contractorAmount: Number(r.contractorAmount) || 0,
      delta: Number(r.delta) || 0,
      flagged: Boolean(r.flagged),
      reason: String(r.reason ?? ""),
    };
  });
  return {
    mode,
    lineItems,
    totalCarrier: Number(raw.totalCarrier) || 0,
    totalContractor: Number(raw.totalContractor) || 0,
    totalDelta: Number(raw.totalDelta) || 0,
  };
}

function parseMoneyLikeNumber(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const s = String(v ?? "")
    .replace(/\$/g, "")
    .replace(/,/g, "")
    .trim();
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
}

export function parseAnalysisResult(raw: unknown): AnalysisResult | null {
  if (!isRecord(raw)) return null;
  const carrierAmount = parseMoneyLikeNumber(raw.carrierAmount);
  const tlr = raw.trueLossRange as Record<string, unknown> | undefined;
  let low = parseMoneyLikeNumber(tlr?.low);
  let high = parseMoneyLikeNumber(tlr?.high);
  if (Number.isFinite(low) && Number.isFinite(high) && low > high) {
    const t = low;
    low = high;
    high = t;
  }
  const risk = String(raw.riskLevel || "").toLowerCase();
  const riskLevel =
    risk === "low" || risk === "moderate" || risk === "high"
      ? risk
      : "moderate";
  const strArr = (k: string): string[] => {
    const v = raw[k];
    if (!Array.isArray(v)) return [];
    return v.map((x) => String(x)).filter(Boolean);
  };
  if (!Number.isFinite(carrierAmount)) return null;
  const trueLossRange =
    Number.isFinite(low) && Number.isFinite(high) && high >= low
      ? { low, high }
      : { low: 0, high: 0 };
  return {
    carrierAmount,
    trueLossRange,
    riskLevel,
    scopeOmissions: strArr("scopeOmissions"),
    pricingFlags: strArr("pricingFlags"),
    codeUpgradeGaps: strArr("codeUpgradeGaps"),
    opFindings: strArr("opFindings"),
    proceduralDefects: strArr("proceduralDefects"),
    disputeAngles: strArr("disputeAngles"),
    actionItems: strArr("actionItems"),
    requiredDocuments: strArr("requiredDocuments"),
    escalationOptions: strArr("escalationOptions"),
    availableStrategies: strArr("availableStrategies"),
    recommendedStrategy: String(raw.recommendedStrategy || ""),
  };
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
}

function comparisonSummaryLine(c: ComparisonResult): string {
  const carrier = formatMoney(c.totalCarrier);
  const other = formatMoney(c.totalContractor);
  const gap = formatMoney(c.totalDelta);
  if (c.mode === "LINE_COMPARE") {
    return `Contractor estimate provided. Carrier total ${carrier} vs contractor total ${other} — gap of ${gap}.`;
  }
  if (c.mode === "RECON_VS_CARRIER") {
    return `Reconstructed scope vs carrier. Carrier total ${carrier} vs reconstructed total ${other} — gap of ${gap}.`;
  }
  return `Carrier total ${carrier} vs other total ${other} — gap of ${gap}.`;
}

/** UI-only labels; API still uses canonical enum strings. */
const STRATEGY_DISPLAY_LABELS: Record<string, string> = {
  FULL_SUPPLEMENT_DEMAND: "Full Supplement Demand",
  PARTIAL_DISPUTE: "Partial Dispute",
  DEMAND_REINSPECTION: "Demand Re-Inspection",
  INVOKE_APPRAISAL: "Invoke Appraisal",
  OTHER_CUSTOM: "Other / Custom",
};

export function formatStrategyLabel(code: string): string {
  const key = code.trim();
  return STRATEGY_DISPLAY_LABELS[key] ?? key;
}

function riskBadgeClass(risk: AnalysisResult["riskLevel"]): string {
  if (risk === "low")
    return "border-emerald-300 bg-emerald-50 text-emerald-800";
  if (risk === "high")
    return "border-red-300 bg-red-50 text-red-800";
  return "border-amber-300 bg-amber-50 text-amber-900";
}

type Props = {
  accessToken: string;
  analysis: AnalysisResult | null;
  comparison: ComparisonResult | null;
  onBack: () => void;
  onNext: () => void;
  announce: (message: string) => void;
};

export function Step2AnalysisPanel({
  accessToken,
  analysis,
  comparison,
  onBack,
  onNext,
  announce,
}: Props) {
  const downloadPdf = useCallback(async () => {
    const root = document.getElementById("erp-step2-print-root");
    if (!root) {
      announce("Download failed: missing print region.");
      return;
    }
    const text = root.innerText;
    const res = await fetch(netlifyFunctionUrl("generate-pdf"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        text,
        fileName: "estimate-analysis.pdf",
      }),
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
    a.download = "estimate-analysis.pdf";
    a.click();
    URL.revokeObjectURL(url);
    announce("PDF downloaded.");
  }, [accessToken, announce]);

  const downloadWord = useCallback(async () => {
    const root = document.getElementById("erp-step2-print-root");
    if (!root) {
      announce("Download failed: missing print region.");
      return;
    }
    const text = root.innerText;
    const res = await fetch(netlifyFunctionUrl("generate-docx"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        text,
        fileName: "estimate-analysis.docx",
      }),
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
    a.download = "estimate-analysis.docx";
    a.click();
    URL.revokeObjectURL(url);
    announce("Word document downloaded.");
  }, [accessToken, announce]);

  const omissionItems = useMemo(() => {
    if (!analysis?.scopeOmissions.length) return ["None identified."];
    return analysis.scopeOmissions;
  }, [analysis]);

  const pricingItems = useMemo(() => {
    if (!analysis?.pricingFlags.length) return ["None identified."];
    return analysis.pricingFlags;
  }, [analysis]);

  const codeItems = useMemo(() => {
    if (!analysis?.codeUpgradeGaps.length) return ["None identified."];
    return analysis.codeUpgradeGaps;
  }, [analysis]);

  const opItems = useMemo(() => {
    if (!analysis?.opFindings.length) return ["None identified."];
    return analysis.opFindings;
  }, [analysis]);

  const procItems = useMemo(() => {
    if (!analysis?.proceduralDefects.length) return ["None identified."];
    return analysis.proceduralDefects;
  }, [analysis]);

  const angleItems = useMemo(() => {
    if (!analysis?.disputeAngles.length) return ["None listed."];
    return analysis.disputeAngles;
  }, [analysis]);

  const actionItems = useMemo(() => {
    if (!analysis?.actionItems.length) return ["None listed."];
    return analysis.actionItems;
  }, [analysis]);

  const docItems = useMemo(() => {
    if (!analysis?.requiredDocuments.length) return ["None listed."];
    return analysis.requiredDocuments;
  }, [analysis]);

  const escalationItems = useMemo(() => {
    if (!analysis?.escalationOptions.length) return ["None listed."];
    return analysis.escalationOptions;
  }, [analysis]);

  if (!analysis) {
    return (
      <div className="text-[#475569]">
        <p className="text-sm">
          No analysis loaded. Go back to Step 1 and run Continue to generate
          analysis.
        </p>
        <div className="mt-6">
          <button
            id="erp-step2-back"
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#1E293B] hover:bg-slate-50"
            onClick={onBack}
          >
            Back to Step 1
          </button>
        </div>
      </div>
    );
  }

  const bandMid =
    (analysis.trueLossRange.low + analysis.trueLossRange.high) / 2;
  const gapDollars = bandMid - analysis.carrierAmount;
  const gapDisplay =
    gapDollars > 0 ? formatMoney(gapDollars) : "Within carrier range";
  const gapNumberClass =
    gapDollars > 0 ? "text-2xl font-bold text-green-600" : "text-2xl font-bold text-slate-400";

  const sectionHeading =
    "text-xs font-semibold uppercase tracking-wide text-slate-500 border-l-4 border-blue-400 pl-2";

  return (
    <div className="text-[#475569]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="text-2xl font-bold text-[#1E293B]">Step 2 — Analysis</h2>
        <div
          id="erp-step2-badge-risk"
          className={`inline-flex shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold ${riskBadgeClass(analysis.riskLevel)}`}
        >
          {`Risk level: ${analysis.riskLevel.charAt(0).toUpperCase()}${analysis.riskLevel.slice(1)}`}
        </div>
      </div>
      <p className="mt-2 text-sm text-[#475569]">
        Structured findings from the carrier estimate.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          id="erp-step2-download-analysis-pdf"
          type="button"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#1E293B] hover:bg-slate-50"
          onClick={() => void downloadPdf()}
        >
          Download PDF
        </button>
        <button
          id="erp-step2-download-analysis-word"
          type="button"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#1E293B] hover:bg-slate-50"
          onClick={() => void downloadWord()}
        >
          Download Word
        </button>
      </div>

      <div
        id="erp-step2-print-root"
        className="mt-8 border-t border-slate-200 pt-8 text-[#1E293B]"
      >
        <p className="text-sm font-semibold text-[#475569]">
          Estimate Review Pro — Analysis Summary
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Risk level:{" "}
          {`${analysis.riskLevel.charAt(0).toUpperCase()}${analysis.riskLevel.slice(1)}`}
        </p>

        {comparison && (
          <div className="mt-4 border-b border-slate-100 pb-3 text-sm text-[#1E293B]">
            <h3 className={sectionHeading}>Comparison</h3>
            <p className="py-2 text-sm text-[#475569]">
              {comparisonSummaryLine(comparison)}
            </p>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <section
              id="erp-step2-card-gap"
              className="rounded-xl bg-blue-50 p-6 text-[#1E293B]"
            >
              <h3 className={sectionHeading}>Carrier vs true loss range</h3>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-2xl font-bold text-slate-800">
                    {formatMoney(analysis.carrierAmount)}
                  </p>
                  <p className="text-xs text-slate-500">Carrier amount</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700">
                    {formatMoney(analysis.trueLossRange.low)} –{" "}
                    {formatMoney(analysis.trueLossRange.high)}
                  </p>
                  <p className="text-xs text-slate-500">True loss range</p>
                </div>
                <div>
                  <p className={gapNumberClass}>{gapDisplay}</p>
                  <p className="text-xs text-slate-500">Estimated gap</p>
                </div>
              </div>
            </section>

            <section id="erp-step2-card-procedural" className="text-sm">
              <h3 className={sectionHeading}>Procedural defects</h3>
              <div className="py-2">
                {analysis.proceduralDefects.length === 0 ? (
                  <p className="text-sm italic text-slate-400">None identified.</p>
                ) : (
                  <ul className="list-disc space-y-0.5 pl-5 text-sm text-[#1E293B]">
                    {procItems.map((t, i) => (
                      <li key={i} id={`erp-step2-proc-${i + 1}`}>
                        {t}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>

          <div className="flex flex-col gap-0">
            <div className="border-b border-slate-100 pb-3">
              <section id="erp-step2-card-scope-omissions">
                <h3 className={sectionHeading}>Scope omissions</h3>
                <div className="py-2">
                  {!analysis.scopeOmissions.length ? (
                    <p className="text-sm italic text-slate-400">None identified.</p>
                  ) : (
                    <ul className="list-disc space-y-0.5 pl-5 text-sm text-[#1E293B]">
                      {omissionItems.map((t, i) => (
                        <li key={i} id={`erp-step2-omission-${i + 1}`}>
                          {t}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </div>

            <div className="border-b border-slate-100 pb-3">
              <section id="erp-step2-card-pricing">
                <h3 className={sectionHeading}>Pricing flags</h3>
                <div className="py-2">
                  {!analysis.pricingFlags.length ? (
                    <p className="text-sm italic text-slate-400">None identified.</p>
                  ) : (
                    <ul className="list-disc space-y-0.5 pl-5 text-sm text-[#1E293B]">
                      {pricingItems.map((t, i) => (
                        <li key={i} id={`erp-step2-pricing-${i + 1}`}>
                          {t}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </div>

            <div className="border-b border-slate-100 pb-3">
              <section id="erp-step2-card-code-upgrade">
                <h3 className={sectionHeading}>Code / upgrade gaps</h3>
                <div className="py-2">
                  {!analysis.codeUpgradeGaps.length ? (
                    <p className="text-sm italic text-slate-400">None identified.</p>
                  ) : (
                    <ul className="list-disc space-y-0.5 pl-5 text-sm text-[#1E293B]">
                      {codeItems.map((t, i) => (
                        <li key={i} id={`erp-step2-code-${i + 1}`}>
                          {t}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </div>

            <div className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
              <section id="erp-step2-card-op">
                <h3 className={sectionHeading}>OP / supplement findings</h3>
                <div className="py-2">
                  {!analysis.opFindings.length ? (
                    <p className="text-sm italic text-slate-400">None identified.</p>
                  ) : (
                    <ul className="list-disc space-y-0.5 pl-5 text-sm text-[#1E293B]">
                      {opItems.map((t, i) => (
                        <li key={i} id={`erp-step2-op-${i + 1}`}>
                          {t}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-0">
          <section
            id="erp-step2-section-dispute-angles"
            className="border-b border-slate-100 pb-3"
          >
            <h3 className={sectionHeading}>Dispute angles</h3>
            <div className="py-2">
              {!analysis.disputeAngles.length ? (
                <p className="text-sm italic text-slate-400">None listed.</p>
              ) : (
                <ul className="list-disc space-y-0.5 pl-5 text-sm text-[#1E293B]">
                  {angleItems.map((t, i) => (
                    <li key={i} id={`erp-step2-angle-${i + 1}`}>
                      {t}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section
            id="erp-step2-section-action-items"
            className="border-b border-slate-100 pb-3"
          >
            <h3 className={sectionHeading}>Action items</h3>
            {!analysis.actionItems.length ? (
              <p className="py-2 text-sm italic text-slate-400">None listed.</p>
            ) : (
              <ul className="space-y-0.5 py-2 text-sm text-[#1E293B]">
                {actionItems.map((t, i) => (
                  <li key={i} id={`erp-step2-action-${i + 1}`} className="flex gap-2">
                    <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section
            id="erp-step2-section-required-docs"
            className="border-b border-slate-100 pb-3"
          >
            <h3 className={sectionHeading}>Required documents</h3>
            <div className="py-2">
              {!analysis.requiredDocuments.length ? (
                <p className="text-sm italic text-slate-400">None listed.</p>
              ) : (
                <ul className="list-disc space-y-0.5 pl-5 text-sm text-[#1E293B]">
                  {docItems.map((t, i) => (
                    <li key={i} id={`erp-step2-doc-${i + 1}`}>
                      {t}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section
            id="erp-step2-section-escalation"
            className="border-b border-slate-100 pb-3"
          >
            <h3 className={sectionHeading}>Escalation options</h3>
            <div className="py-2">
              {!analysis.escalationOptions.length ? (
                <p className="text-sm italic text-slate-400">None listed.</p>
              ) : (
                <ul className="list-disc space-y-0.5 pl-5 text-sm text-[#1E293B]">
                  {escalationItems.map((t, i) => (
                    <li key={i} id={`erp-step2-escalation-${i + 1}`}>
                      {t}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="pb-2 pt-2">
            <h3 className={sectionHeading}>Recommended strategy</h3>
            <p className="py-2 text-sm text-[#1E293B]">
              {analysis.recommendedStrategy
                ? formatStrategyLabel(analysis.recommendedStrategy)
                : "—"}
            </p>
            <h3 className={`${sectionHeading} mt-3`}>Available strategies</h3>
            <p className="py-2 text-sm text-[#1E293B]">
              {analysis.availableStrategies.length > 0
                ? analysis.availableStrategies.map(formatStrategyLabel).join(", ")
                : "—"}
            </p>
          </section>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-4 border-t border-slate-200 pt-6">
        <button
          id="erp-step2-back"
          type="button"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#475569] hover:bg-slate-50"
          onClick={onBack}
        >
          Back
        </button>
        <button
          id="erp-step2-next"
          type="button"
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          onClick={onNext}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
