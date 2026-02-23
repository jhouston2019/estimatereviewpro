/**
 * UNIFIED CLAIM INTELLIGENCE ENGINE
 * Combines all analysis engines into comprehensive claim intelligence
 * Deterministic first, AI overlay last
 */

import { StructuredEstimate } from './xactimate-structural-parser';
import { ExposureAnalysis } from './structural-exposure-engine';
import { CompletenessAnalysis } from './structural-completeness-engine';
import { LossExpectation } from './structural-loss-expectation-engine';
import { CodeUpgradeAnalysis } from './structural-code-upgrade-engine';
import { ExpectedQuantities } from './dimension-engine';
import { ParsedReport } from './report-parser';
import { DeviationAnalysis } from './deviation-engine';
import { PhotoAnalysisResult } from './photo-analysis-engine';

export interface ClaimIntelligenceReport {
  // Core estimate analysis
  structuralIntegrityScore: number;
  exposureRange: {
    min: number;
    max: number;
    breakdown: ExposureAnalysis;
  };
  
  // Deviation analysis
  deviationExposureRange: {
    min: number;
    max: number;
    breakdown: DeviationAnalysis;
  };
  
  // Code compliance
  codeUpgradeFlags: CodeUpgradeAnalysis;
  
  // Report comparison
  reportDeviations: {
    present: boolean;
    directives: number;
    deviations: number;
    summary: string;
  };
  
  // Dimension variance
  dimensionVariances: {
    present: boolean;
    comparisons: number;
    variances: number;
    summary: string;
  };
  
  // Photo analysis
  photoFlags: {
    present: boolean;
    photosAnalyzed: number;
    criticalFlags: number;
    summary: string;
  };
  
  // Consolidated scoring
  consolidatedRiskScore: number;
  
  // Summary
  executiveSummary: string;
  
  // Metadata
  metadata: {
    estimateTotalRCV: number;
    estimateTotalACV: number;
    totalFinancialExposure: {
      min: number;
      max: number;
    };
    analysisDate: string;
    processingTimeMs: number;
    enginesUsed: string[];
  };
}

export interface ClaimIntelligenceInput {
  estimate: StructuredEstimate;
  exposureAnalysis: ExposureAnalysis;
  completenessAnalysis: CompletenessAnalysis;
  lossExpectation: LossExpectation;
  codeAnalysis: CodeUpgradeAnalysis;
  deviationAnalysis?: DeviationAnalysis;
  dimensions?: ExpectedQuantities;
  expertReport?: ParsedReport;
  photoAnalysis?: PhotoAnalysisResult;
}

/**
 * Calculate consolidated risk score
 */
function calculateConsolidatedRiskScore(input: ClaimIntelligenceInput): number {
  let score = 0;
  
  // Structural integrity (inverse - lower is worse)
  const integrityPenalty = 100 - input.completenessAnalysis.structuralIntegrityScore;
  score += integrityPenalty * 0.25;
  
  // Exposure as % of estimate
  const exposurePercent = input.estimate.totals.rcv > 0
    ? ((input.exposureAnalysis.totalExposureMin + input.exposureAnalysis.totalExposureMax) / 2) / input.estimate.totals.rcv * 100
    : 0;
  score += Math.min(exposurePercent, 50) * 0.30;
  
  // Deviation exposure (if present)
  if (input.deviationAnalysis) {
    const deviationPercent = input.estimate.totals.rcv > 0
      ? ((input.deviationAnalysis.totalDeviationExposureMin + input.deviationAnalysis.totalDeviationExposureMax) / 2) / input.estimate.totals.rcv * 100
      : 0;
    score += Math.min(deviationPercent, 50) * 0.25;
  }
  
  // Code upgrade risk
  const codeRiskPercent = input.estimate.totals.rcv > 0
    ? ((input.codeAnalysis.totalCodeRiskMin + input.codeAnalysis.totalCodeRiskMax) / 2) / input.estimate.totals.rcv * 100
    : 0;
  score += Math.min(codeRiskPercent, 30) * 0.10;
  
  // Critical issue multipliers
  if (input.completenessAnalysis.criticalIssues > 0) {
    score += input.completenessAnalysis.criticalIssues * 5;
  }
  
  if (input.deviationAnalysis && input.deviationAnalysis.criticalCount > 0) {
    score += input.deviationAnalysis.criticalCount * 8;
  }
  
  if (input.codeAnalysis.criticalCount > 0) {
    score += input.codeAnalysis.criticalCount * 6;
  }
  
  return Math.min(100, Math.round(score));
}

/**
 * Generate executive summary
 */
function generateExecutiveSummary(input: ClaimIntelligenceInput, riskScore: number): string {
  const parts: string[] = [];
  
  // Estimate overview
  parts.push(`Analyzed estimate totaling $${input.estimate.totals.rcv.toLocaleString()} RCV with ${input.estimate.lineItems.length} line items.`);
  
  // Structural integrity
  parts.push(`Structural integrity score: ${input.completenessAnalysis.structuralIntegrityScore}/100.`);
  
  // Exposure
  const totalExposureMin = input.exposureAnalysis.totalExposureMin + (input.deviationAnalysis?.totalDeviationExposureMin || 0) + input.codeAnalysis.totalCodeRiskMin;
  const totalExposureMax = input.exposureAnalysis.totalExposureMax + (input.deviationAnalysis?.totalDeviationExposureMax || 0) + input.codeAnalysis.totalCodeRiskMax;
  
  if (totalExposureMin > 0 || totalExposureMax > 0) {
    parts.push(`Total identified exposure: $${totalExposureMin.toLocaleString()} - $${totalExposureMax.toLocaleString()}.`);
  }
  
  // Deviations
  if (input.deviationAnalysis && input.deviationAnalysis.deviations.length > 0) {
    parts.push(`${input.deviationAnalysis.deviations.length} deviation(s) identified from expert report or dimension analysis.`);
  }
  
  // Code risks
  if (input.codeAnalysis.codeRisks.length > 0) {
    parts.push(`${input.codeAnalysis.codeRisks.length} code compliance item(s) flagged.`);
  }
  
  // Photos
  if (input.photoAnalysis && input.photoAnalysis.criticalFlags.length > 0) {
    parts.push(`Photo analysis flagged ${input.photoAnalysis.criticalFlags.length} critical concern(s).`);
  }
  
  // Risk assessment
  if (riskScore >= 70) {
    parts.push(`Consolidated risk score: ${riskScore}/100 (HIGH RISK).`);
  } else if (riskScore >= 40) {
    parts.push(`Consolidated risk score: ${riskScore}/100 (MODERATE RISK).`);
  } else {
    parts.push(`Consolidated risk score: ${riskScore}/100 (LOW RISK).`);
  }
  
  return parts.join(' ');
}

/**
 * Generate unified claim intelligence report
 */
export function generateClaimIntelligence(
  input: ClaimIntelligenceInput
): ClaimIntelligenceReport {
  
  const startTime = Date.now();
  const enginesUsed: string[] = [
    'structural-parser',
    'exposure-engine',
    'completeness-engine',
    'loss-expectation-engine',
    'code-upgrade-engine'
  ];
  
  // Calculate consolidated risk score
  const consolidatedRiskScore = calculateConsolidatedRiskScore(input);
  
  // Report deviations summary
  const reportDeviations = input.deviationAnalysis && input.expertReport
    ? {
        present: true,
        directives: input.expertReport.directives.filter(d => d.measurable).length,
        deviations: input.deviationAnalysis.deviations.filter(d => d.source === 'REPORT' || d.source === 'BOTH').length,
        summary: input.deviationAnalysis.deviations.length > 0
          ? `${input.deviationAnalysis.deviations.length} deviation(s) from expert report directives`
          : 'No deviations from expert report'
      }
    : {
        present: false,
        directives: 0,
        deviations: 0,
        summary: 'No expert report provided for comparison'
      };
  
  // Dimension variances summary
  const dimensionVariances = input.deviationAnalysis && input.dimensions
    ? {
        present: true,
        comparisons: input.deviationAnalysis.metadata.dimensionComparisonsPerformed,
        variances: input.deviationAnalysis.deviations.filter(d => d.source === 'DIMENSION' || d.source === 'BOTH').length,
        summary: input.deviationAnalysis.deviations.filter(d => d.dimensionBased).length > 0
          ? `${input.deviationAnalysis.deviations.filter(d => d.dimensionBased).length} variance(s) from dimension measurements`
          : 'No significant variances from dimensions'
      }
    : {
        present: false,
        comparisons: 0,
        variances: 0,
        summary: 'No dimension data provided for comparison'
      };
  
  // Photo flags summary
  const photoFlags = input.photoAnalysis
    ? {
        present: true,
        photosAnalyzed: input.photoAnalysis.metadata.photosAnalyzed,
        criticalFlags: input.photoAnalysis.criticalFlags.length,
        summary: input.photoAnalysis.criticalFlags.length > 0
          ? `${input.photoAnalysis.criticalFlags.length} critical flag(s) from photo analysis`
          : 'No critical issues flagged from photos'
      }
    : {
        present: false,
        photosAnalyzed: 0,
        criticalFlags: 0,
        summary: 'No photos provided for analysis'
      };
  
  if (input.deviationAnalysis) enginesUsed.push('deviation-engine');
  if (input.dimensions) enginesUsed.push('dimension-engine');
  if (input.expertReport) enginesUsed.push('report-parser');
  if (input.photoAnalysis) enginesUsed.push('photo-analysis-engine');
  
  // Calculate total financial exposure
  const totalExposureMin = 
    input.exposureAnalysis.totalExposureMin +
    (input.deviationAnalysis?.totalDeviationExposureMin || 0) +
    input.codeAnalysis.totalCodeRiskMin;
  
  const totalExposureMax = 
    input.exposureAnalysis.totalExposureMax +
    (input.deviationAnalysis?.totalDeviationExposureMax || 0) +
    input.codeAnalysis.totalCodeRiskMax;
  
  // Generate executive summary
  const executiveSummary = generateExecutiveSummary(input, consolidatedRiskScore);
  
  const processingTimeMs = Date.now() - startTime;
  
  return {
    structuralIntegrityScore: input.completenessAnalysis.structuralIntegrityScore,
    
    exposureRange: {
      min: input.exposureAnalysis.totalExposureMin,
      max: input.exposureAnalysis.totalExposureMax,
      breakdown: input.exposureAnalysis
    },
    
    deviationExposureRange: {
      min: input.deviationAnalysis?.totalDeviationExposureMin || 0,
      max: input.deviationAnalysis?.totalDeviationExposureMax || 0,
      breakdown: input.deviationAnalysis || {
        deviations: [],
        totalDeviationExposureMin: 0,
        totalDeviationExposureMax: 0,
        criticalCount: 0,
        highCount: 0,
        summary: 'No deviation analysis performed',
        metadata: {
          reportDirectivesChecked: 0,
          dimensionComparisonsPerformed: 0,
          deviationsFound: 0
        }
      }
    },
    
    codeUpgradeFlags: input.codeAnalysis,
    
    reportDeviations,
    dimensionVariances,
    photoFlags,
    
    consolidatedRiskScore,
    executiveSummary,
    
    metadata: {
      estimateTotalRCV: input.estimate.totals.rcv,
      estimateTotalACV: input.estimate.totals.acv,
      totalFinancialExposure: {
        min: totalExposureMin,
        max: totalExposureMax
      },
      analysisDate: new Date().toISOString(),
      processingTimeMs,
      enginesUsed
    }
  };
}
