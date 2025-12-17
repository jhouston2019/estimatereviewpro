/**
 * ESTIMATE LINE ITEM ANALYZER
 * Detects missing categories, zero-quantity items, and under-scoping
 * NO pricing opinions - only factual observations
 * Temperature: 0.2 (deterministic)
 */

// Expected categories for each estimate type
const EXPECTED_CATEGORIES = {
  PROPERTY: {
    ROOFING: ['shingles', 'underlayment', 'flashing', 'ridge cap', 'starter strip', 'ice & water shield', 'ventilation'],
    SIDING: ['siding material', 'house wrap', 'trim', 'corner posts', 'j-channel'],
    INTERIOR: ['drywall', 'paint', 'flooring', 'baseboards', 'doors', 'trim'],
    WATER_DAMAGE: ['water extraction', 'drying', 'dehumidification', 'antimicrobial', 'moisture testing'],
    DEMOLITION: ['tear out', 'removal', 'disposal', 'dumpster'],
    LABOR: ['installation', 'labor', 'contractor overhead', 'profit']
  },
  AUTO: {
    BODY: ['panel replacement', 'panel repair', 'bumper', 'fender', 'door', 'quarter panel'],
    PAINT: ['paint materials', 'clear coat', 'primer', 'paint labor', 'blend'],
    MECHANICAL: ['alignment', 'suspension', 'frame', 'structural'],
    PARTS: ['oem parts', 'aftermarket parts', 'hardware', 'fasteners'],
    LABOR: ['body labor', 'paint labor', 'mechanical labor', 'refinish labor']
  },
  COMMERCIAL: {
    STRUCTURAL: ['framing', 'foundation', 'roof structure', 'walls'],
    SYSTEMS: ['hvac', 'electrical', 'plumbing', 'fire suppression'],
    INTERIOR: ['drywall', 'flooring', 'ceiling', 'doors', 'trim'],
    EXTERIOR: ['roofing', 'siding', 'windows', 'doors', 'parking lot'],
    COMPLIANCE: ['ada compliance', 'code upgrades', 'permits', 'inspections'],
    LABOR: ['general contractor', 'subcontractors', 'overhead', 'profit']
  }
};

// Common under-scoping patterns
const UNDER_SCOPING_PATTERNS = {
  ZERO_QUANTITY: /quantity[:\s]*0|qty[:\s]*0|^0\s+/i,
  MISSING_LABOR: /material only|materials only|parts only/i,
  INCOMPLETE_SCOPE: /partial|incomplete|temporary|patch/i
};

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { lineItems, classification, metadata } = JSON.parse(event.body);

    if (!lineItems || !Array.isArray(lineItems)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing or invalid lineItems array'
        })
      };
    }

    if (!classification || !EXPECTED_CATEGORIES[classification]) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Invalid or missing classification',
          validTypes: Object.keys(EXPECTED_CATEGORIES)
        })
      };
    }

    // Analysis results
    const analysis = {
      totalLineItems: lineItems.length,
      includedCategories: [],
      missingCategories: [],
      zeroQuantityItems: [],
      potentialUnderScoping: [],
      observations: []
    };

    // Convert line items to searchable text
    const lineItemsText = lineItems.map(item => {
      if (typeof item === 'string') return item.toLowerCase();
      if (typeof item === 'object') {
        return JSON.stringify(item).toLowerCase();
      }
      return '';
    }).join(' ');

    // Check for expected categories
    const expectedCats = EXPECTED_CATEGORIES[classification];
    
    for (const [categoryName, keywords] of Object.entries(expectedCats)) {
      const found = keywords.some(keyword => 
        lineItemsText.includes(keyword.toLowerCase())
      );

      if (found) {
        analysis.includedCategories.push({
          category: categoryName,
          status: 'PRESENT'
        });
      } else {
        analysis.missingCategories.push({
          category: categoryName,
          status: 'NOT_FOUND',
          note: 'This category was not detected in the estimate'
        });
      }
    }

    // Check each line item for issues
    lineItems.forEach((item, index) => {
      const itemStr = typeof item === 'string' ? item : JSON.stringify(item);
      const itemLower = itemStr.toLowerCase();

      // Check for zero quantity
      if (UNDER_SCOPING_PATTERNS.ZERO_QUANTITY.test(itemStr)) {
        analysis.zeroQuantityItems.push({
          lineNumber: index + 1,
          description: itemStr.substring(0, 100),
          issue: 'Zero quantity detected'
        });
      }

      // Check for missing labor
      if (UNDER_SCOPING_PATTERNS.MISSING_LABOR.test(itemLower)) {
        analysis.potentialUnderScoping.push({
          lineNumber: index + 1,
          description: itemStr.substring(0, 100),
          issue: 'Material-only line item (no labor component mentioned)'
        });
      }

      // Check for incomplete scope indicators
      if (UNDER_SCOPING_PATTERNS.INCOMPLETE_SCOPE.test(itemLower)) {
        analysis.potentialUnderScoping.push({
          lineNumber: index + 1,
          description: itemStr.substring(0, 100),
          issue: 'Scope may be incomplete or temporary'
        });
      }
    });

    // Generate neutral observations
    if (analysis.missingCategories.length > 0) {
      analysis.observations.push(
        `${analysis.missingCategories.length} expected category(ies) not detected in estimate`
      );
    }

    if (analysis.zeroQuantityItems.length > 0) {
      analysis.observations.push(
        `${analysis.zeroQuantityItems.length} line item(s) with zero quantity`
      );
    }

    if (analysis.potentialUnderScoping.length > 0) {
      analysis.observations.push(
        `${analysis.potentialUnderScoping.length} line item(s) with potential scope limitations`
      );
    }

    if (analysis.observations.length === 0) {
      analysis.observations.push(
        'No obvious omissions or under-scoping detected'
      );
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'COMPLETE',
        classification,
        analysis,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Line item analysis error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Analysis failed',
        message: error.message
      })
    };
  }
};

