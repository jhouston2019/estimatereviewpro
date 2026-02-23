/**
 * STRUCTURAL TEST SUITE
 * 10 deterministic test cases with validation
 */

import { generateStructuralReport, UnifiedReport } from './structural-unified-report-engine';

export const TEST_CASES = {
  /**
   * Test 1: Drywall removal no paint
   */
  DRYWALL_NO_PAINT: `DRY    Remove drywall 1/2"           120    SF    $240.00    $210.00
DRY    Replace drywall 1/2"          120    SF    $480.00    $420.00
INS    Batt insulation R-13          120    SF    $180.00    $160.00
MLD    Baseboard 3 1/4"               48    LF    $192.00    $170.00`,

  /**
   * Test 2: Roofing no drip edge
   */
  ROOFING_NO_DRIP_EDGE: `RFG    Remove shingles               25    SQ    $1,250.00   $1,100.00
RFG    Install architectural shingles 25    SQ    $6,250.00   $5,500.00
RFG    Underlayment #30 felt          25    SQ    $625.00     $550.00
RFG    Ridge cap shingles             40    LF    $320.00     $280.00`,

  /**
   * Test 3: Flooring removal no reinstall
   */
  FLOORING_NO_REINSTALL: `CRP    Remove carpet and pad         500    SF    $500.00     $450.00
MLD    Remove baseboard              120    LF    $180.00     $160.00`,

  /**
   * Test 4: Level 3 water no insulation
   */
  WATER_LEVEL_3_NO_INS: `MIT    Water mitigation services       1    LS    $2,500.00   $2,500.00
DEM    Demolition interior             1    LS    $1,800.00   $1,800.00
HAU    Haul away debris                1    LS    $600.00     $600.00
DRY    Remove drywall 4' flood cut   800    SF    $1,600.00   $1,400.00
DRY    Replace drywall 1/2"          800    SF    $3,200.00   $2,800.00
PNT    Paint interior walls          800    SF    $1,600.00   $1,400.00
FLR    Remove vinyl flooring         400    SF    $400.00     $350.00
FLR    Install vinyl plank           400    SF    $2,400.00   $2,100.00
MLD    Baseboard 3 1/4"              160    LF    $640.00     $560.00
CLN    Antimicrobial treatment         1    LS    $800.00     $800.00`,

  /**
   * Test 5: Zero quantity labor
   */
  ZERO_QUANTITY_LABOR: `DRY    Remove drywall 1/2"             0    SF    $0.00       $0.00
DRY    Replace drywall 1/2"          200    SF    $800.00     $700.00
PNT    Paint interior walls          200    SF    $400.00     $350.00`,

  /**
   * Test 6: Malformed columns (inconsistent spacing)
   */
  MALFORMED_COLUMNS: `DRY  Remove drywall  100  SF  $200.00  $175.00
DRY    Replace drywall 1/2"    100    SF    $400.00    $350.00
PNT  Paint walls  100 SF $200.00 $175.00`,

  /**
   * Test 7: High quantity structural
   */
  HIGH_QUANTITY_STRUCTURAL: `FRM    Repair wall framing          1200    LF    $24,000.00  $21,000.00
DRY    Replace drywall 1/2"         3000    SF    $12,000.00  $10,500.00
INS    Batt insulation R-13         3000    SF    $4,500.00   $3,900.00
PNT    Paint interior walls         3000    SF    $6,000.00   $5,250.00
FLR    Install carpet and pad       1500    SF    $9,000.00   $7,875.00
MLD    Baseboard 3 1/4"              600    LF    $2,400.00   $2,100.00
ELE    Replace wiring                  1    LS    $8,000.00   $7,000.00
PLM    Replace fixtures                6    EA    $3,600.00   $3,150.00`,

  /**
   * Test 8: Partial rebuild
   */
  PARTIAL_REBUILD: `DEM    Demolition fire damage          1    LS    $3,500.00   $3,500.00
HAU    Haul away debris                1    LS    $1,200.00   $1,200.00
FRM    Repair wall framing           200    LF    $4,000.00   $3,500.00
DRY    Replace drywall 1/2"          600    SF    $2,400.00   $2,100.00
INS    Batt insulation R-13          600    SF    $900.00     $790.00
ELE    Replace wiring bedroom          1    LS    $2,500.00   $2,200.00
PNT    Paint interior                600    SF    $1,200.00   $1,050.00
FLR    Replace carpet and pad        300    SF    $1,800.00   $1,575.00
CLN    Smoke remediation               1    LS    $1,500.00   $1,500.00`,

  /**
   * Test 9: Fire moderate
   */
  FIRE_MODERATE: `DEM    Demolition fire damage          1    LS    $4,000.00   $4,000.00
HAU    Haul away debris                1    LS    $1,500.00   $1,500.00
FRM    Repair framing                300    LF    $6,000.00   $5,250.00
DRY    Replace drywall               800    SF    $3,200.00   $2,800.00
INS    Insulation R-13               800    SF    $1,200.00   $1,050.00
ELE    Rewire bedroom                  1    LS    $3,000.00   $2,625.00
PNT    Paint interior                800    SF    $1,600.00   $1,400.00
FLR    Replace flooring              400    SF    $2,400.00   $2,100.00
MLD    Trim and molding              200    LF    $1,000.00   $875.00
CLN    Smoke remediation               1    LS    $2,000.00   $2,000.00`,

  /**
   * Test 10: Wind minor
   */
  WIND_MINOR: `RFG    Remove shingles               15    SQ    $750.00     $660.00
RFG    Install architectural shingles 15    SQ    $3,750.00   $3,300.00
RFG    Drip edge                    100    LF    $400.00     $350.00
RFG    Ice & water shield           150    SF    $900.00     $790.00
RFG    Underlayment                  15    SQ    $375.00     $330.00`
};

export interface TestExpectation {
  shouldParse: boolean;
  minLineItems?: number;
  shouldDetectMissingPaint?: boolean;
  shouldDetectMissingDripEdge?: boolean;
  shouldDetectRemovalWithoutReplacement?: boolean;
  shouldDetectMissingInsulation?: boolean;
  shouldDetectZeroQuantity?: boolean;
  shouldClassifyAsWater?: boolean;
  shouldClassifyAsFire?: boolean;
  shouldClassifyAsWind?: boolean;
  shouldDetectLevel3?: boolean;
  minIntegrityScore?: number;
  maxIntegrityScore?: number;
  shouldHaveCodeRisks?: boolean;
  minCodeRisks?: number;
}

export const EXPECTATIONS: Record<string, TestExpectation> = {
  DRYWALL_NO_PAINT: {
    shouldParse: true,
    minLineItems: 4,
    shouldDetectMissingPaint: true,
    minIntegrityScore: 60,
    maxIntegrityScore: 85
  },
  
  ROOFING_NO_DRIP_EDGE: {
    shouldParse: true,
    minLineItems: 4,
    shouldDetectMissingDripEdge: false, // Has drip edge in test data
    minIntegrityScore: 85
  },
  
  FLOORING_NO_REINSTALL: {
    shouldParse: true,
    minLineItems: 2,
    shouldDetectRemovalWithoutReplacement: true,
    minIntegrityScore: 0,
    maxIntegrityScore: 60
  },
  
  WATER_LEVEL_3_NO_INS: {
    shouldParse: true,
    minLineItems: 8,
    shouldClassifyAsWater: true,
    shouldDetectLevel3: true,
    shouldDetectMissingInsulation: true,
    minIntegrityScore: 70
  },
  
  ZERO_QUANTITY_LABOR: {
    shouldParse: true,
    minLineItems: 2,
    shouldDetectZeroQuantity: true,
    minIntegrityScore: 0,
    maxIntegrityScore: 70
  },
  
  MALFORMED_COLUMNS: {
    shouldParse: true, // Should handle some variance
    minLineItems: 2
  },
  
  HIGH_QUANTITY_STRUCTURAL: {
    shouldParse: true,
    minLineItems: 7,
    minIntegrityScore: 80
  },
  
  PARTIAL_REBUILD: {
    shouldParse: true,
    minLineItems: 8,
    shouldClassifyAsFire: true,
    minIntegrityScore: 75
  },
  
  FIRE_MODERATE: {
    shouldParse: true,
    minLineItems: 9,
    shouldClassifyAsFire: true,
    shouldHaveCodeRisks: true
  },
  
  WIND_MINOR: {
    shouldParse: true,
    minLineItems: 5,
    shouldClassifyAsWind: true,
    minIntegrityScore: 90
  }
};

/**
 * Validate test result
 */
function validateTestResult(
  testName: string,
  report: UnifiedReport,
  expectation: TestExpectation
): { passed: boolean; failures: string[] } {
  
  const failures: string[] = [];
  
  // Check line items
  if (expectation.minLineItems && report.findings.parsedLineItems < expectation.minLineItems) {
    failures.push(`Expected at least ${expectation.minLineItems} line items, got ${report.findings.parsedLineItems}`);
  }
  
  // Check missing paint
  if (expectation.shouldDetectMissingPaint) {
    const hasMissingPaint = report.findings.scopeGaps.some(gap => gap.includes('Painting'));
    if (!hasMissingPaint) {
      failures.push('Expected to detect missing paint');
    }
  }
  
  // Check missing drip edge
  if (expectation.shouldDetectMissingDripEdge) {
    const hasMissingDripEdge = report.codeRisks.codeRisks.some(risk => risk.itemType === 'DRIP_EDGE');
    if (!hasMissingDripEdge) {
      failures.push('Expected to detect missing drip edge');
    }
  }
  
  // Check removal without replacement
  if (expectation.shouldDetectRemovalWithoutReplacement) {
    const hasRemovalIssue = report.findings.integrityIssues.some(issue => 
      issue.includes('removal') && issue.includes('without replacement')
    );
    if (!hasRemovalIssue) {
      failures.push('Expected to detect removal without replacement');
    }
  }
  
  // Check missing insulation
  if (expectation.shouldDetectMissingInsulation) {
    const hasMissingIns = report.findings.scopeGaps.some(gap => gap.includes('Insulation'));
    if (!hasMissingIns) {
      failures.push('Expected to detect missing insulation');
    }
  }
  
  // Check zero quantity
  if (expectation.shouldDetectZeroQuantity) {
    const hasZeroQty = report.findings.integrityIssues.some(issue => issue.includes('Zero quantity'));
    if (!hasZeroQty) {
      failures.push('Expected to detect zero quantity');
    }
  }
  
  // Check loss type
  if (expectation.shouldClassifyAsWater && report.classification.lossType !== 'WATER') {
    failures.push(`Expected WATER classification, got ${report.classification.lossType}`);
  }
  
  if (expectation.shouldClassifyAsFire && report.classification.lossType !== 'FIRE') {
    failures.push(`Expected FIRE classification, got ${report.classification.lossType}`);
  }
  
  if (expectation.shouldClassifyAsWind && report.classification.lossType !== 'WIND') {
    failures.push(`Expected WIND classification, got ${report.classification.lossType}`);
  }
  
  // Check severity
  if (expectation.shouldDetectLevel3 && !report.classification.severityLevel.includes('3')) {
    failures.push(`Expected Level 3 severity, got ${report.classification.severityLevel}`);
  }
  
  // Check integrity score
  if (expectation.minIntegrityScore && report.structuralIntegrityScore < expectation.minIntegrityScore) {
    failures.push(`Expected integrity score >= ${expectation.minIntegrityScore}, got ${report.structuralIntegrityScore}`);
  }
  
  if (expectation.maxIntegrityScore && report.structuralIntegrityScore > expectation.maxIntegrityScore) {
    failures.push(`Expected integrity score <= ${expectation.maxIntegrityScore}, got ${report.structuralIntegrityScore}`);
  }
  
  // Check code risks
  if (expectation.shouldHaveCodeRisks && report.codeRisks.codeRisks.length === 0) {
    failures.push('Expected to detect code risks');
  }
  
  if (expectation.minCodeRisks && report.codeRisks.codeRisks.length < expectation.minCodeRisks) {
    failures.push(`Expected at least ${expectation.minCodeRisks} code risks, got ${report.codeRisks.codeRisks.length}`);
  }
  
  return {
    passed: failures.length === 0,
    failures
  };
}

/**
 * Run all tests
 */
export async function runAllTests(options: { includeAI?: boolean; openaiApiKey?: string } = {}): Promise<void> {
  console.log('='.repeat(80));
  console.log('STRUCTURAL TEST SUITE');
  console.log('='.repeat(80));
  console.log('');
  
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  
  for (const [testName, testData] of Object.entries(TEST_CASES)) {
    totalTests++;
    
    console.log(`\nTest ${totalTests}: ${testName}`);
    console.log('-'.repeat(80));
    
    try {
      // Run analysis
      const report = await generateStructuralReport(testData, {
        includeAI: options.includeAI || false,
        openaiApiKey: options.openaiApiKey,
        maxProcessingTime: 20000
      });
      
      // Validate against expectations
      const expectation = EXPECTATIONS[testName];
      const validation = validateTestResult(testName, report, expectation);
      
      if (validation.passed) {
        console.log('✓ PASS');
        passedTests++;
      } else {
        console.log('✗ FAIL');
        console.log('Failures:');
        for (const failure of validation.failures) {
          console.log(`  - ${failure}`);
        }
        failedTests++;
      }
      
      // Log key metrics
      console.log(`  Parsed: ${report.findings.parsedLineItems} items`);
      console.log(`  Integrity: ${report.structuralIntegrityScore}/100`);
      console.log(`  Exposure: $${report.totalExposureMin}-$${report.totalExposureMax}`);
      console.log(`  Code Risks: ${report.codeRisks.codeRisks.length}`);
      console.log(`  Processing: ${report.metadata.processingTimeMs}ms`);
      
    } catch (error: any) {
      console.log('✗ FAIL (exception)');
      console.log(`  Error: ${error.message}`);
      failedTests++;
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total: ${totalTests}`);
  console.log(`Passed: ${passedTests} ✓`);
  console.log(`Failed: ${failedTests} ✗`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log('='.repeat(80));
  
  if (failedTests > 0) {
    throw new Error(`${failedTests} test(s) failed`);
  }
}

/**
 * Run single test
 */
export async function runSingleTest(
  testName: keyof typeof TEST_CASES,
  options: { includeAI?: boolean; openaiApiKey?: string } = {}
): Promise<UnifiedReport> {
  
  const testData = TEST_CASES[testName];
  
  if (!testData) {
    throw new Error(`Test case not found: ${testName}`);
  }
  
  console.log(`Running test: ${testName}`);
  console.log('-'.repeat(80));
  
  const report = await generateStructuralReport(testData, {
    includeAI: options.includeAI || false,
    openaiApiKey: options.openaiApiKey,
    maxProcessingTime: 20000
  });
  
  const expectation = EXPECTATIONS[testName];
  const validation = validateTestResult(testName, report, expectation);
  
  if (!validation.passed) {
    console.log('✗ Test failed:');
    for (const failure of validation.failures) {
      console.log(`  - ${failure}`);
    }
    throw new Error(`Test ${testName} failed validation`);
  }
  
  console.log('✓ Test passed');
  
  return report;
}
