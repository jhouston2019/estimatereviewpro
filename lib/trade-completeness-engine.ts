/**
 * TRADE COMPLETENESS ENGINE
 * Scores each trade 0-100 based on completeness criteria
 * Checks for removal, replacement, finish layers, material+labor, quantity consistency
 */

import { ParsedEstimate, LineItem } from './xactimate-parser';

interface TradeIssue {
  type: 'MISSING_REMOVAL' | 'MISSING_REPLACEMENT' | 'MISSING_FINISH' | 'MISSING_LABOR' | 'QUANTITY_MISMATCH' | 'ZERO_QUANTITY';
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
}

interface TradeScore {
  tradeCode: string;
  tradeName: string;
  completenessScore: number; // 0-100
  issues: TradeIssue[];
  hasRemoval: boolean;
  hasReplacement: boolean;
  hasFinish: boolean;
  hasMaterialAndLabor: boolean;
  quantityConsistent: boolean;
}

interface CompletenessAnalysis {
  overallIntegrityScore: number; // 0-100
  tradeScores: TradeScore[];
  criticalIssues: number;
  highIssues: number;
  moderateIssues: number;
  summary: string;
}

/**
 * Check if trade requires a finish layer
 */
function requiresFinish(tradeCode: string): { required: boolean; finishTrade: string; finishName: string } | null {
  const finishMap: Record<string, { finishTrade: string; finishName: string }> = {
    'DRY': { finishTrade: 'PNT', finishName: 'Painting' },
    'FRM': { finishTrade: 'DRY', finishName: 'Drywall' },
    'FLR': { finishTrade: 'MLD', finishName: 'Baseboard/Trim' },
    'CRP': { finishTrade: 'MLD', finishName: 'Baseboard/Trim' },
    'VCT': { finishTrade: 'MLD', finishName: 'Baseboard/Trim' },
    'CAB': { finishTrade: 'CTR', finishName: 'Countertops' }
  };
  
  if (finishMap[tradeCode]) {
    return { required: true, ...finishMap[tradeCode] };
  }
  
  return null;
}

/**
 * Check if line item description indicates labor
 */
function hasLaborComponent(description: string): boolean {
  const laborKeywords = [
    'install', 'replace', 'remove', 'repair', 'paint', 'apply',
    'hang', 'set', 'place', 'mount', 'attach', 'detach', 'reset',
    'labor', 'installation', 'r&r', 'r & r'
  ];
  
  const lower = description.toLowerCase();
  return laborKeywords.some(keyword => lower.includes(keyword));
}

/**
 * Check if line item description indicates material
 */
function hasMaterialComponent(description: string): boolean {
  const materialKeywords = [
    'material', 'drywall', 'paint', 'carpet', 'tile', 'wood',
    'vinyl', 'shingle', 'siding', 'insulation', 'lumber',
    'cabinet', 'counter', 'door', 'window', 'fixture'
  ];
  
  const lower = description.toLowerCase();
  return materialKeywords.some(keyword => lower.includes(keyword));
}

/**
 * Score a single trade
 */
function scoreTradeCompleteness(
  tradeCode: string,
  tradeName: string,
  items: LineItem[],
  allItems: LineItem[]
): TradeScore {
  const issues: TradeIssue[] = [];
  let score = 100;
  
  // Check for removal
  const hasRemoval = items.some(item => item.actionType === 'REMOVE');
  
  // Check for replacement
  const hasReplacement = items.some(item => 
    item.actionType === 'REPLACE' || item.actionType === 'INSTALL'
  );
  
  // Check for finish layer
  const finishInfo = requiresFinish(tradeCode);
  let hasFinish = true;
  
  if (finishInfo && hasReplacement) {
    hasFinish = allItems.some(item => item.tradeCode === finishInfo.finishTrade);
    
    if (!hasFinish) {
      issues.push({
        type: 'MISSING_FINISH',
        description: `${tradeName} replacement present without ${finishInfo.finishName}`,
        severity: 'HIGH'
      });
      score -= 25;
    }
  }
  
  // Check for removal without replacement
  if (hasRemoval && !hasReplacement) {
    issues.push({
      type: 'MISSING_REPLACEMENT',
      description: `${tradeName} removal present without replacement`,
      severity: 'CRITICAL'
    });
    score -= 35;
  }
  
  // Check for material and labor
  let hasMaterialAndLabor = true;
  const hasMaterial = items.some(item => hasMaterialComponent(item.description));
  const hasLabor = items.some(item => hasLaborComponent(item.description));
  
  if (!hasMaterial && !hasLabor) {
    // If neither is explicitly mentioned, assume combined line item
    hasMaterialAndLabor = true;
  } else if (!hasMaterial) {
    issues.push({
      type: 'MISSING_LABOR',
      description: `${tradeName} appears to have labor without material`,
      severity: 'MODERATE'
    });
    score -= 15;
    hasMaterialAndLabor = false;
  } else if (!hasLabor) {
    issues.push({
      type: 'MISSING_LABOR',
      description: `${tradeName} appears to have material without labor`,
      severity: 'HIGH'
    });
    score -= 20;
    hasMaterialAndLabor = false;
  }
  
  // Check for zero quantities
  const zeroQtyItems = items.filter(item => item.quantity === 0);
  let quantityConsistent = true;
  
  if (zeroQtyItems.length > 0) {
    for (const item of zeroQtyItems) {
      issues.push({
        type: 'ZERO_QUANTITY',
        description: `Zero quantity for: ${item.description}`,
        severity: 'CRITICAL'
      });
      score -= 15;
      quantityConsistent = false;
    }
  }
  
  // Check for quantity consistency between removal and replacement
  if (hasRemoval && hasReplacement) {
    const removalQty = items
      .filter(item => item.actionType === 'REMOVE')
      .reduce((sum, item) => sum + item.quantity, 0);
    
    const replacementQty = items
      .filter(item => item.actionType === 'REPLACE' || item.actionType === 'INSTALL')
      .reduce((sum, item) => sum + item.quantity, 0);
    
    // Allow 10% variance
    const variance = Math.abs(removalQty - replacementQty) / Math.max(removalQty, 1);
    
    if (variance > 0.1 && removalQty > 0) {
      issues.push({
        type: 'QUANTITY_MISMATCH',
        description: `Removal quantity (${removalQty}) does not match replacement quantity (${replacementQty})`,
        severity: 'MODERATE'
      });
      score -= 10;
      quantityConsistent = false;
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
    hasMaterialAndLabor,
    quantityConsistent
  };
}

/**
 * Calculate overall completeness
 */
export function calculateTradeCompleteness(estimate: ParsedEstimate): CompletenessAnalysis {
  // Group line items by trade
  const tradeGroups = new Map<string, LineItem[]>();
  
  for (const item of estimate.lineItems) {
    if (!tradeGroups.has(item.tradeCode)) {
      tradeGroups.set(item.tradeCode, []);
    }
    tradeGroups.get(item.tradeCode)!.push(item);
  }
  
  // Score each trade
  const tradeScores: TradeScore[] = [];
  
  for (const [tradeCode, items] of tradeGroups) {
    const score = scoreTradeCompleteness(
      tradeCode,
      items[0].tradeName,
      items,
      estimate.lineItems
    );
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
  const overallIntegrityScore = Math.max(0, Math.round(
    avgScore - (criticalIssues * 5) - (highIssues * 2)
  ));
  
  // Generate summary
  let summary = '';
  if (overallIntegrityScore >= 90) {
    summary = `Estimate shows high structural integrity (${overallIntegrityScore}/100). `;
  } else if (overallIntegrityScore >= 75) {
    summary = `Estimate shows good structural integrity (${overallIntegrityScore}/100) with minor gaps. `;
  } else if (overallIntegrityScore >= 60) {
    summary = `Estimate shows moderate structural integrity (${overallIntegrityScore}/100) with notable gaps. `;
  } else {
    summary = `Estimate shows low structural integrity (${overallIntegrityScore}/100) with significant gaps. `;
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
    overallIntegrityScore,
    tradeScores,
    criticalIssues,
    highIssues,
    moderateIssues,
    summary
  };
}

export type { TradeScore, TradeIssue, CompletenessAnalysis };
