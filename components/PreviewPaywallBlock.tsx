"use client";

type Props = {
  onUnlock: () => void;
  busy?: boolean;
  /** Slightly different subcopy when shown on letter (optional) */
  variant?: "default" | "letter";
};

export function PreviewPaywallBlock({
  onUnlock,
  busy = false,
  variant = "default",
}: Props) {
  return (
    <div className="my-6 rounded-2xl border-2 border-[#2563EB]/40 bg-gradient-to-b from-slate-900 to-slate-950 p-6 text-center shadow-lg shadow-black/20">
      <h3 className="text-lg font-bold text-white sm:text-xl">
        Your Full Analysis Is Ready
      </h3>
      <p className="mx-auto mt-2 max-w-lg text-sm text-slate-300 sm:text-base">
        {variant === "letter" ? (
          <>
            Unlock to read your demand letter, the rest of the findings, and
            your PDF and Word reports — ready for negotiation or litigation.
          </>
        ) : (
          <>
            Unlock your demand letter, full findings, PDF report, and Word
            export — structured for negotiation or litigation.
          </>
        )}
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={onUnlock}
        className="mt-5 inline-flex w-full max-w-sm items-center justify-center rounded-lg bg-[#f0a050] px-6 py-3.5 text-base font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Redirecting…" : "Unlock My Analysis — $49"}
      </button>
      <p className="mt-3 text-xs text-slate-500">
        One-time · No subscription required · Your letter is already written
      </p>
    </div>
  );
}
