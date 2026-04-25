/**
 * Plain-text builders for review PDF / DOCX exports (dashboard + wizard parity).
 */
import type { AnalysisResult, ComparisonResult } from "./estimate-json-parse";

const STRATEGY_LABELS: Record<string, string> = {
  FULL_SUPPLEMENT_DEMAND: "Full Supplement Demand",
  PARTIAL_DISPUTE: "Partial Dispute",
  DEMAND_REINSPECTION: "Demand Reinspection",
  INVOKE_APPRAISAL: "Invoke Appraisal",
  OTHER_CUSTOM: "Custom Strategy",
};

export function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
}

function listSection(title: string, items: string[], empty: string): string {
  const lines: string[] = [title, ""];
  if (items.length === 0) {
    lines.push(empty, "");
    return lines.join("\n");
  }
  for (const item of items) {
    lines.push(`• ${item}`);
  }
  lines.push("");
  return lines.join("\n");
}

export function buildAnalysisExportPlainText(
  analysis: AnalysisResult
): string {
  const rec = analysis.recommendedStrategy
    ? STRATEGY_LABELS[analysis.recommendedStrategy] ?? analysis.recommendedStrategy
    : "—";
  const mid = (analysis.trueLossRange.low + analysis.trueLossRange.high) / 2;
  const gap = mid - analysis.carrierAmount;
  const gapLabel =
    gap > 0 ? formatMoney(gap) : "Within carrier range / not above midpoint";

  const parts: string[] = [
    "Estimate Review Pro — Analysis",
    "",
    `Risk level: ${analysis.riskLevel}`,
    "",
    "Carrier amount",
    formatMoney(analysis.carrierAmount),
    "",
    "True loss range (low – high)",
    `${formatMoney(analysis.trueLossRange.low)} – ${formatMoney(analysis.trueLossRange.high)}`,
    "",
    "Estimated gap (midpoint vs carrier, informational)",
    gapLabel,
    "",
    `Recommended strategy: ${rec}`,
    "",
  ];

  parts.push(
    listSection(
      "Scope omissions",
      analysis.scopeOmissions,
      "None listed."
    )
  );
  parts.push(
    listSection("Pricing flags", analysis.pricingFlags, "None listed.")
  );
  parts.push(
    listSection("Code upgrade gaps", analysis.codeUpgradeGaps, "None listed.")
  );
  parts.push(
    listSection("O&P findings", analysis.opFindings, "None listed.")
  );
  parts.push(
    listSection("Procedural defects", analysis.proceduralDefects, "None listed.")
  );
  parts.push(
    listSection("Dispute angles", analysis.disputeAngles, "None listed.")
  );
  parts.push(
    listSection("Action items", analysis.actionItems, "None listed.")
  );
  parts.push(
    listSection("Required documents", analysis.requiredDocuments, "None listed.")
  );
  parts.push(
    listSection("Escalation options", analysis.escalationOptions, "None listed.")
  );
  if (analysis.availableStrategies.length > 0) {
    parts.push("Available strategies");
    for (const s of analysis.availableStrategies) {
      parts.push(`• ${STRATEGY_LABELS[s] ?? s}`);
    }
    parts.push("");
  }

  return parts.join("\n").trim() + "\n";
}

export function buildComparisonExportPlainText(
  comparison: ComparisonResult
): string {
  const parts: string[] = [
    "Comparison",
    "",
    `Mode: ${comparison.mode}`,
    "",
    `Carrier total: ${formatMoney(comparison.totalCarrier)}`,
    `Other total: ${formatMoney(comparison.totalContractor)}`,
    `Delta: ${formatMoney(comparison.totalDelta)}`,
    "",
  ];
  if (comparison.lineItems.length > 0) {
    parts.push("Line items", "");
    for (const row of comparison.lineItems) {
      parts.push(
        [
          `Trade: ${row.trade}`,
          `  Carrier: ${row.carrierItem} — ${formatMoney(row.carrierAmount)}`,
          `  Other: ${row.contractorItem} — ${formatMoney(row.contractorAmount)}`,
          `  Delta: ${formatMoney(row.delta)}${row.flagged ? " (flagged)" : ""}`,
          `  Note: ${row.reason}`,
          "",
        ].join("\n")
      );
    }
  } else {
    parts.push("No line items in comparison.", "");
  }
  if (comparison.versionDiff) {
    const vd = comparison.versionDiff;
    parts.push(
      "Version change",
      `${vd.previousVersion} → ${vd.currentVersion} (net ${formatMoney(vd.netChange)})`,
      ""
    );
  }
  return parts.join("\n").trim() + "\n";
}

/** Alias for review exports; same as `buildComparisonExportPlainText`. */
export { buildComparisonExportPlainText as buildComparisonPlainText };

function summaryDataToPlainText(data: unknown, indent: string): string {
  if (data === null || data === undefined) return `${indent}—\n`;
  if (typeof data === "string")
    return data
      .split("\n")
      .map((l) => (l ? `${indent}${l}` : ""))
      .join("\n")
      .concat("\n");
  if (typeof data === "number" || typeof data === "boolean")
    return `${indent}${String(data)}\n`;
  if (Array.isArray(data)) {
    if (data.length === 0) return `${indent}—\n`;
    return (
      data
        .map((item) => {
          const inner = summaryDataToPlainText(item, indent + "  ").trimEnd();
          return `${indent}• ${inner}`;
        })
        .join("\n") + "\n"
    );
  }
  if (typeof data === "object") {
    const o = data as Record<string, unknown>;
    const lines: string[] = [];
    for (const [k, v] of Object.entries(o)) {
      const label = k
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      lines.push(`${indent}${label}:`);
      lines.push(summaryDataToPlainText(v, indent + "  "));
    }
    return lines.join("");
  }
  return `${indent}${String(data)}\n`;
}

export function buildSummaryExportPlainText(summaryJson: unknown): string {
  if (summaryJson === null || summaryJson === undefined) {
    return "Summary\n\n—\n";
  }
  return `Summary\n\n${summaryDataToPlainText(summaryJson, "").trim()}\n`;
}

export function rawJsonExportPlainText(label: string, raw: unknown): string {
  return `${label}\n\n${JSON.stringify(raw, null, 2)}\n`;
}

export function buildFullReportPlainText(parts: {
  reportTitle: string;
  createdLabel: string;
  analysisText: string;
  comparisonText: string | null;
  summaryText: string | null;
  /** Single letter block (e.g. legacy export) when on-file / new are not set */
  letterText?: string | null;
  letterOnFileText?: string | null;
  newLetterText?: string | null;
}): string {
  const {
    reportTitle,
    createdLabel,
    analysisText,
    comparisonText,
    summaryText,
    letterText,
    letterOnFileText,
    newLetterText,
  } = parts;
  const out: string[] = [
    "Estimate Review Pro - Full Report",
    "",
    `Title: ${reportTitle}`,
    `Created: ${createdLabel}`,
    "",
    "=".repeat(60),
    "",
  ];
  out.push("ANALYSIS", "-".repeat(40), "", analysisText.trim(), "", "");
  if (comparisonText) {
    out.push("COMPARISON", "-".repeat(40), "", comparisonText.trim(), "", "");
  }
  if (summaryText) {
    out.push("SUMMARY", "-".repeat(40), "", summaryText.trim(), "", "");
  }
  const onFile = letterOnFileText?.trim() ?? null;
  const newL = newLetterText?.trim() ?? null;
  if (onFile || newL) {
    if (onFile) {
      out.push(
        "LETTER ON FILE",
        "-".repeat(40),
        "",
        onFile,
        ""
      );
    }
    if (newL) {
      out.push(
        "NEW LETTER (REGENERATED)",
        "-".repeat(40),
        "",
        newL,
        ""
      );
    }
  } else if (letterText?.trim()) {
    out.push("LETTER", "-".repeat(40), "", letterText.trim(), "", "");
  }
  return out.join("\n").trim() + "\n";
}
