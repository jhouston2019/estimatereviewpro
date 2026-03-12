/**
 * RECOVERY VALUE CARD
 * Displays recovery opportunity and guarantee status
 */

'use client';

import React from 'react';

export interface RecoveryValueProps {
  originalEstimate: number;
  reconstructedValue: number;
  recoveryOpportunity: number;
  recoveryPercentage: number;
  guaranteeTriggered?: boolean;
  refundIssued?: boolean;
  refundAmount?: number;
}

export default function RecoveryValueCard({
  originalEstimate,
  reconstructedValue,
  recoveryOpportunity,
  recoveryPercentage,
  guaranteeTriggered = false,
  refundIssued = false,
  refundAmount,
}: RecoveryValueProps) {
  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">
          Total Recovery Opportunity
        </h2>
        {recoveryOpportunity >= 10000 && (
          <span className="px-3 py-1 bg-green-600 text-white text-sm font-semibold rounded-full">
            HIGH VALUE
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div>
          <p className="text-sm text-gray-600 mb-1">Original Estimate</p>
          <p className="text-2xl font-bold text-gray-900">
            ${originalEstimate.toLocaleString()}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-600 mb-1">Reconstructed Value</p>
          <p className="text-2xl font-bold text-blue-600">
            ${reconstructedValue.toLocaleString()}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-600 mb-1">Recovery Opportunity</p>
          <p className="text-3xl font-bold text-green-600">
            ${recoveryOpportunity.toLocaleString()}
          </p>
          <p className="text-sm text-green-700 font-medium mt-1">
            +{recoveryPercentage.toFixed(1)}% increase
          </p>
        </div>
      </div>

      {/* Recovery Breakdown Visual */}
      <div className="relative h-12 bg-gray-200 rounded-lg overflow-hidden mb-6">
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm"
          style={{ width: `${(originalEstimate / reconstructedValue) * 100}%` }}
        >
          Original
        </div>
        <div
          className="absolute right-0 top-0 h-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center text-white font-semibold text-sm"
          style={{ width: `${(recoveryOpportunity / reconstructedValue) * 100}%` }}
        >
          Recovery
        </div>
      </div>

      {/* Recovery Guarantee */}
      <div className="border-t-2 border-green-200 pt-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {guaranteeTriggered ? (
              refundIssued ? (
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )
            ) : (
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Recovery Guarantee
            </h3>
            
            {guaranteeTriggered ? (
              refundIssued ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-900 font-medium mb-2">
                    Guarantee Activated - Full Refund Issued
                  </p>
                  <p className="text-blue-800 text-sm">
                    We found ${recoveryOpportunity.toLocaleString()} in potential recovery (below our $1,000 guarantee threshold). 
                    A full refund of ${refundAmount ? `$${refundAmount.toFixed(2)}` : '$149.00'} has been issued to your payment method.
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-900 font-medium mb-2">
                    Guarantee Triggered
                  </p>
                  <p className="text-yellow-800 text-sm">
                    We found ${recoveryOpportunity.toLocaleString()} in potential recovery (below our $1,000 guarantee threshold). 
                    This review is complimentary.
                  </p>
                </div>
              )
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-900 font-medium mb-2">
                  Guarantee Met - ${recoveryOpportunity.toLocaleString()} Identified
                </p>
                <p className="text-green-800 text-sm">
                  We identified <span className="font-semibold">${recoveryOpportunity.toLocaleString()}</span> in 
                  potential recovery value. Our guarantee: If we don't find at least $1,000 in missed claim value, 
                  your review is free.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ROI Calculation */}
      {recoveryOpportunity > 0 && !guaranteeTriggered && (
        <div className="mt-6 bg-white border-2 border-green-300 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Return on Investment</p>
              <p className="text-lg font-semibold text-gray-900">
                {((recoveryOpportunity / 149) * 100).toFixed(0)}x ROI
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Review Cost</p>
              <p className="text-lg font-semibold text-gray-900">$149</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Potential Recovery</p>
              <p className="text-2xl font-bold text-green-600">
                ${recoveryOpportunity.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
