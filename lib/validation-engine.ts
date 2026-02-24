/**
 * VALIDATION ENGINE
 * ENTERPRISE-GRADE: Comprehensive input/output validation
 * Structured error handling with remediation guidance
 */

import { StructuredEstimate } from './xactimate-structural-parser';
import { ExpectedQuantities, DimensionInput, Room } from './dimension-engine';
import { ParsedReport } from './report-parser';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  field: string;
  message: string;
  remediation: string;
  severity: 'CRITICAL' | 'ERROR';
}

export interface ValidationWarning {
  code: string;
  field: string;
  message: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * Validate estimate structure
 */
export function validateEstimate(estimate: StructuredEstimate): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Check parse confidence
  if (estimate.parseConfidence < 0.75) {
    errors.push({
      code: 'LOW_PARSE_CONFIDENCE',
      field: 'parseConfidence',
      message: `Parse confidence ${(estimate.parseConfidence * 100).toFixed(1)}% below minimum threshold (75%)`,
      remediation: 'Verify estimate format is Xactimate standard. Check for malformed columns or missing data.',
      severity: 'CRITICAL'
    });
  } else if (estimate.parseConfidence < 0.85) {
    warnings.push({
      code: 'MODERATE_PARSE_CONFIDENCE',
      field: 'parseConfidence',
      message: `Parse confidence ${(estimate.parseConfidence * 100).toFixed(1)}% below recommended threshold (85%)`,
      impact: 'MEDIUM'
    });
  }
  
  // Check line items
  if (estimate.lineItems.length === 0) {
    errors.push({
      code: 'NO_LINE_ITEMS',
      field: 'lineItems',
      message: 'Estimate contains no parseable line items',
      remediation: 'Verify estimate file is not empty and contains trade codes, quantities, and prices.',
      severity: 'CRITICAL'
    });
  } else if (estimate.lineItems.length < 3) {
    warnings.push({
      code: 'FEW_LINE_ITEMS',
      field: 'lineItems',
      message: `Estimate contains only ${estimate.lineItems.length} line item(s)`,
      impact: 'LOW'
    });
  }
  
  // Check totals
  if (estimate.totals.rcv <= 0) {
    errors.push({
      code: 'INVALID_RCV',
      field: 'totals.rcv',
      message: 'Total RCV is zero or negative',
      remediation: 'Verify estimate contains valid pricing data.',
      severity: 'ERROR'
    });
  }
  
  // Check for NaN values
  for (let i = 0; i < estimate.lineItems.length; i++) {
    const item = estimate.lineItems[i];
    
    if (isNaN(item.quantity) || !isFinite(item.quantity)) {
      errors.push({
        code: 'INVALID_QUANTITY',
        field: `lineItems[${i}].quantity`,
        message: `Line item ${i + 1} has invalid quantity: ${item.quantity}`,
        remediation: 'Check estimate formatting and ensure quantities are numeric.',
        severity: 'ERROR'
      });
    }
    
    if (isNaN(item.rcv) || !isFinite(item.rcv)) {
      errors.push({
        code: 'INVALID_RCV',
        field: `lineItems[${i}].rcv`,
        message: `Line item ${i + 1} has invalid RCV: ${item.rcv}`,
        remediation: 'Check estimate formatting and ensure prices are numeric.',
        severity: 'ERROR'
      });
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate dimension input
 */
export function validateDimensions(dimensions: DimensionInput): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Check rooms array
  if (!dimensions.rooms || dimensions.rooms.length === 0) {
    errors.push({
      code: 'NO_ROOMS',
      field: 'rooms',
      message: 'Dimension input contains no rooms',
      remediation: 'Provide at least one room with length, width, and height.',
      severity: 'CRITICAL'
    });
    
    return { valid: false, errors, warnings };
  }
  
  // Validate each room
  for (let i = 0; i < dimensions.rooms.length; i++) {
    const room = dimensions.rooms[i];
    
    if (!room.name || room.name.trim().length === 0) {
      errors.push({
        code: 'MISSING_ROOM_NAME',
        field: `rooms[${i}].name`,
        message: `Room ${i + 1} is missing a name`,
        remediation: 'Provide a descriptive name for each room.',
        severity: 'ERROR'
      });
    }
    
    if (!room.length || room.length <= 0) {
      errors.push({
        code: 'INVALID_ROOM_LENGTH',
        field: `rooms[${i}].length`,
        message: `Room "${room.name}" has invalid length: ${room.length}`,
        remediation: 'Length must be a positive number in feet.',
        severity: 'ERROR'
      });
    }
    
    if (!room.width || room.width <= 0) {
      errors.push({
        code: 'INVALID_ROOM_WIDTH',
        field: `rooms[${i}].width`,
        message: `Room "${room.name}" has invalid width: ${room.width}`,
        remediation: 'Width must be a positive number in feet.',
        severity: 'ERROR'
      });
    }
    
    if (!room.height || room.height <= 0) {
      errors.push({
        code: 'INVALID_ROOM_HEIGHT',
        field: `rooms[${i}].height`,
        message: `Room "${room.name}" has invalid height: ${room.height}`,
        remediation: 'Height must be a positive number in feet.',
        severity: 'ERROR'
      });
    }
    
    // Sanity checks
    if (room.length && room.length > 100) {
      warnings.push({
        code: 'UNUSUAL_ROOM_LENGTH',
        field: `rooms[${i}].length`,
        message: `Room "${room.name}" has unusually large length: ${room.length} ft`,
        impact: 'MEDIUM'
      });
    }
    
    if (room.width && room.width > 100) {
      warnings.push({
        code: 'UNUSUAL_ROOM_WIDTH',
        field: `rooms[${i}].width`,
        message: `Room "${room.name}" has unusually large width: ${room.width} ft`,
        impact: 'MEDIUM'
      });
    }
    
    if (room.height && (room.height < 6 || room.height > 20)) {
      warnings.push({
        code: 'UNUSUAL_CEILING_HEIGHT',
        field: `rooms[${i}].height`,
        message: `Room "${room.name}" has unusual ceiling height: ${room.height} ft`,
        impact: 'LOW'
      });
    }
    
    // Check for NaN
    if (isNaN(room.length) || isNaN(room.width) || isNaN(room.height)) {
      errors.push({
        code: 'NAN_DIMENSION',
        field: `rooms[${i}]`,
        message: `Room "${room.name}" contains NaN values`,
        remediation: 'Ensure all dimensions are valid numbers.',
        severity: 'CRITICAL'
      });
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate expert report
 */
export function validateReport(report: ParsedReport): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  if (!report.directives || report.directives.length === 0) {
    warnings.push({
      code: 'NO_DIRECTIVES',
      field: 'directives',
      message: 'Expert report contains no extractable directives',
      impact: 'HIGH'
    });
  }
  
  const measurableDirectives = report.directives.filter(d => d.measurable).length;
  
  if (measurableDirectives === 0 && report.directives.length > 0) {
    warnings.push({
      code: 'NO_MEASURABLE_DIRECTIVES',
      field: 'directives',
      message: 'Expert report contains directives but none are measurable',
      impact: 'HIGH'
    });
  }
  
  if (report.metadata.confidence < 0.5) {
    warnings.push({
      code: 'LOW_REPORT_CONFIDENCE',
      field: 'metadata.confidence',
      message: `Report parsing confidence ${(report.metadata.confidence * 100).toFixed(1)}% is low`,
      impact: 'MEDIUM'
    });
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate deviation analysis output
 */
export function validateDeviationOutput(
  deviations: any[]
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  for (let i = 0; i < deviations.length; i++) {
    const dev = deviations[i];
    
    // Check required fields
    if (!dev.deviationType) {
      errors.push({
        code: 'MISSING_DEVIATION_TYPE',
        field: `deviations[${i}].deviationType`,
        message: 'Deviation missing type',
        remediation: 'Internal error - contact support',
        severity: 'CRITICAL'
      });
    }
    
    // Check numeric fields
    if (typeof dev.impactMin !== 'number' || isNaN(dev.impactMin) || !isFinite(dev.impactMin)) {
      errors.push({
        code: 'INVALID_IMPACT_MIN',
        field: `deviations[${i}].impactMin`,
        message: `Deviation has invalid impactMin: ${dev.impactMin}`,
        remediation: 'Internal error - contact support',
        severity: 'CRITICAL'
      });
    }
    
    if (typeof dev.impactMax !== 'number' || isNaN(dev.impactMax) || !isFinite(dev.impactMax)) {
      errors.push({
        code: 'INVALID_IMPACT_MAX',
        field: `deviations[${i}].impactMax`,
        message: `Deviation has invalid impactMax: ${dev.impactMax}`,
        remediation: 'Internal error - contact support',
        severity: 'CRITICAL'
      });
    }
    
    // Check for negative exposure
    if (dev.impactMin < 0 || dev.impactMax < 0) {
      errors.push({
        code: 'NEGATIVE_EXPOSURE',
        field: `deviations[${i}].impact`,
        message: `Deviation has negative exposure: $${dev.impactMin}-${dev.impactMax}`,
        remediation: 'Internal error - exposure cannot be negative',
        severity: 'CRITICAL'
      });
    }
    
    // Check range validity
    if (dev.impactMin > dev.impactMax) {
      errors.push({
        code: 'INVALID_EXPOSURE_RANGE',
        field: `deviations[${i}].impact`,
        message: `Min exposure ($${dev.impactMin}) exceeds max exposure ($${dev.impactMax})`,
        remediation: 'Internal error - invalid range',
        severity: 'CRITICAL'
      });
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate risk score
 */
export function validateRiskScore(score: number): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  if (typeof score !== 'number' || isNaN(score) || !isFinite(score)) {
    errors.push({
      code: 'INVALID_RISK_SCORE',
      field: 'consolidatedRiskScore',
      message: `Risk score is not a valid number: ${score}`,
      remediation: 'Internal error - contact support',
      severity: 'CRITICAL'
    });
  }
  
  if (score < 0 || score > 100) {
    errors.push({
      code: 'RISK_SCORE_OUT_OF_RANGE',
      field: 'consolidatedRiskScore',
      message: `Risk score ${score} is outside valid range (0-100)`,
      remediation: 'Internal error - score must be capped at 0-100',
      severity: 'CRITICAL'
    });
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate complete API response
 */
export function validateAPIResponse(response: any): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Check required fields
  if (typeof response.parseConfidence !== 'number') {
    errors.push({
      code: 'MISSING_PARSE_CONFIDENCE',
      field: 'parseConfidence',
      message: 'Response missing parseConfidence',
      remediation: 'Internal error - contact support',
      severity: 'CRITICAL'
    });
  }
  
  if (typeof response.structuralIntegrityScore !== 'number') {
    errors.push({
      code: 'MISSING_INTEGRITY_SCORE',
      field: 'structuralIntegrityScore',
      message: 'Response missing structuralIntegrityScore',
      remediation: 'Internal error - contact support',
      severity: 'CRITICAL'
    });
  }
  
  if (typeof response.consolidatedRiskScore !== 'number') {
    errors.push({
      code: 'MISSING_RISK_SCORE',
      field: 'consolidatedRiskScore',
      message: 'Response missing consolidatedRiskScore',
      remediation: 'Internal error - contact support',
      severity: 'CRITICAL'
    });
  }
  
  // Validate exposure ranges
  if (response.deviationExposure) {
    if (typeof response.deviationExposure.min !== 'number' || typeof response.deviationExposure.max !== 'number') {
      errors.push({
        code: 'INVALID_DEVIATION_EXPOSURE',
        field: 'deviationExposure',
        message: 'Deviation exposure range contains non-numeric values',
        remediation: 'Internal error - contact support',
        severity: 'CRITICAL'
      });
    }
    
    if (response.deviationExposure.min > response.deviationExposure.max) {
      errors.push({
        code: 'INVALID_EXPOSURE_RANGE',
        field: 'deviationExposure',
        message: 'Min exposure exceeds max exposure',
        remediation: 'Internal error - invalid range',
        severity: 'CRITICAL'
      });
    }
  }
  
  if (response.baselineExposure) {
    if (typeof response.baselineExposure.min !== 'number' || typeof response.baselineExposure.max !== 'number') {
      errors.push({
        code: 'INVALID_BASELINE_EXPOSURE',
        field: 'baselineExposure',
        message: 'Baseline exposure range contains non-numeric values',
        remediation: 'Internal error - contact support',
        severity: 'CRITICAL'
      });
    }
  }
  
  // Check audit trail
  if (!response.auditTrail) {
    warnings.push({
      code: 'MISSING_AUDIT_TRAIL',
      field: 'auditTrail',
      message: 'Response missing audit trail',
      impact: 'HIGH'
    });
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate file upload
 */
export function validateFileUpload(
  buffer: Buffer,
  filename: string,
  maxSizeMB: number = 10
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Check size
  const sizeMB = buffer.length / (1024 * 1024);
  
  if (sizeMB > maxSizeMB) {
    errors.push({
      code: 'FILE_TOO_LARGE',
      field: 'file',
      message: `File size ${sizeMB.toFixed(2)} MB exceeds maximum ${maxSizeMB} MB`,
      remediation: `Reduce file size to under ${maxSizeMB} MB or split into multiple files.`,
      severity: 'ERROR'
    });
  }
  
  if (sizeMB > maxSizeMB * 0.8) {
    warnings.push({
      code: 'LARGE_FILE',
      field: 'file',
      message: `File size ${sizeMB.toFixed(2)} MB is close to maximum ${maxSizeMB} MB`,
      impact: 'LOW'
    });
  }
  
  // Check filename
  if (!filename || filename.trim().length === 0) {
    warnings.push({
      code: 'MISSING_FILENAME',
      field: 'filename',
      message: 'File uploaded without filename',
      impact: 'LOW'
    });
  }
  
  // Check for directory traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    errors.push({
      code: 'INVALID_FILENAME',
      field: 'filename',
      message: 'Filename contains invalid characters (directory traversal attempt)',
      remediation: 'Use simple filename without path separators.',
      severity: 'CRITICAL'
    });
  }
  
  // Check extension
  const ext = filename.split('.').pop()?.toLowerCase();
  const allowedExtensions = ['pdf', 'txt', 'csv', 'jpg', 'jpeg', 'png'];
  
  if (ext && !allowedExtensions.includes(ext)) {
    errors.push({
      code: 'INVALID_FILE_TYPE',
      field: 'filename',
      message: `File type ".${ext}" not allowed`,
      remediation: `Allowed types: ${allowedExtensions.join(', ')}`,
      severity: 'ERROR'
    });
  }
  
  // Check for empty file
  if (buffer.length === 0) {
    errors.push({
      code: 'EMPTY_FILE',
      field: 'file',
      message: 'Uploaded file is empty',
      remediation: 'Provide a valid file with content.',
      severity: 'ERROR'
    });
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate CSV structure
 */
export function validateCSVStructure(csvText: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  if (!csvText || csvText.trim().length === 0) {
    errors.push({
      code: 'EMPTY_CSV',
      field: 'csv',
      message: 'CSV file is empty',
      remediation: 'Provide a valid CSV file with headers and data rows.',
      severity: 'ERROR'
    });
    
    return { valid: false, errors, warnings };
  }
  
  const lines = csvText.split('\n').filter(line => line.trim().length > 0);
  
  if (lines.length < 2) {
    errors.push({
      code: 'INSUFFICIENT_CSV_DATA',
      field: 'csv',
      message: 'CSV file must contain at least a header row and one data row',
      remediation: 'Verify CSV file is not truncated.',
      severity: 'ERROR'
    });
  }
  
  // Check for consistent column count
  const columnCounts = lines.map(line => line.split(',').length);
  const uniqueCounts = [...new Set(columnCounts)];
  
  if (uniqueCounts.length > 2) {
    warnings.push({
      code: 'INCONSISTENT_COLUMNS',
      field: 'csv',
      message: 'CSV rows have inconsistent column counts',
      impact: 'MEDIUM'
    });
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate perimeter calculation
 */
export function validatePerimeter(perimeter: number, roomName?: string): void {
  if (perimeter <= 0) {
    throw new Error(
      roomName
        ? `VALIDATION_ERROR: Room "${roomName}" has zero or negative perimeter`
        : 'VALIDATION_ERROR: Perimeter is zero or negative'
    );
  }
  
  if (isNaN(perimeter) || !isFinite(perimeter)) {
    throw new Error(
      roomName
        ? `VALIDATION_ERROR: Room "${roomName}" perimeter is NaN or infinite`
        : 'VALIDATION_ERROR: Perimeter is NaN or infinite'
    );
  }
}

/**
 * Validate delta calculation
 */
export function validateDelta(
  deltaSF: number,
  estimateSF: number,
  expectedSF: number,
  trade: string
): void {
  
  if (isNaN(deltaSF) || !isFinite(deltaSF)) {
    throw new Error(`VALIDATION_ERROR: Delta SF for ${trade} is NaN or infinite`);
  }
  
  if (deltaSF < 0) {
    throw new Error(`VALIDATION_ERROR: Delta SF for ${trade} is negative (${deltaSF}). This should not happen - check calculation logic.`);
  }
  
  if (deltaSF > expectedSF * 2) {
    throw new Error(`VALIDATION_ERROR: Delta SF for ${trade} (${deltaSF}) exceeds 2x expected SF (${expectedSF}). Check dimension data.`);
  }
}
