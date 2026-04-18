import { NextResponse } from 'next/server';
import { createSupabaseRouteHandlerClient } from '@/lib/supabaseServer';
import { isPaymentBypassActive } from '@/lib/billing/devBypass';

/**
 * Returns current billing access from Supabase (not JWT claims).
 * Used after Stripe redirects to confirm entitlement before trusting query params.
 */
export async function GET() {
  try {
    const supabase = await createSupabaseRouteHandlerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isPaymentBypassActive()) {
      return NextResponse.json({
        hasPaidAccess: true,
        bypass: true,
        planType: null,
        teamId: null,
      });
    }

    const { data: paid, error: rpcError } = await supabase.rpc(
      "user_has_paid_access"
    );

    if (rpcError) {
      console.error("[billing/status] RPC error:", rpcError);
      return NextResponse.json(
        { error: "Failed to verify billing" },
        { status: 500 }
      );
    }

    const { data: row } = await supabase
      .from("users")
      .select("plan_type, team_id")
      .eq("id", session.user.id)
      .maybeSingle();

    const u = row as { plan_type: string | null; team_id: string | null } | null;

    return NextResponse.json({
      hasPaidAccess: paid === true,
      planType: u?.plan_type ?? null,
      teamId: u?.team_id ?? null,
    });
  } catch (e) {
    console.error("[billing/status]", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
