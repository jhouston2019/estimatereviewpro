import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import {
  ensureUserForPaidCheckout,
  ensureUserForStripeSubscription,
} from "./stripeLinkUser";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * After checkout sets users.plan_type, create user_review_usage if none yet.
 */
export async function ensureUserReviewUsageRow(
  userId: string,
  planType: string
): Promise<void> {
  if (!planType || planType === "none") return;

  const { data: existingUsage } = await supabase
    .from("user_review_usage")
    .select("user_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (existingUsage) return;

  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("id, reviews_per_month")
    .eq("plan_type", planType)
    .maybeSingle();

  if (!plan) {
    console.warn(
      "[ensureUserReviewUsageRow] No subscription_plans row for plan_type:",
      planType
    );
    return;
  }

  const { error } = await supabase.from("user_review_usage").insert({
    user_id: userId,
    plan_id: plan.id,
    reviews_used: 0,
    reviews_limit: plan.reviews_per_month ?? 0,
    billing_period_start: new Date().toISOString(),
    billing_period_end: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString(),
    is_active: true,
  });

  if (error) {
    console.error("[ensureUserReviewUsageRow] insert failed:", error);
  }
}

function normalizeUserPlanType(
  raw: string | undefined,
  planName: string | undefined
):
  | "essential"
  | "professional"
  | "enterprise"
  | "premier"
  | null {
  const p = (raw || "").toLowerCase();
  const n = (planName || "").toLowerCase();
  if (!p && !n) return null;
  if (p === "single") return null;
  if (p === "essential" || n.includes("essential")) return "essential";
  if (p === "professional" || n.includes("professional")) {
    return "professional";
  }
  if (p === "premier" || n.includes("premier")) return "premier";
  if (
    p === "subscription" ||
    p === "enterprise" ||
    n.includes("enterprise")
  ) {
    return "enterprise";
  }
  return "enterprise";
}

export async function handleSubscriptionUpdate(
  subscription: Stripe.Subscription
) {
  const metadata = subscription.metadata;
  const planNameMeta = metadata.plan_name;
  const planType = normalizeUserPlanType(metadata.plan_type, planNameMeta);
  const reviewLimit = parseInt(metadata.review_limit || "0", 10);
  const overagePrice = parseInt(metadata.overage_price || "0", 10);

  if (!planType) return;

  const subStatus = subscription.status;

  const userId = await ensureUserForStripeSubscription(subscription);
  if (!userId) return;

  const { data: existingTeam } = await supabase
    .from("teams")
    .select("*")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();

  if (existingTeam) {
    await supabase
      .from("teams")
      .update({
        plan_type: planType,
        review_limit: reviewLimit,
        overage_price: overagePrice,
        stripe_subscription_status: subStatus,
      })
      .eq("id", existingTeam.id);

    await supabase
      .from("users")
      .update({ plan_type: planType })
      .eq("team_id", existingTeam.id);
  } else {
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .insert({
        name: `${planType.charAt(0).toUpperCase() + planType.slice(1)} Team`,
        owner_id: userId,
        plan_type: planType,
        stripe_subscription_id: subscription.id,
        stripe_subscription_status: subStatus,
        review_limit: reviewLimit,
        overage_price: overagePrice,
      })
      .select()
      .single();

    if (teamError) {
      console.error("Failed to create team:", teamError);
      return;
    }

    await supabase
      .from("users")
      .update({
        team_id: team.id,
        plan_type: planType,
        role: "owner",
      })
      .eq("id", userId);
  }

  console.log(`Subscription ${subscription.id} updated for user ${userId}`);
}

/**
 * Checkout completion: link user via Stripe customer id / metadata, then mirror plans.
 */
export async function syncStripeCheckoutSession(
  session: Stripe.Checkout.Session,
  opts?: { trustedUserId: string }
): Promise<string | null> {
  const metadata = session.metadata;

  const userId = await ensureUserForPaidCheckout(session, opts?.trustedUserId);
  if (!userId) {
    return null;
  }

  const stripeCustomerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer &&
          typeof session.customer === "object" &&
          "id" in session.customer
        ? (session.customer as Stripe.Customer).id
        : null;
  if (stripeCustomerId) {
    await supabase
      .from("users")
      .update({ stripe_customer_id: stripeCustomerId })
      .eq("id", userId);
  }

  if (metadata?.plan_type === "single") {
    await supabase
      .from("users")
      .update({ plan_type: "single" })
      .eq("id", userId);

    // Create usage row if it doesn't exist
    await ensureUserReviewUsageRow(userId, "single");

    console.log(`Single plan payment completed for user ${userId}`);
  }

  if (metadata?.type === "single_plan") {
    const legacyUserId = metadata.user_id;
    if (legacyUserId) {
      if (opts?.trustedUserId && legacyUserId !== opts.trustedUserId) {
        console.warn(
          "[syncStripeCheckoutSession] single_plan metadata user_id mismatch, skipping"
        );
      } else {
        await supabase
          .from("users")
          .update({ plan_type: "single" })
          .eq("id", legacyUserId);

        // Create usage row if it doesn't exist
        await ensureUserReviewUsageRow(legacyUserId, "single");

        console.log(`Single plan payment completed for user ${legacyUserId}`);
      }
    }
  }

  if (metadata?.type === "single_review") {
    const reportId = metadata.report_id;
    const reportUserId = metadata.user_id;

    if (!reportId || !reportUserId) return userId;
    if (opts?.trustedUserId && reportUserId !== opts.trustedUserId) {
      console.warn(
        "[syncStripeCheckoutSession] single_review user_id mismatch, skipping"
      );
      return userId;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await supabase
      .from("reports")
      .update({
        paid_single_use: true,
        expires_at: expiresAt.toISOString(),
      })
      .eq("id", reportId)
      .eq("user_id", reportUserId);

    console.log(`Single review payment completed for report ${reportId}`);
  }

  if (session.mode === "subscription" && session.subscription) {
    const subField = session.subscription;
    const subscription: Stripe.Subscription =
      typeof subField === "string"
        ? await stripe.subscriptions.retrieve(subField)
        : (subField as Stripe.Subscription);
    await handleSubscriptionUpdate(subscription);

    const sessionPlanFromCheckout = (
      metadata?.plan_type ?? ""
    ).toLowerCase();
    if (
      sessionPlanFromCheckout === "essential" ||
      sessionPlanFromCheckout === "professional" ||
      sessionPlanFromCheckout === "enterprise" ||
      sessionPlanFromCheckout === "premier"
    ) {
      await supabase
        .from("users")
        .update({
          plan_type: sessionPlanFromCheckout as
            | "essential"
            | "professional"
            | "enterprise"
            | "premier",
        })
        .eq("id", userId);
    }

    // Create usage row if it doesn't exist (use final plan_type on user after subscription + checkout updates)
    const { data: userAfterSub } = await supabase
      .from("users")
      .select("plan_type")
      .eq("id", userId)
      .maybeSingle();
    const subPlan = userAfterSub?.plan_type;
    if (subPlan) {
      await ensureUserReviewUsageRow(userId, subPlan);
    }
  }

  return userId;
}
