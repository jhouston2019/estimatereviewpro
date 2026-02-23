/**
 * EXPERT REPORT PARSER
 * Extracts directives from engineering, hygienist, and environmental reports
 * NO GUESSING - only extracts explicit measurable directives
 */

export type ReportType = 'ENGINEERING' | 'HYGIENIST' | 'ENVIRONMENTAL' | 'STRUCTURAL' | 'MOLD' | 'OTHER';
export type DirectiveType = 'REMOVE' | 'REPLACE' | 'INSTALL' | 'TREAT' | 'TEST' | 'MONITOR';

export interface ReportDirective {
  trade: string;
  tradeName: string;
  directive: string;
  directiveType: DirectiveType;
  measurable: boolean;
  quantityRule?: 'FULL_HEIGHT' | '2FT_CUT' | '4FT_CUT' | '6FT_CUT' | 'CEILING_ONLY' | 'SPECIFIC_AREA';
  specificQuantity?: {
    value: number;
    unit: string;
  };
  location?: string;
  reason?: string;
  priority: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  pageNumber?: number;
  rawText: string;
}

export interface ParsedReport {
  reportType: ReportType;
  reportDate?: string;
  author?: string;
  directives: ReportDirective[];
  summary: string;
  metadata: {
    totalPages: number;
    extractedDirectives: number;
    measurableDirectives: number;
    confidence: number;
    warnings: string[];
  };
}

/**
 * Trade code mapping
 */
const TRADE_MAPPING: Record<string, { code: string; name: string }> = {
  'drywall': { code: 'DRY', name: 'Drywall' },
  'insulation': { code: 'INS', name: 'Insulation' },
  'flooring': { code: 'FLR', name: 'Flooring' },
  'carpet': { code: 'CRP', name: 'Carpet' },
  'roofing': { code: 'RFG', name: 'Roofing' },
  'roof': { code: 'RFG', name: 'Roofing' },
  'decking': { code: 'RFG', name: 'Roofing' },
  'sheathing': { code: 'RFG', name: 'Roofing' },
  'framing': { code: 'FRM', name: 'Framing' },
  'structural': { code: 'FRM', name: 'Framing' },
  'electrical': { code: 'ELE', name: 'Electrical' },
  'plumbing': { code: 'PLM', name: 'Plumbing' },
  'hvac': { code: 'HVA', name: 'HVAC' },
  'painting': { code: 'PNT', name: 'Painting' },
  'paint': { code: 'PNT', name: 'Painting' },
  'cabinets': { code: 'CAB', name: 'Cabinets' },
  'countertops': { code: 'CTR', name: 'Countertops' },
  'tile': { code: 'TIL', name: 'Tile' },
  'molding': { code: 'MLD', name: 'Molding/Trim' },
  'trim': { code: 'MLD', name: 'Molding/Trim' },
  'baseboard': { code: 'MLD', name: 'Molding/Trim' },
  'ceiling': { code: 'CEI', name: 'Ceiling' }
};

/**
 * Directive patterns
 */
const DIRECTIVE_PATTERNS = [
  // Height-based removal
  {
    pattern: /remove.*?(?:drywall|sheetrock).*?(\d+)\s*(?:ft|feet|foot|')/i,
    type: 'REMOVE' as DirectiveType,
    measurable: true,
    quantityExtractor: (match: RegExpMatchArray) => {
      const height = parseInt(match[1]);
      if (height === 2) return '2FT_CUT';
      if (height === 4) return '4FT_CUT';
      if (height === 6) return '6FT_CUT';
      return 'SPECIFIC_AREA';
    }
  },
  
  // Full height
  {
    pattern: /remove.*?(?:drywall|sheetrock).*?(?:full height|floor to ceiling|entire wall)/i,
    type: 'REMOVE' as DirectiveType,
    measurable: true,
    quantityExtractor: () => 'FULL_HEIGHT'
  },
  
  // Insulation removal
  {
    pattern: /remove.*?(?:all|entire)?.*?insulation/i,
    type: 'REMOVE' as DirectiveType,
    measurable: true,
    quantityExtractor: () => 'FULL_HEIGHT'
  },
  
  // Roof decking
  {
    pattern: /replace.*?(?:roof\s+)?(?:decking|sheathing)/i,
    type: 'REPLACE' as DirectiveType,
    measurable: true,
    quantityExtractor: () => 'SPECIFIC_AREA'
  },
  
  // Flooring removal
  {
    pattern: /remove.*?(?:flooring|carpet|vinyl|tile)/i,
    type: 'REMOVE' as DirectiveType,
    measurable: true,
    quantityExtractor: () => 'SPECIFIC_AREA'
  },
  
  // Ceiling replacement
  {
    pattern: /replace.*?ceiling/i,
    type: 'REPLACE' as DirectiveType,
    measurable: true,
    quantityExtractor: () => 'CEILING_ONLY'
  }
];

/**
 * Extract trade from text
 */
function extractTrade(text: string): { code: string; name: string } | null {
  const lower = text.toLowerCase();
  
  for (const [keyword, trade] of Object.entries(TRADE_MAPPING)) {
    if (lower.includes(keyword)) {
      return trade;
    }
  }
  
  return null;
}

/**
 * Determine priority from text
 */
function determinePriority(text: string): 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' {
  const lower = text.toLowerCase();
  
  if (lower.includes('immediate') || lower.includes('critical') || lower.includes('urgent')) {
    return 'CRITICAL';
  }
  
  if (lower.includes('recommend') || lower.includes('should') || lower.includes('necessary')) {
    return 'HIGH';
  }
  
  if (lower.includes('consider') || lower.includes('may')) {
    return 'MODERATE';
  }
  
  return 'LOW';
}

/**
 * Extract directives from text
 */
function extractDirectives(text: string, pageNumber?: number): ReportDirective[] {
  const directives: ReportDirective[] = [];
  
  // Split into sentences
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
  
  for (const sentence of sentences) {
    // Check each pattern
    for (const pattern of DIRECTIVE_PATTERNS) {
      const match = sentence.match(pattern.pattern);
      
      if (match) {
        const trade = extractTrade(sentence);
        
        if (trade) {
          const quantityRule = pattern.quantityExtractor(match);
          const priority = determinePriority(sentence);
          
          directives.push({
            trade: trade.code,
            tradeName: trade.name,
            directive: sentence,
            directiveType: pattern.type,
            measurable: pattern.measurable,
            quantityRule: quantityRule as any,
            priority,
            pageNumber,
            rawText: sentence
          });
        }
      }
    }
  }
  
  return directives;
}

/**
 * Detect report type from text
 */
function detectReportType(text: string): ReportType {
  const lower = text.toLowerCase();
  
  if (lower.includes('structural engineer') || lower.includes('engineering report')) {
    return 'ENGINEERING';
  }
  
  if (lower.includes('industrial hygienist') || lower.includes('hygiene report')) {
    return 'HYGIENIST';
  }
  
  if (lower.includes('environmental') || lower.includes('mold assessment')) {
    return 'ENVIRONMENTAL';
  }
  
  if (lower.includes('mold') || lower.includes('microbial')) {
    return 'MOLD';
  }
  
  if (lower.includes('structural damage') || lower.includes('structural assessment')) {
    return 'STRUCTURAL';
  }
  
  return 'OTHER';
}

/**
 * Parse expert report from text
 */
export async function parseExpertReport(
  pdfBuffer: Buffer
): Promise<ParsedReport> {
  
  try {
    // Dynamic import of pdf-parse
    const pdfParse = require('pdf-parse');
    
    // Extract text
    const data = await pdfParse(pdfBuffer);
    
    if (!data || !data.text) {
      throw new Error('Failed to extract text from PDF');
    }
    
    const text = data.text;
    const totalPages = data.numpages || 0;
    
    // Detect report type
    const reportType = detectReportType(text);
    
    // Extract directives
    const directives = extractDirectives(text);
    
    // Calculate confidence
    const measurableDirectives = directives.filter(d => d.measurable).length;
    const confidence = directives.length > 0 ? Math.min(1.0, directives.length / 10) : 0;
    
    // Generate summary
    const summary = directives.length > 0
      ? `Extracted ${directives.length} directive(s), ${measurableDirectives} measurable.`
      : 'No explicit directives found in report.';
    
    // Warnings
    const warnings: string[] = [];
    
    if (directives.length === 0) {
      warnings.push('No directives extracted - report may not contain specific recommendations');
    }
    
    if (measurableDirectives === 0 && directives.length > 0) {
      warnings.push('Directives found but none are measurable');
    }
    
    if (text.length < 500) {
      warnings.push('Report text is very short - extraction may be incomplete');
    }
    
    return {
      reportType,
      directives,
      summary,
      metadata: {
        totalPages,
        extractedDirectives: directives.length,
        measurableDirectives,
        confidence,
        warnings
      }
    };
    
  } catch (error: any) {
    throw new Error(`Report parsing failed: ${error.message}`);
  }
}

/**
 * Parse from text (for testing)
 */
export function parseReportFromText(text: string): ParsedReport {
  const reportType = detectReportType(text);
  const directives = extractDirectives(text);
  const measurableDirectives = directives.filter(d => d.measurable).length;
  const confidence = directives.length > 0 ? Math.min(1.0, directives.length / 10) : 0;
  
  const summary = directives.length > 0
    ? `Extracted ${directives.length} directive(s), ${measurableDirectives} measurable.`
    : 'No explicit directives found in report.';
  
  const warnings: string[] = [];
  
  if (directives.length === 0) {
    warnings.push('No directives extracted');
  }
  
  return {
    reportType,
    directives,
    summary,
    metadata: {
      totalPages: 1,
      extractedDirectives: directives.length,
      measurableDirectives,
      confidence,
      warnings
    }
  };
}

/**
 * Validate parsed report
 */
export function validateParsedReport(report: ParsedReport): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (report.metadata.extractedDirectives === 0) {
    errors.push('No directives extracted from report');
  }
  
  if (report.metadata.measurableDirectives === 0) {
    errors.push('No measurable directives found');
  }
  
  if (report.metadata.confidence < 0.3) {
    errors.push(`Low extraction confidence: ${(report.metadata.confidence * 100).toFixed(1)}%`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
