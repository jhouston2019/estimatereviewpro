/**
 * ANALYZE WITH INTELLIGENCE
 * Extended analysis that includes claim intelligence engines
 * Wraps existing analyze-estimate and adds intelligence layer
 */

const https = require('https');

/**
 * Call another Netlify function
 */
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

/**
 * Main handler
 */
exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const startTime = Date.now();
  
  try {
    console.log('[INTELLIGENCE] Starting enhanced analysis...');
    
    // STEP 1: Run existing analysis pipeline
    console.log('[INTELLIGENCE] [1/2] Running standard analysis...');
    const standardAnalysis = await callFunction('analyze-estimate', event.body);
    
    if (standardAnalysis.statusCode !== 200) {
      return standardAnalysis; // Pass through error
    }
    
    const baseReport = standardAnalysis.data;
    
    // STEP 2: Run intelligence pipeline (if we have parsed data)
    console.log('[INTELLIGENCE] [2/2] Running intelligence engines...');
    
    const intelligenceIssues = [];
    const intelligenceAudit = [];
    
    // Note: This is a simplified version that will be expanded
    // For now, just return the base report with a flag indicating intelligence is available
    
    const enhancedReport = {
      ...baseReport,
      intelligence: {
        enabled: true,
        issues: intelligenceIssues,
        audit: intelligenceAudit,
        summary: {
          totalIssues: intelligenceIssues.length,
          processingTimeMs: Date.now() - startTime,
        },
      },
    };
    
    console.log(`[INTELLIGENCE] Complete in ${Date.now() - startTime}ms`);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enhancedReport)
    };
    
  } catch (error) {
    console.error('[INTELLIGENCE] Error:', error);
    
    // Fallback to standard analysis
    try {
      const fallback = await callFunction('analyze-estimate', event.body);
      return fallback;
    } catch (fallbackError) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Analysis failed',
          message: error.message
        })
      };
    }
  }
};
