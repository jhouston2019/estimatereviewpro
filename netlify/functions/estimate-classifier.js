/**
 * ESTIMATE CLASSIFIER
 * Classifies insurance estimates by type: Property / Auto / Commercial
 * Rejects unknown or ambiguous types
 * Temperature: 0.2 (deterministic)
 */

const PROPERTY_KEYWORDS = [
  'roofing', 'roof', 'shingles', 'siding', 'drywall', 'flooring',
  'painting', 'water damage', 'fire damage', 'wind damage', 'hail damage',
  'interior', 'exterior', 'foundation', 'hvac', 'plumbing', 'electrical',
  'kitchen', 'bathroom', 'bedroom', 'living room', 'ceiling', 'wall',
  'insulation', 'gutters', 'windows', 'doors', 'deck', 'fence'
];

const AUTO_KEYWORDS = [
  'bumper', 'fender', 'hood', 'door panel', 'quarter panel', 'trunk',
  'windshield', 'headlight', 'taillight', 'mirror', 'grille', 'paint',
  'body shop', 'collision', 'frame', 'suspension', 'alignment',
  'airbag', 'seat', 'dashboard', 'wheel', 'tire', 'rim'
];

const COMMERCIAL_KEYWORDS = [
  'commercial property', 'business', 'retail', 'office', 'warehouse',
  'industrial', 'manufacturing', 'restaurant', 'store', 'building',
  'tenant improvement', 'ada compliance', 'fire suppression', 'sprinkler',
  'commercial kitchen', 'loading dock', 'parking lot', 'signage'
];

exports.handler = async (event, context) => {
  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { text, lineItems } = JSON.parse(event.body);

    if (!text && !lineItems) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing required field: text or lineItems'
        })
      };
    }

    // Combine text and line items for analysis
    const content = (text || '') + ' ' + (lineItems || []).join(' ');
    const contentLower = content.toLowerCase();

    // Count keyword matches
    const propertyScore = PROPERTY_KEYWORDS.filter(kw => 
      contentLower.includes(kw)
    ).length;

    const autoScore = AUTO_KEYWORDS.filter(kw => 
      contentLower.includes(kw)
    ).length;

    const commercialScore = COMMERCIAL_KEYWORDS.filter(kw => 
      contentLower.includes(kw)
    ).length;

    // Determine classification
    const scores = {
      property: propertyScore,
      auto: autoScore,
      commercial: commercialScore
    };

    const maxScore = Math.max(propertyScore, autoScore, commercialScore);

    // Reject if no clear classification (minimum 3 keywords required)
    if (maxScore < 3) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Unable to classify estimate type',
          reason: 'Insufficient recognizable line items',
          classification: 'UNKNOWN',
          scores
        })
      };
    }

    // Reject if ambiguous (two types within 2 points of each other)
    const sortedScores = Object.entries(scores)
      .sort((a, b) => b[1] - a[1]);
    
    if (sortedScores[0][1] - sortedScores[1][1] < 2) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Ambiguous estimate type',
          reason: 'Multiple estimate types detected',
          classification: 'AMBIGUOUS',
          scores
        })
      };
    }

    // Determine final classification
    let classification;
    if (propertyScore === maxScore) {
      classification = 'PROPERTY';
    } else if (autoScore === maxScore) {
      classification = 'AUTO';
    } else {
      classification = 'COMMERCIAL';
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        classification,
        confidence: maxScore >= 5 ? 'HIGH' : 'MEDIUM',
        scores
      })
    };

  } catch (error) {
    console.error('Classification error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Classification failed',
        message: error.message
      })
    };
  }
};


