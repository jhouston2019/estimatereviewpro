/**
 * USAGE METRICS COMPONENT
 * Displays plan usage and recovery statistics
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export interface UsageMetricsProps {
  userId: string;
}

interface UsageData {
  planName: string;
  reviewsUsed: number;
  reviewsLimit: number | null;
  reviewsRemaining: number | null;
  billingPeriodEnd: string;
  totalRecovery: number;
  averageRecovery: number;
  totalReviews: number;
}

export default function UsageMetrics({ userId }: UsageMetricsProps) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const response = await fetch(`/api/user-usage?userId=${userId}`);
        const data = await response.json();
        setUsage(data);
      } catch (error) {
        console.error('Failed to fetch usage:', error);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchUsage();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-800 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-slate-800 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!usage) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-300 mb-2">
            No Active Plan
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            Get started with a single review or subscribe to a plan
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center rounded-lg bg-[#2563EB] px-6 py-2 text-sm font-semibold text-white hover:bg-[#1E40AF] transition"
          >
            View Pricing
          </Link>
        </div>
      </div>
    );
  }

  const isUnlimited = usage.reviewsLimit === null;
  const usagePercentage = isUnlimited ? 0 : (usage.reviewsUsed / usage.reviewsLimit!) * 100;
  const periodEnd = new Date(usage.billingPeriodEnd);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Plan Usage Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            {usage.planName}
          </h3>
          {isUnlimited && (
            <span className="px-3 py-1 bg-purple-600 text-white text-xs font-semibold rounded-full">
              UNLIMITED
            </span>
          )}
        </div>

        {isUnlimited ? (
          <div className="mb-4">
            <p className="text-3xl font-bold text-white mb-1">
              {usage.reviewsUsed}
            </p>
            <p className="text-sm text-slate-400">
              Reviews this month
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-white">
                  {usage.reviewsRemaining}
                </span>
                <span className="text-slate-400">
                  of {usage.reviewsLimit} remaining
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`absolute left-0 top-0 h-full transition-all ${
                    usagePercentage >= 90 ? 'bg-red-500' :
                    usagePercentage >= 70 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${usagePercentage}%` }}
                />
              </div>
            </div>

            {usagePercentage >= 80 && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
                <p className="text-xs text-yellow-400">
                  {usagePercentage >= 90 ? '⚠️ Almost out of reviews!' : '⚠️ Running low on reviews'}
                </p>
              </div>
            )}
          </>
        )}

        <div className="border-t border-slate-700 pt-4 mt-4">
          <p className="text-xs text-slate-400">
            Billing period ends: {periodEnd.toLocaleDateString()}
          </p>
        </div>

        {!isUnlimited && usage.reviewsRemaining === 0 && (
          <Link
            href="/pricing"
            className="mt-4 w-full inline-flex items-center justify-center rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1E40AF] transition"
          >
            Upgrade Plan
          </Link>
        )}
      </div>

      {/* Recovery Statistics Card */}
      <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-700/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Total Recovery Identified
        </h3>

        <div className="mb-6">
          <p className="text-4xl font-bold text-green-400 mb-1">
            ${usage.totalRecovery.toLocaleString()}
          </p>
          <p className="text-sm text-slate-400">
            Across {usage.totalReviews} review{usage.totalReviews !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-slate-400 mb-1">Average Recovery</p>
            <p className="text-xl font-bold text-white">
              ${usage.averageRecovery.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">ROI</p>
            <p className="text-xl font-bold text-white">
              {usage.planName === 'Single Review' 
                ? `${((usage.averageRecovery / 149) * 100).toFixed(0)}x`
                : `${((usage.totalRecovery / (usage.planName === 'Enterprise' ? 299 : 499)) * 100).toFixed(0)}x`
              }
            </p>
          </div>
        </div>

        {usage.totalRecovery >= 50000 && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
            <p className="text-xs text-green-400 font-semibold">
              🎉 You've identified over $50K in recovery value!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
