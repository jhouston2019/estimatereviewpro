/**
 * USER USAGE API
 * Returns user's plan usage and recovery statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseRouteHandlerClient } from '@/lib/supabaseServer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const authClient = await createSupabaseRouteHandlerClient();
    const {
      data: { session },
    } = await authClient.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const paramUserId = searchParams.get('userId');

    const { data: adminRow } = await (supabase as any)
      .from('users')
      .select('is_admin')
      .eq('id', session.user.id)
      .maybeSingle();

    const isAdmin = !!(adminRow as { is_admin?: boolean } | null)?.is_admin;

    let userId = session.user.id;
    if (paramUserId && paramUserId !== session.user.id) {
      if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      userId = paramUserId;
    }

    // Get plan usage
    const { data: usageData, error: usageError } = await (supabase as any)
      .rpc('get_user_plan_usage', { user_id_param: userId });

    if (usageError) {
      console.error('[USER-USAGE] Error fetching usage:', usageError);
      return NextResponse.json(
        { error: 'Failed to fetch usage' },
        { status: 500 }
      );
    }

    // Get recovery summary
    const { data: recoveryData, error: recoveryError } = await (supabase as any)
      .rpc('get_recovery_summary', { user_id_param: userId });

    if (recoveryError) {
      console.error('[USER-USAGE] Error fetching recovery:', recoveryError);
    }

    // No active plan
    if (!usageData || usageData.length === 0) {
      return NextResponse.json({
        planName: null,
        reviewsUsed: 0,
        reviewsLimit: 0,
        reviewsRemaining: 0,
        billingPeriodEnd: null,
        totalRecovery: recoveryData?.[0]?.total_recovery || 0,
        averageRecovery: recoveryData?.[0]?.average_recovery || 0,
        totalReviews: recoveryData?.[0]?.total_reviews || 0,
      });
    }

    const usage = usageData[0];
    const recovery = recoveryData?.[0] || {};

    return NextResponse.json({
      planName: usage.plan_name,
      reviewsUsed: usage.reviews_used,
      reviewsLimit: usage.reviews_limit,
      reviewsRemaining: usage.reviews_remaining,
      billingPeriodEnd: usage.billing_period_end,
      totalRecovery: recovery.total_recovery || 0,
      averageRecovery: recovery.average_recovery || 0,
      totalReviews: recovery.total_reviews || 0,
    });
  } catch (error) {
    console.error('[USER-USAGE] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
