/**
 * PREMIUM SAFETY TEST SUITE
 * Tests all premium features including Xactimate parsing and determinism
 * Run this to verify system safety and determinism
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.URL || 'http://localhost:8888';

// Test cases for premium system
const PREMIUM_TESTS = [
  {
    name: 'Valid Xactimate Property Estimate',
    endpoint: 'analyze-estimate-premium',
    data: {
      estimateText: `Living Room - Water Damage
DRY - Remove damaged drywall - 120.00 SF
DRY - Install new 1/2" drywall - 120.00 SF
PNT - Seal and prime walls - 120.00 SF
PNT - Paint walls (2 coats) - 120.00 SF
FLR - Remove damaged carpet - 200.00 SF
FLR - Install new carpet with pad - 200.00 SF
TRM - Replace baseboard - 40.00 LF`,
      metadata: {
        estimateType: 'PROPERTY',
        damageType: 'WATER'
      }
    },
    shouldPass: true,
    checkDeterminism: true
  },
  
  {
    name: 'Valid Xactimate Fire Estimate',
    endpoint: 'analyze-estimate-premium',
    data: {
      estimateText: `Kitchen - Fire Damage
DRY - Remove fire damaged drywall - 200.00 SF
DRY - Install new drywall - 200.00 SF
PNT - Seal smoke damage - 200.00 SF
PNT - Paint walls and ceiling - 200.00 SF
CLN - Clean soot from surfaces - 300.00 SF
CAB - Remove damaged cabinets - 15.00 LF
CAB - Install new cabinets - 15.00 LF
FLR - Remove burned flooring - 150.00 SF
FLR - Install new flooring - 150.00 SF`,
      metadata: {
        estimateType: 'PROPERTY',
        damageType: 'FIRE'
      }
    },
    shouldPass: true,
    checkDeterminism: true
  },
  
  {
    name: 'Xactimate with Zero Quantities (Should Detect)',
    endpoint: 'analyze-estimate-premium',
    data: {
      estimateText: `Bedroom
DRY - Remove drywall - 100.00 SF
DRY - Install drywall - 100.00 SF
PNT - Seal walls - 0.00 SF
PNT - Paint walls - 100.00 SF`,
      metadata: {
        estimateType: 'PROPERTY',
        damageType: 'WATER'
      }
    },
    shouldPass: true,
    expectIntegrityIssues: true
  },
  
  {
    name: 'Xactimate with Removal Without Replacement',
    endpoint: 'analyze-estimate-premium',
    data: {
      estimateText: `Bathroom
FLR - Remove damaged tile - 50.00 SF
DRY - Remove drywall - 80.00 SF
DRY - Install drywall - 80.00 SF
PNT - Paint walls - 80.00 SF`,
      metadata: {
        estimateType: 'PROPERTY',
        damageType: 'WATER'
      }
    },
    shouldPass: true,
    expectIntegrityIssues: true
  },
  
  {
    name: 'Non-Xactimate Document (Should Fail)',
    endpoint: 'analyze-estimate-premium',
    data: {
      estimateText: `This is a policy document explaining coverage for water damage.
Your policy includes coverage for sudden and accidental water damage.
Deductible applies. Please review your policy for exclusions.`,
      metadata: {
        estimateType: 'PROPERTY',
        damageType: 'WATER'
      }
    },
    shouldPass: false,
    expectedError: 'parsing failed'
  },
  
  {
    name: 'Prohibited Language in Line Items (Should Fail)',
    endpoint: 'analyze-estimate-premium',
    data: {
      estimateText: `Living Room
DRY - Remove drywall - they should be paid for this - 100.00 SF
PNT - Paint walls - carrier must pay - 100.00 SF`,
      metadata: {
        estimateType: 'PROPERTY',
        damageType: 'WATER'
      }
    },
    shouldPass: false,
    expectedError: 'Prohibited'
  },
  
  {
    name: 'Ambiguous Document (Should Fail)',
    endpoint: 'analyze-estimate-premium',
    data: {
      estimateText: `Some work needs to be done.
Fix the damage.
Replace broken items.
Clean up the mess.`,
      metadata: {
        estimateType: 'PROPERTY',
        damageType: 'WATER'
      }
    },
    shouldPass: false,
    expectedError: 'parsing failed'
  },
  
  {
    name: 'Xactimate Parser Direct Test - Valid',
    endpoint: 'xactimate-parser',
    data: {
      text: `DRY - Remove drywall - 100.00 SF
DRY - Install drywall - 100.00 SF
PNT - Paint walls - 100.00 SF`
    },
    shouldPass: true
  },
  
  {
    name: 'Xactimate Parser Direct Test - Invalid',
    endpoint: 'xactimate-parser',
    data: {
      text: `Lorem ipsum dolor sit amet
consectetur adipiscing elit
sed do eiusmod tempor`
    },
    shouldPass: false
  },
  
  {
    name: 'Loss Expectations Test - Water',
    endpoint: 'loss-expectations',
    data: {
      detectedTrades: [
        { code: 'DRY', name: 'Drywall' },
        { code: 'PNT', name: 'Painting' },
        { code: 'FLR', name: 'Flooring' }
      ],
      lossType: 'WATER'
    },
    shouldPass: true
  },
  
  {
    name: 'Integrity Checks Test - Zero Quantity',
    endpoint: 'estimate-integrity-checks',
    data: {
      lineItems: [
        {
          lineNumber: 1,
          trade: 'DRY',
          tradeName: 'Drywall',
          description: 'Remove drywall',
          quantity: 100,
          unit: 'SF',
          isZeroQuantity: false
        },
        {
          lineNumber: 2,
          trade: 'PNT',
          tradeName: 'Painting',
          description: 'Paint walls',
          quantity: 0,
          unit: 'SF',
          isZeroQuantity: true
        }
      ]
    },
    shouldPass: true,
    expectIntegrityIssues: true
  }
];

// Helper to call function
function callFunction(endpoint, data) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}/.netlify/functions/${endpoint}`;
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            data: JSON.parse(body)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(data));
    req.end();
  });
}

// Test determinism (same input = same output)
async function testDeterminism(test) {
  console.log(`  Testing determinism...`);
  
  const results = [];
  for (let i = 0; i < 3; i++) {
    const result = await callFunction(test.endpoint, test.data);
    results.push(JSON.stringify(result.data));
  }
  
  // Check if all results are identical
  const allIdentical = results.every(r => r === results[0]);
  
  if (allIdentical) {
    console.log(`  ✅ Determinism verified (3/3 identical)`);
    return true;
  } else {
    console.log(`  ❌ Determinism FAILED (outputs differ)`);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('🧪 ESTIMATE REVIEW PRO - PREMIUM SAFETY TEST SUITE\n');
  console.log(`Testing against: ${BASE_URL}\n`);
  console.log('═'.repeat(80));
  
  let passed = 0;
  let failed = 0;
  let determinismPassed = 0;
  let determinismFailed = 0;
  
  for (const test of PREMIUM_TESTS) {
    try {
      console.log(`\n${test.name}`);
      
      const result = await callFunction(test.endpoint, test.data);
      
      const success = result.statusCode === 200;
      const testPassed = success === test.shouldPass;
      
      // Check for expected error
      if (!test.shouldPass && test.expectedError) {
        const errorMatches = JSON.stringify(result.data).toLowerCase()
          .includes(test.expectedError.toLowerCase());
        if (!errorMatches) {
          console.log(`  ❌ Expected error containing: "${test.expectedError}"`);
          console.log(`  Got: ${JSON.stringify(result.data).substring(0, 100)}`);
          failed++;
          continue;
        }
      }
      
      // Check for expected integrity issues
      if (test.expectIntegrityIssues && success) {
        const hasIssues = result.data.analysis?.integrityFindings?.length > 0 ||
                         result.data.totalFindings > 0;
        if (!hasIssues) {
          console.log(`  ❌ Expected integrity issues but none found`);
          failed++;
          continue;
        } else {
          console.log(`  ✅ Integrity issues detected as expected`);
        }
      }
      
      if (testPassed) {
        console.log(`  ✅ Test passed (${result.statusCode})`);
        passed++;
        
        // Test determinism if requested
        if (test.checkDeterminism) {
          const deterministicResult = await testDeterminism(test);
          if (deterministicResult) {
            determinismPassed++;
          } else {
            determinismFailed++;
          }
        }
      } else {
        console.log(`  ❌ Test failed`);
        console.log(`  Expected: ${test.shouldPass ? 'PASS' : 'FAIL'}`);
        console.log(`  Got: ${success ? 'PASS' : 'FAIL'} (${result.statusCode})`);
        console.log(`  Response: ${JSON.stringify(result.data).substring(0, 150)}`);
        failed++;
      }
      
    } catch (error) {
      console.log(`  ❌ ${test.name}`);
      console.log(`  Error: ${error.message}`);
      failed++;
    }
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log(`\n📊 Results:`);
  console.log(`  Tests: ${passed} passed, ${failed} failed out of ${PREMIUM_TESTS.length} tests`);
  console.log(`  Determinism: ${determinismPassed} passed, ${determinismFailed} failed\n`);
  
  if (failed === 0 && determinismFailed === 0) {
    console.log('🎉 All premium safety tests passed! System is properly guarded and deterministic.\n');
  } else {
    console.log('⚠️  Some tests failed. Review guardrails and fix issues.\n');
  }
  
  return failed === 0 && determinismFailed === 0;
}

// Export for Netlify function
exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Capture console output
    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => {
      logs.push(args.join(' '));
      originalLog(...args);
    };

    const success = await runTests();

    console.log = originalLog;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success,
        logs,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Test suite error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Test suite failed',
        message: error.message
      })
    };
  }
};

// Allow running directly with Node
if (require.main === module) {
  runTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}


