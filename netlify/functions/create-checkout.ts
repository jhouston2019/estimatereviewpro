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
    const { userId, priceType, successUrl, cancelUrl } = JSON.parse(
      event.body || "{}"
    );

    if (!userId || !priceType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing userId or priceType" }),
      };
    }

    // Get user profile
    type Profile = Database["public"]["Tables"]["profiles"]["Row"];
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single<Profile>();

    if (profileError || !profile) {
      throw new Error("User profile not found");
    }

    let customerId = profile.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email || undefined,
        metadata: {
          supabase_user_id: userId,
        },
      });

      customerId = customer.id;

      // Update profile with customer ID
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", userId);
    }

    // Create checkout session based on price type
    let sessionParams: Stripe.Checkout.SessionCreateParams;

    if (priceType === "oneoff") {
      // One-time $79 payment
      sessionParams = {
        customer: customerId,
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Single Estimate Review",
                description:
                  "One-time estimate review with AI analysis and PDF report",
              },
              unit_amount: 7900, // $79.00
            },
            quantity: 1,
          },
        ],
        success_url: successUrl || `${process.env.URL}/dashboard?payment=success`,
        cancel_url: cancelUrl || `${process.env.URL}/pricing?payment=cancelled`,
        metadata: {
          supabase_user_id: userId,
          tier: "oneoff",
        },
      };
    } else if (priceType === "pro") {
      // $249/month subscription
      sessionParams = {
        customer: customerId,
        mode: "subscription",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Unlimited Monthly Plan",
                description:
                  "Unlimited estimate reviews with priority processing and white-label PDFs",
              },
              unit_amount: 24900, // $249.00
              recurring: {
                interval: "month",
              },
            },
            quantity: 1,
          },
        ],
        success_url: successUrl || `${process.env.URL}/dashboard?payment=success`,
        cancel_url: cancelUrl || `${process.env.URL}/pricing?payment=cancelled`,
        metadata: {
          supabase_user_id: userId,
          tier: "pro",
        },
      };
    } else {
      throw new Error("Invalid price type");
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        sessionUrl: session.url,
        sessionId: session.id,
      }),
    };
  } catch (error: any) {
    console.error("Error in create-checkout:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || "Failed to create checkout session",
      }),
    };
  }
};

