import type { CheckoutPlanType, PlanPriceDisplay } from "@/lib/billing/stripePlanPrices";
import { formatUsdFromCents } from "@/lib/billing/stripePlanPrices";
import { PLAN_CONFIG } from "@/lib/billing/planLimits";

/** Approved public marketing prices — keep in sync with static HTML in public/ when edited manually. */
export const MARKETING_PLAN_PRICES = {
  single: {
    amountCents: 4900,
    displayAmount: "$49",
    billingLabel: "one-time",
    reviewsPerPeriod: 1,
    featureLine: "1 estimate review",
  },
  essential: {
    amountCents: 39900,
    displayAmount: "$399",
    billingLabel: "month",
    reviewsPerPeriod: 10,
    featureLine: "10 reviews per month, unused roll over",
  },
  professional: {
    amountCents: 69900,
    displayAmount: "$699",
    billingLabel: "month",
    reviewsPerPeriod: 20,
    featureLine: "20 reviews per month, unused roll over",
  },
  enterprise: {
    amountCents: 149900,
    displayAmount: "$1,499",
    billingLabel: "month",
    reviewsPerPeriod: 50,
    featureLine: "50 reviews per month, unused roll over",
  },
} as const;

export type MarketingCheckoutPlan = keyof typeof MARKETING_PLAN_PRICES;

export function marketingSinglePriceUsd(): number {
  return MARKETING_PLAN_PRICES.single.amountCents / 100;
}

/** Map dashboard/API plan display names to marketing cost in USD (for ROI display only). */
export function marketingPlanCostUsd(planDisplayName: string): number {
  const normalized = planDisplayName.trim().toLowerCase();
  const key = normalized.replace(/\s+review$/, "") as MarketingCheckoutPlan;
  const marketing = MARKETING_PLAN_PRICES[key as MarketingCheckoutPlan];
  if (marketing) return marketing.amountCents / 100;
  if (normalized.includes("single")) return marketingSinglePriceUsd();
  if (normalized.includes("essential")) {
    return MARKETING_PLAN_PRICES.essential.amountCents / 100;
  }
  if (normalized.includes("professional") || normalized.includes("premier")) {
    return MARKETING_PLAN_PRICES.professional.amountCents / 100;
  }
  if (normalized.includes("enterprise")) {
    return MARKETING_PLAN_PRICES.enterprise.amountCents / 100;
  }
  return marketingSinglePriceUsd();
}

export function marketingPlanPriceDisplays(): Record<
  CheckoutPlanType,
  PlanPriceDisplay
> {
  const plans: CheckoutPlanType[] = [
    "single",
    "essential",
    "professional",
    "enterprise",
  ];
  const out = {} as Record<CheckoutPlanType, PlanPriceDisplay>;

  for (const planType of plans) {
    const marketing = MARKETING_PLAN_PRICES[planType];
    const config = PLAN_CONFIG[planType];
    const isOneTime = planType === "single";

    out[planType] = {
      planType,
      displayName: config.displayName,
      amountCents: marketing.amountCents,
      amountFormatted: formatUsdFromCents(marketing.amountCents),
      suffix: isOneTime ? "(one-time)" : "/month",
      interval: isOneTime ? null : "month",
    };
  }

  return out;
}

export function marketingStartingAtLabel(): string {
  const single = MARKETING_PLAN_PRICES.single;
  return `Starting at ${single.displayAmount} • Multiple plans available`;
}

export type SeoFaqServiceKind =
  | "review"
  | "validation"
  | "audit"
  | "dispute"
  | "guide"
  | "comparison"
  | "supplement";

export type SeoFaqAudience =
  | "homeowners"
  | "contractors"
  | "property associations";

const SEO_SERVICE_INTRO: Record<SeoFaqServiceKind, string> = {
  review: "Single estimate review costs",
  validation: "Single estimate validation costs",
  audit: "Single estimate audit costs",
  dispute: "Single estimate dispute costs",
  guide: "Single estimate guide costs",
  comparison: "Single estimate comparison costs",
  supplement: "Single estimate supplement costs",
};

/** Standard SEO FAQ answer for pricing questions on landing pages. */
export function seoFaqPricingAnswer(
  service: SeoFaqServiceKind,
  audience: SeoFaqAudience = "homeowners"
): string {
  const { single, essential, professional, enterprise } = MARKETING_PLAN_PRICES;
  const intro = `${SEO_SERVICE_INTRO[service]} ${single.displayAmount} one-time for 1 estimate review, including complete analysis and a professional PDF report.`;
  const plans = `Subscription plans: Essential ${essential.displayAmount}/month (${essential.featureLine}), Professional ${professional.displayAmount}/month (${professional.featureLine}), and Enterprise ${enterprise.displayAmount}/month (${enterprise.featureLine}).`;
  const audienceClause =
    audience === "property associations"
      ? "For property associations handling multiple claims"
      : audience === "contractors"
        ? "For contractors handling multiple claims"
        : "For homeowners handling multiple claims";

  return `${intro} ${plans} ${audienceClause}—such as public adjusters, contractors, or property managers—our subscription plans offer better value than one-off reviews when you need ongoing volume. Compared to hiring a public adjuster (typically 10-15% of the settlement), our service provides significant cost savings while delivering comprehensive analysis.`;
}

/** Static HTML landings (public/*.html) — mirror MARKETING_PLAN_PRICES.single.displayAmount. */
export const STATIC_HTML_SINGLE_PRICE_HEADLINE =
  MARKETING_PLAN_PRICES.single.displayAmount;

export const STATIC_HTML_SINGLE_PRICE_NOTE = `${MARKETING_PLAN_PRICES.single.displayAmount} one-time • 1 estimate review • No subscription`;
