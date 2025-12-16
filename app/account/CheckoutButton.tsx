"use client";

import { useState } from "react";

export function CheckoutButton({
  userId,
  priceType,
}: {
  userId: string;
  priceType: "oneoff" | "pro";
}) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleCheckout() {
    setIsLoading(true);

    try {
      const response = await fetch("/.netlify/functions/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          priceType,
          successUrl: `${window.location.origin}/dashboard?payment=success`,
          cancelUrl: `${window.location.origin}/account?payment=cancelled`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout");
      }

      // Redirect to Stripe Checkout
      window.location.href = data.sessionUrl;
    } catch (error: any) {
      console.error("Checkout error:", error);
      alert(error.message || "Failed to start checkout");
      setIsLoading(false);
    }
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={isLoading}
      className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-sky-400 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md shadow-amber-500/40 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isLoading ? "Loading..." : priceType === "pro" ? "Upgrade Now" : "Purchase"}
    </button>
  );
}

