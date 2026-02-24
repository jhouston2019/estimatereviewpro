/**
 * EXPERT INTELLIGENCE ENGINE
 * ENTERPRISE-GRADE EXPERT REPORT PROCESSING
 * 
 * This is NOT a summarizer. This is NOT an interpreter.
 * This is a directive extraction, classification, and enforcement engine.
 * 
 * Extracts measurable remediation directives from expert reports.
 * Classifies by trade, action, scope, and authority.
 * Maps to room geometry for deterministic variance calculation.
 * Detects compliance standards and conditional logic.
 * Quantifies financial exposure with full audit trail.
 */

import { StructuredEstimate } from './xactimate-structural-parser';
import { ExpectedQuantities, Room } from './dimension-engine';
import { calculateMissingItemExposure, COST_BASELINE } from './cost-baseline';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ExpertAuthorityType = 
  | 'LICENSED_ENGINEER'
  | 'INDUSTRIAL_HYGIENIST'
  | 'ENVIRONMENTAL_CONSULTANT'
  | 'STRUCTURAL_ENGINEER'
  | 'CONTRACTOR'
  | 'INTERNAL_MEMO'
  | 'UNKNOWN';

export type DirectiveAction = 
  | 'REMOVE'
  | 'REPLACE'
  | 'CLEAN'
  | 'ENCAPSULATE'
  | 'INSTALL'
  | 'TREAT'
  | 'TEST'
  | 'MONITOR';

export type DirectiveScopeType = 
  | 'FULL_HEIGHT'
  | 'PARTIAL_HEIGHT'
  | 'ALL'
  | 'SPECIFIC_AREA'
  | 'CEILING_ONLY'
  | 'FLOOR_ONLY'
  | 'CONDITIONAL';

export type MeasurementType = 
  | 'HEIGHT'
  | 'AREA'
  | 'VOLUME'
  | 'COUNT'
  | 'LINEAR';

export type DirectivePriority = 
  | 'MANDATORY'
  | 'RECOMMENDED'
  | 'CONDITIONAL';

export type TradeCode = 
  | 'DRY' | 'INS' | 'FLR' | 'CRP' | 'RFG' | 'FRM' 
  | 'ELE' | 'PLM' | 'HVA' | 'PNT' | 'CAB' | 'CTR' 
  | 'TIL' | 'MLD' | 'CEI' | 'VCT' | 'OTHER';

export interface MeasurementRule {
  type: MeasurementType;
  value?: number;
  unit?: string;
  description: string;
}

export interface ComplianceReference {
  standard: string;
  citation: string;
  section?: string;
  description?: string;
}

export interface ConditionalLogic {
  conditional: boolean;
  conditionDescription: string;
  triggerCriteria?: string[];
  verified: boolean;
}

export interface RoomMapping {
  mapped: boolean;
  roomNames: string[];
  scopeDescription: string;
  affectedRooms?: Room[];
}

export interface ExpertDirective {
  id: string;
  sourceParagraph: string;
  pageNumber?: number;
  
  // Classification
  trade: TradeCode;
  tradeName: string;
  action: DirectiveAction;
  scopeType: DirectiveScopeType;
  
  // Measurability
  measurable: boolean;
  measurementRule?: MeasurementRule;
  
  // Priority
  priority: DirectivePriority;
  
  // Compliance
  complianceBasis?: ComplianceReference;
  
  // Conditional logic
  conditionalLogic?: ConditionalLogic;
  
  // Room mapping
  roomMapping?: RoomMapping;
  
  // Authority
  authorityType: ExpertAuthorityType;
  authorityWeight: number; // 0.5 - 1.0
  
  // Raw data
  rawText: string;
  extractionConfidence: number; // 0-100
}

export interface DirectiveVariance {
  directiveId: string;
  directive: ExpertDirective;
  
  // Comparison
  estimateValue: number;
  expectedValue: number;
  variance: number;
  variancePercent: number;
  
  // Financial impact
  exposureMin: number;
  exposureMax: number;
  
  // Geometry (if applicable)
  geometryUsed: boolean;
  perimeter?: number;
  heightDelta?: number;
  areaDelta?: number;
  
  // Calculation
  formula: string;
  calculation: string;
  
  // Status
  status: 'UNADDRESSED' | 'PARTIALLY_ADDRESSED' | 'FULLY_ADDRESSED';
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
}

export interface ExpertVarianceSummary {
  totalMandatoryDirectives: number;
  totalRecommendedDirectives: number;
  totalConditionalDirectives: number;
  
  unaddressedMandatory: number;
  partiallyAddressed: number;
  fullyAddressed: number;
  
  totalExposureMin: number;
  totalExposureMax: number;
  
  byTrade: {
    trade: TradeCode;
    tradeName: string;
    directives: number;
    unaddressed: number;
    exposureMin: number;
    exposureMax: number;
  }[];
}

export interface ExpertIntelligenceReport {
  // Directives
  directives: ExpertDirective[];
  measurableDirectives: number;
  nonMeasurableDirectives: number;
  
  // Variances
  variances: DirectiveVariance[];
  varianceSummary: ExpertVarianceSummary;
  
  // Compliance
  complianceReferences: ComplianceReference[];
  
  // Authority
  primaryAuthorityType: ExpertAuthorityType;
  authorityWeight: number;
  
  // Confidence
  expertEngineConfidence: number; // 0-100
  
  // Metadata
  metadata: {
    reportType: string;
    reportDate?: string;
    author?: string;
    totalPages: number;
    extractionSuccess: boolean;
    directiveExtractionRate: number;
    measurableDirectiveRatio: number;
    roomMappingSuccess: number;
    standardReferenceCount: number;
    processingTimeMs: number;
  };
  
  // Audit trail
  auditTrail: {
    dimensionsUsed: boolean;
    roomCount: number;
    geometryCalculations: number;
    costBaselineVersion: string;
    extractionWarnings: string[];
  };
}

// ============================================================================
// TRADE MAPPING
// ============================================================================

const TRADE_MAPPING: Record<string, { code: TradeCode; name: string }> = {
  'drywall': { code: 'DRY', name: 'Drywall' },
  'sheetrock': { code: 'DRY', name: 'Drywall' },
  'gypsum': { code: 'DRY', name: 'Drywall' },
  'insulation': { code: 'INS', name: 'Insulation' },
  'batt': { code: 'INS', name: 'Insulation' },
  'fiberglass': { code: 'INS', name: 'Insulation' },
  'flooring': { code: 'FLR', name: 'Flooring' },
  'floor': { code: 'FLR', name: 'Flooring' },
  'carpet': { code: 'CRP', name: 'Carpet' },
  'roofing': { code: 'RFG', name: 'Roofing' },
  'roof': { code: 'RFG', name: 'Roofing' },
  'decking': { code: 'RFG', name: 'Roofing' },
  'sheathing': { code: 'RFG', name: 'Roofing' },
  'framing': { code: 'FRM', name: 'Framing' },
  'structural': { code: 'FRM', name: 'Framing' },
  'stud': { code: 'FRM', name: 'Framing' },
  'joist': { code: 'FRM', name: 'Framing' },
  'electrical': { code: 'ELE', name: 'Electrical' },
  'wiring': { code: 'ELE', name: 'Electrical' },
  'plumbing': { code: 'PLM', name: 'Plumbing' },
  'pipe': { code: 'PLM', name: 'Plumbing' },
  'hvac': { code: 'HVA', name: 'HVAC' },
  'duct': { code: 'HVA', name: 'HVAC' },
  'painting': { code: 'PNT', name: 'Painting' },
  'paint': { code: 'PNT', name: 'Painting' },
  'cabinets': { code: 'CAB', name: 'Cabinets' },
  'countertops': { code: 'CTR', name: 'Countertops' },
  'counter': { code: 'CTR', name: 'Countertops' },
  'tile': { code: 'TIL', name: 'Tile' },
  'ceramic': { code: 'TIL', name: 'Tile' },
  'molding': { code: 'MLD', name: 'Molding/Trim' },
  'trim': { code: 'MLD', name: 'Molding/Trim' },
  'baseboard': { code: 'MLD', name: 'Molding/Trim' },
  'ceiling': { code: 'CEI', name: 'Ceiling' },
  'vinyl': { code: 'VCT', name: 'Vinyl' }
};

// ============================================================================
// STANDARD REFERENCE PATTERNS
// ============================================================================

const STANDARD_PATTERNS = [
  {
    pattern: /IICRC\s+S500/gi,
    standard: 'IICRC S500',
    description: 'Water Damage Restoration Standard'
  },
  {
    pattern: /IICRC\s+S520/gi,
    standard: 'IICRC S520',
    description: 'Mold Remediation Standard'
  },
  {
    pattern: /IRC\s+R?(\d+)/gi,
    standard: 'IRC',
    description: 'International Residential Code'
  },
  {
    pattern: /IBC\s+(\d+)/gi,
    standard: 'IBC',
    description: 'International Building Code'
  },
  {
    pattern: /ASTM\s+([A-Z]\d+)/gi,
    standard: 'ASTM',
    description: 'ASTM Standard'
  },
  {
    pattern: /OSHA\s+(\d+)/gi,
    standard: 'OSHA',
    description: 'OSHA Regulation'
  },
  {
    pattern: /EPA\s+guidelines?/gi,
    standard: 'EPA',
    description: 'EPA Guidelines'
  }
];

// ============================================================================
// DIRECTIVE EXTRACTION PATTERNS
// ============================================================================

const DIRECTIVE_PATTERNS = [
  // Full height removal
  {
    pattern: /(?:remove|replace).*?(?:drywall|sheetrock|gypsum).*?(?:full\s+height|floor\s+to\s+ceiling|entire\s+wall|all\s+walls?)/gi,
    action: 'REMOVE' as DirectiveAction,
    scopeType: 'FULL_HEIGHT' as DirectiveScopeType,
    measurable: true,
    measurementExtractor: () => ({ type: 'HEIGHT' as MeasurementType, description: 'Full height to ceiling' })
  },
  
  // Partial height with specific measurement
  {
    pattern: /(?:remove|replace).*?(?:drywall|sheetrock|gypsum).*?(\d+)\s*(?:ft|feet|foot|')/gi,
    action: 'REMOVE' as DirectiveAction,
    scopeType: 'PARTIAL_HEIGHT' as DirectiveScopeType,
    measurable: true,
    measurementExtractor: (match: RegExpMatchArray) => ({
      type: 'HEIGHT' as MeasurementType,
      value: parseInt(match[1]),
      unit: 'ft',
      description: `${match[1]} ft height`
    })
  },
  
  // Insulation removal
  {
    pattern: /(?:remove|replace).*?(?:all|entire|affected)?.*?insulation/gi,
    action: 'REMOVE' as DirectiveAction,
    scopeType: 'ALL' as DirectiveScopeType,
    measurable: true,
    measurementExtractor: () => ({ type: 'AREA' as MeasurementType, description: 'All affected insulation' })
  },
  
  // Ceiling work
  {
    pattern: /(?:remove|replace).*?ceiling/gi,
    action: 'REPLACE' as DirectiveAction,
    scopeType: 'CEILING_ONLY' as DirectiveScopeType,
    measurable: true,
    measurementExtractor: () => ({ type: 'AREA' as MeasurementType, description: 'Ceiling area' })
  },
  
  // Flooring
  {
    pattern: /(?:remove|replace).*?(?:flooring|carpet|vinyl|tile)/gi,
    action: 'REMOVE' as DirectiveAction,
    scopeType: 'FLOOR_ONLY' as DirectiveScopeType,
    measurable: true,
    measurementExtractor: () => ({ type: 'AREA' as MeasurementType, description: 'Floor area' })
  },
  
  // Encapsulation
  {
    pattern: /encapsulate.*?(?:drywall|surface|area)/gi,
    action: 'ENCAPSULATE' as DirectiveAction,
    scopeType: 'SPECIFIC_AREA' as DirectiveScopeType,
    measurable: true,
    measurementExtractor: () => ({ type: 'AREA' as MeasurementType, description: 'Encapsulation area' })
  },
  
  // Cleaning
  {
    pattern: /clean.*?(?:all|entire|affected)?.*?(?:surfaces?|areas?)/gi,
    action: 'CLEAN' as DirectiveAction,
    scopeType: 'SPECIFIC_AREA' as DirectiveScopeType,
    measurable: false,
    measurementExtractor: () => ({ type: 'AREA' as MeasurementType, description: 'Cleaning area' })
  }
];

// ============================================================================
// CONDITIONAL PATTERNS
// ============================================================================

const CONDITIONAL_PATTERNS = [
  /if\s+moisture\s+(?:exceeds|is\s+above|greater\s+than)/gi,
  /where\s+(?:microbial|mold)\s+growth\s+is\s+(?:observed|present|detected)/gi,
  /in\s+affected\s+areas?/gi,
  /if\s+(?:testing|inspection)\s+(?:confirms|reveals|shows)/gi,
  /should\s+(?:testing|inspection)\s+(?:confirm|reveal|show)/gi
];

// ============================================================================
// ROOM MAPPING PATTERNS
// ============================================================================

const ROOM_PATTERNS = [
  { pattern: /all\s+rooms?/gi, scope: 'ALL_ROOMS' },
  { pattern: /entire\s+(?:property|structure|building)/gi, scope: 'ALL_ROOMS' },
  { pattern: /affected\s+rooms?/gi, scope: 'AFFECTED_ROOMS' },
  { pattern: /(?:kitchen|bath|bedroom|living|dining|hallway|basement|garage)/gi, scope: 'SPECIFIC_ROOMS' }
];

// ============================================================================
// AUTHORITY DETECTION
// ============================================================================

function detectAuthorityType(text: string): { type: ExpertAuthorityType; weight: number } {
  const lower = text.toLowerCase();
  
  if (lower.includes('licensed engineer') || lower.includes('professional engineer') || lower.includes('p.e.')) {
    return { type: 'LICENSED_ENGINEER', weight: 1.0 };
  }
  
  if (lower.includes('structural engineer')) {
    return { type: 'STRUCTURAL_ENGINEER', weight: 1.0 };
  }
  
  if (lower.includes('industrial hygienist') || lower.includes('cih')) {
    return { type: 'INDUSTRIAL_HYGIENIST', weight: 0.9 };
  }
  
  if (lower.includes('environmental consultant') || lower.includes('environmental assessment')) {
    return { type: 'ENVIRONMENTAL_CONSULTANT', weight: 0.85 };
  }
  
  if (lower.includes('contractor') || lower.includes('restoration')) {
    return { type: 'CONTRACTOR', weight: 0.75 };
  }
  
  if (lower.includes('internal') || lower.includes('memo') || lower.includes('note')) {
    return { type: 'INTERNAL_MEMO', weight: 0.5 };
  }
  
  return { type: 'UNKNOWN', weight: 0.6 };
}

// ============================================================================
// PRIORITY DETECTION
// ============================================================================

function detectPriority(text: string): DirectivePriority {
  const lower = text.toLowerCase();
  
  if (lower.includes('must') || lower.includes('shall') || lower.includes('required') || lower.includes('mandatory')) {
    return 'MANDATORY';
  }
  
  if (lower.includes('recommend') || lower.includes('should') || lower.includes('advised')) {
    return 'RECOMMENDED';
  }
  
  return 'CONDITIONAL';
}

// ============================================================================
// TRADE EXTRACTION
// ============================================================================

function extractTrade(text: string): { code: TradeCode; name: string } | null {
  const lower = text.toLowerCase();
  
  for (const [keyword, trade] of Object.entries(TRADE_MAPPING)) {
    if (lower.includes(keyword)) {
      return trade;
    }
  }
  
  return null;
}

// ============================================================================
// STANDARD REFERENCE EXTRACTION
// ============================================================================

function extractStandardReferences(text: string): ComplianceReference[] {
  const references: ComplianceReference[] = [];
  
  for (const stdPattern of STANDARD_PATTERNS) {
    const matches = text.matchAll(stdPattern.pattern);
    
    for (const match of matches) {
      references.push({
        standard: stdPattern.standard,
        citation: match[0],
        section: match[1] || undefined,
        description: stdPattern.description
      });
    }
  }
  
  return references;
}

// ============================================================================
// CONDITIONAL LOGIC DETECTION
// ============================================================================

function detectConditionalLogic(text: string): ConditionalLogic | undefined {
  for (const pattern of CONDITIONAL_PATTERNS) {
    const match = text.match(pattern);
    
    if (match) {
      return {
        conditional: true,
        conditionDescription: match[0],
        verified: false
      };
    }
  }
  
  return undefined;
}

// ============================================================================
// ROOM MAPPING
// ============================================================================

function extractRoomMapping(text: string, dimensions?: ExpectedQuantities): RoomMapping {
  const lower = text.toLowerCase();
  const roomNames: string[] = [];
  
  // Check for all rooms
  if (/all\s+rooms?|entire\s+(?:property|structure|building)/i.test(lower)) {
    return {
      mapped: dimensions ? true : false,
      roomNames: dimensions?.breakdown.rooms.map(r => r.roomName) || [],
      scopeDescription: 'All rooms',
      affectedRooms: dimensions?.breakdown.rooms.map(r => ({
        name: r.roomName,
        length: r.length,
        width: r.width,
        height: r.height
      }))
    };
  }
  
  // Check for specific room names
  const roomKeywords = ['kitchen', 'bath', 'bedroom', 'living', 'dining', 'hallway', 'basement', 'garage', 'laundry'];
  
  for (const keyword of roomKeywords) {
    if (lower.includes(keyword)) {
      roomNames.push(keyword);
    }
  }
  
  if (roomNames.length > 0) {
    const affectedRooms = dimensions?.breakdown.rooms
      .filter(r => roomNames.some(kw => r.roomName.toLowerCase().includes(kw)))
      .map(r => ({
        name: r.roomName,
        length: r.length,
        width: r.width,
        height: r.height
      }));
    
    return {
      mapped: Boolean(affectedRooms?.length),
      roomNames,
      scopeDescription: roomNames.join(', '),
      affectedRooms
    };
  }
  
  return {
    mapped: false,
    roomNames: [],
    scopeDescription: 'Unspecified location'
  };
}

// ============================================================================
// DIRECTIVE EXTRACTION
// ============================================================================

function extractDirectives(
  text: string,
  dimensions?: ExpectedQuantities,
  authorityType: ExpertAuthorityType = 'UNKNOWN',
  authorityWeight: number = 0.6
): ExpertDirective[] {
  
  const directives: ExpertDirective[] = [];
  
  // Normalize text
  const normalized = text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim();
  
  // Split into sentences
  const sentences = normalized.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20);
  
  let directiveCounter = 0;
  
  for (const sentence of sentences) {
    // Check each pattern
    for (const pattern of DIRECTIVE_PATTERNS) {
      const matches = sentence.matchAll(pattern.pattern);
      
      for (const match of matches) {
        const trade = extractTrade(sentence);
        
        if (!trade) continue;
        
        directiveCounter++;
        
        const measurementRule = pattern.measurementExtractor(match);
        const priority = detectPriority(sentence);
        const conditionalLogic = detectConditionalLogic(sentence);
        const roomMapping = extractRoomMapping(sentence, dimensions);
        const complianceRefs = extractStandardReferences(sentence);
        
        // Calculate extraction confidence
        let confidence = 70;
        if (trade) confidence += 10;
        if ('value' in measurementRule && measurementRule.value) confidence += 10;
        if (roomMapping.mapped) confidence += 5;
        if (complianceRefs.length > 0) confidence += 5;
        
        directives.push({
          id: `DIR-${directiveCounter.toString().padStart(3, '0')}`,
          sourceParagraph: sentence,
          
          trade: trade.code,
          tradeName: trade.name,
          action: pattern.action,
          scopeType: pattern.scopeType,
          
          measurable: pattern.measurable,
          measurementRule,
          
          priority,
          
          complianceBasis: complianceRefs.length > 0 ? complianceRefs[0] : undefined,
          conditionalLogic,
          roomMapping,
          
          authorityType,
          authorityWeight,
          
          rawText: sentence,
          extractionConfidence: Math.min(confidence, 100)
        });
      }
    }
  }
  
  return directives;
}

// ============================================================================
// VARIANCE CALCULATION
// ============================================================================

function calculateDirectiveVariance(
  directive: ExpertDirective,
  estimate: StructuredEstimate,
  dimensions?: ExpectedQuantities
): DirectiveVariance | null {
  
  // Skip non-measurable directives
  if (!directive.measurable) {
    return null;
  }
  
  // Skip conditional directives that aren't verified
  if (directive.conditionalLogic && !directive.conditionalLogic.verified) {
    return null;
  }
  
  // Find matching trade items in estimate
  const tradeItems = estimate.lineItems.filter(item => item.tradeCode === directive.trade);
  const estimateValue = tradeItems.reduce((sum, item) => sum + item.quantity, 0);
  
  let expectedValue = 0;
  let geometryUsed = false;
  let perimeter: number | undefined;
  let heightDelta: number | undefined;
  let areaDelta: number | undefined;
  let formula = '';
  let calculation = '';
  
  // Calculate expected value based on directive type
  if (directive.scopeType === 'FULL_HEIGHT' && dimensions) {
    geometryUsed = true;
    
    if (directive.roomMapping?.mapped && directive.roomMapping.affectedRooms) {
      // Room-specific calculation
      const rooms = directive.roomMapping.affectedRooms;
      perimeter = rooms.reduce((sum, r) => sum + ((r.length + r.width) * 2), 0);
      const avgHeight = rooms.reduce((sum, r) => sum + r.height, 0) / rooms.length;
      
      expectedValue = perimeter * avgHeight;
      heightDelta = avgHeight;
      formula = `Perimeter ${perimeter.toFixed(0)} LF × Height ${avgHeight.toFixed(1)} ft`;
    } else {
      // Use total dimensions
      perimeter = dimensions.breakdown.totals.totalPerimeterLF;
      const avgHeight = dimensions.breakdown.totals.totalWallSF / perimeter;
      
      expectedValue = dimensions.breakdown.totals.totalWallSF;
      heightDelta = avgHeight;
      formula = `Total Wall SF ${expectedValue.toFixed(0)}`;
    }
    
  } else if (directive.scopeType === 'PARTIAL_HEIGHT' && directive.measurementRule?.value && dimensions) {
    geometryUsed = true;
    
    perimeter = dimensions.breakdown.totals.totalPerimeterLF;
    heightDelta = directive.measurementRule.value;
    expectedValue = perimeter * heightDelta;
    formula = `Perimeter ${perimeter.toFixed(0)} LF × Height ${heightDelta} ft`;
    
  } else if (directive.scopeType === 'CEILING_ONLY' && dimensions) {
    geometryUsed = true;
    expectedValue = dimensions.breakdown.totals.totalCeilingSF;
    formula = `Ceiling SF ${expectedValue.toFixed(0)}`;
    
  } else if (directive.scopeType === 'FLOOR_ONLY' && dimensions) {
    geometryUsed = true;
    expectedValue = dimensions.breakdown.totals.totalFloorSF;
    formula = `Floor SF ${expectedValue.toFixed(0)}`;
    
  } else if (directive.scopeType === 'ALL' && dimensions) {
    geometryUsed = true;
    
    if (directive.trade === 'INS') {
      expectedValue = dimensions.breakdown.totals.totalWallSF;
      formula = `Wall SF ${expectedValue.toFixed(0)}`;
    } else {
      expectedValue = dimensions.breakdown.totals.totalWallSF + dimensions.breakdown.totals.totalCeilingSF;
      formula = `Wall + Ceiling SF ${expectedValue.toFixed(0)}`;
    }
  }
  
  // Calculate variance
  const variance = expectedValue - estimateValue;
  const variancePercent = expectedValue > 0 ? (variance / expectedValue) * 100 : 0;
  
  // Skip if no significant variance
  if (variance <= 0 || variancePercent < 10) {
    return null;
  }
  
  areaDelta = variance;
  
  // Calculate exposure
  let exposureMin = 0;
  let exposureMax = 0;
  
  const costRange = calculateMissingItemExposure(
    directive.trade,
    variance,
    'SF',
    directive.scopeType === 'CEILING_ONLY' ? 'CEILING' : 'REPLACE_1/2'
  );
  
  if (costRange) {
    exposureMin = costRange.min;
    exposureMax = costRange.max;
    
    const costKey = directive.scopeType === 'CEILING_ONLY' ? 'DRY_CEILING' : `${directive.trade}_REPLACE_1/2`;
    const costData = COST_BASELINE[costKey as keyof typeof COST_BASELINE];
    
    if (costData) {
      calculation = `${formula} = ${expectedValue.toFixed(0)} SF expected - ${estimateValue.toFixed(0)} SF in estimate = ${variance.toFixed(0)} SF × $${costData.min}-${costData.max}/SF = $${exposureMin.toLocaleString()}-${exposureMax.toLocaleString()}`;
    } else {
      calculation = `${formula} = ${variance.toFixed(0)} SF shortfall`;
    }
  } else {
    calculation = `${formula} = ${variance.toFixed(0)} SF shortfall (cost baseline not available)`;
  }
  
  // Determine status
  let status: 'UNADDRESSED' | 'PARTIALLY_ADDRESSED' | 'FULLY_ADDRESSED' = 'UNADDRESSED';
  
  if (estimateValue >= expectedValue * 0.9) {
    status = 'FULLY_ADDRESSED';
  } else if (estimateValue >= expectedValue * 0.5) {
    status = 'PARTIALLY_ADDRESSED';
  }
  
  // Determine severity
  let severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' = 'MODERATE';
  
  if (directive.priority === 'MANDATORY') {
    if (variancePercent > 50) severity = 'CRITICAL';
    else if (variancePercent > 25) severity = 'HIGH';
    else severity = 'MODERATE';
  } else if (directive.priority === 'RECOMMENDED') {
    if (variancePercent > 50) severity = 'HIGH';
    else severity = 'MODERATE';
  } else {
    severity = 'LOW';
  }
  
  return {
    directiveId: directive.id,
    directive,
    
    estimateValue,
    expectedValue,
    variance,
    variancePercent,
    
    exposureMin,
    exposureMax,
    
    geometryUsed,
    perimeter,
    heightDelta,
    areaDelta,
    
    formula,
    calculation,
    
    status,
    severity
  };
}

// ============================================================================
// VARIANCE SUMMARY
// ============================================================================

function generateVarianceSummary(variances: DirectiveVariance[]): ExpertVarianceSummary {
  const mandatoryDirectives = variances.filter(v => v.directive.priority === 'MANDATORY');
  const recommendedDirectives = variances.filter(v => v.directive.priority === 'RECOMMENDED');
  const conditionalDirectives = variances.filter(v => v.directive.priority === 'CONDITIONAL');
  
  const unaddressedMandatory = mandatoryDirectives.filter(v => v.status === 'UNADDRESSED').length;
  const partiallyAddressed = variances.filter(v => v.status === 'PARTIALLY_ADDRESSED').length;
  const fullyAddressed = variances.filter(v => v.status === 'FULLY_ADDRESSED').length;
  
  const totalExposureMin = variances.reduce((sum, v) => sum + v.exposureMin, 0);
  const totalExposureMax = variances.reduce((sum, v) => sum + v.exposureMax, 0);
  
  // Group by trade
  const tradeMap = new Map<TradeCode, {
    tradeName: string;
    directives: number;
    unaddressed: number;
    exposureMin: number;
    exposureMax: number;
  }>();
  
  for (const variance of variances) {
    const trade = variance.directive.trade;
    const existing = tradeMap.get(trade);
    
    if (existing) {
      existing.directives++;
      if (variance.status === 'UNADDRESSED') existing.unaddressed++;
      existing.exposureMin += variance.exposureMin;
      existing.exposureMax += variance.exposureMax;
    } else {
      tradeMap.set(trade, {
        tradeName: variance.directive.tradeName,
        directives: 1,
        unaddressed: variance.status === 'UNADDRESSED' ? 1 : 0,
        exposureMin: variance.exposureMin,
        exposureMax: variance.exposureMax
      });
    }
  }
  
  const byTrade = Array.from(tradeMap.entries()).map(([trade, data]) => ({
    trade,
    ...data
  }));
  
  return {
    totalMandatoryDirectives: mandatoryDirectives.length,
    totalRecommendedDirectives: recommendedDirectives.length,
    totalConditionalDirectives: conditionalDirectives.length,
    
    unaddressedMandatory,
    partiallyAddressed,
    fullyAddressed,
    
    totalExposureMin: Math.round(totalExposureMin),
    totalExposureMax: Math.round(totalExposureMax),
    
    byTrade
  };
}

// ============================================================================
// CONFIDENCE CALCULATION
// ============================================================================

function calculateEngineConfidence(
  directives: ExpertDirective[],
  dimensions?: ExpectedQuantities
): number {
  
  if (directives.length === 0) {
    return 0;
  }
  
  let score = 0;
  
  // Directive extraction success (40 points)
  const avgDirectiveConfidence = directives.reduce((sum, d) => sum + d.extractionConfidence, 0) / directives.length;
  score += (avgDirectiveConfidence / 100) * 40;
  
  // Measurable directive ratio (25 points)
  const measurableRatio = directives.filter(d => d.measurable).length / directives.length;
  score += measurableRatio * 25;
  
  // Room mapping success (20 points)
  if (dimensions) {
    const mappedRatio = directives.filter(d => d.roomMapping?.mapped).length / directives.length;
    score += mappedRatio * 20;
  }
  
  // Standard reference detection (15 points)
  const withStandards = directives.filter(d => d.complianceBasis).length;
  const standardRatio = withStandards / directives.length;
  score += standardRatio * 15;
  
  return Math.round(score);
}

// ============================================================================
// MAIN ENGINE
// ============================================================================

export async function processExpertReport(
  reportText: string,
  estimate: StructuredEstimate,
  dimensions?: ExpectedQuantities,
  metadata?: {
    reportType?: string;
    reportDate?: string;
    author?: string;
    totalPages?: number;
  }
): Promise<ExpertIntelligenceReport> {
  
  const startTime = Date.now();
  const warnings: string[] = [];
  
  // Detect authority type
  const authority = detectAuthorityType(reportText);
  
  // Extract directives
  const directives = extractDirectives(reportText, dimensions, authority.type, authority.weight);
  
  if (directives.length === 0) {
    warnings.push('No directives extracted from report text');
  }
  
  const measurableDirectives = directives.filter(d => d.measurable).length;
  const nonMeasurableDirectives = directives.length - measurableDirectives;
  
  if (measurableDirectives === 0 && directives.length > 0) {
    warnings.push('Directives found but none are measurable');
  }
  
  // Extract compliance references
  const complianceReferences = extractStandardReferences(reportText);
  
  // Calculate variances
  const variances: DirectiveVariance[] = [];
  let geometryCalculations = 0;
  
  for (const directive of directives) {
    if (!directive.measurable) continue;
    
    const variance = calculateDirectiveVariance(directive, estimate, dimensions);
    
    if (variance) {
      variances.push(variance);
      if (variance.geometryUsed) geometryCalculations++;
    }
  }
  
  // Generate variance summary
  const varianceSummary = generateVarianceSummary(variances);
  
  // Calculate engine confidence
  const expertEngineConfidence = calculateEngineConfidence(directives, dimensions);
  
  // Reject if confidence too low
  if (expertEngineConfidence < 70) {
    warnings.push(`Engine confidence ${expertEngineConfidence}% below minimum threshold (70%)`);
  }
  
  const processingTimeMs = Date.now() - startTime;
  
  return {
    directives,
    measurableDirectives,
    nonMeasurableDirectives,
    
    variances,
    varianceSummary,
    
    complianceReferences,
    
    primaryAuthorityType: authority.type,
    authorityWeight: authority.weight,
    
    expertEngineConfidence,
    
    metadata: {
      reportType: metadata?.reportType || 'UNKNOWN',
      reportDate: metadata?.reportDate,
      author: metadata?.author,
      totalPages: metadata?.totalPages || 0,
      extractionSuccess: directives.length > 0,
      directiveExtractionRate: directives.length > 0 ? measurableDirectives / directives.length : 0,
      measurableDirectiveRatio: directives.length > 0 ? measurableDirectives / directives.length : 0,
      roomMappingSuccess: directives.filter(d => d.roomMapping?.mapped).length,
      standardReferenceCount: complianceReferences.length,
      processingTimeMs
    },
    
    auditTrail: {
      dimensionsUsed: !!dimensions,
      roomCount: dimensions?.breakdown.rooms.length || 0,
      geometryCalculations,
      costBaselineVersion: '2026.02',
      extractionWarnings: warnings
    }
  };
}

// ============================================================================
// PDF PROCESSING WRAPPER
// ============================================================================

export async function processExpertReportPDF(
  pdfBuffer: Buffer,
  estimate: StructuredEstimate,
  dimensions?: ExpectedQuantities
): Promise<ExpertIntelligenceReport> {
  
  try {
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(pdfBuffer);
    
    if (!data || !data.text) {
      throw new Error('Failed to extract text from PDF');
    }
    
    const reportText = data.text;
    const totalPages = data.numpages || 0;
    
    // Detect report type
    const reportType = detectAuthorityType(reportText).type;
    
    return processExpertReport(reportText, estimate, dimensions, {
      reportType,
      totalPages
    });
    
  } catch (error: any) {
    throw new Error(`Expert report PDF processing failed: ${error.message}`);
  }
}
