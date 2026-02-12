import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PLAN_CONFIG = {
  professional: {
    priceId: process.env.STRIPE_PRICE_PROFESSIONAL!,
    overagePriceId: process.env.STRIPE_PRICE_PROFESSIONAL_OVERAGE!,
    reviewLimit: 50,
    overagePrice: 29,
  },
  enterprise: {
    priceId: process.env.STRIPE_PRICE_ENTERPRISE!,
    overagePriceId: process.env.STRIPE_PRICE_ENTERPRISE_OVERAGE!,
    reviewLimit: 150,
    overagePrice: 19,
  },
};

export async function POST(request: NextRequest) {
  try {
    const { planType, userId, teamName } = await request.json();

    if (!planType || !userId) {
      return NextResponse.json(
        { error: 'Missing planType or userId' },
        { status: 400 }
      );
    }

    if (!['professional', 'enterprise'].includes(planType)) {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      );
    }

    const config = PLAN_CONFIG[planType as keyof typeof PLAN_CONFIG];

    // Get or create Stripe customer
    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id, email')
      .eq('id', userId)
      .single();

    let customerId = user?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user?.email,
        metadata: {
          supabase_user_id: userId,
        },
      });
      customerId = customer.id;

      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    // Create Checkout Session for subscription
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: config.priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?subscription=cancelled`,
      subscription_data: {
        metadata: {
          user_id: userId,
          plan_type: planType,
          team_name: teamName || `${planType} Team`,
        },
      },
      metadata: {
        user_id: userId,
        plan_type: planType,
        team_name: teamName || `${planType} Team`,
        review_limit: config.reviewLimit.toString(),
        overage_price: config.overagePrice.toString(),
      },
      allow_promotion_codes: true,
    }, {
      idempotencyKey: `subscription_${userId}_${planType}_${Date.now()}`,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Subscription checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
