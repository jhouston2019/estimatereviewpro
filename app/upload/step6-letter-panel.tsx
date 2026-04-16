"use client";

import { useCallback, useEffect } from "react";
import { netlifyFunctionUrl } from "@/lib/netlify-function-url";

export type LetterPlaceholderFields = {
  insured: string;
  policy: string;
  claim: string;
  dol: string;
  adjuster: string;
  carrier: string;
  amount: string;
  deadline: string;
};

export function emptyLetterPlaceholders(): LetterPlaceholderFields {
  return {
    insured: "",
    policy: "",
    claim: "",
    dol: "",
    adjuster: "",
    carrier: "",
    amount: "",
    deadline: "",
  };
}

export type ClaimMetaSlice = {
  insuredName: string;
  carrierName?: string;
  policyNumber: string;
  claimNumber: string;
  dateOfLoss: string;
  adjusterName: string;
  disputedAmount: string;
  responseDeadline: string;
};

function formatDisputedAmountPlaceholder(raw: string): string {
  const n = parseFloat(
    String(raw || "")
      .replace(/\$/g, "")
      .replace(/,/g, "")
      .replace(/\s/g, "")
      .trim()
  );
  if (!Number.isFinite(n)) return raw ?? "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

export function letterPlaceholdersFromClaimMeta(
  meta: ClaimMetaSlice
): LetterPlaceholderFields {
  return {
    insured: meta.insuredName ?? "",
    policy: meta.policyNumber ?? "",
    claim: meta.claimNumber ?? "",
    dol: meta.dateOfLoss ?? "",
    adjuster: meta.adjusterName ?? "",
    carrier: meta.carrierName?.trim() ?? "",
    amount: formatDisputedAmountPlaceholder(meta.disputedAmount ?? ""),
    deadline: meta.responseDeadline ?? "",
  };
}

const PLACEHOLDER_REPLACEMENTS: [string, keyof LetterPlaceholderFields][] = [
  ["[INSURED NAME]", "insured"],
  ["[POLICY NUMBER]", "policy"],
  ["[CLAIM NUMBER]", "claim"],
  ["[DATE OF LOSS]", "dol"],
  ["[ADJUSTER NAME]", "adjuster"],
  ["[CARRIER NAME]", "carrier"],
  ["[DISPUTED AMOUNT]", "amount"],
  ["[RESPONSE DEADLINE]", "deadline"],
];

export function applyPlaceholdersToLetter(
  text: string,
  fields: LetterPlaceholderFields
): string {
  let out = text;
  for (const [token, key] of PLACEHOLDER_REPLACEMENTS) {
    const v = fields[key] ?? "";
    out = out.split(token).join(v);
  }
  return out;
}

const LETTER_TYPE_OPTIONS = [
  {
    id: "erp-step6-type-supplement",
    label: "Supplement Demand Letter",
    value: "SUPPLEMENT_DEMAND",
  },
  { id: "erp-step6-type-dispute", label: "Dispute Letter", value: "DISPUTE" },
  {
    id: "erp-step6-type-reinspection",
    label: "Re-Inspection Request",
    value: "REINSPECTION_REQUEST",
  },
  {
    id: "erp-step6-type-appraisal",
    label: "Appraisal Invocation",
    value: "APPRAISAL_INVOCATION",
  },
  {
    id: "erp-step6-type-custom",
    label: "Custom / Narrative",
    value: "CUSTOM_NARRATIVE",
  },
] as const;

function syncExportSource(text: string) {
  const el = document.getElementById("erp-step6-letter-export-source");
  if (el) el.textContent = text;
}

type Props = {
  accessToken: string;
  active: boolean;
  letterType: string | null;
  onLetterTypeChange: (code: string) => void;
  letterRaw: string | null;
  onLetterChange: (text: string) => void;
  letterPlaceholders: LetterPlaceholderFields;
  onLetterPlaceholdersChange: (patch: Partial<LetterPlaceholderFields>) => void;
  showLetterEditor: boolean;
  generateLoading: boolean;
  onGenerate: () => void | Promise<void>;
  onBack: () => void;
  onStartOver: () => void;
  announce: (message: string) => void;
};

export function Step6LetterPanel({
  accessToken,
  active,
  letterType,
  onLetterTypeChange,
  letterRaw,
  onLetterChange,
  letterPlaceholders,
  onLetterPlaceholdersChange,
  showLetterEditor,
  generateLoading,
  onGenerate,
  onBack,
  onStartOver,
  announce,
}: Props) {
  useEffect(() => {
    if (!active || !showLetterEditor) return;
    syncExportSource(letterRaw ?? "");
  }, [letterRaw, active, showLetterEditor]);

  const onEditorChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const v = e.target.value;
      onLetterChange(v);
      syncExportSource(v);
    },
    [onLetterChange]
  );

  const applyPlaceholders = useCallback(() => {
    const text = applyPlaceholdersToLetter(letterRaw ?? "", letterPlaceholders);
    onLetterChange(text);
    syncExportSource(text);
    announce("Placeholders applied to letter text.");
  }, [letterRaw, letterPlaceholders, onLetterChange, announce]);

  const copyLetter = useCallback(async () => {
    const ta = document.getElementById(
      "erp-step6-letter-editor"
    ) as HTMLTextAreaElement | null;
    const v = ta?.value ?? "";
    try {
      await navigator.clipboard.writeText(v);
      announce("Letter copied to clipboard.");
    } catch {
      announce("Copy failed. Select the letter and copy manually.");
    }
  }, [announce]);

  const downloadPdf = useCallback(async () => {
    const root = document.getElementById("erp-step6-letter-export-source");
    if (!root) {
      announce("Export source missing.");
      return;
    }
    const text = root.innerText;
    const res = await fetch(netlifyFunctionUrl("generate-pdf"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ text, fileName: "estimate-letter.pdf" }),
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
    a.download = "estimate-letter.pdf";
    a.click();
    URL.revokeObjectURL(url);
    announce("PDF downloaded.");
  }, [accessToken, announce]);

  const downloadWord = useCallback(async () => {
    const root = document.getElementById("erp-step6-letter-export-source");
    if (!root) {
      announce("Export source missing.");
      return;
    }
    const text = root.innerText;
    const res = await fetch(netlifyFunctionUrl("generate-docx"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ text, fileName: "estimate-letter.docx" }),
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
    a.download = "estimate-letter.docx";
    a.click();
    URL.revokeObjectURL(url);
    announce("Word document downloaded.");
  }, [accessToken, announce]);

  const patchField = (key: keyof LetterPlaceholderFields, value: string) => {
    onLetterPlaceholdersChange({ [key]: value });
  };

  const f = letterPlaceholders;

  return (
    <div className="text-[#475569]">
      <h2
        id="erp-step6-heading"
        className="text-2xl font-bold text-[#1E293B]"
      >
        Step 6 — Letter
      </h2>

      <p className="mt-2 text-sm text-[#475569]">
        Letter type (required). Tone is fixed to formal / professional for all
        letters.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {LETTER_TYPE_OPTIONS.map((opt) => {
          const selected = letterType === opt.value;
          return (
            <div
              key={opt.id}
              id={opt.id}
              role="button"
              tabIndex={0}
              onClick={() => onLetterTypeChange(opt.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onLetterTypeChange(opt.value);
                }
              }}
              className={`cursor-pointer rounded-xl border p-4 text-left text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                selected
                  ? "border-blue-500 bg-blue-50 text-[#1E293B]"
                  : "border-slate-200 bg-white text-[#1E293B] hover:border-slate-300"
              }`}
            >
              {opt.label}
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <button
          id="erp-step6-generate"
          type="button"
          disabled={!letterType || generateLoading}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => void onGenerate()}
        >
          {generateLoading ? "Generating…" : "Generate"}
        </button>
      </div>

      {showLetterEditor && (
        <div className="mt-10 space-y-6 border-t border-slate-200 pt-8">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="erp-step6-ph-insured-name"
                className="mb-1 block text-xs font-medium text-[#475569]"
              >
                Insured name
              </label>
              <input
                id="erp-step6-ph-insured-name"
                type="text"
                autoComplete="off"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#1E293B]"
                value={f.insured}
                onChange={(e) => patchField("insured", e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="erp-step6-ph-policy-number"
                className="mb-1 block text-xs font-medium text-[#475569]"
              >
                Policy number
              </label>
              <input
                id="erp-step6-ph-policy-number"
                type="text"
                autoComplete="off"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#1E293B]"
                value={f.policy}
                onChange={(e) => patchField("policy", e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="erp-step6-ph-claim-number"
                className="mb-1 block text-xs font-medium text-[#475569]"
              >
                Claim number
              </label>
              <input
                id="erp-step6-ph-claim-number"
                type="text"
                autoComplete="off"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#1E293B]"
                value={f.claim}
                onChange={(e) => patchField("claim", e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="erp-step6-ph-date-of-loss"
                className="mb-1 block text-xs font-medium text-[#475569]"
              >
                Date of loss
              </label>
              <input
                id="erp-step6-ph-date-of-loss"
                type="date"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#1E293B]"
                value={f.dol}
                onChange={(e) => patchField("dol", e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="erp-step6-ph-adjuster-name"
                className="mb-1 block text-xs font-medium text-[#475569]"
              >
                Adjuster name
              </label>
              <input
                id="erp-step6-ph-adjuster-name"
                type="text"
                autoComplete="off"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#1E293B]"
                value={f.adjuster}
                onChange={(e) => patchField("adjuster", e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="erp-step6-ph-carrier-name"
                className="mb-1 block text-xs font-medium text-[#475569]"
              >
                Carrier name
              </label>
              <input
                id="erp-step6-ph-carrier-name"
                type="text"
                autoComplete="off"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#1E293B]"
                value={f.carrier}
                onChange={(e) => patchField("carrier", e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="erp-step6-ph-disputed-amount"
                className="mb-1 block text-xs font-medium text-[#475569]"
              >
                Disputed amount
              </label>
              <input
                id="erp-step6-ph-disputed-amount"
                type="text"
                autoComplete="off"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#1E293B]"
                value={f.amount}
                onChange={(e) => patchField("amount", e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="erp-step6-ph-response-deadline"
                className="mb-1 block text-xs font-medium text-[#475569]"
              >
                Response deadline
              </label>
              <input
                id="erp-step6-ph-response-deadline"
                type="date"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#1E293B]"
                value={f.deadline}
                onChange={(e) => patchField("deadline", e.target.value)}
              />
            </div>
          </div>

          <button
            id="erp-step6-apply-placeholders"
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#1E293B] hover:bg-slate-50"
            onClick={applyPlaceholders}
          >
            Apply placeholders to letter
          </button>

          <label
            htmlFor="erp-step6-letter-editor"
            className="block text-sm font-semibold text-[#1E293B]"
          >
            Letter
          </label>
          <textarea
            id="erp-step6-letter-editor"
            rows={18}
            spellCheck={false}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm leading-relaxed text-[#1E293B] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={letterRaw ?? ""}
            onChange={onEditorChange}
          />

          <pre
            id="erp-step6-letter-export-source"
            aria-hidden="true"
            className="pointer-events-none fixed left-[-9999px] top-0 z-0 w-[min(900px,100vw)] whitespace-pre-wrap border-0 bg-transparent p-0 text-sm text-[#1E293B] opacity-0"
          />

          <div className="flex flex-wrap gap-3">
            <button
              id="erp-step6-copy-letter"
              type="button"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#1E293B] hover:bg-slate-50"
              onClick={() => void copyLetter()}
            >
              Copy letter
            </button>
            <button
              id="erp-step6-download-pdf"
              type="button"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#1E293B] hover:bg-slate-50"
              onClick={() => void downloadPdf()}
            >
              Download PDF
            </button>
            <button
              id="erp-step6-download-word"
              type="button"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#1E293B] hover:bg-slate-50"
              onClick={() => void downloadWord()}
            >
              Download Word
            </button>
          </div>
        </div>
      )}

      <div className="mt-10 flex flex-wrap gap-4 border-t border-slate-200 pt-6">
        <button
          id="erp-step6-back"
          type="button"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#475569] hover:bg-slate-50"
          onClick={onBack}
        >
          Back
        </button>
        <button
          id="erp-step6-start-over"
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
