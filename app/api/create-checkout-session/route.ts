import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { appAbsoluteUrl } from '@/lib/appUrl';

const STRIPE_API_VERSION: Stripe.LatestApiVersion = '2025-11-17.clover';

function maskKeyPrefix(value: string | undefined, expectedPrefix: string) {
  if (!value?.trim()) return { present: false as const, prefix: '' };
  const v = value.trim();
  const ok = v.startsWith(expectedPrefix);
  return {
    present: true as const,
    prefix: v.length >= 12 ? `${v.slice(0, 8)}…${v.slice(-4)}` : '(too short)',
    looksLikeTestKey: ok,
  };
}

function stripeEnvDiagnostics() {
  const secret = process.env.STRIPE_SECRET_KEY;
  const publishable = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  return {
    STRIPE_SECRET_KEY: maskKeyPrefix(secret, 'sk_test_'),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: maskKeyPrefix(
      publishable,
      'pk_test_'
    ),
  };
}

export async function POST(request: NextRequest) {
  const envDiag = stripeEnvDiagnostics();
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  const appPublicUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  try {
    if (!appPublicUrl || !/^https?:\/\//i.test(appPublicUrl)) {
      console.error(
        '[create-checkout-session] NEXT_PUBLIC_APP_URL must be an absolute URL (e.g. https://estimatereviewpro.com)'
      );
      return NextResponse.json(
        {
          error: 'App URL is not configured',
          details:
            'Set NEXT_PUBLIC_APP_URL to your production origin in Netlify (Site settings → Environment variables), redeploy. Trailing slash is optional.',
        },
        { status: 500 }
      );
    }

    if (!secretKey) {
      console.error(
        '[create-checkout-session] STRIPE_SECRET_KEY is missing or empty'
      );
      return NextResponse.json(
        {
          error: 'Stripe secret key is not configured',
          details:
            'Set STRIPE_SECRET_KEY in .env.local (Test mode: sk_test_…) and restart the dev server.',
          stripeEnv: envDiag,
        },
        { status: 500 }
      );
    }

    if (!secretKey.startsWith('sk_test_')) {
      console.warn(
        '[create-checkout-session] STRIPE_SECRET_KEY does not start with sk_test_'
      );
    }

    const stripe = new Stripe(secretKey, {
      apiVersion: STRIPE_API_VERSION,
    });

    const { planType } = await request.json();

    if (!planType) {
      return NextResponse.json(
        { error: 'Missing planType' },
        { status: 400 }
      );
    }

    const successUrl = appAbsoluteUrl(
      'success?session_id={CHECKOUT_SESSION_ID}'
    );

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
              },
              unit_amount: 4900, // $49.00
            },
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: appAbsoluteUrl('cancel'),
        customer_email: undefined,
        metadata: {
          plan_type: 'single',
          plan_name: 'Single Review',
          reviews_limit: '1',
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
              },
              unit_amount: 59900, // $599.00
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: appAbsoluteUrl('cancel'),
        customer_email: undefined,
        subscription_data: {
          metadata: {
            plan_type: 'enterprise',
            plan_name: 'Enterprise',
            review_limit: '20',
          },
        },
        metadata: {
          plan_type: 'enterprise',
          plan_name: 'Enterprise',
          reviews_limit: 'unlimited',
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
              },
              unit_amount: 29900, // $299.00
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: appAbsoluteUrl('cancel'),
        customer_email: undefined,
        subscription_data: {
          metadata: {
            plan_type: 'premier',
            plan_name: 'Premier',
            review_limit: '20',
          },
        },
        metadata: {
          plan_type: 'premier',
          plan_name: 'Premier',
          reviews_limit: '20',
        },
      };
    } else if (planType === 'professional') {
      // Legacy professional plan (keep for backward compatibility)
      const priceId = process.env.STRIPE_PRICE_PROFESSIONAL?.trim();
      if (!priceId) {
        console.error(
          '[create-checkout-session] STRIPE_PRICE_PROFESSIONAL is missing for plan professional'
        );
        return NextResponse.json(
          {
            error: 'STRIPE_PRICE_PROFESSIONAL is not configured',
            details:
              'Add STRIPE_PRICE_PROFESSIONAL=price_… to .env.local (Stripe Dashboard → Products → price id).',
            stripeEnv: envDiag,
          },
          { status: 500 }
        );
      }
      sessionConfig = {
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: appAbsoluteUrl('cancel'),
        customer_email: undefined,
        subscription_data: {
          metadata: {
            plan_type: 'professional',
            review_limit: '50',
            overage_price: '2900',
          },
        },
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

    const checkoutSession = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    const payload: Record<string, unknown> = {
      error: 'Failed to create checkout session',
      stripeEnv: stripeEnvDiagnostics(),
    };

    if (error instanceof Stripe.errors.StripeError) {
      console.error('[create-checkout-session] Stripe API error:', {
        type: error.type,
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        requestId: error.requestId,
        doc_url: error.doc_url,
      });
      payload.error = error.message;
      payload.stripeError = {
        type: error.type,
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        requestId: error.requestId,
        doc_url: error.doc_url,
      };
    } else if (error instanceof Error) {
      console.error('[create-checkout-session] Error:', error.message, error.stack);
      payload.error = error.message;
      if (process.env.NODE_ENV === 'development') {
        payload.details = error.stack;
      }
    } else {
      console.error('[create-checkout-session] Unknown error:', error);
      payload.details = String(error);
    }

    return NextResponse.json(payload, { status: 500 });
  }
}
