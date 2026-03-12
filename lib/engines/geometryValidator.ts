/**
 * GEOMETRY VALIDATION ENGINE
 * Detects quantity suppression using expected geometry calculations
 * Validates estimate quantities against geometric consistency rules
 */

import { StandardizedEstimate, StandardizedLineItem } from '../../types/claim-engine';

export interface GeometricInconsistency {
  item: string;
  lineNumber: number;
  estimatedQuantity: number;
  expectedQuantity: number;
  unit: string;
  deviationPercentage: number;
  inconsistencyType: 'roof_area' | 'perimeter' | 'wall_area' | 'floor_area' | 'volume';
  evidence: string;
  financialImpact: number;
  severity: 'high' | 'medium' | 'low';
}

export interface GeometryValidationResult {
  inconsistencies: GeometricInconsistency[];
  totalInconsistencies: number;
  totalFinancialImpact: number;
  geometricChecksPerformed: string[];
  summary: string;
}

/**
 * Find line item by search terms
 */
function findItem(lineItems: StandardizedLineItem[], searchTerms: string[]): StandardizedLineItem | null {
  return lineItems.find(item => {
    const desc = item.description.toLowerCase();
    return searchTerms.some(term => desc.includes(term.toLowerCase()));
  }) || null;
}

/**
 * Validate roof geometry
 * Checks area/perimeter consistency and expected roof size
 */
function validateRoofGeometry(lineItems: StandardizedLineItem[]): GeometricInconsistency[] {
  const inconsistencies: GeometricInconsistency[] = [];
  
  // Find roof area (shingles)
  const roofArea = findItem(lineItems, ['shingle', 'roofing', 'roof replacement']);
  
  if (!roofArea || !roofArea.unit.toLowerCase().includes('sq')) {
    return inconsistencies;
  }
  
  const areaInSquares = roofArea.quantity;
  const areaInSF = areaInSquares * 100; // 1 SQ = 100 SF
  
  // Check 1: Roof area vs perimeter consistency
  const dripEdge = findItem(lineItems, ['drip edge', 'drip']);
  
  if (dripEdge && dripEdge.unit.toLowerCase().includes('lf')) {
    // Expected perimeter formula: roughly 4 * sqrt(area)
    // This assumes roughly square roof; adjust for typical residential
    const expectedPerimeter = 4 * Math.sqrt(areaInSF) * 1.2; // 1.2 factor for typical residential
    const actualPerimeter = dripEdge.quantity;
    const deviation = Math.abs(expectedPerimeter - actualPerimeter) / expectedPerimeter;
    
    if (deviation > 0.35) { // 35% deviation threshold
      inconsistencies.push({
        item: 'Roof perimeter',
        lineNumber: dripEdge.lineNumber,
        estimatedQuantity: actualPerimeter,
        expectedQuantity: Math.round(expectedPerimeter),
        unit: 'LF',
        deviationPercentage: deviation * 100,
        inconsistencyType: 'perimeter',
        evidence: `Roof area of ${areaInSquares} SQ (${areaInSF} SF) suggests ${expectedPerimeter.toFixed(0)} LF perimeter, but estimate shows ${actualPerimeter} LF`,
        financialImpact: Math.abs(expectedPerimeter - actualPerimeter) * (dripEdge.unitPrice || 3.50),
        severity: deviation > 0.5 ? 'high' : 'medium',
      });
    }
  }
  
  // Check 2: Roof area suppression (typical residential roof)
  // Typical single-family home: 25-35 squares
  // If significantly lower, may indicate suppression
  if (areaInSquares < 20) {
    const expectedArea = 28; // Conservative baseline
    const suppressionPct = ((expectedArea - areaInSquares) / expectedArea) * 100;
    
    if (suppressionPct > 25) {
      inconsistencies.push({
        item: 'Roof area',
        lineNumber: roofArea.lineNumber,
        estimatedQuantity: areaInSquares,
        expectedQuantity: expectedArea,
        unit: 'SQ',
        deviationPercentage: suppressionPct,
        inconsistencyType: 'roof_area',
        evidence: `Roof area of ${areaInSquares} SQ is ${suppressionPct.toFixed(1)}% below typical residential roof (${expectedArea} SQ)`,
        financialImpact: (expectedArea - areaInSquares) * (roofArea.unitPrice || 350),
        severity: suppressionPct > 40 ? 'high' : 'medium',
      });
    }
  }
  
  // Check 3: Ridge cap vs roof area
  const ridgeCap = findItem(lineItems, ['ridge cap', 'ridge']);
  
  if (ridgeCap && ridgeCap.unit.toLowerCase().includes('lf')) {
    // Expected ridge length: roughly sqrt(area) * 1.5 for typical gable roof
    const expectedRidge = Math.sqrt(areaInSF) * 1.5;
    const actualRidge = ridgeCap.quantity;
    const deviation = Math.abs(expectedRidge - actualRidge) / expectedRidge;
    
    if (deviation > 0.4) {
      inconsistencies.push({
        item: 'Ridge cap',
        lineNumber: ridgeCap.lineNumber,
        estimatedQuantity: actualRidge,
        expectedQuantity: Math.round(expectedRidge),
        unit: 'LF',
        deviationPercentage: deviation * 100,
        inconsistencyType: 'perimeter',
        evidence: `Roof area suggests ${expectedRidge.toFixed(0)} LF ridge, but estimate shows ${actualRidge} LF`,
        financialImpact: Math.abs(expectedRidge - actualRidge) * (ridgeCap.unitPrice || 8.50),
        severity: deviation > 0.6 ? 'high' : 'medium',
      });
    }
  }
  
  return inconsistencies;
}

/**
 * Validate wall/drywall geometry
 */
function validateWallGeometry(lineItems: StandardizedLineItem[]): GeometricInconsistency[] {
  const inconsistencies: GeometricInconsistency[] = [];
  
  // Find drywall items
  const drywall = findItem(lineItems, ['drywall', 'sheetrock', 'gypsum board']);
  
  if (!drywall || !drywall.unit.toLowerCase().includes('sf')) {
    return inconsistencies;
  }
  
  const drywallSF = drywall.quantity;
  
  // Typical room: 400-600 SF of drywall (walls + ceiling)
  // If significantly lower, may indicate suppression
  if (drywallSF < 300) {
    const expectedArea = 450; // Conservative baseline for typical room
    const suppressionPct = ((expectedArea - drywallSF) / expectedArea) * 100;
    
    if (suppressionPct > 30) {
      inconsistencies.push({
        item: 'Drywall area',
        lineNumber: drywall.lineNumber,
        estimatedQuantity: drywallSF,
        expectedQuantity: expectedArea,
        unit: 'SF',
        deviationPercentage: suppressionPct,
        inconsistencyType: 'wall_area',
        evidence: `Drywall area of ${drywallSF} SF is ${suppressionPct.toFixed(1)}% below typical room (${expectedArea} SF)`,
        financialImpact: (expectedArea - drywallSF) * (drywall.unitPrice || 2.50),
        severity: suppressionPct > 45 ? 'high' : 'medium',
      });
    }
  }
  
  // Check paint vs drywall consistency
  const paint = findItem(lineItems, ['paint', 'painting']);
  
  if (paint && paint.unit.toLowerCase().includes('sf')) {
    const paintSF = paint.quantity;
    // Paint area should roughly match drywall area
    const deviation = Math.abs(paintSF - drywallSF) / drywallSF;
    
    if (deviation > 0.3 && paintSF < drywallSF) {
      inconsistencies.push({
        item: 'Paint area',
        lineNumber: paint.lineNumber,
        estimatedQuantity: paintSF,
        expectedQuantity: Math.round(drywallSF),
        unit: 'SF',
        deviationPercentage: deviation * 100,
        inconsistencyType: 'wall_area',
        evidence: `Paint area (${paintSF} SF) is ${(deviation * 100).toFixed(1)}% less than drywall area (${drywallSF} SF)`,
        financialImpact: (drywallSF - paintSF) * (paint.unitPrice || 1.50),
        severity: deviation > 0.4 ? 'high' : 'medium',
      });
    }
  }
  
  return inconsistencies;
}

/**
 * Validate flooring geometry
 */
function validateFlooringGeometry(lineItems: StandardizedLineItem[]): GeometricInconsistency[] {
  const inconsistencies: GeometricInconsistency[] = [];
  
  // Find flooring items
  const flooring = findItem(lineItems, ['flooring', 'floor', 'lvp', 'vinyl plank', 'hardwood', 'carpet', 'tile']);
  
  if (!flooring || !flooring.unit.toLowerCase().includes('sf')) {
    return inconsistencies;
  }
  
  const flooringSF = flooring.quantity;
  
  // Check baseboard vs floor area
  const baseboard = findItem(lineItems, ['baseboard', 'base']);
  
  if (baseboard && baseboard.unit.toLowerCase().includes('lf')) {
    // Expected baseboard: roughly 4 * sqrt(floor area) for rectangular room
    const expectedBaseboard = 4 * Math.sqrt(flooringSF);
    const actualBaseboard = baseboard.quantity;
    const deviation = Math.abs(expectedBaseboard - actualBaseboard) / expectedBaseboard;
    
    if (deviation > 0.35) {
      inconsistencies.push({
        item: 'Baseboard',
        lineNumber: baseboard.lineNumber,
        estimatedQuantity: actualBaseboard,
        expectedQuantity: Math.round(expectedBaseboard),
        unit: 'LF',
        deviationPercentage: deviation * 100,
        inconsistencyType: 'perimeter',
        evidence: `Floor area (${flooringSF} SF) suggests ${expectedBaseboard.toFixed(0)} LF baseboard, but estimate shows ${actualBaseboard} LF`,
        financialImpact: Math.abs(expectedBaseboard - actualBaseboard) * (baseboard.unitPrice || 4.50),
        severity: deviation > 0.5 ? 'high' : 'medium',
      });
    }
  }
  
  // Check for undersized floor area
  if (flooringSF < 200) {
    const expectedArea = 350; // Typical room
    const suppressionPct = ((expectedArea - flooringSF) / expectedArea) * 100;
    
    if (suppressionPct > 30) {
      inconsistencies.push({
        item: 'Floor area',
        lineNumber: flooring.lineNumber,
        estimatedQuantity: flooringSF,
        expectedQuantity: expectedArea,
        unit: 'SF',
        deviationPercentage: suppressionPct,
        inconsistencyType: 'floor_area',
        evidence: `Floor area of ${flooringSF} SF is ${suppressionPct.toFixed(1)}% below typical room (${expectedArea} SF)`,
        financialImpact: (expectedArea - flooringSF) * (flooring.unitPrice || 6.00),
        severity: suppressionPct > 45 ? 'high' : 'medium',
      });
    }
  }
  
  return inconsistencies;
}

/**
 * Validate water damage volume
 */
function validateWaterDamageGeometry(lineItems: StandardizedLineItem[]): GeometricInconsistency[] {
  const inconsistencies: GeometricInconsistency[] = [];
  
  // Find water extraction items
  const extraction = findItem(lineItems, ['water extraction', 'extraction']);
  
  if (!extraction) {
    return inconsistencies;
  }
  
  // Find affected area items
  const affectedArea = findItem(lineItems, ['affected', 'water damage']);
  
  if (affectedArea && affectedArea.unit.toLowerCase().includes('sf')) {
    const areaSF = affectedArea.quantity;
    
    // Check dehumidifier days vs area
    const dehumidifier = findItem(lineItems, ['dehumidifier', 'dehu']);
    
    if (dehumidifier && dehumidifier.unit.toLowerCase().includes('day')) {
      // Typical: 1 dehumidifier per 1000 SF for 3-5 days
      const expectedDays = Math.ceil(areaSF / 1000) * 4; // 4 days average
      const actualDays = dehumidifier.quantity;
      const deviation = Math.abs(expectedDays - actualDays) / expectedDays;
      
      if (deviation > 0.4 && actualDays < expectedDays) {
        inconsistencies.push({
          item: 'Dehumidifier days',
          lineNumber: dehumidifier.lineNumber,
          estimatedQuantity: actualDays,
          expectedQuantity: expectedDays,
          unit: 'Days',
          deviationPercentage: deviation * 100,
          inconsistencyType: 'volume',
          evidence: `Affected area (${areaSF} SF) requires ${expectedDays} dehumidifier days, but estimate shows ${actualDays} days`,
          financialImpact: (expectedDays - actualDays) * (dehumidifier.unitPrice || 75),
          severity: deviation > 0.6 ? 'high' : 'medium',
        });
      }
    }
  }
  
  return inconsistencies;
}

/**
 * Validate structural geometry
 */
function validateStructuralGeometry(lineItems: StandardizedLineItem[]): GeometricInconsistency[] {
  const inconsistencies: GeometricInconsistency[] = [];
  
  // Find framing items
  const studs = findItem(lineItems, ['stud', '2x4', '2x6', 'framing']);
  
  if (studs && studs.unit.toLowerCase().includes('lf')) {
    const studLF = studs.quantity;
    
    // Find wall area to validate stud quantity
    const wallArea = findItem(lineItems, ['wall', 'drywall']);
    
    if (wallArea && wallArea.unit.toLowerCase().includes('sf')) {
      const wallSF = wallArea.quantity;
      
      // Expected studs: wall area / 16" spacing = SF / 1.33
      const expectedStuds = wallSF / 1.33 * 8; // 8' height typical
      const deviation = Math.abs(expectedStuds - studLF) / expectedStuds;
      
      if (deviation > 0.4 && studLF < expectedStuds) {
        inconsistencies.push({
          item: 'Framing studs',
          lineNumber: studs.lineNumber,
          estimatedQuantity: studLF,
          expectedQuantity: Math.round(expectedStuds),
          unit: 'LF',
          deviationPercentage: deviation * 100,
          inconsistencyType: 'wall_area',
          evidence: `Wall area (${wallSF} SF) requires ${expectedStuds.toFixed(0)} LF of studs, but estimate shows ${studLF} LF`,
          financialImpact: (expectedStuds - studLF) * (studs.unitPrice || 2.50),
          severity: deviation > 0.6 ? 'high' : 'medium',
        });
      }
    }
  }
  
  return inconsistencies;
}

/**
 * Validate paint coverage
 */
function validatePaintCoverage(lineItems: StandardizedLineItem[]): GeometricInconsistency[] {
  const inconsistencies: GeometricInconsistency[] = [];
  
  const paint = findItem(lineItems, ['paint', 'painting']);
  
  if (!paint || !paint.unit.toLowerCase().includes('sf')) {
    return inconsistencies;
  }
  
  const paintSF = paint.quantity;
  
  // Find primer
  const primer = findItem(lineItems, ['primer', 'prime']);
  
  if (primer && primer.unit.toLowerCase().includes('sf')) {
    const primerSF = primer.quantity;
    
    // Primer and paint should cover same area
    const deviation = Math.abs(paintSF - primerSF) / paintSF;
    
    if (deviation > 0.2 && primerSF < paintSF) {
      inconsistencies.push({
        item: 'Primer coverage',
        lineNumber: primer.lineNumber,
        estimatedQuantity: primerSF,
        expectedQuantity: Math.round(paintSF),
        unit: 'SF',
        deviationPercentage: deviation * 100,
        inconsistencyType: 'wall_area',
        evidence: `Paint coverage (${paintSF} SF) requires matching primer, but estimate shows ${primerSF} SF primer`,
        financialImpact: (paintSF - primerSF) * (primer.unitPrice || 0.80),
        severity: deviation > 0.35 ? 'high' : 'medium',
      });
    }
  }
  
  return inconsistencies;
}

/**
 * Validate material quantities
 */
function validateMaterialQuantities(lineItems: StandardizedLineItem[]): GeometricInconsistency[] {
  const inconsistencies: GeometricInconsistency[] = [];
  
  // Check insulation vs area
  const insulation = findItem(lineItems, ['insulation', 'r-19', 'r-30']);
  
  if (insulation && insulation.unit.toLowerCase().includes('sf')) {
    const insulationSF = insulation.quantity;
    
    // Find ceiling/attic area
    const ceiling = findItem(lineItems, ['ceiling', 'attic']);
    
    if (ceiling && ceiling.unit.toLowerCase().includes('sf')) {
      const ceilingSF = ceiling.quantity;
      
      // Insulation should match ceiling area
      const deviation = Math.abs(insulationSF - ceilingSF) / ceilingSF;
      
      if (deviation > 0.25 && insulationSF < ceilingSF) {
        inconsistencies.push({
          item: 'Insulation',
          lineNumber: insulation.lineNumber,
          estimatedQuantity: insulationSF,
          expectedQuantity: Math.round(ceilingSF),
          unit: 'SF',
          deviationPercentage: deviation * 100,
          inconsistencyType: 'floor_area',
          evidence: `Ceiling area (${ceilingSF} SF) requires matching insulation, but estimate shows ${insulationSF} SF`,
          financialImpact: (ceilingSF - insulationSF) * (insulation.unitPrice || 1.80),
          severity: deviation > 0.4 ? 'high' : 'medium',
        });
      }
    }
  }
  
  return inconsistencies;
}

/**
 * Main geometry validation function
 */
export function validateGeometry(estimate: StandardizedEstimate): GeometryValidationResult {
  console.log('[GEOMETRY] Validating geometric consistency...');
  
  const allInconsistencies: GeometricInconsistency[] = [];
  const checksPerformed: string[] = [];
  
  try {
    // Validate roof geometry
    const roofIssues = validateRoofGeometry(estimate.lineItems);
    if (roofIssues.length > 0) {
      allInconsistencies.push(...roofIssues);
      checksPerformed.push('Roof geometry');
      console.log(`[GEOMETRY] Found ${roofIssues.length} roof geometry issues`);
    }
    
    // Validate wall geometry
    const wallIssues = validateWallGeometry(estimate.lineItems);
    if (wallIssues.length > 0) {
      allInconsistencies.push(...wallIssues);
      checksPerformed.push('Wall geometry');
      console.log(`[GEOMETRY] Found ${wallIssues.length} wall geometry issues`);
    }
    
    // Validate flooring geometry
    const floorIssues = validateFlooringGeometry(estimate.lineItems);
    if (floorIssues.length > 0) {
      allInconsistencies.push(...floorIssues);
      checksPerformed.push('Floor geometry');
      console.log(`[GEOMETRY] Found ${floorIssues.length} floor geometry issues`);
    }
    
    // Validate water damage geometry
    const waterIssues = validateWaterDamageGeometry(estimate.lineItems);
    if (waterIssues.length > 0) {
      allInconsistencies.push(...waterIssues);
      checksPerformed.push('Water damage geometry');
      console.log(`[GEOMETRY] Found ${waterIssues.length} water damage geometry issues`);
    }
    
    // Validate structural geometry
    const structuralIssues = validateStructuralGeometry(estimate.lineItems);
    if (structuralIssues.length > 0) {
      allInconsistencies.push(...structuralIssues);
      checksPerformed.push('Structural geometry');
      console.log(`[GEOMETRY] Found ${structuralIssues.length} structural geometry issues`);
    }
    
    // Validate paint coverage
    const paintIssues = validatePaintCoverage(estimate.lineItems);
    if (paintIssues.length > 0) {
      allInconsistencies.push(...paintIssues);
      checksPerformed.push('Paint coverage');
      console.log(`[GEOMETRY] Found ${paintIssues.length} paint coverage issues`);
    }
    
    const totalFinancialImpact = allInconsistencies.reduce((sum, i) => sum + i.financialImpact, 0);
    
    console.log(`[GEOMETRY] Total inconsistencies: ${allInconsistencies.length}`);
    console.log(`[GEOMETRY] Total impact: $${totalFinancialImpact.toFixed(2)}`);
    
    return {
      inconsistencies: allInconsistencies,
      totalInconsistencies: allInconsistencies.length,
      totalFinancialImpact,
      geometricChecksPerformed: checksPerformed,
      summary: generateGeometrySummary(allInconsistencies, totalFinancialImpact),
    };
    
  } catch (error) {
    console.error('[GEOMETRY] Error:', error);
    return {
      inconsistencies: [],
      totalInconsistencies: 0,
      totalFinancialImpact: 0,
      geometricChecksPerformed: [],
      summary: 'Geometry validation failed',
    };
  }
}

/**
 * Generate summary
 */
function generateGeometrySummary(
  inconsistencies: GeometricInconsistency[],
  totalImpact: number
): string {
  if (inconsistencies.length === 0) {
    return 'No geometric inconsistencies detected';
  }
  
  const high = inconsistencies.filter(i => i.severity === 'high').length;
  const medium = inconsistencies.filter(i => i.severity === 'medium').length;
  
  let summary = `Found ${inconsistencies.length} geometric inconsistencies. `;
  
  if (high > 0) {
    summary += `${high} high severity. `;
  }
  if (medium > 0) {
    summary += `${medium} medium severity. `;
  }
  
  summary += `Total financial impact: $${totalImpact.toFixed(2)}.`;
  
  return summary;
}

/**
 * Format geometry validation report
 */
export function formatGeometryReport(result: GeometryValidationResult): string {
  let report = `GEOMETRY VALIDATION ANALYSIS\n`;
  report += `${'='.repeat(60)}\n\n`;
  
  report += `SUMMARY:\n`;
  report += `- Checks performed: ${result.geometricChecksPerformed.join(', ')}\n`;
  report += `- Inconsistencies found: ${result.totalInconsistencies}\n`;
  report += `- Total financial impact: $${result.totalFinancialImpact.toFixed(2)}\n\n`;
  
  if (result.inconsistencies.length === 0) {
    report += `✓ No geometric inconsistencies detected\n`;
    return report;
  }
  
  report += `INCONSISTENCIES:\n\n`;
  
  // Group by severity
  const high = result.inconsistencies.filter(i => i.severity === 'high');
  const medium = result.inconsistencies.filter(i => i.severity === 'medium');
  const low = result.inconsistencies.filter(i => i.severity === 'low');
  
  if (high.length > 0) {
    report += `HIGH SEVERITY (${high.length}):\n`;
    for (const issue of high) {
      report += `  Line ${issue.lineNumber}: ${issue.item}\n`;
      report += `    Type: ${issue.inconsistencyType}\n`;
      report += `    Estimate: ${issue.estimatedQuantity} ${issue.unit}\n`;
      report += `    Expected: ${issue.expectedQuantity} ${issue.unit}\n`;
      report += `    Deviation: ${issue.deviationPercentage.toFixed(1)}%\n`;
      report += `    Evidence: ${issue.evidence}\n`;
      report += `    Impact: $${issue.financialImpact.toFixed(2)}\n\n`;
    }
  }
  
  if (medium.length > 0) {
    report += `MEDIUM SEVERITY (${medium.length}):\n`;
    for (const issue of medium) {
      report += `  Line ${issue.lineNumber}: ${issue.item}\n`;
      report += `    Deviation: ${issue.deviationPercentage.toFixed(1)}%\n`;
      report += `    Impact: $${issue.financialImpact.toFixed(2)}\n\n`;
    }
  }
  
  if (low.length > 0) {
    report += `LOW SEVERITY (${low.length}):\n`;
    for (const issue of low) {
      report += `  - ${issue.item} (${issue.deviationPercentage.toFixed(1)}% deviation)\n`;
    }
    report += `\n`;
  }
  
  return report;
}

/**
 * Calculate geometry confidence score (0-100)
 */
export function calculateGeometryConfidence(result: GeometryValidationResult): number {
  if (result.inconsistencies.length === 0) {
    return 100;
  }
  
  // Start at 100, deduct points for issues
  let score = 100;
  
  for (const issue of result.inconsistencies) {
    if (issue.severity === 'high') {
      score -= 15;
    } else if (issue.severity === 'medium') {
      score -= 8;
    } else {
      score -= 3;
    }
  }
  
  return Math.max(0, score);
}
