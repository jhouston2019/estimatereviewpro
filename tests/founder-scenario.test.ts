/**
 * FOUNDER SCENARIO TEST
 * Tests enforcement-grade deterministic calculation
 * NO STATIC FALLBACKS - TRUE GEOMETRY ONLY
 */

import { normalizeInput } from '../lib/input-normalizer';
import { detectFormat } from '../lib/format-detector';
import { parseStructuredEstimate } from '../lib/xactimate-structural-parser';
import { calculateExpectedQuantities } from '../lib/dimension-engine';
import { parseReportFromText } from '../lib/report-parser';
import { calculateDeviations } from '../lib/deviation-engine';

/**
 * FOUNDER SCENARIO:
 * - 2,000 SF home (40ft × 50ft footprint)
 * - 8 ft wall height
 * - Engineering report: "Remove drywall full height, Replace all insulation"
 * - Estimate scopes: 2 ft drywall cut, no insulation
 */

const ESTIMATE_TEXT = `
DRY    Remove drywall 1/2" 2 ft    360    SF    $720.00     $630.00
DRY    Replace drywall 1/2" 2 ft   360    SF    $1,440.00   $1,260.00
PNT    Paint interior walls         360    SF    $720.00     $630.00
FLR    Remove carpet and pad        2000   SF    $2,000.00   $1,750.00
FLR    Install carpet and pad       2000   SF    $12,000.00  $10,500.00
`;

const ENGINEERING_REPORT_TEXT = `
ENGINEERING ASSESSMENT REPORT

Property: 123 Main St
Date: 2026-02-23

FINDINGS:
Water damage from Category 3 water intrusion has affected all exterior walls.

RECOMMENDATIONS:
1. Remove drywall full height on all affected walls
2. Replace all insulation in exterior walls
3. Replace drywall and finish

The current scope of 2 ft removal is insufficient for Category 3 water damage.
All insulation must be replaced due to contamination.
`;

const DIMENSIONS = {
  rooms: [
    { name: 'Living Room', length: 20, width: 15, height: 8 },
    { name: 'Kitchen', length: 12, width: 10, height: 8 },
    { name: 'Master Bedroom', length: 16, width: 14, height: 8 },
    { name: 'Bedroom 2', length: 12, width: 12, height: 8 }
  ],
  sourceType: 'MANUAL' as const
};

export async function runFounderScenario() {
  console.log('='.repeat(80));
  console.log('FOUNDER SCENARIO TEST');
  console.log('='.repeat(80));
  console.log('');
  
  const results: any = {
    passed: false,
    checks: {},
    errors: []
  };
  
  try {
    // ========================================
    // STEP 1: Parse Estimate
    // ========================================
    console.log('[1/5] Parsing estimate...');
    
    const normalized = normalizeInput(ESTIMATE_TEXT, 'TEXT');
    const formatDetection = detectFormat(normalized);
    const structuredEstimate = parseStructuredEstimate(normalized, formatDetection);
    
    console.log(`  ✓ Parsed ${structuredEstimate.lineItems.length} line items`);
    console.log(`  ✓ Parse confidence: ${(structuredEstimate.parseConfidence * 100).toFixed(1)}%`);
    
    results.checks.estimateParsed = true;
    
    // ========================================
    // STEP 2: Calculate Expected Quantities from Dimensions
    // ========================================
    console.log('\n[2/5] Calculating expected quantities from dimensions...');
    
    const expectedQuantities = calculateExpectedQuantities(DIMENSIONS, 'FULL_HEIGHT');
    
    console.log(`  ✓ Total perimeter: ${expectedQuantities.breakdown.totals.totalPerimeterLF.toFixed(0)} LF`);
    console.log(`  ✓ Expected drywall (full height): ${expectedQuantities.drywallSF.toFixed(0)} SF`);
    console.log(`  ✓ Expected insulation: ${expectedQuantities.insulationSF.toFixed(0)} SF`);
    
    results.checks.dimensionsCalculated = true;
    results.expectedDrywallSF = expectedQuantities.drywallSF;
    results.expectedInsulationSF = expectedQuantities.insulationSF;
    results.perimeter = expectedQuantities.breakdown.totals.totalPerimeterLF;
    
    // ========================================
    // STEP 3: Parse Engineering Report
    // ========================================
    console.log('\n[3/5] Parsing engineering report...');
    
    const expertReport = parseReportFromText(ENGINEERING_REPORT_TEXT);
    
    console.log(`  ✓ Extracted ${expertReport.directives.length} directive(s)`);
    console.log(`  ✓ Measurable directives: ${expertReport.metadata.measurableDirectives}`);
    
    for (const directive of expertReport.directives) {
      console.log(`    - ${directive.tradeName}: ${directive.directive}`);
      console.log(`      Rule: ${directive.quantityRule}, Priority: ${directive.priority}`);
    }
    
    results.checks.reportParsed = true;
    results.directivesFound = expertReport.directives.length;
    
    // ========================================
    // STEP 4: Calculate Deviations (TRUE GEOMETRY)
    // ========================================
    console.log('\n[4/5] Calculating deviations with TRUE GEOMETRY...');
    
    const deviations = calculateDeviations(
      structuredEstimate,
      expertReport,
      expectedQuantities
    );
    
    console.log(`  ✓ Found ${deviations.deviations.length} deviation(s)`);
    console.log(`  ✓ Total deviation exposure: $${deviations.totalDeviationExposureMin.toLocaleString()} - $${deviations.totalDeviationExposureMax.toLocaleString()}`);
    
    results.checks.deviationsCalculated = true;
    results.deviationCount = deviations.deviations.length;
    results.deviationExposureMin = deviations.totalDeviationExposureMin;
    results.deviationExposureMax = deviations.totalDeviationExposureMax;
    
    // ========================================
    // STEP 5: Validate Results
    // ========================================
    console.log('\n[5/5] Validating results...');
    
    // Check 1: Drywall height deviation detected
    const drywallDeviation = deviations.deviations.find(d => 
      d.trade === 'DRY' && d.deviationType === 'INSUFFICIENT_CUT_HEIGHT'
    );
    
    if (drywallDeviation) {
      console.log(`  ✓ Drywall height deviation detected`);
      console.log(`    Issue: ${drywallDeviation.issue}`);
      console.log(`    Calculation: ${drywallDeviation.calculation}`);
      results.checks.drywallDeviationDetected = true;
      results.drywallCalculation = drywallDeviation.calculation;
    } else {
      console.log(`  ✗ Drywall height deviation NOT detected`);
      results.errors.push('Drywall height deviation not detected');
    }
    
    // Check 2: Insulation missing detected
    const insulationDeviation = deviations.deviations.find(d => 
      d.trade === 'INS'
    );
    
    if (insulationDeviation) {
      console.log(`  ✓ Missing insulation detected`);
      console.log(`    Issue: ${insulationDeviation.issue}`);
      console.log(`    Calculation: ${insulationDeviation.calculation}`);
      results.checks.insulationMissingDetected = true;
      results.insulationCalculation = insulationDeviation.calculation;
    } else {
      console.log(`  ✗ Missing insulation NOT detected`);
      results.errors.push('Missing insulation not detected');
    }
    
    // Check 3: Calculation uses TRUE GEOMETRY (not static)
    if (drywallDeviation && drywallDeviation.calculation.includes('Perimeter')) {
      console.log(`  ✓ Calculation uses TRUE GEOMETRY (perimeter-based)`);
      results.checks.usesGeometry = true;
    } else {
      console.log(`  ✗ Calculation does NOT use geometry`);
      results.errors.push('Calculation does not use perimeter-based geometry');
    }
    
    // Check 4: No static fallback values
    const hasStaticFallback = deviations.deviations.some(d => 
      d.calculation.includes('generic') || 
      d.calculation.includes('estimated') ||
      (d.impactMin === 1500 && d.impactMax === 6000) // Old static values
    );
    
    if (!hasStaticFallback) {
      console.log(`  ✓ No static fallback values detected`);
      results.checks.noStaticFallback = true;
    } else {
      console.log(`  ✗ Static fallback values detected`);
      results.errors.push('Static fallback values used instead of geometry');
    }
    
    // ========================================
    // FINAL VERDICT
    // ========================================
    console.log('\n' + '='.repeat(80));
    console.log('TEST RESULTS');
    console.log('='.repeat(80));
    
    const allChecksPassed = 
      results.checks.estimateParsed &&
      results.checks.dimensionsCalculated &&
      results.checks.reportParsed &&
      results.checks.deviationsCalculated &&
      results.checks.drywallDeviationDetected &&
      results.checks.insulationMissingDetected &&
      results.checks.usesGeometry &&
      results.checks.noStaticFallback;
    
    if (allChecksPassed) {
      console.log('✅ ALL CHECKS PASSED - ENFORCEMENT GRADE');
      results.passed = true;
    } else {
      console.log('❌ SOME CHECKS FAILED - NOT ENFORCEMENT GRADE');
      console.log('\nFailed checks:');
      for (const error of results.errors) {
        console.log(`  - ${error}`);
      }
    }
    
    console.log('\nSummary:');
    console.log(`  Perimeter: ${results.perimeter?.toFixed(0)} LF`);
    console.log(`  Expected drywall (full height): ${results.expectedDrywallSF?.toFixed(0)} SF`);
    console.log(`  Expected insulation: ${results.expectedInsulationSF?.toFixed(0)} SF`);
    console.log(`  Deviations found: ${results.deviationCount}`);
    console.log(`  Deviation exposure: $${results.deviationExposureMin?.toLocaleString()} - $${results.deviationExposureMax?.toLocaleString()}`);
    
    console.log('='.repeat(80));
    
    return results;
    
  } catch (error: any) {
    console.error('\n❌ TEST FAILED WITH ERROR:', error.message);
    results.errors.push(error.message);
    return results;
  }
}

// Run if executed directly
if (require.main === module) {
  runFounderScenario().then(results => {
    process.exit(results.passed ? 0 : 1);
  });
}
