"use server";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Stripe from "stripe";
import { syncStripeCheckoutSession } from "@/lib/billing/stripeCheckoutSync";
import { ensureUserForPaidCheckout } from "@/lib/billing/stripeLinkUser";
import type { Database } from "@/lib/supabase-types";
import { resolveCheckoutEmailForCreateAccount } from "./stripeSession";

export type CreateAccountState = { error: string | null };

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);

export async function createAccountAfterCheckout(
  _prev: CreateAccountState,
  formData: FormData
): Promise<CreateAccountState> {
  const sessionId = (formData.get("session_id") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  const confirmPassword =
    (formData.get("confirm_password") as string | null) ?? "";

  if (!sessionId) {
    return { error: "Missing checkout session. Return to pricing and try again." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const email = await resolveCheckoutEmailForCreateAccount(sessionId);
  if (!email) {
    return { error: "This checkout link is invalid or expired." };
  }

  let userId: string | null = null;
  const { data: existingRow, error: userRowErr } = await serviceSupabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (userRowErr) {
    console.error("[createAccountAfterCheckout] users lookup failed:", userRowErr);
  } else if (existingRow?.id) {
    userId = existingRow.id;
  }

  if (!userId) {
    const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
    if (!stripeKey) {
      return {
        error:
          "Account setup is temporarily unavailable. Contact support if you completed payment.",
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
      console.error("[createAccountAfterCheckout] provision from checkout failed:", err);
    }
  }

  if (!userId) {
    return {
      error:
        "We could not find your account. Contact support if you completed payment.",
    };
  }

  const { error: updateErr } = await serviceSupabase.auth.admin.updateUserById(
    userId,
    { password }
  );

  if (updateErr) {
    return { error: updateErr.message };
  }

  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            /* ignore — middleware may refresh session */
          }
        },
      },
    }
  );

  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInErr) {
    return {
      error:
        signInErr.message ||
        "Password was set but sign-in failed. Try logging in manually.",
    };
  }

  redirect("/app");
}
