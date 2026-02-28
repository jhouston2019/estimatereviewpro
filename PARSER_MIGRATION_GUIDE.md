# Parser Migration Guide - v1.0 → v2.0

## Quick Migration (5 minutes)

### Step 1: Update Import Statement

Find all files that import the old parser and update them:

**Files to update:**
- `pages/api/claim-intelligence-v2.ts`
- `lib/claim-intelligence-engine.ts`
- Any other files using `parseXactimateEstimate`

**Change:**
```typescript
// OLD
import { parseXactimateEstimate } from '@/lib/xactimate-parser';

// NEW
import { parseXactimateEstimate } from '@/lib/advanced-xactimate-parser';
```

That's it! The API is 100% compatible.

---

## Step 2: Run Tests

```bash
npm run test -- advanced-parser.test.ts
```

Expected output:
```
Test Suites: 1 passed, 1 total
Tests:       19 passed, 19 total
```

---

## Step 3: Test with Sample Estimate

Create a test file `test-parser.ts`:

```typescript
import { parseXactimateEstimate } from './lib/advanced-xactimate-parser';

const sampleEstimate = `
DRY\tRemove drywall\t200\tSF\t3.50\t700.00\t630.00
PNT\tPaint walls 2 coats\t200\tSF\t2.25\t450.00\t450.00
FLR\tInstall carpet\t150\tSF\t4.00\t600.00\t540.00
`;

const result = parseXactimateEstimate(sampleEstimate);

console.log('Format:', result.metadata.detectedFormat);
console.log('Confidence:', result.metadata.confidence);
console.log('Validation Score:', result.metadata.validationScore);
console.log('Line Items:', result.lineItems.length);
console.log('Total RCV:', result.totals.rcv);
console.log('Total ACV:', result.totals.acv);
```

Run it:
```bash
npx ts-node test-parser.ts
```

Expected output:
```
Format: XACTIMATE_TABULAR
Confidence: HIGH
Validation Score: 95
Line Items: 3
Total RCV: 1750
Total ACV: 1620
```

---

## Step 4: Deploy

### Option A: Immediate Deployment (Recommended)
```bash
# Build
npm run build

# Deploy
npm run deploy
```

### Option B: Gradual Rollout (Conservative)

Use both parsers with feature flag:

```typescript
// lib/parser-wrapper.ts
import { parseXactimateEstimate as parseV2 } from '@/lib/advanced-xactimate-parser';
import { parseXactimateEstimate as parseV1 } from '@/lib/xactimate-parser';

export function parseEstimate(text: string, useV2 = true) {
  if (!useV2) {
    return parseV1(text);
  }

  const resultV2 = parseV2(text);
  
  // Fallback to v1 if v2 fails
  if (resultV2.metadata.confidence === 'FAILED') {
    console.warn('Parser v2 failed, falling back to v1');
    return parseV1(text);
  }
  
  return resultV2;
}
```

Then gradually enable v2 for more users:
```typescript
const useV2 = Math.random() < 0.50; // 50% rollout
const result = parseEstimate(text, useV2);
```

---

## Rollback Plan

If you need to rollback:

```typescript
// Change back to:
import { parseXactimateEstimate } from '@/lib/xactimate-parser';

// Redeploy
npm run build && npm run deploy
```

---

## Monitoring

After deployment, monitor these metrics:

```typescript
// Add to your analytics
{
  parserVersion: '2.0',
  detectedFormat: result.metadata.detectedFormat,
  confidence: result.metadata.confidence,
  validationScore: result.metadata.validationScore,
  parsedLines: result.metadata.parsedCount,
  rejectedLines: result.metadata.rejectedCount,
  processingTime: Date.now() - startTime
}
```

---

## Troubleshooting

### Issue: "Module not found"
**Solution:** Check file path in import statement

### Issue: "Type errors"
**Solution:** The types are identical, but run `npm run build` to regenerate

### Issue: "Tests failing"
**Solution:** Run `npm install` to ensure dependencies are up to date

### Issue: "Lower accuracy than expected"
**Solution:** Check the format detection:
```typescript
console.log('Format:', result.metadata.detectedFormat);
console.log('Warnings:', result.metadata.warnings);
```

---

## Success Criteria

✅ All tests passing  
✅ Build successful  
✅ Sample estimates parsing correctly  
✅ Confidence scores HIGH or MEDIUM  
✅ No increase in error rate  

---

**Estimated Migration Time:** 5-10 minutes  
**Risk Level:** Low (API compatible)  
**Rollback Time:** 2 minutes
