"use client";

import { marketingStartingAtLabel } from "@/lib/billing/marketingPlanPricing";

export function StartingAtPrice() {
  return (
    <span className="text-sm text-slate-400">
      {marketingStartingAtLabel()}
    </span>
  );
}
