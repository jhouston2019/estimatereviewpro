import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
});

export async function POST(request: NextRequest) {
  try {
    const { planType, userId } = await request.json();

    if (!planType) {
      return NextResponse.json(
        { error: 'Missing planType' },
        { status: 400 }
      );
    }

    let sessionConfig: Stripe.Checkout.SessionCreateParams;

    if (planType === 'single') {
      // Single review - one-time payment $149
      sessionConfig = {
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Single Estimate Review',
                description: 'Find $10,000-$40,000 in missed claim value. Recovery guarantee: Free if we find less than $1,000.',
              },
              unit_amount: 4900, // $49.00
            },
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/upload?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?payment=cancelled`,
        customer_email: undefined,
        metadata: {
          plan_type: 'single',
          plan_name: 'Single Review',
          reviews_limit: '1',
          user_id: userId || '',
        },
      };
    } else if (planType === 'enterprise') {
      // Enterprise plan - $299/month, 20 reviews
      sessionConfig = {
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Enterprise Plan',
                description: '20 estimate reviews per month + carrier intelligence reports + recovery analytics dashboard',
              },
              unit_amount: 29900, // $299.00
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?payment=cancelled`,
        customer_email: undefined,
        metadata: {
          plan_type: 'subscription',
          plan_name: 'Enterprise',
          reviews_limit: '20',
          user_id: userId || '',
        },
      };
    } else if (planType === 'premier') {
      // Premier plan - $299/month, 20 reviews
      sessionConfig = {
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Premier Plan',
                description: '20 estimate reviews per month + carrier intelligence reports + recovery analytics dashboard',
              },
              unit_amount: 29900, // $299.00
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?payment=cancelled`,
        customer_email: undefined,
        metadata: {
          plan_type: 'subscription',
          plan_name: 'Premier',
          reviews_limit: '20',
          user_id: userId || '',
        },
      };
    } else if (planType === 'enterprise') {
      // Enterprise plan - $599/month, unlimited reviews
      sessionConfig = {
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Enterprise Plan',
                description: 'Unlimited reviews + evidence reports + carrier behavior analytics + dedicated support',
              },
              unit_amount: 59900, // $599.00
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?payment=cancelled`,
        customer_email: undefined,
        metadata: {
          plan_type: 'subscription',
          plan_name: 'Enterprise',
          reviews_limit: 'unlimited',
          user_id: userId || '',
        },
      };
    } else if (planType === 'professional') {
      // Legacy professional plan (keep for backward compatibility)
      sessionConfig = {
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: process.env.STRIPE_PRICE_PROFESSIONAL!,
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/upload?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?payment=cancelled`,
        customer_email: undefined,
        metadata: {
          plan_type: 'professional',
          review_limit: '50',
          overage_price: '2900',
        },
      };
    } else {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
