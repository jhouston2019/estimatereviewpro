/**
 * ROOM-AWARE DEVIATION ENGINE
 * TRUE ENFORCEMENT-GRADE GEOMETRY
 * Handles: multi-room, mixed heights, ceiling separation, edge cases
 */

import { StructuredEstimate, StructuredLineItem } from './xactimate-structural-parser';
import { ParsedReport, ReportDirective } from './report-parser';
import { ExpectedQuantities, Room } from './dimension-engine';
import { calculateMissingItemExposure, COST_BASELINE } from './cost-baseline';

export type DeviationType = 
  | 'UNDER_SCOPED_REMOVAL'
  | 'MISSING_REQUIRED_TRADE'
  | 'INSUFFICIENT_CUT_HEIGHT'
  | 'MISSING_INSULATION'
  | 'MISSING_CEILING'
  | 'DIMENSION_MISMATCH'
  | 'QUANTITY_SHORTFALL';

export interface GeometryCalculation {
  perimeter: number;
  wallHeight: number;
  estimateHeight: number;
  reportHeight: number;
  estimateWallSF: number;
  reportWallSF: number;
  deltaSF: number;
  ceilingIncluded: boolean;
  formula: string;
}

export interface Deviation {
  deviationType: DeviationType;
  trade: string;
  tradeName: string;
  issue: string;
  estimateValue?: number;
  expectedValue?: number;
  reportDirective?: string;
  dimensionBased?: boolean;
  impactMin: number;
  impactMax: number;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  calculation: string;
  geometryDetails?: GeometryCalculation;
  source: 'REPORT' | 'DIMENSION' | 'BOTH';
}

export interface DeviationAnalysis {
  deviations: Deviation[];
  totalDeviationExposureMin: number;
  totalDeviationExposureMax: number;
  criticalCount: number;
  highCount: number;
  summary: string;
  auditTrail: {
    dimensionsUsed: boolean;
    roomCount: number;
    totalPerimeter: number;
    avgCeilingHeight: number;
    geometryCalculations: GeometryCalculation[];
    costBaselineVersion: string;
  };
  metadata: {
    reportDirectivesChecked: number;
    dimensionComparisonsPerformed: number;
    deviationsFound: number;
  };
}

/**
 * Get actual ceiling height from dimensions
 */
function getActualCeilingHeight(dimensions?: ExpectedQuantities): number {
  if (!dimensions || !dimensions.breakdown.rooms || dimensions.breakdown.rooms.length === 0) {
    return 8; // Fallback only if no dimensions
  }
  
  // Use average ceiling height across all rooms
  const heights = dimensions.breakdown.rooms.map(r => r.height);
  
  if (heights.length === 0) {
    return 8;
  }
  
  return Math.round((heights.reduce((sum, h) => sum + h, 0) / heights.length) * 100) / 100;
}

/**
 * Separate wall removal from ceiling removal
 */
function separateWallAndCeiling(items: StructuredLineItem[]): {
  wallItems: StructuredLineItem[];
  ceilingItems: StructuredLineItem[];
  wallSF: number;
  ceilingSF: number;
} {
  
  const wallItems: StructuredLineItem[] = [];
  const ceilingItems: StructuredLineItem[] = [];
  
  for (const item of items) {
    const desc = item.description.toLowerCase();
    
    if (desc.includes('ceiling') || desc.includes('cei')) {
      ceilingItems.push(item);
    } else {
      wallItems.push(item);
    }
  }
  
  const wallSF = wallItems.reduce((sum, item) => sum + item.quantity, 0);
  const ceilingSF = ceilingItems.reduce((sum, item) => sum + item.quantity, 0);
  
  return { wallItems, ceilingItems, wallSF, ceilingSF };
}

/**
 * Calculate height from quantity rule with dimension binding
 */
function getHeightFromRule(
  rule: string,
  dimensions?: ExpectedQuantities,
  avgCeilingHeight?: number
): number {
  
  if (rule === 'FULL_HEIGHT') {
    return avgCeilingHeight || getActualCeilingHeight(dimensions);
  }
  
  if (rule === '2FT_CUT') return 2;
  if (rule === '4FT_CUT') return 4;
  if (rule === '6FT_CUT') return 6;
  if (rule === 'CEILING_ONLY') return 0; // Wall height = 0
  
  return avgCeilingHeight || 8;
}

/**
 * ROOM-AWARE drywall deviation calculation
 */
function calculateDrywallDeviation(
  estimate: StructuredEstimate,
  directive: ReportDirective,
  dimensions: ExpectedQuantities,
  avgCeilingHeight: number
): Deviation | null {
  
  const drywallItems = estimate.lineItems.filter(item => item.tradeCode === 'DRY');
  const removalItems = drywallItems.filter(item => item.actionType === 'REMOVE');
  
  if (removalItems.length === 0) {
    return {
      deviationType: 'UNDER_SCOPED_REMOVAL',
      trade: 'DRY',
      tradeName: 'Drywall',
      issue: 'Expert report requires drywall removal but no removal items found in estimate',
      reportDirective: directive.directive,
      estimateValue: 0,
      impactMin: 2000,
      impactMax: 8000,
      severity: 'HIGH',
      calculation: 'Missing removal scope per expert directive',
      source: 'REPORT'
    };
  }
  
  // Separate wall from ceiling
  const { wallSF, ceilingSF } = separateWallAndCeiling(removalItems);
  
  // Get perimeter from dimensions
  const totalPerimeterLF = dimensions.breakdown.totals.totalPerimeterLF;
  
  // EDGE CASE: Zero perimeter
  if (totalPerimeterLF === 0) {
    throw new Error('Dimension perimeter is zero - invalid dimension data');
  }
  
  // Calculate estimate height from WALL removal only (exclude ceiling)
  const estimateHeight = wallSF > 0 ? wallSF / totalPerimeterLF : 0;
  
  // Get report height from directive (bound to actual ceiling height)
  const reportHeight = getHeightFromRule(directive.quantityRule || 'FULL_HEIGHT', dimensions, avgCeilingHeight);
  
  // Calculate delta
  const reportWallSF = totalPerimeterLF * reportHeight;
  const estimateWallSF = totalPerimeterLF * estimateHeight;
  const deltaSF = reportWallSF - estimateWallSF;
  
  // EDGE CASE: Negative delta (estimate exceeds directive)
  if (deltaSF <= 0) {
    return null; // No deviation - estimate meets or exceeds directive
  }
  
  // EDGE CASE: Ceiling-only directive
  if (directive.quantityRule === 'CEILING_ONLY') {
    const expectedCeilingSF = dimensions.breakdown.totals.totalCeilingSF;
    const deltaCeilingSF = expectedCeilingSF - ceilingSF;
    
    if (deltaCeilingSF > 0) {
      const costRange = calculateMissingItemExposure('DRY', deltaCeilingSF, 'SF', 'CEILING');
      
      if (costRange) {
        return {
          deviationType: 'MISSING_CEILING',
          trade: 'DRY',
          tradeName: 'Drywall',
          issue: `Expert report requires ceiling removal but estimate shows only ${ceilingSF} SF (expected ${expectedCeilingSF} SF)`,
          reportDirective: directive.directive,
          estimateValue: ceilingSF,
          expectedValue: expectedCeilingSF,
          impactMin: costRange.min,
          impactMax: costRange.max,
          severity: deltaCeilingSF > 200 ? 'HIGH' : 'MODERATE',
          calculation: `Ceiling SF ${expectedCeilingSF.toFixed(0)} expected - ${ceilingSF.toFixed(0)} in estimate = ${deltaCeilingSF.toFixed(0)} SF shortfall × $${COST_BASELINE['DRY_CEILING'].min}-${COST_BASELINE['DRY_CEILING'].max}/SF`,
          geometryDetails: {
            perimeter: 0,
            wallHeight: 0,
            estimateHeight: 0,
            reportHeight: 0,
            estimateWallSF: 0,
            reportWallSF: 0,
            deltaSF: deltaCeilingSF,
            ceilingIncluded: true,
            formula: `Ceiling: ${expectedCeilingSF} SF expected - ${ceilingSF} SF in estimate`
          },
          source: 'REPORT'
        };
      }
    }
    return null;
  }
  
  // Calculate exposure
  const costRange = calculateMissingItemExposure('DRY', deltaSF, 'SF', 'REPLACE_1/2');
  
  if (!costRange) {
    return null;
  }
  
  // Build geometry details for audit trail
  const geometryDetails: GeometryCalculation = {
    perimeter: totalPerimeterLF,
    wallHeight: avgCeilingHeight,
    estimateHeight: Math.round(estimateHeight * 100) / 100,
    reportHeight,
    estimateWallSF: Math.round(estimateWallSF * 100) / 100,
    reportWallSF: Math.round(reportWallSF * 100) / 100,
    deltaSF: Math.round(deltaSF * 100) / 100,
    ceilingIncluded: ceilingSF > 0,
    formula: `Perimeter ${totalPerimeterLF.toFixed(0)} LF × (${reportHeight} ft - ${estimateHeight.toFixed(1)} ft) = ${deltaSF.toFixed(0)} SF`
  };
  
  return {
    deviationType: 'INSUFFICIENT_CUT_HEIGHT',
    trade: 'DRY',
    tradeName: 'Drywall',
    issue: `Expert report requires ${reportHeight} ft height but estimate shows ${estimateHeight.toFixed(1)} ft (wall removal only, ${ceilingSF > 0 ? ceilingSF.toFixed(0) + ' SF ceiling separate' : 'no ceiling'})`,
    reportDirective: directive.directive,
    estimateValue: wallSF,
    expectedValue: reportWallSF,
    impactMin: costRange.min,
    impactMax: costRange.max,
    severity: deltaSF > 400 ? 'CRITICAL' : deltaSF > 200 ? 'HIGH' : 'MODERATE',
    calculation: `${geometryDetails.formula} × $${COST_BASELINE['DRY_REPLACE_1/2'].min}-${COST_BASELINE['DRY_REPLACE_1/2'].max}/SF = $${costRange.min.toLocaleString()}-${costRange.max.toLocaleString()}`,
    geometryDetails,
    source: 'REPORT'
  };
}

/**
 * ROOM-AWARE insulation deviation calculation
 */
function calculateInsulationDeviation(
  estimate: StructuredEstimate,
  directive: ReportDirective,
  dimensions: ExpectedQuantities
): Deviation | null {
  
  const insulationItems = estimate.lineItems.filter(item => item.tradeCode === 'INS');
  const estimateInsulationSF = insulationItems.reduce((sum, item) => sum + item.quantity, 0);
  
  // Expected insulation = wall SF (exterior walls)
  // For now, use total wall SF as conservative estimate
  const expectedInsulationSF = dimensions.breakdown.totals.totalWallSF;
  
  const deltaSF = expectedInsulationSF - estimateInsulationSF;
  
  // EDGE CASE: Negative delta
  if (deltaSF <= 0) {
    return null; // Estimate meets or exceeds requirement
  }
  
  const costRange = calculateMissingItemExposure('INS', deltaSF, 'SF', 'BATT_R13');
  
  if (!costRange) {
    return null;
  }
  
  return {
    deviationType: 'MISSING_INSULATION',
    trade: 'INS',
    tradeName: 'Insulation',
    issue: `Expert report requires insulation replacement but estimate shows ${estimateInsulationSF} SF (expected ${expectedInsulationSF.toFixed(0)} SF based on wall area)`,
    reportDirective: directive.directive,
    estimateValue: estimateInsulationSF,
    expectedValue: expectedInsulationSF,
    impactMin: costRange.min,
    impactMax: costRange.max,
    severity: deltaSF > 500 ? 'CRITICAL' : deltaSF > 200 ? 'HIGH' : 'MODERATE',
    calculation: `Wall SF ${expectedInsulationSF.toFixed(0)} - Estimate ${estimateInsulationSF} SF = ${deltaSF.toFixed(0)} SF shortfall × $${COST_BASELINE['INS_BATT_R13'].min}-${COST_BASELINE['INS_BATT_R13'].max}/SF = $${costRange.min.toLocaleString()}-${costRange.max.toLocaleString()}`,
    geometryDetails: {
      perimeter: dimensions.breakdown.totals.totalPerimeterLF,
      wallHeight: dimensions.breakdown.totals.totalWallSF / dimensions.breakdown.totals.totalPerimeterLF,
      estimateHeight: 0,
      reportHeight: 0,
      estimateWallSF: estimateInsulationSF,
      reportWallSF: expectedInsulationSF,
      deltaSF,
      ceilingIncluded: false,
      formula: `Wall SF ${expectedInsulationSF.toFixed(0)} - Estimate ${estimateInsulationSF} SF`
    },
    source: 'REPORT'
  };
}

/**
 * Compare estimate against report directives with ROOM-AWARE GEOMETRY
 */
function compareAgainstReportRoomAware(
  estimate: StructuredEstimate,
  report: ParsedReport,
  dimensions: ExpectedQuantities,
  avgCeilingHeight: number
): Deviation[] {
  
  const deviations: Deviation[] = [];
  
  for (const directive of report.directives) {
    if (!directive.measurable) continue;
    
    // Find matching trade in estimate
    const tradeItems = estimate.lineItems.filter(item => item.tradeCode === directive.trade);
    
    // Check if trade is missing
    if (tradeItems.length === 0) {
      deviations.push({
        deviationType: 'MISSING_REQUIRED_TRADE',
        trade: directive.trade,
        tradeName: directive.tradeName,
        issue: `Expert report requires ${directive.tradeName} but trade not found in estimate`,
        reportDirective: directive.directive,
        impactMin: 1000,
        impactMax: 5000,
        severity: directive.priority === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        calculation: 'Expert directive not addressed in estimate',
        source: 'REPORT'
      });
      continue;
    }
    
    // DRYWALL: Room-aware height calculation
    if (directive.trade === 'DRY' && directive.quantityRule) {
      const deviation = calculateDrywallDeviation(estimate, directive, dimensions, avgCeilingHeight);
      if (deviation) {
        deviations.push(deviation);
      }
    }
    
    // INSULATION: Wall-area based calculation
    if (directive.trade === 'INS') {
      const deviation = calculateInsulationDeviation(estimate, directive, dimensions);
      if (deviation) {
        deviations.push(deviation);
      }
    }
  }
  
  return deviations;
}

/**
 * Compare estimate against dimension measurements (ROOM-AWARE)
 */
function compareAgainstDimensionsRoomAware(
  estimate: StructuredEstimate,
  dimensions: ExpectedQuantities
): Deviation[] {
  
  const deviations: Deviation[] = [];
  
  // Compare drywall (separate wall and ceiling)
  const drywallItems = estimate.lineItems.filter(item => item.tradeCode === 'DRY');
  const { wallSF: estimateWallSF, ceilingSF: estimateCeilingSF } = separateWallAndCeiling(drywallItems);
  
  const expectedWallSF = dimensions.breakdown.totals.totalWallSF;
  const expectedCeilingSF = dimensions.breakdown.totals.totalCeilingSF;
  
  // Wall variance
  const wallVariance = expectedWallSF - estimateWallSF;
  const wallVariancePercent = expectedWallSF > 0 ? (wallVariance / expectedWallSF) * 100 : 0;
  
  if (wallVariance > 0 && wallVariancePercent > 20) {
    const costRange = calculateMissingItemExposure('DRY', wallVariance, 'SF', 'REPLACE_1/2');
    
    if (costRange) {
      deviations.push({
        deviationType: 'DIMENSION_MISMATCH',
        trade: 'DRY',
        tradeName: 'Drywall (Walls)',
        issue: `Estimate shows ${estimateWallSF.toFixed(0)} SF wall drywall but dimensions indicate ${expectedWallSF.toFixed(0)} SF needed`,
        estimateValue: estimateWallSF,
        expectedValue: expectedWallSF,
        dimensionBased: true,
        impactMin: costRange.min,
        impactMax: costRange.max,
        severity: wallVariancePercent > 40 ? 'CRITICAL' : 'HIGH',
        calculation: `Wall SF ${expectedWallSF.toFixed(0)} expected - ${estimateWallSF.toFixed(0)} in estimate = ${wallVariance.toFixed(0)} SF shortfall × $${COST_BASELINE['DRY_REPLACE_1/2'].min}-${COST_BASELINE['DRY_REPLACE_1/2'].max}/SF = $${costRange.min.toLocaleString()}-${costRange.max.toLocaleString()}`,
        geometryDetails: {
          perimeter: dimensions.breakdown.totals.totalPerimeterLF,
          wallHeight: expectedWallSF / dimensions.breakdown.totals.totalPerimeterLF,
          estimateHeight: estimateWallSF / dimensions.breakdown.totals.totalPerimeterLF,
          reportHeight: expectedWallSF / dimensions.breakdown.totals.totalPerimeterLF,
          estimateWallSF,
          reportWallSF: expectedWallSF,
          deltaSF: wallVariance,
          ceilingIncluded: false,
          formula: `Perimeter ${dimensions.breakdown.totals.totalPerimeterLF.toFixed(0)} LF × Wall Height - Estimate Wall SF`
        },
        source: 'DIMENSION'
      });
    }
  }
  
  // Ceiling variance (separate check)
  const ceilingVariance = expectedCeilingSF - estimateCeilingSF;
  const ceilingVariancePercent = expectedCeilingSF > 0 ? (ceilingVariance / expectedCeilingSF) * 100 : 0;
  
  if (ceilingVariance > 0 && ceilingVariancePercent > 20) {
    const costRange = calculateMissingItemExposure('DRY', ceilingVariance, 'SF', 'CEILING');
    
    if (costRange) {
      deviations.push({
        deviationType: 'MISSING_CEILING',
        trade: 'CEI',
        tradeName: 'Ceiling',
        issue: `Estimate shows ${estimateCeilingSF.toFixed(0)} SF ceiling but dimensions indicate ${expectedCeilingSF.toFixed(0)} SF needed`,
        estimateValue: estimateCeilingSF,
        expectedValue: expectedCeilingSF,
        dimensionBased: true,
        impactMin: costRange.min,
        impactMax: costRange.max,
        severity: ceilingVariancePercent > 40 ? 'HIGH' : 'MODERATE',
        calculation: `Ceiling SF ${expectedCeilingSF.toFixed(0)} expected - ${estimateCeilingSF.toFixed(0)} in estimate = ${ceilingVariance.toFixed(0)} SF shortfall × $${COST_BASELINE['DRY_CEILING'].min}-${COST_BASELINE['DRY_CEILING'].max}/SF = $${costRange.min.toLocaleString()}-${costRange.max.toLocaleString()}`,
        geometryDetails: {
          perimeter: 0,
          wallHeight: 0,
          estimateHeight: 0,
          reportHeight: 0,
          estimateWallSF: estimateCeilingSF,
          reportWallSF: expectedCeilingSF,
          deltaSF: ceilingVariance,
          ceilingIncluded: true,
          formula: `Ceiling SF ${expectedCeilingSF.toFixed(0)} - ${estimateCeilingSF.toFixed(0)}`
        },
        source: 'DIMENSION'
      });
    }
  }
  
  // Compare insulation (wall area only)
  const insulationItems = estimate.lineItems.filter(item => item.tradeCode === 'INS');
  const estimateInsulationSF = insulationItems.reduce((sum, item) => sum + item.quantity, 0);
  
  const expectedInsulationSF = dimensions.breakdown.totals.totalWallSF;
  const insulationVariance = expectedInsulationSF - estimateInsulationSF;
  const insulationVariancePercent = expectedInsulationSF > 0 ? (insulationVariance / expectedInsulationSF) * 100 : 0;
  
  if (insulationVariance > 0 && insulationVariancePercent > 20) {
    const costRange = calculateMissingItemExposure('INS', insulationVariance, 'SF', 'BATT_R13');
    
    if (costRange) {
      deviations.push({
        deviationType: 'DIMENSION_MISMATCH',
        trade: 'INS',
        tradeName: 'Insulation',
        issue: `Estimate shows ${estimateInsulationSF} SF insulation but dimensions indicate ${expectedInsulationSF.toFixed(0)} SF needed (wall area)`,
        estimateValue: estimateInsulationSF,
        expectedValue: expectedInsulationSF,
        dimensionBased: true,
        impactMin: costRange.min,
        impactMax: costRange.max,
        severity: insulationVariancePercent > 40 ? 'HIGH' : 'MODERATE',
        calculation: `Wall SF ${expectedInsulationSF.toFixed(0)} expected - ${estimateInsulationSF} SF in estimate = ${insulationVariance.toFixed(0)} SF shortfall × $${COST_BASELINE['INS_BATT_R13'].min}-${COST_BASELINE['INS_BATT_R13'].max}/SF = $${costRange.min.toLocaleString()}-${costRange.max.toLocaleString()}`,
        geometryDetails: {
          perimeter: dimensions.breakdown.totals.totalPerimeterLF,
          wallHeight: expectedInsulationSF / dimensions.breakdown.totals.totalPerimeterLF,
          estimateHeight: 0,
          reportHeight: 0,
          estimateWallSF: estimateInsulationSF,
          reportWallSF: expectedInsulationSF,
          deltaSF: insulationVariance,
          ceilingIncluded: false,
          formula: `Wall SF ${expectedInsulationSF.toFixed(0)} - Estimate ${estimateInsulationSF} SF`
        },
        source: 'DIMENSION'
      });
    }
  }
  
  // Compare flooring
  const flooringItems = estimate.lineItems.filter(item => 
    ['FLR', 'CRP', 'VCT', 'TIL'].includes(item.tradeCode)
  );
  const estimateFlooringSF = flooringItems.reduce((sum, item) => sum + item.quantity, 0);
  
  const expectedFlooringSF = dimensions.breakdown.totals.totalFloorSF;
  const flooringVariance = expectedFlooringSF - estimateFlooringSF;
  const flooringVariancePercent = expectedFlooringSF > 0 ? (flooringVariance / expectedFlooringSF) * 100 : 0;
  
  if (flooringVariance > 0 && flooringVariancePercent > 20) {
    deviations.push({
      deviationType: 'QUANTITY_SHORTFALL',
      trade: 'FLR',
      tradeName: 'Flooring',
      issue: `Estimate shows ${estimateFlooringSF} SF flooring but dimensions indicate ${expectedFlooringSF.toFixed(0)} SF needed`,
      estimateValue: estimateFlooringSF,
      expectedValue: expectedFlooringSF,
      dimensionBased: true,
      impactMin: flooringVariance * 3,
      impactMax: flooringVariance * 8,
      severity: flooringVariancePercent > 40 ? 'HIGH' : 'MODERATE',
      calculation: `Floor SF ${expectedFlooringSF.toFixed(0)} expected - ${estimateFlooringSF} SF in estimate = ${flooringVariance.toFixed(0)} SF shortfall × $3-8/SF = $${(flooringVariance * 3).toLocaleString()}-${(flooringVariance * 8).toLocaleString()}`,
      source: 'DIMENSION'
    });
  }
  
  // Compare baseboard
  const baseboardItems = estimate.lineItems.filter(item => item.tradeCode === 'MLD');
  const estimateBaseboardLF = baseboardItems.reduce((sum, item) => sum + item.quantity, 0);
  
  const expectedBaseboardLF = dimensions.breakdown.totals.totalPerimeterLF;
  const baseboardVariance = expectedBaseboardLF - estimateBaseboardLF;
  const baseboardVariancePercent = expectedBaseboardLF > 0 ? (baseboardVariance / expectedBaseboardLF) * 100 : 0;
  
  if (baseboardVariance > 0 && baseboardVariancePercent > 20) {
    const costRange = calculateMissingItemExposure('MLD', baseboardVariance, 'LF', 'BASEBOARD');
    
    if (costRange) {
      deviations.push({
        deviationType: 'QUANTITY_SHORTFALL',
        trade: 'MLD',
        tradeName: 'Molding/Trim',
        issue: `Estimate shows ${estimateBaseboardLF} LF baseboard but dimensions indicate ${expectedBaseboardLF.toFixed(0)} LF needed`,
        estimateValue: estimateBaseboardLF,
        expectedValue: expectedBaseboardLF,
        dimensionBased: true,
        impactMin: costRange.min,
        impactMax: costRange.max,
        severity: 'MODERATE',
        calculation: `Perimeter ${expectedBaseboardLF.toFixed(0)} LF expected - ${estimateBaseboardLF} LF in estimate = ${baseboardVariance.toFixed(0)} LF shortfall × $${COST_BASELINE['MLD_BASEBOARD'].min}-${COST_BASELINE['MLD_BASEBOARD'].max}/LF = $${costRange.min.toLocaleString()}-${costRange.max.toLocaleString()}`,
        source: 'DIMENSION'
      });
    }
  }
  
  return deviations;
}

/**
 * Calculate room-aware deviations
 */
export function calculateRoomAwareDeviations(
  estimate: StructuredEstimate,
  report?: ParsedReport,
  dimensions?: ExpectedQuantities
): DeviationAnalysis {
  
  const deviations: Deviation[] = [];
  const geometryCalculations: GeometryCalculation[] = [];
  
  let reportDirectivesChecked = 0;
  let dimensionComparisonsPerformed = 0;
  
  // Require dimensions for report comparison
  if (report && report.directives && report.directives.length > 0) {
    if (!dimensions) {
      throw new Error(
        'Dimension data required for report directive comparison. ' +
        'Cannot calculate height-based deviations without room measurements.'
      );
    }
    
    // Calculate average ceiling height from ACTUAL room data
    const avgCeilingHeight = getActualCeilingHeight(dimensions);
    
    const reportDeviations = compareAgainstReportRoomAware(
      estimate,
      report,
      dimensions,
      avgCeilingHeight
    );
    
    deviations.push(...reportDeviations);
    reportDirectivesChecked = report.directives.filter(d => d.measurable).length;
    
    // Collect geometry calculations for audit trail
    for (const dev of reportDeviations) {
      if (dev.geometryDetails) {
        geometryCalculations.push(dev.geometryDetails);
      }
    }
  }
  
  // Compare against dimensions
  if (dimensions) {
    const dimensionDeviations = compareAgainstDimensionsRoomAware(estimate, dimensions);
    deviations.push(...dimensionDeviations);
    dimensionComparisonsPerformed = 4; // Drywall walls, ceiling, insulation, flooring, baseboard
    
    // Collect geometry calculations
    for (const dev of dimensionDeviations) {
      if (dev.geometryDetails) {
        geometryCalculations.push(dev.geometryDetails);
      }
    }
  }
  
  // Calculate totals
  const totalDeviationExposureMin = deviations.reduce((sum, d) => sum + d.impactMin, 0);
  const totalDeviationExposureMax = deviations.reduce((sum, d) => sum + d.impactMax, 0);
  
  const criticalCount = deviations.filter(d => d.severity === 'CRITICAL').length;
  const highCount = deviations.filter(d => d.severity === 'HIGH').length;
  
  // Generate summary
  let summary = '';
  if (deviations.length === 0) {
    summary = 'No significant deviations detected between estimate and reference data.';
  } else {
    summary = `Identified ${deviations.length} deviation(s) with estimated financial impact of $${totalDeviationExposureMin.toLocaleString()} - $${totalDeviationExposureMax.toLocaleString()}. `;
    
    if (criticalCount > 0) {
      summary += `${criticalCount} critical deviation(s) require immediate attention. `;
    }
    if (highCount > 0) {
      summary += `${highCount} high-priority deviation(s) identified.`;
    }
  }
  
  return {
    deviations,
    totalDeviationExposureMin: Math.round(totalDeviationExposureMin),
    totalDeviationExposureMax: Math.round(totalDeviationExposureMax),
    criticalCount,
    highCount,
    summary,
    auditTrail: {
      dimensionsUsed: !!dimensions,
      roomCount: dimensions?.breakdown.rooms?.length || 0,
      totalPerimeter: dimensions?.breakdown.totals.totalPerimeterLF || 0,
      avgCeilingHeight: dimensions ? getActualCeilingHeight(dimensions) : 0,
      geometryCalculations,
      costBaselineVersion: '2026.02'
    },
    metadata: {
      reportDirectivesChecked,
      dimensionComparisonsPerformed,
      deviationsFound: deviations.length
    }
  };
}
