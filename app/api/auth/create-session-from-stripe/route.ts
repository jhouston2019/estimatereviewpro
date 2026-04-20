import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import {
  ensureUserForPaidCheckout,
  stripeCustomerIdFromSession,
} from "@/lib/billing/stripeLinkUser";
import type { Database } from "@/lib/supabase-types";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);

async function upsertPending(sessionId: string, userId: string) {
  const { error } = await supabaseService.from("processed_sessions").upsert(
    {
      session_id: sessionId,
      user_id: userId,
      status: "pending",
      completed_at: null,
    },
    { onConflict: "session_id" }
  );
  if (error) {
    console.error("[create-session-from-stripe] upsert pending:", error);
  }
}

async function markCompleted(sessionId: string, userId: string) {
  const now = new Date().toISOString();
  const { error } = await supabaseService.from("processed_sessions").upsert(
    {
      session_id: sessionId,
      user_id: userId,
      status: "completed",
      completed_at: now,
    },
    { onConflict: "session_id" }
  );
  if (error) {
    console.error("[create-session-from-stripe] markCompleted:", error);
  }
}

async function markFailed(sessionId: string) {
  const { error } = await supabaseService
    .from("processed_sessions")
    .update({ status: "failed" })
    .eq("session_id", sessionId);
  if (error) {
    console.warn("[create-session-from-stripe] markFailed:", error.message);
  }
}

export async function POST(request: NextRequest) {
  let body: { session_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sessionId = body.session_id?.trim();
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  let checkoutSession: Stripe.Checkout.Session;
  try {
    checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "customer"],
    });
  } catch (e) {
    console.error("[create-session-from-stripe] retrieve:", e);
    return NextResponse.json(
      { error: "Invalid checkout session" },
      { status: 400 }
    );
  }

  const paid =
    checkoutSession.payment_status === "paid" ||
    checkoutSession.payment_status === "no_payment_required";

  if (!paid) {
    return NextResponse.json(
      { error: "Payment not completed" },
      { status: 400 }
    );
  }

  const userId = await ensureUserForPaidCheckout(checkoutSession);
  if (!userId) {
    return NextResponse.json(
      { error: "Could not resolve user for checkout" },
      { status: 400 }
    );
  }

  const cid = stripeCustomerIdFromSession(checkoutSession);
  const { data: urow } = await supabaseService
    .from("users")
    .select("id, stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();

  const { data: existing } = await supabaseService
    .from("processed_sessions")
    .select("user_id, status")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (existing?.status === "completed") {
    if (existing.user_id && existing.user_id !== userId) {
      return NextResponse.json(
        { error: "Session already processed for another user" },
        { status: 409 }
      );
    }
    if (cid && urow?.stripe_customer_id && urow.stripe_customer_id !== cid) {
      console.error(
        "[create-session-from-stripe] stripe_customer_id mismatch for completed session"
      );
      return NextResponse.json({ error: "Invalid session state" }, { status: 409 });
    }
    console.log({
      tag: "[create-session-from-stripe]",
      session_id: sessionId,
      user_id: userId,
      stripe_customer_id: cid ?? null,
      alreadyProcessed: true,
    });
    return NextResponse.json({
      success: true,
      userId,
      alreadyProcessed: true,
    });
  }

  let response = NextResponse.json({
    success: true,
    userId,
    sessionEstablished: false,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { session: existingCookie },
  } = await supabase.auth.getSession();

  if (
    existingCookie?.user?.id === userId &&
    urow?.stripe_customer_id &&
    cid &&
    urow.stripe_customer_id === cid
  ) {
    console.log({
      tag: "[create-session-from-stripe]",
      session_id: sessionId,
      user_id: userId,
      stripe_customer_id: cid ?? null,
      idempotentCookie: true,
    });
    await markCompleted(sessionId, userId);
    console.log("SESSION_FINALIZED", {
      session_id: sessionId,
      user_id: userId,
      status: "completed",
    });
    return NextResponse.json({
      success: true,
      userId,
      sessionEstablished: true,
      idempotent: true,
    });
  }

  const { data: authUser, error: guErr } =
    await supabaseService.auth.admin.getUserById(userId);
  const email = authUser.user?.email;
  if (guErr || !email) {
    return NextResponse.json(
      { error: "User record has no email" },
      { status: 500 }
    );
  }

  console.log({
    tag: "[create-session-from-stripe]",
    session_id: sessionId,
    user_id: userId,
    stripe_customer_id: cid ?? null,
  });

  response = NextResponse.json({
    success: true,
    userId,
    sessionEstablished: false,
  });

  const supabaseOtp = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await upsertPending(sessionId, userId);

  const { data: linkData, error: glErr } =
    await supabaseService.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

  const hashed =
    linkData?.properties &&
    typeof linkData.properties === "object" &&
    "hashed_token" in linkData.properties
      ? (linkData.properties as { hashed_token: string }).hashed_token
      : null;

  if (glErr || !hashed) {
    console.warn(
      "[create-session-from-stripe] generateLink:",
      glErr?.message ?? "no token"
    );
    await markFailed(sessionId);
    return NextResponse.json({
      success: true,
      userId,
      sessionEstablished: false,
    });
  }

  const { error: vErr } = await supabaseOtp.auth.verifyOtp({
    type: "email",
    token_hash: hashed,
  });

  const established = !vErr;
  if (vErr) {
    console.warn("[create-session-from-stripe] verifyOtp:", vErr.message);
    await markFailed(sessionId);
  }

  if (established) {
    await markCompleted(sessionId, userId);
    console.log("SESSION_FINALIZED", {
      session_id: sessionId,
      user_id: userId,
      status: "completed",
    });
  }

  return new NextResponse(
    JSON.stringify({
      success: true,
      userId,
      sessionEstablished: established,
    }),
    {
      status: 200,
      headers: response.headers,
    }
  );
}
