"use client";

import { useState } from "react";

export function ReRunButton({ reviewId }: { reviewId: string }) {
  const [isReRunning, setIsReRunning] = useState(false);

  async function handleReRun() {
    if (!confirm("Re-run the AI analysis for this review? This may take a minute.")) {
      return;
    }

    setIsReRunning(true);

    try {
      // Re-run the analysis pipeline
      await fetch("/.netlify/functions/compare-estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId }),
      });

      await fetch("/.netlify/functions/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId }),
      });

      alert("Analysis re-run complete! Refresh the page to see updates.");
      window.location.reload();
    } catch (error) {
      console.error("Re-run error:", error);
      alert("Failed to re-run analysis. Please try again.");
    } finally {
      setIsReRunning(false);
    }
  }

  return (
    <button
      onClick={handleReRun}
      disabled={isReRunning}
      className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-100 hover:border-slate-500 hover:text-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isReRunning ? "Re-running..." : "Re-run Analysis"}
    </button>
  );
}

