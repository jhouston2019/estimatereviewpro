/**
 * COST BASELINE DATABASE
 * Regional min/max costs for exposure calculations
 * Version: 1.0.0 (2026.02)
 */

export const COST_BASELINE_VERSION = '1.0.0';
export const COST_BASELINE_DATE = '2026-02-10';
export const COST_BASELINE_REGION = 'US_NATIONAL_AVERAGE';

export interface CostRange {
  min: number;
  max: number;
  unit: string;
  description: string;
}

export const COST_BASELINE: Record<string, CostRange> = {
  // Drywall
  'DRY_REMOVE': { min: 1.5, max: 3.0, unit: 'SF', description: 'Remove drywall' },
  'DRY_REPLACE_1/2': { min: 3.5, max: 6.0, unit: 'SF', description: 'Replace drywall 1/2"' },
  'DRY_REPLACE_5/8': { min: 4.0, max: 7.0, unit: 'SF', description: 'Replace drywall 5/8"' },
  'DRY_CEILING': { min: 4.5, max: 8.0, unit: 'SF', description: 'Ceiling drywall' },
  
  // Insulation
  'INS_BATT_R13': { min: 1.5, max: 3.5, unit: 'SF', description: 'Batt insulation R13' },
  'INS_BATT_R19': { min: 2.0, max: 4.0, unit: 'SF', description: 'Batt insulation R19' },
  'INS_BLOWN': { min: 1.0, max: 2.5, unit: 'SF', description: 'Blown insulation' },
  
  // Paint
  'PNT_INTERIOR': { min: 1.5, max: 3.5, unit: 'SF', description: 'Interior paint' },
  'PNT_EXTERIOR': { min: 2.0, max: 4.5, unit: 'SF', description: 'Exterior paint' },
  'PNT_PRIMER': { min: 1.0, max: 2.0, unit: 'SF', description: 'Primer' },
  
  // Flooring
  'FLR_REMOVE': { min: 1.0, max: 2.5, unit: 'SF', description: 'Remove flooring' },
  'FLR_CARPET': { min: 3.0, max: 8.0, unit: 'SF', description: 'Install carpet' },
  'FLR_VINYL': { min: 4.0, max: 9.0, unit: 'SF', description: 'Install vinyl' },
  'FLR_TILE': { min: 8.0, max: 15.0, unit: 'SF', description: 'Install tile' },
  'FLR_HARDWOOD': { min: 10.0, max: 20.0, unit: 'SF', description: 'Install hardwood' },
  
  // Molding/Trim
  'MLD_BASEBOARD': { min: 3.0, max: 7.0, unit: 'LF', description: 'Baseboard' },
  'MLD_CROWN': { min: 5.0, max: 12.0, unit: 'LF', description: 'Crown molding' },
  'MLD_CASING': { min: 4.0, max: 9.0, unit: 'LF', description: 'Door/window casing' },
  
  // Roofing
  'RFG_SHINGLES': { min: 3.5, max: 6.0, unit: 'SQ', description: 'Asphalt shingles' },
  'RFG_UNDERLAYMENT': { min: 0.5, max: 1.5, unit: 'SQ', description: 'Underlayment' },
  'RFG_DRIP_EDGE': { min: 2.0, max: 4.0, unit: 'LF', description: 'Drip edge' },
  'RFG_ICE_WATER': { min: 3.0, max: 6.0, unit: 'LF', description: 'Ice & water shield' },
  
  // Cabinets
  'CAB_REMOVE': { min: 100, max: 300, unit: 'EA', description: 'Remove cabinet' },
  'CAB_STOCK': { min: 150, max: 400, unit: 'LF', description: 'Stock cabinets' },
  'CAB_SEMI_CUSTOM': { min: 300, max: 700, unit: 'LF', description: 'Semi-custom cabinets' },
  
  // Countertops
  'CTR_LAMINATE': { min: 25, max: 50, unit: 'SF', description: 'Laminate countertop' },
  'CTR_GRANITE': { min: 60, max: 120, unit: 'SF', description: 'Granite countertop' },
  'CTR_QUARTZ': { min: 70, max: 150, unit: 'SF', description: 'Quartz countertop' },
  
  // Electrical
  'ELE_OUTLET': { min: 75, max: 150, unit: 'EA', description: 'Electrical outlet' },
  'ELE_SWITCH': { min: 75, max: 150, unit: 'EA', description: 'Light switch' },
  'ELE_FIXTURE': { min: 100, max: 300, unit: 'EA', description: 'Light fixture' },
  'ELE_AFCI': { min: 150, max: 300, unit: 'EA', description: 'AFCI breaker' },
  
  // Plumbing
  'PLB_FIXTURE': { min: 200, max: 600, unit: 'EA', description: 'Plumbing fixture' },
  'PLB_SUPPLY': { min: 5, max: 12, unit: 'LF', description: 'Supply line' },
  'PLB_DRAIN': { min: 8, max: 18, unit: 'LF', description: 'Drain line' },
  
  // HVAC
  'HVC_DUCT': { min: 15, max: 35, unit: 'LF', description: 'Ductwork' },
  'HVC_REGISTER': { min: 50, max: 120, unit: 'EA', description: 'Register' },
  'HVC_UNIT': { min: 3000, max: 8000, unit: 'EA', description: 'HVAC unit' },
  
  // Detach/Reset
  'DTR_APPLIANCE': { min: 75, max: 200, unit: 'EA', description: 'Detach/reset appliance' },
  'DTR_FIXTURE': { min: 50, max: 150, unit: 'EA', description: 'Detach/reset fixture' },
  
  // Code Upgrades
  'CODE_SMOKE_DETECTOR': { min: 75, max: 150, unit: 'EA', description: 'Smoke detector' },
  'CODE_PERMIT': { min: 200, max: 800, unit: 'EA', description: 'Building permit' }
};

/**
 * Calculate exposure for missing items
 */
export function calculateMissingItemExposure(
  tradeCode: string,
  quantity: number,
  unit: string,
  itemType: string
): { min: number; max: number } | null {
  
  const key = `${tradeCode}_${itemType}`;
  const baseline = COST_BASELINE[key];
  
  if (!baseline) {
    return null;
  }
  
  // Convert units if needed
  let adjustedQuantity = quantity;
  
  if (baseline.unit === 'SQ' && unit === 'SF') {
    adjustedQuantity = quantity / 100; // 100 SF = 1 SQ
  }
  
  return {
    min: Math.round(adjustedQuantity * baseline.min),
    max: Math.round(adjustedQuantity * baseline.max)
  };
}

/**
 * Get baseline for display
 */
export function getBaseline(tradeCode: string, itemType: string): CostRange | null {
  const key = `${tradeCode}_${itemType}`;
  return COST_BASELINE[key] || null;
}
