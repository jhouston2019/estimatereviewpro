/**
 * VALIDATION LAYER TESTS
 * Tests for parser-validation-layer.ts
 */

import { 
  validateLineItem, 
  verifyTotals, 
  crossValidateActions,
  detectAnomalies,
  validateParsedEstimate 
} from '../parser-validation-layer';
import { LineItem, ParsedEstimate } from '../advanced-xactimate-parser';

describe('Validation Layer', () => {
  
  describe('Line Item Validation', () => {
    test('should pass valid line item', () => {
      const item: LineItem = {
        tradeCode: 'DRY',
        tradeName: 'Drywall',
        description: 'Remove drywall',
        quantity: 200,
        unit: 'SF',
        unitPrice: 3.50,
        rcv: 700,
        acv: 630,
        depreciation: 70,
        tax: 0,
        overhead: false,
        profit: false,
        actionType: 'REMOVE',
        lineNumber: 1,
        rawLine: 'test',
        parseConfidence: 1.0
      };

      const issues = validateLineItem(item);
      expect(issues.length).toBe(0);
    });

    test('should flag quantity too high', () => {
      const item: LineItem = {
        tradeCode: 'DRY',
        tradeName: 'Drywall',
        description: 'Remove drywall',
        quantity: 150000, // Way too high
        unit: 'SF',
        unitPrice: 3.50,
        rcv: 525000,
        acv: 525000,
        depreciation: 0,
        tax: 0,
        overhead: false,
        profit: false,
        actionType: 'REMOVE',
        lineNumber: 1,
        rawLine: 'test',
        parseConfidence: 1.0
      };

      const issues = validateLineItem(item);
      const quantityError = issues.find(i => i.type === 'QUANTITY_TOO_HIGH');
      expect(quantityError).toBeDefined();
      expect(quantityError?.severity).toBe('ERROR');
    });

    test('should flag unit price too low', () => {
      const item: LineItem = {
        tradeCode: 'DRY',
        tradeName: 'Drywall',
        description: 'Remove drywall',
        quantity: 200,
        unit: 'SF',
        unitPrice: 0.10, // Too low
        rcv: 20,
        acv: 20,
        depreciation: 0,
        tax: 0,
        overhead: false,
        profit: false,
        actionType: 'REMOVE',
        lineNumber: 1,
        rawLine: 'test',
        parseConfidence: 1.0
      };

      const issues = validateLineItem(item);
      const priceWarning = issues.find(i => i.type === 'UNIT_PRICE_TOO_LOW');
      expect(priceWarning).toBeDefined();
      expect(priceWarning?.severity).toBe('WARNING');
    });

    test('should flag ACV exceeding RCV', () => {
      const item: LineItem = {
        tradeCode: 'DRY',
        tradeName: 'Drywall',
        description: 'Remove drywall',
        quantity: 200,
        unit: 'SF',
        unitPrice: 3.50,
        rcv: 700,
        acv: 800, // Higher than RCV - ERROR
        depreciation: -100,
        tax: 0,
        overhead: false,
        profit: false,
        actionType: 'REMOVE',
        lineNumber: 1,
        rawLine: 'test',
        parseConfidence: 1.0
      };

      const issues = validateLineItem(item);
      const acvError = issues.find(i => i.type === 'ACV_EXCEEDS_RCV');
      expect(acvError).toBeDefined();
      expect(acvError?.severity).toBe('ERROR');
    });

    test('should flag zero quantity with price', () => {
      const item: LineItem = {
        tradeCode: 'DRY',
        tradeName: 'Drywall',
        description: 'Remove drywall',
        quantity: 0, // Zero quantity
        unit: 'SF',
        unitPrice: 0,
        rcv: 700, // But has price
        acv: 700,
        depreciation: 0,
        tax: 0,
        overhead: false,
        profit: false,
        actionType: 'REMOVE',
        lineNumber: 1,
        rawLine: 'test',
        parseConfidence: 1.0
      };

      const issues = validateLineItem(item);
      const zeroQtyWarning = issues.find(i => i.type === 'ZERO_QUANTITY_WITH_PRICE');
      expect(zeroQtyWarning).toBeDefined();
    });
  });

  describe('Total Verification', () => {
    test('should pass when totals match', () => {
      const estimate: ParsedEstimate = {
        lineItems: [
          {
            tradeCode: 'DRY', tradeName: 'Drywall', description: 'Remove drywall',
            quantity: 200, unit: 'SF', unitPrice: 3.50, rcv: 700, acv: 630,
            depreciation: 70, tax: 0, overhead: false, profit: false,
            actionType: 'REMOVE', lineNumber: 1, rawLine: '', parseConfidence: 1.0
          },
          {
            tradeCode: 'PNT', tradeName: 'Painting', description: 'Paint walls',
            quantity: 200, unit: 'SF', unitPrice: 2.25, rcv: 450, acv: 450,
            depreciation: 0, tax: 0, overhead: false, profit: false,
            actionType: 'OTHER', lineNumber: 2, rawLine: '', parseConfidence: 1.0
          }
        ],
        totals: {
          rcv: 1150,
          acv: 1080,
          depreciation: 70,
          tax: 0,
          overhead: 0,
          profit: 0
        },
        metadata: {
          confidence: 'HIGH',
          validationScore: 95,
          detectedFormat: 'XACTIMATE_TABULAR',
          lineCount: 2,
          parsedCount: 2,
          rejectedCount: 0,
          avgLineConfidence: 1.0,
          warnings: [],
          columnPattern: null
        }
      };

      const issues = verifyTotals(estimate);
      expect(issues.length).toBe(0);
    });

    test('should flag total mismatch', () => {
      const estimate: ParsedEstimate = {
        lineItems: [
          {
            tradeCode: 'DRY', tradeName: 'Drywall', description: 'Remove drywall',
            quantity: 200, unit: 'SF', unitPrice: 3.50, rcv: 700, acv: 630,
            depreciation: 70, tax: 0, overhead: false, profit: false,
            actionType: 'REMOVE', lineNumber: 1, rawLine: '', parseConfidence: 1.0
          }
        ],
        totals: {
          rcv: 1000, // Doesn't match line item total
          acv: 900,
          depreciation: 100,
          tax: 0,
          overhead: 0,
          profit: 0
        },
        metadata: {
          confidence: 'HIGH',
          validationScore: 95,
          detectedFormat: 'XACTIMATE_TABULAR',
          lineCount: 1,
          parsedCount: 1,
          rejectedCount: 0,
          avgLineConfidence: 1.0,
          warnings: [],
          columnPattern: null
        }
      };

      const issues = verifyTotals(estimate);
      const mismatch = issues.find(i => i.type === 'RCV_TOTAL_MISMATCH');
      expect(mismatch).toBeDefined();
      expect(mismatch?.severity).toBe('ERROR');
    });
  });

  describe('Cross-Validation', () => {
    test('should flag removal without replacement', () => {
      const estimate: ParsedEstimate = {
        lineItems: [
          {
            tradeCode: 'DRY', tradeName: 'Drywall', description: 'Remove drywall',
            quantity: 200, unit: 'SF', unitPrice: 3.50, rcv: 700, acv: 630,
            depreciation: 70, tax: 0, overhead: false, profit: false,
            actionType: 'REMOVE', lineNumber: 1, rawLine: '', parseConfidence: 1.0
          }
          // No replacement!
        ],
        totals: { rcv: 700, acv: 630, depreciation: 70, tax: 0, overhead: 0, profit: 0 },
        metadata: {
          confidence: 'HIGH', validationScore: 95, detectedFormat: 'XACTIMATE_TABULAR',
          lineCount: 1, parsedCount: 1, rejectedCount: 0, avgLineConfidence: 1.0,
          warnings: [], columnPattern: null
        }
      };

      const issues = crossValidateActions(estimate);
      const removalIssue = issues.find(i => i.type === 'REMOVAL_WITHOUT_REPLACEMENT');
      expect(removalIssue).toBeDefined();
      expect(removalIssue?.severity).toBe('WARNING');
    });

    test('should flag quantity mismatch', () => {
      const estimate: ParsedEstimate = {
        lineItems: [
          {
            tradeCode: 'DRY', tradeName: 'Drywall', description: 'Remove drywall',
            quantity: 200, unit: 'SF', unitPrice: 3.50, rcv: 700, acv: 630,
            depreciation: 70, tax: 0, overhead: false, profit: false,
            actionType: 'REMOVE', lineNumber: 1, rawLine: '', parseConfidence: 1.0
          },
          {
            tradeCode: 'DRY', tradeName: 'Drywall', description: 'Replace drywall',
            quantity: 100, unit: 'SF', unitPrice: 6.00, rcv: 600, acv: 600,
            depreciation: 0, tax: 0, overhead: false, profit: false,
            actionType: 'REPLACE', lineNumber: 2, rawLine: '', parseConfidence: 1.0
          }
        ],
        totals: { rcv: 1300, acv: 1230, depreciation: 70, tax: 0, overhead: 0, profit: 0 },
        metadata: {
          confidence: 'HIGH', validationScore: 95, detectedFormat: 'XACTIMATE_TABULAR',
          lineCount: 2, parsedCount: 2, rejectedCount: 0, avgLineConfidence: 1.0,
          warnings: [], columnPattern: null
        }
      };

      const issues = crossValidateActions(estimate);
      const mismatch = issues.find(i => i.type === 'QUANTITY_MISMATCH');
      expect(mismatch).toBeDefined();
    });
  });

  describe('Anomaly Detection', () => {
    test('should detect duplicate line items', () => {
      const estimate: ParsedEstimate = {
        lineItems: [
          {
            tradeCode: 'DRY', tradeName: 'Drywall', description: 'Remove drywall',
            quantity: 200, unit: 'SF', unitPrice: 3.50, rcv: 700, acv: 630,
            depreciation: 70, tax: 0, overhead: false, profit: false,
            actionType: 'REMOVE', lineNumber: 1, rawLine: '', parseConfidence: 1.0
          },
          {
            tradeCode: 'DRY', tradeName: 'Drywall', description: 'Remove drywall',
            quantity: 200, unit: 'SF', unitPrice: 3.50, rcv: 700, acv: 630,
            depreciation: 70, tax: 0, overhead: false, profit: false,
            actionType: 'REMOVE', lineNumber: 5, rawLine: '', parseConfidence: 1.0
          }
        ],
        totals: { rcv: 1400, acv: 1260, depreciation: 140, tax: 0, overhead: 0, profit: 0 },
        metadata: {
          confidence: 'HIGH', validationScore: 95, detectedFormat: 'XACTIMATE_TABULAR',
          lineCount: 2, parsedCount: 2, rejectedCount: 0, avgLineConfidence: 1.0,
          warnings: [], columnPattern: null
        }
      };

      const issues = detectAnomalies(estimate);
      const duplicate = issues.find(i => i.type === 'DUPLICATE_LINE_ITEM');
      expect(duplicate).toBeDefined();
    });

    test('should detect price outliers', () => {
      const estimate: ParsedEstimate = {
        lineItems: [
          {
            tradeCode: 'DRY', tradeName: 'Drywall', description: 'Remove drywall room 1',
            quantity: 200, unit: 'SF', unitPrice: 3.50, rcv: 700, acv: 630,
            depreciation: 70, tax: 0, overhead: false, profit: false,
            actionType: 'REMOVE', lineNumber: 1, rawLine: '', parseConfidence: 1.0
          },
          {
            tradeCode: 'DRY', tradeName: 'Drywall', description: 'Remove drywall room 2',
            quantity: 200, unit: 'SF', unitPrice: 3.60, rcv: 720, acv: 648,
            depreciation: 72, tax: 0, overhead: false, profit: false,
            actionType: 'REMOVE', lineNumber: 2, rawLine: '', parseConfidence: 1.0
          },
          {
            tradeCode: 'DRY', tradeName: 'Drywall', description: 'Remove drywall room 3',
            quantity: 200, unit: 'SF', unitPrice: 3.40, rcv: 680, acv: 612,
            depreciation: 68, tax: 0, overhead: false, profit: false,
            actionType: 'REMOVE', lineNumber: 3, rawLine: '', parseConfidence: 1.0
          },
          {
            tradeCode: 'DRY', tradeName: 'Drywall', description: 'Remove drywall room 4',
            quantity: 200, unit: 'SF', unitPrice: 50.00, rcv: 10000, acv: 9000,
            depreciation: 1000, tax: 0, overhead: false, profit: false,
            actionType: 'REMOVE', lineNumber: 4, rawLine: '', parseConfidence: 1.0
          }
        ],
        totals: { rcv: 12100, acv: 10890, depreciation: 1210, tax: 0, overhead: 0, profit: 0 },
        metadata: {
          confidence: 'HIGH', validationScore: 95, detectedFormat: 'XACTIMATE_TABULAR',
          lineCount: 4, parsedCount: 4, rejectedCount: 0, avgLineConfidence: 1.0,
          warnings: [], columnPattern: null
        }
      };

      const issues = detectAnomalies(estimate);
      const outlier = issues.find(i => i.type === 'PRICE_OUTLIER');
      expect(outlier).toBeDefined();
    });
  });

  describe('Full Validation', () => {
    test('should validate clean estimate with high confidence', () => {
      const estimate: ParsedEstimate = {
        lineItems: [
          {
            tradeCode: 'DRY', tradeName: 'Drywall', description: 'Remove drywall',
            quantity: 200, unit: 'SF', unitPrice: 3.50, rcv: 700, acv: 630,
            depreciation: 70, tax: 0, overhead: false, profit: false,
            actionType: 'REMOVE', lineNumber: 1, rawLine: '', parseConfidence: 1.0
          },
          {
            tradeCode: 'DRY', tradeName: 'Drywall', description: 'Replace drywall',
            quantity: 200, unit: 'SF', unitPrice: 6.00, rcv: 1200, acv: 1200,
            depreciation: 0, tax: 0, overhead: false, profit: false,
            actionType: 'REPLACE', lineNumber: 2, rawLine: '', parseConfidence: 1.0
          },
          {
            tradeCode: 'PNT', tradeName: 'Painting', description: 'Paint walls',
            quantity: 200, unit: 'SF', unitPrice: 2.25, rcv: 450, acv: 450,
            depreciation: 0, tax: 0, overhead: false, profit: false,
            actionType: 'OTHER', lineNumber: 3, rawLine: '', parseConfidence: 1.0
          }
        ],
        totals: { rcv: 2350, acv: 2280, depreciation: 70, tax: 0, overhead: 0, profit: 0 },
        metadata: {
          confidence: 'HIGH', validationScore: 95, detectedFormat: 'XACTIMATE_TABULAR',
          lineCount: 3, parsedCount: 3, rejectedCount: 0, avgLineConfidence: 1.0,
          warnings: [], columnPattern: null
        }
      };

      const result = validateParsedEstimate(estimate);
      
      expect(result.isValid).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.90);
      expect(result.errors.length).toBe(0);
    });

    test('should lower confidence for problematic estimate', () => {
      const estimate: ParsedEstimate = {
        lineItems: [
          {
            tradeCode: 'DRY', tradeName: 'Drywall', description: 'Remove drywall',
            quantity: 200000, // WAY too high
            unit: 'SF', unitPrice: 3.50, rcv: 700000, acv: 630000,
            depreciation: 70000, tax: 0, overhead: false, profit: false,
            actionType: 'REMOVE', lineNumber: 1, rawLine: '', parseConfidence: 1.0
          }
        ],
        totals: { rcv: 700000, acv: 630000, depreciation: 70000, tax: 0, overhead: 0, profit: 0 },
        metadata: {
          confidence: 'HIGH', validationScore: 95, detectedFormat: 'XACTIMATE_TABULAR',
          lineCount: 1, parsedCount: 1, rejectedCount: 0, avgLineConfidence: 1.0,
          warnings: [], columnPattern: null
        }
      };

      const result = validateParsedEstimate(estimate);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.correctedEstimate.metadata.confidence).not.toBe('HIGH');
    });
  });
});
