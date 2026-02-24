/**
 * STRUCTURED ERROR HANDLING
 * ENTERPRISE-GRADE: Consistent error format with remediation
 * NO RAW STACK TRACES - User-friendly, actionable errors
 */

export type ErrorType = 
  | 'VALIDATION_ERROR'
  | 'PARSE_ERROR'
  | 'CALCULATION_ERROR'
  | 'DIMENSION_ERROR'
  | 'REPORT_ERROR'
  | 'FILE_ERROR'
  | 'SECURITY_ERROR'
  | 'PERFORMANCE_ERROR'
  | 'INTERNAL_ERROR';

export interface StructuredError {
  errorCode: string;
  errorType: ErrorType;
  message: string;
  remediation: string;
  timestamp: string;
  details?: Record<string, any>;
  field?: string;
}

export class ERPError extends Error {
  public readonly errorCode: string;
  public readonly errorType: ErrorType;
  public readonly remediation: string;
  public readonly timestamp: string;
  public readonly details?: Record<string, any>;
  public readonly field?: string;
  
  constructor(
    errorCode: string,
    errorType: ErrorType,
    message: string,
    remediation: string,
    details?: Record<string, any>,
    field?: string
  ) {
    super(message);
    this.name = 'ERPError';
    this.errorCode = errorCode;
    this.errorType = errorType;
    this.remediation = remediation;
    this.timestamp = new Date().toISOString();
    this.details = details;
    this.field = field;
  }
  
  toJSON(): StructuredError {
    return {
      errorCode: this.errorCode,
      errorType: this.errorType,
      message: this.message,
      remediation: this.remediation,
      timestamp: this.timestamp,
      details: this.details,
      field: this.field
    };
  }
}

/**
 * Validation errors
 */
export class ValidationError extends ERPError {
  constructor(code: string, message: string, remediation: string, details?: Record<string, any>, field?: string) {
    super(code, 'VALIDATION_ERROR', message, remediation, details, field);
  }
}

export class ParseError extends ERPError {
  constructor(code: string, message: string, remediation: string, details?: Record<string, any>) {
    super(code, 'PARSE_ERROR', message, remediation, details);
  }
}

export class CalculationError extends ERPError {
  constructor(code: string, message: string, remediation: string, details?: Record<string, any>) {
    super(code, 'CALCULATION_ERROR', message, remediation, details);
  }
}

export class DimensionError extends ERPError {
  constructor(code: string, message: string, remediation: string, details?: Record<string, any>) {
    super(code, 'DIMENSION_ERROR', message, remediation, details);
  }
}

export class ReportError extends ERPError {
  constructor(code: string, message: string, remediation: string, details?: Record<string, any>) {
    super(code, 'REPORT_ERROR', message, remediation, details);
  }
}

export class FileError extends ERPError {
  constructor(code: string, message: string, remediation: string, details?: Record<string, any>) {
    super(code, 'FILE_ERROR', message, remediation, details);
  }
}

export class SecurityError extends ERPError {
  constructor(code: string, message: string, remediation: string, details?: Record<string, any>) {
    super(code, 'SECURITY_ERROR', message, remediation, details);
  }
}

export class PerformanceError extends ERPError {
  constructor(code: string, message: string, remediation: string, details?: Record<string, any>) {
    super(code, 'PERFORMANCE_ERROR', message, remediation, details);
  }
}

/**
 * Common error factories
 */
export const Errors = {
  // Validation
  LowParseConfidence: (confidence: number) => new ValidationError(
    'LOW_PARSE_CONFIDENCE',
    `Parse confidence ${(confidence * 100).toFixed(1)}% below minimum threshold (75%)`,
    'Verify estimate format is Xactimate standard. Check for malformed columns, missing headers, or corrupted data.',
    { confidence, threshold: 0.75 }
  ),
  
  NoLineItems: () => new ValidationError(
    'NO_LINE_ITEMS',
    'Estimate contains no parseable line items',
    'Verify estimate file contains trade codes, quantities, and prices in standard format.'
  ),
  
  InvalidRCV: (rcv: number) => new ValidationError(
    'INVALID_RCV',
    `Total RCV is invalid: ${rcv}`,
    'Verify estimate contains valid pricing data.',
    { rcv }
  ),
  
  // Dimension errors
  NoRooms: () => new DimensionError(
    'NO_ROOMS',
    'Dimension input contains no rooms',
    'Provide at least one room with length, width, and height dimensions.'
  ),
  
  InvalidRoomDimensions: (roomName: string, field: string, value: number) => new DimensionError(
    'INVALID_ROOM_DIMENSIONS',
    `Room "${roomName}" has invalid ${field}: ${value}`,
    `${field.charAt(0).toUpperCase() + field.slice(1)} must be a positive number in feet.`,
    { roomName, field, value }
  ),
  
  ZeroPerimeter: (roomName?: string) => new DimensionError(
    'ZERO_PERIMETER',
    roomName ? `Room "${roomName}" has zero perimeter` : 'Perimeter is zero',
    'Check room length and width values. Both must be > 0.',
    { roomName }
  ),
  
  HeightExceedsCeiling: (extractedHeight: number, maxHeight: number, roomName?: string) => new CalculationError(
    'HEIGHT_EXCEEDS_CEILING',
    roomName
      ? `Extracted height ${extractedHeight.toFixed(1)} ft exceeds ceiling height ${maxHeight} ft in room "${roomName}"`
      : `Extracted height ${extractedHeight.toFixed(1)} ft exceeds max ceiling height ${maxHeight} ft`,
    'This indicates ceiling removal may be included in wall removal quantity. Separate wall and ceiling line items, or verify dimension data is correct.',
    { extractedHeight, maxHeight, roomName }
  ),
  
  DimensionsRequired: () => new ValidationError(
    'DIMENSIONS_REQUIRED',
    'Dimension data required for report directive comparison',
    'Provide room dimensions (length, width, height) to enable height-based deviation calculations.'
  ),
  
  // File errors
  FileTooLarge: (sizeMB: number, maxMB: number) => new FileError(
    'FILE_TOO_LARGE',
    `File size ${sizeMB.toFixed(2)} MB exceeds maximum ${maxMB} MB`,
    `Reduce file size to under ${maxMB} MB or split into multiple files.`,
    { sizeMB, maxMB }
  ),
  
  InvalidFileType: (extension: string, allowed: string[]) => new FileError(
    'INVALID_FILE_TYPE',
    `File type ".${extension}" not allowed`,
    `Allowed types: ${allowed.join(', ')}`,
    { extension, allowed }
  ),
  
  EmptyFile: () => new FileError(
    'EMPTY_FILE',
    'Uploaded file is empty',
    'Provide a valid file with content.'
  ),
  
  // Security errors
  DirectoryTraversal: (filename: string) => new SecurityError(
    'DIRECTORY_TRAVERSAL',
    'Filename contains invalid characters (directory traversal attempt)',
    'Use simple filename without path separators.',
    { filename }
  ),
  
  InvalidMimeType: (detected: string, expected: string[]) => new SecurityError(
    'INVALID_MIME_TYPE',
    `File MIME type "${detected}" does not match extension`,
    `Expected one of: ${expected.join(', ')}`,
    { detected, expected }
  ),
  
  // Performance errors
  TimeoutExceeded: (operation: string, timeoutMs: number) => new PerformanceError(
    'TIMEOUT_EXCEEDED',
    `Operation "${operation}" exceeded timeout of ${timeoutMs}ms`,
    'Try with a smaller file or simpler estimate. Contact support if issue persists.',
    { operation, timeoutMs }
  ),
  
  // Calculation errors
  NegativeDelta: (trade: string, deltaSF: number) => new CalculationError(
    'NEGATIVE_DELTA',
    `Delta SF for ${trade} is negative (${deltaSF})`,
    'This should not happen - internal calculation error. Contact support.',
    { trade, deltaSF }
  ),
  
  InvalidExposureRange: (min: number, max: number) => new CalculationError(
    'INVALID_EXPOSURE_RANGE',
    `Min exposure ($${min}) exceeds max exposure ($${max})`,
    'Internal calculation error. Contact support.',
    { min, max }
  ),
  
  // Generic
  InternalError: (message: string, details?: Record<string, any>) => new ERPError(
    'INTERNAL_ERROR',
    'INTERNAL_ERROR',
    message,
    'An unexpected error occurred. Please contact support with the request ID.',
    details
  )
};

/**
 * Convert any error to structured format
 */
export function toStructuredError(error: any): StructuredError {
  if (error instanceof ERPError) {
    return error.toJSON();
  }
  
  // Handle validation errors from validation-engine
  if (error.message && error.message.startsWith('VALIDATION_ERROR:')) {
    const message = error.message.replace('VALIDATION_ERROR: ', '');
    return {
      errorCode: 'VALIDATION_ERROR',
      errorType: 'VALIDATION_ERROR',
      message,
      remediation: 'Check input data for validity and completeness.',
      timestamp: new Date().toISOString(),
      details: { originalError: error.message }
    };
  }
  
  // Generic error
  return {
    errorCode: 'INTERNAL_ERROR',
    errorType: 'INTERNAL_ERROR',
    message: error.message || 'An unexpected error occurred',
    remediation: 'Please contact support with the request ID.',
    timestamp: new Date().toISOString(),
    details: {
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }
  };
}

/**
 * Format error for API response
 */
export function formatErrorResponse(error: any): {
  success: false;
  error: StructuredError;
} {
  return {
    success: false,
    error: toStructuredError(error)
  };
}
