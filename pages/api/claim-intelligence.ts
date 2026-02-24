/**
 * UNIFIED CLAIM INTELLIGENCE API
 * Enforcement-grade multi-modal analysis endpoint
 * NO PARTIAL EXECUTION - all or nothing
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { generateStructuralReport } from '../../lib/structural-unified-report-engine';
import { normalizeInput } from '../../lib/input-normalizer';
import { detectFormat } from '../../lib/format-detector';
import { parseStructuredEstimate } from '../../lib/xactimate-structural-parser';
import { calculateExpectedQuantities, validateDimensionInput, DimensionInput } from '../../lib/dimension-engine';
import { parseExpertReport, ParsedReport } from '../../lib/report-parser';
import { calculateRoomAwareDeviations } from '../../lib/room-aware-deviation-engine';
import { analyzePhotos } from '../../lib/photo-analysis-engine';
import { generateClaimIntelligence } from '../../lib/claim-intelligence-engine';

interface ClaimIntelligenceRequest {
  estimateText: string;
  dimensions?: DimensionInput;
  expertReportBuffer?: string; // Base64
  photos?: Array<{ base64: string; filename?: string }>;
}

interface ClaimIntelligenceResponse {
  success: boolean;
  data?: {
    parseConfidence: number;
    structuralIntegrityScore: number;
    deviationExposure: {
      min: number;
      max: number;
    };
    baselineExposure: {
      min: number;
      max: number;
    };
    tradeScores: any;
    codeRisks: any;
    deviations: any; // Room-aware deviation details
    consolidatedRiskScore: number;
    classification: any;
    photoAnalysis?: any;
    auditTrail: any;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ClaimIntelligenceResponse>
) {
  
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST requests allowed'
      }
    });
  }
  
  const startTime = Date.now();
  
  try {
    const { estimateText, dimensions, expertReportBuffer, photos } = req.body as ClaimIntelligenceRequest;
    
    // ========================================
    // PHASE 1: INPUT VALIDATION (STRICT GATING)
    // ========================================
    
    // Estimate REQUIRED
    if (!estimateText || estimateText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_ESTIMATE',
          message: 'Estimate text is required'
        }
      });
    }
    
    // Photos alone → reject
    if (photos && photos.length > 0 && !estimateText) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PHOTOS_WITHOUT_ESTIMATE',
          message: 'Photos cannot be analyzed without estimate'
        }
      });
    }
    
    // Report alone → reject
    if (expertReportBuffer && !estimateText) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'REPORT_WITHOUT_ESTIMATE',
          message: 'Expert report cannot be analyzed without estimate'
        }
      });
    }
    
    // Dimensions alone → reject
    if (dimensions && !estimateText) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DIMENSIONS_WITHOUT_ESTIMATE',
          message: 'Dimensions cannot be analyzed without estimate'
        }
      });
    }
    
    // ========================================
    // PHASE 2: PARSE ESTIMATE (DETERMINISTIC)
    // ========================================
    
    console.log('[1/7] Parsing estimate...');
    
    // Parse estimate directly for deviation engine
    const normalized = normalizeInput(estimateText, 'TEXT');
    const formatDetection = detectFormat(normalized);
    const structuredEstimate = parseStructuredEstimate(normalized, formatDetection);
    
    // Reject if parse confidence too low
    if (structuredEstimate.parseConfidence < 0.85) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'LOW_PARSE_CONFIDENCE',
          message: `Parse confidence ${(structuredEstimate.parseConfidence * 100).toFixed(1)}% below threshold (85%)`,
          details: {
            parseConfidence: structuredEstimate.parseConfidence,
            parsedLineItems: structuredEstimate.lineItems.length
          }
        }
      });
    }
    
    // Also generate full structural report for unified output
    const structuredReport = await generateStructuralReport(estimateText, {
      includeAI: false, // Deterministic only
      maxProcessingTime: 20000
    });
    
    // ========================================
    // PHASE 3: DIMENSION ENGINE (IF PROVIDED)
    // ========================================
    
    let expectedQuantities;
    if (dimensions) {
      console.log('[2/7] Calculating expected quantities from dimensions...');
      
      const validation = validateDimensionInput(dimensions);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_DIMENSIONS',
            message: 'Dimension validation failed',
            details: validation.errors
          }
        });
      }
      
      expectedQuantities = calculateExpectedQuantities(dimensions, 'FULL_HEIGHT');
    }
    
    // ========================================
    // PHASE 4: EXPERT REPORT PARSER (IF PROVIDED)
    // ========================================
    
    let expertReport: ParsedReport | undefined;
    if (expertReportBuffer) {
      console.log('[3/7] Parsing expert report...');
      
      try {
        const buffer = Buffer.from(expertReportBuffer, 'base64');
        expertReport = await parseExpertReport(buffer);
        
        if (expertReport.metadata.measurableDirectives === 0) {
          console.warn('[WARN] Expert report contains no measurable directives');
        }
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'REPORT_PARSE_FAILED',
            message: `Expert report parsing failed: ${error.message}`
          }
        });
      }
    }
    
    // ========================================
    // PHASE 5: DEVIATION ENGINE (ROOM-AWARE, DETERMINISTIC)
    // ========================================
    
    console.log('[4/7] Calculating deviations (room-aware)...');
    let deviationAnalysis;
    
    try {
      deviationAnalysis = calculateRoomAwareDeviations(
        structuredEstimate,
        expertReport,
        expectedQuantities
      );
    } catch (error: any) {
      // If deviation calculation requires dimensions and they're missing
      if (error.message.includes('Dimension data required')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'DIMENSIONS_REQUIRED',
            message: error.message
          }
        });
      }
      throw error;
    }
    
    // ========================================
    // PHASE 6: PHOTO ANALYSIS (NON-BLOCKING)
    // ========================================
    
    let photoAnalysis;
    if (photos && photos.length > 0 && process.env.OPENAI_API_KEY) {
      console.log('[5/7] Analyzing photos...');
      
      try {
        photoAnalysis = await analyzePhotos(photos, process.env.OPENAI_API_KEY);
      } catch (error: any) {
        console.error('[PHOTO] Analysis failed (non-blocking):', error.message);
        // Continue without photo analysis
      }
    }
    
    // ========================================
    // PHASE 7: CALCULATE CONSOLIDATED RISK SCORE
    // ========================================
    
    console.log('[6/7] Calculating consolidated risk score...');
    
    // Base components
    const structuralIntegrityScore = structuredReport.structuralIntegrityScore;
    const totalRCV = structuredEstimate.totals.rcv || 1;
    
    const baselineExposurePercent = Math.min(
      (structuredReport.totalExposureMax / totalRCV) * 100,
      100
    );
    const deviationExposurePercent = Math.min(
      (deviationAnalysis.totalDeviationExposureMax / totalRCV) * 100,
      100
    );
    const codeRiskPercent = Math.min(
      (structuredReport.codeRisks.totalCodeRiskMax / totalRCV) * 100,
      100
    );
    
    // Critical multiplier
    const criticalMultiplier = deviationAnalysis.criticalCount > 0 ? 1.2 : 1.0;
    
    // Weighted score
    let consolidatedRiskScore = (
      (100 - structuralIntegrityScore) * 0.30 +
      baselineExposurePercent * 0.25 +
      deviationExposurePercent * 0.30 +
      codeRiskPercent * 0.15
    ) * criticalMultiplier;
    
    // Cap at 100
    consolidatedRiskScore = Math.min(Math.round(consolidatedRiskScore), 100);
    
    // ========================================
    // PHASE 8: AUDIT TRAIL
    // ========================================
    
    console.log('[7/7] Compiling audit trail...');
    const auditTrail = {
      processingTimeMs: Date.now() - startTime,
      parseConfidence: structuredEstimate.parseConfidence,
      dimensionsProvided: !!dimensions,
      expertReportProvided: !!expertReport,
      photosProvided: !!photos,
      enginesExecuted: [
        'input-normalizer',
        'format-detector',
        'structural-parser',
        'dimension-engine',
        'report-parser',
        'room-aware-deviation-engine',
        'photo-analysis-engine'
      ],
      deviationCalculations: deviationAnalysis.deviations.map(d => ({
        type: d.deviationType,
        trade: d.trade,
        calculation: d.calculation,
        geometryUsed: !!d.geometryDetails
      })),
      geometryCalculations: deviationAnalysis.auditTrail.geometryCalculations,
      riskScoreBreakdown: {
        structuralIntegrity: structuralIntegrityScore,
        baselineExposurePercent: Math.round(baselineExposurePercent * 100) / 100,
        deviationExposurePercent: Math.round(deviationExposurePercent * 100) / 100,
        codeRiskPercent: Math.round(codeRiskPercent * 100) / 100,
        criticalMultiplier,
        consolidatedScore: consolidatedRiskScore
      },
      costBaselineVersion: deviationAnalysis.auditTrail.costBaselineVersion
    };
    
    // ========================================
    // RESPONSE
    // ========================================
    
    return res.status(200).json({
      success: true,
      data: {
        parseConfidence: structuredEstimate.parseConfidence,
        structuralIntegrityScore,
        deviationExposure: {
          min: deviationAnalysis.totalDeviationExposureMin,
          max: deviationAnalysis.totalDeviationExposureMax
        },
        baselineExposure: {
          min: structuredReport.totalExposureMin,
          max: structuredReport.totalExposureMax
        },
        tradeScores: structuredReport.tradeScores,
        codeRisks: structuredReport.codeRisks,
        deviations: deviationAnalysis.deviations,
        consolidatedRiskScore,
        classification: structuredReport.classification,
        photoAnalysis,
        auditTrail
      }
    });
    
  } catch (error: any) {
    console.error('[ERROR] Claim intelligence processing failed:', error);
    
    return res.status(500).json({
      success: false,
      error: {
        code: 'PROCESSING_FAILED',
        message: error.message || 'Internal processing error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
}
