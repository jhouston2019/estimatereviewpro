/**
 * ANALYZE ESTIMATE - Main Orchestrator
 * Accepts PDF upload, runs classification, guardrails, and analysis
 * Returns structured findings
 * Temperature: 0.2
 */

const https = require('https');
const pdfParse = require('pdf-parse');

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

// Extract text from PDF using pdf-parse
async function extractTextFromPDF(pdfBuffer) {
  try {
    // Validate buffer
    if (!Buffer.isBuffer(pdfBuffer)) {
      throw new Error('Invalid PDF buffer');
    }
    
    // Check size limit (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (pdfBuffer.length > maxSize) {
      throw new Error(`PDF exceeds maximum size of ${maxSize / 1024 / 1024}MB`);
    }
    
    console.log(`Parsing PDF: ${pdfBuffer.length} bytes`);
    
    // Parse PDF
    const data = await pdfParse(pdfBuffer, {
      max: 0, // Parse all pages
      version: 'default'
    });
    
    if (!data || !data.text) {
      throw new Error('PDF parsing returned no text');
    }
    
    console.log(`Extracted ${data.text.length} characters from ${data.numpages} pages`);
    
    // Check if text extraction was successful
    if (data.text.trim().length < 50) {
      console.warn('Low text extraction - possible scanned PDF');
      return {
        text: data.text,
        pages: data.numpages,
        warning: 'Low text content detected. PDF may be scanned or image-based.',
        confidence: 'LOW'
      };
    }
    
    return {
      text: data.text,
      pages: data.numpages,
      info: data.info || {},
      confidence: 'HIGH'
    };
    
  } catch (error) {
    console.error('PDF extraction error:', error);
    
    // Return structured error
    return {
      error: true,
      message: error.message,
      text: '',
      confidence: 'FAILED'
    };
  }
}

// Parse line items from text
function parseLineItems(text) {
  const lines = text.split('\n');
  const lineItems = [];
  
  // Simple heuristic: lines that look like estimate items
  // (contain numbers, currency, or common estimate keywords)
  const itemPattern = /(\d+|[A-Z][a-z]+\s+[A-Z][a-z]+|\$\d+)/;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 10 && itemPattern.test(trimmed)) {
      lineItems.push(trimmed);
    }
  }
  
  return lineItems;
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
    let estimateText, lineItems, userInput, metadata;

    if (contentType.includes('application/json')) {
      const body = JSON.parse(event.body);
      estimateText = body.estimateText || body.text;
      lineItems = body.lineItems;
      userInput = body.userInput || '';
      metadata = body.metadata || {};
    } else if (contentType.includes('multipart/form-data')) {
      // Handle file upload (simplified)
      // In production, use a proper multipart parser
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'File upload not yet implemented',
          message: 'Please send estimate text as JSON for now'
        })
      };
    } else {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Invalid content type',
          message: 'Send JSON with estimateText and lineItems fields'
        })
      };
    }

    if (!estimateText && !lineItems) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Missing required data',
          message: 'Provide either estimateText or lineItems array'
        })
      };
    }

    // Parse line items if not provided
    if (!lineItems && estimateText) {
      lineItems = parseLineItems(estimateText);
    }

    // STEP 1: Run guardrails check
    console.log('Running guardrails check...');
    const guardrailsResult = await callFunction('estimate-risk-guardrails', {
      text: estimateText,
      userInput: userInput
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

    // STEP 2: Classify estimate type
    console.log('Classifying estimate...');
    const classificationResult = await callFunction('estimate-classifier', {
      text: estimateText,
      lineItems: lineItems
    });

    if (classificationResult.statusCode !== 200) {
      return {
        statusCode: classificationResult.statusCode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Classification failed',
          details: classificationResult.data
        })
      };
    }

    const classification = classificationResult.data.classification;

    // STEP 3: Analyze line items
    console.log('Analyzing line items...');
    const analysisResult = await callFunction('estimate-lineitem-analyzer', {
      lineItems: lineItems,
      classification: classification,
      metadata: metadata
    });

    if (analysisResult.statusCode !== 200) {
      return {
        statusCode: analysisResult.statusCode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Analysis failed',
          details: analysisResult.data
        })
      };
    }

    // STEP 4: Format output
    console.log('Formatting output...');
    const formattingResult = await callFunction('estimate-output-formatter', {
      analysis: analysisResult.data.analysis,
      classification: classification,
      metadata: metadata
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

    // Return complete analysis
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'SUCCESS',
        classification: classificationResult.data,
        analysis: analysisResult.data,
        report: formattingResult.data.report,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Analysis error:', error);
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


