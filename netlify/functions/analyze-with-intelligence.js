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
    console.log('[INTELLIGENCE] Starting Claims Intelligence Platform analysis...');
    
    // Parse request body
    const requestBody = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    
    // STEP 1: Run existing analysis pipeline
    console.log('[INTELLIGENCE] [1/2] Running standard analysis...');
    const standardAnalysis = await callFunction('analyze-estimate', event.body);
    
    if (standardAnalysis.statusCode !== 200) {
      return standardAnalysis; // Pass through error
    }
    
    const baseReport = standardAnalysis.data;
    
    // STEP 2: Run full intelligence pipeline
    console.log('[INTELLIGENCE] [2/2] Running Claims Intelligence Platform...');
    
    // Import pipeline (using dynamic import for Netlify)
    const { runClaimIntelligencePipeline } = await import('../../lib/pipeline/claimIntelligencePipeline');
    
    // Extract metadata
    const metadata = requestBody.metadata || {};
    const region = metadata.region || 'DEFAULT';
    const carrier = metadata.carrier || 'Unknown';
    const state = metadata.state || 'Unknown';
    const claimType = metadata.claimType || 'Unknown';
    const reportId = baseReport.reportId || `report-${Date.now()}`;
    
    // Run pipeline with all engines
    const pipelineResult = await runClaimIntelligencePipeline(
      baseReport.parsedEstimate || { lineItems: [], totals: { rcv: 0, acv: 0, depreciation: 0 } },
      {
        region,
        includeAI: true,
        reportId,
        carrier,
        state,
        claimType,
        enabledEngines: [
          'pricing',
          'depreciation',
          'labor',
          'carrier-tactics',
          'op-gaps',
          'scope-reconstruction',
          'recovery-calculator',
          'litigation-evidence',
        ],
      }
    );
    
    // Build enhanced report
    const enhancedReport = {
      ...baseReport,
      intelligence: {
        enabled: true,
        issues: pipelineResult.issues,
        audit: pipelineResult.auditEvents,
        summary: pipelineResult.summary,
        reconstruction: pipelineResult.reconstruction ? {
          originalValue: pipelineResult.reconstruction.reconstruction.originalValue,
          reconstructedValue: pipelineResult.reconstruction.reconstruction.reconstructedValue,
          gapValue: pipelineResult.reconstruction.reconstruction.gapValue,
          gapPercentage: pipelineResult.reconstruction.reconstruction.gapPercentage,
          missingItems: pipelineResult.reconstruction.reconstruction.missingLineItems.length,
          tradesDetected: pipelineResult.reconstruction.tradesDetected,
        } : null,
        recovery: pipelineResult.recovery ? {
          totalRecoveryValue: pipelineResult.recovery.totalRecoveryValue,
          recoveryPercentage: pipelineResult.recovery.recoveryPercentage,
          breakdown: pipelineResult.recovery.breakdown,
          categories: pipelineResult.recovery.categories.map(c => ({
            category: c.category,
            issueCount: c.issueCount,
            totalImpact: c.totalImpact,
          })),
        } : null,
        litigationEvidence: pipelineResult.litigationEvidence ? {
          evidenceItems: pipelineResult.litigationEvidence.evidenceItems.length,
          totalFinancialImpact: pipelineResult.litigationEvidence.totalFinancialImpact,
          executiveSummary: pipelineResult.litigationEvidence.executiveSummary,
        } : null,
      },
    };
    
    console.log(`[INTELLIGENCE] Complete in ${Date.now() - startTime}ms`);
    console.log(`[INTELLIGENCE] - Issues: ${pipelineResult.issues.length}`);
    console.log(`[INTELLIGENCE] - Recovery: $${pipelineResult.recovery?.totalRecoveryValue.toFixed(2) || '0.00'}`);
    
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
