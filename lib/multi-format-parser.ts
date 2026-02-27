/**
 * MULTI-FORMAT PARSER
 * Detects and routes to appropriate parser based on estimate format
 * Supports: Standard, Xactimate, Tabular, Compact
 */

import { parseXactimateEstimate, ParsedEstimate } from './xactimate-parser';

export type EstimateFormat = 'XACTIMATE' | 'STANDARD' | 'TABULAR' | 'COMPACT' | 'UNKNOWN';

export interface FormatDetection {
  format: EstimateFormat;
  confidence: number; // 0.0 - 1.0
  indicators: string[];
  metadata: {
    hasTradeCode: boolean;
    hasUnits: boolean;
    hasQuantities: boolean;
    hasPricing: boolean;
    hasTableStructure: boolean;
    lineCount: number;
  };
}

/**
 * Detect estimate format with confidence scoring
 */
export function detectFormat(text: string): FormatDetection {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const lineCount = lines.length;
  
  // Xactimate indicators
  const xactimateScore = calculateXactimateScore(text, lines);
  
  // Standard format indicators
  const standardScore = calculateStandardScore(text, lines);
  
  // Tabular format indicators
  const tabularScore = calculateTabularScore(text, lines);
  
  // Compact format indicators
  const compactScore = calculateCompactScore(text, lines);
  
  // Determine format based on highest score
  const scores = [
    { format: 'XACTIMATE' as EstimateFormat, score: xactimateScore.score, indicators: xactimateScore.indicators },
    { format: 'STANDARD' as EstimateFormat, score: standardScore.score, indicators: standardScore.indicators },
    { format: 'TABULAR' as EstimateFormat, score: tabularScore.score, indicators: tabularScore.indicators },
    { format: 'COMPACT' as EstimateFormat, score: compactScore.score, indicators: compactScore.indicators },
  ];
  
  scores.sort((a, b) => b.score - a.score);
  const winner = scores[0];
  
  // Require minimum confidence of 0.6
  if (winner.score < 0.6) {
    return {
      format: 'UNKNOWN',
      confidence: winner.score,
      indicators: ['Format not recognized with sufficient confidence'],
      metadata: extractMetadata(text, lines),
    };
  }
  
  return {
    format: winner.format,
    confidence: winner.score,
    indicators: winner.indicators,
    metadata: extractMetadata(text, lines),
  };
}

/**
 * Calculate Xactimate format score
 */
function calculateXactimateScore(text: string, lines: string[]): { score: number; indicators: string[] } {
  let score = 0;
  const indicators: string[] = [];
  const textLower = text.toLowerCase();
  
  // Trade codes (DRY, PNT, FLR, etc.)
  const tradeCodes = ['dry', 'pnt', 'flr', 'rfg', 'dem', 'ins', 'plm', 'ele', 'hva'];
  const tradeCodeMatches = tradeCodes.filter(code => {
    const pattern = new RegExp(`\\b${code}\\b`, 'i');
    return pattern.test(text);
  });
  
  if (tradeCodeMatches.length >= 3) {
    score += 0.4;
    indicators.push(`${tradeCodeMatches.length} Xactimate trade codes detected`);
  }
  
  // Xactimate units (SF, LF, SQ, EA, etc.)
  const xactimateUnits = ['\\bSF\\b', '\\bLF\\b', '\\bSQ\\b', '\\bEA\\b', '\\bSY\\b', '\\bCY\\b'];
  const unitMatches = xactimateUnits.filter(unit => new RegExp(unit).test(text));
  
  if (unitMatches.length >= 2) {
    score += 0.2;
    indicators.push(`${unitMatches.length} Xactimate units detected`);
  }
  
  // Xactimate keywords
  if (textLower.includes('xactimate') || textLower.includes('xact')) {
    score += 0.15;
    indicators.push('Xactimate keyword found');
  }
  
  // Line item codes (DRY REM, PNT SEAL, etc.)
  const lineItemPattern = /\b[A-Z]{3}\s+[A-Z]{3,4}\b/;
  const lineItemMatches = lines.filter(line => lineItemPattern.test(line));
  
  if (lineItemMatches.length >= 3) {
    score += 0.15;
    indicators.push(`${lineItemMatches.length} Xactimate line item codes detected`);
  }
  
  // Room notation (Living Room - 12x14, etc.)
  const roomPattern = /\b\w+\s+(Room|Bedroom|Bathroom|Kitchen)\s*-\s*\d+x\d+/i;
  const roomMatches = lines.filter(line => roomPattern.test(line));
  
  if (roomMatches.length >= 1) {
    score += 0.1;
    indicators.push(`${roomMatches.length} room notation(s) detected`);
  }
  
  return { score: Math.min(1.0, score), indicators };
}

/**
 * Calculate Standard format score
 */
function calculateStandardScore(text: string, lines: string[]): { score: number; indicators: string[] } {
  let score = 0;
  const indicators: string[] = [];
  
  // Standard format characteristics:
  // - Descriptive line items
  // - Quantity and unit on same line
  // - Price information
  // - No trade codes
  
  // Check for descriptive items (longer descriptions)
  const descriptiveLines = lines.filter(line => {
    const words = line.split(/\s+/).length;
    return words >= 5 && words <= 20;
  });
  
  if (descriptiveLines.length >= lines.length * 0.3) {
    score += 0.3;
    indicators.push('Descriptive line items detected');
  }
  
  // Check for quantity patterns (numbers followed by units)
  const quantityPattern = /\d+\.?\d*\s*(sf|lf|sq|ea|each|linear feet|square feet)/i;
  const quantityMatches = lines.filter(line => quantityPattern.test(line));
  
  if (quantityMatches.length >= 3) {
    score += 0.25;
    indicators.push(`${quantityMatches.length} quantity patterns detected`);
  }
  
  // Check for pricing patterns
  const pricePattern = /\$\s*\d+[,\d]*\.?\d*/;
  const priceMatches = lines.filter(line => pricePattern.test(line));
  
  if (priceMatches.length >= 3) {
    score += 0.25;
    indicators.push(`${priceMatches.length} price patterns detected`);
  }
  
  // Check for common construction terms
  const constructionTerms = ['install', 'remove', 'replace', 'repair', 'paint', 'drywall', 'flooring'];
  const termMatches = constructionTerms.filter(term => 
    new RegExp(term, 'i').test(text)
  );
  
  if (termMatches.length >= 3) {
    score += 0.2;
    indicators.push(`${termMatches.length} construction terms detected`);
  }
  
  return { score: Math.min(1.0, score), indicators };
}

/**
 * Calculate Tabular format score
 */
function calculateTabularScore(text: string, lines: string[]): { score: number; indicators: string[] } {
  let score = 0;
  const indicators: string[] = [];
  
  // Tabular format characteristics:
  // - Multiple tabs or consistent spacing
  // - Column headers
  // - Aligned data
  
  // Check for tab characters
  const tabLines = lines.filter(line => line.includes('\t'));
  if (tabLines.length >= lines.length * 0.5) {
    score += 0.3;
    indicators.push('Tab-delimited format detected');
  }
  
  // Check for column headers
  const headerPattern = /description|quantity|unit|price|total|amount/i;
  const headerLines = lines.slice(0, 5).filter(line => headerPattern.test(line));
  
  if (headerLines.length >= 1) {
    score += 0.25;
    indicators.push('Column headers detected');
  }
  
  // Check for consistent spacing (multiple spaces indicating columns)
  const multiSpaceLines = lines.filter(line => /\s{3,}/.test(line));
  if (multiSpaceLines.length >= lines.length * 0.4) {
    score += 0.25;
    indicators.push('Consistent column spacing detected');
  }
  
  // Check for pipe delimiters
  const pipeLines = lines.filter(line => line.split('|').length >= 3);
  if (pipeLines.length >= lines.length * 0.3) {
    score += 0.2;
    indicators.push('Pipe-delimited format detected');
  }
  
  return { score: Math.min(1.0, score), indicators };
}

/**
 * Calculate Compact format score
 */
function calculateCompactScore(text: string, lines: string[]): { score: number; indicators: string[] } {
  let score = 0;
  const indicators: string[] = [];
  
  // Compact format characteristics:
  // - Short lines
  // - Minimal whitespace
  // - Abbreviated descriptions
  // - Summary format
  
  // Check for short lines
  const shortLines = lines.filter(line => line.length < 50);
  if (shortLines.length >= lines.length * 0.6) {
    score += 0.3;
    indicators.push('Compact line format detected');
  }
  
  // Check for abbreviations
  const abbreviationPattern = /\b[A-Z]{2,4}\b/;
  const abbreviationMatches = lines.filter(line => abbreviationPattern.test(line));
  
  if (abbreviationMatches.length >= lines.length * 0.4) {
    score += 0.25;
    indicators.push('Abbreviated format detected');
  }
  
  // Check for summary keywords
  const summaryKeywords = ['total', 'subtotal', 'summary', 'grand total'];
  const summaryMatches = summaryKeywords.filter(keyword => 
    new RegExp(keyword, 'i').test(text)
  );
  
  if (summaryMatches.length >= 2) {
    score += 0.25;
    indicators.push('Summary format detected');
  }
  
  // Check for minimal line count (compact estimates are shorter)
  if (lines.length < 30) {
    score += 0.2;
    indicators.push('Compact estimate (< 30 lines)');
  }
  
  return { score: Math.min(1.0, score), indicators };
}

/**
 * Extract metadata from text
 */
function extractMetadata(text: string, lines: string[]): FormatDetection['metadata'] {
  const tradeCodes = ['DRY', 'PNT', 'FLR', 'RFG', 'DEM', 'INS', 'PLM', 'ELE', 'HVA'];
  const hasTradeCode = tradeCodes.some(code => new RegExp(`\\b${code}\\b`).test(text));
  
  const units = ['SF', 'LF', 'SQ', 'EA', 'SY', 'CY'];
  const hasUnits = units.some(unit => new RegExp(`\\b${unit}\\b`).test(text));
  
  const hasQuantities = /\d+\.?\d*\s*(sf|lf|sq|ea)/i.test(text);
  const hasPricing = /\$\s*\d+[,\d]*\.?\d*/.test(text);
  
  const hasTableStructure = lines.some(line => line.includes('\t') || /\s{3,}/.test(line));
  
  return {
    hasTradeCode,
    hasUnits,
    hasQuantities,
    hasPricing,
    hasTableStructure,
    lineCount: lines.length,
  };
}

/**
 * Parse estimate based on detected format
 */
export async function parseMultiFormat(text: string): Promise<ParsedEstimate> {
  // Detect format
  const detection = detectFormat(text);
  
  console.log(`[MULTI-FORMAT] Detected format: ${detection.format} (confidence: ${detection.confidence})`);
  console.log(`[MULTI-FORMAT] Indicators:`, detection.indicators);
  
  // Route to appropriate parser
  switch (detection.format) {
    case 'XACTIMATE':
      return parseXactimateEstimate(text);
    
    case 'STANDARD':
      return parseStandardEstimate(text);
    
    case 'TABULAR':
      return parseTabularEstimate(text);
    
    case 'COMPACT':
      return parseCompactEstimate(text);
    
    case 'UNKNOWN':
    default:
      // Fallback to generic parser
      return parseGenericEstimate(text);
  }
}

/**
 * Parse standard format estimate
 */
function parseStandardEstimate(text: string): ParsedEstimate {
  const lines = text.split('\n');
  const lineItems: ParsedEstimate['lineItems'] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.length < 10) continue;
    
    // Skip headers
    if (/description|quantity|unit|price|total/i.test(line)) continue;
    
    // Extract components
    const description = extractDescription(line);
    const quantity = extractQuantity(line);
    const unit = extractUnit(line);
    const price = extractPrice(line);
    
    if (description && quantity > 0) {
      const tradeInfo = detectTradeFromDescription(description);
      
      lineItems.push({
        tradeCode: tradeInfo.code,
        tradeName: tradeInfo.name,
        description,
        quantity,
        unit: unit || 'EA',
        rcv: price,
        acv: price,
        depreciation: 0,
        tax: 0,
        overhead: false,
        profit: false,
        actionType: detectActionType(description),
        lineNumber: i + 1,
        rawLine: line,
      });
    }
  }
  
  const totals = calculateTotals(lineItems);
  
  return {
    lineItems,
    totals,
    metadata: {
      confidence: 'MEDIUM',
      validationScore: 75,
      detectedFormat: 'STANDARD',
      lineCount: lines.length,
      parsedCount: lineItems.length,
      warnings: lineItems.length === 0 ? ['No line items parsed'] : [],
    },
  };
}

/**
 * Parse tabular format estimate
 */
function parseTabularEstimate(text: string): ParsedEstimate {
  const lines = text.split('\n');
  const lineItems: ParsedEstimate['lineItems'] = [];
  
  // Detect delimiter (tab, pipe, or multiple spaces)
  const delimiter = detectDelimiter(lines);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Skip headers
    if (/description|quantity|unit|price|total/i.test(line)) continue;
    
    // Split by delimiter
    const parts = line.split(delimiter).map(p => p.trim()).filter(p => p);
    
    if (parts.length >= 3) {
      const description = parts[0];
      const quantity = parseFloat(parts[1]) || 0;
      const unit = parts[2];
      const price = parts.length >= 4 ? parseFloat(parts[3].replace(/[$,]/g, '')) : 0;
      
      if (description && quantity > 0) {
        const tradeInfo = detectTradeFromDescription(description);
        
        lineItems.push({
          tradeCode: tradeInfo.code,
          tradeName: tradeInfo.name,
          description,
          quantity,
          unit: unit || 'EA',
          rcv: price,
          acv: price,
          depreciation: 0,
          tax: 0,
          overhead: false,
          profit: false,
          actionType: detectActionType(description),
          lineNumber: i + 1,
          rawLine: line,
        });
      }
    }
  }
  
  const totals = calculateTotals(lineItems);
  
  return {
    lineItems,
    totals,
    metadata: {
      confidence: 'HIGH',
      validationScore: 85,
      detectedFormat: 'TABULAR',
      lineCount: lines.length,
      parsedCount: lineItems.length,
      warnings: lineItems.length === 0 ? ['No line items parsed'] : [],
    },
  };
}

/**
 * Parse compact format estimate
 */
function parseCompactEstimate(text: string): ParsedEstimate {
  const lines = text.split('\n');
  const lineItems: ParsedEstimate['lineItems'] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.length < 5) continue;
    
    // Skip summary lines
    if (/total|subtotal|summary/i.test(line)) continue;
    
    // Compact format: "Description - Qty Unit - $Price"
    const compactPattern = /^(.+?)\s*-\s*(\d+\.?\d*)\s*([A-Z]{2,3})\s*-?\s*\$?(\d+[,\d]*\.?\d*)?/i;
    const match = line.match(compactPattern);
    
    if (match) {
      const [, description, quantityStr, unit, priceStr] = match;
      const quantity = parseFloat(quantityStr);
      const price = priceStr ? parseFloat(priceStr.replace(/,/g, '')) : 0;
      
      const tradeInfo = detectTradeFromDescription(description);
      
      lineItems.push({
        tradeCode: tradeInfo.code,
        tradeName: tradeInfo.name,
        description: description.trim(),
        quantity,
        unit: unit.toUpperCase(),
        rcv: price,
        acv: price,
        depreciation: 0,
        tax: 0,
        overhead: false,
        profit: false,
        actionType: detectActionType(description),
        lineNumber: i + 1,
        rawLine: line,
      });
    }
  }
  
  const totals = calculateTotals(lineItems);
  
  return {
    lineItems,
    totals,
    metadata: {
      confidence: 'MEDIUM',
      validationScore: 70,
      detectedFormat: 'COMPACT',
      lineCount: lines.length,
      parsedCount: lineItems.length,
      warnings: lineItems.length === 0 ? ['No line items parsed'] : [],
    },
  };
}

/**
 * Parse generic/unknown format estimate (fallback)
 */
function parseGenericEstimate(text: string): ParsedEstimate {
  const lines = text.split('\n');
  const lineItems: ParsedEstimate['lineItems'] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.length < 10) continue;
    
    // Try to extract any recognizable components
    const hasQuantity = /\d+\.?\d*/.test(line);
    const hasPrice = /\$\s*\d+/.test(line);
    
    if (hasQuantity || hasPrice) {
      const description = extractDescription(line);
      const quantity = extractQuantity(line) || 1;
      const unit = extractUnit(line) || 'EA';
      const price = extractPrice(line);
      
      if (description) {
        const tradeInfo = detectTradeFromDescription(description);
        
        lineItems.push({
          tradeCode: tradeInfo.code,
          tradeName: tradeInfo.name,
          description,
          quantity,
          unit,
          rcv: price,
          acv: price,
          depreciation: 0,
          tax: 0,
          overhead: false,
          profit: false,
          actionType: detectActionType(description),
          lineNumber: i + 1,
          rawLine: line,
        });
      }
    }
  }
  
  const totals = calculateTotals(lineItems);
  
  return {
    lineItems,
    totals,
    metadata: {
      confidence: 'LOW',
      validationScore: 50,
      detectedFormat: 'GENERIC',
      lineCount: lines.length,
      parsedCount: lineItems.length,
      warnings: ['Format not recognized - using generic parser', 'Results may be incomplete'],
    },
  };
}

// Helper functions

function extractDescription(line: string): string {
  // Remove prices, quantities, and units
  let description = line
    .replace(/\$\s*\d+[,\d]*\.?\d*/g, '')
    .replace(/\d+\.?\d*\s*(SF|LF|SQ|EA|SY|CY|GAL|HR|LS)/gi, '')
    .trim();
  
  return description;
}

function extractQuantity(line: string): number {
  const match = line.match(/(\d+\.?\d*)\s*(SF|LF|SQ|EA|SY|CY|GAL|HR|LS)/i);
  return match ? parseFloat(match[1]) : 0;
}

function extractUnit(line: string): string | null {
  const match = line.match(/\d+\.?\d*\s*(SF|LF|SQ|EA|SY|CY|GAL|HR|LS)/i);
  return match ? match[1].toUpperCase() : null;
}

function extractPrice(line: string): number {
  const match = line.match(/\$\s*(\d+[,\d]*\.?\d*)/);
  return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
}

function detectDelimiter(lines: string[]): RegExp {
  // Check for tabs
  const tabLines = lines.filter(line => line.includes('\t'));
  if (tabLines.length > lines.length * 0.3) {
    return /\t+/;
  }
  
  // Check for pipes
  const pipeLines = lines.filter(line => line.includes('|'));
  if (pipeLines.length > lines.length * 0.3) {
    return /\|/;
  }
  
  // Default to multiple spaces
  return /\s{2,}/;
}

function detectTradeFromDescription(description: string): { code: string; name: string } {
  const lower = description.toLowerCase();
  
  if (lower.includes('drywall') || lower.includes('sheetrock')) return { code: 'DRY', name: 'Drywall' };
  if (lower.includes('paint')) return { code: 'PNT', name: 'Painting' };
  if (lower.includes('floor') || lower.includes('carpet')) return { code: 'FLR', name: 'Flooring' };
  if (lower.includes('roof')) return { code: 'RFG', name: 'Roofing' };
  if (lower.includes('demo') || lower.includes('removal')) return { code: 'DEM', name: 'Demolition' };
  if (lower.includes('insulation')) return { code: 'INS', name: 'Insulation' };
  if (lower.includes('plumb')) return { code: 'PLM', name: 'Plumbing' };
  if (lower.includes('electric')) return { code: 'ELE', name: 'Electrical' };
  if (lower.includes('hvac') || lower.includes('heating') || lower.includes('cooling')) return { code: 'HVA', name: 'HVAC' };
  if (lower.includes('cabinet')) return { code: 'CAB', name: 'Cabinets' };
  if (lower.includes('counter')) return { code: 'CTR', name: 'Countertops' };
  if (lower.includes('tile')) return { code: 'TIL', name: 'Tile' };
  if (lower.includes('window')) return { code: 'WIN', name: 'Windows' };
  if (lower.includes('door')) return { code: 'DOR', name: 'Doors' };
  if (lower.includes('frame') || lower.includes('framing')) return { code: 'FRM', name: 'Framing' };
  if (lower.includes('siding')) return { code: 'SID', name: 'Siding' };
  if (lower.includes('molding') || lower.includes('trim') || lower.includes('baseboard')) return { code: 'MLD', name: 'Molding/Trim' };
  
  return { code: 'GEN', name: 'General' };
}

function detectActionType(description: string): 'REMOVE' | 'REPLACE' | 'INSTALL' | 'REPAIR' | 'CLEAN' | 'OTHER' {
  const lower = description.toLowerCase();
  
  if (lower.includes('remove') || lower.includes('demo') || lower.includes('tear out')) return 'REMOVE';
  if (lower.includes('replace') || lower.includes('r&r')) return 'REPLACE';
  if (lower.includes('install') || lower.includes('new')) return 'INSTALL';
  if (lower.includes('repair') || lower.includes('patch')) return 'REPAIR';
  if (lower.includes('clean')) return 'CLEAN';
  
  return 'OTHER';
}

function calculateTotals(lineItems: ParsedEstimate['lineItems']): ParsedEstimate['totals'] {
  return {
    rcv: lineItems.reduce((sum, item) => sum + item.rcv, 0),
    acv: lineItems.reduce((sum, item) => sum + item.acv, 0),
    depreciation: lineItems.reduce((sum, item) => sum + item.depreciation, 0),
    tax: lineItems.reduce((sum, item) => sum + item.tax, 0),
  };
}

export type { ParsedEstimate };
