/**
 * CLAIM INTELLIGENCE PIPELINE
 * Central orchestrator for all intelligence engines
 * Executes engines sequentially and merges results
 */

import { EngineResult, ClaimIssue, AuditEvent, StandardizedEstimate } from '../../types/claim-engine';
import {
  runPricingValidation,
  runDepreciationValidation,
  runLaborValidation,
  runCarrierTacticDetection,
  runOPGapDetection,
  standardizeEstimate,
} from '../adapters/engine-adapters';

export interface PipelineResult {
  issues: ClaimIssue[];
  auditEvents: AuditEvent[];
  summary: {
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    totalFinancialImpact: number;
    enginesExecuted: string[];
    processingTimeMs: number;
  };
}

export interface PipelineOptions {
  region?: string;
  includeAI?: boolean;
  enabledEngines?: string[];
}

/**
 * Run complete claim intelligence pipeline
 */
export async function runClaimIntelligencePipeline(
  parsedEstimate: any,
  options: PipelineOptions = {}
): Promise<PipelineResult> {
  
  const startTime = Date.now();
  const allIssues: ClaimIssue[] = [];
  const allAuditEvents: AuditEvent[] = [];
  const enginesExecuted: string[] = [];
  
  console.log('[PIPELINE] Starting claim intelligence analysis...');
  
  try {
    // Standardize estimate format
    const standardizedEstimate: StandardizedEstimate = standardizeEstimate(parsedEstimate);
    
    // Set region if provided
    if (options.region) {
      standardizedEstimate.metadata = standardizedEstimate.metadata || {};
      standardizedEstimate.metadata.region = options.region;
    }
    
    // Track results for cross-engine analysis
    let pricingResult: any = null;
    let depreciationResult: any = null;
    let laborResult: any = null;
    
    // ENGINE 1: Pricing Validation
    if (!options.enabledEngines || options.enabledEngines.includes('pricing')) {
      console.log('[PIPELINE] [1/5] Running pricing validation...');
      try {
        const result = await runPricingValidation(standardizedEstimate);
        allIssues.push(...result.issues);
        allAuditEvents.push(...result.audit);
        enginesExecuted.push('pricing-validator');
        
        // Store for carrier tactic detector
        pricingResult = result;
      } catch (error) {
        console.error('[PIPELINE] Pricing validation failed (non-blocking):', error);
      }
    }
    
    // ENGINE 2: Depreciation Validation
    if (!options.enabledEngines || options.enabledEngines.includes('depreciation')) {
      console.log('[PIPELINE] [2/5] Running depreciation validation...');
      try {
        const result = runDepreciationValidation(standardizedEstimate);
        allIssues.push(...result.issues);
        allAuditEvents.push(...result.audit);
        enginesExecuted.push('depreciation-validator');
        
        // Store for carrier tactic detector
        depreciationResult = result;
      } catch (error) {
        console.error('[PIPELINE] Depreciation validation failed (non-blocking):', error);
      }
    }
    
    // ENGINE 3: Labor Rate Validation
    if (!options.enabledEngines || options.enabledEngines.includes('labor')) {
      console.log('[PIPELINE] [3/5] Running labor rate validation...');
      try {
        const result = await runLaborValidation(standardizedEstimate);
        allIssues.push(...result.issues);
        allAuditEvents.push(...result.audit);
        enginesExecuted.push('labor-rate-validator');
        
        // Store for carrier tactic detector
        laborResult = result;
      } catch (error) {
        console.error('[PIPELINE] Labor validation failed (non-blocking):', error);
      }
    }
    
    // ENGINE 4: Carrier Tactic Detection
    if (!options.enabledEngines || options.enabledEngines.includes('carrier-tactics')) {
      console.log('[PIPELINE] [4/5] Running carrier tactic detection...');
      try {
        const result = runCarrierTacticDetection(
          standardizedEstimate,
          pricingResult,
          depreciationResult,
          laborResult
        );
        allIssues.push(...result.issues);
        allAuditEvents.push(...result.audit);
        enginesExecuted.push('carrier-tactic-detector');
      } catch (error) {
        console.error('[PIPELINE] Carrier tactic detection failed (non-blocking):', error);
      }
    }
    
    // ENGINE 5: O&P Gap Detection
    if (!options.enabledEngines || options.enabledEngines.includes('op-gaps')) {
      console.log('[PIPELINE] [5/5] Running O&P gap detection...');
      try {
        const result = runOPGapDetection(standardizedEstimate);
        allIssues.push(...result.issues);
        allAuditEvents.push(...result.audit);
        enginesExecuted.push('op-gap-detector');
      } catch (error) {
        console.error('[PIPELINE] O&P gap detection failed (non-blocking):', error);
      }
    }
    
    // Calculate summary statistics
    const processingTime = Date.now() - startTime;
    const criticalIssues = allIssues.filter(i => i.severity === 'critical').length;
    const highIssues = allIssues.filter(i => i.severity === 'high').length;
    const mediumIssues = allIssues.filter(i => i.severity === 'medium').length;
    const lowIssues = allIssues.filter(i => i.severity === 'low').length;
    const totalFinancialImpact = allIssues.reduce((sum, i) => sum + (i.financialImpact || 0), 0);
    
    console.log(`[PIPELINE] Complete in ${processingTime}ms`);
    console.log(`[PIPELINE] - Engines executed: ${enginesExecuted.length}`);
    console.log(`[PIPELINE] - Issues found: ${allIssues.length}`);
    console.log(`[PIPELINE] - Financial impact: $${totalFinancialImpact.toFixed(2)}`);
    
    return {
      issues: allIssues,
      auditEvents: allAuditEvents,
      summary: {
        totalIssues: allIssues.length,
        criticalIssues,
        highIssues,
        mediumIssues,
        lowIssues,
        totalFinancialImpact,
        enginesExecuted,
        processingTimeMs: processingTime,
      },
    };
    
  } catch (error) {
    console.error('[PIPELINE] Fatal error:', error);
    
    // Return partial results even on error
    return {
      issues: allIssues,
      auditEvents: allAuditEvents,
      summary: {
        totalIssues: allIssues.length,
        criticalIssues: 0,
        highIssues: 0,
        mediumIssues: 0,
        lowIssues: 0,
        totalFinancialImpact: 0,
        enginesExecuted,
        processingTimeMs: Date.now() - startTime,
      },
    };
  }
}

/**
 * Format pipeline results as text summary
 */
export function formatPipelineSummary(result: PipelineResult): string {
  let summary = `CLAIM INTELLIGENCE ANALYSIS\n`;
  summary += `${'='.repeat(60)}\n\n`;
  
  summary += `SUMMARY:\n`;
  summary += `- Total issues: ${result.summary.totalIssues}\n`;
  summary += `- Critical: ${result.summary.criticalIssues}\n`;
  summary += `- High: ${result.summary.highIssues}\n`;
  summary += `- Medium: ${result.summary.mediumIssues}\n`;
  summary += `- Low: ${result.summary.lowIssues}\n`;
  summary += `- Financial impact: $${result.summary.totalFinancialImpact.toFixed(2)}\n`;
  summary += `- Processing time: ${result.summary.processingTimeMs}ms\n`;
  summary += `- Engines executed: ${result.summary.enginesExecuted.join(', ')}\n\n`;
  
  if (result.issues.length === 0) {
    summary += `✓ No issues detected\n`;
    return summary;
  }
  
  summary += `ISSUES DETECTED:\n\n`;
  
  // Group by severity
  const critical = result.issues.filter(i => i.severity === 'critical');
  const high = result.issues.filter(i => i.severity === 'high');
  const medium = result.issues.filter(i => i.severity === 'medium');
  const low = result.issues.filter(i => i.severity === 'low');
  
  if (critical.length > 0) {
    summary += `CRITICAL (${critical.length}):\n`;
    for (const issue of critical) {
      summary += `  - ${issue.title}: ${issue.description}\n`;
      if (issue.financialImpact) {
        summary += `    Impact: $${issue.financialImpact.toFixed(2)}\n`;
      }
    }
    summary += `\n`;
  }
  
  if (high.length > 0) {
    summary += `HIGH (${high.length}):\n`;
    for (const issue of high) {
      summary += `  - ${issue.title}: ${issue.description}\n`;
      if (issue.financialImpact) {
        summary += `    Impact: $${issue.financialImpact.toFixed(2)}\n`;
      }
    }
    summary += `\n`;
  }
  
  if (medium.length > 0) {
    summary += `MEDIUM (${medium.length}):\n`;
    for (const issue of medium.slice(0, 5)) { // Show first 5
      summary += `  - ${issue.title}\n`;
    }
    if (medium.length > 5) {
      summary += `  ... and ${medium.length - 5} more\n`;
    }
    summary += `\n`;
  }
  
  return summary;
}
