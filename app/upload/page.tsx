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

type WizardState = {
  accessToken: string;
  carrierText: string | null;
  contractorText: string | null;
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

const initialWizardState = (): WizardState => ({
  accessToken: "bypass",
  carrierText: null,
  contractorText: null,
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
});

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

export default function UploadPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [state, setState] = useState<WizardState>(initialWizardState);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [carrierExtractStatus, setCarrierExtractStatus] =
    useState<string>("idle");
  const [contractorExtractStatus, setContractorExtractStatus] =
    useState<string>("idle");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [step6LetterLoading, setStep6LetterLoading] = useState(false);
  const [carrierFileDragOver, setCarrierFileDragOver] = useState(false);
  const [contractorFileDragOver, setContractorFileDragOver] = useState(false);
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

  const readCarrierFile = useCallback(async (file: File | null) => {
    if (!file) return;
    setCarrierExtractStatus("reading");
    if (file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")) {
      const text = await file.text();
      setState((s) => ({ ...s, carrierText: text }));
      setCarrierExtractStatus("Text loaded from file.");
      announce("Carrier estimate text loaded from file.");
      return;
    }
    setCarrierExtractStatus(
      "Paste estimate text below, or use a .txt export for now."
    );
    announce("Carrier file: paste text or use plain text file.");
  }, [announce]);

  const readContractorFile = useCallback(async (file: File | null) => {
    if (!file) return;
    setContractorExtractStatus("reading");
    if (file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")) {
      const text = await file.text();
      setState((s) => ({ ...s, contractorText: text }));
      setContractorExtractStatus("Text loaded from file.");
      announce("Contractor estimate text loaded from file.");
      return;
    }
    setContractorExtractStatus(
      "Paste contractor estimate text below, or use a .txt export for now."
    );
    announce("Contractor file: paste text or use plain text file.");
  }, [announce]);

  const onLoadDemo = useCallback(() => {
    setState((s) => ({
      ...s,
      carrierText:
        "RCV Grand Total $18,200.00\nRemove damaged shingles 24 SQ  $3,200.00\nInstall shingles 24 SQ  $4,800.00\nDetach reset gutter 40 LF  $480.00\nFelt underlayment  $320.00\nRidge cap  $220.00\nDrip edge  $180.00\n",
      contractorText: null,
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
    }));
    setCarrierExtractStatus("Demo estimate loaded.");
    setContractorExtractStatus("idle");
    announce("Demo estimate and metadata loaded.");
  }, [announce]);

  const onResetStep1 = useCallback(() => {
    setState((s) => ({
      ...initialWizardState(),
      accessToken: s.accessToken,
    }));
    setCarrierExtractStatus("idle");
    setContractorExtractStatus("idle");
    setSubmitError(null);
    announce("Step 1 cleared.");
  }, [announce]);

  const onSubmitStep1 = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitError(null);
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

        setState((s) => ({
          ...s,
          analysis: parsedAnalysis,
          comparison: parsedComparison,
        }));
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
    setState((s) => ({ ...s, strategy: code }));
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
      return { ...s, strategy: rec };
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
                Upload or paste the carrier estimate, optional contractor
                estimate, and claim metadata. Structured findings only.
              </p>

              <div className="mt-8 space-y-10">
                <div>
                  <h3 className="text-lg font-semibold text-[#1E293B]">
                    Carrier estimate
                  </h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <span className="mb-2 block text-sm font-medium text-[#475569]">
                        File (PDF, images, or .txt)
                      </span>
                      <label
                        htmlFor="erp-step1-carrier-file"
                        onDragEnter={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCarrierFileDragOver(true);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          e.dataTransfer.dropEffect = "copy";
                          setCarrierFileDragOver(true);
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
                          setCarrierFileDragOver(false);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCarrierFileDragOver(false);
                          const f = e.dataTransfer.files?.[0] ?? null;
                          if (!f) return;
                          if (!isStep1AcceptedEstimateFile(f)) {
                            announce(
                              "That file type is not accepted. Use PDF, PNG, JPG, JPEG, WEBP, or .txt."
                            );
                            return;
                          }
                          void readCarrierFile(f);
                        }}
                        className={`block cursor-pointer rounded-lg border-2 border-dashed px-4 py-8 text-center text-sm text-[#475569] transition-colors ${
                          carrierFileDragOver
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-300 bg-white hover:border-slate-400"
                        }`}
                      >
                        Drag and drop PDF, image, or .txt file here, or click to
                        browse
                        <input
                          id="erp-step1-carrier-file"
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,text/plain"
                          className="sr-only"
                          onChange={(ev) => {
                            const f = ev.target.files?.[0] ?? null;
                            void readCarrierFile(f);
                          }}
                        />
                      </label>
                    </div>
                    <p
                      id="erp-step1-carrier-extract-status"
                      className="text-sm text-[#475569]"
                    >
                      {carrierExtractStatus}
                    </p>
                    <div>
                      <label
                        htmlFor="erp-step1-carrier-paste"
                        className="mb-2 block text-sm font-medium text-[#475569]"
                      >
                        Paste carrier estimate text
                      </label>
                      <textarea
                        id="erp-step1-carrier-paste"
                        name="erp-step1-carrier-paste"
                        rows={8}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-[#1E293B] placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Paste line items and totals…"
                        value={state.carrierText ?? ""}
                        onChange={(ev) =>
                          setState((s) => ({
                            ...s,
                            carrierText: ev.target.value,
                          }))
                        }
                      />
                    </div>
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
                    Contractor / independent estimate (optional)
                  </h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <span className="mb-2 block text-sm font-medium text-[#475569]">
                        File
                      </span>
                      <label
                        htmlFor="erp-step1-contractor-file"
                        onDragEnter={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setContractorFileDragOver(true);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          e.dataTransfer.dropEffect = "copy";
                          setContractorFileDragOver(true);
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
                          setContractorFileDragOver(false);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setContractorFileDragOver(false);
                          const f = e.dataTransfer.files?.[0] ?? null;
                          if (!f) return;
                          if (!isStep1AcceptedEstimateFile(f)) {
                            announce(
                              "That file type is not accepted. Use PDF, PNG, JPG, JPEG, WEBP, or .txt."
                            );
                            return;
                          }
                          void readContractorFile(f);
                        }}
                        className={`block cursor-pointer rounded-lg border-2 border-dashed px-4 py-8 text-center text-sm text-[#475569] transition-colors ${
                          contractorFileDragOver
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-300 bg-white hover:border-slate-400"
                        }`}
                      >
                        Drag and drop PDF, image, or .txt file here, or click to
                        browse
                        <input
                          id="erp-step1-contractor-file"
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,text/plain"
                          className="sr-only"
                          onChange={(ev) => {
                            const f = ev.target.files?.[0] ?? null;
                            void readContractorFile(f);
                          }}
                        />
                      </label>
                    </div>
                    <p
                      id="erp-step1-contractor-extract-status"
                      className="text-sm text-[#475569]"
                    >
                      {contractorExtractStatus}
                    </p>
                    <div>
                      <label
                        htmlFor="erp-step1-contractor-paste"
                        className="mb-2 block text-sm font-medium text-[#475569]"
                      >
                        Paste contractor estimate text
                      </label>
                      <textarea
                        id="erp-step1-contractor-paste"
                        name="erp-step1-contractor-paste"
                        rows={6}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-[#1E293B] placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Optional second estimate…"
                        value={state.contractorText ?? ""}
                        onChange={(ev) =>
                          setState((s) => ({
                            ...s,
                            contractorText: ev.target.value || null,
                          }))
                        }
                      />
                    </div>
                  </div>
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
