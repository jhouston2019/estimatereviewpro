import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const sig = event.headers["stripe-signature"];

  if (!sig) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "No signature" }),
    };
  }

  let stripeEvent: Stripe.Event;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body!,
      sig,
      webhookSecret
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `Webhook Error: ${err.message}` }),
    };
  }

  try {
    switch (stripeEvent.type) {
      case "checkout.session.completed": {
        const session = stripeEvent.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const tier = session.metadata?.tier;

        if (!userId) {
          console.error("No user ID in session metadata");
          break;
        }

        // Update user profile
        const updateData: any = {
          stripe_customer_id: session.customer as string,
        };

        if (tier === "oneoff") {
          updateData.tier = "oneoff";
          updateData.subscription_status = "active";
        } else if (tier === "pro") {
          updateData.tier = "pro";
          updateData.subscription_status = "active";
        }

        await supabase.from("profiles").update(updateData).eq("id", userId);

        console.log(`Updated user ${userId} with tier ${tier}`);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by customer ID
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("stripe_customer_id", customerId)
          .single();

        if (!profile) {
          console.error(`No profile found for customer ${customerId}`);
          break;
        }

        // Update subscription status
        const status = subscription.status;
        const tier = status === "active" ? "pro" : profile.tier;

        await supabase
          .from("profiles")
          .update({
            subscription_status: status,
            tier: tier,
          })
          .eq("id", profile.id);

        console.log(
          `Updated subscription for user ${profile.id}: ${status}, tier: ${tier}`
        );
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by customer ID
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("stripe_customer_id", customerId)
          .single();

        if (!profile) {
          console.error(`No profile found for customer ${customerId}`);
          break;
        }

        // Downgrade to free
        await supabase
          .from("profiles")
          .update({
            subscription_status: "cancelled",
            tier: "free",
          })
          .eq("id", profile.id);

        console.log(`Subscription cancelled for user ${profile.id}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || "Webhook processing failed",
      }),
    };
  }
};

