/**
 * STRUCTURAL LOSS EXPECTATION ENGINE
 * Infers severity from ACTUAL trade density and quantity scale
 * Maps expected trades based on structural data, not assumptions
 */

import { StructuredEstimate } from './xactimate-structural-parser';

export type LossType = 'WATER' | 'FIRE' | 'WIND' | 'HAIL' | 'OTHER';
export type SeverityLevel = 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'CATEGORY_3' | 'LIGHT' | 'MODERATE' | 'HEAVY' | 'MINOR' | 'MAJOR';

export interface ExpectedTrade {
  tradeCode: string;
  tradeName: string;
  probability: number;
  reason: string;
}

export interface LossExpectation {
  lossType: LossType;
  severityLevel: SeverityLevel;
  expectedTrades: ExpectedTrade[];
  missingCriticalTrades: ExpectedTrade[];
  probabilityScore: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  inferenceDetails: {
    tradeCount: number;
    totalQuantity: number;
    avgQuantityPerTrade: number;
    hasStructuralTrades: boolean;
    hasMitigation: boolean;
  };
}

/**
 * Expected trade maps by loss type and severity
 */
const EXPECTED_TRADES: Record<string, ExpectedTrade[]> = {
  'WATER_LEVEL_1': [
    { tradeCode: 'MIT', tradeName: 'Mitigation', probability: 0.90, reason: 'Water extraction required' },
    { tradeCode: 'CLN', tradeName: 'Cleaning', probability: 0.85, reason: 'Cleaning and deodorizing' },
    { tradeCode: 'EQP', tradeName: 'Equipment', probability: 0.80, reason: 'Drying equipment' },
    { tradeCode: 'FLR', tradeName: 'Flooring', probability: 0.60, reason: 'Carpet/pad common' },
    { tradeCode: 'DRY', tradeName: 'Drywall', probability: 0.35, reason: 'Lower sections if saturated' },
    { tradeCode: 'PNT', tradeName: 'Painting', probability: 0.35, reason: 'If drywall affected' }
  ],
  
  'WATER_LEVEL_2': [
    { tradeCode: 'MIT', tradeName: 'Mitigation', probability: 0.98, reason: 'Required for gray water' },
    { tradeCode: 'DRY', tradeName: 'Drywall', probability: 0.85, reason: '2-4 foot flood cut typical' },
    { tradeCode: 'INS', tradeName: 'Insulation', probability: 0.80, reason: 'Exterior walls affected' },
    { tradeCode: 'PNT', tradeName: 'Painting', probability: 0.85, reason: 'After drywall' },
    { tradeCode: 'FLR', tradeName: 'Flooring', probability: 0.90, reason: 'Full replacement' },
    { tradeCode: 'MLD', tradeName: 'Molding/Trim', probability: 0.75, reason: 'Baseboard affected' },
    { tradeCode: 'CLN', tradeName: 'Cleaning', probability: 0.95, reason: 'Antimicrobial' },
    { tradeCode: 'EQP', tradeName: 'Equipment', probability: 0.90, reason: 'Extended drying' }
  ],
  
  'WATER_LEVEL_3': [
    { tradeCode: 'MIT', tradeName: 'Mitigation', probability: 1.00, reason: 'Mandatory for cat 3' },
    { tradeCode: 'DEM', tradeName: 'Demolition', probability: 0.95, reason: 'Extensive removal' },
    { tradeCode: 'DRY', tradeName: 'Drywall', probability: 0.98, reason: 'Full height removal' },
    { tradeCode: 'INS', tradeName: 'Insulation', probability: 0.95, reason: 'Must replace if wet' },
    { tradeCode: 'FLR', tradeName: 'Flooring', probability: 0.98, reason: 'Complete replacement' },
    { tradeCode: 'PNT', tradeName: 'Painting', probability: 0.98, reason: 'Full repaint' },
    { tradeCode: 'MLD', tradeName: 'Molding/Trim', probability: 0.90, reason: 'All trim affected' },
    { tradeCode: 'CAB', tradeName: 'Cabinets', probability: 0.75, reason: 'Kitchen/bath likely' },
    { tradeCode: 'ELE', tradeName: 'Electrical', probability: 0.70, reason: 'Below flood line' },
    { tradeCode: 'HAU', tradeName: 'Haul Away', probability: 0.95, reason: 'Major debris' }
  ],
  
  'FIRE_LIGHT': [
    { tradeCode: 'CLN', tradeName: 'Cleaning', probability: 0.98, reason: 'Smoke/soot removal' },
    { tradeCode: 'PNT', tradeName: 'Painting', probability: 0.85, reason: 'Seal smoke odor' },
    { tradeCode: 'FLR', tradeName: 'Flooring', probability: 0.50, reason: 'Carpet cleaning' },
    { tradeCode: 'HVA', tradeName: 'HVAC', probability: 0.60, reason: 'Duct cleaning' }
  ],
  
  'FIRE_MODERATE': [
    { tradeCode: 'DEM', tradeName: 'Demolition', probability: 0.90, reason: 'Remove burned materials' },
    { tradeCode: 'FRM', tradeName: 'Framing', probability: 0.70, reason: 'Structural repairs' },
    { tradeCode: 'DRY', tradeName: 'Drywall', probability: 0.95, reason: 'After framing' },
    { tradeCode: 'INS', tradeName: 'Insulation', probability: 0.85, reason: 'Fire/water damage' },
    { tradeCode: 'ELE', tradeName: 'Electrical', probability: 0.90, reason: 'Wiring replacement' },
    { tradeCode: 'PNT', tradeName: 'Painting', probability: 0.95, reason: 'Full repaint' },
    { tradeCode: 'FLR', tradeName: 'Flooring', probability: 0.85, reason: 'Replacement' },
    { tradeCode: 'MLD', tradeName: 'Molding/Trim', probability: 0.80, reason: 'Trim replacement' },
    { tradeCode: 'CLN', tradeName: 'Cleaning', probability: 0.95, reason: 'Smoke remediation' },
    { tradeCode: 'HAU', tradeName: 'Haul Away', probability: 0.90, reason: 'Debris removal' }
  ],
  
  'FIRE_HEAVY': [
    { tradeCode: 'DEM', tradeName: 'Demolition', probability: 1.00, reason: 'Complete gutting' },
    { tradeCode: 'FRM', tradeName: 'Framing', probability: 0.95, reason: 'Structural rebuild' },
    { tradeCode: 'RFG', tradeName: 'Roofing', probability: 0.90, reason: 'Full replacement' },
    { tradeCode: 'DRY', tradeName: 'Drywall', probability: 1.00, reason: 'Complete replacement' },
    { tradeCode: 'INS', tradeName: 'Insulation', probability: 1.00, reason: 'Full replacement' },
    { tradeCode: 'ELE', tradeName: 'Electrical', probability: 0.98, reason: 'Complete rewiring' },
    { tradeCode: 'PLM', tradeName: 'Plumbing', probability: 0.85, reason: 'Extensive repairs' },
    { tradeCode: 'HVA', tradeName: 'HVAC', probability: 0.90, reason: 'System replacement' },
    { tradeCode: 'PNT', tradeName: 'Painting', probability: 1.00, reason: 'Full interior/exterior' },
    { tradeCode: 'FLR', tradeName: 'Flooring', probability: 0.98, reason: 'Complete replacement' },
    { tradeCode: 'CAB', tradeName: 'Cabinets', probability: 0.95, reason: 'Full rebuild' },
    { tradeCode: 'HAU', tradeName: 'Haul Away', probability: 1.00, reason: 'Major debris' },
    { tradeCode: 'PER', tradeName: 'Permit', probability: 0.95, reason: 'Major reconstruction' }
  ],
  
  'WIND_MINOR': [
    { tradeCode: 'RFG', tradeName: 'Roofing', probability: 0.95, reason: 'Primary damage' },
    { tradeCode: 'SID', tradeName: 'Siding', probability: 0.40, reason: 'Wind-driven debris' },
    { tradeCode: 'WIN', tradeName: 'Windows', probability: 0.30, reason: 'Broken by debris' }
  ],
  
  'WIND_MAJOR': [
    { tradeCode: 'RFG', tradeName: 'Roofing', probability: 1.00, reason: 'Full replacement' },
    { tradeCode: 'FRM', tradeName: 'Framing', probability: 0.70, reason: 'Structural repairs' },
    { tradeCode: 'SID', tradeName: 'Siding', probability: 0.85, reason: 'Extensive damage' },
    { tradeCode: 'WIN', tradeName: 'Windows', probability: 0.70, reason: 'Multiple breakages' },
    { tradeCode: 'DRY', tradeName: 'Drywall', probability: 0.80, reason: 'Water intrusion' },
    { tradeCode: 'INS', tradeName: 'Insulation', probability: 0.75, reason: 'If wet' },
    { tradeCode: 'PNT', tradeName: 'Painting', probability: 0.80, reason: 'Interior repairs' },
    { tradeCode: 'DEM', tradeName: 'Demolition', probability: 0.70, reason: 'Remove damaged' },
    { tradeCode: 'HAU', tradeName: 'Haul Away', probability: 0.70, reason: 'Debris removal' },
    { tradeCode: 'PER', tradeName: 'Permit', probability: 0.80, reason: 'Structural work' }
  ]
};

/**
 * Infer loss type from ACTUAL trade presence
 */
function inferLossType(estimate: StructuredEstimate): LossType {
  const presentTrades = new Set(estimate.lineItems.map(item => item.tradeCode));
  
  // Water indicators
  const hasMitigation = presentTrades.has('MIT');
  const hasEquipment = presentTrades.has('EQP');
  const hasCleaning = presentTrades.has('CLN');
  
  if (hasMitigation || (hasCleaning && hasEquipment)) {
    return 'WATER';
  }
  
  // Fire indicators
  const hasDemolition = presentTrades.has('DEM');
  const hasFraming = presentTrades.has('FRM');
  const hasHaulAway = presentTrades.has('HAU');
  
  if (hasDemolition && hasFraming && hasHaulAway) {
    return 'FIRE';
  }
  
  // Wind indicators
  const hasRoofing = presentTrades.has('RFG');
  const hasSiding = presentTrades.has('SID');
  const hasWindows = presentTrades.has('WIN');
  
  if (hasRoofing && (hasSiding || hasWindows)) {
    return 'WIND';
  }
  
  // Default based on primary trade
  if (hasRoofing) return 'WIND';
  if (hasMitigation || hasCleaning) return 'WATER';
  
  return 'OTHER';
}

/**
 * Infer severity from ACTUAL quantities and trade density
 */
function inferSeverity(estimate: StructuredEstimate, lossType: LossType): SeverityLevel {
  const tradeCount = new Set(estimate.lineItems.map(item => item.tradeCode)).size;
  const totalQuantity = estimate.lineItems.reduce((sum, item) => sum + item.quantity, 0);
  const avgQuantity = totalQuantity / Math.max(estimate.lineItems.length, 1);
  
  // Check for structural trades
  const hasStructural = estimate.lineItems.some(item => 
    ['FRM', 'FND', 'STL', 'CON'].includes(item.tradeCode)
  );
  
  if (lossType === 'WATER') {
    // Calculate ACTUAL drywall quantity
    const drywallQty = estimate.lineItems
      .filter(item => item.tradeCode === 'DRY')
      .reduce((sum, item) => sum + item.quantity, 0);
    
    const hasDemolition = estimate.lineItems.some(item => item.tradeCode === 'DEM');
    
    // Category 3 indicators
    if (hasDemolition || drywallQty > 500 || hasStructural) {
      return 'CATEGORY_3';
    }
    
    // Level 2 vs Level 1 based on ACTUAL quantities
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
  
  return 'LEVEL_1';
}

/**
 * Calculate loss expectation from structured estimate
 */
export function calculateLossExpectation(estimate: StructuredEstimate): LossExpectation {
  // Infer loss type and severity from ACTUAL data
  const lossType = inferLossType(estimate);
  const severityLevel = inferSeverity(estimate, lossType);
  
  // Get expected trades for this scenario
  const key = `${lossType}_${severityLevel}`;
  const expectedTrades = EXPECTED_TRADES[key] || [];
  
  // Check which trades are present
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
  
  // Determine confidence based on parse quality
  let confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  if (estimate.parseConfidence > 0.90 && estimate.lineItems.length > 15) {
    confidence = 'HIGH';
  } else if (estimate.parseConfidence > 0.85 && estimate.lineItems.length > 8) {
    confidence = 'MEDIUM';
  } else {
    confidence = 'LOW';
  }
  
  // Inference details
  const tradeCount = new Set(estimate.lineItems.map(item => item.tradeCode)).size;
  const totalQuantity = estimate.lineItems.reduce((sum, item) => sum + item.quantity, 0);
  const avgQuantityPerTrade = totalQuantity / Math.max(estimate.lineItems.length, 1);
  const hasStructuralTrades = estimate.lineItems.some(item => 
    ['FRM', 'FND', 'STL', 'CON'].includes(item.tradeCode)
  );
  const hasMitigation = estimate.lineItems.some(item => item.tradeCode === 'MIT');
  
  return {
    lossType,
    severityLevel,
    expectedTrades,
    missingCriticalTrades,
    probabilityScore,
    confidence,
    inferenceDetails: {
      tradeCount,
      totalQuantity: Math.round(totalQuantity * 100) / 100,
      avgQuantityPerTrade: Math.round(avgQuantityPerTrade * 100) / 100,
      hasStructuralTrades,
      hasMitigation
    }
  };
}
