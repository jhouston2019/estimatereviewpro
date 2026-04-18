import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { syncStripeCheckoutSession } from "@/lib/billing/stripeCheckoutSync";
import { createSupabaseRouteHandlerClient } from "@/lib/supabaseServer";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

async function runVerify(request: NextRequest) {
  const authClient = await createSupabaseRouteHandlerClient();
  const {
    data: { session: authSession },
  } = await authClient.auth.getSession();

  if (!authSession?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let sessionId =
    request.nextUrl.searchParams.get("session_id") ??
    request.nextUrl.searchParams.get("sessionId");

  if (!sessionId && request.method === "POST") {
    try {
      const body = await request.json();
      sessionId = body?.sessionId ?? body?.session_id;
    } catch {
      /* ignore */
    }
  }

  if (!sessionId || typeof sessionId !== "string") {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription", "line_items"],
  });

  const metaUid = checkoutSession.metadata?.user_id?.trim();
  const email =
    checkoutSession.customer_email ||
    checkoutSession.customer_details?.email;

  if (metaUid && metaUid !== authSession.user.id) {
    return NextResponse.json(
      { error: "Checkout session does not match signed-in user" },
      { status: 403 }
    );
  }

  if (!metaUid) {
    if (
      !email ||
      !authSession.user.email ||
      email.toLowerCase() !== authSession.user.email.toLowerCase()
    ) {
      return NextResponse.json(
        { error: "Checkout session does not match signed-in user" },
        { status: 403 }
      );
    }
  }

  const paid =
    checkoutSession.payment_status === "paid" ||
    checkoutSession.payment_status === "no_payment_required";

  if (!paid) {
    return NextResponse.json(
      {
        error: "Payment not completed",
        payment_status: checkoutSession.payment_status,
      },
      { status: 400 }
    );
  }

  await syncStripeCheckoutSession(checkoutSession, {
    trustedUserId: authSession.user.id,
  });

  const { data: hasPaidAccess, error: rpcErr } =
    await authClient.rpc("user_has_paid_access");
  if (rpcErr) {
    console.error("[verify-payment] user_has_paid_access:", rpcErr);
  }

  return NextResponse.json({
    success: true,
    synced: true,
    hasPaidAccess: hasPaidAccess === true,
  });
}

export async function GET(request: NextRequest) {
  try {
    return await runVerify(request);
  } catch (error) {
    console.error("[verify-payment] GET:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    return await runVerify(request);
  } catch (error) {
    console.error("[verify-payment] POST:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
