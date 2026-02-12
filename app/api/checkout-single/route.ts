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

export async function POST(request: NextRequest) {
  try {
    const { reportId, userId } = await request.json();

    if (!reportId || !userId) {
      return NextResponse.json(
        { error: 'Missing reportId or userId' },
        { status: 400 }
      );
    }

    // Verify report exists and belongs to user
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .eq('user_id', userId)
      .single();

    if (reportError || !report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Check if already paid
    if (report.paid_single_use) {
      return NextResponse.json(
        { error: 'Report already paid' },
        { status: 400 }
      );
    }

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

      // Update user with customer ID
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_SINGLE_REVIEW!,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/reports/${reportId}?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/reports/${reportId}?payment=cancelled`,
      metadata: {
        report_id: reportId,
        user_id: userId,
        type: 'single_review',
      },
      client_reference_id: reportId,
    }, {
      idempotencyKey: `single_${reportId}_${Date.now()}`,
    });

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
