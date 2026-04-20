import { NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabaseServer";
import { getBillingSnapshot } from "@/lib/billing/getBillingSnapshot";

export async function GET() {
  try {
    const supabase = await createSupabaseRouteHandlerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const snap = await getBillingSnapshot(supabase, session.user.id);

    console.log("[usage]", {
      user_id: session.user.id,
      used: snap.usage,
      limit: snap.reviews_limit,
    });

    return NextResponse.json({
      used: snap.usage,
      limit: snap.reviews_limit,
    });
  } catch (e) {
    console.error("[usage]", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
