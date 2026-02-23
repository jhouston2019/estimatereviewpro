/**
 * STRUCTURAL TRADE COMPLETENESS ENGINE
 * Scores each trade 0-100 based on completeness criteria
 * Uses ACTUAL parsed quantities for validation
 */

import { StructuredEstimate, StructuredLineItem } from './xactimate-structural-parser';

type IssueSeverity = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';

export interface TradeIssue {
  type: 'MISSING_REMOVAL' | 'MISSING_REPLACEMENT' | 'MISSING_FINISH' | 'MISSING_LABOR' | 'QUANTITY_MISMATCH' | 'ZERO_QUANTITY';
  description: string;
  severity: IssueSeverity;
  quantity?: number;
  unit?: string;
}

export interface TradeScore {
  tradeCode: string;
  tradeName: string;
  completenessScore: number;
  issues: TradeIssue[];
  hasRemoval: boolean;
  hasReplacement: boolean;
  hasFinish: boolean;
  quantityConsistent: boolean;
  removalQuantity: number;
  replacementQuantity: number;
}

export interface CompletenessAnalysis {
  structuralIntegrityScore: number;
  tradeScores: TradeScore[];
  criticalIssues: number;
  highIssues: number;
  moderateIssues: number;
  summary: string;
}

/**
 * Trade names
 */
const TRADE_NAMES: Record<string, string> = {
  'DRY': 'Drywall',
  'FRM': 'Framing',
  'RFG': 'Roofing',
  'PNT': 'Painting',
  'FLR': 'Flooring',
  'CRP': 'Carpet',
  'INS': 'Insulation',
  'ELE': 'Electrical',
  'PLM': 'Plumbing',
  'HVA': 'HVAC',
  'CAB': 'Cabinets',
  'CTR': 'Countertops',
  'TIL': 'Tile',
  'MLD': 'Molding/Trim',
  'WIN': 'Windows',
  'DOR': 'Doors',
  'SID': 'Siding',
  'DEM': 'Demolition',
  'HAU': 'Haul Away',
  'CLN': 'Cleaning',
  'MIT': 'Mitigation',
  'EQP': 'Equipment',
  'VCT': 'Vinyl',
  'WDP': 'Wood Flooring',
  'CEI': 'Ceiling'
};

/**
 * Check if trade requires finish layer
 */
function getRequiredFinish(tradeCode: string): { finishTrade: string; finishName: string } | null {
  const finishMap: Record<string, { finishTrade: string; finishName: string }> = {
    'DRY': { finishTrade: 'PNT', finishName: 'Painting' },
    'FRM': { finishTrade: 'DRY', finishName: 'Drywall' },
    'FLR': { finishTrade: 'MLD', finishName: 'Baseboard' },
    'CRP': { finishTrade: 'MLD', finishName: 'Baseboard' },
    'VCT': { finishTrade: 'MLD', finishName: 'Baseboard' },
    'TIL': { finishTrade: 'MLD', finishName: 'Baseboard' },
    'CAB': { finishTrade: 'CTR', finishName: 'Countertops' }
  };
  
  return finishMap[tradeCode] || null;
}

/**
 * Score a single trade for completeness
 */
function scoreTradeCompleteness(
  tradeCode: string,
  items: StructuredLineItem[],
  allItems: StructuredLineItem[]
): TradeScore {
  const issues: TradeIssue[] = [];
  let score = 100;
  
  const tradeName = TRADE_NAMES[tradeCode] || tradeCode;
  
  // Calculate quantities
  const removalItems = items.filter(item => item.actionType === 'REMOVE');
  const replacementItems = items.filter(item => 
    item.actionType === 'REPLACE' || item.actionType === 'INSTALL'
  );
  
  const removalQuantity = removalItems.reduce((sum, item) => sum + item.quantity, 0);
  const replacementQuantity = replacementItems.reduce((sum, item) => sum + item.quantity, 0);
  
  const hasRemoval = removalItems.length > 0;
  const hasReplacement = replacementItems.length > 0;
  
  // Check for zero quantities
  const zeroQtyItems = items.filter(item => item.quantity === 0);
  if (zeroQtyItems.length > 0) {
    for (const item of zeroQtyItems) {
      issues.push({
        type: 'ZERO_QUANTITY',
        description: `Zero quantity for: ${item.description}`,
        severity: 'CRITICAL',
        quantity: 0,
        unit: item.unit
      });
      score -= 20;
    }
  }
  
  // Check for removal without replacement
  if (hasRemoval && !hasReplacement) {
    issues.push({
      type: 'MISSING_REPLACEMENT',
      description: `${tradeName} removal present without replacement`,
      severity: 'CRITICAL',
      quantity: removalQuantity,
      unit: removalItems[0].unit
    });
    score -= 40;
  }
  
  // Check for quantity consistency
  let quantityConsistent = true;
  if (hasRemoval && hasReplacement && removalQuantity > 0 && replacementQuantity > 0) {
    const variance = Math.abs(removalQuantity - replacementQuantity) / removalQuantity;
    
    if (variance > 0.15) { // Allow 15% variance
      issues.push({
        type: 'QUANTITY_MISMATCH',
        description: `Removal quantity (${removalQuantity} ${removalItems[0].unit}) does not match replacement quantity (${replacementQuantity} ${replacementItems[0].unit})`,
        severity: 'MODERATE',
        quantity: Math.abs(removalQuantity - replacementQuantity),
        unit: removalItems[0].unit
      });
      score -= 15;
      quantityConsistent = false;
    }
  }
  
  // Check for missing finish layer
  const finishInfo = getRequiredFinish(tradeCode);
  let hasFinish = true;
  
  if (finishInfo && hasReplacement) {
    hasFinish = allItems.some(item => item.tradeCode === finishInfo.finishTrade);
    
    if (!hasFinish) {
      issues.push({
        type: 'MISSING_FINISH',
        description: `${tradeName} replacement present without ${finishInfo.finishName}`,
        severity: 'HIGH',
        quantity: replacementQuantity,
        unit: replacementItems[0]?.unit || 'SF'
      });
      score -= 25;
    }
  }
  
  // Ensure score doesn't go below 0
  score = Math.max(0, score);
  
  return {
    tradeCode,
    tradeName,
    completenessScore: Math.round(score),
    issues,
    hasRemoval,
    hasReplacement,
    hasFinish,
    quantityConsistent,
    removalQuantity: Math.round(removalQuantity * 100) / 100,
    replacementQuantity: Math.round(replacementQuantity * 100) / 100
  };
}

/**
 * Calculate overall completeness
 */
export function calculateStructuralCompleteness(estimate: StructuredEstimate): CompletenessAnalysis {
  // Group line items by trade
  const tradeGroups = new Map<string, StructuredLineItem[]>();
  
  for (const item of estimate.lineItems) {
    if (!tradeGroups.has(item.tradeCode)) {
      tradeGroups.set(item.tradeCode, []);
    }
    tradeGroups.get(item.tradeCode)!.push(item);
  }
  
  // Score each trade
  const tradeScores: TradeScore[] = [];
  
  for (const [tradeCode, items] of tradeGroups) {
    const score = scoreTradeCompleteness(tradeCode, items, estimate.lineItems);
    tradeScores.push(score);
  }
  
  // Calculate overall integrity score
  const avgScore = tradeScores.length > 0
    ? tradeScores.reduce((sum, ts) => sum + ts.completenessScore, 0) / tradeScores.length
    : 100;
  
  // Count issues by severity
  let criticalIssues = 0;
  let highIssues = 0;
  let moderateIssues = 0;
  
  for (const ts of tradeScores) {
    for (const issue of ts.issues) {
      if (issue.severity === 'CRITICAL') criticalIssues++;
      else if (issue.severity === 'HIGH') highIssues++;
      else if (issue.severity === 'MODERATE') moderateIssues++;
    }
  }
  
  // Penalty for critical issues
  const structuralIntegrityScore = Math.max(0, Math.round(
    avgScore - (criticalIssues * 5) - (highIssues * 2)
  ));
  
  // Generate summary
  let summary = '';
  if (structuralIntegrityScore >= 90) {
    summary = `Estimate shows high structural integrity (${structuralIntegrityScore}/100). `;
  } else if (structuralIntegrityScore >= 75) {
    summary = `Estimate shows good structural integrity (${structuralIntegrityScore}/100) with minor gaps. `;
  } else if (structuralIntegrityScore >= 60) {
    summary = `Estimate shows moderate structural integrity (${structuralIntegrityScore}/100) with notable gaps. `;
  } else {
    summary = `Estimate shows low structural integrity (${structuralIntegrityScore}/100) with significant gaps. `;
  }
  
  if (criticalIssues > 0) {
    summary += `${criticalIssues} critical issue(s) identified. `;
  }
  if (highIssues > 0) {
    summary += `${highIssues} high-priority issue(s) identified. `;
  }
  
  const tradesWithIssues = tradeScores.filter(ts => ts.issues.length > 0).length;
  if (tradesWithIssues > 0) {
    summary += `${tradesWithIssues} of ${tradeScores.length} trades have completeness issues.`;
  } else {
    summary += 'All trades appear structurally complete.';
  }
  
  return {
    structuralIntegrityScore,
    tradeScores,
    criticalIssues,
    highIssues,
    moderateIssues,
    summary
  };
}
