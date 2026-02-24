# EXPERT INTELLIGENCE ENGINE - QUICK START

**5-Minute Integration Guide**

---

## Installation

Already included in Estimate Review Pro. No additional installation required.

---

## Basic Usage

### 1. Import

```typescript
import { processExpertReport } from './lib/expert-intelligence-engine';
```

### 2. Process Report

```typescript
const result = await processExpertReport(
  reportText,      // Expert report text
  estimate,        // Parsed estimate
  dimensions       // Room dimensions (optional but recommended)
);
```

### 3. Check Results

```typescript
// Confidence check
if (result.expertEngineConfidence < 70) {
  console.warn('Low confidence');
}

// Directives
console.log(`Found ${result.directives.length} directives`);
console.log(`Measurable: ${result.measurableDirectives}`);

// Variances
console.log(`Variances: ${result.variances.length}`);
console.log(`Unaddressed mandatory: ${result.varianceSummary.unaddressedMandatory}`);

// Exposure
console.log(`Exposure: $${result.varianceSummary.totalExposureMin}-${result.varianceSummary.totalExposureMax}`);
```

---

## Complete Example

```typescript
import { processExpertReport } from './lib/expert-intelligence-engine';
import { parseXactimateEstimate } from './lib/xactimate-structural-parser';
import { calculateExpectedQuantities } from './lib/dimension-engine';

// 1. Parse estimate
const estimate = parseXactimateEstimate(estimateText);

// 2. Calculate dimensions
const dimensions = calculateExpectedQuantities({
  rooms: [
    { name: 'Living Room', length: 15, width: 12, height: 8 },
    { name: 'Kitchen', length: 10, width: 10, height: 8 }
  ],
  sourceType: 'MANUAL'
});

// 3. Process expert report
const expertReport = `
  Licensed Professional Engineer Report
  
  Per IICRC S500 water damage restoration standard:
  
  1. Remove and replace all drywall to full height in living room and kitchen
  2. Replace all insulation in affected exterior walls
  3. Remove and replace all flooring in affected areas
`;

const result = await processExpertReport(
  expertReport,
  estimate,
  dimensions,
  {
    reportType: 'Engineering Report',
    reportDate: '2026-02-20',
    author: 'John Smith, P.E.',
    totalPages: 5
  }
);

// 4. Review results
console.log('=== EXPERT INTELLIGENCE REPORT ===');
console.log(`Confidence: ${result.expertEngineConfidence}%`);
console.log(`Authority: ${result.primaryAuthorityType} (${result.authorityWeight})`);
console.log(`Directives: ${result.directives.length}`);
console.log(`Variances: ${result.variances.length}`);
console.log(`Compliance References: ${result.complianceReferences.length}`);

// 5. Review variances
for (const variance of result.variances) {
  console.log(`\n${variance.directive.tradeName}:`);
  console.log(`  Status: ${variance.status}`);
  console.log(`  Severity: ${variance.severity}`);
  console.log(`  Estimate: ${variance.estimateValue} SF`);
  console.log(`  Expected: ${variance.expectedValue} SF`);
  console.log(`  Variance: ${variance.variance} SF (${variance.variancePercent.toFixed(1)}%)`);
  console.log(`  Exposure: $${variance.exposureMin.toLocaleString()}-${variance.exposureMax.toLocaleString()}`);
  console.log(`  Formula: ${variance.formula}`);
}

// 6. Review by trade
console.log('\n=== VARIANCE SUMMARY BY TRADE ===');
for (const trade of result.varianceSummary.byTrade) {
  console.log(`${trade.tradeName}:`);
  console.log(`  Directives: ${trade.directives}`);
  console.log(`  Unaddressed: ${trade.unaddressed}`);
  console.log(`  Exposure: $${trade.exposureMin.toLocaleString()}-${trade.exposureMax.toLocaleString()}`);
}

// 7. Review compliance
console.log('\n=== COMPLIANCE REFERENCES ===');
for (const ref of result.complianceReferences) {
  console.log(`${ref.standard}: ${ref.description}`);
}
```

---

## Integration with Claim Intelligence

```typescript
import { processExpertReport } from './lib/expert-intelligence-engine';
import { generateClaimIntelligence } from './lib/claim-intelligence-engine';

// Process expert report
const expertIntelligence = await processExpertReport(reportText, estimate, dimensions);

// Generate claim intelligence
const claimReport = generateClaimIntelligence({
  estimate,
  exposureAnalysis,
  completenessAnalysis,
  lossExpectation,
  codeAnalysis,
  deviationAnalysis,
  dimensions,
  expertIntelligence  // ← Add this
});

// Access expert intelligence in claim report
console.log(claimReport.expertIntelligence.summary);
console.log(claimReport.expertIntelligence.unaddressedMandatory);
console.log(claimReport.expertIntelligence.exposureMin);
console.log(claimReport.expertIntelligence.exposureMax);
```

---

## Common Patterns

### Check for Conditional Directives

```typescript
const conditionals = result.directives.filter(d => d.conditionalLogic?.conditional);

for (const directive of conditionals) {
  console.log(`Conditional: ${directive.conditionalLogic.conditionDescription}`);
  console.log(`Verified: ${directive.conditionalLogic.verified}`);
}
```

### Filter by Priority

```typescript
const mandatory = result.directives.filter(d => d.priority === 'MANDATORY');
const recommended = result.directives.filter(d => d.priority === 'RECOMMENDED');

console.log(`Mandatory: ${mandatory.length}`);
console.log(`Recommended: ${recommended.length}`);
```

### Filter by Trade

```typescript
const drywallDirectives = result.directives.filter(d => d.trade === 'DRY');
const insulationDirectives = result.directives.filter(d => d.trade === 'INS');

console.log(`Drywall directives: ${drywallDirectives.length}`);
console.log(`Insulation directives: ${insulationDirectives.length}`);
```

### Get Unaddressed Mandatory Directives

```typescript
const unaddressed = result.variances.filter(v => 
  v.directive.priority === 'MANDATORY' && 
  v.status === 'UNADDRESSED'
);

console.log(`Unaddressed mandatory: ${unaddressed.length}`);

for (const variance of unaddressed) {
  console.log(`${variance.directive.tradeName}: ${variance.directive.rawText}`);
  console.log(`  Exposure: $${variance.exposureMin}-${variance.exposureMax}`);
}
```

---

## Error Handling

```typescript
try {
  const result = await processExpertReport(reportText, estimate, dimensions);
  
  // Check confidence
  if (result.expertEngineConfidence < 70) {
    console.warn('Low confidence - review warnings:');
    result.auditTrail.extractionWarnings.forEach(w => console.warn(`  - ${w}`));
  }
  
  // Check for extraction issues
  if (result.measurableDirectives === 0) {
    console.warn('No measurable directives found');
  }
  
  // Process results
  // ...
  
} catch (error) {
  console.error('Expert report processing failed:', error.message);
}
```

---

## Best Practices

### 1. Always Provide Dimensions

```typescript
// ❌ BAD
const result = await processExpertReport(reportText, estimate);

// ✅ GOOD
const result = await processExpertReport(reportText, estimate, dimensions);
```

### 2. Check Confidence Before Using Results

```typescript
const result = await processExpertReport(reportText, estimate, dimensions);

if (result.expertEngineConfidence >= 70) {
  // High confidence - use results
  processVariances(result.variances);
} else {
  // Low confidence - flag for manual review
  flagForManualReview(result);
}
```

### 3. Review Conditional Directives

```typescript
const conditionals = result.directives.filter(d => d.conditionalLogic?.conditional);

if (conditionals.length > 0) {
  console.log('Conditional directives require verification:');
  conditionals.forEach(d => {
    console.log(`  - ${d.conditionalLogic.conditionDescription}`);
  });
}
```

### 4. Validate Room Mapping

```typescript
const unmapped = result.directives.filter(d => d.roomMapping && !d.roomMapping.mapped);

if (unmapped.length > 0) {
  console.warn(`${unmapped.length} directives could not be mapped to rooms`);
}
```

---

## Testing

```bash
# Run all tests
npm test expert-intelligence-engine

# Run specific test
npm test expert-intelligence-engine -- -t "Full Height Directive"
```

---

## Documentation

- **Full Documentation:** [docs/EXPERT_INTELLIGENCE_ENGINE.md](EXPERT_INTELLIGENCE_ENGINE.md)
- **Build Summary:** [EXPERT_INTELLIGENCE_BUILD_COMPLETE.md](../EXPERT_INTELLIGENCE_BUILD_COMPLETE.md)
- **Architecture:** [docs/ARCHITECTURE.md](ARCHITECTURE.md)
- **API Reference:** [docs/API_DOCUMENTATION.md](API_DOCUMENTATION.md)

---

## Support

### Common Issues

**Issue:** Low confidence score

**Solution:** Check extraction warnings in `result.auditTrail.extractionWarnings`

---

**Issue:** No variances calculated

**Solution:** Ensure dimensions are provided and directives are measurable

---

**Issue:** Room mapping failed

**Solution:** Verify room names in report match dimension data

---

## Quick Reference

### Key Types

```typescript
ExpertDirective
DirectiveVariance
ExpertVarianceSummary
ExpertIntelligenceReport
```

### Key Functions

```typescript
processExpertReport()
processExpertReportPDF()
```

### Key Fields

```typescript
result.expertEngineConfidence
result.directives
result.variances
result.varianceSummary
result.complianceReferences
```

---

**Ready to use. Start processing expert reports now.**
