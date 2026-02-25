import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
});

export async function POST(request: NextRequest) {
  try {
    const { planType } = await request.json();

    if (!planType) {
      return NextResponse.json(
        { error: 'Missing planType' },
        { status: 400 }
      );
    }

    let sessionConfig: Stripe.Checkout.SessionCreateParams;

    if (planType === 'single') {
      // Single review - one-time payment
      sessionConfig = {
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Single Estimate Review',
                description: 'One-time estimate review with 30-day access',
              },
              unit_amount: 4900, // $49.00
            },
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/upload?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?payment=cancelled`,
        customer_email: undefined, // Stripe will collect email
        metadata: {
          plan_type: 'single',
        },
      };
    } else if (planType === 'professional') {
      // Professional subscription
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
    } else if (planType === 'enterprise') {
      // Enterprise subscription
      sessionConfig = {
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: process.env.STRIPE_PRICE_ENTERPRISE!,
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/upload?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?payment=cancelled`,
        customer_email: undefined,
        metadata: {
          plan_type: 'enterprise',
          review_limit: '150',
          overage_price: '1900',
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
