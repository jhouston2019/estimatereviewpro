import { createAdminClient } from "./supabase/admin";
import type { Database } from "./database.types";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type UsageTracking = Database["public"]["Tables"]["usage_tracking"]["Row"];

interface UsageInfo {
  reviewsUsed: number;
  includedReviews: number;
  overagePrice: number;
  planType: string;
  canSubmit: boolean;
  message?: string;
}

/**
 * Check if user can submit a review and handle overage billing
 */
export async function checkAndTrackUsage(userId: string): Promise<UsageInfo> {
  const supabase = createAdminClient();

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single<Profile>();

  if (profileError || !profile) {
    throw new Error("Profile not found");
  }

  const planType = profile.plan_type || "individual";
  const includedReviews = profile.included_reviews || 1;
  const overagePrice = profile.overage_price || 0;
  const billingPeriodStart = profile.billing_period_start;

  // For individual plans, check if they've already used their review
  if (planType === "individual") {
    const { data: reviews } = await supabase
      .from("reviews")
      .select("id")
      .eq("user_id", userId);

    const reviewsUsed = reviews?.length || 0;

    if (reviewsUsed >= includedReviews) {
      return {
        reviewsUsed,
        includedReviews,
        overagePrice,
        planType,
        canSubmit: false,
        message: "You have used your included review. Please purchase another review to continue.",
      };
    }

    return {
      reviewsUsed,
      includedReviews,
      overagePrice,
      planType,
      canSubmit: true,
    };
  }

  // For firm/pro plans, check usage tracking
  if (!billingPeriodStart) {
    throw new Error("Billing period not set for subscription plan");
  }

  // Get or create usage tracking record
  let { data: usage } = await supabase
    .from("usage_tracking")
    .select("*")
    .eq("organization_id", userId)
    .eq("billing_period_start", billingPeriodStart)
    .single<UsageTracking>();

  if (!usage) {
    // Create new usage record
    const { data: newUsage } = await (supabase as any)
      .from("usage_tracking")
      .insert({
        organization_id: userId,
        billing_period_start: billingPeriodStart,
        reviews_used: 0,
        plan_type: planType,
      })
      .select()
      .single();

    usage = newUsage;
  }

  if (!usage) {
    throw new Error("Failed to get usage tracking");
  }

  const reviewsUsed = usage.reviews_used;

  // Pro plan: Hard cap at 40 reviews
  if (planType === "pro" && reviewsUsed >= includedReviews) {
    return {
      reviewsUsed,
      includedReviews,
      overagePrice,
      planType,
      canSubmit: false,
      message: `You have reached your plan limit of ${includedReviews} reviews this month. Your usage will reset at the next billing cycle.`,
    };
  }

  // Firm plan: Allow overages with billing
  if (planType === "firm" && reviewsUsed >= includedReviews) {
    // Bill for overage
    if (profile.stripe_customer_id && overagePrice > 0) {
      try {
        await stripe.invoiceItems.create({
          customer: profile.stripe_customer_id,
          amount: overagePrice * 100, // Convert to cents
          currency: "usd",
          description: `Additional estimate review (beyond ${includedReviews} included)`,
        });
      } catch (error) {
        console.error("Failed to create invoice item:", error);
        throw new Error("Failed to process overage billing");
      }
    }
  }

  return {
    reviewsUsed,
    includedReviews,
    overagePrice,
    planType,
    canSubmit: true,
    message: planType === "firm" && reviewsUsed >= includedReviews
      ? `This review will be billed at $${overagePrice} (beyond ${includedReviews} included reviews).`
      : undefined,
  };
}

/**
 * Increment usage after successful review submission
 */
export async function incrementUsage(userId: string): Promise<void> {
  const supabase = createAdminClient();

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single<Profile>();

  if (!profile) {
    throw new Error("Profile not found");
  }

  const planType = profile.plan_type || "individual";
  const billingPeriodStart = profile.billing_period_start;

  // Individual plans don't use usage_tracking (tracked via reviews table)
  if (planType === "individual") {
    return;
  }

  if (!billingPeriodStart) {
    throw new Error("Billing period not set");
  }

  // Increment usage
  const { data: usage } = await supabase
    .from("usage_tracking")
    .select("*")
    .eq("organization_id", userId)
    .eq("billing_period_start", billingPeriodStart)
    .single<UsageTracking>();

  if (usage) {
    await (supabase as any)
      .from("usage_tracking")
      .update({
        reviews_used: usage.reviews_used + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", usage.id);
  } else {
    await (supabase as any)
      .from("usage_tracking")
      .insert({
        organization_id: userId,
        billing_period_start: billingPeriodStart,
        reviews_used: 1,
        plan_type: planType,
      });
  }
}

