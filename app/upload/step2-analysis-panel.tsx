"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { netlifyFunctionUrl } from "@/lib/netlify-function-url";
import { wizardFetch } from "@/lib/supabaseClient";

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

export type VersionDiffResult = {
  previousVersion: string;
  currentVersion: string;
  added: Array<{ description: string; amount: number }>;
  removed: Array<{ description: string; amount: number }>;
  changed: Array<{
    description: string;
    previousAmount: number;
    currentAmount: number;
    delta: number;
  }>;
  netChange: number;
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
  versionDiff?: VersionDiffResult;
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
  let versionDiff: VersionDiffResult | undefined;
  const vdRaw = raw.versionDiff;
  if (isRecord(vdRaw)) {
    const mapAR = (arr: unknown) => {
      if (!Array.isArray(arr)) return [];
      return arr.map((row) => {
        const r = isRecord(row) ? row : {};
        return {
          description: String(r.description ?? ""),
          amount: Number(r.amount) || 0,
        };
      });
    };
    const changedArr = Array.isArray(vdRaw.changed) ? vdRaw.changed : [];
    const changed = changedArr.map((row) => {
      const r = isRecord(row) ? row : {};
      const pa = Number(r.previousAmount) || 0;
      const ca = Number(r.currentAmount) || 0;
      const delta = Number.isFinite(Number(r.delta))
        ? Number(r.delta)
        : ca - pa;
      return {
        description: String(r.description ?? ""),
        previousAmount: pa,
        currentAmount: ca,
        delta,
      };
    });
    versionDiff = {
      previousVersion: String(vdRaw.previousVersion ?? ""),
      currentVersion: String(vdRaw.currentVersion ?? ""),
      added: mapAR(vdRaw.added),
      removed: mapAR(vdRaw.removed),
      changed,
      netChange: Number(vdRaw.netChange) || 0,
    };
  }
  return {
    mode,
    lineItems,
    totalCarrier: Number(raw.totalCarrier) || 0,
    totalContractor: Number(raw.totalContractor) || 0,
    totalDelta: Number(raw.totalDelta) || 0,
    ...(versionDiff ? { versionDiff } : {}),
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

function riskBadgeClass(_risk: AnalysisResult["riskLevel"]): string {
  return "border-transparent bg-[#f0a050] text-white";
}

type Props = {
  analysis: AnalysisResult | null;
  comparison: ComparisonResult | null;
  onBack: () => void;
  onNext: () => void;
  announce: (message: string) => void;
};

const STEP2_ACTIONS_KEY = "erp_actions_step2";

const ERP_WHITE_FINDING_PANEL =
  "rounded-[10px] border-[0.5px] border-[#e0e0dc] bg-white px-4 py-3";
const ERP_WHITE_ACTION_PANEL =
  "rounded-[10px] border-[0.5px] border-[#e0e0dc] border-l-[3px] border-l-[#f0a050] bg-white px-4 py-3";

export function Step2AnalysisPanel({
  analysis,
  comparison,
  onBack,
  onNext,
  announce,
}: Props) {
  const [checkedActions, setCheckedActions] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!analysis?.actionItems?.length) {
      setCheckedActions(new Set());
      return;
    }
    try {
      const raw = localStorage.getItem(STEP2_ACTIONS_KEY);
      if (!raw) {
        setCheckedActions(new Set());
        return;
      }
      const arr = JSON.parse(raw) as number[];
      const len = analysis.actionItems.length;
      setCheckedActions(
        new Set(arr.filter((i) => Number.isInteger(i) && i >= 0 && i < len))
      );
    } catch {
      setCheckedActions(new Set());
    }
  }, [analysis]);

  useEffect(() => {
    if (!analysis?.actionItems?.length) return;
    localStorage.setItem(
      STEP2_ACTIONS_KEY,
      JSON.stringify([...checkedActions].sort((a, b) => a - b))
    );
  }, [checkedActions, analysis]);

  const toggleActionItem = useCallback((index: number) => {
    setCheckedActions((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const downloadPdf = useCallback(async () => {
    const root = document.getElementById("erp-step2-print-root");
    if (!root) {
      announce("Download failed: missing print region.");
      return;
    }
    const text = root.innerText;
    const res = await wizardFetch(netlifyFunctionUrl("generate-pdf"), {
      method: "POST",
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
  }, [announce]);

  const downloadWord = useCallback(async () => {
    const root = document.getElementById("erp-step2-print-root");
    if (!root) {
      announce("Download failed: missing print region.");
      return;
    }
    const text = root.innerText;
    const res = await wizardFetch(netlifyFunctionUrl("generate-docx"), {
      method: "POST",
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
  }, [announce]);

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
      <div className="text-[#7a8a9a]">
        <p className="text-sm">
          No analysis loaded. Go back to Step 1 and run Continue to generate
          analysis.
        </p>
        <div className="mt-6">
          <button
            id="erp-step2-back"
            type="button"
            className="erp-btn-ghost-panel"
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
    gapDollars > 0
      ? "text-[22px] font-medium text-[#b83030]"
      : "text-[22px] font-medium text-[#9a9a94]";

  const sectionHeading =
    "mb-2 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#1a2a3a] border-b-[0.5px] border-[#ebebea] pb-2";

  return (
    <div className="text-[#2a3a4a]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="text-2xl font-bold text-[#1a2a3a]">Step 2 — Analysis</h2>
        <div
          id="erp-step2-badge-risk"
          className={`inline-flex shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold ${riskBadgeClass(analysis.riskLevel)}`}
        >
          {`Risk level: ${analysis.riskLevel.charAt(0).toUpperCase()}${analysis.riskLevel.slice(1)}`}
        </div>
      </div>
      <p className="mt-2 text-sm text-[#7a8a9a]">
        Structured findings from the carrier estimate.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          id="erp-step2-download-analysis-pdf"
          type="button"
          className="erp-btn-ghost-panel"
          onClick={() => void downloadPdf()}
        >
          Download PDF
        </button>
        <button
          id="erp-step2-download-analysis-word"
          type="button"
          className="erp-btn-ghost-panel"
          onClick={() => void downloadWord()}
        >
          Download Word
        </button>
      </div>

      <div
        id="erp-step2-print-root"
        className="mt-8 border-t-[0.5px] border-[#ebebea] pt-8 text-[#2a3a4a]"
      >
        <p className="text-sm font-semibold text-[#7a8a9a]">
          Estimate Review Pro — Analysis Summary
        </p>
        <p className="mt-1 text-sm text-[#7a8a9a]">
          Risk level:{" "}
          {`${analysis.riskLevel.charAt(0).toUpperCase()}${analysis.riskLevel.slice(1)}`}
        </p>

        {comparison && (
          <div className="mt-4 border-b border-[#ebebea] pb-3 text-sm text-[#2a3a4a]">
            <div className={ERP_WHITE_FINDING_PANEL}>
              <h3 className={sectionHeading}>Comparison</h3>
              <p className="py-2 text-sm text-[#7a8a9a]">
                {comparisonSummaryLine(comparison)}
              </p>
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <section id="erp-step2-card-gap" className="flex flex-col gap-3">
              <h3 className={sectionHeading}>Carrier vs true loss range</h3>
              <div className="rounded-r-[10px] border-[0.5px] border-[#e0e0dc] border-l-[3px] border-l-[#f0a050] bg-white py-3 pl-4 pr-3">
                <div className="space-y-4">
                  <div>
                    <p className="text-[22px] font-medium text-[#1a2a3a]">
                      {formatMoney(analysis.carrierAmount)}
                    </p>
                    <p className="text-xs text-[#7a8a9a]">Carrier amount</p>
                  </div>
                  <div>
                    <p className="text-[22px] font-medium text-[#1a2a3a]">
                      {formatMoney(analysis.trueLossRange.low)} –{" "}
                      {formatMoney(analysis.trueLossRange.high)}
                    </p>
                    <p className="text-xs text-[#7a8a9a]">True loss range</p>
                  </div>
                </div>
              </div>
              <div className="rounded-r-[10px] border-[0.5px] border-[#e0e0dc] border-l-[3px] border-l-[#b83030] bg-white py-3 pl-4 pr-3">
                <div>
                  <p className={gapNumberClass}>{gapDisplay}</p>
                  <p className="text-xs text-[#7a8a9a]">Estimated gap</p>
                </div>
              </div>
            </section>

            <section id="erp-step2-card-procedural" className="text-sm">
              <h3 className={sectionHeading}>Procedural defects</h3>
              <div className={`${ERP_WHITE_FINDING_PANEL} mt-1`}>
                {analysis.proceduralDefects.length === 0 ? (
                  <p className="text-sm italic text-[#7a8a9a]">None identified.</p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {procItems.map((t, i) => (
                      <li
                        key={i}
                        id={`erp-step2-proc-${i + 1}`}
                        className="flex gap-2 text-sm text-[#2a3a4a]"
                      >
                        <span
                          className="erp-find-dot erp-find-dot-red"
                          aria-hidden
                        />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>

          <div className="flex flex-col gap-0">
            <div className="border-b border-[#ebebea] pb-3">
              <section id="erp-step2-card-scope-omissions">
                <h3 className={sectionHeading}>Scope omissions</h3>
                <div className={`${ERP_WHITE_FINDING_PANEL} mt-1`}>
                  {!analysis.scopeOmissions.length ? (
                    <p className="text-sm italic text-[#7a8a9a]">None identified.</p>
                  ) : (
                    <ul className="flex flex-col gap-1.5">
                      {omissionItems.map((t, i) => (
                        <li
                          key={i}
                          id={`erp-step2-omission-${i + 1}`}
                          className="flex gap-2 text-sm text-[#2a3a4a]"
                        >
                          <span
                            className="erp-find-dot erp-find-dot-amber"
                            aria-hidden
                          />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </div>

            <div className="border-b border-[#ebebea] pb-3">
              <section id="erp-step2-card-pricing">
                <h3 className={sectionHeading}>Pricing flags</h3>
                <div className={`${ERP_WHITE_FINDING_PANEL} mt-1`}>
                  {!analysis.pricingFlags.length ? (
                    <p className="text-sm italic text-[#7a8a9a]">None identified.</p>
                  ) : (
                    <ul className="flex flex-col gap-1.5">
                      {pricingItems.map((t, i) => (
                        <li
                          key={i}
                          id={`erp-step2-pricing-${i + 1}`}
                          className="flex gap-2 text-sm text-[#2a3a4a]"
                        >
                          <span
                            className="erp-find-dot erp-find-dot-amber"
                            aria-hidden
                          />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </div>

            <div className="border-b border-[#ebebea] pb-3">
              <section id="erp-step2-card-code-upgrade">
                <h3 className={sectionHeading}>Code / upgrade gaps</h3>
                <div className={`${ERP_WHITE_FINDING_PANEL} mt-1`}>
                  {!analysis.codeUpgradeGaps.length ? (
                    <p className="text-sm italic text-[#7a8a9a]">None identified.</p>
                  ) : (
                    <ul className="flex flex-col gap-1.5">
                      {codeItems.map((t, i) => (
                        <li
                          key={i}
                          id={`erp-step2-code-${i + 1}`}
                          className="flex gap-2 text-sm text-[#2a3a4a]"
                        >
                          <span
                            className="erp-find-dot erp-find-dot-navy"
                            aria-hidden
                          />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </div>

            <div className="border-b border-[#ebebea] pb-3 last:border-0 last:pb-0">
              <section id="erp-step2-card-op">
                <h3 className={sectionHeading}>OP / supplement findings</h3>
                <div className={`${ERP_WHITE_FINDING_PANEL} mt-1`}>
                  {!analysis.opFindings.length ? (
                    <p className="text-sm italic text-[#7a8a9a]">None identified.</p>
                  ) : (
                    <ul className="flex flex-col gap-1.5">
                      {opItems.map((t, i) => (
                        <li
                          key={i}
                          id={`erp-step2-op-${i + 1}`}
                          className="flex gap-2 text-sm text-[#2a3a4a]"
                        >
                          <span
                            className="erp-find-dot erp-find-dot-navy"
                            aria-hidden
                          />
                          <span>{t}</span>
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
            className="border-b border-[#ebebea] pb-3"
          >
            <h3 className={sectionHeading}>Dispute angles</h3>
            <div className={`${ERP_WHITE_FINDING_PANEL} mt-1`}>
              {!analysis.disputeAngles.length ? (
                <p className="text-sm italic text-[#7a8a9a]">None listed.</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {angleItems.map((t, i) => (
                    <li
                      key={i}
                      id={`erp-step2-angle-${i + 1}`}
                      className="flex gap-2 text-sm text-[#2a3a4a]"
                    >
                      <span
                        className="erp-find-dot erp-find-dot-red"
                        aria-hidden
                      />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section
            id="erp-step2-section-action-items"
            className="border-b border-[#ebebea] pb-3"
          >
            <h3 className={sectionHeading}>Action items</h3>
            <div className={`${ERP_WHITE_ACTION_PANEL} mt-1`}>
              {!analysis.actionItems.length ? (
                <p className="text-sm italic text-[#7a8a9a]">None listed.</p>
              ) : (
                <ul className="flex flex-col gap-1.5 text-sm text-[#2a3a4a]">
                  {actionItems.map((t, i) => (
                    <li key={i} id={`erp-step2-action-${i + 1}`} className="flex gap-2">
                      <input
                        type="checkbox"
                        className="erp-action-check"
                        checked={checkedActions.has(i)}
                        onChange={() => toggleActionItem(i)}
                        aria-labelledby={`erp-step2-action-label-${i + 1}`}
                      />
                      <span id={`erp-step2-action-label-${i + 1}`}>{t}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section
            id="erp-step2-section-required-docs"
            className="border-b border-[#ebebea] pb-3"
          >
            <h3 className={sectionHeading}>Required documents</h3>
            <div className={`${ERP_WHITE_FINDING_PANEL} mt-1`}>
              {!analysis.requiredDocuments.length ? (
                <p className="text-sm italic text-[#7a8a9a]">None listed.</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {docItems.map((t, i) => (
                    <li
                      key={i}
                      id={`erp-step2-doc-${i + 1}`}
                      className="flex gap-2 text-sm text-[#2a3a4a]"
                    >
                      <span
                        className="erp-find-dot erp-find-dot-navy"
                        aria-hidden
                      />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section
            id="erp-step2-section-escalation"
            className="border-b border-[#ebebea] pb-3"
          >
            <h3 className={sectionHeading}>Escalation options</h3>
            <div className={`${ERP_WHITE_FINDING_PANEL} mt-1`}>
              {!analysis.escalationOptions.length ? (
                <p className="text-sm italic text-[#7a8a9a]">None listed.</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {escalationItems.map((t, i) => (
                    <li
                      key={i}
                      id={`erp-step2-escalation-${i + 1}`}
                      className="flex gap-2 text-sm text-[#2a3a4a]"
                    >
                      <span
                        className="erp-find-dot erp-find-dot-navy"
                        aria-hidden
                      />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="pb-2 pt-2">
            <div className="w-full rounded-[10px] border border-[#1e3f6e] bg-[#0a1e38] px-[18px] py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[#6a9ac0]">
                Recommended strategy
              </p>
              <p className="mt-2 text-base font-semibold text-white">
                {analysis.recommendedStrategy
                  ? formatStrategyLabel(analysis.recommendedStrategy)
                  : "—"}
              </p>
              <p className="mt-2 text-[13px] leading-snug text-[#8aacc8]">
                {analysis.availableStrategies.length > 0
                  ? `Also consider: ${analysis.availableStrategies.map(formatStrategyLabel).join(", ")}.`
                  : "No additional strategies listed."}
              </p>
              {analysis.recommendedStrategy ? (
                <div className="mt-3 inline-flex rounded-md bg-[#f0a050] px-3 py-1 text-xs font-semibold text-white">
                  {formatStrategyLabel(analysis.recommendedStrategy)}
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-4 border-t-[0.5px] border-[#1e3f6e] pt-6">
        <button
          id="erp-step2-back"
          type="button"
          className="erp-btn-ghost-panel"
          onClick={onBack}
        >
          Back
        </button>
        <button
          id="erp-step2-next"
          type="button"
          className="erp-btn-cta"
          onClick={onNext}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
