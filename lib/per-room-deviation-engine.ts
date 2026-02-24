/**
 * PER-ROOM DEVIATION ENGINE
 * ENTERPRISE-GRADE: Room-by-room geometry iteration
 * NO AGGREGATE SHORTCUTS - TRUE MULTI-ROOM SUPPORT
 */

import { StructuredEstimate, StructuredLineItem } from './xactimate-structural-parser';
import { ParsedReport, ReportDirective } from './report-parser';
import { ExpectedQuantities, RoomQuantities } from './dimension-engine';
import { calculateMissingItemExposure, COST_BASELINE, COST_BASELINE_VERSION } from './cost-baseline';

export type DeviationType = 
  | 'UNDER_SCOPED_REMOVAL'
  | 'MISSING_REQUIRED_TRADE'
  | 'INSUFFICIENT_CUT_HEIGHT'
  | 'MISSING_INSULATION'
  | 'MISSING_CEILING'
  | 'DIMENSION_MISMATCH'
  | 'QUANTITY_SHORTFALL'
  | 'PARTIAL_ROOM_COVERAGE';

export interface RoomGeometry {
  roomName: string;
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
  roomGeometry?: RoomGeometry[]; // Per-room breakdown
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
    perRoomCalculations: RoomGeometry[];
    totalPerimeter: number;
    avgCeilingHeight: number;
    costBaselineVersion: string;
    calculationMethod: 'PER_ROOM' | 'AGGREGATE' | 'HYBRID';
    warnings: string[];
  };
  metadata: {
    reportDirectivesChecked: number;
    dimensionComparisonsPerformed: number;
    deviationsFound: number;
    roomsMapped: number;
    roomsUnmapped: number;
  };
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
 * Calculate height from quantity rule
 */
function getHeightFromRule(rule: string, actualCeilingHeight: number): number {
  if (rule === 'FULL_HEIGHT') return actualCeilingHeight;
  if (rule === '2FT_CUT') return 2;
  if (rule === '4FT_CUT') return 4;
  if (rule === '6FT_CUT') return 6;
  if (rule === 'CEILING_ONLY') return 0;
  return actualCeilingHeight;
}

/**
 * Try to map estimate items to specific rooms
 */
function mapEstimateToRooms(
  items: StructuredLineItem[],
  rooms: RoomQuantities[]
): Map<string, StructuredLineItem[]> {
  
  const mapping = new Map<string, StructuredLineItem[]>();
  const unmappedItems: StructuredLineItem[] = [];
  
  for (const item of items) {
    const desc = item.description.toLowerCase();
    let mapped = false;
    
    // Try to match room names in description
    for (const room of rooms) {
      const roomNameLower = room.roomName.toLowerCase();
      
      if (desc.includes(roomNameLower)) {
        if (!mapping.has(room.roomName)) {
          mapping.set(room.roomName, []);
        }
        mapping.get(room.roomName)!.push(item);
        mapped = true;
        break;
      }
    }
    
    if (!mapped) {
      unmappedItems.push(item);
    }
  }
  
  // If we have unmapped items, add them to a special key
  if (unmappedItems.length > 0) {
    mapping.set('__UNMAPPED__', unmappedItems);
  }
  
  return mapping;
}

/**
 * PER-ROOM drywall deviation calculation
 */
function calculateDrywallDeviationPerRoom(
  estimate: StructuredEstimate,
  directive: ReportDirective,
  dimensions: ExpectedQuantities
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
  
  // Try to map items to rooms
  const roomMapping = mapEstimateToRooms(removalItems, dimensions.breakdown.rooms);
  const hasUnmapped = roomMapping.has('__UNMAPPED__');
  
  const roomGeometries: RoomGeometry[] = [];
  let totalDeltaSF = 0;
  let calculationMethod: 'PER_ROOM' | 'AGGREGATE' = 'AGGREGATE';
  const warnings: string[] = [];
  
  // If all items are unmapped, use aggregate calculation
  if (hasUnmapped && roomMapping.size === 1) {
    calculationMethod = 'AGGREGATE';
    warnings.push('Estimate items not mapped to specific rooms - using aggregate calculation');
    
    const totalPerimeterLF = dimensions.breakdown.totals.totalPerimeterLF;
    
    // EDGE CASE: Zero perimeter
    if (totalPerimeterLF === 0) {
      throw new Error('VALIDATION_ERROR: Dimension perimeter is zero - invalid dimension data');
    }
    
    const estimateHeight = wallSF > 0 ? wallSF / totalPerimeterLF : 0;
    
    // Validate estimate height
    const avgCeilingHeight = dimensions.breakdown.rooms.reduce((sum, r) => sum + r.height, 0) / dimensions.breakdown.rooms.length;
    
    if (estimateHeight > avgCeilingHeight) {
      throw new Error(
        `VALIDATION_ERROR: Extracted estimate height (${estimateHeight.toFixed(1)} ft) exceeds average ceiling height (${avgCeilingHeight} ft). ` +
        `This indicates either: (1) ceiling is included in wall removal quantity, or (2) dimension data is incorrect.`
      );
    }
    
    const reportHeight = getHeightFromRule(directive.quantityRule || 'FULL_HEIGHT', avgCeilingHeight);
    
    const reportWallSF = totalPerimeterLF * reportHeight;
    const estimateWallSF = totalPerimeterLF * estimateHeight;
    const deltaSF = reportWallSF - estimateWallSF;
    
    // EDGE CASE: Negative delta
    if (deltaSF <= 0) {
      return null; // Estimate meets or exceeds directive
    }
    
    totalDeltaSF = deltaSF;
    
    roomGeometries.push({
      roomName: 'All Rooms (Aggregate)',
      perimeter: totalPerimeterLF,
      wallHeight: avgCeilingHeight,
      estimateHeight: Math.round(estimateHeight * 100) / 100,
      reportHeight,
      estimateWallSF: Math.round(estimateWallSF * 100) / 100,
      reportWallSF: Math.round(reportWallSF * 100) / 100,
      deltaSF: Math.round(deltaSF * 100) / 100,
      ceilingIncluded: ceilingSF > 0,
      formula: `Perimeter ${totalPerimeterLF.toFixed(0)} LF × (${reportHeight} ft - ${estimateHeight.toFixed(1)} ft) = ${deltaSF.toFixed(0)} SF`
    });
    
  } else {
    // PER-ROOM CALCULATION
    calculationMethod = 'PER_ROOM';
    
    for (const room of dimensions.breakdown.rooms) {
      const roomItems = roomMapping.get(room.roomName) || [];
      
      if (roomItems.length === 0) {
        // Room has no estimate items - full delta
        const perimeter = 2 * (room.length + room.width);
        const reportHeight = getHeightFromRule(directive.quantityRule || 'FULL_HEIGHT', room.height);
        const deltaSF = perimeter * reportHeight;
        
        if (deltaSF > 0) {
          totalDeltaSF += deltaSF;
          
          roomGeometries.push({
            roomName: room.roomName,
            perimeter,
            wallHeight: room.height,
            estimateHeight: 0,
            reportHeight,
            estimateWallSF: 0,
            reportWallSF: deltaSF,
            deltaSF,
            ceilingIncluded: false,
            formula: `${room.roomName}: ${perimeter.toFixed(0)} LF × ${reportHeight} ft = ${deltaSF.toFixed(0)} SF (no estimate)`
          });
        }
        
      } else {
        // Room has estimate items - calculate delta
        const { wallSF: roomWallSF, ceilingSF: roomCeilingSF } = separateWallAndCeiling(roomItems);
        const perimeter = 2 * (room.length + room.width);
        
        // EDGE CASE: Zero perimeter
        if (perimeter === 0) {
          throw new Error(`VALIDATION_ERROR: Room "${room.roomName}" has zero perimeter (invalid dimensions)`);
        }
        
        const estimateHeight = roomWallSF > 0 ? roomWallSF / perimeter : 0;
        
        // VALIDATE: Estimate height cannot exceed room height
        if (estimateHeight > room.height) {
          throw new Error(
            `VALIDATION_ERROR: Room "${room.roomName}" extracted height (${estimateHeight.toFixed(1)} ft) exceeds ceiling height (${room.height} ft). ` +
            `Check if ceiling removal is included in wall quantity.`
          );
        }
        
        const reportHeight = getHeightFromRule(directive.quantityRule || 'FULL_HEIGHT', room.height);
        
        const reportWallSF = perimeter * reportHeight;
        const estimateWallSF = perimeter * estimateHeight;
        const deltaSF = Math.max(0, reportWallSF - estimateWallSF); // No negative deltas
        
        if (deltaSF > 0) {
          totalDeltaSF += deltaSF;
          
          roomGeometries.push({
            roomName: room.roomName,
            perimeter,
            wallHeight: room.height,
            estimateHeight: Math.round(estimateHeight * 100) / 100,
            reportHeight,
            estimateWallSF: Math.round(estimateWallSF * 100) / 100,
            reportWallSF: Math.round(reportWallSF * 100) / 100,
            deltaSF: Math.round(deltaSF * 100) / 100,
            ceilingIncluded: roomCeilingSF > 0,
            formula: `${room.roomName}: ${perimeter.toFixed(0)} LF × (${reportHeight} ft - ${estimateHeight.toFixed(1)} ft) = ${deltaSF.toFixed(0)} SF`
          });
        }
      }
    }
    
    // Handle unmapped items
    if (hasUnmapped && roomMapping.get('__UNMAPPED__')!.length > 0) {
      const unmappedItems = roomMapping.get('__UNMAPPED__')!;
      const { wallSF: unmappedWallSF } = separateWallAndCeiling(unmappedItems);
      
      warnings.push(
        `${unmappedItems.length} estimate item(s) could not be mapped to specific rooms. ` +
        `These items (${unmappedWallSF.toFixed(0)} SF) are distributed across aggregate perimeter.`
      );
      
      // Add unmapped to aggregate calculation
      const totalPerimeterLF = dimensions.breakdown.totals.totalPerimeterLF;
      const avgCeilingHeight = dimensions.breakdown.rooms.reduce((sum, r) => sum + r.height, 0) / dimensions.breakdown.rooms.length;
      const estimateHeight = unmappedWallSF / totalPerimeterLF;
      const reportHeight = getHeightFromRule(directive.quantityRule || 'FULL_HEIGHT', avgCeilingHeight);
      const deltaSF = Math.max(0, totalPerimeterLF * (reportHeight - estimateHeight));
      
      if (deltaSF > 0) {
        totalDeltaSF += deltaSF;
        
        roomGeometries.push({
          roomName: 'Unmapped Items',
          perimeter: totalPerimeterLF,
          wallHeight: avgCeilingHeight,
          estimateHeight: Math.round(estimateHeight * 100) / 100,
          reportHeight,
          estimateWallSF: unmappedWallSF,
          reportWallSF: totalPerimeterLF * reportHeight,
          deltaSF: Math.round(deltaSF * 100) / 100,
          ceilingIncluded: false,
          formula: `Unmapped: ${totalPerimeterLF.toFixed(0)} LF × (${reportHeight} ft - ${estimateHeight.toFixed(1)} ft) = ${deltaSF.toFixed(0)} SF`
        });
      }
    }
  }
  
  // EDGE CASE: No delta
  if (totalDeltaSF === 0) {
    return null;
  }
  
  // Calculate exposure
  const costRange = calculateMissingItemExposure('DRY', totalDeltaSF, 'SF', 'REPLACE_1/2');
  
  if (!costRange) {
    return null;
  }
  
  // Build calculation summary
  const calculationSummary = roomGeometries.length === 1
    ? roomGeometries[0].formula
    : `Per-room: ${roomGeometries.map(r => `${r.roomName} ${r.deltaSF.toFixed(0)} SF`).join(', ')} = ${totalDeltaSF.toFixed(0)} SF total × $${COST_BASELINE['DRY_REPLACE_1/2'].min}-${COST_BASELINE['DRY_REPLACE_1/2'].max}/SF`;
  
  return {
    deviationType: 'INSUFFICIENT_CUT_HEIGHT',
    trade: 'DRY',
    tradeName: 'Drywall',
    issue: `Expert report requires ${directive.quantityRule || 'FULL_HEIGHT'} but estimate shows insufficient height (${calculationMethod.toLowerCase()} calculation)`,
    reportDirective: directive.directive,
    estimateValue: wallSF,
    expectedValue: wallSF + totalDeltaSF,
    impactMin: costRange.min,
    impactMax: costRange.max,
    severity: totalDeltaSF > 400 ? 'CRITICAL' : totalDeltaSF > 200 ? 'HIGH' : 'MODERATE',
    calculation: calculationSummary,
    roomGeometry: roomGeometries,
    source: 'REPORT'
  };
}

/**
 * PER-ROOM insulation deviation calculation
 */
function calculateInsulationDeviationPerRoom(
  estimate: StructuredEstimate,
  directive: ReportDirective,
  dimensions: ExpectedQuantities
): Deviation | null {
  
  const insulationItems = estimate.lineItems.filter(item => item.tradeCode === 'INS');
  const estimateInsulationSF = insulationItems.reduce((sum, item) => sum + item.quantity, 0);
  
  // Map items to rooms
  const roomMapping = mapEstimateToRooms(insulationItems, dimensions.breakdown.rooms);
  
  const roomGeometries: RoomGeometry[] = [];
  let totalDeltaSF = 0;
  
  for (const room of dimensions.breakdown.rooms) {
    const roomItems = roomMapping.get(room.roomName) || [];
    const roomInsulationSF = roomItems.reduce((sum, item) => sum + item.quantity, 0);
    
    const perimeter = 2 * (room.length + room.width);
    const expectedInsulationSF = perimeter * room.height; // Wall area
    const deltaSF = Math.max(0, expectedInsulationSF - roomInsulationSF);
    
    if (deltaSF > 0) {
      totalDeltaSF += deltaSF;
      
      roomGeometries.push({
        roomName: room.roomName,
        perimeter,
        wallHeight: room.height,
        estimateHeight: 0,
        reportHeight: 0,
        estimateWallSF: roomInsulationSF,
        reportWallSF: expectedInsulationSF,
        deltaSF: Math.round(deltaSF * 100) / 100,
        ceilingIncluded: false,
        formula: `${room.roomName}: ${perimeter.toFixed(0)} LF × ${room.height} ft = ${expectedInsulationSF.toFixed(0)} SF expected, ${deltaSF.toFixed(0)} SF shortfall`
      });
    }
  }
  
  // EDGE CASE: No delta
  if (totalDeltaSF === 0) {
    return null;
  }
  
  const costRange = calculateMissingItemExposure('INS', totalDeltaSF, 'SF', 'BATT_R13');
  
  if (!costRange) {
    return null;
  }
  
  const calculationSummary = roomGeometries.length === 1
    ? roomGeometries[0].formula
    : `Per-room: ${roomGeometries.map(r => `${r.roomName} ${r.deltaSF.toFixed(0)} SF`).join(', ')} = ${totalDeltaSF.toFixed(0)} SF total × $${COST_BASELINE['INS_BATT_R13'].min}-${COST_BASELINE['INS_BATT_R13'].max}/SF`;
  
  return {
    deviationType: 'MISSING_INSULATION',
    trade: 'INS',
    tradeName: 'Insulation',
    issue: `Expert report requires insulation replacement but estimate shows ${estimateInsulationSF} SF (expected ${(estimateInsulationSF + totalDeltaSF).toFixed(0)} SF based on wall area)`,
    reportDirective: directive.directive,
    estimateValue: estimateInsulationSF,
    expectedValue: estimateInsulationSF + totalDeltaSF,
    impactMin: costRange.min,
    impactMax: costRange.max,
    severity: totalDeltaSF > 500 ? 'CRITICAL' : totalDeltaSF > 200 ? 'HIGH' : 'MODERATE',
    calculation: calculationSummary,
    roomGeometry: roomGeometries,
    source: 'REPORT'
  };
}

/**
 * Compare estimate against report directives with PER-ROOM GEOMETRY
 */
function compareAgainstReportPerRoom(
  estimate: StructuredEstimate,
  report: ParsedReport,
  dimensions: ExpectedQuantities
): { deviations: Deviation[]; warnings: string[] } {
  
  const deviations: Deviation[] = [];
  const warnings: string[] = [];
  
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
    
    // DRYWALL: Per-room height calculation
    if (directive.trade === 'DRY' && directive.quantityRule) {
      const deviation = calculateDrywallDeviationPerRoom(estimate, directive, dimensions);
      if (deviation) {
        deviations.push(deviation);
      }
    }
    
    // INSULATION: Per-room wall area calculation
    if (directive.trade === 'INS') {
      const deviation = calculateInsulationDeviationPerRoom(estimate, directive, dimensions);
      if (deviation) {
        deviations.push(deviation);
      }
    }
  }
  
  return { deviations, warnings };
}

/**
 * Compare estimate against dimension measurements (PER-ROOM)
 */
function compareAgainstDimensionsPerRoom(
  estimate: StructuredEstimate,
  dimensions: ExpectedQuantities
): { deviations: Deviation[]; warnings: string[] } {
  
  const deviations: Deviation[] = [];
  const warnings: string[] = [];
  
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
        source: 'DIMENSION'
      });
    }
  }
  
  // Ceiling variance
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
        source: 'DIMENSION'
      });
    }
  }
  
  // Compare insulation
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
  
  return { deviations, warnings };
}

/**
 * Calculate per-room deviations (ENTERPRISE-GRADE)
 */
export function calculatePerRoomDeviations(
  estimate: StructuredEstimate,
  report?: ParsedReport,
  dimensions?: ExpectedQuantities
): DeviationAnalysis {
  
  const deviations: Deviation[] = [];
  const allWarnings: string[] = [];
  const perRoomCalculations: RoomGeometry[] = [];
  
  let reportDirectivesChecked = 0;
  let dimensionComparisonsPerformed = 0;
  let roomsMapped = 0;
  let roomsUnmapped = 0;
  
  // Require dimensions for report comparison
  if (report && report.directives && report.directives.length > 0) {
    if (!dimensions) {
      throw new Error(
        'VALIDATION_ERROR: Dimension data required for report directive comparison. ' +
        'Cannot calculate height-based deviations without room measurements.'
      );
    }
    
    const { deviations: reportDeviations, warnings } = compareAgainstReportPerRoom(
      estimate,
      report,
      dimensions
    );
    
    deviations.push(...reportDeviations);
    allWarnings.push(...warnings);
    reportDirectivesChecked = report.directives.filter(d => d.measurable).length;
    
    // Collect room geometries
    for (const dev of reportDeviations) {
      if (dev.roomGeometry) {
        perRoomCalculations.push(...dev.roomGeometry);
        roomsMapped += dev.roomGeometry.filter(r => r.roomName !== 'All Rooms (Aggregate)' && r.roomName !== 'Unmapped Items').length;
        roomsUnmapped += dev.roomGeometry.filter(r => r.roomName === 'Unmapped Items').length > 0 ? 1 : 0;
      }
    }
  }
  
  // Compare against dimensions
  if (dimensions) {
    const { deviations: dimensionDeviations, warnings } = compareAgainstDimensionsPerRoom(
      estimate,
      dimensions
    );
    
    deviations.push(...dimensionDeviations);
    allWarnings.push(...warnings);
    dimensionComparisonsPerformed = 4; // Drywall walls, ceiling, insulation, flooring, baseboard
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
  
  const calculationMethod = roomsMapped > 0 ? 'PER_ROOM' : roomsUnmapped > 0 ? 'HYBRID' : 'AGGREGATE';
  
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
      perRoomCalculations,
      totalPerimeter: dimensions?.breakdown.totals.totalPerimeterLF || 0,
      avgCeilingHeight: dimensions?.breakdown.rooms && dimensions.breakdown.rooms.length > 0
        ? dimensions.breakdown.rooms.reduce((sum, r) => sum + r.height, 0) / dimensions.breakdown.rooms.length
        : 0,
      costBaselineVersion: COST_BASELINE_VERSION,
      calculationMethod,
      warnings: allWarnings
    },
    metadata: {
      reportDirectivesChecked,
      dimensionComparisonsPerformed,
      deviationsFound: deviations.length,
      roomsMapped,
      roomsUnmapped
    }
  };
}
