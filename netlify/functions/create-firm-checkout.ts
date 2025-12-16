import { Handler } from "@netlify/functions";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

export const handler: Handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { plan, email } = JSON.parse(event.body || "{}");

    if (!plan || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Plan and email are required" }),
      };
    }

    if (plan !== "firm" && plan !== "pro") {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid plan. Must be 'firm' or 'pro'" }),
      };
    }

    // Select the correct price ID
    const priceId =
      plan === "firm"
        ? process.env.STRIPE_PRICE_FIRM_499!
        : process.env.STRIPE_PRICE_PRO_1499!;

    // Create Stripe checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.SITE_URL}/thank-you`,
      cancel_url: `${process.env.SITE_URL}/pricing`,
      metadata: {
        plan: plan,
        included_reviews: plan === "firm" ? "10" : "40",
        overage_price: plan === "firm" ? "75" : "0",
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (error: any) {
    console.error("Checkout error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
