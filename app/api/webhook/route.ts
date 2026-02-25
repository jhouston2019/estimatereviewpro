import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
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
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
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
  const metadata = session.metadata;
  const customerEmail = session.customer_email || session.customer_details?.email;

  if (!customerEmail) {
    console.error('No customer email found in checkout session');
    return;
  }

  // Create or get user account
  let userId: string;
  
  // Check if user already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', customerEmail)
    .single();

  if (existingUser) {
    userId = existingUser.id;
  } else {
    // Create new user in auth.users (this will trigger the handle_new_user function)
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: customerEmail,
      email_confirm: true,
    });

    if (authError || !authUser.user) {
      console.error('Failed to create auth user:', authError);
      return;
    }

    userId = authUser.user.id;
  }

  // Update Stripe customer ID
  if (session.customer) {
    await supabase
      .from('users')
      .update({ stripe_customer_id: session.customer as string })
      .eq('id', userId);
  }

  // Handle single plan payment
  if (metadata?.plan_type === 'single') {
    await supabase
      .from('users')
      .update({ plan_type: 'single' })
      .eq('id', userId);

    console.log(`Single plan payment completed for user ${userId}`);
  }

  // Handle legacy single_plan type
  if (metadata?.type === 'single_plan') {
    const legacyUserId = metadata.user_id;
    if (legacyUserId) {
      await supabase
        .from('users')
        .update({ plan_type: 'single' })
        .eq('id', legacyUserId);
      console.log(`Single plan payment completed for user ${legacyUserId}`);
    }
  }

  // Handle single review payment (legacy - for individual report payment)
  if (metadata.type === 'single_review') {
    const reportId = metadata.report_id;
    const userId = metadata.user_id;

    if (!reportId || !userId) return;

    // Mark report as paid and set expiration (30 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await supabase
      .from('reports')
      .update({
        paid_single_use: true,
        expires_at: expiresAt.toISOString(),
      })
      .eq('id', reportId)
      .eq('user_id', userId);

    console.log(`Single review payment completed for report ${reportId}`);
  }

  // Handle subscription creation
  if (session.mode === 'subscription' && session.subscription) {
    const subscriptionId = session.subscription as string;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await handleSubscriptionUpdate(subscription);
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const metadata = subscription.metadata;
  const planType = metadata.plan_type;
  const reviewLimit = parseInt(metadata.review_limit || '0');
  const overagePrice = parseInt(metadata.overage_price || '0');

  if (!planType) return;

  // Get customer email to find/create user
  const customer = await stripe.customers.retrieve(subscription.customer as string);
  if (!customer || customer.deleted) return;

  const customerEmail = customer.email;
  if (!customerEmail) return;

  // Find or create user
  let userId: string;
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', customerEmail)
    .single();

  if (existingUser) {
    userId = existingUser.id;
  } else {
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: customerEmail,
      email_confirm: true,
    });

    if (authError || !authUser.user) {
      console.error('Failed to create auth user:', authError);
      return;
    }

    userId = authUser.user.id;
  }

  // Check if team already exists
  const { data: existingTeam } = await supabase
    .from('teams')
    .select('*')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (existingTeam) {
    // Update existing team
    await supabase
      .from('teams')
      .update({
        plan_type: planType,
        review_limit: reviewLimit,
        overage_price: overagePrice,
      })
      .eq('id', existingTeam.id);
  } else {
    // Create new team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        name: `${planType.charAt(0).toUpperCase() + planType.slice(1)} Team`,
        owner_id: userId,
        plan_type: planType as 'professional' | 'enterprise',
        stripe_subscription_id: subscription.id,
        review_limit: reviewLimit,
        overage_price: overagePrice,
      })
      .select()
      .single();

    if (teamError) {
      console.error('Failed to create team:', teamError);
      return;
    }

    // Update user with team and plan
    await supabase
      .from('users')
      .update({
        team_id: team.id,
        plan_type: planType,
        role: 'owner',
      })
      .eq('id', userId);
  }

  console.log(`Subscription ${subscription.id} updated for user ${userId}`);
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
      console.log(`Invoice paid for team ${team.id}, subscription ${subscription.id}`);
    }
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Handle failed payment
  const invoiceAny = invoice as any;
  const subscriptionId = invoiceAny.subscription;
  
  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(
      typeof subscriptionId === 'string' ? subscriptionId : subscriptionId.id
    );
    
    const { data: team } = await supabase
      .from('teams')
      .select('*')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (team) {
      console.error(`Payment failed for team ${team.id}, subscription ${subscription.id}`);
      // Could send notification email here
    }
  }
}

// Disable body parsing for webhook (Next.js App Router)
// Body parsing is handled manually in the POST function
