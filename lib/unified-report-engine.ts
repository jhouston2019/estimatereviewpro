/**
 * UNIFIED REPORT ENGINE
 * Orchestrates all analysis engines and produces final structured report
 * Combines: parsing, exposure, loss expectation, completeness, code upgrades, AI insights
 */

import { parseXactimateEstimate, ParsedEstimate } from './xactimate-parser';
import { calculateExposure, ExposureAnalysis } from './exposure-engine';
import { calculateLossExpectation, LossExpectation } from './loss-expectation-engine';
import { calculateTradeCompleteness, CompletenessAnalysis } from './trade-completeness-engine';
import { analyzeCodeUpgrades, CodeUpgradeAnalysis } from './code-upgrade-engine';

interface UnifiedReport {
  // Classification
  classification: {
    estimateType: string;
    lossType: string;
    severityLevel: string;
    confidence: string;
  };
  
  // Structural integrity
  structuralIntegrityScore: number;
  
  // Financial exposure
  financialExposureRange: {
    min: number;
    max: number;
    riskScore: number;
  };
  
  // Trade scores
  tradeScores: CompletenessAnalysis;
  
  // Code upgrade flags
  codeUpgradeFlags: CodeUpgradeAnalysis;
  
  // Deterministic findings
  deterministicFindings: {
    parsedLineItems: number;
    totalRCV: number;
    totalACV: number;
    missingCriticalTrades: string[];
    scopeGaps: string[];
    integrityIssues: string[];
  };
  
  // AI insights (optional, added last)
  aiInsights?: {
    summary: string;
    additionalObservations: string[];
    limitations: string;
    status: 'SUCCESS' | 'FALLBACK' | 'SKIPPED';
  };
  
  // Metadata
  metadata: {
    processingTimeMs: number;
    timestamp: string;
    version: string;
    engines: string[];
  };
}

interface AnalysisOptions {
  includeAI?: boolean;
  aiTimeout?: number;
  maxProcessingTime?: number;
}

/**
 * Generate unified report from estimate text
 */
export async function generateUnifiedReport(
  estimateText: string,
  options: AnalysisOptions = {}
): Promise<UnifiedReport> {
  const startTime = Date.now();
  const engines: string[] = [];
  
  try {
    // PHASE 1: Parse estimate (deterministic)
    console.log('[1/6] Parsing estimate...');
    engines.push('xactimate-parser');
    const parsedEstimate = parseXactimateEstimate(estimateText);
    
    if (parsedEstimate.metadata.confidence === 'FAILED') {
      throw new Error('Estimate parsing failed - format not recognized');
    }
    
    // PHASE 2: Calculate exposure (deterministic)
    console.log('[2/6] Calculating financial exposure...');
    engines.push('exposure-engine');
    const exposureAnalysis = calculateExposure(parsedEstimate);
    
    // PHASE 3: Calculate loss expectation (deterministic)
    console.log('[3/6] Analyzing loss expectation...');
    engines.push('loss-expectation-engine');
    const lossExpectation = calculateLossExpectation(parsedEstimate);
    
    // PHASE 4: Calculate trade completeness (deterministic)
    console.log('[4/6] Scoring trade completeness...');
    engines.push('trade-completeness-engine');
    const completenessAnalysis = calculateTradeCompleteness(parsedEstimate);
    
    // PHASE 5: Analyze code upgrades (deterministic)
    console.log('[5/6] Checking code requirements...');
    engines.push('code-upgrade-engine');
    const codeAnalysis = analyzeCodeUpgrades(parsedEstimate);
    
    // PHASE 6: AI insights (optional, non-blocking)
    let aiInsights: UnifiedReport['aiInsights'] = undefined;
    
    if (options.includeAI !== false) {
      console.log('[6/6] Generating AI insights...');
      engines.push('ai-service');
      
      try {
        // This would call the hardened AI service
        // For now, we'll skip it to avoid blocking
        aiInsights = {
          summary: 'AI analysis not yet integrated with unified report engine.',
          additionalObservations: [],
          limitations: 'This report is based on deterministic analysis only.',
          status: 'SKIPPED'
        };
      } catch (aiError) {
        console.error('AI insights failed:', aiError);
        aiInsights = {
          summary: 'AI analysis could not be completed.',
          additionalObservations: [],
          limitations: 'This report is based on deterministic analysis only.',
          status: 'FALLBACK'
        };
      }
    }
    
    // Compile deterministic findings
    const missingCriticalTrades = lossExpectation.missingCriticalTrades.map(
      trade => `${trade.tradeName} (${Math.round(trade.probability * 100)}% expected)`
    );
    
    const scopeGaps = exposureAnalysis.exposureItems.map(
      item => `${item.missingTradeName}: ${item.reason}`
    );
    
    const integrityIssues = completenessAnalysis.tradeScores
      .filter(ts => ts.issues.length > 0)
      .flatMap(ts => ts.issues.map(issue => `${ts.tradeName}: ${issue.description}`));
    
    // Build final report
    const processingTimeMs = Date.now() - startTime;
    
    const report: UnifiedReport = {
      classification: {
        estimateType: parsedEstimate.metadata.detectedFormat,
        lossType: lossExpectation.lossType,
        severityLevel: lossExpectation.severityLevel,
        confidence: parsedEstimate.metadata.confidence
      },
      
      structuralIntegrityScore: completenessAnalysis.overallIntegrityScore,
      
      financialExposureRange: {
        min: exposureAnalysis.totalExposureMin,
        max: exposureAnalysis.totalExposureMax,
        riskScore: exposureAnalysis.riskScore
      },
      
      tradeScores: completenessAnalysis,
      
      codeUpgradeFlags: codeAnalysis,
      
      deterministicFindings: {
        parsedLineItems: parsedEstimate.lineItems.length,
        totalRCV: parsedEstimate.totals.rcv,
        totalACV: parsedEstimate.totals.acv,
        missingCriticalTrades,
        scopeGaps,
        integrityIssues
      },
      
      aiInsights,
      
      metadata: {
        processingTimeMs,
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        engines
      }
    };
    
    console.log(`Report generated in ${processingTimeMs}ms`);
    
    return report;
    
  } catch (error) {
    console.error('Report generation failed:', error);
    throw error;
  }
}

/**
 * Format report as human-readable text
 */
export function formatReportAsText(report: UnifiedReport): string {
  let output = '';
  
  output += '='.repeat(80) + '\n';
  output += 'ESTIMATE ANALYSIS REPORT\n';
  output += '='.repeat(80) + '\n\n';
  
  // Classification
  output += 'CLASSIFICATION\n';
  output += '-'.repeat(80) + '\n';
  output += `Estimate Type: ${report.classification.estimateType}\n`;
  output += `Loss Type: ${report.classification.lossType}\n`;
  output += `Severity Level: ${report.classification.severityLevel}\n`;
  output += `Confidence: ${report.classification.confidence}\n\n`;
  
  // Structural Integrity
  output += 'STRUCTURAL INTEGRITY\n';
  output += '-'.repeat(80) + '\n';
  output += `Overall Score: ${report.structuralIntegrityScore}/100\n`;
  output += `${report.tradeScores.summary}\n\n`;
  
  // Financial Exposure
  output += 'FINANCIAL EXPOSURE\n';
  output += '-'.repeat(80) + '\n';
  output += `Estimated Range: $${report.financialExposureRange.min.toLocaleString()} - $${report.financialExposureRange.max.toLocaleString()}\n`;
  output += `Risk Score: ${report.financialExposureRange.riskScore}/100\n\n`;
  
  if (report.deterministicFindings.scopeGaps.length > 0) {
    output += 'Identified Scope Gaps:\n';
    for (const gap of report.deterministicFindings.scopeGaps) {
      output += `  • ${gap}\n`;
    }
    output += '\n';
  }
  
  // Code Upgrades
  if (report.codeUpgradeFlags.codeUpgradeRisks.length > 0) {
    output += 'CODE COMPLIANCE\n';
    output += '-'.repeat(80) + '\n';
    output += `${report.codeUpgradeFlags.summary}\n\n`;
    
    output += 'Missing Code Items:\n';
    for (const risk of report.codeUpgradeFlags.codeUpgradeRisks) {
      output += `  • ${risk.itemName} [${risk.severity}]\n`;
      output += `    ${risk.reason}\n`;
      output += `    Estimated: $${risk.estimatedCostMin.toLocaleString()} - $${risk.estimatedCostMax.toLocaleString()}\n`;
    }
    output += '\n';
  }
  
  // Missing Critical Trades
  if (report.deterministicFindings.missingCriticalTrades.length > 0) {
    output += 'MISSING EXPECTED TRADES\n';
    output += '-'.repeat(80) + '\n';
    for (const trade of report.deterministicFindings.missingCriticalTrades) {
      output += `  • ${trade}\n`;
    }
    output += '\n';
  }
  
  // Trade Completeness
  if (report.tradeScores.tradeScores.length > 0) {
    output += 'TRADE COMPLETENESS SCORES\n';
    output += '-'.repeat(80) + '\n';
    for (const ts of report.tradeScores.tradeScores) {
      output += `  ${ts.tradeName}: ${ts.completenessScore}/100`;
      if (ts.issues.length > 0) {
        output += ` (${ts.issues.length} issue${ts.issues.length > 1 ? 's' : ''})`;
      }
      output += '\n';
    }
    output += '\n';
  }
  
  // AI Insights
  if (report.aiInsights && report.aiInsights.status === 'SUCCESS') {
    output += 'AI INSIGHTS\n';
    output += '-'.repeat(80) + '\n';
    output += `${report.aiInsights.summary}\n\n`;
    
    if (report.aiInsights.additionalObservations.length > 0) {
      output += 'Additional Observations:\n';
      for (const obs of report.aiInsights.additionalObservations) {
        output += `  • ${obs}\n`;
      }
      output += '\n';
    }
  }
  
  // Metadata
  output += 'ANALYSIS METADATA\n';
  output += '-'.repeat(80) + '\n';
  output += `Processing Time: ${report.metadata.processingTimeMs}ms\n`;
  output += `Timestamp: ${report.metadata.timestamp}\n`;
  output += `Version: ${report.metadata.version}\n`;
  output += `Engines: ${report.metadata.engines.join(', ')}\n`;
  
  output += '\n' + '='.repeat(80) + '\n';
  output += 'END OF REPORT\n';
  output += '='.repeat(80) + '\n';
  
  return output;
}

export type { UnifiedReport, AnalysisOptions };
