/**
 * PAYMENT SUCCESS HANDLER
 * Creates usage records after successful payment
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseRouteHandlerClient } from '@/lib/supabaseServer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const authClient = await createSupabaseRouteHandlerClient();
    const {
      data: { session: authSession },
    } = await authClient.auth.getSession();

    if (!authSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authSession.user.id;

    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId' },
        { status: 400 }
      );
    }

    // Retrieve checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const metaUserId = session.metadata?.user_id?.trim();
    if (metaUserId && metaUserId !== userId) {
      return NextResponse.json(
        { error: 'Checkout session does not match signed-in user' },
        { status: 403 }
      );
    }

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    const planName = session.metadata?.plan_name || 'Single Review';
    const reviewsLimit = session.metadata?.reviews_limit === 'unlimited' 
      ? null 
      : parseInt(session.metadata?.reviews_limit || '1');

    // Get plan ID
    const { data: plan } = await (supabase as any)
      .from('subscription_plans')
      .select('id, price')
      .eq('plan_name', planName)
      .single();

    if (!plan) {
      console.error('[PAYMENT-SUCCESS] Plan not found:', planName);
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    // Create usage record
    const now = new Date();
    const periodEnd = new Date(now);
    
    if (session.mode === 'subscription') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      // One-time payment: valid for 30 days
      periodEnd.setDate(periodEnd.getDate() + 30);
    }

    await (supabase as any)
      .from('user_review_usage')
      .insert({
        user_id: userId,
        plan_id: plan.id,
        reviews_used: 0,
        reviews_limit: reviewsLimit,
        billing_period_start: now.toISOString(),
        billing_period_end: periodEnd.toISOString(),
        stripe_subscription_id: session.subscription || null,
        is_active: true,
      });

    // Log payment transaction
    await (supabase as any)
      .from('payment_transactions')
      .insert({
        user_id: userId,
        stripe_payment_id: session.payment_intent || session.id,
        stripe_customer_id: session.customer,
        amount: plan.price,
        currency: 'usd',
        payment_type: session.mode === 'subscription' ? 'subscription' : 'one-time',
        plan_id: plan.id,
        status: 'succeeded',
        metadata: session.metadata,
      });

    console.log(`[PAYMENT-SUCCESS] Usage record created for user ${userId}`);

    return NextResponse.json({
      success: true,
      planName,
      reviewsLimit,
      periodEnd: periodEnd.toISOString(),
    });

  } catch (error) {
    console.error('[PAYMENT-SUCCESS] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process payment success' },
      { status: 500 }
    );
  }
}
