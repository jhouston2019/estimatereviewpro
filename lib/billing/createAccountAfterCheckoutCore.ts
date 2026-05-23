import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { syncStripeCheckoutSession } from "@/lib/billing/stripeCheckoutSync";
import { ensureUserForPaidCheckout } from "@/lib/billing/stripeLinkUser";
import { resolveCheckoutEmailForCreateAccount } from "@/app/create-account/stripeSession";

export type CreateAccountResult =
  | { ok: true; email: string; userId: string }
  | { ok: false; error: string; status: number };

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);

export async function createAccountAfterCheckoutCore(args: {
  sessionId: string;
  password: string;
  confirmPassword: string;
}): Promise<CreateAccountResult> {
  const sessionId = args.sessionId.trim();
  const password = args.password;
  const confirmPassword = args.confirmPassword;

  if (!sessionId) {
    return {
      ok: false,
      error: "Missing checkout session. Return to pricing and try again.",
      status: 400,
    };
  }
  if (password.length < 8) {
    return {
      ok: false,
      error: "Password must be at least 8 characters.",
      status: 400,
    };
  }
  if (password !== confirmPassword) {
    return { ok: false, error: "Passwords do not match.", status: 400 };
  }

  const email = await resolveCheckoutEmailForCreateAccount(sessionId);
  if (!email) {
    return {
      ok: false,
      error: "This checkout link is invalid or expired.",
      status: 400,
    };
  }

  let userId: string | null = null;
  const { data: existingRow, error: userRowErr } = await serviceSupabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (userRowErr) {
    console.error(
      "[createAccountAfterCheckout] users lookup failed:",
      userRowErr
    );
  } else if (existingRow?.id) {
    userId = existingRow.id;
  }

  if (!userId) {
    const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
    if (!stripeKey) {
      return {
        ok: false,
        error:
          "Account setup is temporarily unavailable. Contact support if you completed payment.",
        status: 503,
      };
    }

    try {
      const stripe = new Stripe(stripeKey, {
        apiVersion: "2025-11-17.clover",
      });
      const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["customer"],
      });
      userId = await ensureUserForPaidCheckout(checkoutSession);
      if (userId) {
        await syncStripeCheckoutSession(checkoutSession);
      }
    } catch (err) {
      console.error(
        "[createAccountAfterCheckout] provision from checkout failed:",
        err
      );
    }
  }

  if (!userId) {
    return {
      ok: false,
      error:
        "We could not find your account. Contact support if you completed payment.",
      status: 404,
    };
  }

  const { error: updateErr } = await serviceSupabase.auth.admin.updateUserById(
    userId,
    { password }
  );

  if (updateErr) {
    return { ok: false, error: updateErr.message, status: 400 };
  }

  return { ok: true, email, userId };
}
