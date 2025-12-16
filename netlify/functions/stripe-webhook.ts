import { Handler } from "@netlify/functions";
import { createAdminClient } from "../../lib/supabase/admin";
import Stripe from "stripe";
import {
  createUsageRecord,
  resetUsage,
  calculateOverage,
} from "../../lib/usage-tracking";

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
        const customerId = session.customer as string;
        const plan = session.metadata?.plan;

        if (session.mode === "subscription") {
          // Handle subscription checkout
          const subscriptionData = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          const planType = plan === "pro" ? "pro" : "firm";
          const billingPeriodStart = new Date(
            (subscriptionData as any).current_period_start * 1000
          ).toISOString();
          const billingPeriodEnd = new Date(
            (subscriptionData as any).current_period_end * 1000
          ).toISOString();

          // Create usage record
          await createUsageRecord(
            customerId,
            planType,
            billingPeriodStart,
            billingPeriodEnd
          );

          // Update profile
          await supabase
            .from("profiles")
            // @ts-expect-error - Supabase type inference issue
            .update({
              stripe_customer_id: customerId,
              organization_id: customerId,
              plan_type: planType,
              subscription_status: "active",
              tier: "pro",
              stripe_subscription_id: (subscriptionData as any).id,
              billing_period_start: billingPeriodStart,
              billing_period_end: billingPeriodEnd,
            } as any)
            .eq("email", session.customer_email!);
        } else {
          // Handle one-time payment (individual)
          await supabase
            .from("profiles")
            // @ts-expect-error - Supabase type inference issue
            .update({
              stripe_customer_id: customerId,
              plan_type: "individual",
              tier: "individual",
            } as any)
            .eq("email", session.customer_email!);
        }

        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const billingPeriodStart = new Date(
          (subscription as any).current_period_start * 1000
        ).toISOString();
        const billingPeriodEnd = new Date(
          (subscription as any).current_period_end * 1000
        ).toISOString();

        await supabase
          .from("profiles")
          // @ts-expect-error - Supabase type inference issue
          .update({
            subscription_status: (subscription as any).status,
            billing_period_start: billingPeriodStart,
            billing_period_end: billingPeriodEnd,
            stripe_subscription_id: (subscription as any).id,
          } as any)
          .eq("stripe_customer_id", customerId);

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await supabase
          .from("profiles")
          // @ts-expect-error - Supabase type inference issue
          .update({
            subscription_status: "canceled",
            tier: "free",
            plan_type: "free",
          } as any)
          .eq("stripe_customer_id", customerId);

        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = stripeEvent.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const subscription = (invoice as any).subscription as string;

        if (subscription) {
          // Get subscription details
          const sub = await stripe.subscriptions.retrieve(subscription);

          // Check for overage on Firm plan before resetting
          const { data: profile } = await supabase
            .from("profiles")
            .select("plan_type")
            .eq("stripe_customer_id", customerId)
            .single<{ plan_type: string | null }>();

          if (profile?.plan_type === "firm") {
            // Calculate and add overage charges
            const overageAmount = await calculateOverage(customerId);

            if (overageAmount > 0) {
              await stripe.invoiceItems.create({
                customer: customerId,
                amount: Math.round(overageAmount * 100), // Convert to cents
                currency: "usd",
                description: `Additional estimate reviews (overage)`,
              });
            }
          }

          // Reset usage for new billing period
          const billingPeriodStart = new Date(
            (sub as any).current_period_start * 1000
          ).toISOString();
          const billingPeriodEnd = new Date(
            (sub as any).current_period_end * 1000
          ).toISOString();

          await resetUsage(customerId, billingPeriodStart, billingPeriodEnd);

          // Update profile billing dates
          await supabase
            .from("profiles")
            // @ts-expect-error - Supabase type inference issue
            .update({
              billing_period_start: billingPeriodStart,
              billing_period_end: billingPeriodEnd,
            } as any)
            .eq("stripe_customer_id", customerId);
        }

        break;
      }

      case "invoice.payment_failed": {
        const invoice = stripeEvent.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        await supabase
          .from("profiles")
          // @ts-expect-error - Supabase type inference issue
          .update({
            subscription_status: "past_due",
          } as any)
          .eq("stripe_customer_id", customerId);

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
    console.error("Webhook handler error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
