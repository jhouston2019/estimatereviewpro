/**
 * ENHANCED UNIFIED REPORT ENGINE
 * Integrates ALL analysis engines including new financial validation features
 * Produces comprehensive estimate intelligence report
 */

import { parseMultiFormat, ParsedEstimate, FormatDetection } from './multi-format-parser';
import { calculateExposure, ExposureAnalysis } from './exposure-engine';
import { calculateLossExpectation, LossExpectation } from './loss-expectation-engine';
import { calculateTradeCompleteness, CompletenessAnalysis } from './trade-completeness-engine';
import { analyzeCodeUpgrades, CodeUpgradeAnalysis } from './code-upgrade-engine';
import { validatePricing, PricingValidationResult } from './pricing-validation-engine';
import { validateDepreciation, DepreciationAnalysis } from './depreciation-validator';
import { validateLaborRates, LaborAnalysis } from './labor-rate-validator';
import { detectCarrierTactics, CarrierTacticsAnalysis } from './carrier-tactic-detector';
import { performMultiPhaseMatching, MatchingResult } from './matching-engine';

export interface EnhancedUnifiedReport {
  // Format detection
  formatDetection: FormatDetection;
  
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
  
  // Trade completeness
  tradeScores: CompletenessAnalysis;
  
  // Code upgrades
  codeUpgradeFlags: CodeUpgradeAnalysis;
  
  // NEW: Pricing validation
  pricingAnalysis: PricingValidationResult;
  
  // NEW: Depreciation validation
  depreciationAnalysis: DepreciationAnalysis;
  
  // NEW: Labor rate validation
  laborAnalysis: LaborAnalysis;
  
  // NEW: Carrier tactics detection
  carrierTactics: CarrierTacticsAnalysis;
  
  // Matching analysis (if comparing two estimates)
  matchingAnalysis?: MatchingResult;
  
  // Deterministic findings
  deterministicFindings: {
    parsedLineItems: number;
    totalRCV: number;
    totalACV: number;
    totalDepreciation: number;
    missingCriticalTrades: string[];
    scopeGaps: string[];
    integrityIssues: string[];
  };
  
  // Overall scores
  overallScores: {
    structuralIntegrity: number; // 0-100
    pricingAccuracy: number; // 0-100
    depreciationFairness: number; // 0-100
    laborFairness: number; // 0-100
    carrierTacticSeverity: number; // 0-100 (higher = more tactics)
    overallScore: number; // 0-100 (weighted average)
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
    region?: string;
  };
}

export interface EnhancedAnalysisOptions {
  includeAI?: boolean;
  aiTimeout?: number;
  maxProcessingTime?: number;
  region?: string; // Required for pricing and labor validation
  comparisonEstimate?: ParsedEstimate; // Optional: for matching analysis
  openaiApiKey?: string;
}

/**
 * Generate enhanced unified report from estimate text
 */
export async function generateEnhancedUnifiedReport(
  estimateText: string,
  options: EnhancedAnalysisOptions = {}
): Promise<EnhancedUnifiedReport> {
  const startTime = Date.now();
  const engines: string[] = [];
  
  try {
    console.log('[ENHANCED-REPORT] Starting comprehensive analysis...');
    
    // PHASE 1: Multi-format parsing (deterministic)
    console.log('[1/12] Parsing estimate (multi-format)...');
    engines.push('multi-format-parser');
    const parsedEstimate = await parseMultiFormat(estimateText);
    
    if (parsedEstimate.metadata.confidence === 'FAILED') {
      throw new Error('Estimate parsing failed - format not recognized');
    }
    
    // PHASE 2: Calculate exposure (deterministic)
    console.log('[2/12] Calculating financial exposure...');
    engines.push('exposure-engine');
    const exposureAnalysis = calculateExposure(parsedEstimate);
    
    // PHASE 3: Calculate loss expectation (deterministic)
    console.log('[3/12] Analyzing loss expectation...');
    engines.push('loss-expectation-engine');
    const lossExpectation = calculateLossExpectation(parsedEstimate);
    
    // PHASE 4: Calculate trade completeness (deterministic)
    console.log('[4/12] Scoring trade completeness...');
    engines.push('trade-completeness-engine');
    const completenessAnalysis = calculateTradeCompleteness(parsedEstimate);
    
    // PHASE 5: Analyze code upgrades (deterministic)
    console.log('[5/12] Checking code requirements...');
    engines.push('code-upgrade-engine');
    const codeAnalysis = analyzeCodeUpgrades(parsedEstimate);
    
    // PHASE 6: Validate pricing (deterministic, requires region)
    console.log('[6/12] Validating pricing against market data...');
    engines.push('pricing-validation-engine');
    const region = options.region || 'DEFAULT';
    const pricingAnalysis = await validatePricing(
      parsedEstimate.lineItems.map((item: any, index: number) => ({
        lineNumber: item.lineNumber ?? index + 1,
        tradeCode: item.tradeCode ?? '',
        description: item.description ?? '',
        quantity: item.quantity ?? 0,
        unit: item.unit ?? '',
        unitPrice: (item.quantity ?? 0) > 0 ? (item.rcv ?? 0) / (item.quantity ?? 1) : 0,
        total: item.rcv ?? 0,
      })),
      region
    );
    
    // PHASE 7: Validate depreciation (deterministic)
    console.log('[7/12] Validating depreciation...');
    engines.push('depreciation-validator');
    const depreciationAnalysis = validateDepreciation(
      parsedEstimate.lineItems.map((item: any, index: number) => ({
        lineNumber: item.lineNumber ?? index + 1,
        description: item.description ?? '',
        rcv: item.rcv ?? 0,
        acv: item.acv ?? 0,
        quantity: item.quantity ?? 0,
        unit: item.unit ?? '',
      }))
    );
    
    // PHASE 8: Validate labor rates (deterministic, requires region)
    console.log('[8/12] Validating labor rates...');
    engines.push('labor-rate-validator');
    const laborAnalysis = await validateLaborRates(
      parsedEstimate.lineItems.map((item: any, index: number) => ({
        lineNumber: item.lineNumber ?? index + 1,
        description: item.description ?? '',
        quantity: item.quantity ?? 0,
        unit: item.unit ?? '',
        unitPrice: (item.quantity ?? 0) > 0 ? (item.rcv ?? 0) / (item.quantity ?? 1) : 0,
        total: item.rcv ?? 0,
      })),
      region
    );
    
    // PHASE 9: Detect carrier tactics (deterministic)
    console.log('[9/12] Detecting carrier tactics...');
    engines.push('carrier-tactic-detector');
    const carrierTactics = detectCarrierTactics({
      lineItems: parsedEstimate.lineItems.map((item: any, index: number) => ({
        lineNumber: item.lineNumber ?? index + 1,
        tradeCode: item.tradeCode ?? '',
        description: item.description ?? '',
        quantity: item.quantity ?? 0,
        unit: item.unit ?? '',
        rcv: item.rcv ?? 0,
        acv: item.acv ?? 0,
        depreciation: item.depreciation ?? 0,
        actionType: item.actionType,
      })),
      codeUpgradeFlags: (codeAnalysis.codeUpgradeRisks || []).map((item: any) => ({
        code: item.itemType,
        missing: true,
      })),
      pricingAnalysis,
      depreciationAnalysis,
      laborAnalysis,
    });
    
    // PHASE 10: Matching analysis (optional, if comparing two estimates)
    let matchingAnalysis: MatchingResult | undefined;
    if (options.comparisonEstimate) {
      console.log('[10/12] Performing multi-phase matching...');
      engines.push('matching-engine');
      
      // Normalize line items to ensure lineNumber is always present
      const normalizedSourceItems = parsedEstimate.lineItems.map((item: any, index: number) => ({
        ...item,
        lineNumber: item.lineNumber ?? index + 1,
      }));
      
      const normalizedTargetItems = options.comparisonEstimate.lineItems.map((item: any, index: number) => ({
        ...item,
        lineNumber: item.lineNumber ?? index + 1,
      }));
      
      matchingAnalysis = await performMultiPhaseMatching(
        normalizedSourceItems,
        normalizedTargetItems,
        {
          includeAI: options.includeAI,
          openaiApiKey: options.openaiApiKey,
        }
      );
    } else {
      console.log('[10/12] Skipping matching (no comparison estimate)...');
    }
    
    // PHASE 11: Calculate overall scores
    console.log('[11/12] Calculating overall scores...');
    const overallScores = calculateOverallScores({
      completenessAnalysis,
      pricingAnalysis,
      depreciationAnalysis,
      laborAnalysis,
      carrierTactics,
    });
    
    // PHASE 12: AI insights (optional, non-blocking)
    let aiInsights: EnhancedUnifiedReport['aiInsights'] = undefined;
    
    if (options.includeAI !== false && options.openaiApiKey) {
      console.log('[12/12] Generating AI insights...');
      engines.push('ai-insights');
      
      try {
        aiInsights = await generateAIInsights({
          parsedEstimate,
          lossExpectation,
          completenessAnalysis,
          codeAnalysis,
          pricingAnalysis,
          depreciationAnalysis,
          laborAnalysis,
          carrierTactics,
        }, options.openaiApiKey, options.aiTimeout || 30000);
      } catch (error) {
        console.error('[ENHANCED-REPORT] AI insights failed (non-blocking):', error);
        aiInsights = {
          summary: 'AI insights unavailable',
          additionalObservations: [],
          limitations: 'AI analysis failed or timed out',
          status: 'FALLBACK',
        };
      }
    } else {
      console.log('[12/12] Skipping AI insights...');
      aiInsights = {
        summary: 'AI insights not requested',
        additionalObservations: [],
        limitations: 'AI analysis was not enabled for this report',
        status: 'SKIPPED',
      };
    }
    
    // Compile deterministic findings
    const deterministicFindings = {
      parsedLineItems: parsedEstimate.lineItems.length,
      totalRCV: parsedEstimate.totals.rcv,
      totalACV: parsedEstimate.totals.acv,
      totalDepreciation: parsedEstimate.totals.depreciation,
      missingCriticalTrades: lossExpectation.missingCriticalTrades.map(t => t.trade),
      scopeGaps: completenessAnalysis.issues
        .filter(i => i.severity === 'CRITICAL')
        .map(i => i.description),
      integrityIssues: [
        ...depreciationAnalysis.improperDepreciation.map(i => i.issue),
        ...carrierTactics.tacticsDetected
          .filter(t => t.severity === 'CRITICAL')
          .map(t => t.tactic),
      ],
    };
    
    const processingTime = Date.now() - startTime;
    
    console.log(`[ENHANCED-REPORT] Complete in ${processingTime}ms`);
    console.log(`[ENHANCED-REPORT] Engines used: ${engines.join(', ')}`);
    console.log(`[ENHANCED-REPORT] Overall score: ${overallScores.overallScore}/100`);
    
    return {
      formatDetection: {
        format: parsedEstimate.metadata.detectedFormat as any,
        confidence: parsedEstimate.metadata.validationScore / 100,
        indicators: [],
        metadata: {
          hasTradeCode: true,
          hasUnits: true,
          hasQuantities: true,
          hasPricing: true,
          hasTableStructure: false,
          lineCount: parsedEstimate.metadata.lineCount,
        },
      },
      classification: {
        estimateType: parsedEstimate.metadata.detectedFormat,
        lossType: lossExpectation.detectedLossType,
        severityLevel: lossExpectation.severityLevel,
        confidence: parsedEstimate.metadata.confidence,
      },
      structuralIntegrityScore: completenessAnalysis.overallScore,
      financialExposureRange: {
        min: exposureAnalysis.totalExposure.min,
        max: exposureAnalysis.totalExposure.max,
        riskScore: exposureAnalysis.riskScore,
      },
      tradeScores: completenessAnalysis,
      codeUpgradeFlags: codeAnalysis,
      pricingAnalysis,
      depreciationAnalysis,
      laborAnalysis,
      carrierTactics,
      matchingAnalysis,
      deterministicFindings,
      overallScores,
      aiInsights,
      metadata: {
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString(),
        version: '2.0-enhanced',
        engines,
        region,
      },
    };
    
  } catch (error) {
    console.error('[ENHANCED-REPORT] Fatal error:', error);
    throw error;
  }
}

/**
 * Calculate overall scores from all analyses
 */
function calculateOverallScores(data: {
  completenessAnalysis: CompletenessAnalysis;
  pricingAnalysis: PricingValidationResult;
  depreciationAnalysis: DepreciationAnalysis;
  laborAnalysis: LaborAnalysis;
  carrierTactics: CarrierTacticsAnalysis;
}): EnhancedUnifiedReport['overallScores'] {
  
  const structuralIntegrity = data.completenessAnalysis.overallScore;
  const pricingAccuracy = 100 - Math.min(100, Math.abs(data.pricingAnalysis.variancePercentage));
  const depreciationFairness = data.depreciationAnalysis.depreciationScore;
  const laborFairness = data.laborAnalysis.laborScore;
  const carrierTacticSeverity = data.carrierTactics.severityScore;
  
  // Weighted average (structural integrity and carrier tactics weighted higher)
  const overallScore = Math.round(
    (structuralIntegrity * 0.25) +
    (pricingAccuracy * 0.20) +
    (depreciationFairness * 0.20) +
    (laborFairness * 0.20) +
    ((100 - carrierTacticSeverity) * 0.15) // Invert carrier tactics (lower is better)
  );
  
  return {
    structuralIntegrity,
    pricingAccuracy,
    depreciationFairness,
    laborFairness,
    carrierTacticSeverity,
    overallScore,
  };
}

/**
 * Generate AI insights (optional, non-blocking)
 */
async function generateAIInsights(
  data: any,
  apiKey: string,
  timeout: number
): Promise<EnhancedUnifiedReport['aiInsights']> {
  
  const prompt = `You are an expert insurance estimate analyst. Review this estimate analysis and provide insights.

Estimate Summary:
- Line items: ${data.parsedEstimate.lineItems.length}
- Total RCV: $${data.parsedEstimate.totals.rcv.toFixed(2)}
- Total ACV: $${data.parsedEstimate.totals.acv.toFixed(2)}
- Loss type: ${data.lossExpectation.detectedLossType}
- Severity: ${data.lossExpectation.severityLevel}

Key Findings:
- Structural integrity: ${data.completenessAnalysis.overallScore}/100
- Pricing variance: ${data.pricingAnalysis.variancePercentage.toFixed(1)}%
- Depreciation score: ${data.depreciationAnalysis.depreciationScore}/100
- Labor score: ${data.laborAnalysis.laborScore}/100
- Carrier tactics detected: ${data.carrierTactics.tacticsDetected.length}

Provide:
1. Brief summary (2-3 sentences)
2. 3-5 key observations
3. Limitations statement

Return JSON:
{
  "summary": "...",
  "observations": ["...", "...", "..."],
  "limitations": "..."
}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are an insurance estimate analyst. Return only valid JSON. Be neutral and factual.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.0,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }
    
    const result = await response.json();
    const content = JSON.parse(result.choices[0].message.content);
    
    return {
      summary: content.summary,
      additionalObservations: content.observations || [],
      limitations: content.limitations,
      status: 'SUCCESS',
    };
    
  } catch (error) {
    console.error('[AI-INSIGHTS] Failed:', error);
    
    return {
      summary: 'AI analysis unavailable',
      additionalObservations: [],
      limitations: 'AI analysis failed or timed out. All deterministic findings remain valid.',
      status: 'FALLBACK',
    };
  }
}

/**
 * Format enhanced report as text
 */
export function formatEnhancedReport(report: EnhancedUnifiedReport): string {
  let output = `COMPREHENSIVE ESTIMATE ANALYSIS REPORT\n`;
  output += `${'='.repeat(80)}\n\n`;
  
  // Header
  output += `Generated: ${report.metadata.timestamp}\n`;
  output += `Version: ${report.metadata.version}\n`;
  output += `Processing Time: ${report.metadata.processingTimeMs}ms\n`;
  output += `Region: ${report.metadata.region || 'DEFAULT'}\n\n`;
  
  // Format Detection
  output += `FORMAT DETECTION\n`;
  output += `${'-'.repeat(80)}\n`;
  output += `Format: ${report.formatDetection.format}\n`;
  output += `Confidence: ${(report.formatDetection.confidence * 100).toFixed(1)}%\n`;
  output += `Line Items Parsed: ${report.deterministicFindings.parsedLineItems}\n\n`;
  
  // Overall Scores
  output += `OVERALL SCORES\n`;
  output += `${'-'.repeat(80)}\n`;
  output += `Overall Score: ${report.overallScores.overallScore}/100\n`;
  output += `  - Structural Integrity: ${report.overallScores.structuralIntegrity}/100\n`;
  output += `  - Pricing Accuracy: ${report.overallScores.pricingAccuracy.toFixed(1)}/100\n`;
  output += `  - Depreciation Fairness: ${report.overallScores.depreciationFairness}/100\n`;
  output += `  - Labor Fairness: ${report.overallScores.laborFairness}/100\n`;
  output += `  - Carrier Tactic Severity: ${report.overallScores.carrierTacticSeverity}/100\n\n`;
  
  // Financial Summary
  output += `FINANCIAL SUMMARY\n`;
  output += `${'-'.repeat(80)}\n`;
  output += `Total RCV: $${report.deterministicFindings.totalRCV.toFixed(2)}\n`;
  output += `Total ACV: $${report.deterministicFindings.totalACV.toFixed(2)}\n`;
  output += `Total Depreciation: $${report.deterministicFindings.totalDepreciation.toFixed(2)}\n`;
  output += `Pricing Variance: ${report.pricingAnalysis.variancePercentage.toFixed(1)}%\n`;
  output += `Financial Exposure: $${report.financialExposureRange.min.toFixed(2)} - $${report.financialExposureRange.max.toFixed(2)}\n\n`;
  
  // Critical Issues
  if (report.deterministicFindings.integrityIssues.length > 0) {
    output += `CRITICAL ISSUES (${report.deterministicFindings.integrityIssues.length})\n`;
    output += `${'-'.repeat(80)}\n`;
    for (const issue of report.deterministicFindings.integrityIssues) {
      output += `  - ${issue}\n`;
    }
    output += `\n`;
  }
  
  // Carrier Tactics
  if (report.carrierTactics.tacticsDetected.length > 0) {
    output += `CARRIER TACTICS DETECTED (${report.carrierTactics.tacticsDetected.length})\n`;
    output += `${'-'.repeat(80)}\n`;
    output += `Total Impact: $${report.carrierTactics.totalImpact.toFixed(2)}\n\n`;
    for (const tactic of report.carrierTactics.tacticsDetected) {
      output += `${tactic.severity} - ${tactic.tactic}\n`;
      output += `  Impact: $${tactic.estimatedImpact.toFixed(2)}\n`;
      output += `  Line Items: ${tactic.lineItemsAffected.length}\n\n`;
    }
  }
  
  // AI Insights
  if (report.aiInsights && report.aiInsights.status === 'SUCCESS') {
    output += `AI INSIGHTS\n`;
    output += `${'-'.repeat(80)}\n`;
    output += `${report.aiInsights.summary}\n\n`;
    if (report.aiInsights.additionalObservations.length > 0) {
      output += `Key Observations:\n`;
      for (const obs of report.aiInsights.additionalObservations) {
        output += `  - ${obs}\n`;
      }
      output += `\n`;
    }
  }
  
  // Metadata
  output += `ANALYSIS ENGINES USED\n`;
  output += `${'-'.repeat(80)}\n`;
  output += report.metadata.engines.join(', ') + `\n\n`;
  
  output += `${'='.repeat(80)}\n`;
  output += `END OF REPORT\n`;
  
  return output;
}

export type { EnhancedUnifiedReport, EnhancedAnalysisOptions };
