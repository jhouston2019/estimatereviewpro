/**
 * STRUCTURAL CODE UPGRADE ENGINE
 * Detects missing code-required items
 * Uses ACTUAL quantities for cost calculations
 */

import { StructuredEstimate } from './xactimate-structural-parser';
import { calculateMissingItemExposure, COST_BASELINE } from './cost-baseline';

export type CodeItemType = 
  | 'AFCI_BREAKER'
  | 'GFCI_OUTLET'
  | 'SMOKE_DETECTOR'
  | 'CO_DETECTOR'
  | 'DRIP_EDGE'
  | 'ICE_WATER_SHIELD'
  | 'PERMIT'
  | 'DETACH_RESET';

export interface CodeUpgradeRisk {
  itemType: CodeItemType;
  itemName: string;
  reason: string;
  relatedTrade: string;
  relatedTradeName: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  estimatedCostMin: number;
  estimatedCostMax: number;
  codeReference: string;
  quantity: number;
  unit: string;
  calculation: string;
}

export interface CodeUpgradeAnalysis {
  codeRisks: CodeUpgradeRisk[];
  totalCodeRiskMin: number;
  totalCodeRiskMax: number;
  criticalCount: number;
  summary: string;
}

/**
 * Check for missing AFCI breakers
 */
function checkAFCI(estimate: StructuredEstimate): CodeUpgradeRisk | null {
  const hasElectrical = estimate.lineItems.some(item => item.tradeCode === 'ELE');
  const hasAFCI = estimate.lineItems.some(item => 
    item.description.toLowerCase().includes('afci') ||
    item.description.toLowerCase().includes('arc fault')
  );
  
  if (hasElectrical && !hasAFCI) {
    // Estimate circuits from electrical work scope
    const electricalItems = estimate.lineItems.filter(item => item.tradeCode === 'ELE');
    const hasRewire = electricalItems.some(item => 
      item.description.toLowerCase().includes('rewire') ||
      item.description.toLowerCase().includes('wiring')
    );
    
    // Conservative: 2-4 circuits
    const estimatedCircuits = hasRewire ? 4 : 2;
    
    const costMin = COST_BASELINE['ELE_AFCI'].min * estimatedCircuits;
    const costMax = COST_BASELINE['ELE_AFCI'].max * estimatedCircuits;
    
    return {
      itemType: 'AFCI_BREAKER',
      itemName: 'AFCI Circuit Breakers',
      reason: 'Electrical work in dwelling areas requires AFCI protection per NEC 210.12',
      relatedTrade: 'ELE',
      relatedTradeName: 'Electrical',
      severity: 'HIGH',
      estimatedCostMin: Math.round(costMin),
      estimatedCostMax: Math.round(costMax),
      codeReference: 'NEC 210.12 - Arc-Fault Circuit-Interrupter Protection',
      quantity: estimatedCircuits,
      unit: 'EA',
      calculation: `${estimatedCircuits} circuits × $${COST_BASELINE['ELE_AFCI'].min}-${COST_BASELINE['ELE_AFCI'].max}/EA`
    };
  }
  
  return null;
}

/**
 * Check for missing drip edge
 * Uses ACTUAL roofing quantities
 */
function checkDripEdge(estimate: StructuredEstimate): CodeUpgradeRisk | null {
  const roofingItems = estimate.lineItems.filter(item => item.tradeCode === 'RFG');
  const hasDripEdge = estimate.lineItems.some(item => 
    item.description.toLowerCase().includes('drip edge')
  );
  
  if (roofingItems.length > 0 && !hasDripEdge) {
    // Calculate ACTUAL roofing area
    const totalRoofingSQ = roofingItems.reduce((sum, item) => {
      // Convert to squares if needed
      if (item.unit === 'SQ') {
        return sum + item.quantity;
      } else if (item.unit === 'SF') {
        return sum + (item.quantity / 100);
      }
      return sum;
    }, 0);
    
    // Estimate perimeter from roof area
    // Perimeter ≈ sqrt(area in SF) × 4
    const roofAreaSF = totalRoofingSQ * 100;
    const estimatedPerimeterLF = Math.sqrt(roofAreaSF) * 4;
    
    const costMin = estimatedPerimeterLF * COST_BASELINE['RFG_DRIP_EDGE'].min;
    const costMax = estimatedPerimeterLF * COST_BASELINE['RFG_DRIP_EDGE'].max;
    
    return {
      itemType: 'DRIP_EDGE',
      itemName: 'Drip Edge',
      reason: 'Roofing work requires drip edge installation per IRC R905.2.8.5',
      relatedTrade: 'RFG',
      relatedTradeName: 'Roofing',
      severity: 'HIGH',
      estimatedCostMin: Math.round(costMin),
      estimatedCostMax: Math.round(costMax),
      codeReference: 'IRC R905.2.8.5 - Drip Edge',
      quantity: Math.round(estimatedPerimeterLF * 10) / 10,
      unit: 'LF',
      calculation: `√(${totalRoofingSQ} SQ × 100) × 4 = ${estimatedPerimeterLF.toFixed(1)} LF × $${COST_BASELINE['RFG_DRIP_EDGE'].min}-${COST_BASELINE['RFG_DRIP_EDGE'].max}/LF`
    };
  }
  
  return null;
}

/**
 * Check for missing ice & water shield
 * Uses ACTUAL roofing quantities
 */
function checkIceWaterShield(estimate: StructuredEstimate): CodeUpgradeRisk | null {
  const roofingItems = estimate.lineItems.filter(item => item.tradeCode === 'RFG');
  const hasIceWater = estimate.lineItems.some(item => {
    const desc = item.description.toLowerCase();
    return (desc.includes('ice') && desc.includes('water')) ||
           desc.includes('ice & water') ||
           desc.includes('ice and water');
  });
  
  if (roofingItems.length > 0 && !hasIceWater) {
    const totalRoofingSQ = roofingItems.reduce((sum, item) => {
      if (item.unit === 'SQ') return sum + item.quantity;
      else if (item.unit === 'SF') return sum + (item.quantity / 100);
      return sum;
    }, 0);
    
    // Conservative: 20% of roof area for eaves/valleys
    const iceWaterSF = totalRoofingSQ * 100 * 0.20;
    
    const costMin = iceWaterSF * COST_BASELINE['RFG_ICE_WATER'].min;
    const costMax = iceWaterSF * COST_BASELINE['RFG_ICE_WATER'].max;
    
    return {
      itemType: 'ICE_WATER_SHIELD',
      itemName: 'Ice & Water Shield',
      reason: 'Roofing work in cold climates requires ice & water shield per IRC R905.2.7.1',
      relatedTrade: 'RFG',
      relatedTradeName: 'Roofing',
      severity: 'HIGH',
      estimatedCostMin: Math.round(costMin),
      estimatedCostMax: Math.round(costMax),
      codeReference: 'IRC R905.2.7.1 - Ice Barrier',
      quantity: Math.round(iceWaterSF),
      unit: 'SF',
      calculation: `${totalRoofingSQ} SQ × 100 × 20% = ${iceWaterSF.toFixed(0)} SF × $${COST_BASELINE['RFG_ICE_WATER'].min}-${COST_BASELINE['RFG_ICE_WATER'].max}/SF`
    };
  }
  
  return null;
}

/**
 * Check for missing permit
 */
function checkPermit(estimate: StructuredEstimate): CodeUpgradeRisk | null {
  const hasPermit = estimate.lineItems.some(item => 
    item.tradeCode === 'PER' ||
    item.description.toLowerCase().includes('permit')
  );
  
  const hasStructural = estimate.lineItems.some(item => 
    ['FRM', 'FND', 'RFG'].includes(item.tradeCode)
  );
  
  const hasElectrical = estimate.lineItems.some(item => item.tradeCode === 'ELE');
  const hasPlumbing = estimate.lineItems.some(item => item.tradeCode === 'PLM');
  const hasHVAC = estimate.lineItems.some(item => item.tradeCode === 'HVA');
  
  const significantWork = estimate.totals.rcv > 5000;
  
  if ((hasStructural || hasElectrical || hasPlumbing || hasHVAC) && !hasPermit && significantWork) {
    return {
      itemType: 'PERMIT',
      itemName: 'Building Permit',
      reason: 'Structural, electrical, plumbing, or HVAC work typically requires building permits',
      relatedTrade: 'GEN',
      relatedTradeName: 'General',
      severity: 'CRITICAL',
      estimatedCostMin: COST_BASELINE['PER_BUILDING'].min,
      estimatedCostMax: COST_BASELINE['PER_BUILDING'].max,
      codeReference: 'Local Building Code - Permit Requirements',
      quantity: 1,
      unit: 'EA',
      calculation: `1 permit × $${COST_BASELINE['PER_BUILDING'].min}-${COST_BASELINE['PER_BUILDING'].max}/EA`
    };
  }
  
  return null;
}

/**
 * Check for missing smoke detectors
 */
function checkSmokeDetectors(estimate: StructuredEstimate): CodeUpgradeRisk | null {
  const hasElectrical = estimate.lineItems.some(item => item.tradeCode === 'ELE');
  const hasStructural = estimate.lineItems.some(item => 
    ['FRM', 'DRY', 'CEI'].includes(item.tradeCode)
  );
  
  const hasSmokeDetector = estimate.lineItems.some(item => 
    item.description.toLowerCase().includes('smoke') &&
    item.description.toLowerCase().includes('detector')
  );
  
  if ((hasElectrical || hasStructural) && !hasSmokeDetector) {
    // Estimate 2-4 detectors
    const estimatedDetectors = 3;
    
    const costMin = COST_BASELINE['ELE_SMOKE_DETECTOR'].min * estimatedDetectors;
    const costMax = COST_BASELINE['ELE_SMOKE_DETECTOR'].max * estimatedDetectors;
    
    return {
      itemType: 'SMOKE_DETECTOR',
      itemName: 'Smoke Detectors',
      reason: 'Structural or electrical work may trigger requirement for updated smoke detector system',
      relatedTrade: 'ELE',
      relatedTradeName: 'Electrical',
      severity: 'MODERATE',
      estimatedCostMin: Math.round(costMin),
      estimatedCostMax: Math.round(costMax),
      codeReference: 'IRC R314 - Smoke Alarms',
      quantity: estimatedDetectors,
      unit: 'EA',
      calculation: `${estimatedDetectors} detectors × $${COST_BASELINE['ELE_SMOKE_DETECTOR'].min}-${COST_BASELINE['ELE_SMOKE_DETECTOR'].max}/EA`
    };
  }
  
  return null;
}

/**
 * Main code upgrade analysis
 */
export function analyzeCodeUpgrades(estimate: StructuredEstimate): CodeUpgradeAnalysis {
  const codeRisks: CodeUpgradeRisk[] = [];
  
  // Run all checks
  const afci = checkAFCI(estimate);
  if (afci) codeRisks.push(afci);
  
  const dripEdge = checkDripEdge(estimate);
  if (dripEdge) codeRisks.push(dripEdge);
  
  const iceWater = checkIceWaterShield(estimate);
  if (iceWater) codeRisks.push(iceWater);
  
  const permit = checkPermit(estimate);
  if (permit) codeRisks.push(permit);
  
  const smoke = checkSmokeDetectors(estimate);
  if (smoke) codeRisks.push(smoke);
  
  // Calculate totals
  const totalCodeRiskMin = codeRisks.reduce((sum, risk) => sum + risk.estimatedCostMin, 0);
  const totalCodeRiskMax = codeRisks.reduce((sum, risk) => sum + risk.estimatedCostMax, 0);
  
  const criticalCount = codeRisks.filter(risk => risk.severity === 'CRITICAL').length;
  
  // Generate summary
  let summary = '';
  if (codeRisks.length === 0) {
    summary = 'No code-required items detected as missing.';
  } else {
    summary = `Identified ${codeRisks.length} potential code-required item(s) not present in estimate. `;
    
    if (criticalCount > 0) {
      summary += `${criticalCount} critical item(s) require immediate attention. `;
    }
    
    summary += `Estimated code compliance exposure: $${totalCodeRiskMin.toLocaleString()} - $${totalCodeRiskMax.toLocaleString()}.`;
  }
  
  return {
    codeRisks,
    totalCodeRiskMin: Math.round(totalCodeRiskMin),
    totalCodeRiskMax: Math.round(totalCodeRiskMax),
    criticalCount,
    summary
  };
}
