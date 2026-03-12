/**
 * ENGINE ADAPTERS
 * Convert existing engine outputs to standardized EngineResult format
 */

import { EngineResult, ClaimIssue, AuditEvent, StandardizedEstimate } from '../../types/claim-engine';
import { validatePricing } from '../pricing-validation-engine';
import { validateDepreciation } from '../depreciation-validator';
import { validateLaborRates } from '../labor-rate-validator';
import { detectCarrierTactics } from '../carrier-tactic-detector';
import { analyzeOPGaps } from '../op-gap-detector';

/**
 * Adapter for Pricing Validation Engine
 */
export async function runPricingValidation(estimate: StandardizedEstimate): Promise<EngineResult> {
  const startTime = Date.now();
  const issues: ClaimIssue[] = [];
  const audit: AuditEvent[] = [];
  
  try {
    const region = estimate.metadata?.region || 'DEFAULT';
    
    const result = await validatePricing(
      estimate.lineItems.map(item => ({
        lineNumber: item.lineNumber,
        tradeCode: item.tradeCode,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        total: item.rcv,
      })),
      region
    );
    
    // Convert underpriced items to issues
    for (const item of result.underpriced) {
      issues.push({
        id: `pricing-under-${item.lineNumber}`,
        type: 'pricing_suppression',
        severity: Math.abs(item.variancePercentage) > 25 ? 'high' : 'medium',
        title: 'Underpriced Line Item',
        description: `Line ${item.lineNumber}: "${item.description}" is ${Math.abs(item.variancePercentage).toFixed(1)}% below market rate`,
        financialImpact: Math.abs(item.variance),
        lineItemsAffected: [item.lineNumber],
        recommendation: `Market rate suggests $${(item.variance + (item.variance / item.variancePercentage * 100)).toFixed(2)} vs estimated $${(item.variance / item.variancePercentage * 100).toFixed(2)}`,
      });
    }
    
    // Convert overpriced items to issues
    for (const item of result.overpriced) {
      issues.push({
        id: `pricing-over-${item.lineNumber}`,
        type: 'pricing_inflation',
        severity: 'low',
        title: 'Overpriced Line Item',
        description: `Line ${item.lineNumber}: "${item.description}" is ${item.variancePercentage.toFixed(1)}% above market rate`,
        financialImpact: item.variance,
        lineItemsAffected: [item.lineNumber],
      });
    }
    
    audit.push({
      engine: 'pricing-validator',
      decision: `Validated ${result.itemsValidated} items with ${result.variancePercentage.toFixed(1)}% total variance`,
      confidence: result.confidence / 100,
      timestamp: Date.now(),
      processingTimeMs: Date.now() - startTime,
    });
    
    return { issues, audit };
    
  } catch (error) {
    console.error('[PRICING-ADAPTER] Error:', error);
    audit.push({
      engine: 'pricing-validator',
      decision: 'Failed with error',
      confidence: 0,
      timestamp: Date.now(),
      processingTimeMs: Date.now() - startTime,
    });
    return { issues: [], audit };
  }
}

/**
 * Adapter for Depreciation Validation Engine
 */
export function runDepreciationValidation(estimate: StandardizedEstimate): EngineResult {
  const startTime = Date.now();
  const issues: ClaimIssue[] = [];
  const audit: AuditEvent[] = [];
  
  try {
    const result = validateDepreciation(
      estimate.lineItems.map(item => ({
        lineNumber: item.lineNumber,
        description: item.description,
        rcv: item.rcv,
        acv: item.acv,
        quantity: item.quantity,
        unit: item.unit,
      }))
    );
    
    // Convert excessive depreciation to issues
    for (const item of result.excessiveDepreciation) {
      issues.push({
        id: `depreciation-excessive-${item.lineNumber}`,
        type: 'excessive_depreciation',
        severity: item.severity === 'HIGH' ? 'high' : 'medium',
        title: 'Excessive Depreciation',
        description: `Line ${item.lineNumber}: ${item.depreciationPercentage.toFixed(1)}% depreciation exceeds ${item.maxAllowed}% limit`,
        financialImpact: item.impact,
        lineItemsAffected: [item.lineNumber],
        recommendation: `Reduce depreciation to industry-standard maximum of ${item.maxAllowed}%`,
      });
    }
    
    // Convert improper depreciation to issues
    for (const item of result.improperDepreciation) {
      issues.push({
        id: `depreciation-improper-${item.lineNumber}`,
        type: 'improper_depreciation',
        severity: item.severity === 'CRITICAL' ? 'critical' : 'high',
        title: 'Improper Depreciation',
        description: `Line ${item.lineNumber}: ${item.issue}`,
        financialImpact: item.impact,
        lineItemsAffected: [item.lineNumber],
        recommendation: 'Labor, permits, and O&P are not depreciable',
      });
    }
    
    audit.push({
      engine: 'depreciation-validator',
      decision: `Found ${result.excessiveDepreciation.length} excessive and ${result.improperDepreciation.length} improper depreciation items`,
      confidence: result.depreciationScore / 100,
      timestamp: Date.now(),
      processingTimeMs: Date.now() - startTime,
    });
    
    return { issues, audit };
    
  } catch (error) {
    console.error('[DEPRECIATION-ADAPTER] Error:', error);
    audit.push({
      engine: 'depreciation-validator',
      decision: 'Failed with error',
      confidence: 0,
      timestamp: Date.now(),
      processingTimeMs: Date.now() - startTime,
    });
    return { issues: [], audit };
  }
}

/**
 * Adapter for Labor Rate Validation Engine
 */
export async function runLaborValidation(estimate: StandardizedEstimate): Promise<EngineResult> {
  const startTime = Date.now();
  const issues: ClaimIssue[] = [];
  const audit: AuditEvent[] = [];
  
  try {
    const region = estimate.metadata?.region || 'DEFAULT';
    
    const result = await validateLaborRates(
      estimate.lineItems.map(item => ({
        lineNumber: item.lineNumber,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        total: item.rcv,
      })),
      region
    );
    
    // Convert undervalued labor to issues
    for (const item of result.undervaluedLabor) {
      issues.push({
        id: `labor-under-${item.lineNumber}`,
        type: 'labor_suppression',
        severity: item.severity === 'HIGH' ? 'high' : 'medium',
        title: 'Undervalued Labor',
        description: `Line ${item.lineNumber}: "${item.description}" - labor rate ${Math.abs(item.variancePercentage).toFixed(1)}% below market`,
        lineItemsAffected: [item.lineNumber],
        recommendation: 'Labor rates should reflect current regional market standards',
      });
    }
    
    audit.push({
      engine: 'labor-rate-validator',
      decision: `Validated labor rates, found ${result.undervaluedLabor.length} undervalued items`,
      confidence: result.laborScore / 100,
      timestamp: Date.now(),
      processingTimeMs: Date.now() - startTime,
    });
    
    return { issues, audit };
    
  } catch (error) {
    console.error('[LABOR-ADAPTER] Error:', error);
    audit.push({
      engine: 'labor-rate-validator',
      decision: 'Failed with error',
      confidence: 0,
      timestamp: Date.now(),
      processingTimeMs: Date.now() - startTime,
    });
    return { issues: [], audit };
  }
}

/**
 * Adapter for Carrier Tactic Detection Engine
 */
export function runCarrierTacticDetection(
  estimate: StandardizedEstimate,
  pricingResult: any,
  depreciationResult: any,
  laborResult: any
): EngineResult {
  const startTime = Date.now();
  const issues: ClaimIssue[] = [];
  const audit: AuditEvent[] = [];
  
  try {
    const result = detectCarrierTactics({
      lineItems: estimate.lineItems.map(item => ({
        lineNumber: item.lineNumber,
        tradeCode: item.tradeCode,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        rcv: item.rcv,
        acv: item.acv,
        depreciation: item.depreciation,
        actionType: item.actionType,
      })),
      pricingAnalysis: pricingResult,
      depreciationAnalysis: depreciationResult,
      laborAnalysis: laborResult,
    });
    
    // Convert tactics to issues
    for (const tactic of result.tacticsDetected) {
      issues.push({
        id: `carrier-tactic-${tactic.tactic.toLowerCase().replace(/\s+/g, '-')}`,
        type: 'carrier_tactic',
        severity: tactic.severity === 'CRITICAL' ? 'critical' : tactic.severity === 'HIGH' ? 'high' : 'medium',
        title: tactic.tactic,
        description: tactic.description,
        financialImpact: tactic.estimatedImpact,
        lineItemsAffected: tactic.lineItemsAffected,
        recommendation: tactic.counterArgument,
      });
    }
    
    audit.push({
      engine: 'carrier-tactic-detector',
      decision: `Detected ${result.tacticsDetected.length} carrier tactics with $${result.totalImpact.toFixed(2)} total impact`,
      confidence: (100 - result.severityScore) / 100,
      timestamp: Date.now(),
      processingTimeMs: Date.now() - startTime,
    });
    
    return { issues, audit };
    
  } catch (error) {
    console.error('[CARRIER-ADAPTER] Error:', error);
    audit.push({
      engine: 'carrier-tactic-detector',
      decision: 'Failed with error',
      confidence: 0,
      timestamp: Date.now(),
      processingTimeMs: Date.now() - startTime,
    });
    return { issues: [], audit };
  }
}

/**
 * Adapter for O&P Gap Detection Engine
 */
export function runOPGapDetection(estimate: StandardizedEstimate): EngineResult {
  const startTime = Date.now();
  const issues: ClaimIssue[] = [];
  const audit: AuditEvent[] = [];
  
  try {
    const result = analyzeOPGaps(
      estimate.lineItems.map(item => ({
        lineNumber: item.lineNumber,
        description: item.description,
        rcv: item.rcv,
        acv: item.acv,
        depreciation: item.depreciation,
        overhead: false, // Would need to detect from description
        profit: false,   // Would need to detect from description
      }))
    );
    
    // Convert O&P gaps to issues
    for (const gap of result.gaps) {
      issues.push({
        id: `op-gap-${gap.gapType.toLowerCase().replace(/_/g, '-')}`,
        type: 'op_gap',
        severity: gap.severity === 'CRITICAL' ? 'critical' : gap.severity === 'HIGH' ? 'high' : 'medium',
        title: gap.gapType.replace(/_/g, ' '),
        description: gap.description,
        financialImpact: gap.estimatedImpact,
        lineItemsAffected: gap.lineItemsAffected,
        recommendation: gap.explanation,
      });
    }
    
    audit.push({
      engine: 'op-gap-detector',
      decision: `Detected ${result.gaps.length} O&P gaps with $${result.totalImpact.toFixed(2)} total impact`,
      confidence: result.opScore / 100,
      timestamp: Date.now(),
      processingTimeMs: Date.now() - startTime,
    });
    
    return { issues, audit };
    
  } catch (error) {
    console.error('[OP-ADAPTER] Error:', error);
    audit.push({
      engine: 'op-gap-detector',
      decision: 'Failed with error',
      confidence: 0,
      timestamp: Date.now(),
      processingTimeMs: Date.now() - startTime,
    });
    return { issues: [], audit };
  }
}

/**
 * Adapter for Trade Dependency Engine
 */
export async function runTradeDependencyAnalysis(estimate: StandardizedEstimate): Promise<EngineResult> {
  const startTime = Date.now();
  const issues: ClaimIssue[] = [];
  const audit: AuditEvent[] = [];
  
  try {
    const { detectTradeDependencies } = await import('../engines/tradeDependencyEngine');
    const result = await detectTradeDependencies(estimate);
    
    // Convert violations to issues
    for (const violation of result.violations) {
      issues.push({
        id: `trade-dependency-${violation.trade.toLowerCase()}`,
        type: 'trade_dependency_violation',
        severity: violation.missingItems.length >= 3 ? 'high' : 'medium',
        title: `Missing ${violation.trade} System Components`,
        description: `${violation.trade} work detected (${violation.triggerFound}) but missing ${violation.missingItems.length} required components`,
        financialImpact: violation.totalFinancialImpact,
        recommendation: `Add required ${violation.trade} components: ${violation.missingItems.map(i => i.item).join(', ')}`,
      });
    }
    
    audit.push({
      engine: 'trade-dependency',
      decision: `Found ${result.totalViolations} trade dependency violations across ${result.tradesAnalyzed.length} trades`,
      confidence: 0.95,
      timestamp: Date.now(),
      processingTimeMs: Date.now() - startTime,
    });
    
    return { issues, audit };
    
  } catch (error) {
    console.error('[TRADE-DEPENDENCY-ADAPTER] Error:', error);
    audit.push({
      engine: 'trade-dependency',
      decision: 'Failed with error',
      confidence: 0,
      timestamp: Date.now(),
      processingTimeMs: Date.now() - startTime,
    });
    return { issues: [], audit };
  }
}

/**
 * Adapter for Code Compliance Engine
 */
export async function runCodeComplianceAnalysis(estimate: StandardizedEstimate): Promise<EngineResult> {
  const startTime = Date.now();
  const issues: ClaimIssue[] = [];
  const audit: AuditEvent[] = [];
  
  try {
    const { detectCodeViolations } = await import('../engines/codeComplianceEngine');
    const result = await detectCodeViolations(estimate);
    
    // Convert violations to issues
    for (const violation of result.violations) {
      issues.push({
        id: `code-violation-${violation.missingItem.toLowerCase().replace(/\s+/g, '-')}`,
        type: 'code_violation',
        severity: violation.severity === 'CRITICAL' ? 'critical' : violation.severity === 'HIGH' ? 'high' : 'medium',
        title: `Code Violation: ${violation.missingItem}`,
        description: `${violation.requirement} (${violation.codeReference}). Evidence: ${violation.evidence}`,
        financialImpact: violation.financialImpact,
        recommendation: `Add ${violation.missingItem} to comply with ${violation.codeReference}`,
      });
    }
    
    audit.push({
      engine: 'code-compliance',
      decision: `Found ${result.totalViolations} code violations (${result.criticalViolations} critical) in ${result.jurisdiction}`,
      confidence: 0.98,
      timestamp: Date.now(),
      processingTimeMs: Date.now() - startTime,
    });
    
    return { issues, audit };
    
  } catch (error) {
    console.error('[CODE-COMPLIANCE-ADAPTER] Error:', error);
    audit.push({
      engine: 'code-compliance',
      decision: 'Failed with error',
      confidence: 0,
      timestamp: Date.now(),
      processingTimeMs: Date.now() - startTime,
    });
    return { issues: [], audit };
  }
}

/**
 * Adapter for Estimate Manipulation Engine
 */
export async function runManipulationDetection(estimate: StandardizedEstimate): Promise<EngineResult> {
  const startTime = Date.now();
  const issues: ClaimIssue[] = [];
  const audit: AuditEvent[] = [];
  
  try {
    const { detectEstimateManipulation } = await import('../engines/estimateManipulationEngine');
    const result = await detectEstimateManipulation(estimate);
    
    // Convert quantity suppressions to issues
    for (const suppression of result.quantitySuppressions) {
      issues.push({
        id: `quantity-suppression-${suppression.lineNumber}`,
        type: 'quantity_suppression',
        severity: suppression.suppressionPercentage > 30 ? 'high' : 'medium',
        title: 'Quantity Suppression Detected',
        description: `Line ${suppression.lineNumber}: "${suppression.item}" shows ${suppression.suppressionPercentage.toFixed(1)}% quantity suppression (${suppression.estimatedQuantity} vs expected ${suppression.expectedQuantity})`,
        financialImpact: suppression.financialImpact,
        lineItemsAffected: [suppression.lineNumber],
      });
    }
    
    // Convert labor suppressions to issues
    for (const suppression of result.laborSuppressions) {
      issues.push({
        id: `labor-manipulation-${suppression.lineNumber}`,
        type: 'labor_manipulation',
        severity: suppression.suppressionPercentage > 25 ? 'high' : 'medium',
        title: 'Labor Rate Manipulation',
        description: `Line ${suppression.lineNumber}: "${suppression.item}" uses $${suppression.estimateRate.toFixed(2)}/hr vs regional rate $${suppression.regionalRate.toFixed(2)}/hr (${suppression.suppressionPercentage.toFixed(1)}% suppression)`,
        financialImpact: suppression.financialImpact,
        lineItemsAffected: [suppression.lineNumber],
      });
    }
    
    // Convert fragmentations to issues
    for (const frag of result.fragmentations) {
      issues.push({
        id: `fragmentation-${frag.trade.toLowerCase()}`,
        type: 'scope_fragmentation',
        severity: frag.severity === 'HIGH' ? 'high' : 'medium',
        title: `${frag.trade} Scope Fragmentation`,
        description: frag.reason,
        lineItemsAffected: frag.lineNumbers,
      });
    }
    
    audit.push({
      engine: 'estimate-manipulation',
      decision: `Manipulation score: ${result.manipulationScore}/100. ${result.summary}`,
      confidence: result.manipulationScore > 0 ? 0.85 : 1.0,
      timestamp: Date.now(),
      processingTimeMs: Date.now() - startTime,
    });
    
    return { issues, audit };
    
  } catch (error) {
    console.error('[MANIPULATION-ADAPTER] Error:', error);
    audit.push({
      engine: 'estimate-manipulation',
      decision: 'Failed with error',
      confidence: 0,
      timestamp: Date.now(),
      processingTimeMs: Date.now() - startTime,
    });
    return { issues: [], audit };
  }
}

/**
 * Adapter for Geometry Validation Engine
 */
export function runGeometryValidation(estimate: StandardizedEstimate): EngineResult {
  const startTime = Date.now();
  const issues: ClaimIssue[] = [];
  const audit: AuditEvent[] = [];
  
  try {
    const { validateGeometry } = require('../engines/geometryValidator');
    const result = validateGeometry(estimate);
    
    // Convert inconsistencies to issues
    for (const inconsistency of result.inconsistencies) {
      issues.push({
        id: `geometry-${inconsistency.inconsistencyType}-${inconsistency.lineNumber}`,
        type: 'geometric_inconsistency',
        severity: inconsistency.severity,
        title: `Geometric Inconsistency: ${inconsistency.item}`,
        description: inconsistency.evidence,
        financialImpact: inconsistency.financialImpact,
        lineItemsAffected: [inconsistency.lineNumber],
        recommendation: `Verify ${inconsistency.item} quantity. Expected: ${inconsistency.expectedQuantity} ${inconsistency.unit}, Found: ${inconsistency.estimatedQuantity} ${inconsistency.unit}`,
      });
    }
    
    audit.push({
      engine: 'geometry-validation',
      decision: result.summary,
      confidence: 0.90,
      timestamp: Date.now(),
      processingTimeMs: Date.now() - startTime,
    });
    
    return { issues, audit };
    
  } catch (error) {
    console.error('[GEOMETRY-ADAPTER] Error:', error);
    audit.push({
      engine: 'geometry-validation',
      decision: 'Failed with error',
      confidence: 0,
      timestamp: Date.now(),
      processingTimeMs: Date.now() - startTime,
    });
    return { issues: [], audit };
  }
}

/**
 * Convert parsed estimate to standardized format
 */
export function standardizeEstimate(parsedEstimate: any): StandardizedEstimate {
  return {
    id: parsedEstimate.id,
    carrier: parsedEstimate.carrier,
    lineItems: (parsedEstimate.lineItems || []).map((item: any, index: number) => ({
      lineNumber: item.lineNumber ?? index + 1,
      tradeCode: item.tradeCode || '',
      description: item.description || '',
      quantity: item.quantity || 0,
      unit: item.unit || '',
      unitPrice: item.quantity > 0 ? (item.rcv || 0) / item.quantity : 0,
      rcv: item.rcv || 0,
      acv: item.acv || 0,
      depreciation: item.depreciation || 0,
      actionType: item.actionType,
    })),
    totals: {
      rcv: parsedEstimate.totals?.rcv || 0,
      acv: parsedEstimate.totals?.acv || 0,
      depreciation: parsedEstimate.totals?.depreciation || 0,
    },
    metadata: {
      format: parsedEstimate.metadata?.detectedFormat,
      region: parsedEstimate.metadata?.region || 'DEFAULT',
      lossType: parsedEstimate.metadata?.lossType,
      ...parsedEstimate.metadata,
    },
  };
}
