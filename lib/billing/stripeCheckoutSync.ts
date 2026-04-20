import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

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
  const metaUserId = metadata.user_id?.trim();

  if (!planType) return;

  const subStatus = subscription.status;

  let userId: string | null = null;

  if (metaUserId) {
    const { data: userByMeta } = await supabase
      .from("users")
      .select("id")
      .eq("id", metaUserId)
      .maybeSingle();
    if (userByMeta?.id) {
      userId = userByMeta.id;
    }
  }

  const customer = await stripe.customers.retrieve(
    subscription.customer as string
  );
  if (!customer || customer.deleted) return;

  const customerEmail = customer.email;
  if (!userId && !customerEmail) return;

  if (!userId && customerEmail) {
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", customerEmail)
      .maybeSingle();

    if (existingUser?.id) {
      userId = existingUser.id;
    } else {
      const { data: authUser, error: authError } =
        await supabase.auth.admin.createUser({
          email: customerEmail,
          email_confirm: true,
        });

      if (authError || !authUser.user) {
        console.error("Failed to create auth user:", authError);
        return;
      }

      userId = authUser.user.id;
    }
  }

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
 * Mirrors webhook `checkout.session.completed` handling so the client can
 * activate access immediately after Checkout without waiting for the webhook.
 * When `trustedUserId` is set (verify-payment path), skips email-based user
 * creation and only updates that user.
 */
export async function syncStripeCheckoutSession(
  session: Stripe.Checkout.Session,
  opts?: { trustedUserId: string }
): Promise<void> {
  const metadata = session.metadata;
  const customerEmail =
    session.customer_email || session.customer_details?.email;

  let userId: string;

  if (opts?.trustedUserId) {
    userId = opts.trustedUserId;
    const { data: row } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();
    if (!row?.id) {
      console.error(
        "[syncStripeCheckoutSession] trusted user not found in public.users"
      );
      return;
    }
  } else {
    if (!customerEmail) {
      console.error("No customer email found in checkout session");
      return;
    }

    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", customerEmail)
      .single();

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const { data: authUser, error: authError } =
        await supabase.auth.admin.createUser({
          email: customerEmail,
          email_confirm: true,
        });

      if (authError || !authUser.user) {
        console.error("Failed to create auth user:", authError);
        return;
      }

      userId = authUser.user.id;
    }
  }

  if (session.customer) {
    await supabase
      .from("users")
      .update({ stripe_customer_id: session.customer as string })
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

    if (!reportId || !reportUserId) return;
    if (opts?.trustedUserId && reportUserId !== opts.trustedUserId) {
      console.warn(
        "[syncStripeCheckoutSession] single_review user_id mismatch, skipping"
      );
      return;
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
}
