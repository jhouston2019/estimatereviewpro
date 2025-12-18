/**
 * LOSS TYPE EXPECTATION MATRIX
 * Deterministic expectation matrices for different loss types
 * NO AI - Pure observational logic
 * These are NOT coverage statements - observational expectations only
 */

/**
 * CRITICAL DISCLAIMER:
 * These matrices represent commonly observed trade categories in typical estimates
 * for each loss type. They are NOT statements about:
 * - What should be covered
 * - What carriers must pay for
 * - What is required or owed
 * - Policy coverage or exclusions
 * 
 * They are purely observational patterns for detection purposes.
 */

const LOSS_EXPECTATIONS = {
  WATER: {
    REQUIRED_TRADES: [
      'DRY',  // Drywall - almost always affected in water loss
      'PNT'   // Painting - typically follows drywall work
    ],
    COMMON_TRADES: [
      'FLR',  // Flooring - frequently damaged by water
      'TRM',  // Trim - often affected at floor level
      'CLN',  // Cleaning - standard in water losses
      'DEM',  // Demolition - removal of damaged materials
      'INS'   // Insulation - often wet and must be removed
    ],
    CONDITIONAL_TRADES: [
      'CAB',  // Cabinets - if water reached cabinet level
      'CTR',  // Countertops - if cabinets affected
      'ELE',  // Electrical - if outlets/switches affected
      'PLM',  // Plumbing - if source of loss
      'TIL',  // Tile - if in affected area
      'WIN',  // Windows - if leak source
      'DOR'   // Doors - if warped or damaged
    ],
    DESCRIPTION: 'Water damage loss'
  },

  FIRE: {
    REQUIRED_TRADES: [
      'DRY',  // Drywall - fire/smoke damage
      'PNT',  // Painting - soot/smoke remediation
      'CLN'   // Cleaning - smoke/soot cleaning critical
    ],
    COMMON_TRADES: [
      'FLR',  // Flooring - often burned or smoke damaged
      'TRM',  // Trim - fire/smoke damage
      'DEM',  // Demolition - burned materials removal
      'ELE',  // Electrical - often damaged by fire
      'CAB',  // Cabinets - smoke/fire damage
      'RFG',  // Roofing - if fire reached roof
      'FRM',  // Framing - structural fire damage
      'INS'   // Insulation - fire/smoke damage
    ],
    CONDITIONAL_TRADES: [
      'PLM',  // Plumbing - if fire damaged pipes
      'HVA',  // HVAC - smoke contamination
      'WIN',  // Windows - if broken or damaged
      'DOR',  // Doors - if burned
      'SID',  // Siding - exterior fire damage
      'CTR',  // Countertops - if cabinets affected
      'TIL',  // Tile - if in affected area
      'APP',  // Appliances - if fire source or damaged
      'FND'   // Foundation - severe fire cases
    ],
    DESCRIPTION: 'Fire and smoke damage loss'
  },

  WIND: {
    REQUIRED_TRADES: [
      'RFG'   // Roofing - primary wind damage target
    ],
    COMMON_TRADES: [
      'SID',  // Siding - wind damage
      'WIN',  // Windows - broken by wind/debris
      'GUT',  // Gutters - wind damage
      'SHT',  // Sheet metal - flashing, etc.
      'DRY',  // Drywall - if water intrusion occurred
      'PNT',  // Painting - if interior affected
      'FRM'   // Framing - structural wind damage
    ],
    CONDITIONAL_TRADES: [
      'DOR',  // Doors - if damaged
      'FLR',  // Flooring - if water intrusion
      'TRM',  // Trim - if interior affected
      'CLN',  // Cleaning - if water intrusion
      'DEM',  // Demolition - damaged materials
      'INS',  // Insulation - if exposed to elements
      'DEC',  // Decks - wind damage
      'FEN',  // Fencing - wind damage
      'ELE',  // Electrical - if fixtures damaged
      'TIL'   // Tile - if roof damage caused interior issues
    ],
    DESCRIPTION: 'Wind and storm damage loss'
  },

  HAIL: {
    REQUIRED_TRADES: [
      'RFG'   // Roofing - primary hail damage
    ],
    COMMON_TRADES: [
      'GUT',  // Gutters - hail damage
      'SHT',  // Sheet metal - hail dents
      'SID',  // Siding - hail damage
      'WIN'   // Windows - broken by hail
    ],
    CONDITIONAL_TRADES: [
      'DRY',  // Drywall - if water intrusion
      'PNT',  // Painting - if interior affected
      'FLR',  // Flooring - if water intrusion
      'CLN',  // Cleaning - if water intrusion
      'DEM',  // Demolition - if water damage
      'TRM',  // Trim - if interior affected
      'DOR',  // Doors - hail damage
      'DEC',  // Decks - hail damage
      'FEN',  // Fencing - hail damage
      'INS'   // Insulation - if water intrusion
    ],
    DESCRIPTION: 'Hail damage loss'
  },

  COLLISION: {
    REQUIRED_TRADES: [
      // Note: Auto collision uses different trade codes
      // This is for property collision (vehicle into structure)
      'FRM',  // Framing - structural impact
      'DRY'   // Drywall - interior damage
    ],
    COMMON_TRADES: [
      'SID',  // Siding - exterior impact
      'WIN',  // Windows - broken
      'DOR',  // Doors - damaged
      'PNT',  // Painting - repairs
      'FND',  // Foundation - impact damage
      'DEM',  // Demolition - damaged materials
      'ELE'   // Electrical - if impacted
    ],
    CONDITIONAL_TRADES: [
      'RFG',  // Roofing - if upper story impact
      'FLR',  // Flooring - if structural damage
      'TRM',  // Trim - interior damage
      'PLM',  // Plumbing - if pipes damaged
      'CAB',  // Cabinets - if interior affected
      'CTR',  // Countertops - if cabinets affected
      'TIL',  // Tile - if affected area
      'MAS',  // Masonry - brick/block damage
      'STU',  // Stucco - exterior damage
      'DEC'   // Decks - if impacted
    ],
    DESCRIPTION: 'Collision/impact damage loss'
  },

  OTHER: {
    REQUIRED_TRADES: [],
    COMMON_TRADES: [],
    CONDITIONAL_TRADES: [],
    DESCRIPTION: 'Other or unspecified loss type'
  }
};

/**
 * Get expectations for a specific loss type
 */
function getExpectations(lossType) {
  const type = (lossType || 'OTHER').toUpperCase();
  
  if (!LOSS_EXPECTATIONS.hasOwnProperty(type)) {
    return LOSS_EXPECTATIONS.OTHER;
  }

  return LOSS_EXPECTATIONS[type];
}

/**
 * Compare detected trades against expectations
 * Returns observational findings only - NO judgments
 */
function compareToExpectations(detectedTrades, lossType) {
  const expectations = getExpectations(lossType);
  const detectedCodes = detectedTrades.map(t => t.code || t);

  const findings = {
    lossType: lossType,
    description: expectations.DESCRIPTION,
    
    // Trades that were expected and detected
    detectedExpected: {
      required: [],
      common: [],
      conditional: []
    },
    
    // Trades that were expected but NOT detected
    notDetectedExpected: {
      required: [],
      common: [],
      conditional: []
    },
    
    // Trades detected that were not in expectations
    detectedUnexpected: [],
    
    // Summary counts
    summary: {
      totalDetected: detectedCodes.length,
      expectedRequired: expectations.REQUIRED_TRADES.length,
      expectedCommon: expectations.COMMON_TRADES.length,
      expectedConditional: expectations.CONDITIONAL_TRADES.length
    }
  };

  // Check REQUIRED trades
  expectations.REQUIRED_TRADES.forEach(trade => {
    if (detectedCodes.includes(trade)) {
      findings.detectedExpected.required.push(trade);
    } else {
      findings.notDetectedExpected.required.push(trade);
    }
  });

  // Check COMMON trades
  expectations.COMMON_TRADES.forEach(trade => {
    if (detectedCodes.includes(trade)) {
      findings.detectedExpected.common.push(trade);
    } else {
      findings.notDetectedExpected.common.push(trade);
    }
  });

  // Check CONDITIONAL trades
  expectations.CONDITIONAL_TRADES.forEach(trade => {
    if (detectedCodes.includes(trade)) {
      findings.detectedExpected.conditional.push(trade);
    } else {
      findings.notDetectedExpected.conditional.push(trade);
    }
  });

  // Find unexpected trades
  const allExpected = [
    ...expectations.REQUIRED_TRADES,
    ...expectations.COMMON_TRADES,
    ...expectations.CONDITIONAL_TRADES
  ];

  detectedCodes.forEach(trade => {
    if (!allExpected.includes(trade)) {
      findings.detectedUnexpected.push(trade);
    }
  });

  return findings;
}

/**
 * Generate neutral observations from comparison
 * CRITICAL: NO advocacy language
 */
function generateObservations(findings) {
  const observations = [];

  // Observation 1: Required trades
  if (findings.notDetectedExpected.required.length > 0) {
    observations.push({
      category: 'REQUIRED_TRADES_NOT_DETECTED',
      severity: 'HIGH',
      trades: findings.notDetectedExpected.required,
      observation: `${findings.notDetectedExpected.required.length} commonly required trade(s) for ${findings.lossType} loss not detected in estimate`
    });
  }

  if (findings.detectedExpected.required.length > 0) {
    observations.push({
      category: 'REQUIRED_TRADES_DETECTED',
      severity: 'INFO',
      trades: findings.detectedExpected.required,
      observation: `${findings.detectedExpected.required.length} commonly required trade(s) detected in estimate`
    });
  }

  // Observation 2: Common trades
  if (findings.notDetectedExpected.common.length > 0) {
    observations.push({
      category: 'COMMON_TRADES_NOT_DETECTED',
      severity: 'MEDIUM',
      trades: findings.notDetectedExpected.common,
      observation: `${findings.notDetectedExpected.common.length} commonly observed trade(s) for ${findings.lossType} loss not detected in estimate`
    });
  }

  // Observation 3: Unexpected trades
  if (findings.detectedUnexpected.length > 0) {
    observations.push({
      category: 'UNEXPECTED_TRADES_DETECTED',
      severity: 'INFO',
      trades: findings.detectedUnexpected,
      observation: `${findings.detectedUnexpected.length} trade(s) detected that are not typically associated with ${findings.lossType} loss`
    });
  }

  // Observation 4: Summary
  observations.push({
    category: 'SUMMARY',
    severity: 'INFO',
    observation: `Estimate contains ${findings.summary.totalDetected} trade categories. Loss type: ${findings.lossType}.`
  });

  return observations;
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
    const { detectedTrades, lossType, damageType } = JSON.parse(event.body);

    if (!detectedTrades || !Array.isArray(detectedTrades)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Missing or invalid detectedTrades array'
        })
      };
    }

    const type = lossType || damageType || 'OTHER';
    const findings = compareToExpectations(detectedTrades, type);
    const observations = generateObservations(findings);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'SUCCESS',
        findings,
        observations,
        disclaimer: 'These observations are based on commonly observed patterns and do not constitute coverage determinations, pricing opinions, or recommendations.'
      })
    };

  } catch (error) {
    console.error('Loss expectations error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Expectations analysis failed',
        message: error.message
      })
    };
  }
};

// Export for testing
module.exports = {
  LOSS_EXPECTATIONS,
  getExpectations,
  compareToExpectations,
  generateObservations
};


