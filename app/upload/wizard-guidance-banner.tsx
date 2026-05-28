"use client";

import type { WizardGuidance } from "@/lib/wizard-document-guidance";

type Props = {
  guidance: WizardGuidance;
  /** Optional action, e.g. jump to Step 1 */
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

export function WizardGuidanceBanner({
  guidance,
  actionLabel,
  onAction,
  className = "",
}: Props) {
  const isError = guidance.severity === "error";
  return (
    <div
      className={`rounded-xl border px-4 py-4 text-sm ${
        isError
          ? "border-amber-600/50 bg-amber-50 text-amber-950"
          : "border-[#f0a050]/50 bg-[#fff8f0] text-[#3a2800]"
      } ${className}`}
      role="status"
    >
      <p className="font-semibold">{guidance.title}</p>
      {guidance.body ? (
        <p className={`mt-2 ${isError ? "text-amber-900/90" : "text-[#5a4010]/90"}`}>
          {guidance.body}
        </p>
      ) : null}
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide opacity-80">
        What to do next
      </p>
      <ol className="mt-2 list-decimal space-y-1.5 pl-5">
        {guidance.steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
      {actionLabel && onAction ? (
        <button
          type="button"
          className="erp-btn-cta mt-4"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
