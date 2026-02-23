/**
 * COST BASELINE DATABASE
 * Regional baseline costs for exposure calculations
 * Conservative ranges based on national averages
 * Updated: 2026-02-20
 */

export interface CostRange {
  min: number;
  max: number;
  unit: string;
  notes?: string;
}

/**
 * Baseline costs by trade and item type
 */
export const COST_BASELINE: Record<string, CostRange> = {
  // DRYWALL
  'DRY_REMOVE': { min: 1.00, max: 2.50, unit: 'SF', notes: 'Removal only' },
  'DRY_REPLACE_1/2': { min: 2.50, max: 5.00, unit: 'SF', notes: '1/2" drywall R&R' },
  'DRY_REPLACE_5/8': { min: 2.75, max: 5.50, unit: 'SF', notes: '5/8" drywall R&R' },
  'DRY_REPAIR': { min: 1.50, max: 3.00, unit: 'SF', notes: 'Patch and repair' },
  'DRY_CEILING': { min: 3.00, max: 6.00, unit: 'SF', notes: 'Ceiling work premium' },
  
  // PAINTING
  'PNT_INTERIOR_WALL': { min: 1.50, max: 3.50, unit: 'SF', notes: 'Interior walls' },
  'PNT_INTERIOR_CEILING': { min: 1.75, max: 3.75, unit: 'SF', notes: 'Interior ceilings' },
  'PNT_EXTERIOR': { min: 2.00, max: 4.50, unit: 'SF', notes: 'Exterior surfaces' },
  'PNT_TRIM': { min: 2.50, max: 5.00, unit: 'LF', notes: 'Trim and molding' },
  'PNT_PRIMER': { min: 0.75, max: 1.50, unit: 'SF', notes: 'Primer coat' },
  
  // FLOORING
  'FLR_REMOVE': { min: 0.50, max: 1.50, unit: 'SF', notes: 'Flooring removal' },
  'CRP_INSTALL': { min: 3.00, max: 8.00, unit: 'SF', notes: 'Carpet with pad' },
  'VCT_INSTALL': { min: 4.00, max: 10.00, unit: 'SF', notes: 'Vinyl plank' },
  'TIL_INSTALL': { min: 8.00, max: 20.00, unit: 'SF', notes: 'Ceramic/porcelain tile' },
  'WDP_INSTALL': { min: 10.00, max: 25.00, unit: 'SF', notes: 'Hardwood flooring' },
  
  // INSULATION
  'INS_BATT_R13': { min: 1.00, max: 2.50, unit: 'SF', notes: 'R-13 batt insulation' },
  'INS_BATT_R19': { min: 1.25, max: 2.75, unit: 'SF', notes: 'R-19 batt insulation' },
  'INS_BATT_R30': { min: 1.50, max: 3.00, unit: 'SF', notes: 'R-30 batt insulation' },
  'INS_BLOWN': { min: 1.50, max: 3.00, unit: 'SF', notes: 'Blown-in insulation' },
  
  // ROOFING
  'RFG_REMOVE_SHINGLES': { min: 50, max: 100, unit: 'SQ', notes: 'Shingle removal per square' },
  'RFG_INSTALL_SHINGLES': { min: 250, max: 450, unit: 'SQ', notes: 'Architectural shingles' },
  'RFG_INSTALL_PREMIUM': { min: 350, max: 650, unit: 'SQ', notes: 'Premium shingles' },
  'RFG_DRIP_EDGE': { min: 3.00, max: 6.00, unit: 'LF', notes: 'Drip edge' },
  'RFG_ICE_WATER': { min: 4.00, max: 8.00, unit: 'SF', notes: 'Ice & water shield' },
  'RFG_UNDERLAYMENT': { min: 20, max: 40, unit: 'SQ', notes: 'Felt underlayment' },
  'RFG_DECKING': { min: 3.00, max: 6.00, unit: 'SF', notes: 'Roof decking repair' },
  
  // TRIM/MOLDING
  'MLD_BASEBOARD': { min: 3.00, max: 8.00, unit: 'LF', notes: 'Baseboard' },
  'MLD_CROWN': { min: 5.00, max: 12.00, unit: 'LF', notes: 'Crown molding' },
  'MLD_CASING': { min: 4.00, max: 10.00, unit: 'LF', notes: 'Door/window casing' },
  'MLD_CHAIR_RAIL': { min: 4.00, max: 9.00, unit: 'LF', notes: 'Chair rail' },
  
  // CABINETS
  'CAB_REMOVE': { min: 15, max: 30, unit: 'LF', notes: 'Cabinet removal' },
  'CAB_BASE_STOCK': { min: 150, max: 350, unit: 'LF', notes: 'Stock base cabinets' },
  'CAB_BASE_CUSTOM': { min: 300, max: 600, unit: 'LF', notes: 'Custom base cabinets' },
  'CAB_WALL_STOCK': { min: 120, max: 300, unit: 'LF', notes: 'Stock wall cabinets' },
  'CAB_WALL_CUSTOM': { min: 250, max: 500, unit: 'LF', notes: 'Custom wall cabinets' },
  
  // COUNTERTOPS
  'CTR_LAMINATE': { min: 25, max: 50, unit: 'SF', notes: 'Laminate countertop' },
  'CTR_GRANITE': { min: 60, max: 150, unit: 'SF', notes: 'Granite countertop' },
  'CTR_QUARTZ': { min: 70, max: 180, unit: 'SF', notes: 'Quartz countertop' },
  
  // ELECTRICAL
  'ELE_OUTLET': { min: 75, max: 150, unit: 'EA', notes: 'Outlet replacement' },
  'ELE_SWITCH': { min: 75, max: 150, unit: 'EA', notes: 'Switch replacement' },
  'ELE_AFCI': { min: 150, max: 300, unit: 'EA', notes: 'AFCI breaker' },
  'ELE_GFCI': { min: 100, max: 200, unit: 'EA', notes: 'GFCI outlet' },
  'ELE_SMOKE_DETECTOR': { min: 100, max: 200, unit: 'EA', notes: 'Hardwired smoke detector' },
  'ELE_CO_DETECTOR': { min: 100, max: 200, unit: 'EA', notes: 'CO detector' },
  'ELE_REWIRE_ROOM': { min: 800, max: 2000, unit: 'EA', notes: 'Complete room rewire' },
  
  // PLUMBING
  'PLM_FIXTURE': { min: 200, max: 800, unit: 'EA', notes: 'Plumbing fixture' },
  'PLM_WATER_HEATER': { min: 800, max: 2000, unit: 'EA', notes: 'Water heater' },
  'PLM_DETACH_RESET': { min: 100, max: 250, unit: 'EA', notes: 'Detach/reset fixture' },
  
  // FRAMING
  'FRM_WALL_REPAIR': { min: 15, max: 30, unit: 'LF', notes: 'Wall framing repair' },
  'FRM_CEILING_JOIST': { min: 20, max: 40, unit: 'LF', notes: 'Ceiling joist repair' },
  'FRM_STRUCTURAL': { min: 25, max: 50, unit: 'LF', notes: 'Structural framing' },
  
  // SIDING
  'SID_VINYL': { min: 5.00, max: 12.00, unit: 'SF', notes: 'Vinyl siding' },
  'SID_FIBER_CEMENT': { min: 8.00, max: 18.00, unit: 'SF', notes: 'Fiber cement siding' },
  'SID_WOOD': { min: 10.00, max: 22.00, unit: 'SF', notes: 'Wood siding' },
  
  // WINDOWS/DOORS
  'WIN_STANDARD': { min: 400, max: 800, unit: 'EA', notes: 'Standard window' },
  'WIN_LARGE': { min: 600, max: 1200, unit: 'EA', notes: 'Large window' },
  'DOR_INTERIOR': { min: 300, max: 700, unit: 'EA', notes: 'Interior door' },
  'DOR_EXTERIOR': { min: 600, max: 1500, unit: 'EA', notes: 'Exterior door' },
  
  // DEMOLITION/CLEANUP
  'DEM_INTERIOR': { min: 1.50, max: 4.00, unit: 'SF', notes: 'Interior demolition' },
  'HAU_DEBRIS': { min: 300, max: 1000, unit: 'LS', notes: 'Debris haul away' },
  'CLN_STANDARD': { min: 0.50, max: 1.50, unit: 'SF', notes: 'Standard cleaning' },
  'CLN_ANTIMICROBIAL': { min: 1.00, max: 2.50, unit: 'SF', notes: 'Antimicrobial treatment' },
  
  // MITIGATION/EQUIPMENT
  'MIT_WATER': { min: 1500, max: 4000, unit: 'LS', notes: 'Water mitigation service' },
  'EQP_DRYING': { min: 300, max: 1000, unit: 'LS', notes: 'Drying equipment rental' },
  
  // CODE/PERMITS
  'PER_BUILDING': { min: 200, max: 1000, unit: 'EA', notes: 'Building permit' },
  'PER_ELECTRICAL': { min: 100, max: 400, unit: 'EA', notes: 'Electrical permit' },
  'PER_PLUMBING': { min: 100, max: 400, unit: 'EA', notes: 'Plumbing permit' },
  'COD_UPGRADE': { min: 500, max: 2000, unit: 'EA', notes: 'Code upgrade work' }
};

/**
 * Get cost range for trade item
 */
export function getCostRange(
  tradeCode: string,
  itemType: string = 'STANDARD'
): CostRange | null {
  const key = `${tradeCode}_${itemType}`;
  
  if (COST_BASELINE[key]) {
    return COST_BASELINE[key];
  }
  
  // Try without item type
  const baseKey = Object.keys(COST_BASELINE).find(k => k.startsWith(tradeCode + '_'));
  if (baseKey) {
    return COST_BASELINE[baseKey];
  }
  
  return null;
}

/**
 * Calculate exposure for missing item
 */
export function calculateMissingItemExposure(
  tradeCode: string,
  quantity: number,
  unit: string,
  itemType: string = 'STANDARD'
): { min: number; max: number } | null {
  
  const costRange = getCostRange(tradeCode, itemType);
  
  if (!costRange) {
    return null;
  }
  
  // Verify unit matches
  if (costRange.unit !== unit) {
    // Try to convert units if possible
    // For now, return null if mismatch
    return null;
  }
  
  return {
    min: Math.round(quantity * costRange.min * 100) / 100,
    max: Math.round(quantity * costRange.max * 100) / 100
  };
}

/**
 * Get all available cost items for a trade
 */
export function getTradeCodeCosts(tradeCode: string): Record<string, CostRange> {
  const results: Record<string, CostRange> = {};
  
  for (const [key, value] of Object.entries(COST_BASELINE)) {
    if (key.startsWith(tradeCode + '_')) {
      results[key] = value;
    }
  }
  
  return results;
}
