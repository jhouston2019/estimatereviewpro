"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const STEP_MS = 4000;
const STEPS = [
  { num: 1, short: "Input" },
  { num: 2, short: "Analysis" },
  { num: 3, short: "Comparison" },
  { num: 4, short: "Strategy" },
  { num: 5, short: "Summary" },
  { num: 6, short: "Letter" },
] as const;

const DESCRIPTIONS: Record<number, string> = {
  1: "Upload your carrier estimate and enter claim details. Supports PDF, images, and text.",
  2: "AI analyzes the estimate for scope omissions, pricing suppression, code gaps, and O&P issues.",
  3: "Line-by-line comparison between carrier and contractor estimates with flagged discrepancies.",
  4: "Choose your response strategy. The recommended option is selected automatically based on the analysis.",
  5: "Complete findings summary exported as a professional PDF or Word document.",
  6: "Generate a formal dispute letter tailored to your strategy. Download as PDF or Word.",
};

function BrowserChrome() {
  return (
    <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
      <div className="flex gap-1.5 pl-1">
        <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" aria-hidden />
      </div>
      <div className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 py-1 text-center text-[11px] text-slate-500 truncate">
        estimatereviewpro.com/upload
      </div>
    </div>
  );
}

function Step1Mock() {
  return (
    <div className="space-y-4 p-4 text-left text-sm text-slate-800 md:p-6">
      <h3 className="text-lg font-bold text-slate-900">Step 1 — Upload</h3>
      <div className="rounded-lg border-2 border-dashed border-blue-300 bg-blue-50/50 p-4 text-center">
        <p className="text-xs font-medium text-blue-800">Carrier estimate</p>
        <p className="mt-1 text-sm font-semibold text-slate-900">carrier-estimate.pdf</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-xs text-slate-500">Claim type</p>
          <p className="font-medium">Property</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-xs text-slate-500">State</p>
          <p className="font-medium">Texas</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-xs text-slate-500">Policy number</p>
          <p className="font-medium">DEMO-POL-001</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-xs text-slate-500">Claim number</p>
          <p className="font-medium">DEMO-CLM-9921</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-xs text-slate-500">Insured</p>
          <p className="font-medium">Demo Insured</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-xs text-slate-500">Adjuster</p>
          <p className="font-medium">Demo Adjuster</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 sm:col-span-2">
          <p className="text-xs text-slate-500">Carrier</p>
          <p className="font-medium">Demo Carrier Insurance</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 sm:col-span-2">
          <p className="text-xs text-slate-500">Disputed amount</p>
          <p className="font-medium">$18,200.00</p>
        </div>
      </div>
      <button
        type="button"
        className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white sm:w-auto sm:px-8"
      >
        Continue
      </button>
    </div>
  );
}

function Step2Mock() {
  return (
    <div className="space-y-4 p-4 text-left md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-bold text-slate-900">Step 2 — Analysis</h3>
        <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
          Risk level: Moderate
        </span>
      </div>
      <div className="rounded-xl bg-blue-50 p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xl font-bold text-slate-800">$18,200.00</p>
            <p className="text-xs text-slate-500">Carrier</p>
          </div>
          <div>
            <p className="text-xl font-bold text-blue-700">$18,000–$22,022</p>
            <p className="text-xs text-slate-500">True loss range</p>
          </div>
          <div>
            <p className="text-xl font-bold text-green-600">$1,811</p>
            <p className="text-xs text-slate-500">Estimated gap</p>
          </div>
        </div>
      </div>
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Scope omissions
        </p>
        <ul className="list-disc space-y-0.5 pl-5 text-sm text-slate-800">
          <li>Starter strip</li>
          <li>Flashing</li>
        </ul>
      </div>
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Pricing flags
        </p>
        <p className="text-sm text-slate-800">
          Higher labor costs in contractor estimate
        </p>
      </div>
    </div>
  );
}

function Step3Mock() {
  const rows = [
    {
      item: "Remove damaged shingles",
      c: "$3,200",
      ci: "Roofing labor",
      co: "$5,800",
      d: "$2,600",
      f: "●" as const,
    },
    {
      item: "Felt underlayment",
      c: "$320",
      ci: "Felt underlayment",
      co: "$420",
      d: "$100",
      f: "–" as const,
    },
    {
      item: "Ridge cap",
      c: "$220",
      ci: "Ridge cap",
      co: "$310",
      d: "$90",
      f: "–" as const,
    },
    {
      item: "Starter strip",
      c: "$0",
      ci: "Starter strip",
      co: "$195",
      d: "$195",
      f: "●" as const,
    },
  ];
  return (
    <div className="p-4 text-left md:p-6">
      <h3 className="mb-3 text-lg font-bold text-slate-900">Step 3 — Comparison</h3>
      <div className="overflow-x-auto rounded-lg border border-slate-200 md:overflow-visible">
        <table className="w-full min-w-[320px] text-left text-xs text-slate-800 md:min-w-0 md:text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-2 py-2 font-bold">Carrier item</th>
              <th className="hidden px-2 py-2 font-bold md:table-cell">Carrier $</th>
              <th className="hidden px-2 py-2 font-bold md:table-cell">Contractor item</th>
              <th className="hidden px-2 py-2 font-bold md:table-cell">Contr. $</th>
              <th className="px-2 py-2 font-bold">Delta</th>
              <th className="px-2 py-2 font-bold">Flag</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.item} className="border-b border-slate-100 bg-gray-50">
                <td className="px-2 py-1.5">{r.item}</td>
                <td className="hidden px-2 py-1.5 tabular-nums md:table-cell">{r.c}</td>
                <td className="hidden px-2 py-1.5 md:table-cell">{r.ci}</td>
                <td className="hidden px-2 py-1.5 tabular-nums md:table-cell">{r.co}</td>
                <td className="px-2 py-1.5 font-medium text-emerald-700 tabular-nums">
                  {r.d}
                </td>
                <td
                  className={`px-2 py-1.5 tabular-nums ${
                    r.f === "●" ? "font-bold text-orange-500" : "text-slate-300"
                  }`}
                >
                  {r.f}
                </td>
              </tr>
            ))}
            <tr className="bg-slate-100 font-semibold">
              <td className="px-2 py-2">Totals</td>
              <td className="hidden px-2 py-2 tabular-nums md:table-cell">$9,200</td>
              <td className="hidden px-2 py-2 md:table-cell">—</td>
              <td className="hidden px-2 py-2 tabular-nums md:table-cell">$13,145</td>
              <td className="px-2 py-2 tabular-nums text-emerald-800">$3,945</td>
              <td className="px-2 py-2" />
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-slate-500 md:hidden">
        Full line items on larger screens.
      </p>
    </div>
  );
}

function Step4Mock() {
  return (
    <div className="p-4 text-left md:p-6">
      <h3 className="mb-4 text-lg font-bold text-slate-900">Step 4 — Strategy</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border-2 border-blue-500 bg-blue-50/40 p-4">
          <span className="mb-2 inline-block rounded bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
            Recommended
          </span>
          <p className="font-semibold text-slate-900">Full Supplement Demand</p>
          <p className="mt-1 text-xs text-slate-600">Selected</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="font-semibold text-slate-900">Partial Dispute</p>
          <p className="mt-1 text-xs text-slate-500">Unselected</p>
        </div>
      </div>
    </div>
  );
}

function Step5Mock() {
  return (
    <div className="space-y-4 p-4 text-left md:p-6">
      <h3 className="text-lg font-bold text-slate-900">Step 5 — Summary</h3>
      <div className="rounded-lg bg-gray-50 p-3 text-xs">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div>
            <p className="text-slate-500">Insured</p>
            <p className="font-medium text-slate-800">Demo Insured</p>
          </div>
          <div>
            <p className="text-slate-500">Policy</p>
            <p className="font-medium text-slate-800">DEMO-POL-001</p>
          </div>
          <div>
            <p className="text-slate-500">Claim</p>
            <p className="font-medium text-slate-800">DEMO-CLM-9921</p>
          </div>
        </div>
      </div>
      <div className="rounded-lg bg-slate-50 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <p className="text-lg font-bold text-slate-800">$18,200</p>
            <p className="text-xs text-slate-500">Carrier</p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-600">$18,000–$22,022</p>
            <p className="text-xs text-slate-500">Range</p>
          </div>
          <div>
            <p className="text-lg font-bold text-green-600">$1,811</p>
            <p className="text-xs text-slate-500">Gap</p>
          </div>
        </div>
      </div>
      <ul className="list-disc pl-5 text-sm text-slate-800">
        <li>Starter strip</li>
        <li>Flashing</li>
      </ul>
      <p className="text-sm text-slate-700">
        Comparison: carrier <strong>$9,200</strong> vs contractor{" "}
        <strong>$13,145</strong> — gap <strong>$3,945</strong>
      </p>
      <div className="flex flex-wrap gap-2">
        <span className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold">
          Download PDF
        </span>
        <span className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold">
          Download Word
        </span>
      </div>
    </div>
  );
}

function Step6Mock() {
  const types = [
    "Supplement Demand Letter",
    "Reinspection Request",
    "Appraisal Notice",
    "Formal Dispute",
    "Custom / Other",
  ];
  return (
    <div className="space-y-4 p-4 text-left md:p-6">
      <h3 className="text-lg font-bold text-slate-900">Step 6 — Letter</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {types.map((t) => (
          <div
            key={t}
            className={`rounded-lg border p-2 text-center text-[10px] font-medium leading-tight sm:text-xs ${
              t === "Supplement Demand Letter"
                ? "border-2 border-blue-500 bg-blue-50 text-blue-900"
                : "border border-slate-200 bg-white text-slate-600"
            }`}
          >
            {t}
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-[10px] leading-relaxed text-slate-700 sm:text-xs">
        <p className="font-bold text-slate-900">BACKGROUND</p>
        <p className="mt-2">
          Re: Claim <span className="text-blue-700">[CLAIM NUMBER]</span> — Insured{" "}
          <span className="text-blue-700">[INSURED NAME]</span>
        </p>
        <p className="mt-2 text-slate-600">
          Please find enclosed our supplement request regarding the above-referenced loss…
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold">
          Copy
        </span>
        <span className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold">
          Download PDF
        </span>
        <span className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold">
          Download Word
        </span>
      </div>
    </div>
  );
}

function StepContent({ step }: { step: number }) {
  switch (step) {
    case 1:
      return <Step1Mock />;
    case 2:
      return <Step2Mock />;
    case 3:
      return <Step3Mock />;
    case 4:
      return <Step4Mock />;
    case 5:
      return <Step5Mock />;
    case 6:
      return <Step6Mock />;
    default:
      return null;
  }
}

export default function WizardPreview() {
  const [active, setActive] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);
  const [progressKey, setProgressKey] = useState(0);
  const hoverRef = useRef(false);

  const advance = useCallback(() => {
    setFadeIn(false);
    window.setTimeout(() => {
      setActive((s) => (s + 1) % 6);
      setFadeIn(true);
      setProgressKey((k) => k + 1);
    }, 300);
  }, []);

  const selectStep = useCallback((index: number) => {
    setFadeIn(false);
    window.setTimeout(() => {
      setActive(index);
      setFadeIn(true);
      setProgressKey((k) => k + 1);
    }, 300);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (hoverRef.current) return;
      advance();
    }, STEP_MS);
    return () => clearInterval(id);
  }, [active, progressKey, advance]);

  const onFrameEnter = () => {
    hoverRef.current = true;
  };
  const onFrameLeave = () => {
    hoverRef.current = false;
  };

  const stepNum = active + 1;

  return (
    <section className="relative left-1/2 mb-20 w-screen -translate-x-1/2 bg-[#0F172A] px-4 py-16 md:px-8 md:py-20">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes erp-wizard-progress-fill {
            from { transform: scaleX(0); }
            to { transform: scaleX(1); }
          }
          .erp-wizard-progress-track {
            transform-origin: left;
            animation: erp-wizard-progress-fill 4s linear forwards;
          }
        `,
        }}
      />
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold text-white md:text-4xl">
          See how it works
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-base text-slate-300 md:text-lg">
          Six steps from estimate upload to dispute letter — in minutes
        </p>

        <div className="-mx-1 mt-8 overflow-x-auto pb-1 md:overflow-visible">
          <div className="flex min-w-min flex-nowrap justify-start gap-2 px-1 sm:justify-center md:grid md:min-w-0 md:grid-cols-6 md:gap-2">
          {STEPS.map((s, i) => {
            const isActive = i === active;
            return (
              <div key={s.num} className="relative flex w-[calc((100vw-3rem)/3)] max-w-[9.5rem] shrink-0 flex-col sm:w-auto sm:max-w-none sm:min-w-0 md:w-auto">
                <button
                  type="button"
                  onClick={() => selectStep(i)}
                  className={`w-full whitespace-nowrap rounded-full px-3 py-2 text-center text-xs font-semibold transition sm:text-sm ${
                    isActive
                      ? "bg-[#0F172A] text-white ring-2 ring-blue-400"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                  aria-current={isActive ? "step" : undefined}
                >
                  <span className="tabular-nums">{s.num}</span> {s.short}
                </button>
                {isActive && (
                  <div
                    key={progressKey}
                    className="erp-wizard-progress-track mt-1 h-0.5 w-full rounded-full bg-blue-500"
                    aria-hidden
                  />
                )}
                {!isActive && <div className="mt-1 h-0.5" aria-hidden />}
              </div>
            );
          })}
          </div>
        </div>

        <div
          className="mx-auto mt-8 max-w-4xl"
          onMouseEnter={onFrameEnter}
          onMouseLeave={onFrameLeave}
        >
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg md:min-h-[480px]">
            <BrowserChrome />
            <div
              className={`transition-opacity duration-300 ${
                fadeIn ? "opacity-100" : "opacity-0"
              }`}
            >
              <StepContent step={stepNum} />
            </div>
          </div>
        </div>

        <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-slate-300 md:text-base">
          {DESCRIPTIONS[stepNum]}
        </p>

        <div className="mt-8 flex justify-center px-2">
          <Link
            href="/upload"
            className="inline-flex w-full max-w-md items-center justify-center rounded-lg bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-md transition hover:bg-blue-700 sm:w-auto"
          >
            Run Your First Review →
          </Link>
        </div>
      </div>
    </section>
  );
}
