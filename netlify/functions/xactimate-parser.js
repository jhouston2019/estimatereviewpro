/**
 * XACTIMATE PARSER
 * Deterministic parser for Xactimate estimate format detection and extraction
 * NO AI - Pure rule-based logic
 * Temperature: N/A (rule-based)
 */

// Known Xactimate trade codes
const XACTIMATE_TRADE_CODES = {
  // Structural
  'DRY': 'Drywall',
  'FRM': 'Framing',
  'FND': 'Foundation',
  'MAS': 'Masonry',
  'STL': 'Structural Steel',
  
  // Finishes
  'PNT': 'Painting',
  'FLR': 'Flooring',
  'TRM': 'Trim/Millwork',
  'TIL': 'Tile',
  'CAB': 'Cabinets',
  'CTR': 'Countertops',
  
  // Roofing
  'RFG': 'Roofing',
  'GUT': 'Gutters',
  'SHT': 'Sheet Metal',
  
  // Mechanical/Electrical/Plumbing
  'HVA': 'HVAC',
  'ELE': 'Electrical',
  'PLM': 'Plumbing',
  
  // Exterior
  'SID': 'Siding',
  'STU': 'Stucco',
  'WIN': 'Windows',
  'DOR': 'Doors',
  'DEC': 'Decks',
  'FEN': 'Fencing',
  
  // Specialty
  'CLN': 'Cleaning',
  'DEM': 'Demolition',
  'INS': 'Insulation',
  'MIR': 'Mirrors',
  'GLS': 'Glass',
  
  // Contents
  'CON': 'Contents',
  'APP': 'Appliances',
  'FUR': 'Furniture'
};

// Known Xactimate units
const XACTIMATE_UNITS = ['SF', 'LF', 'SY', 'EA', 'HR', 'CY', 'TON', 'GAL', 'LB'];

// Xactimate-specific patterns
const XACTIMATE_PATTERNS = {
  // Trade code at start of line: "DRY - Remove drywall"
  tradeCodeLine: /^([A-Z]{3})\s*[-:]\s*(.+)/,
  
  // Quantity patterns: "120.00 SF" or "12 EA"
  quantityUnit: /(\d+\.?\d*)\s*(SF|LF|SY|EA|HR|CY|TON|GAL|LB)/i,
  
  // Zero quantity: "0.00 SF" or "0 EA"
  zeroQuantity: /^0+\.?0*\s*(SF|LF|SY|EA|HR|CY|TON|GAL|LB)/i,
  
  // Xactimate line item code: "DRY REM 1/2" or "PNT SEAL"
  xactimateCode: /^[A-Z]{3}\s+[A-Z]{3,4}/,
  
  // Room/area notation: "Living Room" or "Kitchen - 12x14"
  roomNotation: /^[A-Z][a-z]+\s+(Room|Kitchen|Bathroom|Bedroom|Hallway|Garage)/i,
  
  // Xactimate estimate header indicators
  estimateHeader: /(xactimate|estimate\s+summary|line\s+item\s+detail|scope\s+of\s+work)/i
};

/**
 * Parse estimate text and detect if it's Xactimate format
 */
function parseEstimate(text) {
  if (!text || typeof text !== 'string') {
    return {
      success: false,
      error: 'Invalid input: text is required'
    };
  }

  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  if (lines.length < 3) {
    return {
      success: false,
      error: 'Insufficient content for analysis',
      confidence: 0
    };
  }

  // Calculate confidence score
  const confidence = calculateXactimateConfidence(lines, text);
  
  if (confidence < 0.75) {
    return {
      success: false,
      error: 'Document does not match Xactimate format',
      confidence: confidence,
      reason: confidence < 0.3 ? 'No Xactimate indicators detected' :
              confidence < 0.5 ? 'Weak Xactimate indicators' :
              'Ambiguous format - insufficient Xactimate markers'
    };
  }

  // Parse line items
  const lineItems = parseLineItems(lines);
  const tradesDetected = extractTrades(lineItems);
  const integrityIssues = detectIntegrityIssues(lineItems);

  return {
    success: true,
    platform: 'xactimate',
    confidence: confidence,
    tradesDetected: tradesDetected,
    lineItems: lineItems,
    integrityIssues: integrityIssues,
    metadata: {
      totalLines: lines.length,
      parsedLines: lineItems.length,
      uniqueTrades: tradesDetected.length
    }
  };
}

/**
 * Calculate confidence that document is Xactimate format
 * Returns 0.0 to 1.0
 */
function calculateXactimateConfidence(lines, fullText) {
  let score = 0;
  let maxScore = 0;

  // Check 1: Trade codes detected (weight: 0.4)
  maxScore += 0.4;
  const tradeCodeMatches = lines.filter(line => {
    const match = line.match(XACTIMATE_PATTERNS.tradeCodeLine);
    if (match) {
      const code = match[1];
      return XACTIMATE_TRADE_CODES.hasOwnProperty(code);
    }
    return false;
  }).length;
  
  if (tradeCodeMatches > 0) {
    score += Math.min(0.4, (tradeCodeMatches / lines.length) * 2);
  }

  // Check 2: Xactimate units detected (weight: 0.2)
  maxScore += 0.2;
  const unitMatches = lines.filter(line => 
    XACTIMATE_PATTERNS.quantityUnit.test(line)
  ).length;
  
  if (unitMatches > 0) {
    score += Math.min(0.2, (unitMatches / lines.length) * 1.5);
  }

  // Check 3: Xactimate header/keywords (weight: 0.15)
  maxScore += 0.15;
  if (XACTIMATE_PATTERNS.estimateHeader.test(fullText.toLowerCase())) {
    score += 0.15;
  }

  // Check 4: Xactimate line item codes (weight: 0.15)
  maxScore += 0.15;
  const codeMatches = lines.filter(line =>
    XACTIMATE_PATTERNS.xactimateCode.test(line)
  ).length;
  
  if (codeMatches > 0) {
    score += Math.min(0.15, (codeMatches / lines.length) * 1.0);
  }

  // Check 5: Room notation (weight: 0.1)
  maxScore += 0.1;
  const roomMatches = lines.filter(line =>
    XACTIMATE_PATTERNS.roomNotation.test(line)
  ).length;
  
  if (roomMatches > 0) {
    score += Math.min(0.1, (roomMatches / lines.length) * 0.5);
  }

  return Math.min(1.0, score);
}

/**
 * Parse individual line items from text
 */
function parseLineItems(lines) {
  const items = [];
  let currentRoom = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this is a room header
    const roomMatch = line.match(XACTIMATE_PATTERNS.roomNotation);
    if (roomMatch) {
      currentRoom = line;
      continue;
    }

    // Check if this is a trade code line
    const tradeMatch = line.match(XACTIMATE_PATTERNS.tradeCodeLine);
    if (tradeMatch) {
      const tradeCode = tradeMatch[1];
      const description = tradeMatch[2];
      
      // Extract quantity and unit
      const qtyMatch = line.match(XACTIMATE_PATTERNS.quantityUnit);
      const qty = qtyMatch ? parseFloat(qtyMatch[1]) : null;
      const unit = qtyMatch ? qtyMatch[2].toUpperCase() : null;
      
      // Check for zero quantity
      const isZeroQuantity = XACTIMATE_PATTERNS.zeroQuantity.test(line);

      items.push({
        lineNumber: i + 1,
        trade: tradeCode,
        tradeName: XACTIMATE_TRADE_CODES[tradeCode] || 'Unknown',
        description: description.trim(),
        quantity: qty,
        unit: unit,
        isZeroQuantity: isZeroQuantity,
        room: currentRoom,
        rawLine: line
      });
    } else {
      // Try to parse as generic line item
      const qtyMatch = line.match(XACTIMATE_PATTERNS.quantityUnit);
      if (qtyMatch) {
        const qty = parseFloat(qtyMatch[1]);
        const unit = qtyMatch[2].toUpperCase();
        const isZeroQuantity = qty === 0;

        items.push({
          lineNumber: i + 1,
          trade: null,
          tradeName: null,
          description: line.replace(XACTIMATE_PATTERNS.quantityUnit, '').trim(),
          quantity: qty,
          unit: unit,
          isZeroQuantity: isZeroQuantity,
          room: currentRoom,
          rawLine: line
        });
      }
    }
  }

  return items;
}

/**
 * Extract unique trades from parsed line items
 */
function extractTrades(lineItems) {
  const trades = new Set();
  
  lineItems.forEach(item => {
    if (item.trade && XACTIMATE_TRADE_CODES.hasOwnProperty(item.trade)) {
      trades.add(item.trade);
    }
  });

  return Array.from(trades).sort().map(code => ({
    code: code,
    name: XACTIMATE_TRADE_CODES[code]
  }));
}

/**
 * Detect basic integrity issues in line items
 */
function detectIntegrityIssues(lineItems) {
  const issues = [];

  // Check for zero quantities
  lineItems.forEach(item => {
    if (item.isZeroQuantity) {
      issues.push({
        type: 'ZERO_QUANTITY',
        lineNumber: item.lineNumber,
        description: item.description,
        observation: 'Line item has zero quantity'
      });
    }
  });

  // Check for removal without replacement patterns
  const removalKeywords = ['remove', 'demo', 'demolish', 'tear out', 'cut out'];
  const installKeywords = ['install', 'replace', 'new', 'reinstall'];

  const removalItems = lineItems.filter(item =>
    removalKeywords.some(kw => item.description.toLowerCase().includes(kw))
  );

  const installItems = lineItems.filter(item =>
    installKeywords.some(kw => item.description.toLowerCase().includes(kw))
  );

  // Group by trade
  const removalByTrade = {};
  const installByTrade = {};

  removalItems.forEach(item => {
    if (item.trade) {
      removalByTrade[item.trade] = true;
    }
  });

  installItems.forEach(item => {
    if (item.trade) {
      installByTrade[item.trade] = true;
    }
  });

  // Check for trades with removal but no install
  Object.keys(removalByTrade).forEach(trade => {
    if (!installByTrade[trade]) {
      issues.push({
        type: 'REMOVAL_WITHOUT_REPLACEMENT',
        trade: trade,
        tradeName: XACTIMATE_TRADE_CODES[trade],
        observation: `${XACTIMATE_TRADE_CODES[trade]} removal detected without corresponding replacement`
      });
    }
  });

  return issues;
}

/**
 * Netlify function handler
 */
exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { text, estimateText } = JSON.parse(event.body);
    const inputText = text || estimateText;

    if (!inputText) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Missing required field: text or estimateText'
        })
      };
    }

    const result = parseEstimate(inputText);

    if (!result.success) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Document parsing failed',
          reason: result.error,
          confidence: result.confidence,
          details: result.reason
        })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'SUCCESS',
        ...result
      })
    };

  } catch (error) {
    console.error('Xactimate parser error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Parser failed',
        message: error.message
      })
    };
  }
};

// Export for testing
module.exports = {
  parseEstimate,
  calculateXactimateConfidence,
  parseLineItems,
  extractTrades,
  XACTIMATE_TRADE_CODES,
  XACTIMATE_UNITS
};


