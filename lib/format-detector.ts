/**
 * FORMAT DETECTION ENGINE
 * Detects if input is standard Xactimate format
 * NO GUESSING - rejects unknown formats
 */

import { NormalizedInput } from './input-normalizer';

export type EstimateFormat = 'XACTIMATE_STANDARD' | 'XACTIMATE_TEXT' | 'UNKNOWN';

export interface FormatDetection {
  format: EstimateFormat;
  confidence: number;
  columnPattern: ColumnPattern | null;
  metadata: {
    hasTradeCode: boolean;
    hasQuantityColumn: boolean;
    hasUnitColumn: boolean;
    hasPriceColumns: boolean;
    detectedColumns: string[];
    warnings: string[];
  };
}

export interface ColumnPattern {
  tradeCodeIndex: number;
  descriptionIndex: number;
  quantityIndex: number;
  unitIndex: number;
  rcvIndex: number;
  acvIndex: number;
  columnCount: number;
}

/**
 * Xactimate trade codes (for detection)
 */
const XACTIMATE_TRADE_CODES = [
  'DRY', 'FRM', 'RFG', 'PNT', 'FLR', 'CRP', 'INS', 'ELE', 'PLM', 'HVA',
  'CAB', 'CTR', 'TIL', 'MLD', 'WIN', 'DOR', 'SID', 'DEM', 'HAU', 'CLN',
  'MIT', 'EQP', 'PER', 'DET', 'VCT', 'WDP', 'CEI', 'MAS', 'STL', 'CON'
];

/**
 * Xactimate units
 */
const XACTIMATE_UNITS = [
  'SF', 'LF', 'SY', 'CY', 'EA', 'PR', 'SQ', 'GAL', 'HR', 'LS', 'TON', 'MBF', 'MLF'
];

/**
 * Check if token is a trade code
 */
function isTradeCode(token: string): boolean {
  return XACTIMATE_TRADE_CODES.includes(token.toUpperCase().trim());
}

/**
 * Check if token is a unit
 */
function isUnit(token: string): boolean {
  return XACTIMATE_UNITS.includes(token.toUpperCase().trim());
}

/**
 * Check if token is a price (contains $ or is large number)
 */
function isPrice(token: string): boolean {
  return token.includes('$') || /^\d{3,}\.?\d*$/.test(token);
}

/**
 * Check if token is a quantity (small number without $)
 */
function isQuantity(token: string): boolean {
  return /^\d{1,5}\.?\d*$/.test(token) && !token.includes('$');
}

/**
 * Detect column pattern from sample lines
 */
function detectColumnPattern(lines: string[]): ColumnPattern | null {
  // Take first 5 lines as sample
  const sampleLines = lines.slice(0, Math.min(5, lines.length));
  
  // Analyze each line to find consistent column positions
  const columnAnalysis: Array<{
    tradeCodePos: number;
    descriptionPos: number;
    quantityPos: number;
    unitPos: number;
    rcvPos: number;
    acvPos: number;
  }> = [];
  
  for (const line of sampleLines) {
    // Split by multiple spaces or tabs (column separator)
    const tokens = line.split(/\s{2,}|\t+/).map(t => t.trim()).filter(t => t);
    
    if (tokens.length < 4) continue; // Not enough columns
    
    let tradeCodePos = -1;
    let descriptionPos = -1;
    let quantityPos = -1;
    let unitPos = -1;
    let rcvPos = -1;
    let acvPos = -1;
    
    // Identify each token
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      
      if (isTradeCode(token) && tradeCodePos === -1) {
        tradeCodePos = i;
      } else if (isUnit(token) && unitPos === -1) {
        unitPos = i;
      } else if (isQuantity(token) && quantityPos === -1) {
        quantityPos = i;
      } else if (isPrice(token)) {
        if (rcvPos === -1) {
          rcvPos = i;
        } else if (acvPos === -1) {
          acvPos = i;
        }
      } else if (token.length > 5 && /[a-zA-Z]/.test(token) && descriptionPos === -1) {
        descriptionPos = i;
      }
    }
    
    // Only add if we found key columns
    if (tradeCodePos >= 0 && quantityPos >= 0 && rcvPos >= 0) {
      columnAnalysis.push({
        tradeCodePos,
        descriptionPos,
        quantityPos,
        unitPos,
        rcvPos,
        acvPos
      });
    }
  }
  
  // Need at least 3 consistent lines
  if (columnAnalysis.length < 3) {
    return null;
  }
  
  // Check for consistency (all positions should be similar)
  const avgTradeCodePos = Math.round(
    columnAnalysis.reduce((sum, a) => sum + a.tradeCodePos, 0) / columnAnalysis.length
  );
  const avgQuantityPos = Math.round(
    columnAnalysis.reduce((sum, a) => sum + a.quantityPos, 0) / columnAnalysis.length
  );
  const avgUnitPos = Math.round(
    columnAnalysis.reduce((sum, a) => sum + a.unitPos, 0) / columnAnalysis.length
  );
  const avgRcvPos = Math.round(
    columnAnalysis.reduce((sum, a) => sum + a.rcvPos, 0) / columnAnalysis.length
  );
  
  // Verify consistency (variance should be low)
  const tradeCodeVariance = columnAnalysis.every(a => Math.abs(a.tradeCodePos - avgTradeCodePos) <= 1);
  const quantityVariance = columnAnalysis.every(a => Math.abs(a.quantityPos - avgQuantityPos) <= 1);
  
  if (!tradeCodeVariance || !quantityVariance) {
    return null; // Inconsistent format
  }
  
  return {
    tradeCodeIndex: avgTradeCodePos,
    descriptionIndex: avgTradeCodePos + 1, // Usually right after trade code
    quantityIndex: avgQuantityPos,
    unitIndex: avgUnitPos,
    rcvIndex: avgRcvPos,
    acvIndex: avgRcvPos + 1, // Usually right after RCV
    columnCount: Math.max(avgTradeCodePos, avgQuantityPos, avgUnitPos, avgRcvPos) + 2
  };
}

/**
 * Detect format from normalized input
 */
export function detectFormat(input: NormalizedInput): FormatDetection {
  const warnings: string[] = [];
  
  // Check for trade codes
  const linesWithTradeCodes = input.lines.filter(line => {
    const tokens = line.split(/\s{2,}|\t+/).map(t => t.trim()).filter(t => t);
    return tokens.some(token => isTradeCode(token));
  });
  
  const hasTradeCode = linesWithTradeCodes.length >= 3;
  
  // Check for units
  const linesWithUnits = input.lines.filter(line => {
    const tokens = line.split(/\s{2,}|\t+/).map(t => t.trim()).filter(t => t);
    return tokens.some(token => isUnit(token));
  });
  
  const hasUnitColumn = linesWithUnits.length >= 3;
  
  // Check for prices
  const linesWithPrices = input.lines.filter(line => {
    return /\$\d+/.test(line) || /\d{3,}\.\d{2}/.test(line);
  });
  
  const hasPriceColumns = linesWithPrices.length >= 3;
  
  // Check for quantities
  const linesWithQuantities = input.lines.filter(line => {
    const tokens = line.split(/\s{2,}|\t+/).map(t => t.trim()).filter(t => t);
    return tokens.some(token => isQuantity(token));
  });
  
  const hasQuantityColumn = linesWithQuantities.length >= 3;
  
  // Detect column pattern
  const columnPattern = detectColumnPattern(input.lines);
  
  // Determine format
  let format: EstimateFormat = 'UNKNOWN';
  let confidence = 0;
  
  if (hasTradeCode && hasQuantityColumn && hasUnitColumn && hasPriceColumns && columnPattern) {
    format = 'XACTIMATE_STANDARD';
    confidence = 0.95;
  } else if (hasTradeCode && hasQuantityColumn && hasPriceColumns && columnPattern) {
    format = 'XACTIMATE_TEXT';
    confidence = 0.85;
    warnings.push('Unit column not consistently detected');
  } else if (hasTradeCode && hasQuantityColumn) {
    format = 'XACTIMATE_TEXT';
    confidence = 0.70;
    warnings.push('Price columns not consistently detected');
  } else {
    format = 'UNKNOWN';
    confidence = 0;
    warnings.push('Format does not match Xactimate patterns');
    warnings.push(`Trade codes: ${hasTradeCode}, Quantities: ${hasQuantityColumn}, Units: ${hasUnitColumn}, Prices: ${hasPriceColumns}`);
  }
  
  const detectedColumns: string[] = [];
  if (hasTradeCode) detectedColumns.push('TRADE_CODE');
  if (hasQuantityColumn) detectedColumns.push('QUANTITY');
  if (hasUnitColumn) detectedColumns.push('UNIT');
  if (hasPriceColumns) detectedColumns.push('PRICE');
  
  return {
    format,
    confidence,
    columnPattern,
    metadata: {
      hasTradeCode,
      hasQuantityColumn,
      hasUnitColumn,
      hasPriceColumns,
      detectedColumns,
      warnings
    }
  };
}

/**
 * Validate format detection
 */
export function validateFormatDetection(detection: FormatDetection): boolean {
  if (detection.format === 'UNKNOWN') {
    throw new Error(
      'Estimate format not recognized. This system only processes standard Xactimate exports. ' +
      `Detected columns: ${detection.metadata.detectedColumns.join(', ')}. ` +
      `Warnings: ${detection.metadata.warnings.join(', ')}`
    );
  }
  
  if (detection.confidence < 0.70) {
    throw new Error(
      `Format detection confidence too low: ${detection.confidence.toFixed(2)} (minimum 0.70). ` +
      `Format: ${detection.format}. ` +
      `Warnings: ${detection.metadata.warnings.join(', ')}`
    );
  }
  
  if (!detection.columnPattern) {
    throw new Error(
      'Column pattern could not be detected. Estimate may have inconsistent formatting.'
    );
  }
  
  return true;
}
