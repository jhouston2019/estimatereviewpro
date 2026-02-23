/**
 * DEVIATION ENGINE
 * Compares estimate vs expert report directives vs dimension measurements
 * Quantifies ALL variance using actual parsed data
 * NO GUESSING
 */

import { StructuredEstimate } from './xactimate-structural-parser';
import { ParsedReport, ReportDirective } from './report-parser';
import { ExpectedQuantities } from './dimension-engine';
import { calculateMissingItemExposure, COST_BASELINE } from './cost-baseline';

export type DeviationType = 
  | 'UNDER_SCOPED_REMOVAL'
  | 'MISSING_REQUIRED_TRADE'
  | 'INSUFFICIENT_CUT_HEIGHT'
  | 'MISSING_INSULATION'
  | 'MISSING_DECKING'
  | 'DIMENSION_MISMATCH'
  | 'QUANTITY_SHORTFALL';

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
  source: 'REPORT' | 'DIMENSION' | 'BOTH';
}

export interface DeviationAnalysis {
  deviations: Deviation[];
  totalDeviationExposureMin: number;
  totalDeviationExposureMax: number;
  criticalCount: number;
  highCount: number;
  summary: string;
  metadata: {
    reportDirectivesChecked: number;
    dimensionComparisonsPerformed: number;
    deviationsFound: number;
  };
}

/**
 * Calculate height from quantity rule
 */
function getHeightFromRule(rule: string): number {
  if (rule === '2FT_CUT') return 2;
  if (rule === '4FT_CUT') return 4;
  if (rule === '6FT_CUT') return 6;
  if (rule === 'FULL_HEIGHT') return 8; // Default ceiling height
  return 8;
}

/**
 * Compare estimate against report directives with TRUE GEOMETRY
 */
function compareAgainstReport(
  estimate: StructuredEstimate,
  report: ParsedReport,
  dimensions?: ExpectedQuantities
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
    
    // Check quantity rule compliance with TRUE GEOMETRY
    if (directive.quantityRule && directive.trade === 'DRY') {
      const removalItems = tradeItems.filter(item => item.actionType === 'REMOVE');
      
      if (removalItems.length === 0 && directive.directiveType === 'REMOVE') {
        deviations.push({
          deviationType: 'UNDER_SCOPED_REMOVAL',
          trade: directive.trade,
          tradeName: directive.tradeName,
          issue: `Expert report requires removal but no removal items found`,
          reportDirective: directive.directive,
          estimateValue: 0,
          impactMin: 2000,
          impactMax: 8000,
          severity: 'HIGH',
          calculation: 'Missing removal scope per expert directive',
          source: 'REPORT'
        });
        continue;
      }
      
      // TRUE GEOMETRY CALCULATION
      if (dimensions && dimensions.breakdown) {
        const totalRemovalQty = removalItems.reduce((sum, item) => sum + item.quantity, 0);
        const reportHeight = getHeightFromRule(directive.quantityRule);
        
        // Calculate perimeter from dimension data
        const totalPerimeterLF = dimensions.breakdown.totals.totalPerimeterLF;
        
        // Estimate height from estimate quantity (reverse calculation)
        // estimateSF = perimeter × height
        const estimateHeight = totalPerimeterLF > 0 ? totalRemovalQty / totalPerimeterLF : 2;
        
        // Calculate expected SF based on report directive
        const reportSF = totalPerimeterLF * reportHeight;
        const estimateSF = totalPerimeterLF * estimateHeight;
        const deltaSF = reportSF - estimateSF;
        
        if (deltaSF > 0) {
          const costRange = calculateMissingItemExposure('DRY', deltaSF, 'SF', 'REPLACE_1/2');
          
          if (costRange) {
            deviations.push({
              deviationType: 'INSUFFICIENT_CUT_HEIGHT',
              trade: 'DRY',
              tradeName: 'Drywall',
              issue: `Expert report requires ${reportHeight} ft height but estimate shows ${estimateHeight.toFixed(1)} ft`,
              reportDirective: directive.directive,
              estimateValue: totalRemovalQty,
              expectedValue: reportSF,
              impactMin: costRange.min,
              impactMax: costRange.max,
              severity: deltaSF > 400 ? 'CRITICAL' : 'HIGH',
              calculation: `Perimeter ${totalPerimeterLF.toFixed(0)} LF × (${reportHeight} ft - ${estimateHeight.toFixed(1)} ft) = ${deltaSF.toFixed(0)} SF × $${COST_BASELINE['DRY_REPLACE_1/2'].min}-${COST_BASELINE['DRY_REPLACE_1/2'].max}/SF`,
              source: 'REPORT'
            });
          }
        }
      } else {
        // NO DIMENSIONS - structured error
        throw new Error(
          'Cannot calculate height-based deviation without dimension data. ' +
          'Provide room dimensions to enable deterministic height delta calculation.'
        );
      }
    }
  }
  
  return deviations;
}

/**
 * Compare estimate against dimension measurements with TRUE GEOMETRY
 */
function compareAgainstDimensions(
  estimate: StructuredEstimate,
  dimensions: ExpectedQuantities
): Deviation[] {
  
  const deviations: Deviation[] = [];
  
  // Compare drywall (walls + ceiling)
  const drywallItems = estimate.lineItems.filter(item => item.tradeCode === 'DRY');
  const estimateDrywallSF = drywallItems.reduce((sum, item) => sum + item.quantity, 0);
  
  if (dimensions.drywallSF > 0) {
    const variance = dimensions.drywallSF - estimateDrywallSF;
    const variancePercent = (variance / dimensions.drywallSF) * 100;
    
    if (variancePercent > 20) {
      const costRange = calculateMissingItemExposure('DRY', variance, 'SF', 'REPLACE_1/2');
      
      if (costRange) {
        deviations.push({
          deviationType: 'DIMENSION_MISMATCH',
          trade: 'DRY',
          tradeName: 'Drywall',
          issue: `Estimate shows ${estimateDrywallSF} SF but dimensions indicate ${dimensions.drywallSF} SF needed`,
          estimateValue: estimateDrywallSF,
          expectedValue: dimensions.drywallSF,
          dimensionBased: true,
          impactMin: costRange.min,
          impactMax: costRange.max,
          severity: variancePercent > 40 ? 'CRITICAL' : 'HIGH',
          calculation: `Wall SF ${dimensions.breakdown.totals.totalWallSF.toFixed(0)} + Ceiling SF ${dimensions.breakdown.totals.totalCeilingSF.toFixed(0)} = ${dimensions.drywallSF.toFixed(0)} SF expected, ${variance.toFixed(0)} SF shortfall × $${COST_BASELINE['DRY_REPLACE_1/2'].min}-${COST_BASELINE['DRY_REPLACE_1/2'].max}/SF`,
          source: 'DIMENSION'
        });
      }
    }
  }
  
  // Compare insulation (wall surface area)
  const insulationItems = estimate.lineItems.filter(item => item.tradeCode === 'INS');
  const estimateInsulationSF = insulationItems.reduce((sum, item) => sum + item.quantity, 0);
  
  if (dimensions.insulationSF > 0) {
    const variance = dimensions.insulationSF - estimateInsulationSF;
    const variancePercent = (variance / dimensions.insulationSF) * 100;
    
    if (variancePercent > 20) {
      const costRange = calculateMissingItemExposure('INS', variance, 'SF', 'BATT_R13');
      
      if (costRange) {
        deviations.push({
          deviationType: 'DIMENSION_MISMATCH',
          trade: 'INS',
          tradeName: 'Insulation',
          issue: `Estimate shows ${estimateInsulationSF} SF but dimensions indicate ${dimensions.insulationSF} SF needed`,
          estimateValue: estimateInsulationSF,
          expectedValue: dimensions.insulationSF,
          dimensionBased: true,
          impactMin: costRange.min,
          impactMax: costRange.max,
          severity: variancePercent > 40 ? 'HIGH' : 'MODERATE',
          calculation: `Wall SF ${dimensions.breakdown.totals.totalWallSF.toFixed(0)} = ${dimensions.insulationSF.toFixed(0)} SF expected, ${variance.toFixed(0)} SF shortfall × $${COST_BASELINE['INS_BATT_R13'].min}-${COST_BASELINE['INS_BATT_R13'].max}/SF`,
          source: 'DIMENSION'
        });
      }
    }
  }
  
  // Compare ceiling
  const ceilingItems = estimate.lineItems.filter(item => item.tradeCode === 'CEI');
  const estimateCeilingSF = ceilingItems.reduce((sum, item) => sum + item.quantity, 0);
  
  if (dimensions.ceilingSF > 0) {
    const variance = dimensions.ceilingSF - estimateCeilingSF;
    const variancePercent = (variance / dimensions.ceilingSF) * 100;
    
    if (variancePercent > 20) {
      deviations.push({
        deviationType: 'DIMENSION_MISMATCH',
        trade: 'CEI',
        tradeName: 'Ceiling',
        issue: `Estimate shows ${estimateCeilingSF} SF but dimensions indicate ${dimensions.ceilingSF} SF needed`,
        estimateValue: estimateCeilingSF,
        expectedValue: dimensions.ceilingSF,
        dimensionBased: true,
        impactMin: variance * 3,
        impactMax: variance * 6,
        severity: variancePercent > 40 ? 'HIGH' : 'MODERATE',
        calculation: `Ceiling SF ${dimensions.ceilingSF.toFixed(0)} expected, ${variance.toFixed(0)} SF shortfall × $3-6/SF`,
        source: 'DIMENSION'
      });
    }
  }
  
  // Compare flooring
  const flooringItems = estimate.lineItems.filter(item => 
    ['FLR', 'CRP', 'VCT', 'TIL'].includes(item.tradeCode)
  );
  const estimateFlooringSF = flooringItems.reduce((sum, item) => sum + item.quantity, 0);
  
  if (dimensions.flooringSF > 0) {
    const variance = dimensions.flooringSF - estimateFlooringSF;
    const variancePercent = (variance / dimensions.flooringSF) * 100;
    
    if (variancePercent > 20) {
      deviations.push({
        deviationType: 'QUANTITY_SHORTFALL',
        trade: 'FLR',
        tradeName: 'Flooring',
        issue: `Estimate shows ${estimateFlooringSF} SF but dimensions indicate ${dimensions.flooringSF} SF needed`,
        estimateValue: estimateFlooringSF,
        expectedValue: dimensions.flooringSF,
        dimensionBased: true,
        impactMin: variance * 3, // Conservative $3/SF
        impactMax: variance * 8, // Conservative $8/SF
        severity: variancePercent > 40 ? 'HIGH' : 'MODERATE',
        calculation: `${variance.toFixed(0)} SF shortfall × $3-8/SF`,
        source: 'DIMENSION'
      });
    }
  }
  
  // Compare baseboard
  const baseboardItems = estimate.lineItems.filter(item => item.tradeCode === 'MLD');
  const estimateBaseboardLF = baseboardItems.reduce((sum, item) => sum + item.quantity, 0);
  
  if (dimensions.baseboardLF > 0) {
    const variance = dimensions.baseboardLF - estimateBaseboardLF;
    const variancePercent = (variance / dimensions.baseboardLF) * 100;
    
    if (variancePercent > 20) {
      const costRange = calculateMissingItemExposure('MLD', variance, 'LF', 'BASEBOARD');
      
      if (costRange) {
        deviations.push({
          deviationType: 'QUANTITY_SHORTFALL',
          trade: 'MLD',
          tradeName: 'Molding/Trim',
          issue: `Estimate shows ${estimateBaseboardLF} LF but dimensions indicate ${dimensions.baseboardLF} LF needed`,
          estimateValue: estimateBaseboardLF,
          expectedValue: dimensions.baseboardLF,
          dimensionBased: true,
          impactMin: costRange.min,
          impactMax: costRange.max,
          severity: 'MODERATE',
          calculation: `${variance.toFixed(0)} LF shortfall × $${COST_BASELINE['MLD_BASEBOARD'].min}-${COST_BASELINE['MLD_BASEBOARD'].max}/LF`,
          source: 'DIMENSION'
        });
      }
    }
  }
  
  return deviations;
}

/**
 * Calculate deviation analysis
 */
export function calculateDeviations(
  estimate: StructuredEstimate,
  report?: ParsedReport,
  dimensions?: ExpectedQuantities
): DeviationAnalysis {
  
  const deviations: Deviation[] = [];
  
  let reportDirectivesChecked = 0;
  let dimensionComparisonsPerformed = 0;
  
  // Compare against report directives (with dimensions for geometry)
  if (report && report.directives.length > 0) {
    const reportDeviations = compareAgainstReport(estimate, report, dimensions);
    deviations.push(...reportDeviations);
    reportDirectivesChecked = report.directives.filter(d => d.measurable).length;
  }
  
  // Compare against dimensions
  if (dimensions) {
    const dimensionDeviations = compareAgainstDimensions(estimate, dimensions);
    deviations.push(...dimensionDeviations);
    dimensionComparisonsPerformed = 3; // Drywall, flooring, baseboard
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
    metadata: {
      reportDirectivesChecked,
      dimensionComparisonsPerformed,
      deviationsFound: deviations.length
    }
  };
}
