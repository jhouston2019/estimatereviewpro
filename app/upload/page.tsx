"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  Suspense,
} from "react";
import { useSearchParams } from "next/navigation";
import { netlifyFunctionUrl } from "@/lib/netlify-function-url";
import {
  Step2AnalysisPanel,
  parseAnalysisResult,
  parseComparisonResult,
  type AnalysisResult,
  type ComparisonResult,
} from "./step2-analysis-panel";
import { Step3ComparisonPanel } from "./step3-comparison-panel";
import { Step4StrategyPanel } from "./step4-strategy-panel";
import { Step5SummaryPanel } from "./step5-summary-panel";
import {
  Step6LetterPanel,
  applyPlaceholdersToLetter,
  emptyLetterPlaceholders,
  letterPlaceholdersFromClaimMeta,
  type LetterPlaceholderFields,
} from "./step6-letter-panel";

const US_STATES: { code: string; name: string }[] = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

type ClaimDocumentSide =
  | "CARRIER"
  | "CONTRACTOR"
  | "PUBLIC_ADJUSTER"
  | "MITIGATION"
  | "OTHER";

type ClaimDocumentCategory =
  | "BUILDING"
  | "CONTENTS"
  | "ALE"
  | "MITIGATION"
  | "OTHER";

type ClaimDocumentVersion =
  | "ORIGINAL"
  | "SUPPLEMENT_1"
  | "SUPPLEMENT_2"
  | "SUPPLEMENT_3"
  | "REVISED"
  | "FINAL";

interface ClaimDocument {
  id: string;
  extractedText: string;
  extractStatus: "idle" | "extracting" | "done" | "error";
  side: ClaimDocumentSide;
  category: ClaimDocumentCategory;
  version: ClaimDocumentVersion;
  label: string;
  autoDetected: boolean;
  /** When false, label is auto-updated from side/category/version. */
  labelLocked?: boolean;
}

const SIDE_OPTIONS: { value: ClaimDocumentSide; label: string }[] = [
  { value: "CARRIER", label: "Carrier" },
  { value: "CONTRACTOR", label: "Contractor" },
  { value: "PUBLIC_ADJUSTER", label: "Public Adjuster" },
  { value: "MITIGATION", label: "Mitigation" },
  { value: "OTHER", label: "Other" },
];

const CATEGORY_OPTIONS: { value: ClaimDocumentCategory; label: string }[] = [
  { value: "BUILDING", label: "Building" },
  { value: "CONTENTS", label: "Contents" },
  { value: "ALE", label: "ALE" },
  { value: "MITIGATION", label: "Mitigation" },
  { value: "OTHER", label: "Other" },
];

const VERSION_OPTIONS: { value: ClaimDocumentVersion; label: string }[] = [
  { value: "ORIGINAL", label: "Original" },
  { value: "SUPPLEMENT_1", label: "Supplement 1" },
  { value: "SUPPLEMENT_2", label: "Supplement 2" },
  { value: "SUPPLEMENT_3", label: "Supplement 3" },
  { value: "REVISED", label: "Revised" },
  { value: "FINAL", label: "Final" },
];

function autoDetectCategory(text: string): ClaimDocumentCategory {
  const t = text.toLowerCase();
  if (
    /contents|personal property|furniture|appliance|clothing|electronics/.test(
      t
    )
  ) {
    return "CONTENTS";
  }
  if (
    /additional living|ale|loss of use|hotel|temporary housing/.test(t)
  ) {
    return "ALE";
  }
  if (
    /mitigation|water extraction|drying|dehumidif|mold remediation/.test(t)
  ) {
    return "MITIGATION";
  }
  return "BUILDING";
}

function buildDefaultLabel(
  side: ClaimDocumentSide,
  category: ClaimDocumentCategory,
  version: ClaimDocumentVersion
): string {
  const s = SIDE_OPTIONS.find((o) => o.value === side)?.label ?? side;
  const c = CATEGORY_OPTIONS.find((o) => o.value === category)?.label ?? category;
  const v = VERSION_OPTIONS.find((o) => o.value === version)?.label ?? version;
  return `${s} ${c} ${v}`;
}

function createClaimDocument(slotIndex: number): ClaimDocument {
  const side: ClaimDocumentSide = slotIndex === 0 ? "CARRIER" : "CONTRACTOR";
  const category: ClaimDocumentCategory = "BUILDING";
  const version: ClaimDocumentVersion = "ORIGINAL";
  return {
    id: crypto.randomUUID(),
    extractedText: "",
    extractStatus: "idle",
    side,
    category,
    version,
    label: buildDefaultLabel(side, category, version),
    autoDetected: false,
    labelLocked: false,
  };
}

function categoriesInDocumentOrder(documents: ClaimDocument[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const d of documents) {
    if (!seen.has(d.category)) {
      seen.add(d.category);
      out.push(d.category);
    }
  }
  return out;
}

type WizardState = {
  accessToken: string;
  carrierText: string | null;
  contractorText: string | null;
  documents: ClaimDocument[];
  analyses: Record<string, AnalysisResult>;
  comparisons: Record<string, ComparisonResult>;
  strategies: Record<string, string>;
  fileBase64: string | null;
  claimMeta: {
    insuredName: string;
    carrierName: string;
    claimType: string;
    state: string;
    policyNumber: string;
    claimNumber: string;
    dateOfLoss: string;
    adjusterName: string;
    disputedAmount: string;
    responseDeadline: string;
  };
  analysis: AnalysisResult | null;
  comparison: ComparisonResult | null;
  strategy: string | null;
  letterType: string | null;
  letterRaw: string | null;
  letterPlaceholders: LetterPlaceholderFields;
  prefillApplied: boolean;
};

function deriveLegacyFields(
  s: WizardState
): Pick<
  WizardState,
  "carrierText" | "contractorText" | "analysis" | "comparison" | "strategy"
> {
  const carrierParts: string[] = [];
  const contractorParts: string[] = [];
  for (const d of s.documents) {
    const t = d.extractedText.trim();
    if (!t) continue;
    if (d.side === "CARRIER") carrierParts.push(t);
    else contractorParts.push(t);
  }
  const carrierText = carrierParts.length
    ? carrierParts.join("\n\n---\n\n")
    : null;
  const contractorText = contractorParts.length
    ? contractorParts.join("\n\n---\n\n")
    : null;
  const order = categoriesInDocumentOrder(s.documents);
  let analysis: AnalysisResult | null = null;
  let comparison: ComparisonResult | null = null;
  let strategy: string | null = null;
  for (const c of order) {
    if (!analysis && s.analyses[c]) analysis = s.analyses[c] ?? null;
    if (!comparison && s.comparisons[c]) comparison = s.comparisons[c] ?? null;
    if (!strategy && s.strategies[c]) strategy = s.strategies[c] ?? null;
  }
  if (!strategy) {
    const vals = Object.values(s.strategies);
    strategy = vals[0] ?? null;
  }
  return { carrierText, contractorText, analysis, comparison, strategy };
}

function withDerived(
  prev: WizardState,
  patch: Partial<WizardState>
): WizardState {
  const next = { ...prev, ...patch };
  return { ...next, ...deriveLegacyFields(next) };
}

function extractStatusMessage(doc: ClaimDocument): string {
  if (doc.extractStatus === "extracting") return "Reading file…";
  if (doc.extractStatus === "error") return "Could not read file.";
  if (doc.extractStatus === "done") return "Text ready.";
  if (doc.extractedText.trim()) return "Ready.";
  return "Add estimate text (paste or .txt file). PDF and images require pasting text below.";
}

const initialWizardState = (): WizardState => {
  const base: WizardState = {
    accessToken: "bypass",
    carrierText: null,
    contractorText: null,
    documents: [createClaimDocument(0)],
    analyses: {},
    comparisons: {},
    strategies: {},
    fileBase64: null,
    claimMeta: {
      insuredName: "",
      carrierName: "",
      claimType: "",
      state: "",
      policyNumber: "",
      claimNumber: "",
      dateOfLoss: "",
      adjusterName: "",
      disputedAmount: "",
      responseDeadline: "",
    },
    analysis: null,
    comparison: null,
    strategy: null,
    letterType: null,
    letterRaw: null,
    letterPlaceholders: emptyLetterPlaceholders(),
    prefillApplied: false,
  };
  return { ...base, ...deriveLegacyFields(base) };
};

function normalizeDisputedAmount(raw: string): string {
  return raw.replace(/\$/g, "").replace(/,/g, "").replace(/\s/g, "").trim();
}

function getDocumentText(carrierText: string | null): string {
  return (carrierText ?? "").trim();
}

/** Matches Step 1 file accept list (PDF, images, .txt). */
function isStep1AcceptedEstimateFile(file: File): boolean {
  const n = file.name.toLowerCase();
  if (file.type === "text/plain" || n.endsWith(".txt")) return true;
  if (n.endsWith(".pdf") || file.type === "application/pdf") return true;
  if (/\.(png|jpg|jpeg|webp)$/i.test(n)) return true;
  if (file.type.startsWith("image/")) return true;
  return false;
}

function PaymentSuccessHandler({ onSuccess }: { onSuccess: (success: boolean) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    const handlePaymentSuccess = async () => {
      if (searchParams?.get("payment") === "success") {
        const sessionId = searchParams.get("session_id");
        if (sessionId) {
          try {
            const response = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sessionId }),
            });
            const data = await response.json();
            if (data.success && data.loginUrl) {
              window.location.href = data.loginUrl;
              return;
            }
          } catch {
            /* ignore */
          }
        }
        onSuccess(true);
        setTimeout(() => onSuccess(false), 5000);
      }
    };
    handlePaymentSuccess();
  }, [searchParams, onSuccess]);
  return null;
}

function step1DocFileInputId(idx: number): string {
  if (idx === 0) return "erp-step1-carrier-file";
  if (idx === 1) return "erp-step1-contractor-file";
  return `erp-step1-doc-${idx}-file`;
}

function step1DocPasteId(idx: number): string {
  if (idx === 0) return "erp-step1-carrier-paste";
  if (idx === 1) return "erp-step1-contractor-paste";
  return `erp-step1-doc-${idx}-paste`;
}

function step1DocExtractStatusId(idx: number): string {
  if (idx === 0) return "erp-step1-carrier-extract-status";
  if (idx === 1) return "erp-step1-contractor-extract-status";
  return `erp-step1-doc-${idx}-extract-status`;
}

export default function UploadPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [state, setState] = useState<WizardState>(() => initialWizardState());
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [step6LetterLoading, setStep6LetterLoading] = useState(false);
  const [docDragOverIndex, setDocDragOverIndex] = useState<number | null>(
    null
  );
  const [showXactimateHelp, setShowXactimateHelp] = useState(false);
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const wizardStateRef = useRef(state);
  wizardStateRef.current = state;
  const step4StrategyAutoAppliedRef = useRef(false);

  const announce = useCallback((message: string) => {
    const el = liveRegionRef.current;
    if (el) {
      el.textContent = "";
      requestAnimationFrame(() => {
        el.textContent = message;
      });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key) {
        if (!cancelled) {
          setState((s) => ({
            ...s,
            accessToken: "bypass",
          }));
        }
        return;
      }
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(url, key);
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token ?? "bypass";
      if (!cancelled) {
        setState((s) => ({
          ...s,
          accessToken: token,
        }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const patchClaimMeta = useCallback(
    (partial: Partial<WizardState["claimMeta"]>) => {
      setState((s) => ({
        ...s,
        claimMeta: { ...s.claimMeta, ...partial },
      }));
    },
    []
  );

  const readDocumentFile = useCallback(
    async (docId: string, file: File | null) => {
      if (!file) return;
      setState((s) =>
        withDerived(s, {
          documents: s.documents.map((d) =>
            d.id === docId ? { ...d, extractStatus: "extracting" } : d
          ),
        })
      );
      try {
        if (
          file.type === "text/plain" ||
          file.name.toLowerCase().endsWith(".txt")
        ) {
          const text = await file.text();
          setState((s) => {
            const documents = s.documents.map((d) => {
              if (d.id !== docId) return d;
              const detected = autoDetectCategory(text);
              return {
                ...d,
                extractedText: text,
                extractStatus: "done" as const,
                category: detected,
                autoDetected: true,
                label: d.labelLocked
                  ? d.label
                  : buildDefaultLabel(d.side, detected, d.version),
              };
            });
            return withDerived(s, { documents });
          });
          announce("Document text loaded from file.");
          return;
        }
        setState((s) =>
          withDerived(s, {
            documents: s.documents.map((d) =>
              d.id === docId
                ? { ...d, extractStatus: "idle", extractedText: "" }
                : d
            ),
          })
        );
        announce("File accepted — paste estimate text below.");
      } catch {
        setState((s) =>
          withDerived(s, {
            documents: s.documents.map((d) =>
              d.id === docId ? { ...d, extractStatus: "error" } : d
            ),
          })
        );
        announce("Could not read file.");
      }
    },
    [announce]
  );

  const updateDocumentText = useCallback((docId: string, text: string) => {
    setState((s) => {
      const documents = s.documents.map((d) => {
        if (d.id !== docId) return d;
        const detected = autoDetectCategory(text);
        return {
          ...d,
          extractedText: text,
          extractStatus: text.trim() ? ("done" as const) : ("idle" as const),
          category: detected,
          autoDetected: true,
          label: d.labelLocked
            ? d.label
            : buildDefaultLabel(d.side, detected, d.version),
        };
      });
      return withDerived(s, { documents });
    });
  }, []);

  const updateDocumentSide = useCallback(
    (docId: string, side: ClaimDocumentSide) => {
      setState((s) => {
        const documents = s.documents.map((d) => {
          if (d.id !== docId) return d;
          return {
            ...d,
            side,
            label: d.labelLocked
              ? d.label
              : buildDefaultLabel(side, d.category, d.version),
          };
        });
        return withDerived(s, { documents });
      });
    },
    []
  );

  const updateDocumentCategory = useCallback(
    (docId: string, category: ClaimDocumentCategory) => {
      setState((s) => {
        const documents = s.documents.map((d) => {
          if (d.id !== docId) return d;
          return {
            ...d,
            category,
            autoDetected: false,
            label: d.labelLocked
              ? d.label
              : buildDefaultLabel(d.side, category, d.version),
          };
        });
        return withDerived(s, { documents });
      });
    },
    []
  );

  const updateDocumentVersion = useCallback(
    (docId: string, version: ClaimDocumentVersion) => {
      setState((s) => {
        const documents = s.documents.map((d) => {
          if (d.id !== docId) return d;
          return {
            ...d,
            version,
            label: d.labelLocked
              ? d.label
              : buildDefaultLabel(d.side, d.category, version),
          };
        });
        return withDerived(s, { documents });
      });
    },
    []
  );

  const updateDocumentLabel = useCallback((docId: string, label: string) => {
    setState((s) => {
      const documents = s.documents.map((d) =>
        d.id === docId ? { ...d, label, labelLocked: true } : d
      );
      return withDerived(s, { documents });
    });
  }, []);

  const addDocumentSlot = useCallback(() => {
    setState((s) => {
      if (s.documents.length >= 10) return s;
      return withDerived(s, {
        documents: [...s.documents, createClaimDocument(s.documents.length)],
      });
    });
  }, []);

  const removeDocumentSlot = useCallback((docId: string) => {
    setState((s) => {
      if (s.documents.length <= 1) return s;
      return withDerived(s, {
        documents: s.documents.filter((d) => d.id !== docId),
      });
    });
  }, []);

  const onLoadDemo = useCallback(() => {
    const demoText =
      "RCV Grand Total $18,200.00\nRemove damaged shingles 24 SQ  $3,200.00\nInstall shingles 24 SQ  $4,800.00\nDetach reset gutter 40 LF  $480.00\nFelt underlayment  $320.00\nRidge cap  $220.00\nDrip edge  $180.00\n";
    setState((s) => {
      const first = s.documents[0];
      const documents: ClaimDocument[] = [
        {
          ...(first ?? createClaimDocument(0)),
          id: first?.id ?? crypto.randomUUID(),
          extractedText: demoText,
          extractStatus: "done",
          side: "CARRIER",
          category: "BUILDING",
          version: "ORIGINAL",
          label: buildDefaultLabel("CARRIER", "BUILDING", "ORIGINAL"),
          autoDetected: false,
          labelLocked: false,
        },
      ];
      return withDerived(s, {
        documents,
        claimMeta: {
          insuredName: "Demo Insured",
          carrierName: "Demo Carrier Insurance",
          claimType: "property",
          state: "TX",
          policyNumber: "DEMO-POL-001",
          claimNumber: "DEMO-CLM-9921",
          dateOfLoss: "2024-05-10",
          adjusterName: "Demo Adjuster",
          disputedAmount: "18200.00",
          responseDeadline: "2026-05-01",
        },
        prefillApplied: false,
        letterType: null,
        letterRaw: null,
        analyses: {},
        comparisons: {},
        strategies: {},
      });
    });
    announce("Demo estimate and metadata loaded.");
  }, [announce]);

  const onResetStep1 = useCallback(() => {
    setState((s) => ({
      ...initialWizardState(),
      accessToken: s.accessToken,
    }));
    setSubmitError(null);
    announce("Step 1 cleared.");
  }, [announce]);

  const onSubmitStep1 = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitError(null);
      if (state.documents.length > 10) {
        setSubmitError("A maximum of 10 documents is allowed.");
        announce("Submit blocked: too many documents.");
        return;
      }
      const extracting = state.documents.some(
        (d) => d.extractStatus === "extracting"
      );
      if (extracting) {
        setSubmitError(
          "Waiting for document extraction to complete before continuing."
        );
        announce("Waiting for document extraction to complete.");
        return;
      }
      const emptyText = state.documents.some((d) => !d.extractedText.trim());
      if (emptyText) {
        setSubmitError(
          "Each document must have estimate text before continuing."
        );
        announce("Submit blocked: complete all documents with text.");
        return;
      }
      const hasCarrier = state.documents.some(
        (d) => d.side === "CARRIER" && d.extractedText.trim().length > 0
      );
      if (!hasCarrier) {
        setSubmitError(
          "At least one carrier-side document with text is required."
        );
        announce("Submit blocked: carrier document required.");
        return;
      }
      const documentText = getDocumentText(state.carrierText);
      if (!documentText) {
        setSubmitError(
          "Add carrier estimate text (paste or .txt file) before continuing."
        );
        announce("Submit blocked: carrier estimate text is required.");
        return;
      }
      const m = state.claimMeta;
      if (
        !m.insuredName?.trim() ||
        !m.claimType ||
        !m.state ||
        !m.policyNumber ||
        !m.claimNumber ||
        !m.dateOfLoss ||
        !m.adjusterName ||
        !m.disputedAmount
      ) {
        setSubmitError("Complete all required metadata fields.");
        announce("Submit blocked: missing required metadata.");
        return;
      }
      setSubmitLoading(true);
      announce("Calling analysis services…");

      const headers: HeadersInit = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.accessToken}`,
      };

      const analyzeBody = {
        documentText,
        contractorText: (state.contractorText ?? "").trim() || null,
        insuredName: m.insuredName.trim(),
        claimType: m.claimType,
        state: m.state,
        policyNumber: m.policyNumber,
        claimNumber: m.claimNumber,
        dateOfLoss: m.dateOfLoss,
        adjusterName: m.adjusterName,
        disputedAmount: m.disputedAmount,
        responseDeadline: m.responseDeadline || "",
      };

      const analyzePromise = fetch(
        netlifyFunctionUrl("analyze-estimate"),
        {
          method: "POST",
          headers,
          body: JSON.stringify(analyzeBody),
        }
      );

      const contractorTrim = (state.contractorText ?? "").trim();
      const comparePromise =
        contractorTrim.length > 0
          ? fetch(netlifyFunctionUrl("compare-estimates"), {
              method: "POST",
              headers,
              body: JSON.stringify({
                carrierText: documentText,
                contractorText: state.contractorText,
                claimType: m.claimType,
              }),
            })
          : Promise.resolve(null as Response | null);

      try {
        const [analyzeRes, compareRes] = await Promise.all([
          analyzePromise,
          comparePromise,
        ]);

        if (!analyzeRes.ok) {
          await analyzeRes.text().catch(() => "");
          setSubmitError("Analysis failed. Please try again.");
          announce("Analysis request failed.");
          setSubmitLoading(false);
          return;
        }

        const analysisJson: unknown = await analyzeRes.json();
        const parsedAnalysis = parseAnalysisResult(analysisJson);
        if (!parsedAnalysis) {
          setSubmitError("Analysis failed. Please try again.");
          announce("Analysis parse failed.");
          setSubmitLoading(false);
          return;
        }

        let parsedComparison: ComparisonResult | null = null;
        if (compareRes) {
          if (!compareRes.ok) {
            await compareRes.text().catch(() => "");
            setSubmitError("Comparison failed. Please try again.");
            announce("Compare request failed.");
            setSubmitLoading(false);
            return;
          }
          const compareJson: unknown = await compareRes.json();
          parsedComparison = parseComparisonResult(compareJson);
        }

        setState((s) => {
          const primary =
            categoriesInDocumentOrder(s.documents)[0] ?? "BUILDING";
          return withDerived(s, {
            analyses: { ...s.analyses, [primary]: parsedAnalysis },
            comparisons: parsedComparison
              ? { ...s.comparisons, [primary]: parsedComparison }
              : s.comparisons,
          });
        });
        setSubmitLoading(false);
        setCurrentStep(2);
        announce("Step 2 — Analysis.");
      } catch {
        setSubmitError("Analysis failed. Please try again.");
        announce("Analysis request error.");
        setSubmitLoading(false);
      }
    },
    [
      state.accessToken,
      state.carrierText,
      state.contractorText,
      state.documents,
      state.claimMeta,
      announce,
    ]
  );

  const onStep2Back = useCallback(() => {
    setCurrentStep(1);
    announce("Returned to Step 1.");
  }, [announce]);

  const onStep2Next = useCallback(() => {
    setCurrentStep(3);
    announce("Step 3 — Comparison.");
  }, [announce]);

  const onStep3Back = useCallback(() => {
    setCurrentStep(2);
    announce("Returned to Step 2.");
  }, [announce]);

  const onStep3Next = useCallback(() => {
    setCurrentStep(4);
    announce("Step 4 — Strategy.");
  }, [announce]);

  const onStep4Back = useCallback(() => {
    setCurrentStep(3);
    announce("Returned to Step 3.");
  }, [announce]);

  const onStep4Next = useCallback(() => {
    const s = wizardStateRef.current;
    if (!s.strategy || !s.analysis) {
      announce("Select a strategy and complete analysis first.");
      return;
    }
    setCurrentStep(5);
    announce("Step 5 — Summary.");
  }, [announce]);

  const onStep5Back = useCallback(() => {
    setCurrentStep(4);
    announce("Returned to Step 4.");
  }, [announce]);

  const onStep5GoToLetter = useCallback(() => {
    setCurrentStep(6);
    announce("Step 6 — Letter.");
  }, [announce]);

  const onStep6Back = useCallback(() => {
    setCurrentStep(5);
    announce("Returned to Step 5 — Summary.");
  }, [announce]);

  const onLetterTypeChange = useCallback((code: string) => {
    setState((s) => ({ ...s, letterType: code }));
  }, []);

  const onStep6GenerateLetter = useCallback(async () => {
    const s = wizardStateRef.current;
    if (!s.letterType || !s.analysis || !s.strategy) {
      announce("Select a letter type and ensure analysis and strategy are set.");
      return;
    }
    setStep6LetterLoading(true);
    try {
      const res = await fetch(
        netlifyFunctionUrl("generate-estimate-letter"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${s.accessToken}`,
          },
          body: JSON.stringify({
            analysis: s.analysis,
            strategy: s.strategy,
            claimType: s.claimMeta.claimType,
            letterType: s.letterType,
            tone: "FORMAL_PROFESSIONAL",
          }),
        }
      );
      if (!res.ok) {
        await res.text().catch(() => "");
        announce(
          `Letter could not be generated (HTTP ${res.status}). Check the network response and try again.`
        );
        return;
      }
      const ct = (res.headers.get("content-type") || "").toLowerCase();
      if (ct.includes("application/json")) {
        await res.text().catch(() => "");
        announce(
          "Letter endpoint returned JSON instead of plain text. Check the network response."
        );
        return;
      }
      const text = await res.text();
      setState((prev) => {
        const shouldPrefill = !prev.prefillApplied;
        if (shouldPrefill) {
          const fields = letterPlaceholdersFromClaimMeta(prev.claimMeta);
          const merged = applyPlaceholdersToLetter(text, fields);
          return {
            ...prev,
            letterRaw: merged,
            letterPlaceholders: fields,
            prefillApplied: true,
          };
        }
        return {
          ...prev,
          letterRaw: text,
        };
      });
      if (!text.trim()) {
        announce("Letter response was empty. You can edit the text below.");
      } else {
        announce(
          "Letter generated. Placeholders from claim metadata were applied where tokens appear."
        );
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Network or request error.";
      announce(`Letter could not be generated: ${msg}`);
    } finally {
      setStep6LetterLoading(false);
    }
  }, [announce]);

  const onLetterChange = useCallback((text: string) => {
    setState((s) => ({ ...s, letterRaw: text }));
  }, []);

  const onLetterPlaceholdersChange = useCallback(
    (patch: Partial<LetterPlaceholderFields>) => {
      setState((s) => ({
        ...s,
        letterPlaceholders: { ...s.letterPlaceholders, ...patch },
      }));
    },
    []
  );

  const onWizardStartOver = useCallback(() => {
    setState((s) => ({
      ...initialWizardState(),
      accessToken: s.accessToken,
    }));
    setCurrentStep(1);
    announce("Wizard reset to Step 1.");
  }, [announce]);

  const onStrategyChange = useCallback((code: string) => {
    setState((s) => {
      const primary =
        categoriesInDocumentOrder(s.documents)[0] ?? "BUILDING";
      return withDerived(s, {
        strategies: { ...s.strategies, [primary]: code },
        strategy: code,
      });
    });
  }, []);

  useEffect(() => {
    if (currentStep !== 4) {
      step4StrategyAutoAppliedRef.current = false;
      return;
    }
    if (step4StrategyAutoAppliedRef.current) return;
    step4StrategyAutoAppliedRef.current = true;
    setState((s) => {
      if (s.strategy !== null) return s;
      const rec =
        typeof s.analysis?.recommendedStrategy === "string"
          ? s.analysis.recommendedStrategy.trim()
          : "";
      if (!rec) return s;
      const primary =
        categoriesInDocumentOrder(s.documents)[0] ?? "BUILDING";
      return withDerived(s, {
        strategies: { ...s.strategies, [primary]: rec },
        strategy: rec,
      });
    });
    return () => {
      step4StrategyAutoAppliedRef.current = false;
    };
  }, [currentStep]);

  const stepLabels = useMemo(
    () => [
      "Input",
      "Analysis",
      "Comparison",
      "Strategy",
      "Summary",
      "Letter",
    ],
    []
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
      <Suspense fallback={null}>
        <PaymentSuccessHandler onSuccess={setPaymentSuccess} />
      </Suspense>

      <header className="border-b border-slate-800/50 bg-[#0F172A]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2563EB]">
              <span className="text-sm font-black text-white">ER</span>
            </div>
            <span className="text-sm font-semibold text-white">
              Estimate Review Pro
            </span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link
              href="/pricing"
              className="text-slate-200 transition hover:text-white"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
            >
              Log in
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col px-6 py-10 text-[#1E293B]">
        {paymentSuccess && (
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
            <p className="text-base font-semibold text-emerald-800">
              Payment successful. You can continue in the wizard below.
            </p>
          </div>
        )}

        <div
          id="erp-wizard-root"
          className="relative flex flex-col gap-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
          data-access-token={state.accessToken === "bypass" ? "bypass" : "set"}
        >
          <nav
            id="erp-wizard-step-indicator"
            className="flex flex-wrap items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-3"
            aria-label="Wizard steps"
          >
            {stepLabels.map((label, i) => {
              const n = i + 1;
              const active = n === currentStep;
              return (
                <div
                  key={n}
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                    active
                      ? "bg-[#0F172A] text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                  aria-current={active ? "step" : undefined}
                >
                  <span className="tabular-nums">{n}</span>
                  <span>{label}</span>
                </div>
              );
            })}
          </nav>

          <div
            id="erp-wizard-live-region"
            ref={liveRegionRef}
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="absolute m-[-1px] h-px w-px overflow-hidden border-0 p-0 whitespace-nowrap"
          />

          <form
            onSubmit={onSubmitStep1}
            className="space-y-8"
            noValidate
            hidden={currentStep !== 1}
          >
            <section
              id="erp-step1-panel"
              className="rounded-xl border-0 bg-transparent p-0 shadow-none"
              aria-labelledby="erp-step1-heading"
              hidden={currentStep !== 1}
            >
              <h2
                id="erp-step1-heading"
                className="text-2xl font-bold text-[#1E293B]"
              >
                Step 1 — Input
              </h2>
              <p className="mt-2 text-sm text-[#475569]">
                Add up to 10 estimate documents (carrier, contractor, or other
                sides), then complete claim metadata. Structured findings only.
              </p>

              <div className="mt-8 space-y-10">
                <div>
                  <h3 className="text-lg font-semibold text-[#1E293B]">
                    Claim documents
                  </h3>
                  <div className="mt-4 space-y-6">
                    {state.documents.map((doc, idx) => (
                      <div
                        key={doc.id}
                        id={`erp-step1-doc-${idx}`}
                        className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 md:p-5"
                      >
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-[#1E293B]">
                            {doc.label || `Document ${idx + 1}`}
                          </span>
                          <button
                            type="button"
                            disabled={state.documents.length <= 1}
                            onClick={() => removeDocumentSlot(doc.id)}
                            className="text-xs font-medium text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <span className="mb-2 block text-sm font-medium text-[#475569]">
                              File (PDF, images, or .txt)
                            </span>
                            <label
                              htmlFor={step1DocFileInputId(idx)}
                              onDragEnter={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDocDragOverIndex(idx);
                              }}
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                e.dataTransfer.dropEffect = "copy";
                                setDocDragOverIndex(idx);
                              }}
                              onDragLeave={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (
                                  e.currentTarget.contains(
                                    e.relatedTarget as Node | null
                                  )
                                ) {
                                  return;
                                }
                                setDocDragOverIndex((cur) =>
                                  cur === idx ? null : cur
                                );
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDocDragOverIndex(null);
                                const f = e.dataTransfer.files?.[0] ?? null;
                                if (!f) return;
                                if (!isStep1AcceptedEstimateFile(f)) {
                                  announce(
                                    "That file type is not accepted. Use PDF, PNG, JPG, JPEG, WEBP, or .txt."
                                  );
                                  return;
                                }
                                void readDocumentFile(doc.id, f);
                              }}
                              className={`block cursor-pointer rounded-lg border-2 border-dashed px-4 py-8 text-center text-sm text-[#475569] transition-colors ${
                                docDragOverIndex === idx
                                  ? "border-blue-500 bg-blue-50"
                                  : "border-slate-300 bg-white hover:border-slate-400"
                              }`}
                            >
                              Drag and drop PDF, image, or .txt file here, or
                              click to browse
                              <input
                                id={step1DocFileInputId(idx)}
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,text/plain"
                                className="sr-only"
                                onChange={(ev) => {
                                  const f = ev.target.files?.[0] ?? null;
                                  void readDocumentFile(doc.id, f);
                                }}
                              />
                            </label>
                          </div>
                          <p
                            id={step1DocExtractStatusId(idx)}
                            className="text-sm text-[#475569]"
                          >
                            {extractStatusMessage(doc)}
                          </p>
                          {idx === 0 && (
                            <div className="mt-2">
                              <button
                                type="button"
                                onClick={() => setShowXactimateHelp((v) => !v)}
                                className="text-xs text-blue-500 hover:text-blue-700 underline-offset-2 hover:underline focus:outline-none"
                              >
                                {showXactimateHelp
                                  ? "Hide Xactimate export guide ▲"
                                  : "Using Xactimate? See how to export →"}
                              </button>
                              {showXactimateHelp && (
                                <div
                                  id="erp-step1-xactimate-help"
                                  className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600"
                                >
                                  <p className="mb-2 font-medium text-slate-700">
                                    Exporting from Xactimate
                                  </p>
                                  <ol className="list-inside list-decimal space-y-1">
                                    <li>Open your estimate in Xactimate</li>
                                    <li>
                                      Click{" "}
                                      <span className="font-medium">
                                        File → Print → Save as PDF
                                      </span>
                                    </li>
                                    <li>
                                      Upload that PDF using the drop zone above
                                    </li>
                                  </ol>
                                  <p className="mb-1 mt-3 font-medium text-slate-700">
                                    Or paste directly:
                                  </p>
                                  <ol className="list-inside list-decimal space-y-1">
                                    <li>In Xactimate, select all line items</li>
                                    <li>
                                      Copy (
                                      <span className="font-medium">
                                        Ctrl+C
                                      </span>
                                      )
                                    </li>
                                    <li>Paste into the text field below</li>
                                  </ol>
                                  <p className="mt-3 border-t border-slate-200 pt-2 text-xs text-slate-400">
                                    ESX files cannot be read directly — PDF or
                                    paste export required.
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                          <div>
                            <label
                              htmlFor={step1DocPasteId(idx)}
                              className="mb-2 block text-sm font-medium text-[#475569]"
                            >
                              {idx === 0
                                ? "Paste carrier estimate text"
                                : idx === 1
                                  ? "Paste contractor estimate text"
                                  : "Paste estimate text"}
                            </label>
                            <textarea
                              id={step1DocPasteId(idx)}
                              name={step1DocPasteId(idx)}
                              rows={idx === 0 ? 8 : 6}
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-[#1E293B] placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder={
                                idx === 0
                                  ? "Paste line items and totals…"
                                  : "Optional second estimate…"
                              }
                              value={doc.extractedText}
                              onChange={(ev) =>
                                updateDocumentText(doc.id, ev.target.value)
                              }
                            />
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                              <label
                                className="mb-1 block text-xs font-medium text-[#475569]"
                                htmlFor={`erp-step1-doc-${idx}-side`}
                              >
                                Side
                              </label>
                              <select
                                id={`erp-step1-doc-${idx}-side`}
                                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-[#1E293B]"
                                value={doc.side}
                                onChange={(e) =>
                                  updateDocumentSide(
                                    doc.id,
                                    e.target.value as ClaimDocumentSide
                                  )
                                }
                              >
                                {SIDE_OPTIONS.map((o) => (
                                  <option key={o.value} value={o.value}>
                                    {o.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <div className="mb-1 flex flex-wrap items-center gap-2">
                                <label
                                  className="text-xs font-medium text-[#475569]"
                                  htmlFor={`erp-step1-doc-${idx}-category`}
                                >
                                  Category
                                </label>
                                {doc.autoDetected && (
                                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-800">
                                    Auto-detected
                                  </span>
                                )}
                              </div>
                              <select
                                id={`erp-step1-doc-${idx}-category`}
                                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-[#1E293B]"
                                value={doc.category}
                                onChange={(e) =>
                                  updateDocumentCategory(
                                    doc.id,
                                    e.target.value as ClaimDocumentCategory
                                  )
                                }
                              >
                                {CATEGORY_OPTIONS.map((o) => (
                                  <option key={o.value} value={o.value}>
                                    {o.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label
                                className="mb-1 block text-xs font-medium text-[#475569]"
                                htmlFor={`erp-step1-doc-${idx}-version`}
                              >
                                Version
                              </label>
                              <select
                                id={`erp-step1-doc-${idx}-version`}
                                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-[#1E293B]"
                                value={doc.version}
                                onChange={(e) =>
                                  updateDocumentVersion(
                                    doc.id,
                                    e.target.value as ClaimDocumentVersion
                                  )
                                }
                              >
                                {VERSION_OPTIONS.map((o) => (
                                  <option key={o.value} value={o.value}>
                                    {o.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="sm:col-span-2 lg:col-span-1">
                              <label
                                className="mb-1 block text-xs font-medium text-[#475569]"
                                htmlFor={`erp-step1-doc-${idx}-label`}
                              >
                                Label
                              </label>
                              <input
                                id={`erp-step1-doc-${idx}-label`}
                                type="text"
                                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-[#1E293B]"
                                value={doc.label}
                                onChange={(e) =>
                                  updateDocumentLabel(doc.id, e.target.value)
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      id="erp-step1-add-document"
                      type="button"
                      disabled={state.documents.length >= 10}
                      onClick={addDocumentSlot}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#1E293B] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Add Document
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="erp-step1-insured-name"
                    className="mb-2 block text-sm font-medium text-[#475569]"
                  >
                    Insured name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="erp-step1-insured-name"
                    type="text"
                    required
                    autoComplete="name"
                    className="w-full max-w-xl rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#1E293B] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={state.claimMeta.insuredName}
                    onChange={(e) =>
                      patchClaimMeta({ insuredName: e.target.value })
                    }
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[#1E293B]">
                    Claim metadata
                  </h3>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor="erp-step1-claim-type"
                        className="mb-2 block text-sm font-medium text-[#475569]"
                      >
                        Claim type <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="erp-step1-claim-type"
                        required
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#1E293B] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={state.claimMeta.claimType}
                        onChange={(e) =>
                          patchClaimMeta({ claimType: e.target.value })
                        }
                      >
                        <option value="">Select…</option>
                        <option value="property">Property</option>
                        <option value="auto">Auto</option>
                        <option value="commercial">Commercial</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="erp-step1-state"
                        className="mb-2 block text-sm font-medium text-[#475569]"
                      >
                        State <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="erp-step1-state"
                        required
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#1E293B] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={state.claimMeta.state}
                        onChange={(e) =>
                          patchClaimMeta({ state: e.target.value })
                        }
                      >
                        <option value="">Select…</option>
                        {US_STATES.map((s) => (
                          <option key={s.code} value={s.code}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="erp-step1-policy-number"
                        className="mb-2 block text-sm font-medium text-[#475569]"
                      >
                        Policy number <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="erp-step1-policy-number"
                        type="text"
                        required
                        autoComplete="off"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#1E293B] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={state.claimMeta.policyNumber}
                        onChange={(e) =>
                          patchClaimMeta({ policyNumber: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="erp-step1-claim-number"
                        className="mb-2 block text-sm font-medium text-[#475569]"
                      >
                        Claim number <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="erp-step1-claim-number"
                        type="text"
                        required
                        autoComplete="off"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#1E293B] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={state.claimMeta.claimNumber}
                        onChange={(e) =>
                          patchClaimMeta({ claimNumber: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="erp-step1-date-of-loss"
                        className="mb-2 block text-sm font-medium text-[#475569]"
                      >
                        Date of loss <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="erp-step1-date-of-loss"
                        type="date"
                        required
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#1E293B] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={state.claimMeta.dateOfLoss}
                        onChange={(e) =>
                          patchClaimMeta({ dateOfLoss: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="erp-step1-adjuster-name"
                        className="mb-2 block text-sm font-medium text-[#475569]"
                      >
                        Adjuster name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="erp-step1-adjuster-name"
                        type="text"
                        required
                        autoComplete="off"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#1E293B] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={state.claimMeta.adjusterName}
                        onChange={(e) =>
                          patchClaimMeta({ adjusterName: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="erp-step1-carrier-name"
                        className="mb-2 block text-sm font-medium text-[#475569]"
                      >
                        Carrier name
                      </label>
                      <input
                        id="erp-step1-carrier-name"
                        type="text"
                        autoComplete="organization"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#1E293B] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={state.claimMeta.carrierName}
                        onChange={(e) =>
                          patchClaimMeta({ carrierName: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="erp-step1-disputed-amount"
                        className="mb-2 block text-sm font-medium text-[#475569]"
                      >
                        Disputed amount <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="erp-step1-disputed-amount"
                        type="text"
                        required
                        inputMode="decimal"
                        autoComplete="off"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#1E293B] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={state.claimMeta.disputedAmount}
                        onChange={(e) =>
                          patchClaimMeta({ disputedAmount: e.target.value })
                        }
                        onBlur={(e) => {
                          const n = normalizeDisputedAmount(e.target.value);
                          patchClaimMeta({ disputedAmount: n });
                        }}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label
                        htmlFor="erp-step1-response-deadline"
                        className="mb-2 block text-sm font-medium text-[#475569]"
                      >
                        Response deadline (optional)
                      </label>
                      <input
                        id="erp-step1-response-deadline"
                        type="date"
                        className="w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#1E293B] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={state.claimMeta.responseDeadline}
                        onChange={(e) =>
                          patchClaimMeta({ responseDeadline: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                {submitError && (
                  <p
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                    role="alert"
                  >
                    {submitError}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4">
                  <button
                    id="erp-step1-load-demo"
                    type="button"
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#1E293B] hover:bg-slate-50"
                    onClick={onLoadDemo}
                  >
                    Load Demo Estimate
                  </button>
                  <button
                    id="erp-step1-reset"
                    type="button"
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#475569] hover:bg-slate-50"
                    onClick={onResetStep1}
                  >
                    Clear Step 1
                  </button>
                  <button
                    id="erp-step1-submit"
                    type="submit"
                    disabled={submitLoading}
                    className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitLoading ? "Analyzing…" : "Continue"}
                  </button>
                </div>
              </div>
            </section>
          </form>

          <section
            id="erp-step2-panel"
            hidden={currentStep !== 2}
            aria-hidden={currentStep !== 2}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
          >
            <Step2AnalysisPanel
              accessToken={state.accessToken}
              analysis={state.analysis}
              comparison={state.comparison}
              onBack={onStep2Back}
              onNext={onStep2Next}
              announce={announce}
            />
          </section>
          <section
            id="erp-step3-panel"
            hidden={currentStep !== 3}
            aria-hidden={currentStep !== 3}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
          >
            <Step3ComparisonPanel
              accessToken={state.accessToken}
              comparison={state.comparison}
              claimMeta={{
                insuredName: state.claimMeta.insuredName,
                policyNumber: state.claimMeta.policyNumber,
                claimNumber: state.claimMeta.claimNumber,
                dateOfLoss: state.claimMeta.dateOfLoss,
              }}
              onBack={onStep3Back}
              onNext={onStep3Next}
              announce={announce}
            />
          </section>
          <section
            id="erp-step4-panel"
            hidden={currentStep !== 4}
            aria-hidden={currentStep !== 4}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
          >
            <Step4StrategyPanel
              analysis={state.analysis}
              strategy={state.strategy}
              onStrategyChange={onStrategyChange}
              onBack={onStep4Back}
              onNext={onStep4Next}
              announce={announce}
            />
          </section>
          <section
            id="erp-step5-panel"
            hidden={currentStep !== 5}
            aria-hidden={currentStep !== 5}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
          >
            <Step5SummaryPanel
              accessToken={state.accessToken}
              analysis={state.analysis}
              comparison={state.comparison}
              strategy={state.strategy}
              claimMeta={state.claimMeta}
              onBack={onStep5Back}
              onGoToLetter={onStep5GoToLetter}
              onStartOver={onWizardStartOver}
              announce={announce}
            />
          </section>
          <section
            id="erp-step6-panel"
            hidden={currentStep !== 6}
            aria-hidden={currentStep !== 6}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
          >
            <Step6LetterPanel
              accessToken={state.accessToken}
              active={currentStep === 6}
              letterType={state.letterType}
              onLetterTypeChange={onLetterTypeChange}
              letterRaw={state.letterRaw}
              onLetterChange={onLetterChange}
              letterPlaceholders={state.letterPlaceholders}
              onLetterPlaceholdersChange={onLetterPlaceholdersChange}
              showLetterEditor={state.letterRaw !== null}
              generateLoading={step6LetterLoading}
              onGenerate={onStep6GenerateLetter}
              onBack={onStep6Back}
              onStartOver={onWizardStartOver}
              announce={announce}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
