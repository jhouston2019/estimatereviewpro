import type Stripe from "stripe";
import { PLAN_CONFIG, type BillablePlanType } from "@/lib/billing/planLimits";

/** Plans sold via /api/create-checkout-session */
export type CheckoutPlanType = Extract<
  BillablePlanType,
  "single" | "essential" | "professional" | "enterprise"
>;

/** Env keys tried in order (supports legacy Stripe product names). */
export const CHECKOUT_PLAN_PRICE_ENV_KEYS: Record<
  CheckoutPlanType,
  readonly string[]
> = {
  single: ["STRIPE_PRICE_SINGLE_REVIEW", "STRIPE_PRICE_INDIVIDUAL_149"],
  essential: ["STRIPE_PRICE_ESSENTIAL", "STRIPE_PRICE_FIRM_499"],
  professional: ["STRIPE_PRICE_PROFESSIONAL"],
  enterprise: ["STRIPE_PRICE_ENTERPRISE", "STRIPE_PRICE_PRO_1499"],
};

export function isCheckoutPlanType(
  value: string
): value is CheckoutPlanType {
  return value in CHECKOUT_PLAN_PRICE_ENV_KEYS;
}

export function resolveStripePriceId(
  planType: CheckoutPlanType
): { priceId: string; envKey: string } | null {
  for (const envKey of CHECKOUT_PLAN_PRICE_ENV_KEYS[planType]) {
    const priceId = process.env[envKey]?.trim();
    if (priceId) return { priceId, envKey };
  }
  return null;
}

export function missingPriceEnvHint(planType: CheckoutPlanType): string {
  const keys = CHECKOUT_PLAN_PRICE_ENV_KEYS[planType].join(" or ");
  return `Set ${keys}=price_… in Netlify environment variables (Stripe Dashboard → Products → Price ID), then redeploy.`;
}

export function formatUsdFromCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export type PlanPriceDisplay = {
  planType: CheckoutPlanType;
  displayName: string;
  amountCents: number;
  amountFormatted: string;
  suffix: string;
  interval: Stripe.Price.Recurring.Interval | null;
};

export function planPriceFromStripe(
  planType: CheckoutPlanType,
  price: Stripe.Price
): PlanPriceDisplay {
  const amountCents = price.unit_amount ?? 0;
  const interval = price.recurring?.interval ?? null;
  const config = PLAN_CONFIG[planType];

  return {
    planType,
    displayName: config.displayName,
    amountCents,
    amountFormatted: formatUsdFromCents(amountCents),
    suffix:
      config.billingCadence === "one_time" ? "(one-time)" : `/${interval ?? "month"}`,
    interval,
  };
}

export function buildCheckoutSessionParams(
  planType: CheckoutPlanType,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Stripe.Checkout.SessionCreateParams {
  const config = PLAN_CONFIG[planType];
  const reviewLimit = String(config.reviewsPerPeriod);

  const baseMetadata = {
    plan_type: planType,
    plan_name: config.displayName,
    reviews_limit: reviewLimit,
  };

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    { price: priceId, quantity: 1 },
  ];

  if (planType === "single") {
    return {
      mode: "payment",
      customer_creation: "always",
      payment_method_types: ["card"],
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: baseMetadata,
    };
  }

  return {
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: lineItems,
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: {
        plan_type: planType,
        plan_name: config.displayName,
        review_limit: reviewLimit,
        overage_price: "0",
      },
    },
    metadata: baseMetadata,
  };
}
