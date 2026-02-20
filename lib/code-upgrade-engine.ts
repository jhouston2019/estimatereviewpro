/**
 * CODE UPGRADE DETECTION ENGINE
 * Identifies missing code-required items and upgrades
 * AFCI, drip edge, ice & water shield, smoke detectors, permits, detach/reset
 */

import { ParsedEstimate } from './xactimate-parser';

type CodeItemType = 
  | 'AFCI_BREAKER'
  | 'GFCI_OUTLET'
  | 'SMOKE_DETECTOR'
  | 'CO_DETECTOR'
  | 'DRIP_EDGE'
  | 'ICE_WATER_SHIELD'
  | 'PERMIT'
  | 'DETACH_RESET'
  | 'EGRESS_WINDOW'
  | 'HANDRAIL'
  | 'TEMPERED_GLASS';

interface CodeUpgradeRisk {
  itemType: CodeItemType;
  itemName: string;
  reason: string;
  relatedTrade: string;
  relatedTradeName: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  estimatedCostMin: number;
  estimatedCostMax: number;
  codeReference: string;
}

interface CodeUpgradeAnalysis {
  codeUpgradeRisks: CodeUpgradeRisk[];
  totalCodeRiskMin: number;
  totalCodeRiskMax: number;
  criticalCount: number;
  summary: string;
}

/**
 * Check for missing AFCI breakers
 */
function checkAFCI(estimate: ParsedEstimate): CodeUpgradeRisk | null {
  const hasElectrical = estimate.lineItems.some(item => item.tradeCode === 'ELE');
  const hasAFCI = estimate.lineItems.some(item => 
    item.description.toLowerCase().includes('afci') ||
    item.description.toLowerCase().includes('arc fault')
  );
  
  if (hasElectrical && !hasAFCI) {
    // Check if it's bedroom or living area work
    const bedroomWork = estimate.lineItems.some(item =>
      item.description.toLowerCase().includes('bedroom') ||
      item.description.toLowerCase().includes('living')
    );
    
    if (bedroomWork || true) { // Conservative: assume AFCI required
      return {
        itemType: 'AFCI_BREAKER',
        itemName: 'AFCI Circuit Breakers',
        reason: 'Electrical work in dwelling areas requires AFCI protection per NEC 210.12',
        relatedTrade: 'ELE',
        relatedTradeName: 'Electrical',
        severity: 'HIGH',
        estimatedCostMin: 300,
        estimatedCostMax: 800,
        codeReference: 'NEC 210.12 - Arc-Fault Circuit-Interrupter Protection'
      };
    }
  }
  
  return null;
}

/**
 * Check for missing GFCI outlets
 */
function checkGFCI(estimate: ParsedEstimate): CodeUpgradeRisk | null {
  const hasElectrical = estimate.lineItems.some(item => item.tradeCode === 'ELE');
  const hasGFCI = estimate.lineItems.some(item => 
    item.description.toLowerCase().includes('gfci') ||
    item.description.toLowerCase().includes('ground fault')
  );
  
  if (hasElectrical && !hasGFCI) {
    // Check for kitchen, bath, or exterior work
    const wetAreaWork = estimate.lineItems.some(item => {
      const desc = item.description.toLowerCase();
      return desc.includes('kitchen') || 
             desc.includes('bath') || 
             desc.includes('exterior') ||
             desc.includes('garage') ||
             desc.includes('basement');
    });
    
    if (wetAreaWork) {
      return {
        itemType: 'GFCI_OUTLET',
        itemName: 'GFCI Outlets',
        reason: 'Electrical work in wet areas requires GFCI protection per NEC 210.8',
        relatedTrade: 'ELE',
        relatedTradeName: 'Electrical',
        severity: 'HIGH',
        estimatedCostMin: 150,
        estimatedCostMax: 400,
        codeReference: 'NEC 210.8 - Ground-Fault Circuit-Interrupter Protection'
      };
    }
  }
  
  return null;
}

/**
 * Check for missing smoke detectors
 */
function checkSmokeDetectors(estimate: ParsedEstimate): CodeUpgradeRisk | null {
  const hasElectrical = estimate.lineItems.some(item => item.tradeCode === 'ELE');
  const hasSmokeDetector = estimate.lineItems.some(item => 
    item.description.toLowerCase().includes('smoke') &&
    item.description.toLowerCase().includes('detector')
  );
  
  // Check for bedroom or structural work
  const bedroomWork = estimate.lineItems.some(item =>
    item.description.toLowerCase().includes('bedroom')
  );
  
  const structuralWork = estimate.lineItems.some(item =>
    ['FRM', 'DRY', 'CEI'].includes(item.tradeCode)
  );
  
  if ((hasElectrical || structuralWork || bedroomWork) && !hasSmokeDetector) {
    return {
      itemType: 'SMOKE_DETECTOR',
      itemName: 'Smoke Detectors',
      reason: 'Structural or electrical work may trigger requirement for updated smoke detector system',
      relatedTrade: 'ELE',
      relatedTradeName: 'Electrical',
      severity: 'MODERATE',
      estimatedCostMin: 200,
      estimatedCostMax: 600,
      codeReference: 'IRC R314 - Smoke Alarms'
    };
  }
  
  return null;
}

/**
 * Check for missing CO detectors
 */
function checkCODetectors(estimate: ParsedEstimate): CodeUpgradeRisk | null {
  const hasHVAC = estimate.lineItems.some(item => item.tradeCode === 'HVA');
  const hasPlumbing = estimate.lineItems.some(item => item.tradeCode === 'PLM');
  const hasCO = estimate.lineItems.some(item => 
    item.description.toLowerCase().includes('carbon monoxide') ||
    item.description.toLowerCase().includes('co detector')
  );
  
  if ((hasHVAC || hasPlumbing) && !hasCO) {
    return {
      itemType: 'CO_DETECTOR',
      itemName: 'Carbon Monoxide Detectors',
      reason: 'Work on fuel-burning appliances may require CO detector installation',
      relatedTrade: 'HVA',
      relatedTradeName: 'HVAC',
      severity: 'MODERATE',
      estimatedCostMin: 150,
      estimatedCostMax: 400,
      codeReference: 'IRC R315 - Carbon Monoxide Alarms'
    };
  }
  
  return null;
}

/**
 * Check for missing drip edge
 */
function checkDripEdge(estimate: ParsedEstimate): CodeUpgradeRisk | null {
  const hasRoofing = estimate.lineItems.some(item => item.tradeCode === 'RFG');
  const hasDripEdge = estimate.lineItems.some(item => 
    item.description.toLowerCase().includes('drip edge') ||
    item.description.toLowerCase().includes('drip-edge')
  );
  
  if (hasRoofing && !hasDripEdge) {
    // Estimate perimeter from roofing quantity
    const roofingQty = estimate.lineItems
      .filter(item => item.tradeCode === 'RFG')
      .reduce((sum, item) => sum + item.quantity, 0);
    
    // Rough estimate: perimeter LF from roof area
    const estimatedLF = Math.sqrt(roofingQty * 100) * 4;
    const costMin = estimatedLF * 3;
    const costMax = estimatedLF * 6;
    
    return {
      itemType: 'DRIP_EDGE',
      itemName: 'Drip Edge',
      reason: 'Roofing work requires drip edge installation per IRC R905.2.8.5',
      relatedTrade: 'RFG',
      relatedTradeName: 'Roofing',
      severity: 'HIGH',
      estimatedCostMin: Math.round(costMin),
      estimatedCostMax: Math.round(costMax),
      codeReference: 'IRC R905.2.8.5 - Drip Edge'
    };
  }
  
  return null;
}

/**
 * Check for missing ice & water shield
 */
function checkIceWaterShield(estimate: ParsedEstimate): CodeUpgradeRisk | null {
  const hasRoofing = estimate.lineItems.some(item => item.tradeCode === 'RFG');
  const hasIceWater = estimate.lineItems.some(item => {
    const desc = item.description.toLowerCase();
    return (desc.includes('ice') && desc.includes('water')) ||
           desc.includes('ice & water') ||
           desc.includes('ice and water') ||
           desc.includes('ice/water');
  });
  
  if (hasRoofing && !hasIceWater) {
    // Estimate eave and valley coverage
    const roofingQty = estimate.lineItems
      .filter(item => item.tradeCode === 'RFG')
      .reduce((sum, item) => sum + item.quantity, 0);
    
    // Conservative: 20% of roof area for eaves/valleys
    const estimatedSF = roofingQty * 100 * 0.2;
    const costMin = estimatedSF * 4;
    const costMax = estimatedSF * 8;
    
    return {
      itemType: 'ICE_WATER_SHIELD',
      itemName: 'Ice & Water Shield',
      reason: 'Roofing work in cold climates requires ice & water shield per IRC R905.2.7.1',
      relatedTrade: 'RFG',
      relatedTradeName: 'Roofing',
      severity: 'HIGH',
      estimatedCostMin: Math.round(costMin),
      estimatedCostMax: Math.round(costMax),
      codeReference: 'IRC R905.2.7.1 - Ice Barrier'
    };
  }
  
  return null;
}

/**
 * Check for missing permit
 */
function checkPermit(estimate: ParsedEstimate): CodeUpgradeRisk | null {
  const hasPermit = estimate.lineItems.some(item => 
    item.tradeCode === 'PER' ||
    item.description.toLowerCase().includes('permit')
  );
  
  // Check for work that typically requires permits
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
      estimatedCostMin: 200,
      estimatedCostMax: 1000,
      codeReference: 'Local Building Code - Permit Requirements'
    };
  }
  
  return null;
}

/**
 * Check for missing detach/reset items
 */
function checkDetachReset(estimate: ParsedEstimate): CodeUpgradeRisk | null {
  const hasDetachReset = estimate.lineItems.some(item => 
    item.tradeCode === 'DET' ||
    item.description.toLowerCase().includes('detach') ||
    item.description.toLowerCase().includes('reset')
  );
  
  // Check for work that requires detach/reset
  const hasFlooring = estimate.lineItems.some(item => 
    ['FLR', 'CRP', 'VCT', 'TIL'].includes(item.tradeCode)
  );
  
  const hasCabinets = estimate.lineItems.some(item => item.tradeCode === 'CAB');
  const hasCountertops = estimate.lineItems.some(item => item.tradeCode === 'CTR');
  const hasPlumbing = estimate.lineItems.some(item => item.tradeCode === 'PLM');
  
  if ((hasFlooring || hasCabinets || hasCountertops) && !hasDetachReset && hasPlumbing) {
    return {
      itemType: 'DETACH_RESET',
      itemName: 'Detach & Reset',
      reason: 'Flooring or cabinet work with plumbing fixtures requires detach/reset labor',
      relatedTrade: 'PLM',
      relatedTradeName: 'Plumbing',
      severity: 'MODERATE',
      estimatedCostMin: 300,
      estimatedCostMax: 800,
      codeReference: 'Standard Practice - Fixture Removal/Reinstallation'
    };
  }
  
  return null;
}

/**
 * Main code upgrade analysis
 */
export function analyzeCodeUpgrades(estimate: ParsedEstimate): CodeUpgradeAnalysis {
  const codeUpgradeRisks: CodeUpgradeRisk[] = [];
  
  // Run all checks
  const afci = checkAFCI(estimate);
  if (afci) codeUpgradeRisks.push(afci);
  
  const gfci = checkGFCI(estimate);
  if (gfci) codeUpgradeRisks.push(gfci);
  
  const smoke = checkSmokeDetectors(estimate);
  if (smoke) codeUpgradeRisks.push(smoke);
  
  const co = checkCODetectors(estimate);
  if (co) codeUpgradeRisks.push(co);
  
  const dripEdge = checkDripEdge(estimate);
  if (dripEdge) codeUpgradeRisks.push(dripEdge);
  
  const iceWater = checkIceWaterShield(estimate);
  if (iceWater) codeUpgradeRisks.push(iceWater);
  
  const permit = checkPermit(estimate);
  if (permit) codeUpgradeRisks.push(permit);
  
  const detachReset = checkDetachReset(estimate);
  if (detachReset) codeUpgradeRisks.push(detachReset);
  
  // Calculate totals
  const totalCodeRiskMin = codeUpgradeRisks.reduce((sum, risk) => sum + risk.estimatedCostMin, 0);
  const totalCodeRiskMax = codeUpgradeRisks.reduce((sum, risk) => sum + risk.estimatedCostMax, 0);
  
  const criticalCount = codeUpgradeRisks.filter(risk => risk.severity === 'CRITICAL').length;
  
  // Generate summary
  let summary = '';
  if (codeUpgradeRisks.length === 0) {
    summary = 'No code upgrade items detected as missing.';
  } else {
    summary = `Identified ${codeUpgradeRisks.length} potential code-required item(s) not present in estimate. `;
    
    if (criticalCount > 0) {
      summary += `${criticalCount} critical item(s) require immediate attention. `;
    }
    
    summary += `Estimated code compliance exposure: $${totalCodeRiskMin.toLocaleString()} - $${totalCodeRiskMax.toLocaleString()}.`;
  }
  
  return {
    codeUpgradeRisks,
    totalCodeRiskMin: Math.round(totalCodeRiskMin),
    totalCodeRiskMax: Math.round(totalCodeRiskMax),
    criticalCount,
    summary
  };
}

export type { CodeItemType, CodeUpgradeRisk, CodeUpgradeAnalysis };
