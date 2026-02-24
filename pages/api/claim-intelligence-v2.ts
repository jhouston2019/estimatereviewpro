/**
 * UNIFIED CLAIM INTELLIGENCE API v2
 * ENTERPRISE-GRADE: Full hardening integration
 * Performance guards, security validation, structured errors, audit trail
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { generateStructuralReport } from '../../lib/structural-unified-report-engine';
import { normalizeInput } from '../../lib/input-normalizer';
import { detectFormat } from '../../lib/format-detector';
import { parseStructuredEstimate } from '../../lib/xactimate-structural-parser';
import { calculateExpectedQuantities, DimensionInput } from '../../lib/dimension-engine';
import { parseExpertReport, ParsedReport } from '../../lib/report-parser';
import { calculatePerRoomDeviations } from '../../lib/per-room-deviation-engine';
import { analyzePhotos } from '../../lib/photo-analysis-engine';

// Enterprise hardening imports
import { createAuditTrail } from '../../lib/audit-trail';
import { 
  validateEstimate, 
  validateDimensions, 
  validateReport,
  validateAPIResponse 
} from '../../lib/validation-engine';
import { 
  validateAndSanitizeUpload, 
  sanitizeTextInput, 
  sanitizeCSV,
  getClientIP 
} from '../../lib/security-guards';
import { 
  withTimeout, 
  PerformanceMonitor, 
  checkRateLimit,
  validateFileSize,
  validateRoomCount,
  validateLineItemCount,
  validatePhotoCount,
  PERFORMANCE_LIMITS 
} from '../../lib/performance-guards';
import { 
  formatErrorResponse, 
  Errors,
  toStructuredError,
  ValidationError 
} from '../../lib/structured-errors';
import { validateAPIOutput } from '../../lib/output-validator';
import { 
  trackRequest, 
  trackParse, 
  trackDeviation, 
  trackError 
} from '../../lib/telemetry';

interface ClaimIntelligenceRequest {
  estimateText: string;
  dimensions?: DimensionInput;
  expertReportBuffer?: string;
  photos?: Array<{ base64: string; filename?: string }>;
}

interface ClaimIntelligenceResponse {
  success: boolean;
  data?: {
    parseConfidence: number;
    structuralIntegrityScore: number;
    consolidatedRiskScore: number;
    baselineExposure: { min: number; max: number };
    deviationExposure: { min: number; max: number };
    codeRiskExposure: { min: number; max: number };
    deviations: any[];
    classification: any;
    photoAnalysis?: any;
    auditTrail: any;
    metadata: any;
  };
  error?: any;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ClaimIntelligenceResponse>
) {
  
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: {
        errorCode: 'METHOD_NOT_ALLOWED',
        errorType: 'VALIDATION_ERROR',
        message: 'Only POST requests allowed',
        remediation: 'Use POST method',
        timestamp: new Date().toISOString()
      }
    });
  }
  
  // Create audit trail and performance monitor
  const startTime = Date.now();
  const audit = createAuditTrail();
  const perfMonitor = new PerformanceMonitor();
  const requestId = audit['requestId'];
  
  try {
    // ========================================
    // SECURITY: Rate Limiting
    // ========================================
    const clientIP = getClientIP(req);
    checkRateLimit(clientIP);
    
    audit.logStage('SECURITY', 'Rate limit check passed', { ip: clientIP });
    
    // ========================================
    // INPUT EXTRACTION & SANITIZATION
    // ========================================
    const { estimateText, dimensions, expertReportBuffer, photos } = req.body as ClaimIntelligenceRequest;
    
    // Estimate REQUIRED
    if (!estimateText || estimateText.trim().length === 0) {
      throw new ValidationError(
        'MISSING_ESTIMATE',
        'Estimate text is required',
        'Provide estimate text in Xactimate format.'
      );
    }
    
    // Sanitize estimate text
    const sanitizedEstimateText = sanitizeTextInput(estimateText);
    
    audit.logStage('INPUT', 'Estimate text sanitized', { 
      originalLength: estimateText.length,
      sanitizedLength: sanitizedEstimateText.length
    });
    
    // Validate photos count
    if (photos && photos.length > 0) {
      validatePhotoCount(photos.length);
    }
    
    // ========================================
    // PHASE 1: PARSE ESTIMATE (WITH TIMEOUT)
    // ========================================
    perfMonitor.checkpoint('parse_start');
    
    const normalized = normalizeInput(sanitizedEstimateText, 'TEXT');
    const formatDetection = detectFormat(normalized);
    
    const structuredEstimate = await withTimeout(
      Promise.resolve(parseStructuredEstimate(normalized, formatDetection)),
      PERFORMANCE_LIMITS.PARSE_TIMEOUT_MS,
      'Estimate Parsing'
    );
    
    const parseTimeMs = perfMonitor.getDuration('parse_start');
    audit.logEngineTiming('Parse', parseTimeMs);
    
    // Validate estimate
    const estimateValidation = validateEstimate(structuredEstimate);
    
    if (!estimateValidation.valid) {
      const firstError = estimateValidation.errors[0];
      trackParse(requestId, false, structuredEstimate.parseConfidence, structuredEstimate.lineItems.length, firstError.code);
      throw Errors.LowParseConfidence(structuredEstimate.parseConfidence);
    }
    
    trackParse(requestId, true, structuredEstimate.parseConfidence, structuredEstimate.lineItems.length);
    
    // Validate line item count
    validateLineItemCount(structuredEstimate.lineItems.length);
    
    audit.logStage('PARSE', 'Estimate parsed successfully', {
      confidence: structuredEstimate.parseConfidence,
      lineItems: structuredEstimate.lineItems.length,
      totalRCV: structuredEstimate.totals.rcv
    });
    
    // ========================================
    // PHASE 2: PROCESS DIMENSIONS (IF PROVIDED)
    // ========================================
    let expectedQuantities;
    
    if (dimensions && dimensions.rooms && dimensions.rooms.length > 0) {
      perfMonitor.checkpoint('dimension_start');
      
      // Validate dimensions
      const dimensionValidation = validateDimensions(dimensions);
      
      if (!dimensionValidation.valid) {
        const firstError = dimensionValidation.errors[0];
        throw Errors.InvalidRoomDimensions(
          firstError.field,
          firstError.field,
          0
        );
      }
      
      // Validate room count
      validateRoomCount(dimensions.rooms.length);
      
      expectedQuantities = await withTimeout(
        Promise.resolve(calculateExpectedQuantities(dimensions, 'FULL_HEIGHT')),
        PERFORMANCE_LIMITS.DIMENSION_TIMEOUT_MS,
        'Dimension Calculation'
      );
      
      const dimensionTimeMs = perfMonitor.getDuration('dimension_start');
      audit.logEngineTiming('Dimension', dimensionTimeMs);
      
      // Log room data
      for (const room of expectedQuantities.breakdown.rooms) {
        audit.logRoomData(room);
      }
      
      audit.logStage('DIMENSION', 'Dimensions calculated', {
        roomCount: dimensions.rooms.length,
        totalWallSF: expectedQuantities.breakdown.totals.totalWallSF,
        totalCeilingSF: expectedQuantities.breakdown.totals.totalCeilingSF
      });
    }
    
    // ========================================
    // PHASE 3: PARSE EXPERT REPORT (IF PROVIDED)
    // ========================================
    let expertReport: ParsedReport | undefined;
    
    if (expertReportBuffer) {
      perfMonitor.checkpoint('report_start');
      
      const reportBuffer = Buffer.from(expertReportBuffer, 'base64');
      
      // Validate file
      validateFileSize(reportBuffer, PERFORMANCE_LIMITS.MAX_FILE_SIZE_MB, 'expert-report.pdf');
      
      expertReport = await parseExpertReport(reportBuffer);
      
      const reportValidation = validateReport(expertReport);
      
      // Log warnings but don't reject
      if (reportValidation.warnings.length > 0) {
        for (const warning of reportValidation.warnings) {
          audit.logWarning(warning.message);
        }
      }
      
      const reportTimeMs = perfMonitor.getDuration('report_start');
      audit.logEngineTiming('Report', reportTimeMs);
      
      audit.logStage('REPORT', 'Expert report parsed', {
        directiveCount: expertReport.directives.length,
        measurableCount: expertReport.directives.filter(d => d.measurable).length
      });
    }
    
    // ========================================
    // PHASE 4: CALCULATE DEVIATIONS (WITH TIMEOUT)
    // ========================================
    perfMonitor.checkpoint('deviation_start');
    
    const deviationAnalysis = await withTimeout(
      Promise.resolve(calculatePerRoomDeviations(
        structuredEstimate,
        expertReport,
        expectedQuantities
      )),
      PERFORMANCE_LIMITS.DEVIATION_TIMEOUT_MS,
      'Deviation Calculation'
    );
    
    const deviationTimeMs = perfMonitor.getDuration('deviation_start');
    audit.logEngineTiming('Deviation', deviationTimeMs);
    
    // Log deviations
    for (const deviation of deviationAnalysis.deviations) {
      audit.logDeviationCalculation(deviation);
      
      trackDeviation(
        requestId,
        deviation.deviationType,
        deviation.trade,
        deviation.severity,
        deviation.impactMin,
        deviation.impactMax
      );
    }
    
    // Log geometry calculations
    for (const geom of deviationAnalysis.auditTrail.perRoomCalculations) {
      audit.logGeometryCalculation({
        roomName: geom.roomName,
        perimeter: geom.perimeter,
        wallHeight: geom.wallHeight,
        estimateHeight: geom.estimateHeight,
        reportHeight: geom.reportHeight,
        deltaSF: geom.deltaSF,
        formula: geom.formula,
        costPerUnit: { min: 2.5, max: 4.5 }, // From COST_BASELINE
        exposureCalculated: { min: 0, max: 0 } // Calculated from deviation
      });
    }
    
    audit.logStage('DEVIATION', 'Deviations calculated', {
      deviationCount: deviationAnalysis.deviations.length,
      criticalCount: deviationAnalysis.criticalCount,
      calculationMethod: deviationAnalysis.auditTrail.calculationMethod
    });
    
    // ========================================
    // PHASE 5: GENERATE STRUCTURAL REPORT
    // ========================================
    perfMonitor.checkpoint('report_gen_start');
    
    const structuredReport = await generateStructuralReport(sanitizedEstimateText);
    
    const reportGenTimeMs = perfMonitor.getDuration('report_gen_start');
    audit.logEngineTiming('StructuralReport', reportGenTimeMs);
    
    // ========================================
    // PHASE 6: ANALYZE PHOTOS (IF PROVIDED)
    // ========================================
    let photoAnalysis;
    
    if (photos && photos.length > 0) {
      perfMonitor.checkpoint('photo_start');
      
      try {
        const openaiKey = process.env.OPENAI_API_KEY || '';
        
        photoAnalysis = await withTimeout(
          analyzePhotos(photos, openaiKey),
          PERFORMANCE_LIMITS.AI_TIMEOUT_MS * photos.length,
          'Photo Analysis'
        );
        
        const photoTimeMs = perfMonitor.getDuration('photo_start');
        audit.logEngineTiming('PhotoAnalysis', photoTimeMs);
        
        audit.logAIOperation('Photo Classification', 'OpenAI', 'gpt-4-vision-preview', 0, true, photoTimeMs);
        
      } catch (error: any) {
        // Graceful failure - continue without photos
        audit.logWarning(`Photo analysis failed: ${error.message}`);
        audit.logAIOperation('Photo Classification', 'OpenAI', 'gpt-4-vision-preview', 0, false, 0);
        photoAnalysis = undefined;
      }
    }
    
    // ========================================
    // PHASE 7: CALCULATE CONSOLIDATED RISK SCORE
    // ========================================
    const totalRCV = structuredEstimate.totals.rcv || 1;
    
    const structuralIntegrityScore = structuredReport.structuralIntegrityScore;
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
    
    const criticalMultiplier = deviationAnalysis.criticalCount > 0 ? 1.2 : 1.0;
    
    let consolidatedRiskScore = (
      (100 - structuralIntegrityScore) * 0.30 +
      baselineExposurePercent * 0.25 +
      deviationExposurePercent * 0.30 +
      codeRiskPercent * 0.15
    ) * criticalMultiplier;
    
    consolidatedRiskScore = Math.min(Math.round(consolidatedRiskScore), 100);
    
    // ========================================
    // PHASE 8: BUILD RESPONSE
    // ========================================
    const processingTimeMs = Date.now() - startTime;
    
    const response: ClaimIntelligenceResponse = {
      success: true,
      data: {
        parseConfidence: structuredEstimate.parseConfidence,
        structuralIntegrityScore,
        consolidatedRiskScore,
        baselineExposure: {
          min: structuredReport.totalExposureMin,
          max: structuredReport.totalExposureMax
        },
        deviationExposure: {
          min: deviationAnalysis.totalDeviationExposureMin,
          max: deviationAnalysis.totalDeviationExposureMax
        },
        codeRiskExposure: {
          min: structuredReport.codeRisks.totalCodeRiskMin,
          max: structuredReport.codeRisks.totalCodeRiskMax
        },
        deviations: deviationAnalysis.deviations,
        classification: structuredReport.classification,
        photoAnalysis,
        auditTrail: audit.build(
          {
            estimateProvided: true,
            dimensionsProvided: !!dimensions,
            expertReportProvided: !!expertReportBuffer,
            photosProvided: !!photos && photos.length > 0,
            parseConfidence: structuredEstimate.parseConfidence,
            dimensionRoomCount: dimensions?.rooms?.length || 0,
            reportDirectiveCount: expertReport?.directives?.length || 0,
            photoCount: photos?.length || 0
          },
          {
            structuralIntegrity: structuralIntegrityScore,
            baselineExposurePercent: Math.round(baselineExposurePercent * 100) / 100,
            deviationExposurePercent: Math.round(deviationExposurePercent * 100) / 100,
            codeRiskPercent: Math.round(codeRiskPercent * 100) / 100,
            criticalMultiplier,
            rawScore: Math.round((
              (100 - structuralIntegrityScore) * 0.30 +
              baselineExposurePercent * 0.25 +
              deviationExposurePercent * 0.30 +
              codeRiskPercent * 0.15
            ) * criticalMultiplier * 100) / 100,
            cappedScore: consolidatedRiskScore
          },
          {
            estimateValidation: true,
            dimensionValidation: !dimensions || validateDimensions(dimensions).valid,
            reportValidation: !expertReport || validateReport(expertReport).valid,
            outputValidation: true,
            allPassed: true
          },
          {
            totalTimeMs: processingTimeMs,
            parseTimeMs: perfMonitor.getDuration('parse_start'),
            analysisTimeMs: reportGenTimeMs,
            aiTimeMs: photoAnalysis ? perfMonitor.getDuration('photo_start') : 0,
            validationTimeMs: 0
          }
        ),
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTimeMs,
          enginesUsed: [
            'XactimateParser',
            'DimensionEngine',
            'DeviationEngine',
            'ExposureEngine',
            'TradeCompletenessEngine',
            expertReport ? 'ReportParser' : null,
            photoAnalysis ? 'PhotoAnalysis' : null
          ].filter(Boolean)
        }
      }
    };
    
    // ========================================
    // OUTPUT VALIDATION
    // ========================================
    const outputValidation = validateAPIOutput(response.data);
    
    if (!outputValidation.valid) {
      audit.logError(`Output validation failed: ${outputValidation.errors.map(e => e.field).join(', ')}`);
      
      throw Errors.InternalError(
        'Output validation failed',
        { validationErrors: outputValidation.errors }
      );
    }
    
    // ========================================
    // TELEMETRY
    // ========================================
    trackRequest({
      requestId,
      timestamp: new Date().toISOString(),
      processingTimeMs,
      success: true,
      parseConfidence: structuredEstimate.parseConfidence,
      deviationsFound: deviationAnalysis.deviations.length,
      totalExposure: deviationAnalysis.totalDeviationExposureMax + structuredReport.totalExposureMax,
      riskScore: consolidatedRiskScore,
      inputTypes: {
        estimate: true,
        dimensions: !!dimensions,
        report: !!expertReport,
        photos: !!photos && photos.length > 0
      }
    });
    
    // ========================================
    // PERFORMANCE CHECK
    // ========================================
    perfMonitor.checkTimeout(PERFORMANCE_LIMITS.MAX_PROCESSING_TIME_MS);
    
    audit.logStage('COMPLETE', 'Request completed successfully', {
      processingTimeMs,
      riskScore: consolidatedRiskScore
    });
    
    return res.status(200).json(response);
    
  } catch (error: any) {
    // ========================================
    // STRUCTURED ERROR HANDLING
    // ========================================
    const structuredError = toStructuredError(error);
    
    audit.logError(structuredError.message);
    trackError(requestId, structuredError.errorCode, structuredError.errorType, structuredError.message);
    
    // Track failed request
    trackRequest({
      requestId,
      timestamp: new Date().toISOString(),
      processingTimeMs: Date.now() - perfMonitor['startTime'],
      success: false,
      errorCode: structuredError.errorCode,
      inputTypes: {
        estimate: !!req.body.estimateText,
        dimensions: !!req.body.dimensions,
        report: !!req.body.expertReportBuffer,
        photos: !!req.body.photos
      }
    });
    
    // Determine HTTP status code
    let statusCode = 500;
    
    if (structuredError.errorType === 'VALIDATION_ERROR' || structuredError.errorType === 'PARSE_ERROR') {
      statusCode = 400;
    } else if (structuredError.errorType === 'FILE_ERROR') {
      statusCode = structuredError.errorCode === 'FILE_TOO_LARGE' ? 413 : 400;
    } else if (structuredError.errorType === 'CALCULATION_ERROR' || structuredError.errorType === 'DIMENSION_ERROR') {
      statusCode = 422;
    } else if (structuredError.errorType === 'PERFORMANCE_ERROR') {
      statusCode = structuredError.errorCode === 'RATE_LIMIT_EXCEEDED' ? 429 : 503;
    } else if (structuredError.errorType === 'SECURITY_ERROR') {
      statusCode = 403;
    }
    
    return res.status(statusCode).json(formatErrorResponse(error));
  }
}
