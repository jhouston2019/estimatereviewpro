/**
 * UNIFIED CLAIM INTELLIGENCE API
 * Enforcement-grade multi-modal analysis endpoint
 * NO PARTIAL EXECUTION - all or nothing
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { generateStructuralReport } from '../../lib/structural-unified-report-engine';
import { calculateExpectedQuantities, validateDimensionInput, DimensionInput } from '../../lib/dimension-engine';
import { parseExpertReport, ParsedReport } from '../../lib/report-parser';
import { calculateDeviations } from '../../lib/deviation-engine';
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
    dimensionVariances: any;
    reportDeviations: any;
    photoFlags: any;
    consolidatedRiskScore: number;
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
    const structuredReport = await generateStructuralReport(estimateText, {
      includeAI: false, // Deterministic only
      maxProcessingTime: 20000
    });
    
    // Reject if parse confidence too low
    if (structuredReport.findings.parseConfidence < 0.85) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'LOW_PARSE_CONFIDENCE',
          message: `Parse confidence ${(structuredReport.findings.parseConfidence * 100).toFixed(1)}% below threshold (85%)`,
          details: {
            parseConfidence: structuredReport.findings.parseConfidence,
            parsedLineItems: structuredReport.findings.parsedLineItems
          }
        }
      });
    }
    
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
    // PHASE 5: DEVIATION ENGINE (DETERMINISTIC)
    // ========================================
    
    console.log('[4/7] Calculating deviations...');
    let deviationAnalysis;
    
    try {
      deviationAnalysis = calculateDeviations(
        structuredReport.estimate,
        expertReport,
        expectedQuantities
      );
    } catch (error: any) {
      // If deviation calculation requires dimensions and they're missing
      if (error.message.includes('dimension data')) {
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
    // PHASE 7: UNIFIED CLAIM INTELLIGENCE
    // ========================================
    
    console.log('[6/7] Generating unified claim intelligence...');
    const claimIntelligence = generateClaimIntelligence({
      estimate: structuredReport.estimate,
      exposureAnalysis: structuredReport.exposureRange.breakdown,
      completenessAnalysis: structuredReport.tradeScores,
      lossExpectation: structuredReport.lossExpectation,
      codeAnalysis: structuredReport.codeRisks,
      deviationAnalysis,
      dimensions: expectedQuantities,
      expertReport,
      photoAnalysis
    });
    
    // ========================================
    // PHASE 8: AUDIT TRAIL
    // ========================================
    
    console.log('[7/7] Compiling audit trail...');
    const auditTrail = {
      processingTimeMs: Date.now() - startTime,
      parseConfidence: structuredReport.findings.parseConfidence,
      dimensionsProvided: !!dimensions,
      expertReportProvided: !!expertReport,
      photosProvided: !!photos,
      enginesExecuted: claimIntelligence.metadata.enginesUsed,
      deviationCalculations: deviationAnalysis.deviations.map(d => ({
        type: d.deviationType,
        trade: d.trade,
        calculation: d.calculation
      })),
      riskScoreBreakdown: {
        structuralIntegrity: claimIntelligence.structuralIntegrityScore,
        baselineExposure: claimIntelligence.exposureRange,
        deviationExposure: claimIntelligence.deviationExposureRange,
        codeRisks: claimIntelligence.codeUpgradeFlags.codeRisks.length,
        consolidatedScore: claimIntelligence.consolidatedRiskScore
      }
    };
    
    // ========================================
    // RESPONSE
    // ========================================
    
    return res.status(200).json({
      success: true,
      data: {
        parseConfidence: structuredReport.findings.parseConfidence,
        structuralIntegrityScore: claimIntelligence.structuralIntegrityScore,
        deviationExposure: {
          min: claimIntelligence.deviationExposureRange.min,
          max: claimIntelligence.deviationExposureRange.max
        },
        baselineExposure: {
          min: claimIntelligence.exposureRange.min,
          max: claimIntelligence.exposureRange.max
        },
        tradeScores: claimIntelligence.tradeScores,
        codeRisks: claimIntelligence.codeUpgradeFlags,
        dimensionVariances: claimIntelligence.dimensionVariances,
        reportDeviations: claimIntelligence.reportDeviations,
        photoFlags: claimIntelligence.photoFlags,
        consolidatedRiskScore: claimIntelligence.consolidatedRiskScore,
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
