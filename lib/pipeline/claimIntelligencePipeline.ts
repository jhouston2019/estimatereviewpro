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
  runTradeDependencyAnalysis,
  runCodeComplianceAnalysis,
  runManipulationDetection,
  runGeometryValidation,
  standardizeEstimate,
} from '../adapters/engine-adapters';
import { reconstructScope, ScopeReconstructionResult } from '../engines/scopeReconstructionEngine';
import { calculateRecovery, RecoveryCalculation } from '../engines/impactCalculator';
import { generateLitigationEvidence, LitigationReport } from '../reporting/litigationEvidenceGenerator';
import { logClaimIntelligence } from '../intelligence/logClaimIntelligence';

export interface PipelineResult {
  issues: ClaimIssue[];
  auditEvents: AuditEvent[];
  reconstruction: ScopeReconstructionResult | null;
  recovery: RecoveryCalculation | null;
  litigationEvidence: LitigationReport | null;
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
  reportId?: string;
  carrier?: string;
  state?: string;
  claimType?: string;
}

/**
 * Run complete claim intelligence pipeline with all upgrades
 */
export async function runClaimIntelligencePipeline(
  parsedEstimate: any,
  options: PipelineOptions = {}
): Promise<PipelineResult> {
  
  const startTime = Date.now();
  const allIssues: ClaimIssue[] = [];
  const allAuditEvents: AuditEvent[] = [];
  const enginesExecuted: string[] = [];
  
  console.log('[PIPELINE] Starting enhanced claim intelligence analysis...');
  
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
    let reconstructionResult: ScopeReconstructionResult | null = null;
    let recoveryResult: RecoveryCalculation | null = null;
    let litigationReport: LitigationReport | null = null;
    
    // ENGINE 1: Pricing Validation
    if (!options.enabledEngines || options.enabledEngines.includes('pricing')) {
      console.log('[PIPELINE] [1/8] Running pricing validation...');
      try {
        const result = await runPricingValidation(standardizedEstimate);
        allIssues.push(...result.issues);
        allAuditEvents.push(...result.audit);
        enginesExecuted.push('pricing-validator');
        pricingResult = result;
      } catch (error) {
        console.error('[PIPELINE] Pricing validation failed (non-blocking):', error);
      }
    }
    
    // ENGINE 2: Depreciation Validation
    if (!options.enabledEngines || options.enabledEngines.includes('depreciation')) {
      console.log('[PIPELINE] [2/8] Running depreciation validation...');
      try {
        const result = runDepreciationValidation(standardizedEstimate);
        allIssues.push(...result.issues);
        allAuditEvents.push(...result.audit);
        enginesExecuted.push('depreciation-validator');
        depreciationResult = result;
      } catch (error) {
        console.error('[PIPELINE] Depreciation validation failed (non-blocking):', error);
      }
    }
    
    // ENGINE 3: Labor Rate Validation
    if (!options.enabledEngines || options.enabledEngines.includes('labor')) {
      console.log('[PIPELINE] [3/8] Running labor rate validation...');
      try {
        const result = await runLaborValidation(standardizedEstimate);
        allIssues.push(...result.issues);
        allAuditEvents.push(...result.audit);
        enginesExecuted.push('labor-rate-validator');
        laborResult = result;
      } catch (error) {
        console.error('[PIPELINE] Labor validation failed (non-blocking):', error);
      }
    }
    
    // ENGINE 4: Carrier Tactic Detection
    if (!options.enabledEngines || options.enabledEngines.includes('carrier-tactics')) {
      console.log('[PIPELINE] [4/8] Running carrier tactic detection...');
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
      console.log('[PIPELINE] [5/11] Running O&P gap detection...');
      try {
        const result = runOPGapDetection(standardizedEstimate);
        allIssues.push(...result.issues);
        allAuditEvents.push(...result.audit);
        enginesExecuted.push('op-gap-detector');
      } catch (error) {
        console.error('[PIPELINE] O&P gap detection failed (non-blocking):', error);
      }
    }
    
    // ENGINE 6: Trade Dependency Analysis
    if (!options.enabledEngines || options.enabledEngines.includes('trade-dependency')) {
      console.log('[PIPELINE] [6/11] Running trade dependency analysis...');
      try {
        const result = await runTradeDependencyAnalysis(standardizedEstimate);
        allIssues.push(...result.issues);
        allAuditEvents.push(...result.audit);
        enginesExecuted.push('trade-dependency');
      } catch (error) {
        console.error('[PIPELINE] Trade dependency analysis failed (non-blocking):', error);
      }
    }
    
    // ENGINE 7: Code Compliance Analysis
    if (!options.enabledEngines || options.enabledEngines.includes('code-compliance')) {
      console.log('[PIPELINE] [7/11] Running code compliance analysis...');
      try {
        const result = await runCodeComplianceAnalysis(standardizedEstimate);
        allIssues.push(...result.issues);
        allAuditEvents.push(...result.audit);
        enginesExecuted.push('code-compliance');
      } catch (error) {
        console.error('[PIPELINE] Code compliance analysis failed (non-blocking):', error);
      }
    }
    
    // ENGINE 8: Estimate Manipulation Detection
    if (!options.enabledEngines || options.enabledEngines.includes('manipulation-detection')) {
      console.log('[PIPELINE] [8/12] Running manipulation detection...');
      try {
        const result = await runManipulationDetection(standardizedEstimate);
        allIssues.push(...result.issues);
        allAuditEvents.push(...result.audit);
        enginesExecuted.push('manipulation-detection');
      } catch (error) {
        console.error('[PIPELINE] Manipulation detection failed (non-blocking):', error);
      }
    }
    
    // ENGINE 9: Geometry Validation
    if (!options.enabledEngines || options.enabledEngines.includes('geometry-validation')) {
      console.log('[PIPELINE] [9/12] Running geometry validation...');
      try {
        const result = runGeometryValidation(standardizedEstimate);
        allIssues.push(...result.issues);
        allAuditEvents.push(...result.audit);
        enginesExecuted.push('geometry-validation');
      } catch (error) {
        console.error('[PIPELINE] Geometry validation failed (non-blocking):', error);
      }
    }
    
    // ENGINE 10: Scope Gap Reconstruction
    if (!options.enabledEngines || options.enabledEngines.includes('scope-reconstruction')) {
      console.log('[PIPELINE] [10/12] Running scope reconstruction...');
      try {
        reconstructionResult = await reconstructScope(standardizedEstimate);
        enginesExecuted.push('scope-reconstruction');
        
        allAuditEvents.push({
          engine: 'scope-reconstruction',
          decision: reconstructionResult.summary,
          confidence: reconstructionResult.reconstruction.confidenceScore / 100,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error('[PIPELINE] Scope reconstruction failed (non-blocking):', error);
      }
    }
    
    // ENGINE 11: Recovery Calculator
    if (!options.enabledEngines || options.enabledEngines.includes('recovery-calculator')) {
      console.log('[PIPELINE] [11/12] Running recovery calculator...');
      try {
        recoveryResult = calculateRecovery(
          allIssues,
          reconstructionResult?.reconstruction || null,
          standardizedEstimate.totals.rcv
        );
        enginesExecuted.push('recovery-calculator');
        
        allAuditEvents.push({
          engine: 'recovery-calculator',
          decision: recoveryResult.summary,
          confidence: 1.0,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error('[PIPELINE] Recovery calculator failed (non-blocking):', error);
      }
    }
    
    // ENGINE 12: Litigation Evidence Generator
    if (!options.enabledEngines || options.enabledEngines.includes('litigation-evidence')) {
      console.log('[PIPELINE] [12/12] Generating litigation evidence...');
      try {
        if (options.reportId && options.carrier && options.claimType) {
          litigationReport = await generateLitigationEvidence(
            options.reportId,
            options.carrier,
            options.claimType,
            allIssues,
            reconstructionResult?.reconstruction || null
          );
          enginesExecuted.push('litigation-evidence');
          
          allAuditEvents.push({
            engine: 'litigation-evidence',
            decision: `Generated ${litigationReport.evidenceItems.length} evidence items`,
            confidence: 1.0,
            timestamp: Date.now(),
          });
        }
      } catch (error) {
        console.error('[PIPELINE] Litigation evidence failed (non-blocking):', error);
      }
    }
    
    // INTELLIGENCE LOGGING: Log to dataset
    if (options.reportId && options.carrier && options.state && options.claimType) {
      console.log('[PIPELINE] Logging to intelligence dataset...');
      try {
        await logClaimIntelligence({
          reportId: options.reportId,
          carrier: options.carrier,
          state: options.state,
          claimType: options.claimType,
          estimate: standardizedEstimate,
          issues: allIssues,
          reconstruction: reconstructionResult?.reconstruction || null,
          recovery: recoveryResult!,
        });
      } catch (error) {
        console.error('[PIPELINE] Intelligence logging failed (non-blocking):', error);
      }
    }
    
    // Calculate summary statistics
    const processingTime = Date.now() - startTime;
    const criticalIssues = allIssues.filter(i => i.severity === 'critical').length;
    const highIssues = allIssues.filter(i => i.severity === 'high').length;
    const mediumIssues = allIssues.filter(i => i.severity === 'medium').length;
    const lowIssues = allIssues.filter(i => i.severity === 'low').length;
    const totalFinancialImpact = recoveryResult?.totalRecoveryValue || 
      allIssues.reduce((sum, i) => sum + (i.financialImpact || 0), 0);
    
    console.log(`[PIPELINE] Complete in ${processingTime}ms`);
    console.log(`[PIPELINE] - Engines executed: ${enginesExecuted.length}`);
    console.log(`[PIPELINE] - Issues found: ${allIssues.length}`);
    console.log(`[PIPELINE] - Financial impact: $${totalFinancialImpact.toFixed(2)}`);
    
    return {
      issues: allIssues,
      auditEvents: allAuditEvents,
      reconstruction: reconstructionResult,
      recovery: recoveryResult,
      litigationEvidence: litigationReport,
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
      reconstruction: null,
      recovery: null,
      litigationEvidence: null,
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
  let summary = `CLAIMS INTELLIGENCE PLATFORM ANALYSIS\n`;
  summary += `${'='.repeat(80)}\n\n`;
  
  // Financial Summary
  summary += `FINANCIAL SUMMARY:\n`;
  if (result.recovery) {
    summary += `- Original Estimate: $${result.recovery.originalEstimateValue.toFixed(2)}\n`;
    summary += `- Reconstructed Value: $${result.recovery.reconstructedEstimateValue.toFixed(2)}\n`;
    summary += `- Recovery Opportunity: $${result.recovery.totalRecoveryValue.toFixed(2)}\n`;
    summary += `- Recovery Percentage: ${result.recovery.recoveryPercentage.toFixed(1)}%\n`;
  } else {
    summary += `- Total Financial Impact: $${result.summary.totalFinancialImpact.toFixed(2)}\n`;
  }
  summary += `\n`;
  
  // Issue Summary
  summary += `ISSUE SUMMARY:\n`;
  summary += `- Total issues: ${result.summary.totalIssues}\n`;
  summary += `- Critical: ${result.summary.criticalIssues}\n`;
  summary += `- High: ${result.summary.highIssues}\n`;
  summary += `- Medium: ${result.summary.mediumIssues}\n`;
  summary += `- Low: ${result.summary.lowIssues}\n`;
  summary += `- Processing time: ${result.summary.processingTimeMs}ms\n`;
  summary += `- Engines executed: ${result.summary.enginesExecuted.join(', ')}\n\n`;
  
  // Scope Reconstruction
  if (result.reconstruction) {
    summary += `SCOPE RECONSTRUCTION:\n`;
    summary += `- Missing items: ${result.reconstruction.itemsAdded}\n`;
    summary += `- Trades affected: ${result.reconstruction.tradesDetected.join(', ')}\n`;
    summary += `- Gap value: $${result.reconstruction.reconstruction.gapValue.toFixed(2)}\n`;
    summary += `- Confidence: ${result.reconstruction.reconstruction.confidenceScore}%\n\n`;
  }
  
  // Recovery Breakdown
  if (result.recovery) {
    summary += `RECOVERY BREAKDOWN:\n`;
    summary += `- Pricing Suppression: $${result.recovery.breakdown.pricingSuppression.toFixed(2)}\n`;
    summary += `- Excessive Depreciation: $${result.recovery.breakdown.excessiveDepreciation.toFixed(2)}\n`;
    summary += `- Labor Suppression: $${result.recovery.breakdown.laborSuppression.toFixed(2)}\n`;
    summary += `- Missing Scope: $${result.recovery.breakdown.missingScope.toFixed(2)}\n`;
    summary += `- Missing O&P: $${result.recovery.breakdown.missingOP.toFixed(2)}\n`;
    summary += `- Carrier Tactics: $${result.recovery.breakdown.carrierTactics.toFixed(2)}\n\n`;
  }
  
  // Litigation Evidence
  if (result.litigationEvidence) {
    summary += `LITIGATION EVIDENCE:\n`;
    summary += `- Evidence items: ${result.litigationEvidence.evidenceItems.length}\n`;
    summary += `- Total impact: $${result.litigationEvidence.totalFinancialImpact.toFixed(2)}\n\n`;
  }
  
  if (result.issues.length === 0) {
    summary += `✓ No issues detected\n`;
    return summary;
  }
  
  summary += `ISSUES DETECTED:\n\n`;
  
  // Group by severity
  const critical = result.issues.filter(i => i.severity === 'critical');
  const high = result.issues.filter(i => i.severity === 'high');
  const medium = result.issues.filter(i => i.severity === 'medium');
  
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
    for (const issue of high.slice(0, 10)) {
      summary += `  - ${issue.title}\n`;
      if (issue.financialImpact) {
        summary += `    Impact: $${issue.financialImpact.toFixed(2)}\n`;
      }
    }
    if (high.length > 10) {
      summary += `  ... and ${high.length - 10} more\n`;
    }
    summary += `\n`;
  }
  
  if (medium.length > 0) {
    summary += `MEDIUM (${medium.length}):\n`;
    for (const issue of medium.slice(0, 5)) {
      summary += `  - ${issue.title}\n`;
    }
    if (medium.length > 5) {
      summary += `  ... and ${medium.length - 5} more\n`;
    }
    summary += `\n`;
  }
  
  return summary;
}
