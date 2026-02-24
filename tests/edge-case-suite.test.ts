/**
 * EDGE CASE TEST SUITE
 * Validates room-aware deviation engine under stress
 */

import { normalizeInput } from '../lib/input-normalizer';
import { detectFormat } from '../lib/format-detector';
import { parseStructuredEstimate } from '../lib/xactimate-structural-parser';
import { calculateExpectedQuantities, DimensionInput } from '../lib/dimension-engine';
import { parseReportFromText } from '../lib/report-parser';
import { calculateRoomAwareDeviations } from '../lib/room-aware-deviation-engine';

interface TestCase {
  name: string;
  estimateText: string;
  dimensions: DimensionInput;
  reportText?: string;
  expectedOutcome: {
    shouldDetectDeviation: boolean;
    deviationType?: string;
    shouldUseGeometry: boolean;
    shouldNotCrash: boolean;
    minExposure?: number;
    maxExposure?: number;
  };
}

const TEST_CASES: TestCase[] = [
  
  // ========================================
  // TEST 1: 6-Room Home with Mixed Heights
  // ========================================
  {
    name: '6-Room Home with 9ft Ceilings',
    estimateText: `
DRY    Remove drywall 1/2" 2 ft    720    SF    $1,440.00   $1,260.00
DRY    Replace drywall 1/2" 2 ft   720    SF    $2,880.00   $2,520.00
PNT    Paint interior walls         720    SF    $1,440.00   $1,260.00
`,
    dimensions: {
      rooms: [
        { name: 'Living Room', length: 20, width: 15, height: 9 },
        { name: 'Kitchen', length: 12, width: 10, height: 9 },
        { name: 'Master Bedroom', length: 16, width: 14, height: 9 },
        { name: 'Bedroom 2', length: 12, width: 12, height: 9 },
        { name: 'Bedroom 3', length: 10, width: 10, height: 9 },
        { name: 'Bathroom', length: 8, width: 6, height: 9 }
      ],
      sourceType: 'MANUAL'
    },
    reportText: 'Remove drywall full height on all affected walls.',
    expectedOutcome: {
      shouldDetectDeviation: true,
      deviationType: 'INSUFFICIENT_CUT_HEIGHT',
      shouldUseGeometry: true,
      shouldNotCrash: true,
      minExposure: 3000,
      maxExposure: 8000
    }
  },
  
  // ========================================
  // TEST 2: Ceiling-Only Directive
  // ========================================
  {
    name: 'Ceiling-Only Removal Directive',
    estimateText: `
DRY    Remove drywall walls 4 ft   400    SF    $800.00     $700.00
DRY    Replace drywall walls       400    SF    $1,600.00   $1,400.00
PNT    Paint walls                 400    SF    $800.00     $700.00
`,
    dimensions: {
      rooms: [
        { name: 'Living Room', length: 20, width: 15, height: 8 }
      ],
      sourceType: 'MANUAL'
    },
    reportText: 'Replace ceiling drywall due to water saturation.',
    expectedOutcome: {
      shouldDetectDeviation: true,
      deviationType: 'MISSING_CEILING',
      shouldUseGeometry: true,
      shouldNotCrash: true
    }
  },
  
  // ========================================
  // TEST 3: Estimate Exceeds Directive (Negative Delta)
  // ========================================
  {
    name: 'Estimate Exceeds Directive',
    estimateText: `
DRY    Remove drywall 1/2" full    800    SF    $1,600.00   $1,400.00
DRY    Replace drywall 1/2"        800    SF    $3,200.00   $2,800.00
PNT    Paint interior              800    SF    $1,600.00   $1,400.00
`,
    dimensions: {
      rooms: [
        { name: 'Living Room', length: 20, width: 15, height: 8 }
      ],
      sourceType: 'MANUAL'
    },
    reportText: 'Remove drywall 4 ft up from floor.',
    expectedOutcome: {
      shouldDetectDeviation: true, // Will detect dimension-based deviations (ceiling, insulation, etc)
      deviationType: 'MISSING_CEILING', // Primary deviation will be missing ceiling
      shouldUseGeometry: true,
      shouldNotCrash: true
    }
  },
  
  // ========================================
  // TEST 4: Partial Removal (2 Walls Only)
  // ========================================
  {
    name: 'Partial Wall Removal',
    estimateText: `
DRY    Remove drywall north wall   160    SF    $320.00     $280.00
DRY    Replace drywall north wall  160    SF    $640.00     $560.00
PNT    Paint north wall            160    SF    $320.00     $280.00
`,
    dimensions: {
      rooms: [
        { name: 'Living Room', length: 20, width: 15, height: 8 }
      ],
      sourceType: 'MANUAL'
    },
    reportText: 'Remove drywall full height on all walls.',
    expectedOutcome: {
      shouldDetectDeviation: true,
      deviationType: 'INSUFFICIENT_CUT_HEIGHT',
      shouldUseGeometry: true,
      shouldNotCrash: true
    }
  },
  
  // ========================================
  // TEST 5: Ceiling Included in Estimate
  // ========================================
  {
    name: 'Ceiling Included in Drywall Removal',
    estimateText: `
DRY    Remove drywall walls 4 ft   400    SF    $800.00     $700.00
DRY    Remove drywall ceiling      300    SF    $600.00     $525.00
DRY    Replace drywall walls       400    SF    $1,600.00   $1,400.00
DRY    Replace drywall ceiling     300    SF    $1,200.00   $1,050.00
`,
    dimensions: {
      rooms: [
        { name: 'Living Room', length: 20, width: 15, height: 8 }
      ],
      sourceType: 'MANUAL'
    },
    reportText: 'Remove drywall full height on all walls.',
    expectedOutcome: {
      shouldDetectDeviation: true,
      deviationType: 'INSUFFICIENT_CUT_HEIGHT',
      shouldUseGeometry: true,
      shouldNotCrash: true
    }
  },
  
  // ========================================
  // TEST 6: No Dimensions Provided with Report
  // ========================================
  {
    name: 'Report Without Dimensions (Should Error)',
    estimateText: `
DRY    Remove drywall 1/2" 2 ft    360    SF    $720.00     $630.00
DRY    Replace drywall 1/2" 2 ft   360    SF    $1,440.00   $1,260.00
PNT    Paint walls                 360    SF    $720.00     $630.00
`,
    dimensions: {
      rooms: [],
      sourceType: 'MANUAL'
    },
    reportText: 'Remove drywall full height.',
    expectedOutcome: {
      shouldDetectDeviation: false,
      shouldUseGeometry: false,
      shouldNotCrash: false // Should throw structured error
    }
  },
  
  // ========================================
  // TEST 7: Mixed Cut Heights (Multiple Line Items)
  // ========================================
  {
    name: 'Mixed Cut Heights',
    estimateText: `
DRY    Remove drywall 2 ft bedroom 200    SF    $400.00     $350.00
DRY    Remove drywall 4 ft kitchen 300    SF    $600.00     $525.00
DRY    Replace drywall bedroom     200    SF    $800.00     $700.00
DRY    Replace drywall kitchen     300    SF    $1,200.00   $1,050.00
PNT    Paint bedroom and kitchen   500    SF    $1,000.00   $875.00
`,
    dimensions: {
      rooms: [
        { name: 'Bedroom', length: 12, width: 12, height: 8 },
        { name: 'Kitchen', length: 12, width: 10, height: 8 }
      ],
      sourceType: 'MANUAL'
    },
    reportText: 'Remove drywall full height on all affected walls.',
    expectedOutcome: {
      shouldDetectDeviation: true,
      deviationType: 'INSUFFICIENT_CUT_HEIGHT',
      shouldUseGeometry: true,
      shouldNotCrash: true
    }
  },
  
  // ========================================
  // TEST 8: 10ft Ceilings
  // ========================================
  {
    name: '10ft Ceiling Height',
    estimateText: `
DRY    Remove drywall 1/2" 4 ft    400    SF    $800.00     $700.00
DRY    Replace drywall 1/2"        400    SF    $1,600.00   $1,400.00
PNT    Paint interior walls        400    SF    $800.00     $700.00
`,
    dimensions: {
      rooms: [
        { name: 'Great Room', length: 20, width: 15, height: 10 }
      ],
      sourceType: 'MANUAL'
    },
    reportText: 'Remove drywall full height.',
    expectedOutcome: {
      shouldDetectDeviation: true,
      deviationType: 'INSUFFICIENT_CUT_HEIGHT',
      shouldUseGeometry: true,
      shouldNotCrash: true,
      minExposure: 1500 // Should use 10ft, not 8ft
    }
  }
];

/**
 * Run all edge case tests
 */
export async function runEdgeCaseTests() {
  console.log('='.repeat(80));
  console.log('EDGE CASE TEST SUITE');
  console.log('='.repeat(80));
  console.log('');
  
  let passed = 0;
  let failed = 0;
  const failures: string[] = [];
  
  for (const testCase of TEST_CASES) {
    console.log(`\nTest: ${testCase.name}`);
    console.log('-'.repeat(80));
    
    try {
      // Parse estimate
      const normalized = normalizeInput(testCase.estimateText, 'TEXT');
      const formatDetection = detectFormat(normalized);
      const structuredEstimate = parseStructuredEstimate(normalized, formatDetection);
      
      // Calculate dimensions (skip if no rooms)
      let expectedQuantities;
      if (testCase.dimensions.rooms.length > 0) {
        expectedQuantities = calculateExpectedQuantities(testCase.dimensions, 'FULL_HEIGHT');
      }
      
      // Parse report
      let expertReport;
      if (testCase.reportText) {
        expertReport = parseReportFromText(testCase.reportText);
      }
      
      // Calculate deviations
      let deviations;
      let threwError = false;
      
      try {
        deviations = calculateRoomAwareDeviations(
          structuredEstimate,
          expertReport,
          expectedQuantities
        );
      } catch (error: any) {
        threwError = true;
        
        if (testCase.expectedOutcome.shouldNotCrash === false) {
          console.log(`  ✓ Expected error: ${error.message}`);
          passed++;
          continue;
        } else {
          console.log(`  ✗ Unexpected error: ${error.message}`);
          failures.push(`${testCase.name}: Unexpected error - ${error.message}`);
          failed++;
          continue;
        }
      }
      
      // Validate outcome
      const hasDeviation = deviations.deviations.length > 0;
      
      // Special handling for "Estimate Exceeds Directive" test
      if (testCase.name === 'Estimate Exceeds Directive') {
        // Should NOT have INSUFFICIENT_CUT_HEIGHT deviation
        const hasHeightDeviation = deviations.deviations.some(d => 
          d.deviationType === 'INSUFFICIENT_CUT_HEIGHT'
        );
        
        if (hasHeightDeviation) {
          console.log(`  ✗ Should not detect height deviation when estimate exceeds directive`);
          failures.push(`${testCase.name}: Incorrectly detected height deviation`);
          failed++;
          continue;
        }
        
        console.log(`  ✓ Correctly skipped height deviation (estimate exceeds directive)`);
        console.log(`    Other deviations detected: ${deviations.deviations.length} (dimension-based)`);
        passed++;
        continue;
      }
      
      if (testCase.expectedOutcome.shouldDetectDeviation !== hasDeviation) {
        console.log(`  ✗ Expected deviation: ${testCase.expectedOutcome.shouldDetectDeviation}, Got: ${hasDeviation}`);
        failures.push(`${testCase.name}: Deviation detection mismatch`);
        failed++;
        continue;
      }
      
      // Check deviation type
      if (testCase.expectedOutcome.deviationType && hasDeviation) {
        const hasExpectedType = deviations.deviations.some(d => 
          d.deviationType === testCase.expectedOutcome.deviationType
        );
        
        if (!hasExpectedType) {
          console.log(`  ✗ Expected deviation type: ${testCase.expectedOutcome.deviationType}`);
          failures.push(`${testCase.name}: Wrong deviation type`);
          failed++;
          continue;
        }
      }
      
      // Check geometry usage
      if (testCase.expectedOutcome.shouldUseGeometry && hasDeviation) {
        const usesGeometry = deviations.deviations.some(d => 
          d.geometryDetails && d.geometryDetails.perimeter > 0
        );
        
        if (!usesGeometry) {
          console.log(`  ✗ Expected to use geometry`);
          failures.push(`${testCase.name}: Does not use geometry`);
          failed++;
          continue;
        }
      }
      
      // Check exposure ranges
      if (testCase.expectedOutcome.minExposure && deviations.totalDeviationExposureMin < testCase.expectedOutcome.minExposure) {
        console.log(`  ✗ Exposure too low: $${deviations.totalDeviationExposureMin} (expected min $${testCase.expectedOutcome.minExposure})`);
        failures.push(`${testCase.name}: Exposure calculation incorrect`);
        failed++;
        continue;
      }
      
      // Log results
      console.log(`  ✓ PASS`);
      if (hasDeviation) {
        console.log(`    Deviations: ${deviations.deviations.length}`);
        console.log(`    Exposure: $${deviations.totalDeviationExposureMin.toLocaleString()} - $${deviations.totalDeviationExposureMax.toLocaleString()}`);
        
        if (deviations.auditTrail.avgCeilingHeight > 0) {
          console.log(`    Avg Ceiling Height: ${deviations.auditTrail.avgCeilingHeight} ft`);
        }
        
        for (const dev of deviations.deviations) {
          console.log(`    - ${dev.issue}`);
          console.log(`      Calculation: ${dev.calculation}`);
          
          if (dev.geometryDetails) {
            console.log(`      Geometry: Perimeter ${dev.geometryDetails.perimeter.toFixed(0)} LF, Height ${dev.geometryDetails.reportHeight} ft`);
          }
        }
      }
      
      passed++;
      
    } catch (error: any) {
      console.log(`  ✗ FAIL: ${error.message}`);
      failures.push(`${testCase.name}: ${error.message}`);
      failed++;
    }
  }
  
  // ========================================
  // SUMMARY
  // ========================================
  console.log('\n' + '='.repeat(80));
  console.log('EDGE CASE TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total: ${TEST_CASES.length}`);
  console.log(`Passed: ${passed} ✓`);
  console.log(`Failed: ${failed} ✗`);
  console.log(`Success Rate: ${((passed / TEST_CASES.length) * 100).toFixed(1)}%`);
  
  if (failures.length > 0) {
    console.log('\nFailures:');
    for (const failure of failures) {
      console.log(`  - ${failure}`);
    }
  }
  
  console.log('='.repeat(80));
  
  return {
    passed,
    failed,
    total: TEST_CASES.length,
    failures
  };
}

// Run if executed directly
if (require.main === module) {
  runEdgeCaseTests().then(results => {
    process.exit(results.failed === 0 ? 0 : 1);
  });
}
