/**
 * ANALYZE ESTIMATE - PREMIUM ORCHESTRATOR
 * Expert-grade Xactimate-aware estimate analysis engine
 * 100% Deterministic - Same input = Same output
 * Temperature: 0.0
 */

const https = require('https');

// Helper function to call other Netlify functions
async function callFunction(functionName, data) {
  const baseUrl = process.env.URL || 'http://localhost:8888';
  const url = `${baseUrl}/.netlify/functions/${functionName}`;
  
  return new Promise((resolve, reject) => {
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

    const req = (urlObj.protocol === 'https:' ? https : require('http')).request(options, (res) => {
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

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse request body
    const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';
    let estimateText, metadata;

    if (contentType.includes('application/json')) {
      const body = JSON.parse(event.body);
      estimateText = body.estimateText || body.text;
      metadata = body.metadata || {};
    } else {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Invalid content type',
          message: 'Send JSON with estimateText field'
        })
      };
    }

    if (!estimateText) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Missing required data',
          message: 'Provide estimateText field'
        })
      };
    }

    // STEP 1: Run guardrails check (CRITICAL - includes lineItems)
    console.log('Step 1: Running guardrails check...');
    const guardrailsResult = await callFunction('estimate-risk-guardrails', {
      text: estimateText,
      userInput: '',  // No free-form user input in premium version
      lineItems: []   // Will be populated after parsing
    });

    if (guardrailsResult.statusCode !== 200) {
      return {
        statusCode: guardrailsResult.statusCode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Guardrails check failed',
          details: guardrailsResult.data
        })
      };
    }

    // STEP 2: Parse with Xactimate parser (NEW)
    console.log('Step 2: Parsing estimate with Xactimate parser...');
    const parseResult = await callFunction('xactimate-parser', {
      text: estimateText
    });

    if (parseResult.statusCode !== 200) {
      return {
        statusCode: parseResult.statusCode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Document parsing failed',
          details: parseResult.data,
          message: 'This document does not match Xactimate format with sufficient confidence. Please submit a properly formatted insurance estimate.'
        })
      };
    }

    const parsedData = parseResult.data;
    const lineItems = parsedData.lineItems || [];
    const tradesDetected = parsedData.tradesDetected || [];

    // STEP 3: Run guardrails on parsed line items (CRITICAL FIX)
    console.log('Step 3: Running guardrails on parsed line items...');
    const lineItemTexts = lineItems.map(item => item.rawLine || item.description);
    const lineItemGuardrails = await callFunction('estimate-risk-guardrails', {
      text: '',
      userInput: '',
      lineItems: lineItemTexts
    });

    if (lineItemGuardrails.statusCode !== 200) {
      return {
        statusCode: lineItemGuardrails.statusCode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Line items contain prohibited content',
          details: lineItemGuardrails.data
        })
      };
    }

    // STEP 4: Compare against loss type expectations (NEW)
    console.log('Step 4: Comparing against loss type expectations...');
    const lossType = metadata.damageType || metadata.lossType || 'OTHER';
    const expectationsResult = await callFunction('loss-expectations', {
      detectedTrades: tradesDetected,
      lossType: lossType
    });

    const expectations = expectationsResult.statusCode === 200 ? 
      expectationsResult.data : null;

    // STEP 5: Run integrity checks (NEW)
    console.log('Step 5: Running line item integrity checks...');
    const integrityResult = await callFunction('estimate-integrity-checks', {
      lineItems: lineItems
    });

    const integrityChecks = integrityResult.statusCode === 200 ?
      integrityResult.data : null;

    // STEP 6: Format output with premium formatter
    console.log('Step 6: Formatting premium output...');
    
    // Build comprehensive analysis object
    const comprehensiveAnalysis = {
      platform: parsedData.platform,
      confidence: parsedData.confidence,
      totalLineItems: lineItems.length,
      tradesDetected: tradesDetected,
      lossType: lossType,
      
      // Expectations findings
      expectedTradesDetected: expectations?.findings?.detectedExpected || {},
      expectedTradesNotDetected: expectations?.findings?.notDetectedExpected || {},
      unexpectedTradesDetected: expectations?.findings?.detectedUnexpected || [],
      
      // Integrity findings
      integrityFindings: integrityChecks?.findings || [],
      integritySummary: integrityChecks?.summary || {},
      
      // Observations
      observations: [
        ...(expectations?.observations || []),
        ...(parsedData.integrityIssues || [])
      ]
    };

    const formattingResult = await callFunction('estimate-output-formatter', {
      analysis: comprehensiveAnalysis,
      classification: 'XACTIMATE',
      metadata: {
        ...metadata,
        platform: parsedData.platform,
        confidence: parsedData.confidence
      }
    });

    if (formattingResult.statusCode !== 200) {
      return {
        statusCode: formattingResult.statusCode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Formatting failed',
          details: formattingResult.data
        })
      };
    }

    // Return complete premium analysis
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'SUCCESS',
        version: 'PREMIUM',
        platform: parsedData.platform,
        confidence: parsedData.confidence,
        classification: {
          platform: parsedData.platform,
          confidence: parsedData.confidence,
          tradesDetected: tradesDetected.length
        },
        analysis: comprehensiveAnalysis,
        report: formattingResult.data.report,
        timestamp: new Date().toISOString(),
        disclaimer: 'This is an automated, observational estimate analysis. No coverage, pricing, or entitlement determinations are made.'
      })
    };

  } catch (error) {
    console.error('Premium analysis error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Analysis failed',
        message: error.message
      })
    };
  }
};

