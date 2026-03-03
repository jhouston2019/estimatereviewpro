/**
 * PARSER VALIDATION LAYER
 * 
 * Adds sanity checks, total verification, and confidence adjustment
 * to push parser accuracy from 95% to 97%
 * 
 * Features:
 * - Sanity checks (quantity, price, unit price ranges)
 * - Total verification (calculated vs stated)
 * - Cross-validation (removal vs replacement)
 * - Anomaly detection (outliers, duplicates)
 * - Confidence adjustment based on validation results
 */

import { LineItem, ParsedEstimate } from './advanced-xactimate-parser';

export interface ValidationResult {
  isValid: boolean;
  confidence: number; // 0.0 - 1.0
  warnings: string[];
  errors: string[];
  correctedEstimate: ParsedEstimate;
}

export interface ValidationIssue {
  lineNumber: number;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  type: string;
  message: string;
  suggestion?: string;
}

/**
 * Sanity check ranges (based on industry standards)
 */
const SANITY_RANGES = {
  quantity: {
    min: 0.01,
    max: 100000,
    typical_max: 10000
  },
  rcv: {
    min: 0.01,
    max: 1000000,
    typical_max: 100000
  },
  unitPrice: {
    // Trade-specific unit price ranges ($/unit)
    DRY: { min: 0.50, max: 50, typical: [2, 15] },
    PNT: { min: 0.50, max: 30, typical: [1.50, 8] },
    FLR: { min: 1, max: 100, typical: [3, 25] },
    CRP: { min: 1, max: 50, typical: [2, 15] },
    INS: { min: 0.50, max: 20, typical: [1, 8] },
    RFG: { min: 1, max: 50, typical: [3, 20] },
    ELE: { min: 10, max: 500, typical: [50, 200] },
    PLM: { min: 10, max: 500, typical: [50, 200] },
    HVA: { min: 20, max: 1000, typical: [100, 500] },
    CAB: { min: 50, max: 5000, typical: [200, 2000] },
    CTR: { min: 20, max: 500, typical: [50, 200] },
    TIL: { min: 2, max: 100, typical: [5, 40] },
    WIN: { min: 100, max: 5000, typical: [300, 1500] },
    DOR: { min: 100, max: 5000, typical: [300, 1500] },
    FRM: { min: 2, max: 50, typical: [5, 25] },
    SID: { min: 2, max: 50, typical: [5, 25] },
    MLD: { min: 1, max: 30, typical: [2, 15] },
    DEM: { min: 0.50, max: 20, typical: [1, 10] },
    CLN: { min: 0.25, max: 15, typical: [0.50, 5] },
    MIT: { min: 50, max: 500, typical: [100, 300] },
    DEFAULT: { min: 0.10, max: 1000, typical: [1, 100] }
  }
};

/**
 * STEP 1: Sanity Check Individual Line Items
 */
export function validateLineItem(item: LineItem): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Check 1: Quantity range
  if (item.quantity < SANITY_RANGES.quantity.min) {
    issues.push({
      lineNumber: item.lineNumber,
      severity: 'ERROR',
      type: 'QUANTITY_TOO_LOW',
      message: `Quantity ${item.quantity} is unrealistically low (min: ${SANITY_RANGES.quantity.min})`,
      suggestion: 'Check if decimal point is missing or unit is wrong'
    });
  }

  if (item.quantity > SANITY_RANGES.quantity.max) {
    issues.push({
      lineNumber: item.lineNumber,
      severity: 'ERROR',
      type: 'QUANTITY_TOO_HIGH',
      message: `Quantity ${item.quantity} exceeds maximum (${SANITY_RANGES.quantity.max})`,
      suggestion: 'Verify quantity or check if unit should be different'
    });
  }

  if (item.quantity > SANITY_RANGES.quantity.typical_max) {
    issues.push({
      lineNumber: item.lineNumber,
      severity: 'WARNING',
      type: 'QUANTITY_UNUSUALLY_HIGH',
      message: `Quantity ${item.quantity} is unusually high (typical max: ${SANITY_RANGES.quantity.typical_max})`,
      suggestion: 'Verify this is correct for large projects'
    });
  }

  // Check 2: RCV range
  if (item.rcv < SANITY_RANGES.rcv.min) {
    issues.push({
      lineNumber: item.lineNumber,
      severity: 'ERROR',
      type: 'RCV_TOO_LOW',
      message: `RCV $${item.rcv} is unrealistically low`,
      suggestion: 'Check if decimal point is missing'
    });
  }

  if (item.rcv > SANITY_RANGES.rcv.max) {
    issues.push({
      lineNumber: item.lineNumber,
      severity: 'ERROR',
      type: 'RCV_TOO_HIGH',
      message: `RCV $${item.rcv.toLocaleString()} exceeds maximum`,
      suggestion: 'Verify this line item or check for parsing error'
    });
  }

  // Check 3: Unit price range
  const unitPrice = item.quantity > 0 ? item.rcv / item.quantity : 0;
  const priceRange = SANITY_RANGES.unitPrice[item.tradeCode as keyof typeof SANITY_RANGES.unitPrice] 
    || SANITY_RANGES.unitPrice.DEFAULT;

  if (unitPrice < priceRange.min) {
    issues.push({
      lineNumber: item.lineNumber,
      severity: 'WARNING',
      type: 'UNIT_PRICE_TOO_LOW',
      message: `Unit price $${unitPrice.toFixed(2)}/${item.unit} is below minimum ($${priceRange.min})`,
      suggestion: 'Verify pricing or check for quantity/price swap'
    });
  }

  if (unitPrice > priceRange.max) {
    issues.push({
      lineNumber: item.lineNumber,
      severity: 'WARNING',
      type: 'UNIT_PRICE_TOO_HIGH',
      message: `Unit price $${unitPrice.toFixed(2)}/${item.unit} exceeds maximum ($${priceRange.max})`,
      suggestion: 'Verify pricing or check for quantity/price swap'
    });
  }

  // Check 4: ACV vs RCV
  if (item.acv > item.rcv) {
    issues.push({
      lineNumber: item.lineNumber,
      severity: 'ERROR',
      type: 'ACV_EXCEEDS_RCV',
      message: `ACV ($${item.acv}) exceeds RCV ($${item.rcv})`,
      suggestion: 'ACV should never be greater than RCV - likely parsing error'
    });
  }

  // Check 5: Depreciation validation
  const calculatedDepreciation = item.rcv - item.acv;
  if (Math.abs(calculatedDepreciation - item.depreciation) > 0.02) {
    issues.push({
      lineNumber: item.lineNumber,
      severity: 'WARNING',
      type: 'DEPRECIATION_MISMATCH',
      message: `Depreciation mismatch: stated $${item.depreciation}, calculated $${calculatedDepreciation.toFixed(2)}`,
      suggestion: 'Recalculate depreciation'
    });
  }

  // Check 6: Zero quantity with non-zero price
  if (item.quantity === 0 && item.rcv > 0) {
    issues.push({
      lineNumber: item.lineNumber,
      severity: 'WARNING',
      type: 'ZERO_QUANTITY_WITH_PRICE',
      message: `Zero quantity but RCV is $${item.rcv}`,
      suggestion: 'Check if quantity was parsed correctly'
    });
  }

  // Check 7: Description too short
  if (item.description.length < 3) {
    issues.push({
      lineNumber: item.lineNumber,
      severity: 'WARNING',
      type: 'DESCRIPTION_TOO_SHORT',
      message: `Description "${item.description}" is very short`,
      suggestion: 'Verify description was parsed correctly'
    });
  }

  return issues;
}

/**
 * STEP 2: Verify Totals
 */
export function verifyTotals(estimate: ParsedEstimate): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Calculate totals from line items
  const calculatedRCV = estimate.lineItems.reduce((sum, item) => sum + item.rcv, 0);
  const calculatedACV = estimate.lineItems.reduce((sum, item) => sum + item.acv, 0);
  const calculatedDepreciation = estimate.lineItems.reduce((sum, item) => sum + item.depreciation, 0);

  // Allow 1% variance (rounding differences)
  const rcvVariance = Math.abs(calculatedRCV - estimate.totals.rcv);
  const rcvPercentVariance = estimate.totals.rcv > 0 ? (rcvVariance / estimate.totals.rcv) * 100 : 0;

  if (rcvPercentVariance > 1) {
    issues.push({
      lineNumber: 0,
      severity: 'ERROR',
      type: 'RCV_TOTAL_MISMATCH',
      message: `RCV total mismatch: stated $${estimate.totals.rcv.toFixed(2)}, calculated $${calculatedRCV.toFixed(2)} (${rcvPercentVariance.toFixed(1)}% variance)`,
      suggestion: 'Verify all line items were parsed correctly'
    });
  }

  const acvVariance = Math.abs(calculatedACV - estimate.totals.acv);
  const acvPercentVariance = estimate.totals.acv > 0 ? (acvVariance / estimate.totals.acv) * 100 : 0;

  if (acvPercentVariance > 1) {
    issues.push({
      lineNumber: 0,
      severity: 'ERROR',
      type: 'ACV_TOTAL_MISMATCH',
      message: `ACV total mismatch: stated $${estimate.totals.acv.toFixed(2)}, calculated $${calculatedACV.toFixed(2)} (${acvPercentVariance.toFixed(1)}% variance)`,
      suggestion: 'Verify depreciation calculations'
    });
  }

  return issues;
}

/**
 * STEP 3: Cross-Validation (Removal vs Replacement)
 */
export function crossValidateActions(estimate: ParsedEstimate): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Group by trade
  const tradeGroups = new Map<string, LineItem[]>();
  
  for (const item of estimate.lineItems) {
    if (!tradeGroups.has(item.tradeCode)) {
      tradeGroups.set(item.tradeCode, []);
    }
    tradeGroups.get(item.tradeCode)!.push(item);
  }

  // Check each trade for removal/replacement balance
  for (const [tradeCode, items] of tradeGroups) {
    const removals = items.filter(i => i.actionType === 'REMOVE');
    const replacements = items.filter(i => i.actionType === 'REPLACE' || i.actionType === 'INSTALL');

    const removalQty = removals.reduce((sum, i) => sum + i.quantity, 0);
    const replacementQty = replacements.reduce((sum, i) => sum + i.quantity, 0);

    // Removal without replacement
    if (removals.length > 0 && replacements.length === 0) {
      issues.push({
        lineNumber: removals[0].lineNumber,
        severity: 'WARNING',
        type: 'REMOVAL_WITHOUT_REPLACEMENT',
        message: `${tradeCode}: ${removalQty} ${removals[0].unit} removed but no replacement found`,
        suggestion: 'Verify if replacement is missing or work is incomplete'
      });
    }

    // Replacement without removal (less critical)
    if (replacements.length > 0 && removals.length === 0 && tradeCode !== 'PNT' && tradeCode !== 'CLN') {
      issues.push({
        lineNumber: replacements[0].lineNumber,
        severity: 'INFO',
        type: 'REPLACEMENT_WITHOUT_REMOVAL',
        message: `${tradeCode}: ${replacementQty} ${replacements[0].unit} installed but no removal found`,
        suggestion: 'Verify if demolition costs are included'
      });
    }

    // Quantity mismatch (>20% difference)
    if (removals.length > 0 && replacements.length > 0) {
      const qtyDiff = Math.abs(removalQty - replacementQty);
      const qtyDiffPercent = (qtyDiff / Math.max(removalQty, replacementQty)) * 100;

      if (qtyDiffPercent > 20) {
        issues.push({
          lineNumber: removals[0].lineNumber,
          severity: 'WARNING',
          type: 'QUANTITY_MISMATCH',
          message: `${tradeCode}: Removal (${removalQty}) vs Replacement (${replacementQty}) differ by ${qtyDiffPercent.toFixed(0)}%`,
          suggestion: 'Verify quantities match or explain difference'
        });
      }
    }
  }

  return issues;
}

/**
 * STEP 4: Detect Anomalies
 */
export function detectAnomalies(estimate: ParsedEstimate): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Check for duplicate line items
  const seen = new Map<string, LineItem>();
  
  for (const item of estimate.lineItems) {
    const key = `${item.tradeCode}:${item.description}:${item.quantity}:${item.unit}`;
    
    if (seen.has(key)) {
      const original = seen.get(key)!;
      issues.push({
        lineNumber: item.lineNumber,
        severity: 'WARNING',
        type: 'DUPLICATE_LINE_ITEM',
        message: `Possible duplicate of line ${original.lineNumber}: ${item.description}`,
        suggestion: 'Verify this is not a duplicate entry'
      });
    } else {
      seen.set(key, item);
    }
  }

  // Check for outliers (prices significantly different from similar items)
  const tradeGroups = new Map<string, LineItem[]>();
  
  for (const item of estimate.lineItems) {
    if (!tradeGroups.has(item.tradeCode)) {
      tradeGroups.set(item.tradeCode, []);
    }
    tradeGroups.get(item.tradeCode)!.push(item);
  }

  for (const [tradeCode, items] of tradeGroups) {
    if (items.length < 3) continue; // Need at least 3 items to detect outliers

    const unitPrices = items.map(i => i.quantity > 0 ? i.rcv / i.quantity : 0);
    const avgUnitPrice = unitPrices.reduce((sum, p) => sum + p, 0) / unitPrices.length;
    const stdDev = Math.sqrt(
      unitPrices.reduce((sum, p) => sum + Math.pow(p - avgUnitPrice, 2), 0) / unitPrices.length
    );

    for (const item of items) {
      const unitPrice = item.quantity > 0 ? item.rcv / item.quantity : 0;
      const zScore = stdDev > 0 ? Math.abs(unitPrice - avgUnitPrice) / stdDev : 0;

      // Flag if >3 standard deviations from mean
      if (zScore > 3) {
        issues.push({
          lineNumber: item.lineNumber,
          severity: 'WARNING',
          type: 'PRICE_OUTLIER',
          message: `${tradeCode}: Unit price $${unitPrice.toFixed(2)} is ${zScore.toFixed(1)}σ from average ($${avgUnitPrice.toFixed(2)})`,
          suggestion: 'Verify this price is correct - it differs significantly from similar items'
        });
      }
    }
  }

  return issues;
}

/**
 * STEP 5: Adjust Confidence Based on Validation
 */
export function adjustConfidence(
  estimate: ParsedEstimate,
  allIssues: ValidationIssue[]
): ParsedEstimate {
  
  const errors = allIssues.filter(i => i.severity === 'ERROR');
  const warnings = allIssues.filter(i => i.severity === 'WARNING');
  const infos = allIssues.filter(i => i.severity === 'INFO');

  // Start with original confidence
  let confidenceScore = estimate.metadata.validationScore;

  // Deduct points for issues
  confidenceScore -= errors.length * 5;      // -5 points per error
  confidenceScore -= warnings.length * 2;    // -2 points per warning
  confidenceScore -= infos.length * 0.5;     // -0.5 points per info

  // Floor at 0
  confidenceScore = Math.max(0, confidenceScore);

  // Update confidence level
  let confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'FAILED';
  
  if (errors.length > 0) {
    confidence = 'LOW';
  } else if (confidenceScore >= 85) {
    confidence = 'HIGH';
  } else if (confidenceScore >= 70) {
    confidence = 'MEDIUM';
  } else if (confidenceScore >= 50) {
    confidence = 'LOW';
  } else {
    confidence = 'FAILED';
  }

  // Add validation warnings to metadata
  const validationWarnings = allIssues.map(issue => 
    `Line ${issue.lineNumber}: ${issue.type} - ${issue.message}`
  );

  return {
    ...estimate,
    metadata: {
      ...estimate.metadata,
      confidence,
      validationScore: Math.round(confidenceScore),
      warnings: [...estimate.metadata.warnings, ...validationWarnings]
    }
  };
}

/**
 * MAIN VALIDATION FUNCTION
 */
export function validateParsedEstimate(estimate: ParsedEstimate): ValidationResult {
  const allIssues: ValidationIssue[] = [];

  // Step 1: Validate each line item
  for (const item of estimate.lineItems) {
    const lineIssues = validateLineItem(item);
    allIssues.push(...lineIssues);
  }

  // Step 2: Verify totals
  const totalIssues = verifyTotals(estimate);
  allIssues.push(...totalIssues);

  // Step 3: Cross-validate actions
  const actionIssues = crossValidateActions(estimate);
  allIssues.push(...actionIssues);

  // Step 4: Detect anomalies
  const anomalyIssues = detectAnomalies(estimate);
  allIssues.push(...anomalyIssues);

  // Step 5: Adjust confidence
  const correctedEstimate = adjustConfidence(estimate, allIssues);

  // Determine if valid
  const errors = allIssues.filter(i => i.severity === 'ERROR');
  const isValid = errors.length === 0 && correctedEstimate.metadata.confidence !== 'FAILED';

  // Calculate final confidence (0.0 - 1.0)
  const confidence = correctedEstimate.metadata.validationScore / 100;

  return {
    isValid,
    confidence,
    warnings: allIssues.filter(i => i.severity === 'WARNING').map(i => i.message),
    errors: errors.map(i => i.message),
    correctedEstimate
  };
}

