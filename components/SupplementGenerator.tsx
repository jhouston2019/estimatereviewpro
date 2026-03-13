"use client";

import { useState } from 'react';
import { generateSupplementRequest, type SupplementInput } from '@/lib/supplementGenerator';

interface SupplementGeneratorProps {
  reportData: {
    missingItems?: any[];
    quantityIssues?: any[];
    pricingObservations?: any[];
    vertical?: string;
    propertyDetails?: {
      claim_number?: string;
      address?: string;
      date_of_loss?: string;
      adjuster?: string;
    };
  };
}

export default function SupplementGenerator({ reportData }: SupplementGeneratorProps) {
  const [showSupplement, setShowSupplement] = useState(false);
  const [supplementText, setSupplementText] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerateSupplement = () => {
    // Transform report data into supplement input format
    const input: SupplementInput = {
      vertical: reportData.vertical,
      claimNumber: reportData.propertyDetails?.claim_number,
      propertyAddress: reportData.propertyDetails?.address,
      dateOfLoss: reportData.propertyDetails?.date_of_loss,
      insuranceCarrier: reportData.propertyDetails?.adjuster,
      missingScope: reportData.missingItems?.map(item => ({
        category: item.category || item.trade || 'Unknown',
        description: item.description || item.finding || '',
        estimatedValue: item.estimated_value || 0
      })) || [],
      quantityDiscrepancies: reportData.quantityIssues?.map(item => ({
        item: item.category || item.item || 'Unknown',
        currentQuantity: item.current_quantity || 0,
        expectedQuantity: item.expected_quantity || 0,
        unit: item.unit || 'units',
        discrepancyAmount: item.estimated_cost || 0
      })) || [],
      pricingSuppression: reportData.pricingObservations?.map(item => ({
        category: item.category || 'Pricing',
        description: item.description || item.observation || '',
        percentBelow: item.percent_below_market || 0,
        estimatedShortfall: item.estimated_shortfall || 0
      })) || []
    };

    const supplement = generateSupplementRequest(input);
    setSupplementText(supplement.text);
    setShowSupplement(true);
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(supplementText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([supplementText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supplement-request-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 shadow-lg">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-slate-50">Supplement Request Generator</h2>
        <p className="mt-2 text-xs text-slate-400">
          Generate a formatted supplement request based on the analysis findings to submit to your insurance carrier.
        </p>
      </div>

      {!showSupplement ? (
        <button
          onClick={handleGenerateSupplement}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Generate Supplement Request
        </button>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
            <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono overflow-x-auto max-h-96 overflow-y-auto">
              {supplementText}
            </pre>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCopyToClipboard}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700 transition"
            >
              {copied ? (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy to Clipboard
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700 transition"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download as TXT
            </button>

            <button
              onClick={() => setShowSupplement(false)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition"
            >
              Close
            </button>
          </div>

          <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3">
            <p className="text-xs text-blue-300">
              <strong>Next Steps:</strong> Copy this supplement request and submit it to your insurance carrier via email or your claims portal. Keep a copy for your records and follow up if you don't receive a response within 7-10 business days.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
