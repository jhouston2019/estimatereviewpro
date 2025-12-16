import { Handler } from "@netlify/functions";
import { createAdminClient } from "../../lib/supabase/admin";
import Stripe from "stripe";
import type { Database } from "../../lib/database.types";

const supabase = createAdminClient();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
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
        const userId = session.metadata?.userId || session.client_reference_id;
        const plan = session.metadata?.plan;

        if (!userId) {
          console.error("No user ID in session metadata");
          break;
        }

        // Update user profile based on plan type
        const updateData: any = {
          stripe_customer_id: session.customer as string,
          plan_type: plan,
        };

        if (plan === "individual") {
          updateData.included_reviews = 1;
          updateData.overage_price = 0;
          updateData.subscription_status = "active";
        } else if (plan === "firm") {
          updateData.included_reviews = 10;
          updateData.overage_price = 75;
          updateData.subscription_status = "active";
          updateData.billing_period_start = new Date().toISOString();
        } else if (plan === "pro") {
          updateData.included_reviews = 40;
          updateData.overage_price = 0;
          updateData.subscription_status = "active";
          updateData.billing_period_start = new Date().toISOString();
        }

        await (supabase as any).from("profiles").update(updateData).eq("id", userId);

        console.log(`Updated user ${userId} with plan ${plan}`);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = stripeEvent.data.object as any;
        const customerId = subscription.customer as string;

        // Find user by customer ID
        type Profile = Database["public"]["Tables"]["profiles"]["Row"];
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("stripe_customer_id", customerId)
          .single<Profile>();

        if (!profile) {
          console.error(`No profile found for customer ${customerId}`);
          break;
        }

        // Update subscription status and billing period
        const status = subscription.status;
        const billingPeriodStart = subscription.current_period_start 
          ? new Date(subscription.current_period_start * 1000).toISOString()
          : new Date().toISOString();

        await (supabase as any)
          .from("profiles")
          .update({
            subscription_status: status,
            billing_period_start: billingPeriodStart,
          })
          .eq("id", profile.id);

        console.log(
          `Updated subscription for user ${profile.id}: ${status}, billing period: ${billingPeriodStart}`
        );
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by customer ID
        type Profile = Database["public"]["Tables"]["profiles"]["Row"];
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("stripe_customer_id", customerId)
          .single<Profile>();

        if (!profile) {
          console.error(`No profile found for customer ${customerId}`);
          break;
        }

        // Reset to individual plan
        await (supabase as any)
          .from("profiles")
          .update({
            subscription_status: "cancelled",
            plan_type: "individual",
            included_reviews: 1,
            overage_price: 0,
            billing_period_start: null,
          })
          .eq("id", profile.id);

        console.log(`Subscription cancelled for user ${profile.id}`);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = stripeEvent.data.object as any;
        const customerId = invoice.customer as string;

        // Find user by customer ID
        type Profile = Database["public"]["Tables"]["profiles"]["Row"];
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("stripe_customer_id", customerId)
          .single<Profile>();

        if (!profile) {
          console.error(`No profile found for customer ${customerId}`);
          break;
        }

        // Check if this is a subscription renewal (reset usage)
        if (invoice.billing_reason === "subscription_cycle") {
          const billingPeriodStart = invoice.period_start
            ? new Date(invoice.period_start * 1000).toISOString()
            : new Date().toISOString();
          
          await (supabase as any)
            .from("profiles")
            .update({
              billing_period_start: billingPeriodStart,
            })
            .eq("id", profile.id);

          console.log(`Reset billing period for user ${profile.id}`);
        }

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

