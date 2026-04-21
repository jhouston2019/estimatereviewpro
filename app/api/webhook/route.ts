import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import {
  handleSubscriptionUpdate,
  syncStripeCheckoutSession,
} from '@/lib/billing/stripeCheckoutSync';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: process.env.NODE_ENV === 'production' ? 503 : 500 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature (requires STRIPE_WEBHOOK_SECRET)
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  const { error: idemError } = await supabase
    .from('stripe_webhook_events')
    .insert({ id: event.id, type: event.type });

  if (idemError) {
    const code = (idemError as { code?: string }).code;
    if (code === '23505') {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error('stripe_webhook_events insert failed:', idemError);
    return NextResponse.json(
      { error: 'Failed to record event' },
      { status: 500 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    await syncStripeCheckoutSession(session);
  } catch (error) {
    console.error(
      '[webhook] checkout.session.completed syncStripeCheckoutSession failed',
      { session_id: session.id },
      error
    );
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Find team by subscription ID
  const { data: team } = await supabase
    .from('teams')
    .select('*')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (!team) return;

  // Remove plan from all team members
  await supabase
    .from('users')
    .update({
      plan_type: null,
      team_id: null,
    })
    .eq('team_id', team.id);

  // Delete team
  await supabase
    .from('teams')
    .delete()
    .eq('id', team.id);

  console.log(`Subscription ${subscription.id} cancelled, team ${team.id} deleted`);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Handle successful recurring payment
  // Note: Invoice type may not have subscription property in latest Stripe types
  // Cast to any to access it
  const invoiceAny = invoice as any;
  const subscriptionId = invoiceAny.subscription;
  
  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(
      typeof subscriptionId === 'string' ? subscriptionId : subscriptionId.id
    );
    
    // Reset usage for new billing period if needed
    const { data: team } = await supabase
      .from('teams')
      .select('*')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (team) {
      await supabase
        .from('teams')
        .update({ stripe_subscription_status: subscription.status })
        .eq('id', team.id);
      console.log(`Invoice paid for team ${team.id}, subscription ${subscription.id}`);
    }
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const invoiceAny = invoice as any;
  const subscriptionId = invoiceAny.subscription;

  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(
      typeof subscriptionId === 'string' ? subscriptionId : subscriptionId.id
    );

    await supabase
      .from('teams')
      .update({ stripe_subscription_status: subscription.status })
      .eq('stripe_subscription_id', subscription.id);

    const { data: team } = await supabase
      .from('teams')
      .select('*')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle();

    if (team) {
      console.error(`Payment failed for team ${team.id}, subscription ${subscription.id}`);
    }
  }
}

// Disable body parsing for webhook (Next.js App Router)
// Body parsing is handled manually in the POST function
