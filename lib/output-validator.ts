/**
 * OUTPUT VALIDATOR
 * ENTERPRISE-GRADE: Ensures all outputs are stable, valid, and production-ready
 * Rejects malformed responses before they reach the client
 */

import { ValidationError } from './structured-errors';

export interface OutputValidationResult {
  valid: boolean;
  errors: Array<{
    field: string;
    issue: string;
    value: any;
  }>;
}

/**
 * Validate numeric field
 */
function validateNumeric(value: any, fieldName: string, min?: number, max?: number): string | null {
  if (typeof value !== 'number') {
    return `${fieldName} must be a number (got ${typeof value})`;
  }
  
  if (isNaN(value)) {
    return `${fieldName} is NaN`;
  }
  
  if (!isFinite(value)) {
    return `${fieldName} is not finite`;
  }
  
  if (min !== undefined && value < min) {
    return `${fieldName} (${value}) is below minimum (${min})`;
  }
  
  if (max !== undefined && value > max) {
    return `${fieldName} (${value}) exceeds maximum (${max})`;
  }
  
  return null;
}

/**
 * Validate exposure range
 */
function validateExposureRange(range: any, fieldName: string): string[] {
  const errors: string[] = [];
  
  if (!range || typeof range !== 'object') {
    errors.push(`${fieldName} must be an object with min/max`);
    return errors;
  }
  
  const minError = validateNumeric(range.min, `${fieldName}.min`, 0);
  if (minError) errors.push(minError);
  
  const maxError = validateNumeric(range.max, `${fieldName}.max`, 0);
  if (maxError) errors.push(maxError);
  
  if (errors.length === 0 && range.min > range.max) {
    errors.push(`${fieldName}.min (${range.min}) exceeds ${fieldName}.max (${range.max})`);
  }
  
  return errors;
}

/**
 * Validate deviation object
 */
function validateDeviation(deviation: any, index: number): string[] {
  const errors: string[] = [];
  const prefix = `deviations[${index}]`;
  
  if (!deviation.deviationType) {
    errors.push(`${prefix}.deviationType is required`);
  }
  
  if (!deviation.trade) {
    errors.push(`${prefix}.trade is required`);
  }
  
  if (!deviation.tradeName) {
    errors.push(`${prefix}.tradeName is required`);
  }
  
  if (!deviation.issue) {
    errors.push(`${prefix}.issue is required`);
  }
  
  const impactMinError = validateNumeric(deviation.impactMin, `${prefix}.impactMin`, 0);
  if (impactMinError) errors.push(impactMinError);
  
  const impactMaxError = validateNumeric(deviation.impactMax, `${prefix}.impactMax`, 0);
  if (impactMaxError) errors.push(impactMaxError);
  
  if (!impactMinError && !impactMaxError && deviation.impactMin > deviation.impactMax) {
    errors.push(`${prefix}.impactMin (${deviation.impactMin}) exceeds impactMax (${deviation.impactMax})`);
  }
  
  if (!deviation.severity || !['CRITICAL', 'HIGH', 'MODERATE', 'LOW'].includes(deviation.severity)) {
    errors.push(`${prefix}.severity must be CRITICAL, HIGH, MODERATE, or LOW`);
  }
  
  if (!deviation.calculation) {
    errors.push(`${prefix}.calculation is required`);
  }
  
  if (!deviation.source || !['REPORT', 'DIMENSION', 'BOTH'].includes(deviation.source)) {
    errors.push(`${prefix}.source must be REPORT, DIMENSION, or BOTH`);
  }
  
  return errors;
}

/**
 * Validate complete API response
 */
export function validateAPIOutput(response: any): OutputValidationResult {
  const errors: Array<{ field: string; issue: string; value: any }> = [];
  
  // Check required top-level fields
  if (response.success === undefined) {
    errors.push({ field: 'success', issue: 'Required field missing', value: undefined });
  }
  
  if (!response.data && response.success === true) {
    errors.push({ field: 'data', issue: 'Required field missing for successful response', value: undefined });
  }
  
  if (response.success === false && !response.error) {
    errors.push({ field: 'error', issue: 'Required field missing for error response', value: undefined });
  }
  
  // If success, validate data object
  if (response.success === true && response.data) {
    const data = response.data;
    
    // Validate parse confidence
    const parseConfError = validateNumeric(data.parseConfidence, 'parseConfidence', 0, 1);
    if (parseConfError) {
      errors.push({ field: 'parseConfidence', issue: parseConfError, value: data.parseConfidence });
    }
    
    // Validate structural integrity score
    const integrityError = validateNumeric(data.structuralIntegrityScore, 'structuralIntegrityScore', 0, 100);
    if (integrityError) {
      errors.push({ field: 'structuralIntegrityScore', issue: integrityError, value: data.structuralIntegrityScore });
    }
    
    // Validate consolidated risk score
    const riskError = validateNumeric(data.consolidatedRiskScore, 'consolidatedRiskScore', 0, 100);
    if (riskError) {
      errors.push({ field: 'consolidatedRiskScore', issue: riskError, value: data.consolidatedRiskScore });
    }
    
    // Validate exposure ranges
    if (data.baselineExposure) {
      const baselineErrors = validateExposureRange(data.baselineExposure, 'baselineExposure');
      baselineErrors.forEach(issue => errors.push({ field: 'baselineExposure', issue, value: data.baselineExposure }));
    }
    
    if (data.deviationExposure) {
      const deviationErrors = validateExposureRange(data.deviationExposure, 'deviationExposure');
      deviationErrors.forEach(issue => errors.push({ field: 'deviationExposure', issue, value: data.deviationExposure }));
    }
    
    if (data.codeRiskExposure) {
      const codeErrors = validateExposureRange(data.codeRiskExposure, 'codeRiskExposure');
      codeErrors.forEach(issue => errors.push({ field: 'codeRiskExposure', issue, value: data.codeRiskExposure }));
    }
    
    // Validate deviations array
    if (data.deviations) {
      if (!Array.isArray(data.deviations)) {
        errors.push({ field: 'deviations', issue: 'Must be an array', value: typeof data.deviations });
      } else {
        data.deviations.forEach((dev: any, i: number) => {
          const devErrors = validateDeviation(dev, i);
          devErrors.forEach(issue => errors.push({ field: `deviations[${i}]`, issue, value: dev }));
        });
      }
    }
    
    // Validate audit trail exists
    if (!data.auditTrail) {
      errors.push({ field: 'auditTrail', issue: 'Required field missing', value: undefined });
    }
    
    // Validate metadata
    if (!data.metadata) {
      errors.push({ field: 'metadata', issue: 'Required field missing', value: undefined });
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate PDF output structure
 */
export interface PDFOutputStructure {
  title: string;
  sections: PDFSection[];
  metadata: {
    generatedAt: string;
    requestId: string;
    version: string;
  };
}

export interface PDFSection {
  title: string;
  content: PDFContent[];
}

export type PDFContent = 
  | { type: 'text'; value: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'list'; items: string[] }
  | { type: 'heading'; level: 1 | 2 | 3; value: string };

/**
 * Validate PDF structure
 */
export function validatePDFStructure(structure: PDFOutputStructure): OutputValidationResult {
  const errors: Array<{ field: string; issue: string; value: any }> = [];
  
  if (!structure.title || structure.title.trim().length === 0) {
    errors.push({ field: 'title', issue: 'Title is required', value: structure.title });
  }
  
  if (!Array.isArray(structure.sections)) {
    errors.push({ field: 'sections', issue: 'Sections must be an array', value: typeof structure.sections });
  } else if (structure.sections.length === 0) {
    errors.push({ field: 'sections', issue: 'At least one section is required', value: structure.sections });
  } else {
    structure.sections.forEach((section, i) => {
      if (!section.title) {
        errors.push({ field: `sections[${i}].title`, issue: 'Section title is required', value: section.title });
      }
      
      if (!Array.isArray(section.content)) {
        errors.push({ field: `sections[${i}].content`, issue: 'Section content must be an array', value: typeof section.content });
      }
    });
  }
  
  if (!structure.metadata) {
    errors.push({ field: 'metadata', issue: 'Metadata is required', value: undefined });
  } else {
    if (!structure.metadata.generatedAt) {
      errors.push({ field: 'metadata.generatedAt', issue: 'Generated timestamp is required', value: undefined });
    }
    
    if (!structure.metadata.requestId) {
      errors.push({ field: 'metadata.requestId', issue: 'Request ID is required', value: undefined });
    }
    
    if (!structure.metadata.version) {
      errors.push({ field: 'metadata.version', issue: 'Version is required', value: undefined });
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate Excel output structure
 */
export interface ExcelOutputStructure {
  sheets: ExcelSheet[];
  metadata: {
    generatedAt: string;
    requestId: string;
    version: string;
  };
}

export interface ExcelSheet {
  name: string;
  headers: string[];
  rows: (string | number)[][];
}

/**
 * Validate Excel structure
 */
export function validateExcelStructure(structure: ExcelOutputStructure): OutputValidationResult {
  const errors: Array<{ field: string; issue: string; value: any }> = [];
  
  if (!Array.isArray(structure.sheets)) {
    errors.push({ field: 'sheets', issue: 'Sheets must be an array', value: typeof structure.sheets });
  } else if (structure.sheets.length === 0) {
    errors.push({ field: 'sheets', issue: 'At least one sheet is required', value: structure.sheets });
  } else {
    structure.sheets.forEach((sheet, i) => {
      if (!sheet.name || sheet.name.trim().length === 0) {
        errors.push({ field: `sheets[${i}].name`, issue: 'Sheet name is required', value: sheet.name });
      }
      
      if (!Array.isArray(sheet.headers)) {
        errors.push({ field: `sheets[${i}].headers`, issue: 'Headers must be an array', value: typeof sheet.headers });
      }
      
      if (!Array.isArray(sheet.rows)) {
        errors.push({ field: `sheets[${i}].rows`, issue: 'Rows must be an array', value: typeof sheet.rows });
      }
    });
  }
  
  if (!structure.metadata) {
    errors.push({ field: 'metadata', issue: 'Metadata is required', value: undefined });
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
