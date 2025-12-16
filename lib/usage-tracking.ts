import { createAdminClient } from "./supabase/admin";

export interface UsageData {
  organization_id: string;
  billing_period_start: string;
  billing_period_end: string;
  reviews_used: number;
  plan_type: "individual" | "firm" | "pro";
}

/**
 * Get current usage for an organization
 */
export async function getUsage(organizationId: string): Promise<UsageData | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("organization_usage")
    .select("*")
    .eq("organization_id", organizationId)
    .single();

  if (error) {
    console.error("Error fetching usage:", error);
    return null;
  }

  return data as UsageData;
}

/**
 * Increment usage count for an organization
 */
export async function incrementUsage(organizationId: string): Promise<boolean> {
  const supabase = createAdminClient();

  // Get current usage
  const usage = await getUsage(organizationId);

  if (!usage) {
    console.error("No usage record found for organization:", organizationId);
    return false;
  }

  // Check if at limit for Pro plan
  if (usage.plan_type === "pro" && usage.reviews_used >= 40) {
    console.error("Pro plan at review limit (40)");
    return false;
  }

  // Increment usage
  const { error } = await supabase
    .from("organization_usage")
    // @ts-expect-error - Supabase type inference issue with Update type
    .update({
      reviews_used: usage.reviews_used + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", organizationId);

  if (error) {
    console.error("Error incrementing usage:", error);
    return false;
  }

  return true;
}

/**
 * Reset usage for a new billing period
 */
export async function resetUsage(
  organizationId: string,
  billingPeriodStart: string,
  billingPeriodEnd: string
): Promise<boolean> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("organization_usage")
    // @ts-expect-error - Supabase type inference issue with Update type
    .update({
      billing_period_start: billingPeriodStart,
      billing_period_end: billingPeriodEnd,
      reviews_used: 0,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", organizationId);

  if (error) {
    console.error("Error resetting usage:", error);
    return false;
  }

  return true;
}

/**
 * Create initial usage record for new subscription
 */
export async function createUsageRecord(
  organizationId: string,
  planType: "individual" | "firm" | "pro",
  billingPeriodStart: string,
  billingPeriodEnd: string
): Promise<boolean> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("organization_usage")
    // @ts-expect-error - Supabase type inference issue with Insert type
    .insert({
      organization_id: organizationId,
      billing_period_start: billingPeriodStart,
      billing_period_end: billingPeriodEnd,
      reviews_used: 0,
      plan_type: planType,
    });

  if (error) {
    console.error("Error creating usage record:", error);
    return false;
  }

  return true;
}

/**
 * Check if organization can submit a review
 */
export async function canSubmitReview(organizationId: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const usage = await getUsage(organizationId);

  if (!usage) {
    return { allowed: false, reason: "No usage record found" };
  }

  // Individual plan: always allowed (one-time purchase per review)
  if (usage.plan_type === "individual") {
    return { allowed: true };
  }

  // Firm plan: always allowed (overage billing)
  if (usage.plan_type === "firm") {
    return { allowed: true };
  }

  // Pro plan: hard cap at 40
  if (usage.plan_type === "pro") {
    if (usage.reviews_used >= 40) {
      return {
        allowed: false,
        reason: "Monthly review limit reached (40/40). Limit resets at next billing cycle.",
      };
    }
    return { allowed: true };
  }

  return { allowed: false, reason: "Invalid plan type" };
}

/**
 * Calculate overage charges for Firm plan
 */
export async function calculateOverage(organizationId: string): Promise<number> {
  const usage = await getUsage(organizationId);

  if (!usage || usage.plan_type !== "firm") {
    return 0;
  }

  const includedReviews = 10;
  const overagePrice = 75;

  if (usage.reviews_used <= includedReviews) {
    return 0;
  }

  const overageCount = usage.reviews_used - includedReviews;
  return overageCount * overagePrice;
}
