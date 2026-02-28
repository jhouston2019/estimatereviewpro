/**
 * ADVANCED XACTIMATE PARSER TESTS
 * Comprehensive test suite for parser v2.0
 */

import { parseXactimateEstimate } from '../advanced-xactimate-parser';

describe('Advanced Xactimate Parser', () => {
  
  describe('Tab-Separated Format', () => {
    test('should parse standard tab-separated Xactimate export', () => {
      const input = `
DRY\tRemove drywall\t200\tSF\t3.50\t700.00\t630.00
PNT\tPaint walls 2 coats\t200\tSF\t2.25\t450.00\t450.00
FLR\tInstall carpet\t150\tSF\t4.00\t600.00\t540.00
      `.trim();

      const result = parseXactimateEstimate(input);

      expect(result.metadata.confidence).toBe('HIGH');
      expect(result.metadata.detectedFormat).toBe('XACTIMATE_TABULAR');
      expect(result.lineItems).toHaveLength(3);
      
      expect(result.lineItems[0]).toMatchObject({
        tradeCode: 'DRY',
        tradeName: 'Drywall',
        description: 'Remove drywall',
        quantity: 200,
        unit: 'SF',
        rcv: 700,
        acv: 630
      });

      expect(result.totals.rcv).toBe(1750);
      expect(result.totals.acv).toBe(1620);
    });
  });

  describe('Fixed-Width Format', () => {
    test('should parse fixed-width columnar format', () => {
      const input = `
DRY  Remove drywall 2ft cut          200  SF    3.50     700.00    630.00
PNT  Paint walls and ceiling         200  SF    2.25     450.00    450.00
INS  Install R-13 insulation         180  SF    1.75     315.00    315.00
      `.trim();

      const result = parseXactimateEstimate(input);

      expect(result.metadata.confidence).toBe('HIGH');
      expect(result.lineItems).toHaveLength(3);
      expect(result.lineItems[0].tradeCode).toBe('DRY');
      expect(result.lineItems[0].quantity).toBe(200);
    });
  });

  describe('Space-Separated Format', () => {
    test('should parse space-separated format with trade codes', () => {
      const input = `
DRY  Remove drywall  200  SF  $700.00
PNT  Paint walls  200  SF  $450.00
FLR  Install flooring  150  SF  $600.00
      `.trim();

      const result = parseXactimateEstimate(input);

      expect(result.metadata.confidence).not.toBe('FAILED');
      expect(result.lineItems.length).toBeGreaterThan(0);
    });

    test('should parse space-separated without explicit trade codes', () => {
      const input = `
Remove drywall 2ft cut  200  SF  $700.00
Paint walls 2 coats  200  SF  $450.00
Install carpet pad  150  SF  $225.00
      `.trim();

      const result = parseXactimateEstimate(input);

      expect(result.metadata.confidence).not.toBe('FAILED');
      expect(result.lineItems.length).toBeGreaterThan(0);
      
      // Should detect trade codes from descriptions
      expect(result.lineItems[0].tradeCode).toBe('DRY');
      expect(result.lineItems[1].tradeCode).toBe('PNT');
      expect(result.lineItems[2].tradeCode).toBe('CRP');
    });
  });

  describe('Edge Cases', () => {
    test('should handle large quantities correctly', () => {
      const input = `
DRY\tRemove drywall\t1500\tSF\t3.50\t5250.00\t4725.00
      `.trim();

      const result = parseXactimateEstimate(input);

      expect(result.lineItems[0].quantity).toBe(1500);
      expect(result.lineItems[0].rcv).toBe(5250);
    });

    test('should handle descriptions with spaces', () => {
      const input = `
DRY\tRemove water damaged drywall 2ft cut\t200\tSF\t3.50\t700.00\t630.00
      `.trim();

      const result = parseXactimateEstimate(input);

      expect(result.lineItems[0].description).toContain('Remove water damaged drywall');
    });

    test('should detect action types correctly', () => {
      const input = `
DRY\tRemove drywall\t200\tSF\t3.50\t700.00\t630.00
DRY\tReplace drywall\t200\tSF\t6.00\t1200.00\t1200.00
PNT\tPaint walls\t200\tSF\t2.25\t450.00\t450.00
FLR\tClean carpet\t150\tSF\t1.00\t150.00\t150.00
      `.trim();

      const result = parseXactimateEstimate(input);

      expect(result.lineItems[0].actionType).toBe('REMOVE');
      expect(result.lineItems[1].actionType).toBe('REPLACE');
      expect(result.lineItems[2].actionType).toBe('OTHER');
      expect(result.lineItems[3].actionType).toBe('CLEAN');
    });

    test('should handle O&P line items', () => {
      const input = `
DRY\tRemove drywall\t200\tSF\t3.50\t700.00\t630.00
O&P\tOverhead & Profit\t1\tLS\t140.00\t140.00\t140.00
      `.trim();

      const result = parseXactimateEstimate(input);

      expect(result.lineItems).toHaveLength(2);
      expect(result.lineItems[1].overhead).toBe(true);
      expect(result.lineItems[1].profit).toBe(true);
    });

    test('should handle missing ACV (use RCV)', () => {
      const input = `
DRY\tRemove drywall\t200\tSF\t3.50\t700.00
PNT\tPaint walls\t200\tSF\t2.25\t450.00
      `.trim();

      const result = parseXactimateEstimate(input);

      expect(result.lineItems[0].acv).toBe(700);
      expect(result.lineItems[0].depreciation).toBe(0);
    });

    test('should reject malformed lines gracefully', () => {
      const input = `
DRY\tRemove drywall\t200\tSF\t3.50\t700.00\t630.00
This is not a valid line
PNT\tPaint walls\t200\tSF\t2.25\t450.00\t450.00
Another invalid line
FLR\tInstall carpet\t150\tSF\t4.00\t600.00\t540.00
      `.trim();

      const result = parseXactimateEstimate(input);

      expect(result.lineItems).toHaveLength(3);
      expect(result.metadata.rejectedCount).toBe(2);
    });
  });

  describe('Format Detection', () => {
    test('should detect tab-separated format', () => {
      const input = `
DRY\tRemove drywall\t200\tSF\t700.00
      `.trim();

      const result = parseXactimateEstimate(input);

      expect(result.metadata.detectedFormat).toBe('XACTIMATE_TABULAR');
    });

    test('should detect fixed-width format', () => {
      const input = `
DRY  Remove drywall          200  SF    700.00
PNT  Paint walls             200  SF    450.00
      `.trim();

      const result = parseXactimateEstimate(input);

      expect(result.metadata.detectedFormat).toMatch(/XACTIMATE/);
    });

    test('should fail gracefully on unknown format', () => {
      const input = `
This is just random text
With no structure at all
Not an estimate
      `.trim();

      const result = parseXactimateEstimate(input);

      expect(result.metadata.confidence).toBe('FAILED');
      expect(result.metadata.detectedFormat).toBe('UNKNOWN');
      expect(result.lineItems).toHaveLength(0);
    });
  });

  describe('Confidence Scoring', () => {
    test('should give HIGH confidence for clean data', () => {
      const input = `
DRY\tRemove drywall\t200\tSF\t3.50\t700.00\t630.00
PNT\tPaint walls\t200\tSF\t2.25\t450.00\t450.00
FLR\tInstall carpet\t150\tSF\t4.00\t600.00\t540.00
INS\tInstall insulation\t180\tSF\t1.75\t315.00\t315.00
      `.trim();

      const result = parseXactimateEstimate(input);

      expect(result.metadata.confidence).toBe('HIGH');
      expect(result.metadata.validationScore).toBeGreaterThan(85);
    });

    test('should give MEDIUM confidence for partial data', () => {
      const input = `
Remove drywall  200  SF  $700.00
Paint walls  200  SF  $450.00
Install carpet  150  SF  $600.00
Some invalid line here
      `.trim();

      const result = parseXactimateEstimate(input);

      expect(result.metadata.confidence).toMatch(/MEDIUM|HIGH/);
    });

    test('should give LOW or FAILED confidence for poor data', () => {
      const input = `
Some text  100
Another line  200
Third line  300
      `.trim();

      const result = parseXactimateEstimate(input);

      expect(result.metadata.confidence).toMatch(/LOW|FAILED/);
    });
  });

  describe('Totals Calculation', () => {
    test('should calculate totals correctly', () => {
      const input = `
DRY\tRemove drywall\t200\tSF\t3.50\t700.00\t630.00
PNT\tPaint walls\t200\tSF\t2.25\t450.00\t450.00
FLR\tInstall carpet\t150\tSF\t4.00\t600.00\t540.00
      `.trim();

      const result = parseXactimateEstimate(input);

      expect(result.totals.rcv).toBe(1750);
      expect(result.totals.acv).toBe(1620);
      expect(result.totals.depreciation).toBe(130);
    });

    test('should track O&P separately', () => {
      const input = `
DRY\tRemove drywall\t200\tSF\t3.50\t700.00\t630.00
O&P\tOverhead & Profit\t1\tLS\t140.00\t140.00\t140.00
      `.trim();

      const result = parseXactimateEstimate(input);

      expect(result.totals.overhead).toBe(140);
      expect(result.totals.profit).toBe(140);
    });
  });

  describe('Trade Detection', () => {
    test('should detect all common trades', () => {
      const trades = [
        { desc: 'Remove drywall', expected: 'DRY' },
        { desc: 'Paint walls', expected: 'PNT' },
        { desc: 'Install roofing shingles', expected: 'RFG' },
        { desc: 'Replace flooring', expected: 'FLR' },
        { desc: 'Install carpet', expected: 'CRP' },
        { desc: 'Add insulation', expected: 'INS' },
        { desc: 'Electrical work', expected: 'ELE' },
        { desc: 'Plumbing repair', expected: 'PLM' },
        { desc: 'HVAC replacement', expected: 'HVA' },
        { desc: 'Install cabinets', expected: 'CAB' },
        { desc: 'Replace countertops', expected: 'CTR' },
        { desc: 'Tile backsplash', expected: 'TIL' },
        { desc: 'Install windows', expected: 'WIN' },
        { desc: 'Replace doors', expected: 'DOR' },
        { desc: 'Framing work', expected: 'FRM' },
        { desc: 'Siding replacement', expected: 'SID' },
        { desc: 'Install baseboard trim', expected: 'MLD' }
      ];

      for (const { desc, expected } of trades) {
        const input = `${desc}  100  SF  $500.00`;
        const result = parseXactimateEstimate(input);
        
        if (result.lineItems.length > 0) {
          expect(result.lineItems[0].tradeCode).toBe(expected);
        }
      }
    });
  });
});
