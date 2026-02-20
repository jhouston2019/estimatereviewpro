/**
 * FINANCIAL EXPOSURE ENGINE
 * Calculates potential cost exposure for missing or incomplete scope items
 * Produces min/max ranges based on regional averages and severity
 */

import { ParsedEstimate, LineItem } from './xactimate-parser';

type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'MINIMAL';

interface ExposureItem {
  missingTrade: string;
  missingTradeName: string;
  relatedTrade?: string;
  relatedTradeName?: string;
  reason: string;
  estimatedExposureMin: number;
  estimatedExposureMax: number;
  severity: SeverityLevel;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface ExposureAnalysis {
  totalExposureMin: number;
  totalExposureMax: number;
  riskScore: number; // 0-100
  exposureItems: ExposureItem[];
  summary: string;
}

// Regional cost averages (per unit) - conservative estimates
const REGIONAL_COSTS: Record<string, { min: number; max: number; unit: string }> = {
  // Painting (per SF)
  'PNT_INTERIOR': { min: 1.50, max: 3.50, unit: 'SF' },
  'PNT_EXTERIOR': { min: 2.00, max: 4.50, unit: 'SF' },
  'PNT_CEILING': { min: 1.75, max: 3.75, unit: 'SF' },
  
  // Drywall (per SF)
  'DRY_REPLACE': { min: 2.50, max: 5.00, unit: 'SF' },
  'DRY_REPAIR': { min: 1.50, max: 3.00, unit: 'SF' },
  
  // Flooring (per SF)
  'FLR_CARPET': { min: 3.00, max: 8.00, unit: 'SF' },
  'FLR_VINYL': { min: 4.00, max: 10.00, unit: 'SF' },
  'FLR_TILE': { min: 8.00, max: 20.00, unit: 'SF' },
  'FLR_HARDWOOD': { min: 10.00, max: 25.00, unit: 'SF' },
  
  // Insulation (per SF)
  'INS_BATT': { min: 1.00, max: 2.50, unit: 'SF' },
  'INS_BLOWN': { min: 1.50, max: 3.00, unit: 'SF' },
  
  // Roofing (per SQ = 100 SF)
  'RFG_SHINGLE': { min: 350, max: 650, unit: 'SQ' },
  'RFG_DRIP_EDGE': { min: 3.00, max: 6.00, unit: 'LF' },
  'RFG_ICE_WATER': { min: 4.00, max: 8.00, unit: 'SF' },
  
  // Electrical (per EA or per room)
  'ELE_OUTLET': { min: 75, max: 150, unit: 'EA' },
  'ELE_SWITCH': { min: 75, max: 150, unit: 'EA' },
  'ELE_AFCI': { min: 150, max: 300, unit: 'EA' },
  'ELE_SMOKE_DETECTOR': { min: 100, max: 200, unit: 'EA' },
  
  // Plumbing (per fixture)
  'PLM_FIXTURE': { min: 200, max: 800, unit: 'EA' },
  'PLM_WATER_HEATER': { min: 800, max: 2000, unit: 'EA' },
  
  // Trim/Molding (per LF)
  'MLD_BASEBOARD': { min: 3.00, max: 8.00, unit: 'LF' },
  'MLD_CROWN': { min: 5.00, max: 12.00, unit: 'LF' },
  'MLD_CASING': { min: 4.00, max: 10.00, unit: 'LF' },
  
  // Cabinets (per LF)
  'CAB_BASE': { min: 200, max: 600, unit: 'LF' },
  'CAB_WALL': { min: 150, max: 450, unit: 'LF' },
  
  // Countertops (per SF)
  'CTR_LAMINATE': { min: 25, max: 50, unit: 'SF' },
  'CTR_GRANITE': { min: 60, max: 150, unit: 'SF' },
  
  // Permits and code items
  'PER_PERMIT': { min: 200, max: 1000, unit: 'EA' },
  'COD_UPGRADE': { min: 500, max: 2000, unit: 'EA' }
};

/**
 * Calculate severity based on exposure amount
 */
function calculateSeverity(exposureMin: number, exposureMax: number, totalEstimate: number): SeverityLevel {
  const avgExposure = (exposureMin + exposureMax) / 2;
  const percentOfTotal = totalEstimate > 0 ? (avgExposure / totalEstimate) * 100 : 0;
  
  if (avgExposure > 5000 || percentOfTotal > 20) return 'CRITICAL';
  if (avgExposure > 2000 || percentOfTotal > 10) return 'HIGH';
  if (avgExposure > 1000 || percentOfTotal > 5) return 'MODERATE';
  if (avgExposure > 500 || percentOfTotal > 2) return 'LOW';
  return 'MINIMAL';
}

/**
 * Check for missing paint after drywall work
 */
function checkMissingPaint(estimate: ParsedEstimate): ExposureItem | null {
  const hasDrywall = estimate.lineItems.some(item => 
    item.tradeCode === 'DRY' && (item.actionType === 'REPLACE' || item.actionType === 'INSTALL')
  );
  
  const hasPaint = estimate.lineItems.some(item => item.tradeCode === 'PNT');
  
  if (hasDrywall && !hasPaint) {
    // Estimate paint quantity from drywall quantity
    const drywallQuantity = estimate.lineItems
      .filter(item => item.tradeCode === 'DRY')
      .reduce((sum, item) => sum + item.quantity, 0);
    
    const paintCost = REGIONAL_COSTS['PNT_INTERIOR'];
    const exposureMin = drywallQuantity * paintCost.min;
    const exposureMax = drywallQuantity * paintCost.max;
    
    return {
      missingTrade: 'PNT',
      missingTradeName: 'Painting',
      relatedTrade: 'DRY',
      relatedTradeName: 'Drywall',
      reason: 'Drywall replacement/installation present without corresponding paint',
      estimatedExposureMin: Math.round(exposureMin),
      estimatedExposureMax: Math.round(exposureMax),
      severity: calculateSeverity(exposureMin, exposureMax, estimate.totals.rcv),
      confidence: 'HIGH'
    };
  }
  
  return null;
}

/**
 * Check for missing insulation after drywall removal
 */
function checkMissingInsulation(estimate: ParsedEstimate): ExposureItem | null {
  const hasDrywallRemoval = estimate.lineItems.some(item => 
    item.tradeCode === 'DRY' && item.actionType === 'REMOVE'
  );
  
  const hasInsulation = estimate.lineItems.some(item => item.tradeCode === 'INS');
  
  if (hasDrywallRemoval && !hasInsulation) {
    const drywallQuantity = estimate.lineItems
      .filter(item => item.tradeCode === 'DRY' && item.actionType === 'REMOVE')
      .reduce((sum, item) => sum + item.quantity, 0);
    
    const insCost = REGIONAL_COSTS['INS_BATT'];
    const exposureMin = drywallQuantity * insCost.min;
    const exposureMax = drywallQuantity * insCost.max;
    
    return {
      missingTrade: 'INS',
      missingTradeName: 'Insulation',
      relatedTrade: 'DRY',
      relatedTradeName: 'Drywall',
      reason: 'Drywall removal present without insulation replacement',
      estimatedExposureMin: Math.round(exposureMin),
      estimatedExposureMax: Math.round(exposureMax),
      severity: calculateSeverity(exposureMin, exposureMax, estimate.totals.rcv),
      confidence: 'MEDIUM'
    };
  }
  
  return null;
}

/**
 * Check for removal without replacement
 */
function checkRemovalWithoutReplacement(estimate: ParsedEstimate): ExposureItem[] {
  const exposures: ExposureItem[] = [];
  
  // Group by trade code
  const tradeGroups = new Map<string, LineItem[]>();
  for (const item of estimate.lineItems) {
    if (!tradeGroups.has(item.tradeCode)) {
      tradeGroups.set(item.tradeCode, []);
    }
    tradeGroups.get(item.tradeCode)!.push(item);
  }
  
  // Check each trade
  for (const [tradeCode, items] of tradeGroups) {
    const hasRemoval = items.some(item => item.actionType === 'REMOVE');
    const hasReplacement = items.some(item => 
      item.actionType === 'REPLACE' || item.actionType === 'INSTALL'
    );
    
    if (hasRemoval && !hasReplacement) {
      const removalQty = items
        .filter(item => item.actionType === 'REMOVE')
        .reduce((sum, item) => sum + item.quantity, 0);
      
      // Estimate replacement cost (typically 2-3x removal cost)
      const removalCost = items
        .filter(item => item.actionType === 'REMOVE')
        .reduce((sum, item) => sum + item.rcv, 0);
      
      const exposureMin = removalCost * 2;
      const exposureMax = removalCost * 4;
      
      exposures.push({
        missingTrade: tradeCode,
        missingTradeName: items[0].tradeName,
        reason: `${items[0].tradeName} removal present without replacement`,
        estimatedExposureMin: Math.round(exposureMin),
        estimatedExposureMax: Math.round(exposureMax),
        severity: calculateSeverity(exposureMin, exposureMax, estimate.totals.rcv),
        confidence: 'MEDIUM'
      });
    }
  }
  
  return exposures;
}

/**
 * Check for missing trim/molding after flooring
 */
function checkMissingTrim(estimate: ParsedEstimate): ExposureItem | null {
  const hasFlooring = estimate.lineItems.some(item => 
    item.tradeCode === 'FLR' || item.tradeCode === 'CRP' || item.tradeCode === 'VCT'
  );
  
  const hasTrim = estimate.lineItems.some(item => item.tradeCode === 'MLD');
  
  if (hasFlooring && !hasTrim) {
    // Estimate baseboard from flooring SF
    const flooringSF = estimate.lineItems
      .filter(item => ['FLR', 'CRP', 'VCT'].includes(item.tradeCode))
      .reduce((sum, item) => sum + item.quantity, 0);
    
    // Rough estimate: perimeter = sqrt(SF) * 4
    const estimatedLF = Math.sqrt(flooringSF) * 4;
    
    const trimCost = REGIONAL_COSTS['MLD_BASEBOARD'];
    const exposureMin = estimatedLF * trimCost.min;
    const exposureMax = estimatedLF * trimCost.max;
    
    return {
      missingTrade: 'MLD',
      missingTradeName: 'Molding/Trim',
      relatedTrade: 'FLR',
      relatedTradeName: 'Flooring',
      reason: 'Flooring replacement present without baseboard/trim',
      estimatedExposureMin: Math.round(exposureMin),
      estimatedExposureMax: Math.round(exposureMax),
      severity: calculateSeverity(exposureMin, exposureMax, estimate.totals.rcv),
      confidence: 'MEDIUM'
    };
  }
  
  return null;
}

/**
 * Check for missing code upgrades
 */
function checkMissingCodeItems(estimate: ParsedEstimate): ExposureItem[] {
  const exposures: ExposureItem[] = [];
  
  const hasElectrical = estimate.lineItems.some(item => item.tradeCode === 'ELE');
  const hasRoofing = estimate.lineItems.some(item => item.tradeCode === 'RFG');
  const hasAFCI = estimate.lineItems.some(item => 
    item.description.toLowerCase().includes('afci')
  );
  const hasDripEdge = estimate.lineItems.some(item => 
    item.description.toLowerCase().includes('drip edge')
  );
  const hasIceWater = estimate.lineItems.some(item => 
    item.description.toLowerCase().includes('ice') && item.description.toLowerCase().includes('water')
  );
  
  // Missing AFCI
  if (hasElectrical && !hasAFCI) {
    const afciCost = REGIONAL_COSTS['ELE_AFCI'];
    // Estimate 2-4 circuits
    const exposureMin = afciCost.min * 2;
    const exposureMax = afciCost.max * 4;
    
    exposures.push({
      missingTrade: 'ELE',
      missingTradeName: 'Electrical - AFCI',
      relatedTrade: 'ELE',
      relatedTradeName: 'Electrical',
      reason: 'Electrical work present without AFCI breakers (code requirement)',
      estimatedExposureMin: Math.round(exposureMin),
      estimatedExposureMax: Math.round(exposureMax),
      severity: 'MODERATE',
      confidence: 'MEDIUM'
    });
  }
  
  // Missing drip edge
  if (hasRoofing && !hasDripEdge) {
    const roofingQty = estimate.lineItems
      .filter(item => item.tradeCode === 'RFG')
      .reduce((sum, item) => sum + item.quantity, 0);
    
    // Estimate perimeter from roof area (rough)
    const estimatedLF = Math.sqrt(roofingQty * 100) * 4;
    
    const dripCost = REGIONAL_COSTS['RFG_DRIP_EDGE'];
    const exposureMin = estimatedLF * dripCost.min;
    const exposureMax = estimatedLF * dripCost.max;
    
    exposures.push({
      missingTrade: 'RFG',
      missingTradeName: 'Roofing - Drip Edge',
      relatedTrade: 'RFG',
      relatedTradeName: 'Roofing',
      reason: 'Roofing work present without drip edge (code requirement)',
      estimatedExposureMin: Math.round(exposureMin),
      estimatedExposureMax: Math.round(exposureMax),
      severity: 'MODERATE',
      confidence: 'MEDIUM'
    });
  }
  
  return exposures;
}

/**
 * Main exposure calculation function
 */
export function calculateExposure(estimate: ParsedEstimate): ExposureAnalysis {
  const exposureItems: ExposureItem[] = [];
  
  // Run all checks
  const missingPaint = checkMissingPaint(estimate);
  if (missingPaint) exposureItems.push(missingPaint);
  
  const missingInsulation = checkMissingInsulation(estimate);
  if (missingInsulation) exposureItems.push(missingInsulation);
  
  const removalExposures = checkRemovalWithoutReplacement(estimate);
  exposureItems.push(...removalExposures);
  
  const missingTrim = checkMissingTrim(estimate);
  if (missingTrim) exposureItems.push(missingTrim);
  
  const codeExposures = checkMissingCodeItems(estimate);
  exposureItems.push(...codeExposures);
  
  // Calculate totals
  const totalExposureMin = exposureItems.reduce((sum, item) => sum + item.estimatedExposureMin, 0);
  const totalExposureMax = exposureItems.reduce((sum, item) => sum + item.estimatedExposureMax, 0);
  
  // Calculate risk score (0-100)
  const avgExposure = (totalExposureMin + totalExposureMax) / 2;
  const percentOfEstimate = estimate.totals.rcv > 0 ? (avgExposure / estimate.totals.rcv) * 100 : 0;
  const criticalCount = exposureItems.filter(item => item.severity === 'CRITICAL').length;
  const highCount = exposureItems.filter(item => item.severity === 'HIGH').length;
  
  let riskScore = Math.min(100, Math.round(
    percentOfEstimate + 
    (criticalCount * 20) + 
    (highCount * 10) +
    (exposureItems.length * 5)
  ));
  
  // Generate summary
  let summary = '';
  if (exposureItems.length === 0) {
    summary = 'No significant scope gaps or missing items detected based on structural analysis.';
  } else {
    summary = `Identified ${exposureItems.length} potential scope gap(s) with estimated exposure range of $${totalExposureMin.toLocaleString()} - $${totalExposureMax.toLocaleString()}. `;
    
    const critical = exposureItems.filter(item => item.severity === 'CRITICAL');
    const high = exposureItems.filter(item => item.severity === 'HIGH');
    
    if (critical.length > 0) {
      summary += `${critical.length} critical item(s) require immediate attention. `;
    }
    if (high.length > 0) {
      summary += `${high.length} high-priority item(s) identified. `;
    }
  }
  
  return {
    totalExposureMin: Math.round(totalExposureMin),
    totalExposureMax: Math.round(totalExposureMax),
    riskScore,
    exposureItems,
    summary
  };
}

export type { ExposureItem, ExposureAnalysis, SeverityLevel };
