/**
 * STRUCTURAL EXPOSURE ENGINE
 * Calculates financial exposure using ACTUAL parsed quantities
 * NO STATIC ESTIMATES - ties directly to structured data
 */

import { StructuredEstimate, StructuredLineItem } from './xactimate-structural-parser';
import { calculateMissingItemExposure, COST_BASELINE } from './cost-baseline';

type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'MINIMAL';

export interface ExposureItem {
  missingTrade: string;
  missingTradeName: string;
  relatedTrade: string;
  relatedTradeName: string;
  reason: string;
  quantity: number;
  unit: string;
  minExposure: number;
  maxExposure: number;
  severity: SeverityLevel;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  calculation: string;
}

export interface ExposureAnalysis {
  exposures: ExposureItem[];
  totalExposureMin: number;
  totalExposureMax: number;
  riskScore: number;
  summary: string;
}

/**
 * Trade name mapping
 */
const TRADE_NAMES: Record<string, string> = {
  'DRY': 'Drywall',
  'PNT': 'Painting',
  'INS': 'Insulation',
  'MLD': 'Molding/Trim',
  'FLR': 'Flooring',
  'CRP': 'Carpet',
  'VCT': 'Vinyl',
  'RFG': 'Roofing',
  'ELE': 'Electrical',
  'PLM': 'Plumbing',
  'CAB': 'Cabinets',
  'CTR': 'Countertops',
  'DET': 'Detach/Reset'
};

/**
 * Calculate severity based on exposure amount and estimate total
 */
function calculateSeverity(exposureMin: number, exposureMax: number, totalRCV: number): SeverityLevel {
  const avgExposure = (exposureMin + exposureMax) / 2;
  const percentOfTotal = totalRCV > 0 ? (avgExposure / totalRCV) * 100 : 0;
  
  if (avgExposure > 5000 || percentOfTotal > 20) return 'CRITICAL';
  if (avgExposure > 2000 || percentOfTotal > 10) return 'HIGH';
  if (avgExposure > 1000 || percentOfTotal > 5) return 'MODERATE';
  if (avgExposure > 500 || percentOfTotal > 2) return 'LOW';
  return 'MINIMAL';
}

/**
 * Check for missing paint after drywall work
 * Uses ACTUAL drywall quantities from parsed data
 */
function checkMissingPaint(estimate: StructuredEstimate): ExposureItem | null {
  const drywallItems = estimate.lineItems.filter(item => 
    item.tradeCode === 'DRY' && 
    (item.actionType === 'REPLACE' || item.actionType === 'INSTALL')
  );
  
  const paintItems = estimate.lineItems.filter(item => item.tradeCode === 'PNT');
  
  if (drywallItems.length > 0 && paintItems.length === 0) {
    // Sum ACTUAL drywall quantities
    const totalDrywallSF = drywallItems.reduce((sum, item) => sum + item.quantity, 0);
    
    // Calculate exposure using cost baseline
    const exposure = calculateMissingItemExposure('PNT', totalDrywallSF, 'SF', 'INTERIOR_WALL');
    
    if (!exposure) {
      return null;
    }
    
    return {
      missingTrade: 'PNT',
      missingTradeName: 'Painting',
      relatedTrade: 'DRY',
      relatedTradeName: 'Drywall',
      reason: 'Drywall replacement/installation present without corresponding paint',
      quantity: totalDrywallSF,
      unit: 'SF',
      minExposure: exposure.min,
      maxExposure: exposure.max,
      severity: calculateSeverity(exposure.min, exposure.max, estimate.totals.rcv),
      confidence: 'HIGH',
      calculation: `${totalDrywallSF} SF × $${COST_BASELINE['PNT_INTERIOR_WALL'].min}-${COST_BASELINE['PNT_INTERIOR_WALL'].max}/SF`
    };
  }
  
  return null;
}

/**
 * Check for missing insulation after drywall removal
 * Uses ACTUAL removal quantities
 */
function checkMissingInsulation(estimate: StructuredEstimate): ExposureItem | null {
  const drywallRemoval = estimate.lineItems.filter(item => 
    item.tradeCode === 'DRY' && item.actionType === 'REMOVE'
  );
  
  const insulationItems = estimate.lineItems.filter(item => item.tradeCode === 'INS');
  
  if (drywallRemoval.length > 0 && insulationItems.length === 0) {
    const totalRemovalSF = drywallRemoval.reduce((sum, item) => sum + item.quantity, 0);
    
    const exposure = calculateMissingItemExposure('INS', totalRemovalSF, 'SF', 'BATT_R13');
    
    if (!exposure) {
      return null;
    }
    
    return {
      missingTrade: 'INS',
      missingTradeName: 'Insulation',
      relatedTrade: 'DRY',
      relatedTradeName: 'Drywall',
      reason: 'Drywall removal present without insulation replacement',
      quantity: totalRemovalSF,
      unit: 'SF',
      minExposure: exposure.min,
      maxExposure: exposure.max,
      severity: calculateSeverity(exposure.min, exposure.max, estimate.totals.rcv),
      confidence: 'MEDIUM',
      calculation: `${totalRemovalSF} SF × $${COST_BASELINE['INS_BATT_R13'].min}-${COST_BASELINE['INS_BATT_R13'].max}/SF`
    };
  }
  
  return null;
}

/**
 * Check for removal without replacement
 * Uses ACTUAL quantities to calculate exposure
 */
function checkRemovalWithoutReplacement(estimate: StructuredEstimate): ExposureItem[] {
  const exposures: ExposureItem[] = [];
  
  // Group by trade code
  const tradeGroups = new Map<string, StructuredLineItem[]>();
  for (const item of estimate.lineItems) {
    if (!tradeGroups.has(item.tradeCode)) {
      tradeGroups.set(item.tradeCode, []);
    }
    tradeGroups.get(item.tradeCode)!.push(item);
  }
  
  // Check each trade
  for (const [tradeCode, items] of tradeGroups) {
    const removals = items.filter(item => item.actionType === 'REMOVE');
    const replacements = items.filter(item => 
      item.actionType === 'REPLACE' || item.actionType === 'INSTALL'
    );
    
    if (removals.length > 0 && replacements.length === 0) {
      // Calculate ACTUAL removal quantity
      const totalRemovalQty = removals.reduce((sum, item) => sum + item.quantity, 0);
      const unit = removals[0].unit;
      
      // Estimate replacement cost (typically 2-3x removal cost)
      const removalCost = removals.reduce((sum, item) => sum + item.rcv, 0);
      const exposureMin = removalCost * 2;
      const exposureMax = removalCost * 4;
      
      exposures.push({
        missingTrade: tradeCode,
        missingTradeName: TRADE_NAMES[tradeCode] || tradeCode,
        relatedTrade: tradeCode,
        relatedTradeName: TRADE_NAMES[tradeCode] || tradeCode,
        reason: `${TRADE_NAMES[tradeCode] || tradeCode} removal present without replacement`,
        quantity: totalRemovalQty,
        unit,
        minExposure: Math.round(exposureMin * 100) / 100,
        maxExposure: Math.round(exposureMax * 100) / 100,
        severity: calculateSeverity(exposureMin, exposureMax, estimate.totals.rcv),
        confidence: 'MEDIUM',
        calculation: `Removal cost $${removalCost.toFixed(2)} × 2-4x multiplier`
      });
    }
  }
  
  return exposures;
}

/**
 * Check for missing trim after flooring
 * Uses ACTUAL flooring quantities to estimate perimeter
 */
function checkMissingTrim(estimate: StructuredEstimate): ExposureItem | null {
  const flooringItems = estimate.lineItems.filter(item => 
    ['FLR', 'CRP', 'VCT'].includes(item.tradeCode) &&
    (item.actionType === 'REPLACE' || item.actionType === 'INSTALL')
  );
  
  const trimItems = estimate.lineItems.filter(item => item.tradeCode === 'MLD');
  
  if (flooringItems.length > 0 && trimItems.length === 0) {
    const totalFlooringSF = flooringItems.reduce((sum, item) => sum + item.quantity, 0);
    
    // Calculate perimeter from area: perimeter ≈ sqrt(area) × 4
    const estimatedPerimeterLF = Math.sqrt(totalFlooringSF) * 4;
    
    const exposure = calculateMissingItemExposure('MLD', estimatedPerimeterLF, 'LF', 'BASEBOARD');
    
    if (!exposure) {
      return null;
    }
    
    return {
      missingTrade: 'MLD',
      missingTradeName: 'Molding/Trim',
      relatedTrade: 'FLR',
      relatedTradeName: 'Flooring',
      reason: 'Flooring replacement present without baseboard/trim',
      quantity: Math.round(estimatedPerimeterLF * 10) / 10,
      unit: 'LF',
      minExposure: exposure.min,
      maxExposure: exposure.max,
      severity: calculateSeverity(exposure.min, exposure.max, estimate.totals.rcv),
      confidence: 'MEDIUM',
      calculation: `√${totalFlooringSF} SF × 4 = ${estimatedPerimeterLF.toFixed(1)} LF × $${COST_BASELINE['MLD_BASEBOARD'].min}-${COST_BASELINE['MLD_BASEBOARD'].max}/LF`
    };
  }
  
  return null;
}

/**
 * Check for missing detach/reset
 */
function checkMissingDetachReset(estimate: StructuredEstimate): ExposureItem | null {
  const hasFlooring = estimate.lineItems.some(item => 
    ['FLR', 'CRP', 'VCT', 'TIL'].includes(item.tradeCode)
  );
  
  const hasCabinets = estimate.lineItems.some(item => item.tradeCode === 'CAB');
  const hasPlumbingFixtures = estimate.lineItems.some(item => 
    item.tradeCode === 'PLM' && item.description.toLowerCase().includes('fixture')
  );
  
  const hasDetachReset = estimate.lineItems.some(item => 
    item.tradeCode === 'DET' ||
    item.description.toLowerCase().includes('detach') ||
    item.description.toLowerCase().includes('reset')
  );
  
  if ((hasFlooring || hasCabinets) && hasPlumbingFixtures && !hasDetachReset) {
    // Estimate 2-4 fixtures
    const estimatedFixtures = 3;
    
    const exposure = calculateMissingItemExposure('PLM', estimatedFixtures, 'EA', 'DETACH_RESET');
    
    if (!exposure) {
      return null;
    }
    
    return {
      missingTrade: 'DET',
      missingTradeName: 'Detach/Reset',
      relatedTrade: 'PLM',
      relatedTradeName: 'Plumbing',
      reason: 'Flooring or cabinet work with plumbing fixtures requires detach/reset labor',
      quantity: estimatedFixtures,
      unit: 'EA',
      minExposure: exposure.min,
      maxExposure: exposure.max,
      severity: calculateSeverity(exposure.min, exposure.max, estimate.totals.rcv),
      confidence: 'MEDIUM',
      calculation: `${estimatedFixtures} fixtures × $${COST_BASELINE['PLM_DETACH_RESET'].min}-${COST_BASELINE['PLM_DETACH_RESET'].max}/EA`
    };
  }
  
  return null;
}

/**
 * Main exposure calculation
 */
export function calculateStructuralExposure(estimate: StructuredEstimate): ExposureAnalysis {
  const exposures: ExposureItem[] = [];
  
  // Run all checks using ACTUAL parsed data
  const missingPaint = checkMissingPaint(estimate);
  if (missingPaint) exposures.push(missingPaint);
  
  const missingInsulation = checkMissingInsulation(estimate);
  if (missingInsulation) exposures.push(missingInsulation);
  
  const removalExposures = checkRemovalWithoutReplacement(estimate);
  exposures.push(...removalExposures);
  
  const missingTrim = checkMissingTrim(estimate);
  if (missingTrim) exposures.push(missingTrim);
  
  const missingDetachReset = checkMissingDetachReset(estimate);
  if (missingDetachReset) exposures.push(missingDetachReset);
  
  // Calculate totals
  const totalExposureMin = exposures.reduce((sum, item) => sum + item.minExposure, 0);
  const totalExposureMax = exposures.reduce((sum, item) => sum + item.maxExposure, 0);
  
  // Calculate risk score (0-100)
  const avgExposure = (totalExposureMin + totalExposureMax) / 2;
  const percentOfEstimate = estimate.totals.rcv > 0 ? (avgExposure / estimate.totals.rcv) * 100 : 0;
  
  const criticalCount = exposures.filter(e => e.severity === 'CRITICAL').length;
  const highCount = exposures.filter(e => e.severity === 'HIGH').length;
  
  const riskScore = Math.min(100, Math.round(
    percentOfEstimate + 
    (criticalCount * 20) + 
    (highCount * 10) +
    (exposures.length * 5)
  ));
  
  // Generate summary
  let summary = '';
  if (exposures.length === 0) {
    summary = 'No significant scope gaps detected based on structural analysis.';
  } else {
    summary = `Identified ${exposures.length} scope gap(s) with estimated exposure range of $${totalExposureMin.toLocaleString()} - $${totalExposureMax.toLocaleString()}. `;
    
    if (criticalCount > 0) {
      summary += `${criticalCount} critical item(s) identified. `;
    }
    if (highCount > 0) {
      summary += `${highCount} high-priority item(s) identified.`;
    }
  }
  
  return {
    exposures,
    totalExposureMin: Math.round(totalExposureMin * 100) / 100,
    totalExposureMax: Math.round(totalExposureMax * 100) / 100,
    riskScore,
    summary
  };
}
