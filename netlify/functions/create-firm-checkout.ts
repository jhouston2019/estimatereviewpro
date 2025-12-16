import { Handler } from "@netlify/functions";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { userId, email, plan } = JSON.parse(event.body || "{}");

    if (!userId || !email || !plan) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing userId, email, or plan" }),
      };
    }

    if (plan !== "firm" && plan !== "pro") {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid plan. Must be 'firm' or 'pro'" }),
      };
    }

    // Select correct price ID based on plan
    const priceId = plan === "firm" 
      ? process.env.STRIPE_PRICE_FIRM_499!
      : process.env.STRIPE_PRICE_PRO_1499!;

    const metadata = plan === "firm"
      ? {
          userId,
          plan: "firm",
          included_reviews: "10",
          overage_price: "75",
        }
      : {
          userId,
          plan: "pro",
          included_reviews: "40",
          overage_price: "0",
        };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: email,
      client_reference_id: userId,
      metadata,
      success_url: `${process.env.SITE_URL}/thank-you`,
      cancel_url: `${process.env.SITE_URL}/pricing`,
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

