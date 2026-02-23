/**
 * XACTIMATE STRUCTURAL PARSER
 * Column-mapped parsing using detected column positions
 * NO HEURISTICS - uses locked column boundaries
 * Rejects if column mismatch > 2 fields
 */

import { NormalizedInput } from './input-normalizer';
import { FormatDetection, ColumnPattern } from './format-detector';

export type ActionType = 'REMOVE' | 'REPLACE' | 'INSTALL' | 'REPAIR' | 'CLEAN' | 'OTHER';

export interface StructuredLineItem {
  tradeCode: string;
  tradeName: string;
  description: string;
  quantity: number;
  unit: string;
  rcv: number;
  acv: number;
  depreciation: number;
  tax: number;
  overhead: boolean;
  profit: boolean;
  actionType: ActionType;
  lineNumber: number;
  rawLine: string;
  parseConfidence: number;
}

export interface StructuredEstimate {
  lineItems: StructuredLineItem[];
  totals: {
    rcv: number;
    acv: number;
    depreciation: number;
    tax: number;
  };
  parseConfidence: number;
  metadata: {
    totalLines: number;
    parsedLines: number;
    rejectedLines: number;
    avgLineConfidence: number;
    warnings: string[];
  };
}

/**
 * Trade code to name mapping
 */
const TRADE_NAMES: Record<string, string> = {
  'DRY': 'Drywall',
  'FRM': 'Framing',
  'RFG': 'Roofing',
  'PNT': 'Painting',
  'FLR': 'Flooring',
  'CRP': 'Carpet',
  'INS': 'Insulation',
  'ELE': 'Electrical',
  'PLM': 'Plumbing',
  'HVA': 'HVAC',
  'CAB': 'Cabinets',
  'CTR': 'Countertops',
  'TIL': 'Tile',
  'MLD': 'Molding/Trim',
  'WIN': 'Windows',
  'DOR': 'Doors',
  'SID': 'Siding',
  'DEM': 'Demolition',
  'HAU': 'Haul Away',
  'CLN': 'Cleaning',
  'MIT': 'Mitigation',
  'EQP': 'Equipment',
  'PER': 'Permit',
  'DET': 'Detach/Reset',
  'VCT': 'Vinyl',
  'WDP': 'Wood Flooring',
  'CEI': 'Ceiling',
  'MAS': 'Masonry',
  'STL': 'Structural Steel',
  'CON': 'Concrete',
  'FND': 'Foundation',
  'STU': 'Stucco',
  'DEC': 'Decks',
  'FEN': 'Fencing',
  'MIR': 'Mirrors',
  'COD': 'Code Upgrade',
  'TMP': 'Temporary',
  'STO': 'Storage',
  'PRO': 'Protection',
  'SUP': 'Supervision',
  'GEN': 'General Conditions'
};

/**
 * Extract numeric value strictly
 */
function extractNumber(str: string): number | null {
  if (!str) return null;
  
  // Remove currency symbols and commas
  const cleaned = str.replace(/[$,]/g, '').trim();
  
  // Must be a valid number
  if (!/^\d+\.?\d*$/.test(cleaned)) {
    return null;
  }
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Detect action type from description
 */
function detectActionType(description: string): ActionType {
  const lower = description.toLowerCase();
  
  if (lower.includes('remove') || lower.includes('demo') || lower.includes('tear out') || lower.includes('tear-out')) {
    return 'REMOVE';
  }
  if (lower.includes('replace') || lower.includes('r&r') || lower.includes('r & r')) {
    return 'REPLACE';
  }
  if (lower.includes('install') || lower.includes('new')) {
    return 'INSTALL';
  }
  if (lower.includes('repair') || lower.includes('patch')) {
    return 'REPAIR';
  }
  if (lower.includes('clean')) {
    return 'CLEAN';
  }
  
  return 'OTHER';
}

/**
 * Parse single line using column pattern
 */
function parseLineWithColumns(
  line: string,
  lineNumber: number,
  columnPattern: ColumnPattern
): StructuredLineItem | null {
  
  // Split by multiple spaces or tabs
  const tokens = line.split(/\s{2,}|\t+/).map(t => t.trim()).filter(t => t);
  
  // Must have minimum columns
  if (tokens.length < 4) {
    return null;
  }
  
  let missingFields = 0;
  
  // Extract fields by column index
  const tradeCode = tokens[columnPattern.tradeCodeIndex]?.toUpperCase().trim() || null;
  const description = tokens[columnPattern.descriptionIndex]?.trim() || null;
  const quantityStr = tokens[columnPattern.quantityIndex]?.trim() || null;
  const unit = tokens[columnPattern.unitIndex]?.toUpperCase().trim() || null;
  const rcvStr = tokens[columnPattern.rcvIndex]?.trim() || null;
  const acvStr = tokens[columnPattern.acvIndex]?.trim() || null;
  
  // Validate trade code
  if (!tradeCode || !TRADE_NAMES[tradeCode]) {
    missingFields++;
  }
  
  // Validate description
  if (!description || description.length < 3) {
    missingFields++;
  }
  
  // Extract and validate quantity
  const quantity = quantityStr ? extractNumber(quantityStr) : null;
  if (quantity === null) {
    missingFields++;
  }
  
  // Extract and validate RCV
  const rcv = rcvStr ? extractNumber(rcvStr) : null;
  if (rcv === null) {
    missingFields++;
  }
  
  // Extract ACV (optional)
  const acv = acvStr ? extractNumber(acvStr) : rcv;
  
  // REJECT if more than 2 fields missing
  if (missingFields > 2) {
    return null;
  }
  
  // Calculate line confidence
  const lineConfidence = 1.0 - (missingFields * 0.15);
  
  // Build structured line item
  return {
    tradeCode: tradeCode || 'UNK',
    tradeName: TRADE_NAMES[tradeCode || ''] || 'Unknown',
    description: description || 'Unknown',
    quantity: quantity || 0,
    unit: unit || 'EA',
    rcv: rcv || 0,
    acv: acv || rcv || 0,
    depreciation: (rcv || 0) - (acv || rcv || 0),
    tax: 0, // Calculate separately if needed
    overhead: description?.toLowerCase().includes('o&p') || false,
    profit: description?.toLowerCase().includes('o&p') || false,
    actionType: detectActionType(description || ''),
    lineNumber,
    rawLine: line,
    parseConfidence: lineConfidence
  };
}

/**
 * Main structural parser
 */
export function parseStructuredEstimate(
  input: NormalizedInput,
  formatDetection: FormatDetection
): StructuredEstimate {
  
  if (!formatDetection.columnPattern) {
    throw new Error('Column pattern required for structural parsing');
  }
  
  const lineItems: StructuredLineItem[] = [];
  const warnings: string[] = [];
  let rejectedLines = 0;
  
  // Parse each line using column pattern
  for (let i = 0; i < input.lines.length; i++) {
    const line = input.lines[i];
    
    const item = parseLineWithColumns(line, i + 1, formatDetection.columnPattern);
    
    if (item) {
      lineItems.push(item);
    } else {
      rejectedLines++;
    }
  }
  
  // Calculate totals
  const totalRCV = lineItems.reduce((sum, item) => sum + item.rcv, 0);
  const totalACV = lineItems.reduce((sum, item) => sum + item.acv, 0);
  const totalDepreciation = lineItems.reduce((sum, item) => sum + item.depreciation, 0);
  const totalTax = lineItems.reduce((sum, item) => sum + item.tax, 0);
  
  // Calculate parse confidence
  const parseRatio = lineItems.length / Math.max(input.lines.length, 1);
  const avgLineConfidence = lineItems.length > 0
    ? lineItems.reduce((sum, item) => sum + item.parseConfidence, 0) / lineItems.length
    : 0;
  
  let parseConfidence = parseRatio * avgLineConfidence;
  
  // Warnings
  if (parseRatio < 0.80) {
    warnings.push(`Low parse ratio: ${(parseRatio * 100).toFixed(1)}% (${rejectedLines} lines rejected)`);
  }
  
  if (avgLineConfidence < 0.90) {
    warnings.push(`Low average line confidence: ${(avgLineConfidence * 100).toFixed(1)}%`);
  }
  
  // REJECT if confidence too low
  if (parseConfidence < 0.85) {
    throw new Error(
      `Parse confidence too low: ${(parseConfidence * 100).toFixed(1)}% (minimum 85%). ` +
      `Parsed ${lineItems.length}/${input.lines.length} lines. ` +
      `Warnings: ${warnings.join(', ')}`
    );
  }
  
  return {
    lineItems,
    totals: {
      rcv: Math.round(totalRCV * 100) / 100,
      acv: Math.round(totalACV * 100) / 100,
      depreciation: Math.round(totalDepreciation * 100) / 100,
      tax: Math.round(totalTax * 100) / 100
    },
    parseConfidence,
    metadata: {
      totalLines: input.lines.length,
      parsedLines: lineItems.length,
      rejectedLines,
      avgLineConfidence,
      warnings
    }
  };
}

/**
 * Validate structured estimate
 */
export function validateStructuredEstimate(estimate: StructuredEstimate): boolean {
  if (estimate.lineItems.length === 0) {
    throw new Error('No line items parsed from estimate');
  }
  
  if (estimate.parseConfidence < 0.85) {
    throw new Error(
      `Parse confidence below threshold: ${(estimate.parseConfidence * 100).toFixed(1)}% (minimum 85%)`
    );
  }
  
  if (estimate.totals.rcv === 0) {
    throw new Error('Total RCV is zero - estimate may be incomplete');
  }
  
  return true;
}

export type { ColumnPattern };
