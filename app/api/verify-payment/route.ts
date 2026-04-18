import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseRouteHandlerClient } from '@/lib/supabaseServer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const authClient = await createSupabaseRouteHandlerClient();
    const {
      data: { session: authSession },
    } = await authClient.auth.getSession();

    if (!authSession?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing session ID' },
        { status: 400 }
      );
    }

    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (!checkoutSession || checkoutSession.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    const customerEmail =
      checkoutSession.customer_email ||
      checkoutSession.customer_details?.email;

    if (
      !customerEmail ||
      customerEmail.toLowerCase() !== authSession.user.email.toLowerCase()
    ) {
      return NextResponse.json(
        { error: 'Checkout session does not match signed-in user' },
        { status: 403 }
      );
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', customerEmail)
      .maybeSingle();

    if (!existingUser?.id) {
      return NextResponse.json(
        {
          error:
            'Account not provisioned yet. Wait a moment for confirmation, then refresh.',
        },
        { status: 409 }
      );
    }

    const { data: magicLink, error: linkError } =
      await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: customerEmail,
      });

    if (linkError || !magicLink) {
      return NextResponse.json(
        { error: 'Failed to generate login link' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      loginUrl: magicLink.properties.action_link,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
