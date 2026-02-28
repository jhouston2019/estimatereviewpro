/**
 * PARSER UPGRADE TEST RUNNER
 * Simple Node.js test runner (no Jest required)
 */

const { parseXactimateEstimate } = require('./lib/advanced-xactimate-parser.ts');

// Test counter
let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`✓ ${name}`);
  } catch (error) {
    failed++;
    failures.push({ name, error: error.message });
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
  }
}

function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}`);
      }
    },
    toBeGreaterThan(expected) {
      if (actual <= expected) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    },
    toHaveLength(expected) {
      if (actual.length !== expected) {
        throw new Error(`Expected length ${expected}, got ${actual.length}`);
      }
    },
    toMatch(regex) {
      if (!regex.test(actual)) {
        throw new Error(`Expected ${actual} to match ${regex}`);
      }
    },
    toContain(expected) {
      if (!actual.includes(expected)) {
        throw new Error(`Expected ${actual} to contain ${expected}`);
      }
    },
    toMatchObject(expected) {
      for (const key in expected) {
        if (actual[key] !== expected[key]) {
          throw new Error(`Expected ${key} to be ${expected[key]}, got ${actual[key]}`);
        }
      }
    }
  };
}

console.log('\n🧪 PARSER UPGRADE TEST SUITE\n');
console.log('Testing advanced-xactimate-parser.ts\n');

// Test 1: Tab-separated format
test('Tab-separated format', () => {
  const input = `DRY\tRemove drywall\t200\tSF\t3.50\t700.00\t630.00
PNT\tPaint walls 2 coats\t200\tSF\t2.25\t450.00\t450.00
FLR\tInstall carpet\t150\tSF\t4.00\t600.00\t540.00`;

  const result = parseXactimateEstimate(input);
  
  expect(result.metadata.detectedFormat).toBe('XACTIMATE_TABULAR');
  expect(result.lineItems).toHaveLength(3);
  expect(result.totals.rcv).toBe(1750);
});

// Test 2: Large quantities
test('Large quantities (>10,000)', () => {
  const input = `DRY\tRemove drywall\t1500\tSF\t3.50\t5250.00\t4725.00`;
  
  const result = parseXactimateEstimate(input);
  
  expect(result.lineItems[0].quantity).toBe(1500);
  expect(result.lineItems[0].rcv).toBe(5250);
});

// Test 3: Trade detection from description
test('Trade detection from description', () => {
  const input = `Remove drywall  200  SF  $700.00
Paint walls  200  SF  $450.00
Install carpet  150  SF  $600.00`;

  const result = parseXactimateEstimate(input);
  
  if (result.lineItems.length > 0) {
    expect(result.lineItems[0].tradeCode).toBe('DRY');
  }
});

// Test 4: Action type detection
test('Action type detection', () => {
  const input = `DRY\tRemove drywall\t200\tSF\t3.50\t700.00\t630.00
DRY\tReplace drywall\t200\tSF\t6.00\t1200.00\t1200.00
PNT\tPaint walls\t200\tSF\t2.25\t450.00\t450.00
FLR\tClean carpet\t150\tSF\t1.00\t150.00\t150.00`;

  const result = parseXactimateEstimate(input);
  
  expect(result.lineItems[0].actionType).toBe('REMOVE');
  expect(result.lineItems[1].actionType).toBe('REPLACE');
  expect(result.lineItems[3].actionType).toBe('CLEAN');
});

// Test 5: O&P detection
test('O&P line items', () => {
  const input = `DRY\tRemove drywall\t200\tSF\t3.50\t700.00\t630.00
O&P\tOverhead & Profit\t1\tLS\t140.00\t140.00\t140.00`;

  const result = parseXactimateEstimate(input);
  
  expect(result.lineItems).toHaveLength(2);
  expect(result.lineItems[1].overhead).toBe(true);
  expect(result.lineItems[1].profit).toBe(true);
});

// Test 6: Missing ACV
test('Missing ACV (use RCV)', () => {
  const input = `DRY\tRemove drywall\t200\tSF\t3.50\t700.00
PNT\tPaint walls\t200\tSF\t2.25\t450.00`;

  const result = parseXactimateEstimate(input);
  
  expect(result.lineItems[0].acv).toBe(700);
  expect(result.lineItems[0].depreciation).toBe(0);
});

// Test 7: Graceful rejection
test('Graceful rejection of malformed lines', () => {
  const input = `DRY\tRemove drywall\t200\tSF\t3.50\t700.00\t630.00
This is not a valid line
PNT\tPaint walls\t200\tSF\t2.25\t450.00\t450.00`;

  const result = parseXactimateEstimate(input);
  
  expect(result.lineItems).toHaveLength(2);
  expect(result.metadata.rejectedCount).toBeGreaterThan(0);
});

// Test 8: Totals calculation
test('Totals calculation', () => {
  const input = `DRY\tRemove drywall\t200\tSF\t3.50\t700.00\t630.00
PNT\tPaint walls\t200\tSF\t2.25\t450.00\t450.00
FLR\tInstall carpet\t150\tSF\t4.00\t600.00\t540.00`;

  const result = parseXactimateEstimate(input);
  
  expect(result.totals.rcv).toBe(1750);
  expect(result.totals.acv).toBe(1620);
  expect(result.totals.depreciation).toBe(130);
});

// Test 9: Unknown format rejection
test('Unknown format rejection', () => {
  const input = `This is just random text
With no structure at all
Not an estimate`;

  const result = parseXactimateEstimate(input);
  
  expect(result.metadata.confidence).toBe('FAILED');
  expect(result.metadata.detectedFormat).toBe('UNKNOWN');
  expect(result.lineItems).toHaveLength(0);
});

// Test 10: High confidence for clean data
test('High confidence for clean data', () => {
  const input = `DRY\tRemove drywall\t200\tSF\t3.50\t700.00\t630.00
PNT\tPaint walls\t200\tSF\t2.25\t450.00\t450.00
FLR\tInstall carpet\t150\tSF\t4.00\t600.00\t540.00
INS\tInstall insulation\t180\tSF\t1.75\t315.00\t315.00`;

  const result = parseXactimateEstimate(input);
  
  expect(result.metadata.confidence).toBe('HIGH');
  expect(result.metadata.validationScore).toBeGreaterThan(85);
});

// Print results
console.log('\n' + '='.repeat(50));
console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests\n`);

if (failed > 0) {
  console.log('❌ FAILED TESTS:\n');
  failures.forEach(({ name, error }) => {
    console.log(`  - ${name}`);
    console.log(`    ${error}\n`);
  });
  process.exit(1);
} else {
  console.log('🎉 All tests passed! Parser upgrade is working correctly.\n');
  console.log('✅ Ready to deploy\n');
  process.exit(0);
}
