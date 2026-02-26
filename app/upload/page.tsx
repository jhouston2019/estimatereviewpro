"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function PaymentSuccessHandler({ onSuccess }: { onSuccess: (success: boolean) => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      if (searchParams?.get('payment') === 'success') {
        const sessionId = searchParams.get('session_id');
        
        if (sessionId) {
          try {
            // Verify payment and get login link
            const response = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId }),
            });

            const data = await response.json();

            if (data.success && data.loginUrl) {
              // Auto-login the user
              window.location.href = data.loginUrl;
              return;
            }
          } catch (error) {
            console.error('Payment verification failed:', error);
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
  const [step, setStep] = useState<"upload" | "processing" | "results">("upload");
  const [estimateText, setEstimateText] = useState("");
  const [estimateType, setEstimateType] = useState("");
  const [damageType, setDamageType] = useState("");
  const [platform, setPlatform] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  // Claim/Project information fields
  const [claimNumber, setClaimNumber] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [dateOfLoss, setDateOfLoss] = useState("");
  const [insuranceCarrier, setInsuranceCarrier] = useState("");
  const [reportId, setReportId] = useState<string | null>(null);

  return (
    <div className="flex min-h-screen flex-col bg-[#0F172A]">
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
            <Link href="/pricing" className="text-slate-200 hover:text-white transition">
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

      <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col px-6 py-12">
        {paymentSuccess && (
          <div className="mb-6 rounded-lg border border-emerald-500/50 bg-emerald-950/30 p-4 text-center">
            <p className="text-base font-semibold text-emerald-300">
              Payment successful! You can now upload your estimate for review.
            </p>
          </div>
        )}
        
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
            claimNumber={claimNumber}
            setClaimNumber={setClaimNumber}
            propertyAddress={propertyAddress}
            setPropertyAddress={setPropertyAddress}
            dateOfLoss={dateOfLoss}
            setDateOfLoss={setDateOfLoss}
            insuranceCarrier={insuranceCarrier}
            setInsuranceCarrier={setInsuranceCarrier}
            onSubmit={(id: string) => {
              setReportId(id);
              setStep("processing");
            }}
          />
        )}

        {step === "processing" && (
          <ProcessingState 
            reportId={reportId}
            onComplete={() => setStep("results")} 
          />
        )}

        {step === "results" && (
          <ResultsView reportId={reportId} />
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
  claimNumber,
  setClaimNumber,
  propertyAddress,
  setPropertyAddress,
  dateOfLoss,
  setDateOfLoss,
  insuranceCarrier,
  setInsuranceCarrier,
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
  claimNumber: string;
  setClaimNumber: (v: string) => void;
  propertyAddress: string;
  setPropertyAddress: (v: string) => void;
  dateOfLoss: string;
  setDateOfLoss: (v: string) => void;
  insuranceCarrier: string;
  setInsuranceCarrier: (v: string) => void;
  onSubmit: (reportId: string) => void;
}) {
  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Get user from Supabase
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Please log in to submit an estimate');
        setIsSubmitting(false);
        return;
      }
      
      // Call API with claim/project information
      const response = await fetch('/api/create-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          estimateName: 'Estimate Review',
          estimateType: estimateType || 'insurance_claim',
          damageType: damageType || 'water',
          estimateText,
          // Claim/Project information
          claimNumber: claimNumber || '',
          propertyAddress: propertyAddress || '',
          dateOfLoss: dateOfLoss || '',
          insuranceCarrier: insuranceCarrier || '',
          platform: platform || 'UNKNOWN'
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create review');
      }
      
      // Pass report ID to parent
      onSubmit(result.reportId);
      
    } catch (err: any) {
      console.error('Submit error:', err);
      setError(err.message || 'Failed to submit estimate');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold text-white">
          Run Structured Estimate Review
        </h1>
        <p className="text-lg text-slate-400 max-w-3xl mx-auto">
          Upload or paste estimate line items. The engine analyzes structure, scope, and quantity consistency.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Add Estimate */}
        <div className="rounded-lg border border-slate-800 bg-[#F8FAFC] p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Step 1 – Add Estimate
            </h2>
          </div>

          <div className="space-y-6">
            {/* Drag & Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative rounded-lg border-2 border-dashed p-12 text-center transition ${
                dragActive
                  ? "border-[#2563EB] bg-blue-50"
                  : "border-slate-300 bg-white hover:border-slate-400"
              }`}
            >
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
                  <svg className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">
                    Drag & drop estimate file
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Supports: PDF, DOCX, TXT • Max size: 10MB
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
              <label htmlFor="estimateText" className="block text-base font-semibold text-slate-900 mb-3">
                Paste estimate text below
              </label>
              <textarea
                id="estimateText"
                value={estimateText}
                onChange={(e) => setEstimateText(e.target.value)}
                rows={10}
                placeholder="Paste your estimate here...

Example:
DRY - Remove damaged drywall - 200 SF
DRY - Install new drywall - 200 SF
PNT - Paint walls - 200 SF"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder-slate-400 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Claim/Project Information */}
        <div className="rounded-lg border border-slate-800 bg-[#F8FAFC] p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Step 2 – Claim/Project Information
            </h2>
            <p className="text-sm text-slate-600">
              Optional but recommended for report watermarks and identification
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="claimNumber" className="block text-base font-semibold text-slate-900 mb-3">
                Claim/Project Number
              </label>
              <input
                type="text"
                id="claimNumber"
                value={claimNumber}
                onChange={(e) => setClaimNumber(e.target.value)}
                placeholder="e.g., WD-2024-8847 or PROJECT-001"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder-slate-400 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
              />
            </div>

            <div>
              <label htmlFor="insuranceCarrier" className="block text-base font-semibold text-slate-900 mb-3">
                Insurance Carrier / Client Name
              </label>
              <input
                type="text"
                id="insuranceCarrier"
                value={insuranceCarrier}
                onChange={(e) => setInsuranceCarrier(e.target.value)}
                placeholder="e.g., State Farm or ABC Construction"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder-slate-400 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
              />
            </div>

            <div>
              <label htmlFor="propertyAddress" className="block text-base font-semibold text-slate-900 mb-3">
                Property/Project Address
              </label>
              <input
                type="text"
                id="propertyAddress"
                value={propertyAddress}
                onChange={(e) => setPropertyAddress(e.target.value)}
                placeholder="e.g., 123 Main St, City, ST 12345"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder-slate-400 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
              />
            </div>

            <div>
              <label htmlFor="dateOfLoss" className="block text-base font-semibold text-slate-900 mb-3">
                Date of Loss / Project Date
              </label>
              <input
                type="date"
                id="dateOfLoss"
                value={dateOfLoss}
                onChange={(e) => setDateOfLoss(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Classification */}
        <div className="rounded-lg border border-slate-800 bg-[#F8FAFC] p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Step 3 – Classification
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <label htmlFor="estimateType" className="block text-base font-semibold text-slate-900 mb-3">
                Estimate Type
              </label>
              <select
                id="estimateType"
                value={estimateType}
                onChange={(e) => setEstimateType(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
              >
                <option value="">Select type</option>
                <option value="RESIDENTIAL">Residential Property</option>
                <option value="COMMERCIAL">Commercial Property</option>
                <option value="AUTO">Auto</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="damageType" className="block text-base font-semibold text-slate-900 mb-3">
                Damage Type
              </label>
              <select
                id="damageType"
                value={damageType}
                onChange={(e) => setDamageType(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
              >
                <option value="">Select damage</option>
                <option value="FIRE">Fire</option>
                <option value="WATER">Water</option>
                <option value="WIND_HAIL">Wind/Hail</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="platform" className="block text-base font-semibold text-slate-900 mb-3">
                Platform (Optional)
              </label>
              <select
                id="platform"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
              >
                <option value="">Auto-detect</option>
                <option value="XACTIMATE">Xactimate</option>
                <option value="SYMBILITY">Symbility</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-lg border border-red-500/50 bg-red-950/30 p-4 text-center">
            <p className="text-base font-semibold text-red-300">
              {error}
            </p>
          </div>
        )}

        {/* Primary Button */}
        <div className="text-center space-y-4">
          <button
            type="submit"
            disabled={isSubmitting || !estimateText}
            className="inline-flex items-center justify-center rounded-lg bg-[#2563EB] px-12 py-4 text-lg font-semibold text-white hover:bg-[#1E40AF] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Run Review'}
          </button>
          <p className="text-sm text-slate-400">
            Structured findings only. No advisory or legal interpretation.
          </p>
        </div>
      </form>
    </div>
  );
}

function ProcessingState({ onComplete }: { onComplete: () => void }) {
  const [currentMessage, setCurrentMessage] = useState(0);
  
  const messages = [
    "Parsing line items…",
    "Checking quantity consistency…",
    "Identifying scope gaps…",
    "Finalizing structured findings…",
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
    }, 1000);

    return () => clearInterval(interval);
  });

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="text-center space-y-8 max-w-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-800 border-t-[#2563EB]"></div>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-white">
            Analyzing Estimate
          </h2>
          <p className="text-xl text-[#2563EB] font-medium min-h-[32px]">
            {messages[currentMessage]}
          </p>
        </div>
      </div>
    </div>
  );
}

function ResultsView() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold text-white">
          Structured Findings
        </h1>
      </div>

      {/* Top Summary Row - 4 Metric Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <MetricCard title="Line Items Reviewed" value="24" />
        <MetricCard title="Missing Categories Detected" value="3" color="warning" />
        <MetricCard title="Quantity Inconsistencies" value="2" color="error" />
        <MetricCard title="Structural Flags" value="5" color="primary" />
      </div>

      {/* Tabbed Results */}
      <div className="rounded-lg border border-slate-800 bg-[#F8FAFC] overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-slate-200 bg-white px-6">
          <nav className="flex gap-8">
            {["overview", "missing", "quantity", "structural"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 px-1 py-4 text-base font-semibold transition ${
                  activeTab === tab
                    ? "border-[#2563EB] text-[#2563EB]"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab === "overview" && "Overview"}
                {tab === "missing" && "Missing Items"}
                {tab === "quantity" && "Quantity Issues"}
                {tab === "structural" && "Structural Gaps"}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-8 space-y-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  Summary
                </h3>
                <p className="text-base text-slate-700 leading-relaxed">
                  The review identified discrepancies between listed scope and detected category structure. Missing and inconsistent items are detailed below.
                </p>
              </div>
            </div>
          )}

          {activeTab === "missing" && (
            <div className="space-y-4">
              <FindingRow
                category="PNT (Paint)"
                description="Drywall installation detected without paint trade"
                severity="warning"
              />
              <FindingRow
                category="INS (Insulation)"
                description="Not detected for water loss type"
                severity="warning"
              />
              <FindingRow
                category="CLN (Cleaning)"
                description="Not detected for water loss type"
                severity="warning"
              />
            </div>
          )}

          {activeTab === "quantity" && (
            <div className="space-y-4">
              <FindingRow
                category="FLR - Flooring"
                description="Removal detected without reinstallation"
                severity="error"
              />
              <FindingRow
                category="Line item zero quantity"
                description="Zero quantity but includes labor description"
                severity="error"
              />
            </div>
          )}

          {activeTab === "structural" && (
            <div className="space-y-4">
              <FindingRow
                category="Trade absence"
                description="Expected trades not detected for damage type"
                severity="primary"
              />
            </div>
          )}
        </div>
      </div>

      {/* Export Section */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-8 text-center space-y-6">
        <h3 className="text-2xl font-bold text-white">
          Export Structured Report
        </h3>
        <p className="text-lg text-slate-300">
          Create account to download and save reports.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-lg bg-[#2563EB] px-8 py-3 text-base font-semibold text-white hover:bg-[#1E40AF] transition"
          >
            Create Account
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-8 py-3 text-base font-semibold text-slate-200 hover:border-slate-500 hover:text-white transition"
          >
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, color = "default" }: { title: string; value: string; color?: "default" | "warning" | "error" | "primary" }) {
  const colorClasses = {
    default: "text-slate-900",
    warning: "text-[#F59E0B]",
    error: "text-[#DC2626]",
    primary: "text-[#2563EB]",
  };

  return (
    <div className="rounded-lg border border-slate-800 bg-[#F8FAFC] p-6">
      <p className="text-sm font-medium uppercase tracking-wider text-slate-600 mb-2">
        {title}
      </p>
      <p className={`text-4xl font-bold ${colorClasses[color]}`}>
        {value}
      </p>
    </div>
  );
}

function FindingRow({ category, description, severity }: { category: string; description: string; severity: "warning" | "error" | "primary" }) {
  const severityClasses = {
    warning: "border-[#F59E0B] bg-amber-50",
    error: "border-[#DC2626] bg-rose-50",
    primary: "border-[#2563EB] bg-blue-50",
  };

  const severityTextClasses = {
    warning: "text-amber-900",
    error: "text-rose-900",
    primary: "text-blue-900",
  };

  return (
    <div className={`rounded-lg border-2 ${severityClasses[severity]} p-6`}>
      <h4 className={`text-lg font-bold ${severityTextClasses[severity]} mb-2`}>
        {category}
      </h4>
      <p className={`text-base ${severityTextClasses[severity]}`}>
        {description}
      </p>
    </div>
  );
}
