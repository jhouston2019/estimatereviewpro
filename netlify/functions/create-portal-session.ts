import { Handler } from "@netlify/functions";
import { createAdminClient } from "../../lib/supabase/admin";
import Stripe from "stripe";
import type { Database } from "../../lib/database.types";

const supabase = createAdminClient();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { userId, returnUrl } = JSON.parse(event.body || "{}");

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing userId" }),
      };
    }

    // Get user profile
    type Profile = Database["public"]["Tables"]["profiles"]["Row"];
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single<Profile>();

    if (profileError || !profile || !profile.stripe_customer_id) {
      throw new Error("User profile or Stripe customer not found");
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: returnUrl || `${process.env.URL}/dashboard`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        url: session.url,
      }),
    };
  } catch (error: any) {
    console.error("Error in create-portal-session:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || "Failed to create portal session",
      }),
    };
  }
};

