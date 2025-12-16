"use client";

import { useState } from "react";

export function PortalButton({ userId }: { userId: string }) {
  const [isLoading, setIsLoading] = useState(false);

  async function handlePortal() {
    setIsLoading(true);

    try {
      const response = await fetch("/.netlify/functions/create-portal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          returnUrl: `${window.location.origin}/account`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to open billing portal");
      }

      // Redirect to Stripe Portal
      window.location.href = data.url;
    } catch (error: any) {
      console.error("Portal error:", error);
      alert(error.message || "Failed to open billing portal");
      setIsLoading(false);
    }
  }

  return (
    <button
      onClick={handlePortal}
      disabled={isLoading}
      className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-100 hover:border-slate-500 hover:text-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isLoading ? "Loading..." : "Manage Billing"}
    </button>
  );
}

