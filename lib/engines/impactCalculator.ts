/**
 * CLAIM RECOVERY CALCULATOR
 * Calculates total financial recovery opportunity from all detected issues
 */

import { ClaimIssue } from '../../types/claim-engine';
import { ReconstructedEstimate } from './scopeReconstructionEngine';

export interface RecoveryCategory {
  category: string;
  issueCount: number;
  totalImpact: number;
  issues: ClaimIssue[];
}

export interface RecoveryCalculation {
  totalRecoveryValue: number;
  originalEstimateValue: number;
  reconstructedEstimateValue: number;
  recoveryPercentage: number;
  categories: RecoveryCategory[];
  breakdown: {
    pricingSuppression: number;
    excessiveDepreciation: number;
    laborSuppression: number;
    missingScope: number;
    missingOP: number;
    carrierTactics: number;
  };
  summary: string;
}

/**
 * Calculate total recovery opportunity
 */
export function calculateRecovery(
  issues: ClaimIssue[],
  reconstruction: ReconstructedEstimate | null,
  originalValue: number
): RecoveryCalculation {
  
  console.log('[RECOVERY-CALCULATOR] Calculating recovery opportunity...');
  
  // Initialize breakdown
  const breakdown = {
    pricingSuppression: 0,
    excessiveDepreciation: 0,
    laborSuppression: 0,
    missingScope: 0,
    missingOP: 0,
    carrierTactics: 0,
  };
  
  // Categorize issues
  const categories: Map<string, RecoveryCategory> = new Map();
  
  for (const issue of issues) {
    const impact = issue.financialImpact || 0;
    
    // Categorize by type
    let categoryName = 'Other';
    
    if (issue.type.includes('pricing')) {
      categoryName = 'Pricing Suppression';
      breakdown.pricingSuppression += impact;
    } else if (issue.type.includes('depreciation')) {
      categoryName = 'Excessive Depreciation';
      breakdown.excessiveDepreciation += impact;
    } else if (issue.type.includes('labor')) {
      categoryName = 'Labor Suppression';
      breakdown.laborSuppression += impact;
    } else if (issue.type.includes('op_gap')) {
      categoryName = 'Missing O&P';
      breakdown.missingOP += impact;
    } else if (issue.type.includes('carrier_tactic')) {
      categoryName = 'Carrier Tactics';
      breakdown.carrierTactics += impact;
    }
    
    // Add to category
    if (!categories.has(categoryName)) {
      categories.set(categoryName, {
        category: categoryName,
        issueCount: 0,
        totalImpact: 0,
        issues: [],
      });
    }
    
    const category = categories.get(categoryName)!;
    category.issueCount++;
    category.totalImpact += impact;
    category.issues.push(issue);
  }
  
  // Add missing scope from reconstruction
  if (reconstruction && reconstruction.gapValue > 0) {
    breakdown.missingScope = reconstruction.gapValue;
    
    if (!categories.has('Missing Scope')) {
      categories.set('Missing Scope', {
        category: 'Missing Scope',
        issueCount: reconstruction.missingLineItems.length,
        totalImpact: reconstruction.gapValue,
        issues: [],
      });
    }
  }
  
  // Calculate totals
  const totalFromIssues = issues.reduce((sum, issue) => sum + (issue.financialImpact || 0), 0);
  const totalFromScope = reconstruction?.gapValue || 0;
  const totalRecoveryValue = totalFromIssues + totalFromScope;
  
  const reconstructedValue = reconstruction?.reconstructedValue || originalValue;
  const recoveryPercentage = originalValue > 0 ? (totalRecoveryValue / originalValue) * 100 : 0;
  
  console.log(`[RECOVERY-CALCULATOR] Total recovery: $${totalRecoveryValue.toFixed(2)}`);
  console.log(`[RECOVERY-CALCULATOR] Recovery percentage: ${recoveryPercentage.toFixed(1)}%`);
  
  return {
    totalRecoveryValue,
    originalEstimateValue: originalValue,
    reconstructedEstimateValue: reconstructedValue,
    recoveryPercentage,
    categories: Array.from(categories.values()).sort((a, b) => b.totalImpact - a.totalImpact),
    breakdown,
    summary: generateRecoverySummary(totalRecoveryValue, recoveryPercentage, categories.size),
  };
}

/**
 * Generate recovery summary text
 */
function generateRecoverySummary(
  totalRecovery: number,
  recoveryPercentage: number,
  categoryCount: number
): string {
  if (totalRecovery === 0) {
    return 'No significant recovery opportunities detected.';
  }
  
  let summary = `Total recovery opportunity: $${totalRecovery.toFixed(2)} (${recoveryPercentage.toFixed(1)}% increase). `;
  
  if (recoveryPercentage > 40) {
    summary += 'CRITICAL: Estimate appears to be significantly undervalued. ';
  } else if (recoveryPercentage > 20) {
    summary += 'HIGH: Substantial underpayment detected. ';
  } else if (recoveryPercentage > 10) {
    summary += 'MODERATE: Notable gaps identified. ';
  }
  
  summary += `Issues span ${categoryCount} categories.`;
  
  return summary;
}

/**
 * Format recovery calculation as text report
 */
export function formatRecoveryReport(recovery: RecoveryCalculation): string {
  let report = `CLAIM RECOVERY CALCULATION\n`;
  report += `${'='.repeat(60)}\n\n`;
  
  report += `FINANCIAL SUMMARY:\n`;
  report += `- Original Estimate: $${recovery.originalEstimateValue.toFixed(2)}\n`;
  report += `- Reconstructed Value: $${recovery.reconstructedEstimateValue.toFixed(2)}\n`;
  report += `- Recovery Opportunity: $${recovery.totalRecoveryValue.toFixed(2)}\n`;
  report += `- Recovery Percentage: ${recovery.recoveryPercentage.toFixed(1)}%\n\n`;
  
  report += `RECOVERY BREAKDOWN:\n`;
  report += `- Pricing Suppression: $${recovery.breakdown.pricingSuppression.toFixed(2)}\n`;
  report += `- Excessive Depreciation: $${recovery.breakdown.excessiveDepreciation.toFixed(2)}\n`;
  report += `- Labor Suppression: $${recovery.breakdown.laborSuppression.toFixed(2)}\n`;
  report += `- Missing Scope: $${recovery.breakdown.missingScope.toFixed(2)}\n`;
  report += `- Missing O&P: $${recovery.breakdown.missingOP.toFixed(2)}\n`;
  report += `- Carrier Tactics: $${recovery.breakdown.carrierTactics.toFixed(2)}\n\n`;
  
  if (recovery.categories.length > 0) {
    report += `TOP RECOVERY CATEGORIES:\n`;
    for (const category of recovery.categories.slice(0, 5)) {
      report += `  ${category.category}: $${category.totalImpact.toFixed(2)} (${category.issueCount} issues)\n`;
    }
    report += `\n`;
  }
  
  report += `SUMMARY:\n${recovery.summary}\n`;
  
  return report;
}

/**
 * Calculate recovery by severity
 */
export function calculateRecoveryBySeverity(issues: ClaimIssue[]): {
  critical: number;
  high: number;
  medium: number;
  low: number;
} {
  return {
    critical: issues
      .filter(i => i.severity === 'critical')
      .reduce((sum, i) => sum + (i.financialImpact || 0), 0),
    high: issues
      .filter(i => i.severity === 'high')
      .reduce((sum, i) => sum + (i.financialImpact || 0), 0),
    medium: issues
      .filter(i => i.severity === 'medium')
      .reduce((sum, i) => sum + (i.financialImpact || 0), 0),
    low: issues
      .filter(i => i.severity === 'low')
      .reduce((sum, i) => sum + (i.financialImpact || 0), 0),
  };
}
