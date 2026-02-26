'use client';

import { useState } from 'react';

interface ExportControlsProps {
  reportId: string;
}

export default function ExportControls({ reportId }: ExportControlsProps) {
  const [reportType, setReportType] = useState<string>('FULL');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleGenerate = async (format: 'pdf' | 'excel' | 'csv') => {
    setIsGenerating(true);
    try {
      const url = `/api/reports/${reportId}/export?format=${format}&type=${reportType}`;
      window.open(url, '_blank');
    } finally {
      setTimeout(() => setIsGenerating(false), 1000);
    }
  };
  
  const handleExportAll = () => {
    const url = `/api/reports/${reportId}/export?format=pdf&type=ALL`;
    window.open(url, '_blank');
  };
  
  return (
    <div className="flex items-center gap-3">
      {/* Report Format Selector */}
      <div className="flex items-center gap-2">
        <label htmlFor="report-type" className="text-xs font-medium text-slate-400">
          Format:
        </label>
        <select
          id="report-type"
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="NEGOTIATION">Negotiation Brief</option>
          <option value="PUSHBACK">Pushback Response</option>
          <option value="APPRAISAL">Appraisal Exhibit</option>
          <option value="FULL">Full Enforcement Report</option>
        </select>
      </div>
      
      {/* Export Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleGenerate('pdf')}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/50 px-4 py-2 text-xs font-medium text-slate-200 hover:border-blue-500 hover:bg-blue-500/10 hover:text-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Download as PDF/HTML"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          PDF
        </button>
        <button
          onClick={() => handleGenerate('excel')}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/50 px-4 py-2 text-xs font-medium text-slate-200 hover:border-green-500 hover:bg-green-500/10 hover:text-green-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Download as Excel"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Excel
        </button>
        <button
          onClick={() => handleGenerate('csv')}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/50 px-4 py-2 text-xs font-medium text-slate-200 hover:border-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Download as CSV"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          CSV
        </button>
      </div>
      
      {/* Export All Button */}
      <button
        onClick={handleExportAll}
        className="inline-flex items-center gap-2 rounded-full border border-emerald-700 bg-emerald-900/30 px-4 py-2 text-xs font-semibold text-emerald-300 hover:border-emerald-500 hover:bg-emerald-500/20 hover:text-emerald-200 transition-colors"
        title="Export all formats as ZIP bundle"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        Export All (ZIP)
      </button>
      
      {/* Print Button */}
      <button
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/50 px-4 py-2 text-xs font-medium text-slate-200 hover:border-purple-500 hover:bg-purple-500/10 hover:text-purple-300 transition-colors"
        title="Print this report"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        Print
      </button>
    </div>
  );
}
