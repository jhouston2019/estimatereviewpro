import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const { userId, estimateName, estimateType, damageType, estimateText } = await request.json();

    if (!userId || !estimateName || !estimateText) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // SERVER-SIDE USAGE ENFORCEMENT
    const { data: permissionData, error: permissionError } = await supabase
      .rpc('can_create_review', { p_user_id: userId });

    if (permissionError) {
      console.error('Permission check error:', permissionError);
      return NextResponse.json(
        { error: 'Permission check failed' },
        { status: 500 }
      );
    }

    const permission = permissionData as any;

    // If preview only, create report but don't increment usage
    if (permission.preview_only) {
      // Create report (unpaid)
      const { data: report, error: reportError } = await supabase
        .from('reports')
        .insert({
          user_id: userId,
          estimate_name: estimateName,
          estimate_type: estimateType,
          damage_type: damageType,
          result_json: {
            // Placeholder - actual AI analysis would go here
            status: 'preview',
            message: 'Preview mode - payment required for full export',
          },
          paid_single_use: false,
        })
        .select()
        .single();

      if (reportError) {
        return NextResponse.json(
          { error: 'Failed to create report' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        reportId: report.id,
        previewOnly: true,
        requiresPayment: true,
      });
    }

    // User has subscription - check usage
    const { data: user } = await supabase
      .from('users')
      .select('team_id, plan_type')
      .eq('id', userId)
      .single();

    if (!user?.team_id) {
      return NextResponse.json(
        { error: 'No active subscription' },
        { status: 403 }
      );
    }

    // Check if overage
    const isOverage = permission.is_overage;

    // Increment usage (handles overage counting automatically)
    await supabase.rpc('increment_team_usage', { p_team_id: user.team_id });

    // If overage, bill immediately
    if (isOverage) {
      await billOverage(user.team_id, permission.overage_price);
    }

    // Create report
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        user_id: userId,
        team_id: user.team_id,
        estimate_name: estimateName,
        estimate_type: estimateType,
        damage_type: damageType,
        result_json: {
          // Placeholder - actual AI analysis would go here
          status: 'complete',
          reviewCount: permission.review_count + 1,
          reviewLimit: permission.review_limit,
          isOverage: isOverage,
        },
        paid_single_use: false, // Subscription, not single use
      })
      .select()
      .single();

    if (reportError) {
      return NextResponse.json(
        { error: 'Failed to create report' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reportId: report.id,
      previewOnly: false,
      usage: {
        reviewCount: permission.review_count + 1,
        reviewLimit: permission.review_limit,
        overageCount: isOverage ? permission.overage_count + 1 : permission.overage_count,
        overagePrice: permission.overage_price,
      },
    });
  } catch (error) {
    console.error('Create review error:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}

async function billOverage(teamId: string, overagePrice: number) {
  try {
    // Get team and subscription
    const { data: team } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();

    if (!team || !team.stripe_subscription_id) {
      throw new Error('Team or subscription not found');
    }

    // Get subscription
    const subscription = await stripe.subscriptions.retrieve(team.stripe_subscription_id);

    // Determine overage price ID based on plan
    const overagePriceId = team.plan_type === 'professional'
      ? process.env.STRIPE_PRICE_PROFESSIONAL_OVERAGE!
      : process.env.STRIPE_PRICE_ENTERPRISE_OVERAGE!;

    // Create usage record for metered billing
    const subscriptionItem = subscription.items.data.find(
      item => item.price.id === overagePriceId
    );

    if (subscriptionItem) {
      // Report usage
      await stripe.subscriptionItems.createUsageRecord(
        subscriptionItem.id,
        {
          quantity: 1,
          timestamp: Math.floor(Date.now() / 1000),
          action: 'increment',
        },
        {
          idempotencyKey: `overage_${teamId}_${Date.now()}`,
        }
      );
    } else {
      // Add overage price to subscription if not already added
      await stripe.subscriptions.update(subscription.id, {
        items: [
          ...subscription.items.data.map(item => ({ id: item.id })),
          { price: overagePriceId },
        ],
      });

      // Then report usage
      const updatedSubscription = await stripe.subscriptions.retrieve(subscription.id);
      const newItem = updatedSubscription.items.data.find(
        item => item.price.id === overagePriceId
      );

      if (newItem) {
        await stripe.subscriptionItems.createUsageRecord(
          newItem.id,
          {
            quantity: 1,
            timestamp: Math.floor(Date.now() / 1000),
            action: 'increment',
          },
          {
            idempotencyKey: `overage_${teamId}_${Date.now()}`,
          }
        );
      }
    }

    console.log(`Billed overage for team ${teamId}: $${overagePrice}`);
  } catch (error) {
    console.error('Overage billing error:', error);
    // Don't throw - allow review to proceed even if billing fails
  }
}
