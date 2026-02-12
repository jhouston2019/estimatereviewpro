"use client";

import Link from "next/link";
import { useState } from "react";

export default function UploadPage() {
  const [step, setStep] = useState<"upload" | "processing" | "results">("upload");
  const [estimateText, setEstimateText] = useState("");
  const [estimateType, setEstimateType] = useState("");
  const [damageType, setDamageType] = useState("");
  const [platform, setPlatform] = useState("");

  return (
    <div className="flex min-h-screen flex-col bg-[#0F172A]">
      <header className="border-b border-slate-800/50 bg-[#0F172A]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2563EB] shadow-lg shadow-[#2563EB]/30">
              <span className="text-sm font-black text-white">ER</span>
            </div>
            <span className="text-sm font-semibold text-white">
              Estimate Review Pro
            </span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-slate-200">
            <Link
              href="/pricing"
              className="hover:text-white transition"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-slate-500 hover:text-white transition"
            >
              Log in
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 py-12">
        {step === "upload" && (
          <UploadForm
            estimateText={estimateText}
            setEstimateText={setEstimateText}
            estimateType={estimateType}
            setEstimateType={setEstimateType}
            damageType={damageType}
            setDamageType={setDamageType}
            platform={platform}
            setPlatform={setPlatform}
            onSubmit={() => setStep("processing")}
          />
        )}

        {step === "processing" && (
          <ProcessingState onComplete={() => setStep("results")} />
        )}

        {step === "results" && (
          <ResultsView />
        )}
      </main>
    </div>
  );
}

function UploadForm({
  estimateText,
  setEstimateText,
  estimateType,
  setEstimateType,
  damageType,
  setDamageType,
  platform,
  setPlatform,
  onSubmit,
}: {
  estimateText: string;
  setEstimateText: (v: string) => void;
  estimateType: string;
  setEstimateType: (v: string) => void;
  damageType: string;
  setDamageType: (v: string) => void;
  platform: string;
  setPlatform: (v: string) => void;
  onSubmit: () => void;
}) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    // Handle file drop logic here
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#2563EB]/30 bg-[#2563EB]/10 px-4 py-2 text-xs font-medium uppercase tracking-wider text-blue-300">
          New Analysis
        </div>
        <h1 className="text-3xl font-bold text-white">
          Upload Your Estimate
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Paste estimate text or upload a PDF. We'll parse line items and generate structured findings.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Add Estimate */}
        <div className="rounded-2xl border border-slate-800 bg-[#F8FAFC] p-8">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2563EB] text-sm font-bold text-white">
                1
              </div>
              <h2 className="text-xl font-bold text-slate-900">Add Estimate</h2>
            </div>
            <p className="text-sm text-slate-600 ml-11">
              Drag & drop a file or paste estimate text below
            </p>
          </div>

          <div className="space-y-4">
            {/* Drag & Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative rounded-xl border-2 border-dashed p-12 text-center transition ${
                dragActive
                  ? "border-[#2563EB] bg-blue-50"
                  : "border-slate-300 bg-white hover:border-slate-400"
              }`}
            >
              <input
                type="file"
                accept=".pdf,.txt,.csv"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                  <svg className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Drop your file here, or <span className="text-[#2563EB]">browse</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports PDF, TXT, CSV (max 10MB)
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-[#F8FAFC] px-4 text-slate-500 font-medium">OR</span>
              </div>
            </div>

            {/* Paste Text Area */}
            <div>
              <label htmlFor="estimateText" className="block text-sm font-semibold text-slate-900 mb-2">
                Paste Estimate Text
              </label>
              <textarea
                id="estimateText"
                value={estimateText}
                onChange={(e) => setEstimateText(e.target.value)}
                rows={8}
                placeholder="Paste your estimate here...

Example:
DRY - Remove damaged drywall - 200 SF
DRY - Install new drywall - 200 SF
PNT - Paint walls - 200 SF"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Classification */}
        <div className="rounded-2xl border border-slate-800 bg-[#F8FAFC] p-8">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2563EB] text-sm font-bold text-white">
                2
              </div>
              <h2 className="text-xl font-bold text-slate-900">Classification</h2>
            </div>
            <p className="text-sm text-slate-600 ml-11">
              Help us understand your estimate type
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="estimateType" className="block text-sm font-semibold text-slate-900 mb-2">
                Estimate Type <span className="text-rose-500">*</span>
              </label>
              <select
                id="estimateType"
                value={estimateType}
                onChange={(e) => setEstimateType(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
              >
                <option value="">Select estimate type</option>
                <option value="PROPERTY">Property Damage</option>
                <option value="AUTO">Auto/Vehicle Damage</option>
                <option value="COMMERCIAL">Commercial Property</option>
              </select>
            </div>

            <div>
              <label htmlFor="damageType" className="block text-sm font-semibold text-slate-900 mb-2">
                Damage Type <span className="text-rose-500">*</span>
              </label>
              <select
                id="damageType"
                value={damageType}
                onChange={(e) => setDamageType(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
              >
                <option value="">Select damage type</option>
                <option value="WATER">Water Damage</option>
                <option value="FIRE">Fire Damage</option>
                <option value="WIND">Wind/Storm Damage</option>
                <option value="HAIL">Hail Damage</option>
                <option value="COLLISION">Collision (Auto)</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="platform" className="block text-sm font-semibold text-slate-900 mb-2">
                Platform (Optional)
              </label>
              <select
                id="platform"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
              >
                <option value="">Auto-detect</option>
                <option value="XACTIMATE">Xactimate</option>
                <option value="SYMBILITY">Symbility</option>
                <option value="OTHER">Other/Unknown</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 3: Run Review */}
        <div className="rounded-2xl border border-slate-800 bg-[#F8FAFC] p-8">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2563EB] text-sm font-bold text-white">
                3
              </div>
              <h2 className="text-xl font-bold text-slate-900">Run Review</h2>
            </div>
          </div>

          <div className="space-y-6">
            <p className="text-sm text-slate-600">
              This tool generates structured findings only.
            </p>

            <button
              type="submit"
              className="w-full rounded-xl bg-[#2563EB] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-[#2563EB]/40 hover:bg-[#1d4ed8] transition"
            >
              Analyze Estimate
            </button>

            <p className="text-xs text-slate-500 text-center">
              Preview available without login • Full export requires account
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}

function ProcessingState({ onComplete }: { onComplete: () => void }) {
  const [currentMessage, setCurrentMessage] = useState(0);
  
  const messages = [
    "Parsing line items...",
    "Checking structural consistency...",
    "Identifying scope gaps...",
    "Analyzing trade categories...",
    "Finalizing findings...",
  ];

  // Simulate processing
  useState(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => {
        if (prev >= messages.length - 1) {
          clearInterval(interval);
          setTimeout(onComplete, 1000);
          return prev;
        }
        return prev + 1;
      });
    }, 800);

    return () => clearInterval(interval);
  });

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center space-y-8 max-w-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-800 border-t-[#2563EB]"></div>
        </div>
        
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-white">
            Analyzing Your Estimate
          </h2>
          <p className="text-lg text-[#2563EB] font-medium min-h-[28px]">
            {messages[currentMessage]}
          </p>
          <p className="text-sm text-slate-400">
            This typically takes 10-30 seconds
          </p>
        </div>

        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-[#2563EB] h-full transition-all duration-500 ease-out"
            style={{ width: `${((currentMessage + 1) / messages.length) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}

function ResultsView() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-medium uppercase tracking-wider text-emerald-300">
          Analysis Complete
        </div>
        <h1 className="text-3xl font-bold text-white">
          Estimate Analysis Results
        </h1>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-[#F8FAFC] p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-600 mb-2">
            Line Items Reviewed
          </p>
          <p className="text-3xl font-bold text-slate-900">24</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-[#F8FAFC] p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-600 mb-2">
            Missing Categories
          </p>
          <p className="text-3xl font-bold text-[#F59E0B]">3</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-[#F8FAFC] p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-600 mb-2">
            Inconsistencies
          </p>
          <p className="text-3xl font-bold text-[#DC2626]">2</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-[#F8FAFC] p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-600 mb-2">
            Structural Flags
          </p>
          <p className="text-3xl font-bold text-[#2563EB]">5</p>
        </div>
      </div>

      {/* Tabbed Results */}
      <div className="rounded-2xl border border-slate-800 bg-[#F8FAFC] overflow-hidden">
        <div className="border-b border-slate-200 bg-white px-6">
          <nav className="flex gap-8">
            <button className="border-b-2 border-[#2563EB] px-1 py-4 text-sm font-semibold text-[#2563EB]">
              Overview
            </button>
            <button className="border-b-2 border-transparent px-1 py-4 text-sm font-semibold text-slate-600 hover:text-slate-900">
              Missing Items
            </button>
            <button className="border-b-2 border-transparent px-1 py-4 text-sm font-semibold text-slate-600 hover:text-slate-900">
              Quantity Issues
            </button>
            <button className="border-b-2 border-transparent px-1 py-4 text-sm font-semibold text-slate-600 hover:text-slate-900">
              Structural Gaps
            </button>
          </nav>
        </div>

        <div className="p-8 space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-3">
              Estimate Classification
            </h3>
            <div className="space-y-2 text-sm text-slate-700">
              <p><strong>Type:</strong> Property Damage - Water Loss</p>
              <p><strong>Confidence:</strong> 92%</p>
              <p><strong>Platform:</strong> Xactimate (detected)</p>
            </div>
          </div>

          <div className="rounded-lg border border-[#F59E0B] bg-amber-50 p-6">
            <h3 className="text-lg font-bold text-amber-900 mb-3">
              Missing Trade Categories
            </h3>
            <ul className="space-y-2 text-sm text-amber-800">
              <li className="flex items-start gap-2">
                <span>•</span>
                <span><strong>PNT (Paint):</strong> Drywall installation detected without paint trade</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span><strong>INS (Insulation):</strong> Not detected for water loss type</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span><strong>CLN (Cleaning):</strong> Not detected for water loss type</span>
              </li>
            </ul>
          </div>

          <div className="rounded-lg border border-[#DC2626] bg-rose-50 p-6">
            <h3 className="text-lg font-bold text-rose-900 mb-3">
              Structural Inconsistencies
            </h3>
            <ul className="space-y-2 text-sm text-rose-800">
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>FLR - Flooring removal detected without reinstallation</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Line item with zero quantity but includes labor description</span>
              </li>
            </ul>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-3">
              Structured Findings
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              The estimate includes 24 line items across 4 trade categories. Drywall installation is present without paint trade. Flooring removal is detected without replacement. Insulation and cleaning trades are not detected for this water loss type. These observations are structural only and do not constitute recommendations.
            </p>
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="rounded-2xl border-2 border-slate-800 bg-slate-900/50 p-8 text-center backdrop-blur">
        <h3 className="text-xl font-bold text-white mb-3">
          Export Full Report
        </h3>
        <p className="text-slate-300 mb-6">
          Create an account to download the complete analysis as PDF
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-full bg-[#2563EB] px-8 py-3 text-base font-semibold text-white shadow-lg shadow-[#2563EB]/40 hover:bg-[#1d4ed8] transition"
          >
            Create Account & Export
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full border border-slate-700 px-8 py-3 text-base font-semibold text-slate-200 hover:border-slate-500 hover:text-white transition"
          >
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
