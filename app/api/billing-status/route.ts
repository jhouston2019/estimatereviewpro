import { NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabaseServer";
import { getBillingSnapshot } from "@/lib/billing/getBillingSnapshot";

export async function GET() {
  try {
    const authClient = await createSupabaseRouteHandlerClient();
    const {
      data: { session },
    } = await authClient.auth.getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const snap = await getBillingSnapshot(authClient, session.user.id);

    console.log("[billing-status]", {
      user_id: session.user.id,
      plan: snap.plan,
      status: snap.status,
    });

    return NextResponse.json({
      plan: snap.plan,
      status: snap.status,
      renewal_date: snap.renewal_date,
      usage: snap.usage,
      reviews_limit: snap.reviews_limit,
    });
  } catch (e) {
    console.error("[billing-status]", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
