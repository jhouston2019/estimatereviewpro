# OpenAI Prompts Documentation - Estimate Review Pro

## Overview

This document explains the production-ready OpenAI prompts used throughout Estimate Review Pro. All prompts are designed for maximum reliability, accuracy, and defensive parsing.

---

## Design Principles

### 1. **Zero Ambiguity**
- Every instruction is explicit and unambiguous
- No room for model interpretation or creativity
- Clear success criteria defined

### 2. **JSON-Only Output**
- All responses must be valid JSON
- Structured data for reliable parsing
- No prose before or after JSON

### 3. **Defensive Parsing**
- Handle OCR errors gracefully
- Normalize inconsistent formats
- Never fail due to missing data
- Provide best-effort extraction

### 4. **Production Reliability**
- Tested prompts with real-world documents
- Handle edge cases (scanned PDFs, handwritten notes, photos)
- Consistent output format
- Validation functions included

---

## Prompt 1: Estimate Extraction

### Purpose
Extract all line items from contractor or carrier estimates with perfect accuracy.

### System Prompt: `ESTIMATE_EXTRACTION_SYSTEM`

**Key Features:**
- Handles Xactimate, Symbility, and custom formats
- OCR noise repair
- Trade normalization (15+ standard categories)
- Unit standardization (SF, SY, LF, EA, HR, etc.)
- Automatic total calculation
- Duplicate removal

**Special Handling:**
- Xactimate codes (e.g., "RFG SHNG - Shingles")
- Room codes (e.g., "KIT - Kitchen")
- RCV vs ACV values
- Depreciation notes
- Waste factors

**Output Structure:**
```typescript
{
  items: ParsedLineItem[];
  metadata: {
    totalAmount: number;
    itemCount: number;
    documentType: string;
    extractedAt: string;
  };
}
```

### User Prompt: `ESTIMATE_EXTRACTION_USER(documentType)`

**Parameters:**
- `documentType`: "contractor" | "carrier"

**Instructions:**
1. Extract every line item
2. Normalize trades and units
3. Calculate missing values
4. Fix OCR errors
5. Remove duplicates
6. Include notes for assumptions

**Example Usage:**
```typescript
const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    { role: "system", content: ESTIMATE_EXTRACTION_SYSTEM },
    { role: "user", content: ESTIMATE_EXTRACTION_USER("contractor") }
  ],
  response_format: { type: "json_object" }
});
```

---

## Prompt 2: Estimate Comparison

### Purpose
Compare contractor vs carrier estimates to identify discrepancies that harm policyholders.

### System Prompt: `ESTIMATE_COMPARISON_SYSTEM`

**Analysis Tasks:**

1. **Missing Items**
   - Items in contractor but not in carrier
   - Entire rooms/areas omitted
   - Required code upgrades excluded
   - Necessary prep work missing

2. **Underpriced Items**
   - Carrier price < contractor by >10%
   - Insufficient quantities
   - Lower quality materials
   - Inadequate labor hours

3. **Trade Mismatches**
   - Wrong categorization
   - Work split incorrectly
   - Specialized work as general labor

4. **Depreciation Issues**
   - Excessive depreciation
   - Depreciation on non-depreciable items
   - Incorrect useful life assumptions

5. **Low Allowances**
   - Underestimated permit fees
   - Low disposal costs
   - Inadequate overhead & profit

**Matching Algorithm:**
- Fuzzy description matching (>70% similarity)
- Match by trade + room + material
- Account for OCR variations
- Price tolerance: >10% difference
- Quantity tolerance: >5% difference

**Output Structure:**
```typescript
{
  missingItems: Array<{ item, reason }>;
  underpricedItems: Array<{ contractorItem, carrierItem, priceDifference, percentDifference, reason }>;
  tradeMismatches: Array<{ item, expectedTrade, actualTrade, reason }>;
  deprecationIssues: Array<{ item, expectedValue, actualValue, reason }>;
  summary: {
    contractorTotal: number;
    carrierTotal: number;
    difference: number;
    percentDifference: number;
    keyFindings: string[];
  };
}
```

### User Prompt: `ESTIMATE_COMPARISON_USER(contractorItems, carrierItems)`

**Parameters:**
- `contractorItems`: ParsedLineItem[]
- `carrierItems`: ParsedLineItem[]

**Instructions:**
1. Identify missing items
2. Identify underpriced items (>10% difference)
3. Identify miscategorized items
4. Identify depreciation issues
5. Calculate total financial impact
6. Generate 3-5 key findings

**Example Usage:**
```typescript
const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    { role: "system", content: ESTIMATE_COMPARISON_SYSTEM },
    { role: "user", content: ESTIMATE_COMPARISON_USER(contractorItems, carrierItems) }
  ],
  response_format: { type: "json_object" }
});
```

---

## Prompt 3: Report Summary

### Purpose
Translate complex carrier letters and engineer reports into plain English with actionable recommendations.

### System Prompt: `REPORT_SUMMARY_SYSTEM`

**Analysis Tasks:**

1. **Plain English Summary**
   - Translate technical jargon
   - Explain approval/denial reasoning
   - 2-3 paragraphs max
   - 8th grade reading level

2. **Extract Key Findings**
   - What was approved/denied and why
   - Coverage determinations
   - Causation conclusions
   - Policy provisions cited

3. **Identify Approval Status**
   - approved / denied / partial / unclear

4. **Extract Technical Points**
   - Engineering findings
   - Material specifications
   - Code requirements
   - Expert opinions

5. **Identify Contradictions**
   - Conflicting statements
   - Conclusions vs evidence mismatches
   - Photo vs written discrepancies

6. **Identify Weak Logic**
   - Unsupported conclusions
   - Assumptions as facts
   - Circular reasoning
   - Cherry-picked evidence

7. **Identify Missing Evidence**
   - Claims without documentation
   - Tests not performed
   - Missing photos
   - Absent expert opinions

8. **Recommend Actions**
   - Specific next steps
   - Evidence to gather
   - Experts to consult
   - Questions to ask
   - Appeal strategies

**Output Structure:**
```typescript
{
  plainEnglishSummary: string;
  keyFindings: string[];
  approvalStatus: "approved" | "denied" | "partial" | "unclear";
  technicalPoints: string[];
  contradictions: string[];
  weakLogic: string[];
  missingEvidence: string[];
  recommendedActions: string[];
}
```

### User Prompt: `REPORT_SUMMARY_USER`

**Instructions:**
1. Read entire document
2. Translate to plain English
3. Extract all key findings
4. Identify approval status
5. List technical points
6. Identify contradictions
7. Identify weak logic
8. Note missing evidence
9. Provide actionable recommendations

**Example Usage:**
```typescript
const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    { role: "system", content: REPORT_SUMMARY_SYSTEM },
    { role: "user", content: REPORT_SUMMARY_USER }
  ],
  response_format: { type: "json_object" }
});
```

---

## Validation Functions

### `validateLineItem(item)`
Ensures line item has all required fields and correct types.

```typescript
validateLineItem(item: any): item is ParsedLineItem
```

### `validateExtractionResult(result)`
Validates extraction result structure.

```typescript
validateExtractionResult(result: any): result is EstimateExtractionResult
```

### `validateComparisonResult(result)`
Validates comparison result structure.

```typescript
validateComparisonResult(result: any): result is EstimateComparisonResult
```

### `validateReportSummary(result)`
Validates report summary structure.

```typescript
validateReportSummary(result: any): result is ReportSummary
```

---

## Usage in Netlify Functions

### analyze-estimate.ts
```typescript
import { ESTIMATE_EXTRACTION_SYSTEM, ESTIMATE_EXTRACTION_USER } from "../../lib/ai/prompts";

const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    { role: "system", content: ESTIMATE_EXTRACTION_SYSTEM },
    { role: "user", content: ESTIMATE_EXTRACTION_USER("contractor") }
  ],
  response_format: { type: "json_object" }
});
```

### compare-estimates.ts
```typescript
import { ESTIMATE_COMPARISON_SYSTEM, ESTIMATE_COMPARISON_USER } from "../../lib/ai/prompts";

const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    { role: "system", content: ESTIMATE_COMPARISON_SYSTEM },
    { role: "user", content: ESTIMATE_COMPARISON_USER(contractorItems, carrierItems) }
  ],
  response_format: { type: "json_object" }
});
```

### summarize-report.ts
```typescript
import { REPORT_SUMMARY_SYSTEM, REPORT_SUMMARY_USER } from "../../lib/ai/prompts";

const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    { role: "system", content: REPORT_SUMMARY_SYSTEM },
    { role: "user", content: REPORT_SUMMARY_USER }
  ],
  response_format: { type: "json_object" }
});
```

---

## Testing Prompts

### Test with Sample Documents

1. **Simple Estimate** (5-10 items)
   - Verify all items extracted
   - Check trade normalization
   - Validate calculations

2. **Complex Estimate** (50+ items)
   - Verify no items missed
   - Check performance
   - Validate totals

3. **Scanned PDF** (OCR required)
   - Verify OCR error handling
   - Check text repair
   - Validate accuracy

4. **Handwritten Notes**
   - Verify legibility handling
   - Check interpretation
   - Validate assumptions

5. **Xactimate Format**
   - Verify code parsing
   - Check room extraction
   - Validate RCV/ACV handling

### Test Comparison Logic

1. **Identical Estimates**
   - Should find no discrepancies
   - Summary should note similarity

2. **Missing Items**
   - Should identify all missing items
   - Reasons should be clear

3. **Underpriced Items**
   - Should flag >10% differences
   - Calculations should be accurate

4. **Miscategorized Items**
   - Should identify wrong trades
   - Suggestions should be correct

### Test Report Summary

1. **Approval Letter**
   - Status should be "approved"
   - Summary should be positive
   - Actions should be minimal

2. **Denial Letter**
   - Status should be "denied"
   - Contradictions should be identified
   - Actions should be comprehensive

3. **Partial Approval**
   - Status should be "partial"
   - Both approved and denied items noted
   - Actions should address denials

---

## Prompt Maintenance

### When to Update Prompts

1. **New Document Formats**
   - Add handling instructions
   - Update examples
   - Test thoroughly

2. **Accuracy Issues**
   - Analyze failure cases
   - Add specific instructions
   - Validate improvements

3. **New Requirements**
   - Extend output structure
   - Add new analysis tasks
   - Update validation

### Version Control

- All prompt changes should be tracked in git
- Test before deploying to production
- Keep old versions for rollback
- Document changes in commit messages

---

## Cost Optimization

### Token Usage

**Estimate Extraction:**
- System prompt: ~1,500 tokens
- User prompt: ~200 tokens
- Image: ~500-2,000 tokens (varies by size)
- Response: ~1,000-3,000 tokens
- **Total: ~3,200-6,700 tokens per estimate**

**Estimate Comparison:**
- System prompt: ~2,000 tokens
- User prompt: ~500-5,000 tokens (depends on item count)
- Response: ~1,000-2,000 tokens
- **Total: ~3,500-9,000 tokens per comparison**

**Report Summary:**
- System prompt: ~2,500 tokens
- User prompt: ~200 tokens
- Image: ~500-2,000 tokens
- Response: ~800-1,500 tokens
- **Total: ~4,000-6,200 tokens per summary**

### Cost Per Review

**Typical review (contractor + carrier + report):**
- Extraction: 2 × 5,000 tokens = 10,000 tokens
- Comparison: 6,000 tokens
- Summary: 5,000 tokens
- **Total: ~21,000 tokens**

**GPT-4o Pricing:**
- Input: $2.50 per 1M tokens
- Output: $10.00 per 1M tokens
- **Cost per review: ~$0.10-0.50**

---

## Troubleshooting

### Issue: Incomplete Extraction

**Symptoms:** Missing line items, incomplete data

**Solutions:**
1. Check image quality (min 300 DPI recommended)
2. Verify file size (max 20MB)
3. Try re-uploading with better scan
4. Check prompt includes "extract ALL items"

### Issue: Incorrect Comparisons

**Symptoms:** False positives, missed discrepancies

**Solutions:**
1. Verify both estimates extracted correctly
2. Check matching algorithm tolerance (10%)
3. Review trade normalization
4. Validate item descriptions

### Issue: Poor Summaries

**Symptoms:** Missing key points, unclear language

**Solutions:**
1. Check document quality
2. Verify technical terms extracted
3. Review contradiction detection
4. Validate recommended actions

---

## Best Practices

1. **Always validate responses** - Use validation functions
2. **Handle errors gracefully** - Provide fallbacks
3. **Log all API calls** - For debugging and auditing
4. **Monitor token usage** - Track costs
5. **Test with real documents** - Not just samples
6. **Update prompts iteratively** - Based on real-world performance
7. **Keep prompts version-controlled** - Track changes
8. **Document all changes** - Explain why prompts were updated

---

## Future Enhancements

1. **Multi-language support** - Spanish, French, etc.
2. **Custom trade categories** - User-defined trades
3. **Learning from corrections** - Improve over time
4. **Batch processing** - Multiple estimates at once
5. **Confidence scores** - Flag uncertain extractions
6. **Alternative models** - Test Claude, Gemini, etc.

---

**Last Updated:** December 2024  
**Version:** 1.0  
**Status:** Production Ready ✅

