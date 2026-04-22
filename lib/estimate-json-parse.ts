/**
 * Shared parsers for estimate analysis/comparison JSON (server + client).
 */

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

export function parseComparisonResult(
  raw: unknown
): ComparisonResult | null {
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
