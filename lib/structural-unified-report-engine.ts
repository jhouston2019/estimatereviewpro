/**
 * STRUCTURAL UNIFIED REPORT ENGINE
 * Orchestrates all deterministic engines + AI overlay
 * Produces final structured report
 */

import { normalizeInput, validateNormalizedInput, NormalizedInput } from './input-normalizer';
import { detectFormat, validateFormatDetection, FormatDetection } from './format-detector';
import { parseStructuredEstimate, validateStructuredEstimate, StructuredEstimate } from './xactimate-structural-parser';
import { calculateStructuralExposure, ExposureAnalysis } from './structural-exposure-engine';
import { calculateStructuralCompleteness, CompletenessAnalysis } from './structural-completeness-engine';
import { calculateLossExpectation, LossExpectation } from './structural-loss-expectation-engine';
import { analyzeCodeUpgrades, CodeUpgradeAnalysis } from './structural-code-upgrade-engine';
import { generateAIOverlay, AIOverlayResult } from './hardened-ai-overlay';

export interface UnifiedReport {
  classification: {
    estimateType: string;
    lossType: string;
    severityLevel: string;
    confidence: string;
  };
  
  structuralIntegrityScore: number;
  
  totalExposureMin: number;
  totalExposureMax: number;
  
  tradeScores: CompletenessAnalysis;
  
  codeRisks: CodeUpgradeAnalysis;
  
  findings: {
    parsedLineItems: number;
    totalRCV: number;
    totalACV: number;
    parseConfidence: number;
    missingCriticalTrades: string[];
    scopeGaps: string[];
    integrityIssues: string[];
  };
  
  aiInsights?: AIOverlayResult;
  
  metadata: {
    processingTimeMs: number;
    timestamp: string;
    version: string;
    engines: string[];
  };
}

export interface ReportOptions {
  includeAI?: boolean;
  openaiApiKey?: string;
  maxProcessingTime?: number;
}

/**
 * Generate unified report from raw text
 */
export async function generateStructuralReport(
  rawText: string,
  options: ReportOptions = {}
): Promise<UnifiedReport> {
  
  const startTime = Date.now();
  const engines: string[] = [];
  
  try {
    // STEP 1: Normalize input
    console.log('[1/8] Normalizing input...');
    engines.push('input-normalizer');
    const normalized = normalizeInput(rawText, 'TEXT');
    validateNormalizedInput(normalized);
    
    // STEP 2: Detect format
    console.log('[2/8] Detecting format...');
    engines.push('format-detector');
    const formatDetection = detectFormat(normalized);
    validateFormatDetection(formatDetection);
    
    // STEP 3: Parse structurally
    console.log('[3/8] Parsing estimate (column-mapped)...');
    engines.push('structural-parser');
    const structuredEstimate = parseStructuredEstimate(normalized, formatDetection);
    validateStructuredEstimate(structuredEstimate);
    
    // STEP 4: Calculate exposure (deterministic)
    console.log('[4/8] Calculating financial exposure...');
    engines.push('exposure-engine');
    const exposureAnalysis = calculateStructuralExposure(structuredEstimate);
    
    // STEP 5: Calculate completeness (deterministic)
    console.log('[5/8] Scoring trade completeness...');
    engines.push('completeness-engine');
    const completenessAnalysis = calculateStructuralCompleteness(structuredEstimate);
    
    // STEP 6: Calculate loss expectation (deterministic)
    console.log('[6/8] Analyzing loss expectation...');
    engines.push('loss-expectation-engine');
    const lossExpectation = calculateLossExpectation(structuredEstimate);
    
    // STEP 7: Analyze code upgrades (deterministic)
    console.log('[7/8] Checking code requirements...');
    engines.push('code-upgrade-engine');
    const codeAnalysis = analyzeCodeUpgrades(structuredEstimate);
    
    // STEP 8: AI overlay (optional, non-blocking)
    let aiInsights: AIOverlayResult | undefined = undefined;
    
    if (options.includeAI && options.openaiApiKey) {
      console.log('[8/8] Generating AI overlay...');
      engines.push('ai-overlay');
      
      try {
        aiInsights = await generateAIOverlay(structuredEstimate, options.openaiApiKey);
      } catch (aiError: any) {
        console.error('[AI] Overlay failed:', aiError.message);
        // Continue without AI
      }
    } else {
      console.log('[8/8] Skipping AI overlay (not requested)');
    }
    
    // Compile findings
    const missingCriticalTrades = lossExpectation.missingCriticalTrades.map(
      trade => `${trade.tradeName} (${Math.round(trade.probability * 100)}% expected)`
    );
    
    const scopeGaps = exposureAnalysis.exposures.map(
      item => `${item.missingTradeName}: ${item.reason} (${item.quantity} ${item.unit})`
    );
    
    const integrityIssues = completenessAnalysis.tradeScores
      .filter(ts => ts.issues.length > 0)
      .flatMap(ts => ts.issues.map(issue => `${ts.tradeName}: ${issue.description}`));
    
    // Build final report
    const processingTimeMs = Date.now() - startTime;
    
    const report: UnifiedReport = {
      classification: {
        estimateType: formatDetection.format,
        lossType: lossExpectation.lossType,
        severityLevel: lossExpectation.severityLevel,
        confidence: formatDetection.confidence.toFixed(2)
      },
      
      structuralIntegrityScore: completenessAnalysis.structuralIntegrityScore,
      
      totalExposureMin: exposureAnalysis.totalExposureMin,
      totalExposureMax: exposureAnalysis.totalExposureMax,
      
      tradeScores: completenessAnalysis,
      
      codeRisks: codeAnalysis,
      
      findings: {
        parsedLineItems: structuredEstimate.lineItems.length,
        totalRCV: structuredEstimate.totals.rcv,
        totalACV: structuredEstimate.totals.acv,
        parseConfidence: structuredEstimate.parseConfidence,
        missingCriticalTrades,
        scopeGaps,
        integrityIssues
      },
      
      aiInsights,
      
      metadata: {
        processingTimeMs,
        timestamp: new Date().toISOString(),
        version: '2.0.0-structural',
        engines
      }
    };
    
    console.log(`[COMPLETE] Report generated in ${processingTimeMs}ms`);
    
    // Enforce max processing time
    if (options.maxProcessingTime && processingTimeMs > options.maxProcessingTime) {
      console.warn(`[WARN] Processing time ${processingTimeMs}ms exceeded limit ${options.maxProcessingTime}ms`);
    }
    
    return report;
    
  } catch (error: any) {
    console.error('[ERROR] Report generation failed:', error.message);
    throw new Error(`Structural report generation failed: ${error.message}`);
  }
}

/**
 * Format report as text
 */
export function formatReportAsText(report: UnifiedReport): string {
  let output = '';
  
  output += '='.repeat(80) + '\n';
  output += 'STRUCTURAL ESTIMATE ANALYSIS REPORT\n';
  output += '='.repeat(80) + '\n\n';
  
  // Classification
  output += 'CLASSIFICATION\n';
  output += '-'.repeat(80) + '\n';
  output += `Format: ${report.classification.estimateType}\n`;
  output += `Loss Type: ${report.classification.lossType}\n`;
  output += `Severity: ${report.classification.severityLevel}\n`;
  output += `Confidence: ${(parseFloat(report.classification.confidence) * 100).toFixed(1)}%\n\n`;
  
  // Structural Integrity
  output += 'STRUCTURAL INTEGRITY\n';
  output += '-'.repeat(80) + '\n';
  output += `Score: ${report.structuralIntegrityScore}/100\n`;
  output += `${report.tradeScores.summary}\n\n`;
  
  // Financial Exposure
  output += 'FINANCIAL EXPOSURE\n';
  output += '-'.repeat(80) + '\n';
  output += `Range: $${report.totalExposureMin.toLocaleString()} - $${report.totalExposureMax.toLocaleString()}\n\n`;
  
  if (report.findings.scopeGaps.length > 0) {
    output += 'Scope Gaps:\n';
    for (const gap of report.findings.scopeGaps) {
      output += `  • ${gap}\n`;
    }
    output += '\n';
  }
  
  // Code Risks
  if (report.codeRisks.codeRisks.length > 0) {
    output += 'CODE COMPLIANCE\n';
    output += '-'.repeat(80) + '\n';
    for (const risk of report.codeRisks.codeRisks) {
      output += `  • ${risk.itemName} [${risk.severity}]\n`;
      output += `    ${risk.reason}\n`;
      output += `    ${risk.calculation}\n`;
    }
    output += '\n';
  }
  
  // Trade Scores
  if (report.tradeScores.tradeScores.length > 0) {
    output += 'TRADE COMPLETENESS\n';
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
    output += 'AI OBSERVATIONS\n';
    output += '-'.repeat(80) + '\n';
    output += `${report.aiInsights.observations.neutralSummary}\n\n`;
  }
  
  // Metadata
  output += 'METADATA\n';
  output += '-'.repeat(80) + '\n';
  output += `Processing Time: ${report.metadata.processingTimeMs}ms\n`;
  output += `Parse Confidence: ${(report.findings.parseConfidence * 100).toFixed(1)}%\n`;
  output += `Engines: ${report.metadata.engines.join(', ')}\n`;
  
  output += '\n' + '='.repeat(80) + '\n';
  
  return output;
}
