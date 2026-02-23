/**
 * REAL TEST RUNNER
 * Tests the actual parsing and exposure engines
 */

const { parseXactimateEstimate } = require('./lib/xactimate-parser.ts');
const { calculateExposure } = require('./lib/exposure-engine.ts');

// Test Case 1: Drywall without paint
const TEST_DRYWALL_NO_PAINT = `
DRY    Remove drywall 1/2"           120    SF    $240.00    $210.00
DRY    Replace drywall 1/2"          120    SF    $480.00    $420.00
INS    Batt insulation R-13          120    SF    $180.00    $160.00
MLD    Baseboard 3 1/4"               48    LF    $192.00    $170.00
`;

console.log('='.repeat(80));
console.log('TEST 1: Drywall without paint');
console.log('='.repeat(80));

try {
  const parsed = parseXactimateEstimate(TEST_DRYWALL_NO_PAINT);
  console.log('\nParsed Line Items:', parsed.lineItems.length);
  console.log('Confidence:', parsed.metadata.confidence);
  console.log('Validation Score:', parsed.metadata.validationScore);
  
  console.log('\nLine Items:');
  parsed.lineItems.forEach(item => {
    console.log(`  ${item.tradeCode} - ${item.description}`);
    console.log(`    Qty: ${item.quantity} ${item.unit}, RCV: $${item.rcv}, ACV: $${item.acv}`);
    console.log(`    Action: ${item.actionType}`);
  });
  
  console.log('\nTotals:');
  console.log(`  RCV: $${parsed.totals.rcv}`);
  console.log(`  ACV: $${parsed.totals.acv}`);
  
  const exposure = calculateExposure(parsed);
  console.log('\nExposure Analysis:');
  console.log(`  Total Exposure: $${exposure.totalExposureMin} - $${exposure.totalExposureMax}`);
  console.log(`  Risk Score: ${exposure.riskScore}/100`);
  console.log(`  Items Found: ${exposure.exposureItems.length}`);
  
  exposure.exposureItems.forEach(item => {
    console.log(`\n  Missing: ${item.missingTradeName}`);
    console.log(`    Reason: ${item.reason}`);
    console.log(`    Exposure: $${item.estimatedExposureMin} - $${item.estimatedExposureMax}`);
    console.log(`    Severity: ${item.severity}`);
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('TEST RESULT: ' + (exposure.exposureItems.length > 0 ? 'PASS ✓' : 'FAIL ✗'));
  console.log('Expected: Should detect missing paint');
  console.log('Actual: ' + (exposure.exposureItems.some(e => e.missingTrade === 'PNT') ? 'Detected missing paint ✓' : 'Did not detect ✗'));
  console.log('='.repeat(80));
  
} catch (error) {
  console.error('TEST FAILED:', error.message);
  console.error(error.stack);
}
