/**
 * ESTIMATE INTEGRITY CHECKS ENGINE
 * Deterministic line item integrity analysis
 * NO AI - Pure rule-based logic
 * NO judgments - observations only
 */

/**
 * Integrity check rules
 * Each rule is deterministic and produces observations only
 */

const INTEGRITY_RULES = {
  // Rule 1: Zero quantity with labor description
  ZERO_QUANTITY_WITH_LABOR: {
    name: 'Zero Quantity with Labor Description',
    check: (item) => {
      if (!item.isZeroQuantity) return null;
      
      const laborKeywords = [
        'install', 'remove', 'replace', 'repair', 'paint',
        'seal', 'apply', 'cut', 'demo', 'demolish'
      ];
      
      const hasLaborKeyword = laborKeywords.some(kw =>
        item.description.toLowerCase().includes(kw)
      );
      
      if (hasLaborKeyword) {
        return {
          type: 'ZERO_QUANTITY_WITH_LABOR',
          severity: 'MEDIUM',
          lineNumber: item.lineNumber,
          description: item.description,
          observation: 'Line item describes labor activity but has zero quantity'
        };
      }
      
      return null;
    }
  },

  // Rule 2: Removal without replacement
  REMOVAL_WITHOUT_REPLACEMENT: {
    name: 'Removal Without Replacement',
    check: (items) => {
      const findings = [];
      const removalKeywords = ['remove', 'demo', 'demolish', 'tear out', 'cut out'];
      const installKeywords = ['install', 'replace', 'new', 'reinstall'];
      
      // Group by trade
      const tradeGroups = {};
      items.forEach(item => {
        if (item.trade) {
          if (!tradeGroups[item.trade]) {
            tradeGroups[item.trade] = { removal: [], install: [] };
          }
          
          const desc = item.description.toLowerCase();
          const hasRemoval = removalKeywords.some(kw => desc.includes(kw));
          const hasInstall = installKeywords.some(kw => desc.includes(kw));
          
          if (hasRemoval) tradeGroups[item.trade].removal.push(item);
          if (hasInstall) tradeGroups[item.trade].install.push(item);
        }
      });
      
      // Check each trade
      Object.keys(tradeGroups).forEach(trade => {
        const group = tradeGroups[trade];
        if (group.removal.length > 0 && group.install.length === 0) {
          findings.push({
            type: 'REMOVAL_WITHOUT_REPLACEMENT',
            severity: 'MEDIUM',
            trade: trade,
            tradeName: group.removal[0].tradeName,
            observation: `${group.removal[0].tradeName} removal detected without corresponding replacement line items`
          });
        }
      });
      
      return findings;
    }
  },

  // Rule 3: Replacement without removal
  REPLACEMENT_WITHOUT_REMOVAL: {
    name: 'Replacement Without Removal',
    check: (items) => {
      const findings = [];
      const removalKeywords = ['remove', 'demo', 'demolish', 'tear out'];
      const replaceKeywords = ['replace', 'replacement'];
      
      // Group by trade
      const tradeGroups = {};
      items.forEach(item => {
        if (item.trade) {
          if (!tradeGroups[item.trade]) {
            tradeGroups[item.trade] = { removal: [], replace: [] };
          }
          
          const desc = item.description.toLowerCase();
          const hasRemoval = removalKeywords.some(kw => desc.includes(kw));
          const hasReplace = replaceKeywords.some(kw => desc.includes(kw));
          
          if (hasRemoval) tradeGroups[item.trade].removal.push(item);
          if (hasReplace) tradeGroups[item.trade].replace.push(item);
        }
      });
      
      // Check each trade
      Object.keys(tradeGroups).forEach(trade => {
        const group = tradeGroups[trade];
        if (group.replace.length > 0 && group.removal.length === 0) {
          findings.push({
            type: 'REPLACEMENT_WITHOUT_REMOVAL',
            severity: 'LOW',
            trade: trade,
            tradeName: group.replace[0].tradeName,
            observation: `${group.replace[0].tradeName} replacement detected without corresponding removal line items`
          });
        }
      });
      
      return findings;
    }
  },

  // Rule 4: Drywall removal without paint
  DRYWALL_WITHOUT_PAINT: {
    name: 'Drywall Without Paint',
    check: (items) => {
      const hasDrywall = items.some(item => item.trade === 'DRY');
      const hasPaint = items.some(item => item.trade === 'PNT');
      
      if (hasDrywall && !hasPaint) {
        return {
          type: 'DRYWALL_WITHOUT_PAINT',
          severity: 'MEDIUM',
          observation: 'Drywall trade detected without corresponding paint trade'
        };
      }
      
      return null;
    }
  },

  // Rule 5: Flooring removal without reinstall
  FLOORING_REMOVAL_WITHOUT_REINSTALL: {
    name: 'Flooring Removal Without Reinstall',
    check: (items) => {
      const floorItems = items.filter(item => item.trade === 'FLR');
      
      const hasRemoval = floorItems.some(item => {
        const desc = item.description.toLowerCase();
        return desc.includes('remove') || desc.includes('demo');
      });
      
      const hasInstall = floorItems.some(item => {
        const desc = item.description.toLowerCase();
        return desc.includes('install') || desc.includes('replace') || desc.includes('new');
      });
      
      if (hasRemoval && !hasInstall) {
        return {
          type: 'FLOORING_REMOVAL_WITHOUT_REINSTALL',
          severity: 'MEDIUM',
          observation: 'Flooring removal detected without corresponding reinstall line items'
        };
      }
      
      return null;
    }
  },

  // Rule 6: Labor without material
  LABOR_WITHOUT_MATERIAL: {
    name: 'Labor Without Material',
    check: (items) => {
      const findings = [];
      
      // Group by trade
      const tradeGroups = {};
      items.forEach(item => {
        if (item.trade) {
          if (!tradeGroups[item.trade]) {
            tradeGroups[item.trade] = { labor: [], material: [] };
          }
          
          const desc = item.description.toLowerCase();
          
          // Labor indicators
          if (desc.includes('labor') || desc.includes('install') || 
              desc.includes('apply') || item.unit === 'HR') {
            tradeGroups[item.trade].labor.push(item);
          }
          
          // Material indicators
          if (desc.includes('material') || desc.includes('supplies') ||
              ['SF', 'LF', 'SY', 'EA'].includes(item.unit)) {
            tradeGroups[item.trade].material.push(item);
          }
        }
      });
      
      // Check each trade
      Object.keys(tradeGroups).forEach(trade => {
        const group = tradeGroups[trade];
        if (group.labor.length > 0 && group.material.length === 0) {
          findings.push({
            type: 'LABOR_WITHOUT_MATERIAL',
            severity: 'LOW',
            trade: trade,
            tradeName: group.labor[0].tradeName,
            observation: `${group.labor[0].tradeName} labor detected without corresponding material line items`
          });
        }
      });
      
      return findings;
    }
  },

  // Rule 7: Material without labor
  MATERIAL_WITHOUT_LABOR: {
    name: 'Material Without Labor',
    check: (items) => {
      const findings = [];
      
      // Group by trade
      const tradeGroups = {};
      items.forEach(item => {
        if (item.trade) {
          if (!tradeGroups[item.trade]) {
            tradeGroups[item.trade] = { labor: [], material: [] };
          }
          
          const desc = item.description.toLowerCase();
          
          // Labor indicators
          if (desc.includes('labor') || desc.includes('install') || 
              desc.includes('apply') || item.unit === 'HR') {
            tradeGroups[item.trade].labor.push(item);
          }
          
          // Material indicators
          if (desc.includes('material') || desc.includes('supplies') ||
              ['SF', 'LF', 'SY', 'EA'].includes(item.unit)) {
            tradeGroups[item.trade].material.push(item);
          }
        }
      });
      
      // Check each trade
      Object.keys(tradeGroups).forEach(trade => {
        const group = tradeGroups[trade];
        if (group.material.length > 0 && group.labor.length === 0) {
          findings.push({
            type: 'MATERIAL_WITHOUT_LABOR',
            severity: 'LOW',
            trade: trade,
            tradeName: group.material[0].tradeName,
            observation: `${group.material[0].tradeName} material detected without corresponding labor line items`
          });
        }
      });
      
      return findings;
    }
  },

  // Rule 8: Inconsistent quantities
  INCONSISTENT_QUANTITIES: {
    name: 'Inconsistent Quantities',
    check: (items) => {
      const findings = [];
      
      // Group by trade and room
      const groups = {};
      items.forEach(item => {
        if (item.trade && item.room && item.quantity !== null) {
          const key = `${item.trade}:${item.room}`;
          if (!groups[key]) {
            groups[key] = [];
          }
          groups[key].push(item);
        }
      });
      
      // Check for quantity mismatches in same trade/room
      Object.keys(groups).forEach(key => {
        const group = groups[key];
        if (group.length > 1) {
          const quantities = group.map(i => i.quantity);
          const uniqueQtys = [...new Set(quantities)];
          
          // If we have removal and install with different quantities
          const hasRemoval = group.some(i => 
            i.description.toLowerCase().includes('remove')
          );
          const hasInstall = group.some(i => 
            i.description.toLowerCase().includes('install')
          );
          
          if (hasRemoval && hasInstall && uniqueQtys.length > 1) {
            findings.push({
              type: 'INCONSISTENT_QUANTITIES',
              severity: 'LOW',
              trade: group[0].trade,
              room: group[0].room,
              quantities: uniqueQtys,
              observation: `${group[0].tradeName} in ${group[0].room} has inconsistent quantities between removal and install`
            });
          }
        }
      });
      
      return findings;
    }
  }
};

/**
 * Run all integrity checks on line items
 */
function runIntegrityChecks(lineItems) {
  if (!lineItems || !Array.isArray(lineItems)) {
    return {
      success: false,
      error: 'Invalid line items array'
    };
  }

  const findings = [];

  // Run single-item checks
  lineItems.forEach(item => {
    // Zero quantity with labor
    const zeroQtyResult = INTEGRITY_RULES.ZERO_QUANTITY_WITH_LABOR.check(item);
    if (zeroQtyResult) findings.push(zeroQtyResult);
  });

  // Run multi-item checks
  const removalResult = INTEGRITY_RULES.REMOVAL_WITHOUT_REPLACEMENT.check(lineItems);
  if (removalResult) findings.push(...removalResult);

  const replacementResult = INTEGRITY_RULES.REPLACEMENT_WITHOUT_REMOVAL.check(lineItems);
  if (replacementResult) findings.push(...replacementResult);

  const drywallResult = INTEGRITY_RULES.DRYWALL_WITHOUT_PAINT.check(lineItems);
  if (drywallResult) findings.push(drywallResult);

  const flooringResult = INTEGRITY_RULES.FLOORING_REMOVAL_WITHOUT_REINSTALL.check(lineItems);
  if (flooringResult) findings.push(flooringResult);

  const laborResult = INTEGRITY_RULES.LABOR_WITHOUT_MATERIAL.check(lineItems);
  if (laborResult) findings.push(...laborResult);

  const materialResult = INTEGRITY_RULES.MATERIAL_WITHOUT_LABOR.check(lineItems);
  if (materialResult) findings.push(...materialResult);

  const quantityResult = INTEGRITY_RULES.INCONSISTENT_QUANTITIES.check(lineItems);
  if (quantityResult) findings.push(...quantityResult);

  // Categorize by severity
  const categorized = {
    HIGH: findings.filter(f => f.severity === 'HIGH'),
    MEDIUM: findings.filter(f => f.severity === 'MEDIUM'),
    LOW: findings.filter(f => f.severity === 'LOW'),
    INFO: findings.filter(f => f.severity === 'INFO')
  };

  return {
    success: true,
    totalFindings: findings.length,
    findings: findings,
    categorized: categorized,
    summary: {
      high: categorized.HIGH.length,
      medium: categorized.MEDIUM.length,
      low: categorized.LOW.length,
      info: categorized.INFO.length
    }
  };
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
    const { lineItems } = JSON.parse(event.body);

    if (!lineItems || !Array.isArray(lineItems)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Missing or invalid lineItems array'
        })
      };
    }

    const result = runIntegrityChecks(lineItems);

    if (!result.success) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: result.error
        })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'SUCCESS',
        ...result,
        disclaimer: 'These are observational findings only. They do not constitute coverage determinations, pricing opinions, or recommendations about what should be included or paid.'
      })
    };

  } catch (error) {
    console.error('Integrity checks error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Integrity checks failed',
        message: error.message
      })
    };
  }
};

// Export for testing
module.exports = {
  INTEGRITY_RULES,
  runIntegrityChecks
};


