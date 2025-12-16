"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

export function DownloadPDFButton({ pdfUrl, compact = false }: { pdfUrl: string; compact?: boolean }) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      
      // Extract the file path from the full URL
      const urlParts = pdfUrl.split("/review-pdfs/");
      if (urlParts.length < 2) {
        // Fallback to direct link if not in expected format
        window.open(pdfUrl, "_blank");
        setLoading(false);
        return;
      }
      
      const filePath = urlParts[1];
      
      // Create signed URL (valid for 1 hour)
      const { data, error } = await supabase.storage
        .from("review-pdfs")
        .createSignedUrl(filePath, 3600);

      if (error || !data) {
        // Fallback to direct link
        window.open(pdfUrl, "_blank");
      } else {
        window.open(data.signedUrl, "_blank");
      }
    } catch (err) {
      console.error("PDF download error:", err);
      // Fallback to direct link
      window.open(pdfUrl, "_blank");
    } finally {
      setLoading(false);
    }
  }

  if (compact) {
    return (
      <button
        onClick={handleDownload}
        disabled={loading}
        className="text-[11px] font-semibold text-slate-200 hover:text-slate-50 disabled:opacity-50"
      >
        {loading ? "Loading..." : "Download PDF"}
      </button>
    );
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-sky-400 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md shadow-amber-500/40 hover:brightness-105 disabled:opacity-50"
    >
      {loading ? "Loading..." : "Download PDF Report"}
    </button>
  );
}

