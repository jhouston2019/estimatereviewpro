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

function normalizeUserPlanType(
  raw: string | undefined,
  planName: string | undefined
): "professional" | "enterprise" | null {
  const p = (raw || "").toLowerCase();
  const n = (planName || "").toLowerCase();
  if (!p && !n) return null;
  if (p === "professional" || n.includes("professional")) return "professional";
  if (
    p === "subscription" ||
    p === "enterprise" ||
    p === "premier" ||
    n.includes("enterprise") ||
    n.includes("premier")
  ) {
    return "enterprise";
  }
  if (p === "single") return null;
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
  }

  return userId;
}
