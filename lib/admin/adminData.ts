import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { Json } from "@/types/database.types";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    return null;
  }
  return createClient<Database>(url, key);
}

type UsageInfo = { isActive: boolean; reviewsUsed: number | null };

type TeamRow = {
  stripe_subscription_id: string | null;
  stripe_subscription_status: string | null;
};

function bestUsageByUserId(
  rows: {
    user_id: string;
    is_active: boolean | null;
    reviews_used: number | null;
    billing_period_end: string;
  }[]
): Map<string, UsageInfo> {
  const byUser = new Map<string, typeof rows>();
  for (const r of rows) {
    const list = byUser.get(r.user_id) ?? [];
    list.push(r);
    byUser.set(r.user_id, list);
  }
  const out = new Map<string, UsageInfo>();
  for (const [uid, list] of byUser) {
    const active = list.find((x) => x.is_active === true);
    const pick =
      active ??
      [...list].sort((a, b) =>
        b.billing_period_end.localeCompare(a.billing_period_end)
      )[0];
    if (pick) {
      out.set(uid, {
        isActive: Boolean(pick.is_active),
        reviewsUsed: pick.reviews_used,
      });
    }
  }
  return out;
}

/** Extracts claim # from stored AI JSON (analysis or summary). */
function claimNumberFromJson(json: Json | null): string | null {
  if (json === null || typeof json !== "object" || Array.isArray(json)) {
    return null;
  }
  const o = json as Record<string, unknown>;
  if (typeof o.claimNumber === "string" && o.claimNumber.trim()) {
    return o.claimNumber.trim();
  }
  if (o.claimMeta && typeof o.claimMeta === "object" && o.claimMeta) {
    const c = (o.claimMeta as { claimNumber?: string }).claimNumber;
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  if (o.property_details && typeof o.property_details === "object") {
    const c = (o.property_details as { claim_number?: string }).claim_number;
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  if (o.summary && typeof o.summary === "object" && o.summary) {
    const s = o.summary as Record<string, unknown>;
    if (typeof s.claimNumber === "string" && s.claimNumber.trim()) {
      return s.claimNumber.trim();
    }
  }
  return null;
}

export type AdminUserRow = {
  id: string;
  email: string;
  planType: string | null;
  billingStatus: "Active" | "Inactive" | "—";
  reviewsUsed: number | null;
  createdAt: string | null;
};

export type AdminReviewRow = {
  id: string;
  insuredName: string | null;
  userEmail: string;
  createdAt: string;
  claimNumber: string | null;
};

export type AdminPageData = {
  totalUsers: number;
  totalReviews: number;
  activeSubscriptions: number;
  users: AdminUserRow[];
  reviews: AdminReviewRow[];
  error: string | null;
};

export async function loadAdminDashboardData(): Promise<AdminPageData> {
  const svc = getServiceClient();
  if (!svc) {
    return {
      totalUsers: 0,
      totalReviews: 0,
      activeSubscriptions: 0,
      users: [],
      reviews: [],
      error: "Server configuration error.",
    };
  }

  const { count: userCount, error: c1 } = await svc
    .from("users")
    .select("id", { count: "exact", head: true });
  if (c1) {
    return {
      totalUsers: 0,
      totalReviews: 0,
      activeSubscriptions: 0,
      users: [],
      reviews: [],
      error: c1.message,
    };
  }

  const { count: reviewCount, error: c2 } = await svc
    .from("reviews")
    .select("id", { count: "exact", head: true });
  if (c2) {
    return {
      totalUsers: userCount ?? 0,
      totalReviews: 0,
      activeSubscriptions: 0,
      users: [],
      reviews: [],
      error: c2.message,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: teamRows, error: tErr } = await (svc as any)
    .from("teams")
    .select("stripe_subscription_id, stripe_subscription_status");
  let activeSubscriptions = 0;
  if (!tErr && teamRows) {
    const rows = teamRows as TeamRow[];
    activeSubscriptions = rows.filter((r: TeamRow) => {
      if (
        r.stripe_subscription_id == null ||
        r.stripe_subscription_status === 'canceled'
      ) {
        return false;
      }
      return true;
    }).length;
  }

  const { data: allUsers, error: uErr } = await svc
    .from("users")
    .select("id, email, plan_type, created_at")
    .order("created_at", { ascending: false });
  if (uErr || !allUsers) {
    return {
      totalUsers: userCount ?? 0,
      totalReviews: reviewCount ?? 0,
      activeSubscriptions,
      users: [],
      reviews: [],
      error: uErr?.message ?? "Failed to load users.",
    };
  }

  const { data: usageRows, error: usErr } = await svc
    .from("user_review_usage")
    .select("user_id, is_active, reviews_used, billing_period_end");
  const usageMap: Map<string, UsageInfo> = usErr
    ? new Map()
    : bestUsageByUserId(
        (usageRows ?? []) as {
          user_id: string;
          is_active: boolean | null;
          reviews_used: number | null;
          billing_period_end: string;
        }[]
      );

  const users: AdminUserRow[] = allUsers.map((u) => {
    const uu = usageMap.get(u.id);
    let billingStatus: "Active" | "Inactive" | "—" = "—";
    if (uu) {
      billingStatus = uu.isActive ? "Active" : "Inactive";
    }
    return {
      id: u.id,
      email: u.email,
      planType: u.plan_type,
      billingStatus,
      reviewsUsed: uu ? uu.reviewsUsed : null,
      createdAt: u.created_at,
    };
  });

  const { data: allReviews, error: rErr } = await svc
    .from("reviews")
    .select("id, insured_name, created_at, user_id, ai_analysis_json, ai_summary_json")
    .order("created_at", { ascending: false });
  if (rErr || !allReviews) {
    return {
      totalUsers: userCount ?? 0,
      totalReviews: reviewCount ?? 0,
      activeSubscriptions,
      users,
      reviews: [],
      error: rErr?.message ?? "Failed to load reviews.",
    };
  }

  const emailByUserId = new Map<string, string>();
  for (const u of allUsers) {
    emailByUserId.set(u.id, u.email);
  }

  const reviews: AdminReviewRow[] = allReviews.map((r) => ({
    id: r.id,
    insuredName: r.insured_name,
    userEmail: emailByUserId.get(r.user_id) ?? "—",
    createdAt: r.created_at,
    claimNumber:
      claimNumberFromJson(r.ai_analysis_json) ??
      claimNumberFromJson(r.ai_summary_json),
  }));

  return {
    totalUsers: userCount ?? 0,
    totalReviews: reviewCount ?? 0,
    activeSubscriptions,
    users,
    reviews,
    error: null,
  };
}
