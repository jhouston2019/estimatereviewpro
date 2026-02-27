/**
 * O&P (OVERHEAD & PROFIT) GAP DETECTOR
 * Enhanced detection for missing or improper O&P application
 * Integrates with exposure engine and depreciation validator
 */

export interface OPGap {
  gapType: 'MISSING_ON_RECOVERABLE' | 'MISSING_ON_ESTIMATE' | 'IMPROPER_RATE' | 'APPLIED_TO_NON_RECOVERABLE';
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  description: string;
  estimatedImpact: number;
  recoverableDepreciation: number;
  expectedOP: number;
  actualOP: number;
  lineItemsAffected: number[];
  explanation: string;
}

export interface OPAnalysis {
  hasOP: boolean;
  opAmount: number;
  opPercentage: number;
  recoverableDepreciation: number;
  expectedOPOnRecoverable: number;
  gaps: OPGap[];
  totalImpact: number;
  opScore: number; // 0-100
}

/**
 * Standard O&P rates
 */
const STANDARD_OP_RATES = {
  OVERHEAD: 0.10, // 10%
  PROFIT: 0.10,   // 10%
  TOTAL: 0.20,    // 20% combined
};

/**
 * Analyze O&P in estimate
 */
export function analyzeOPGaps(
  lineItems: Array<{
    lineNumber: number;
    description: string;
    rcv: number;
    acv: number;
    depreciation: number;
    overhead: boolean;
    profit: boolean;
  }>
): OPAnalysis {
  
  console.log(`[OP-DETECTOR] Analyzing O&P gaps...`);
  
  const gaps: OPGap[] = [];
  let totalImpact = 0;
  
  // Calculate total recoverable depreciation
  const recoverableDepreciation = lineItems.reduce((sum, item) => sum + item.depreciation, 0);
  
  // Find O&P line items
  const opItems = lineItems.filter(item => 
    /overhead|profit|o&p|o & p/i.test(item.description)
  );
  
  const hasOP = opItems.length > 0;
  const opAmount = opItems.reduce((sum, item) => sum + item.rcv, 0);
  
  // Calculate expected O&P on recoverable depreciation
  const expectedOPOnRecoverable = recoverableDepreciation * STANDARD_OP_RATES.TOTAL;
  
  // Calculate total estimate value (excluding O&P)
  const estimateTotal = lineItems
    .filter(item => !opItems.includes(item))
    .reduce((sum, item) => sum + item.rcv, 0);
  
  const opPercentage = estimateTotal > 0 ? (opAmount / estimateTotal) * 100 : 0;
  
  // GAP 1: Missing O&P on recoverable depreciation
  if (recoverableDepreciation > 0 && !hasOP) {
    const impact = expectedOPOnRecoverable;
    totalImpact += impact;
    
    gaps.push({
      gapType: 'MISSING_ON_RECOVERABLE',
      severity: 'HIGH',
      description: 'No overhead & profit line item found despite recoverable depreciation',
      estimatedImpact: impact,
      recoverableDepreciation,
      expectedOP: expectedOPOnRecoverable,
      actualOP: 0,
      lineItemsAffected: lineItems.filter(i => i.depreciation > 0).map(i => i.lineNumber),
      explanation: `When depreciation is recovered upon completion of repairs, it should include the contractor's overhead and profit. Standard industry practice is 10% overhead + 10% profit = 20% total. Missing O&P on $${recoverableDepreciation.toFixed(2)} recoverable depreciation = $${impact.toFixed(2)} exposure.`,
    });
  }
  
  // GAP 2: O&P present but rate is too low
  if (hasOP && opPercentage < 15 && estimateTotal > 0) {
    const expectedOP = estimateTotal * STANDARD_OP_RATES.TOTAL;
    const impact = expectedOP - opAmount;
    
    if (impact > 100) { // Only flag if impact is significant
      totalImpact += impact;
      
      gaps.push({
        gapType: 'IMPROPER_RATE',
        severity: 'MODERATE',
        description: `O&P rate of ${opPercentage.toFixed(1)}% is below industry standard of 20%`,
        estimatedImpact: impact,
        recoverableDepreciation,
        expectedOP,
        actualOP: opAmount,
        lineItemsAffected: opItems.map(i => i.lineNumber),
        explanation: `Industry standard for overhead & profit is 10% overhead + 10% profit = 20% total. Current estimate shows ${opPercentage.toFixed(1)}%, which is ${(20 - opPercentage).toFixed(1)}% below standard. This represents $${impact.toFixed(2)} in missing contractor compensation.`,
      });
    }
  }
  
  // GAP 3: Missing O&P on entire estimate (no O&P at all)
  if (!hasOP && estimateTotal > 5000) {
    const expectedOP = estimateTotal * STANDARD_OP_RATES.TOTAL;
    const impact = expectedOP;
    totalImpact += impact;
    
    gaps.push({
      gapType: 'MISSING_ON_ESTIMATE',
      severity: 'HIGH',
      description: 'No overhead & profit included in estimate',
      estimatedImpact: impact,
      recoverableDepreciation,
      expectedOP,
      actualOP: 0,
      lineItemsAffected: [],
      explanation: `Professional contractors include overhead (office, insurance, equipment, etc.) and profit in their pricing. Standard industry practice is 10% overhead + 10% profit = 20% total. An estimate without O&P is incomplete and cannot be executed by a licensed contractor. Missing O&P on $${estimateTotal.toFixed(2)} estimate = $${impact.toFixed(2)} exposure.`,
    });
  }
  
  // GAP 4: O&P applied to non-recoverable items (less common, but check)
  const nonRecoverableWithOP = lineItems.filter(item => 
    item.depreciation === 0 && // No depreciation = non-recoverable
    (item.overhead || item.profit) &&
    !/overhead|profit/i.test(item.description) // Not the O&P line itself
  );
  
  if (nonRecoverableWithOP.length > 0) {
    // This is actually not a gap - it's correct to have O&P on all work
    // But flag if O&P is ONLY on non-recoverable (suspicious)
    const recoverableWithOP = lineItems.filter(item => 
      item.depreciation > 0 && (item.overhead || item.profit)
    );
    
    if (recoverableWithOP.length === 0 && nonRecoverableWithOP.length > 0) {
      gaps.push({
        gapType: 'APPLIED_TO_NON_RECOVERABLE',
        severity: 'MODERATE',
        description: 'O&P applied only to non-recoverable items',
        estimatedImpact: 0,
        recoverableDepreciation,
        expectedOP: expectedOPOnRecoverable,
        actualOP: opAmount,
        lineItemsAffected: nonRecoverableWithOP.map(i => i.lineNumber),
        explanation: 'O&P should be applied to all work, including recoverable depreciation. Current estimate shows O&P only on non-recoverable items, which may indicate improper calculation.',
      });
    }
  }
  
  // Calculate O&P score (0-100)
  const opScore = calculateOPScore(gaps, opPercentage, hasOP);
  
  console.log(`[OP-DETECTOR] Analysis complete:`);
  console.log(`[OP-DETECTOR] - Has O&P: ${hasOP}`);
  console.log(`[OP-DETECTOR] - O&P amount: $${opAmount.toFixed(2)}`);
  console.log(`[OP-DETECTOR] - O&P percentage: ${opPercentage.toFixed(1)}%`);
  console.log(`[OP-DETECTOR] - Gaps detected: ${gaps.length}`);
  console.log(`[OP-DETECTOR] - Total impact: $${totalImpact.toFixed(2)}`);
  console.log(`[OP-DETECTOR] - O&P score: ${opScore}/100`);
  
  return {
    hasOP,
    opAmount,
    opPercentage,
    recoverableDepreciation,
    expectedOPOnRecoverable,
    gaps,
    totalImpact,
    opScore,
  };
}

/**
 * Calculate O&P score (0-100)
 */
function calculateOPScore(gaps: OPGap[], opPercentage: number, hasOP: boolean): number {
  let score = 100;
  
  // Deduct for missing O&P
  if (!hasOP) {
    score -= 30;
  }
  
  // Deduct for gaps
  score -= gaps.filter(g => g.severity === 'CRITICAL').length * 20;
  score -= gaps.filter(g => g.severity === 'HIGH').length * 15;
  score -= gaps.filter(g => g.severity === 'MODERATE').length * 10;
  
  // Deduct for low O&P percentage
  if (hasOP && opPercentage < 15) {
    score -= 10;
  } else if (hasOP && opPercentage < 18) {
    score -= 5;
  }
  
  return Math.max(0, score);
}

/**
 * Generate O&P analysis summary
 */
export function generateOPSummary(analysis: OPAnalysis): string {
  let summary = `O&P (OVERHEAD & PROFIT) ANALYSIS\n`;
  summary += `${'='.repeat(60)}\n\n`;
  
  summary += `OVERALL ANALYSIS:\n`;
  summary += `- O&P present: ${analysis.hasOP ? 'YES' : 'NO'}\n`;
  summary += `- O&P amount: $${analysis.opAmount.toFixed(2)}\n`;
  summary += `- O&P percentage: ${analysis.opPercentage.toFixed(1)}%\n`;
  summary += `- Recoverable depreciation: $${analysis.recoverableDepreciation.toFixed(2)}\n`;
  summary += `- Expected O&P on recoverable: $${analysis.expectedOPOnRecoverable.toFixed(2)}\n`;
  summary += `- O&P score: ${analysis.opScore}/100\n`;
  summary += `- Total impact: $${analysis.totalImpact.toFixed(2)}\n\n`;
  
  if (analysis.gaps.length === 0) {
    summary += `✓ No O&P gaps detected\n`;
    summary += `Overhead & profit appears to be properly included.\n`;
    return summary;
  }
  
  summary += `O&P GAPS DETECTED (${analysis.gaps.length}):\n\n`;
  
  for (const gap of analysis.gaps) {
    summary += `${gap.severity} - ${gap.gapType}\n`;
    summary += `Description: ${gap.description}\n`;
    summary += `Estimated Impact: $${gap.estimatedImpact.toFixed(2)}\n`;
    summary += `Explanation: ${gap.explanation}\n`;
    summary += `Line Items Affected: ${gap.lineItemsAffected.length}\n`;
    summary += `${'-'.repeat(60)}\n\n`;
  }
  
  summary += `INDUSTRY STANDARD:\n`;
  summary += `- Overhead: 10% (covers office, insurance, equipment, etc.)\n`;
  summary += `- Profit: 10% (contractor's profit margin)\n`;
  summary += `- Total: 20% (standard industry practice)\n\n`;
  
  summary += `NOTE: O&P should be applied to:\n`;
  summary += `1. All direct repair costs (materials + labor)\n`;
  summary += `2. Recoverable depreciation upon completion\n`;
  summary += `3. Code-required upgrades\n\n`;
  
  return summary;
}

/**
 * Get standard O&P rates
 */
export function getStandardOPRates() {
  return STANDARD_OP_RATES;
}
