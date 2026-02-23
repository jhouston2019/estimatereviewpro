/**
 * XACTIMATE PARSER
 * Converts raw estimate text into structured JSON
 * Uses line segmentation and column splitting (not regex guessing)
 * Returns validation score and confidence level
 */

// Xactimate trade codes (expanded list)
const TRADE_CODES: Record<string, string> = {
  // Structural
  'DRY': 'Drywall',
  'FRM': 'Framing',
  'FND': 'Foundation',
  'MAS': 'Masonry',
  'STL': 'Structural Steel',
  'CON': 'Concrete',
  
  // Exterior
  'RFG': 'Roofing',
  'SID': 'Siding',
  'STU': 'Stucco',
  'WIN': 'Windows',
  'DOR': 'Doors',
  'DEC': 'Decks',
  'FEN': 'Fencing',
  
  // Interior Finishes
  'PNT': 'Painting',
  'FLR': 'Flooring',
  'CAB': 'Cabinets',
  'CTR': 'Countertops',
  'TIL': 'Tile',
  'CRP': 'Carpet',
  'VCT': 'Vinyl',
  'WDP': 'Wood Flooring',
  
  // Mechanical
  'PLM': 'Plumbing',
  'ELE': 'Electrical',
  'HVA': 'HVAC',
  'MEP': 'Mechanical/Electrical/Plumbing',
  
  // Specialty
  'INS': 'Insulation',
  'MIR': 'Mirrors',
  'MLD': 'Molding/Trim',
  'CEI': 'Ceiling',
  'CLN': 'Cleaning',
  'DEM': 'Demolition',
  'HAU': 'Haul Away',
  'COD': 'Code Upgrade',
  'PER': 'Permit',
  'TMP': 'Temporary',
  'EQP': 'Equipment',
  'MIT': 'Mitigation',
  'DET': 'Detach/Reset',
  'STO': 'Storage',
  'PRO': 'Protection',
  'SUP': 'Supervision',
  'GEN': 'General Conditions'
};

// Xactimate units
const XACTIMATE_UNITS = [
  'SF', 'LF', 'SY', 'CY', 'EA', 'PR', 'SQ', 'GAL', 'HR', 'LS', 'TON', 'MBF', 'MLF'
];

// Action types
type ActionType = 'REMOVE' | 'REPLACE' | 'INSTALL' | 'REPAIR' | 'CLEAN' | 'OTHER';

interface LineItem {
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
  lineNumber?: number;
  rawLine?: string;
}

interface ParsedEstimate {
  lineItems: LineItem[];
  totals: {
    rcv: number;
    acv: number;
    depreciation: number;
    tax: number;
  };
  metadata: {
    confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'FAILED';
    validationScore: number;
    detectedFormat: string;
    lineCount: number;
    parsedCount: number;
    warnings: string[];
  };
}

/**
 * Detect action type from description
 */
function detectActionType(description: string): ActionType {
  const lower = description.toLowerCase();
  
  if (lower.includes('remove') || lower.includes('demo') || lower.includes('tear out')) {
    return 'REMOVE';
  }
  if (lower.includes('replace') || lower.includes('r&r')) {
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
 * Detect trade code from description
 */
function detectTradeCode(description: string): { code: string; name: string } | null {
  const upper = description.toUpperCase();
  
  // Check for explicit trade codes
  for (const [code, name] of Object.entries(TRADE_CODES)) {
    if (upper.includes(code)) {
      return { code, name };
    }
  }
  
  // Check for trade names
  const lower = description.toLowerCase();
  if (lower.includes('drywall') || lower.includes('sheetrock')) {
    return { code: 'DRY', name: 'Drywall' };
  }
  if (lower.includes('paint')) {
    return { code: 'PNT', name: 'Painting' };
  }
  if (lower.includes('roof')) {
    return { code: 'RFG', name: 'Roofing' };
  }
  if (lower.includes('floor')) {
    return { code: 'FLR', name: 'Flooring' };
  }
  if (lower.includes('carpet')) {
    return { code: 'CRP', name: 'Carpet' };
  }
  if (lower.includes('insulation')) {
    return { code: 'INS', name: 'Insulation' };
  }
  if (lower.includes('plumb')) {
    return { code: 'PLM', name: 'Plumbing' };
  }
  if (lower.includes('electric')) {
    return { code: 'ELE', name: 'Electrical' };
  }
  if (lower.includes('hvac') || lower.includes('heating') || lower.includes('cooling')) {
    return { code: 'HVA', name: 'HVAC' };
  }
  if (lower.includes('cabinet')) {
    return { code: 'CAB', name: 'Cabinets' };
  }
  if (lower.includes('counter')) {
    return { code: 'CTR', name: 'Countertops' };
  }
  if (lower.includes('tile')) {
    return { code: 'TIL', name: 'Tile' };
  }
  if (lower.includes('window')) {
    return { code: 'WIN', name: 'Windows' };
  }
  if (lower.includes('door')) {
    return { code: 'DOR', name: 'Doors' };
  }
  if (lower.includes('frame') || lower.includes('framing')) {
    return { code: 'FRM', name: 'Framing' };
  }
  if (lower.includes('siding')) {
    return { code: 'SID', name: 'Siding' };
  }
  if (lower.includes('molding') || lower.includes('trim') || lower.includes('baseboard')) {
    return { code: 'MLD', name: 'Molding/Trim' };
  }
  
  return null;
}

/**
 * Extract numeric value from string
 */
function extractNumber(str: string): number {
  if (!str) return 0;
  
  // Remove currency symbols and commas
  const cleaned = str.replace(/[$,]/g, '').trim();
  const num = parseFloat(cleaned);
  
  return isNaN(num) ? 0 : num;
}

/**
 * Parse a single line item
 */
function parseLineItem(line: string, lineNumber: number): LineItem | null {
  try {
    // Split by multiple spaces or tabs
    const parts = line.split(/\s{2,}|\t+/).map(p => p.trim()).filter(p => p);
    
    if (parts.length < 3) {
      return null; // Not enough data
    }
    
    // Try to identify columns
    let description = '';
    let quantity = 0;
    let unit = '';
    let rcv = 0;
    let acv = 0;
    
    // Look for description (usually first or contains text)
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      // Check if it's a description (contains letters and is long enough)
      if (part.length > 5 && /[a-zA-Z]/.test(part) && !XACTIMATE_UNITS.includes(part.toUpperCase())) {
        description = part;
        continue;
      }
      
      // Check if it's a unit
      if (XACTIMATE_UNITS.includes(part.toUpperCase())) {
        unit = part.toUpperCase();
        continue;
      }
      
      // Check if it's a number
      const num = extractNumber(part);
      if (num > 0) {
        // Heuristic: small numbers are likely quantities, large numbers are prices
        if (num < 10000 && quantity === 0 && !part.includes('$')) {
          quantity = num;
        } else if (part.includes('$') || num > 10) {
          if (rcv === 0) {
            rcv = num;
          } else if (acv === 0) {
            acv = num;
          }
        }
      }
    }
    
    // Must have at least description
    if (!description) {
      return null;
    }
    
    // Detect trade
    const trade = detectTradeCode(description);
    if (!trade) {
      return null; // Can't identify trade
    }
    
    // Calculate depreciation
    const depreciation = rcv - acv;
    
    // Detect O&P (overhead & profit)
    const hasOP = description.toLowerCase().includes('o&p') || 
                  description.toLowerCase().includes('overhead');
    
    return {
      tradeCode: trade.code,
      tradeName: trade.name,
      description,
      quantity: quantity || 1,
      unit: unit || 'EA',
      rcv,
      acv: acv || rcv,
      depreciation: depreciation > 0 ? depreciation : 0,
      tax: 0, // Calculate separately if needed
      overhead: hasOP,
      profit: hasOP,
      actionType: detectActionType(description),
      lineNumber,
      rawLine: line
    };
    
  } catch (error) {
    console.error(`Failed to parse line ${lineNumber}:`, error);
    return null;
  }
}

/**
 * Main parser function
 */
export function parseXactimateEstimate(text: string): ParsedEstimate {
  const lines = text.split('\n');
  const lineItems: LineItem[] = [];
  const warnings: string[] = [];
  
  let totalRCV = 0;
  let totalACV = 0;
  let totalDepreciation = 0;
  let totalTax = 0;
  
  // Parse each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and headers
    if (!line || line.length < 10) continue;
    if (line.toLowerCase().includes('description') || 
        line.toLowerCase().includes('quantity') ||
        line.toLowerCase().includes('total')) {
      continue;
    }
    
    const item = parseLineItem(line, i + 1);
    if (item) {
      lineItems.push(item);
      totalRCV += item.rcv;
      totalACV += item.acv;
      totalDepreciation += item.depreciation;
      totalTax += item.tax;
    }
  }
  
  // Calculate confidence
  const parsedRatio = lineItems.length / Math.max(lines.length, 1);
  let confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'FAILED';
  
  if (lineItems.length === 0) {
    confidence = 'FAILED';
    warnings.push('No line items could be parsed');
  } else if (parsedRatio > 0.3) {
    confidence = 'HIGH';
  } else if (parsedRatio > 0.15) {
    confidence = 'MEDIUM';
    warnings.push('Low parsing ratio - some lines may have been skipped');
  } else {
    confidence = 'LOW';
    warnings.push('Very low parsing ratio - format may not be standard Xactimate');
  }
  
  // Validation score (0-100)
  const validationScore = Math.min(100, Math.round(parsedRatio * 100 + lineItems.length));
  
  // Reject if confidence too low
  if (confidence === 'FAILED' || (confidence === 'LOW' && validationScore < 25)) {
    return {
      lineItems: [],
      totals: { rcv: 0, acv: 0, depreciation: 0, tax: 0 },
      metadata: {
        confidence: 'FAILED',
        validationScore: 0,
        detectedFormat: 'UNKNOWN',
        lineCount: lines.length,
        parsedCount: 0,
        warnings: ['Parsing confidence below threshold - format not recognized']
      }
    };
  }
  
  return {
    lineItems,
    totals: {
      rcv: totalRCV,
      acv: totalACV,
      depreciation: totalDepreciation,
      tax: totalTax
    },
    metadata: {
      confidence,
      validationScore,
      detectedFormat: 'XACTIMATE',
      lineCount: lines.length,
      parsedCount: lineItems.length,
      warnings
    }
  };
}

/**
 * Export types
 */
export type { LineItem, ParsedEstimate, ActionType };
export { TRADE_CODES, XACTIMATE_UNITS };
