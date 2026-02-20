/**
 * LOSS EXPECTATION ENGINE
 * Maps loss type + severity to expected trade probability
 * Infers severity from trade density, quantity scale, and structural indicators
 */

import { ParsedEstimate } from './xactimate-parser';

type LossType = 'WATER' | 'FIRE' | 'WIND' | 'HAIL' | 'OTHER';
type SeverityLevel = 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'CATEGORY_3' | 'LIGHT' | 'MODERATE' | 'HEAVY' | 'MINOR' | 'MAJOR';

interface ExpectedTrade {
  tradeCode: string;
  tradeName: string;
  probability: number; // 0.0 - 1.0
  reason: string;
}

interface LossExpectation {
  lossType: LossType;
  severityLevel: SeverityLevel;
  expectedTrades: ExpectedTrade[];
  missingCriticalTrades: ExpectedTrade[];
  probabilityScore: number; // 0-100
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * Loss type probability maps
 */
const LOSS_EXPECTATIONS: Record<string, ExpectedTrade[]> = {
  // Water Loss - Level 1 (Clean water, minimal penetration)
  'WATER_LEVEL_1': [
    { tradeCode: 'CLN', tradeName: 'Cleaning', probability: 0.95, reason: 'Standard for all water losses' },
    { tradeCode: 'MIT', tradeName: 'Mitigation', probability: 0.90, reason: 'Water extraction and drying' },
    { tradeCode: 'EQP', tradeName: 'Equipment', probability: 0.85, reason: 'Drying equipment rental' },
    { tradeCode: 'FLR', tradeName: 'Flooring', probability: 0.60, reason: 'Carpet/pad replacement common' },
    { tradeCode: 'DRY', tradeName: 'Drywall', probability: 0.40, reason: 'Lower wall sections if saturated' },
    { tradeCode: 'PNT', tradeName: 'Painting', probability: 0.40, reason: 'If drywall affected' },
    { tradeCode: 'MLD', tradeName: 'Molding/Trim', probability: 0.35, reason: 'Baseboard often damaged' }
  ],
  
  // Water Loss - Level 2 (Gray water, moderate penetration)
  'WATER_LEVEL_2': [
    { tradeCode: 'MIT', tradeName: 'Mitigation', probability: 0.98, reason: 'Required for gray water' },
    { tradeCode: 'CLN', tradeName: 'Cleaning', probability: 0.95, reason: 'Antimicrobial treatment' },
    { tradeCode: 'DRY', tradeName: 'Drywall', probability: 0.85, reason: 'Removal up to 2-4 feet typical' },
    { tradeCode: 'INS', tradeName: 'Insulation', probability: 0.80, reason: 'If exterior walls affected' },
    { tradeCode: 'PNT', tradeName: 'Painting', probability: 0.85, reason: 'After drywall replacement' },
    { tradeCode: 'FLR', tradeName: 'Flooring', probability: 0.90, reason: 'Full replacement likely' },
    { tradeCode: 'MLD', tradeName: 'Molding/Trim', probability: 0.75, reason: 'Baseboard and casing' },
    { tradeCode: 'CAB', tradeName: 'Cabinets', probability: 0.50, reason: 'If kitchen/bath affected' },
    { tradeCode: 'EQP', tradeName: 'Equipment', probability: 0.90, reason: 'Extended drying period' }
  ],
  
  // Water Loss - Level 3 / Category 3 (Black water, extensive)
  'WATER_LEVEL_3': [
    { tradeCode: 'MIT', tradeName: 'Mitigation', probability: 1.00, reason: 'Mandatory for cat 3' },
    { tradeCode: 'DEM', tradeName: 'Demolition', probability: 0.95, reason: 'Extensive removal required' },
    { tradeCode: 'HAU', tradeName: 'Haul Away', probability: 0.95, reason: 'Debris removal' },
    { tradeCode: 'DRY', tradeName: 'Drywall', probability: 0.98, reason: 'Full height removal typical' },
    { tradeCode: 'INS', tradeName: 'Insulation', probability: 0.95, reason: 'Must be replaced if wet' },
    { tradeCode: 'FLR', tradeName: 'Flooring', probability: 0.98, reason: 'Complete replacement' },
    { tradeCode: 'PNT', tradeName: 'Painting', probability: 0.98, reason: 'Full repaint after reconstruction' },
    { tradeCode: 'MLD', tradeName: 'Molding/Trim', probability: 0.90, reason: 'All trim affected' },
    { tradeCode: 'CAB', tradeName: 'Cabinets', probability: 0.75, reason: 'Kitchen/bath likely affected' },
    { tradeCode: 'CTR', tradeName: 'Countertops', probability: 0.70, reason: 'If cabinets replaced' },
    { tradeCode: 'DOR', tradeName: 'Doors', probability: 0.60, reason: 'Interior doors may warp' },
    { tradeCode: 'ELE', tradeName: 'Electrical', probability: 0.70, reason: 'Outlets/switches below flood line' },
    { tradeCode: 'PLM', tradeName: 'Plumbing', probability: 0.50, reason: 'If source or contamination issue' },
    { tradeCode: 'EQP', tradeName: 'Equipment', probability: 0.95, reason: 'Extended drying and dehumidification' }
  ],
  
  // Fire Loss - Light (Smoke damage, minimal burn)
  'FIRE_LIGHT': [
    { tradeCode: 'CLN', tradeName: 'Cleaning', probability: 0.98, reason: 'Smoke and soot removal' },
    { tradeCode: 'PNT', tradeName: 'Painting', probability: 0.85, reason: 'Seal smoke odor' },
    { tradeCode: 'FLR', tradeName: 'Flooring', probability: 0.50, reason: 'Carpet cleaning or replacement' },
    { tradeCode: 'DRY', tradeName: 'Drywall', probability: 0.30, reason: 'If smoke penetration severe' },
    { tradeCode: 'HVA', tradeName: 'HVAC', probability: 0.60, reason: 'Duct cleaning required' }
  ],
  
  // Fire Loss - Moderate (Structural damage, partial burn)
  'FIRE_MODERATE': [
    { tradeCode: 'DEM', tradeName: 'Demolition', probability: 0.90, reason: 'Remove burned materials' },
    { tradeCode: 'HAU', tradeName: 'Haul Away', probability: 0.90, reason: 'Debris removal' },
    { tradeCode: 'FRM', tradeName: 'Framing', probability: 0.70, reason: 'Structural repairs' },
    { tradeCode: 'RFG', tradeName: 'Roofing', probability: 0.60, reason: 'If fire reached attic' },
    { tradeCode: 'DRY', tradeName: 'Drywall', probability: 0.95, reason: 'Replacement after framing' },
    { tradeCode: 'INS', tradeName: 'Insulation', probability: 0.85, reason: 'Damaged by fire/water' },
    { tradeCode: 'ELE', tradeName: 'Electrical', probability: 0.90, reason: 'Wiring replacement' },
    { tradeCode: 'PLM', tradeName: 'Plumbing', probability: 0.50, reason: 'If pipes damaged' },
    { tradeCode: 'PNT', tradeName: 'Painting', probability: 0.95, reason: 'Full repaint' },
    { tradeCode: 'FLR', tradeName: 'Flooring', probability: 0.85, reason: 'Replacement likely' },
    { tradeCode: 'CAB', tradeName: 'Cabinets', probability: 0.60, reason: 'If kitchen affected' },
    { tradeCode: 'MLD', tradeName: 'Molding/Trim', probability: 0.80, reason: 'Trim replacement' },
    { tradeCode: 'CLN', tradeName: 'Cleaning', probability: 0.95, reason: 'Smoke remediation' }
  ],
  
  // Fire Loss - Heavy (Major structural damage)
  'FIRE_HEAVY': [
    { tradeCode: 'DEM', tradeName: 'Demolition', probability: 1.00, reason: 'Complete gutting required' },
    { tradeCode: 'HAU', tradeName: 'Haul Away', probability: 1.00, reason: 'Major debris removal' },
    { tradeCode: 'FRM', tradeName: 'Framing', probability: 0.95, reason: 'Structural rebuild' },
    { tradeCode: 'FND', tradeName: 'Foundation', probability: 0.40, reason: 'If structural integrity compromised' },
    { tradeCode: 'RFG', tradeName: 'Roofing', probability: 0.90, reason: 'Likely full replacement' },
    { tradeCode: 'DRY', tradeName: 'Drywall', probability: 1.00, reason: 'Complete replacement' },
    { tradeCode: 'INS', tradeName: 'Insulation', probability: 1.00, reason: 'Full replacement' },
    { tradeCode: 'ELE', tradeName: 'Electrical', probability: 0.98, reason: 'Complete rewiring' },
    { tradeCode: 'PLM', tradeName: 'Plumbing', probability: 0.85, reason: 'Extensive repairs/replacement' },
    { tradeCode: 'HVA', tradeName: 'HVAC', probability: 0.90, reason: 'System replacement' },
    { tradeCode: 'PNT', tradeName: 'Painting', probability: 1.00, reason: 'Full interior/exterior' },
    { tradeCode: 'FLR', tradeName: 'Flooring', probability: 0.98, reason: 'Complete replacement' },
    { tradeCode: 'CAB', tradeName: 'Cabinets', probability: 0.95, reason: 'Full kitchen/bath rebuild' },
    { tradeCode: 'CTR', tradeName: 'Countertops', probability: 0.95, reason: 'With cabinet replacement' },
    { tradeCode: 'WIN', tradeName: 'Windows', probability: 0.70, reason: 'Heat damage likely' },
    { tradeCode: 'DOR', tradeName: 'Doors', probability: 0.85, reason: 'Interior and exterior' },
    { tradeCode: 'MLD', tradeName: 'Molding/Trim', probability: 0.98, reason: 'Complete replacement' },
    { tradeCode: 'PER', tradeName: 'Permit', probability: 0.95, reason: 'Required for major reconstruction' }
  ],
  
  // Wind/Hail - Minor (Shingle damage, minor exterior)
  'WIND_MINOR': [
    { tradeCode: 'RFG', tradeName: 'Roofing', probability: 0.95, reason: 'Primary damage area' },
    { tradeCode: 'SID', tradeName: 'Siding', probability: 0.40, reason: 'If wind-driven debris' },
    { tradeCode: 'WIN', tradeName: 'Windows', probability: 0.30, reason: 'If broken by debris' },
    { tradeCode: 'DRY', tradeName: 'Drywall', probability: 0.25, reason: 'If water intrusion occurred' },
    { tradeCode: 'PNT', tradeName: 'Painting', probability: 0.25, reason: 'If interior water damage' }
  ],
  
  // Wind/Hail - Major (Structural damage, extensive)
  'WIND_MAJOR': [
    { tradeCode: 'RFG', tradeName: 'Roofing', probability: 1.00, reason: 'Full replacement likely' },
    { tradeCode: 'FRM', tradeName: 'Framing', probability: 0.70, reason: 'Structural repairs' },
    { tradeCode: 'SID', tradeName: 'Siding', probability: 0.85, reason: 'Extensive damage' },
    { tradeCode: 'WIN', tradeName: 'Windows', probability: 0.70, reason: 'Multiple breakages' },
    { tradeCode: 'DOR', tradeName: 'Doors', probability: 0.50, reason: 'Exterior doors damaged' },
    { tradeCode: 'DRY', tradeName: 'Drywall', probability: 0.80, reason: 'Water intrusion damage' },
    { tradeCode: 'INS', tradeName: 'Insulation', probability: 0.75, reason: 'If wet from intrusion' },
    { tradeCode: 'PNT', tradeName: 'Painting', probability: 0.80, reason: 'Interior repairs' },
    { tradeCode: 'CEI', tradeName: 'Ceiling', probability: 0.60, reason: 'If roof penetration' },
    { tradeCode: 'ELE', tradeName: 'Electrical', probability: 0.40, reason: 'If water damage to fixtures' },
    { tradeCode: 'DEM', tradeName: 'Demolition', probability: 0.70, reason: 'Remove damaged materials' },
    { tradeCode: 'HAU', tradeName: 'Haul Away', probability: 0.70, reason: 'Debris removal' }
  ]
};

/**
 * Infer loss type from line items
 */
function inferLossType(estimate: ParsedEstimate): LossType {
  const tradeCounts = new Map<string, number>();
  
  for (const item of estimate.lineItems) {
    tradeCounts.set(item.tradeCode, (tradeCounts.get(item.tradeCode) || 0) + 1);
  }
  
  // Check for water indicators
  const hasMitigation = tradeCounts.has('MIT');
  const hasCleaning = tradeCounts.has('CLN');
  const hasEquipment = tradeCounts.has('EQP');
  
  if (hasMitigation || (hasCleaning && hasEquipment)) {
    return 'WATER';
  }
  
  // Check for fire indicators
  const hasFraming = tradeCounts.has('FRM');
  const hasDemolition = tradeCounts.has('DEM');
  const hasHaulAway = tradeCounts.has('HAU');
  
  if (hasFraming && hasDemolition && hasHaulAway) {
    return 'FIRE';
  }
  
  // Check for wind/hail indicators
  const hasRoofing = tradeCounts.has('RFG');
  const hasSiding = tradeCounts.has('SID');
  const hasWindows = tradeCounts.has('WIN');
  
  if (hasRoofing && (hasSiding || hasWindows)) {
    return 'WIND';
  }
  
  // Default
  if (hasRoofing) return 'WIND';
  if (hasCleaning) return 'WATER';
  
  return 'OTHER';
}

/**
 * Infer severity level from trade density and quantities
 */
function inferSeverity(estimate: ParsedEstimate, lossType: LossType): SeverityLevel {
  const tradeCount = new Set(estimate.lineItems.map(item => item.tradeCode)).size;
  const totalQuantity = estimate.lineItems.reduce((sum, item) => sum + item.quantity, 0);
  const avgQuantity = totalQuantity / Math.max(estimate.lineItems.length, 1);
  
  // Check for structural indicators
  const hasStructural = estimate.lineItems.some(item => 
    ['FRM', 'FND', 'STL', 'CON'].includes(item.tradeCode)
  );
  
  if (lossType === 'WATER') {
    // Category 3 indicators
    const hasDemolition = estimate.lineItems.some(item => item.tradeCode === 'DEM');
    const hasExtensiveDrywall = estimate.lineItems
      .filter(item => item.tradeCode === 'DRY')
      .reduce((sum, item) => sum + item.quantity, 0) > 500;
    
    if (hasDemolition || hasExtensiveDrywall || hasStructural) {
      return 'CATEGORY_3';
    }
    
    // Level 2 vs Level 1
    const drywallQty = estimate.lineItems
      .filter(item => item.tradeCode === 'DRY')
      .reduce((sum, item) => sum + item.quantity, 0);
    
    if (drywallQty > 200 || tradeCount > 8) {
      return 'LEVEL_2';
    }
    
    return 'LEVEL_1';
  }
  
  if (lossType === 'FIRE') {
    if (hasStructural || tradeCount > 12) {
      return 'HEAVY';
    }
    
    if (tradeCount > 7 || avgQuantity > 200) {
      return 'MODERATE';
    }
    
    return 'LIGHT';
  }
  
  if (lossType === 'WIND') {
    if (hasStructural || tradeCount > 8) {
      return 'MAJOR';
    }
    
    return 'MINOR';
  }
  
  return 'LEVEL_1'; // Default
}

/**
 * Calculate loss expectation
 */
export function calculateLossExpectation(estimate: ParsedEstimate): LossExpectation {
  // Infer loss type and severity
  const lossType = inferLossType(estimate);
  const severityLevel = inferSeverity(estimate, lossType);
  
  // Get expected trades for this loss type + severity
  const key = `${lossType}_${severityLevel}`;
  const expectedTrades = LOSS_EXPECTATIONS[key] || [];
  
  // Check which expected trades are present
  const presentTrades = new Set(estimate.lineItems.map(item => item.tradeCode));
  
  // Find missing critical trades (probability > 0.7)
  const missingCriticalTrades = expectedTrades.filter(trade => 
    trade.probability > 0.7 && !presentTrades.has(trade.tradeCode)
  );
  
  // Calculate probability score
  let totalExpectedProbability = 0;
  let totalActualProbability = 0;
  
  for (const trade of expectedTrades) {
    totalExpectedProbability += trade.probability;
    if (presentTrades.has(trade.tradeCode)) {
      totalActualProbability += trade.probability;
    }
  }
  
  const probabilityScore = totalExpectedProbability > 0 
    ? Math.round((totalActualProbability / totalExpectedProbability) * 100)
    : 100;
  
  // Determine confidence
  let confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  if (estimate.lineItems.length > 20 && estimate.metadata.confidence === 'HIGH') {
    confidence = 'HIGH';
  } else if (estimate.lineItems.length > 10) {
    confidence = 'MEDIUM';
  } else {
    confidence = 'LOW';
  }
  
  return {
    lossType,
    severityLevel,
    expectedTrades,
    missingCriticalTrades,
    probabilityScore,
    confidence
  };
}

export type { LossType, SeverityLevel, ExpectedTrade, LossExpectation };
