import Stripe from "stripe";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

export type BillingSnapshot = {
  plan: string;
  status: "active" | "inactive";
  renewal_date: string | null;
  /** Reviews consumed this period (same source as `/api/usage` `used`). */
  usage: number;
  /** Plan review cap when applicable (same source as `/api/usage` `limit`). */
  reviews_limit: number;
  /** Whether the user belongs to a team (for tier / upsell UI). */
  has_team: boolean;
};

export async function getBillingSnapshot(
  supabase: SupabaseClient,
  userId: string
): Promise<BillingSnapshot> {
  const { data: u } = await supabase
    .from("users")
    .select("plan_type, team_id")
    .eq("id", userId)
    .maybeSingle();

  const row = u as { plan_type: string | null; team_id: string | null } | null;
  const planLabel = row?.plan_type ?? "none";
  const has_team = !!row?.team_id;

  const { data: paid } = await supabase.rpc("user_has_paid_access");
  let status: "active" | "inactive" =
    paid === true ? "active" : "inactive";

  let renewal_date: string | null = null;

  if (row?.team_id) {
    const { data: team } = await supabase
      .from("teams")
      .select("stripe_subscription_id, stripe_subscription_status")
      .eq("id", row.team_id)
      .maybeSingle();

    const t = team as {
      stripe_subscription_id: string | null;
      stripe_subscription_status: string | null;
    } | null;

    if (t?.stripe_subscription_id) {
      try {
        const sub = await stripe.subscriptions.retrieve(t.stripe_subscription_id);
        const cpe = (sub as { current_period_end?: number }).current_period_end;
        if (typeof cpe === "number") {
          renewal_date = new Date(cpe * 1000).toISOString();
        }
        status =
          sub.status === "active" || sub.status === "trialing"
            ? "active"
            : "inactive";
      } catch (e) {
        console.warn("[getBillingSnapshot] subscription retrieve:", e);
      }
    }
  }

  const { data: rpcData } = await (
    supabase as unknown as {
      rpc: (
        n: string,
        a: { user_id_param: string }
      ) => Promise<{ data: unknown }>;
    }
  ).rpc("get_user_plan_usage", { user_id_param: userId });

  let usage = 0;
  let reviews_limit = 0;
  if (Array.isArray(rpcData) && rpcData[0] && typeof rpcData[0] === "object") {
    const ur = rpcData[0] as {
      reviews_used?: number;
      reviews_limit?: number;
    };
    usage = ur.reviews_used ?? 0;
    reviews_limit = ur.reviews_limit ?? 0;
  } else {
    const { data: usageRow } = await supabase
      .from("user_review_usage")
      .select("reviews_used, reviews_limit")
      .eq("user_id", userId)
      .maybeSingle();
    const ur = usageRow as {
      reviews_used: number | null;
      reviews_limit: number | null;
    } | null;
    usage = ur?.reviews_used ?? 0;
    reviews_limit = ur?.reviews_limit ?? 0;
  }

  return {
    plan: planLabel,
    status,
    renewal_date,
    usage,
    reviews_limit,
    has_team,
  };
}
