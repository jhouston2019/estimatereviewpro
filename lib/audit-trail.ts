/**
 * ENTERPRISE AUDIT TRAIL
 * Comprehensive logging for compliance, debugging, and defensibility
 */

import { COST_BASELINE_VERSION, COST_BASELINE_DATE, COST_BASELINE_REGION } from './cost-baseline';

export interface AuditEntry {
  timestamp: string;
  stage: string;
  action: string;
  duration?: number;
  success: boolean;
  details: Record<string, any>;
  errors?: string[];
}

export interface GeometryAuditEntry {
  roomName: string;
  perimeter: number;
  wallHeight: number;
  estimateHeight: number;
  reportHeight: number;
  deltaSF: number;
  formula: string;
  costPerUnit: { min: number; max: number };
  exposureCalculated: { min: number; max: number };
}

export interface EnterpriseAuditTrail {
  // Request metadata
  requestId: string;
  timestamp: string;
  processingTimeMs: number;
  
  // Input validation
  inputValidation: {
    estimateProvided: boolean;
    dimensionsProvided: boolean;
    expertReportProvided: boolean;
    photosProvided: boolean;
    parseConfidence: number;
    dimensionRoomCount: number;
    reportDirectiveCount: number;
    photoCount: number;
  };
  
  // Engine execution
  enginesExecuted: string[];
  engineTimings: Record<string, number>;
  
  // Geometry calculations
  geometryCalculations: GeometryAuditEntry[];
  calculationMethod: 'PER_ROOM' | 'AGGREGATE' | 'HYBRID';
  
  // Room-level data
  roomLevelData: Array<{
    roomName: string;
    perimeter: number;
    wallHeight: number;
    wallSF: number;
    ceilingSF: number;
    floorSF: number;
  }>;
  
  // Deviation calculations
  deviationCalculations: Array<{
    deviationType: string;
    trade: string;
    estimateValue: number;
    expectedValue: number;
    deltaSF: number;
    costPerUnit: { min: number; max: number };
    exposureMin: number;
    exposureMax: number;
    formula: string;
    roomsAffected: string[];
  }>;
  
  // Cost baseline
  costBaseline: {
    version: string;
    date: string;
    region: string;
    itemsUsed: string[];
  };
  
  // Risk score breakdown
  riskScoreBreakdown: {
    structuralIntegrity: number;
    baselineExposurePercent: number;
    deviationExposurePercent: number;
    codeRiskPercent: number;
    criticalMultiplier: number;
    rawScore: number;
    cappedScore: number;
  };
  
  // AI operations
  aiOperations: Array<{
    operation: string;
    provider: string;
    model: string;
    retries: number;
    success: boolean;
    durationMs: number;
    tokensUsed?: number;
  }>;
  
  // Warnings and errors
  warnings: string[];
  errors: string[];
  
  // Validation results
  validationChecks: {
    estimateValidation: boolean;
    dimensionValidation: boolean;
    reportValidation: boolean;
    outputValidation: boolean;
    allPassed: boolean;
  };
  
  // Performance metrics
  performance: {
    totalTimeMs: number;
    parseTimeMs: number;
    analysisTimeMs: number;
    aiTimeMs: number;
    validationTimeMs: number;
  };
}

/**
 * Create audit trail builder
 */
export class AuditTrailBuilder {
  private entries: AuditEntry[] = [];
  private startTime: number;
  private requestId: string;
  private engineTimings: Record<string, number> = {};
  private geometryCalculations: GeometryAuditEntry[] = [];
  private deviationCalculations: any[] = [];
  private roomLevelData: any[] = [];
  private aiOperations: any[] = [];
  private warnings: string[] = [];
  private errors: string[] = [];
  private costItemsUsed: Set<string> = new Set();
  
  constructor(requestId?: string) {
    this.startTime = Date.now();
    this.requestId = requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Log stage execution
   */
  logStage(stage: string, action: string, details: Record<string, any> = {}): void {
    this.entries.push({
      timestamp: new Date().toISOString(),
      stage,
      action,
      success: true,
      details
    });
  }
  
  /**
   * Log engine timing
   */
  logEngineTiming(engineName: string, durationMs: number): void {
    this.engineTimings[engineName] = durationMs;
  }
  
  /**
   * Log geometry calculation
   */
  logGeometryCalculation(entry: GeometryAuditEntry): void {
    this.geometryCalculations.push(entry);
  }
  
  /**
   * Log deviation calculation
   */
  logDeviationCalculation(deviation: any): void {
    this.deviationCalculations.push({
      deviationType: deviation.deviationType,
      trade: deviation.trade,
      estimateValue: deviation.estimateValue || 0,
      expectedValue: deviation.expectedValue || 0,
      deltaSF: deviation.roomGeometry 
        ? deviation.roomGeometry.reduce((sum: number, r: any) => sum + r.deltaSF, 0)
        : 0,
      costPerUnit: { min: 0, max: 0 }, // Will be populated from deviation
      exposureMin: deviation.impactMin,
      exposureMax: deviation.impactMax,
      formula: deviation.calculation,
      roomsAffected: deviation.roomGeometry?.map((r: any) => r.roomName) || []
    });
  }
  
  /**
   * Log room-level data
   */
  logRoomData(room: any): void {
    this.roomLevelData.push({
      roomName: room.roomName,
      perimeter: room.perimeterLF,
      wallHeight: room.height,
      wallSF: room.wallSF,
      ceilingSF: room.ceilingSF,
      floorSF: room.floorSF
    });
  }
  
  /**
   * Log AI operation
   */
  logAIOperation(operation: string, provider: string, model: string, retries: number, success: boolean, durationMs: number, tokensUsed?: number): void {
    this.aiOperations.push({
      operation,
      provider,
      model,
      retries,
      success,
      durationMs,
      tokensUsed
    });
  }
  
  /**
   * Log warning
   */
  logWarning(warning: string): void {
    this.warnings.push(warning);
  }
  
  /**
   * Log error
   */
  logError(error: string): void {
    this.errors.push(error);
  }
  
  /**
   * Log cost baseline usage
   */
  logCostBaselineUsage(itemKey: string): void {
    this.costItemsUsed.add(itemKey);
  }
  
  /**
   * Build final audit trail
   */
  build(
    inputValidation: any,
    riskScoreBreakdown: any,
    validationChecks: any,
    performance: any
  ): EnterpriseAuditTrail {
    
    return {
      requestId: this.requestId,
      timestamp: new Date().toISOString(),
      processingTimeMs: Date.now() - this.startTime,
      
      inputValidation,
      
      enginesExecuted: Object.keys(this.engineTimings),
      engineTimings: this.engineTimings,
      
      geometryCalculations: this.geometryCalculations,
      calculationMethod: this.geometryCalculations.length > 1 ? 'PER_ROOM' : 'AGGREGATE',
      
      roomLevelData: this.roomLevelData,
      
      deviationCalculations: this.deviationCalculations,
      
      costBaseline: {
        version: COST_BASELINE_VERSION,
        date: COST_BASELINE_DATE,
        region: COST_BASELINE_REGION,
        itemsUsed: Array.from(this.costItemsUsed)
      },
      
      riskScoreBreakdown,
      
      aiOperations: this.aiOperations,
      
      warnings: this.warnings,
      errors: this.errors,
      
      validationChecks,
      
      performance
    };
  }
}

/**
 * Create new audit trail
 */
export function createAuditTrail(requestId?: string): AuditTrailBuilder {
  return new AuditTrailBuilder(requestId);
}
