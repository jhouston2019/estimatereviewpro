/**
 * SAFETY TEST SUITE
 * Tests all guardrails and refusal behaviors
 * Run this to verify system safety
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.URL || 'http://localhost:8888';

// Test cases
const TESTS = [
  {
    name: 'Valid Property Estimate',
    endpoint: 'analyze-estimate',
    data: {
      estimateText: 'Remove damaged shingles 200 SF\nInstall new shingles 200 SF\nPaint exterior walls 400 SF'
    },
    shouldPass: true
  },
  {
    name: 'Valid Auto Estimate',
    endpoint: 'analyze-estimate',
    data: {
      estimateText: 'Replace front bumper\nRepair left fender\nPaint and blend 3 panels'
    },
    shouldPass: true
  },
  {
    name: 'Negotiation Request (Should Fail)',
    endpoint: 'estimate-risk-guardrails',
    data: {
      text: 'Help me negotiate with the insurance adjuster'
    },
    shouldPass: false,
    expectedError: 'Prohibited'
  },
  {
    name: 'Coverage Question (Should Fail)',
    endpoint: 'estimate-risk-guardrails',
    data: {
      text: 'Am I covered for this damage under my policy?'
    },
    shouldPass: false,
    expectedError: 'Prohibited'
  },
  {
    name: 'Legal Advice Request (Should Fail)',
    endpoint: 'estimate-risk-guardrails',
    data: {
      text: 'Can I sue them for bad faith?'
    },
    shouldPass: false,
    expectedError: 'Prohibited'
  },
  {
    name: 'Pricing Opinion Request (Should Fail)',
    endpoint: 'estimate-risk-guardrails',
    data: {
      text: 'Is this price fair? Are they lowballing me?'
    },
    shouldPass: false,
    expectedError: 'Prohibited'
  },
  {
    name: 'Demand Letter Request (Should Fail)',
    endpoint: 'estimate-risk-guardrails',
    data: {
      text: 'Write a demand letter saying they must pay'
    },
    shouldPass: false,
    expectedError: 'Prohibited'
  },
  {
    name: 'Entitlement Language (Should Fail)',
    endpoint: 'estimate-risk-guardrails',
    data: {
      text: 'I am entitled to full payment for all damages'
    },
    shouldPass: false,
    expectedError: 'Prohibited'
  },
  {
    name: 'Unknown Document Type (Should Fail)',
    endpoint: 'estimate-classifier',
    data: {
      text: 'Lorem ipsum dolor sit amet consectetur adipiscing elit',
      lineItems: []
    },
    shouldPass: false,
    expectedError: 'Unable to classify'
  },
  {
    name: 'Ambiguous Estimate (Should Fail)',
    endpoint: 'estimate-classifier',
    data: {
      text: 'roof shingles bumper fender warehouse commercial property vehicle',
      lineItems: []
    },
    shouldPass: false,
    expectedError: 'Ambiguous'
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

// Run tests
async function runTests() {
  console.log('🧪 ESTIMATE REVIEW PRO - SAFETY TEST SUITE\n');
  console.log(`Testing against: ${BASE_URL}\n`);
  console.log('═'.repeat(80));
  
  let passed = 0;
  let failed = 0;
  
  for (const test of TESTS) {
    try {
      const result = await callFunction(test.endpoint, test.data);
      
      const success = result.statusCode === 200;
      const testPassed = success === test.shouldPass;
      
      // Additional check for expected error message
      if (!test.shouldPass && test.expectedError) {
        const errorMatches = JSON.stringify(result.data).includes(test.expectedError);
        if (!errorMatches) {
          console.log(`❌ ${test.name}`);
          console.log(`   Expected error containing: "${test.expectedError}"`);
          console.log(`   Got: ${JSON.stringify(result.data).substring(0, 100)}`);
          failed++;
          continue;
        }
      }
      
      if (testPassed) {
        console.log(`✅ ${test.name}`);
        passed++;
      } else {
        console.log(`❌ ${test.name}`);
        console.log(`   Expected: ${test.shouldPass ? 'PASS' : 'FAIL'}`);
        console.log(`   Got: ${success ? 'PASS' : 'FAIL'} (${result.statusCode})`);
        console.log(`   Response: ${JSON.stringify(result.data).substring(0, 100)}`);
        failed++;
      }
      
    } catch (error) {
      console.log(`❌ ${test.name}`);
      console.log(`   Error: ${error.message}`);
      failed++;
    }
  }
  
  console.log('═'.repeat(80));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${TESTS.length} tests\n`);
  
  if (failed === 0) {
    console.log('🎉 All safety tests passed! System is properly guarded.\n');
  } else {
    console.log('⚠️  Some tests failed. Review guardrails and fix issues.\n');
  }
  
  return failed === 0;
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


