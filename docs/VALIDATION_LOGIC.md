# VALIDATION LOGIC

**Version:** 1.0.0  
**Last Updated:** 2026-02-10

---

## OVERVIEW

All validation in ERP follows a **strict, deterministic, fail-fast** approach. Invalid inputs are rejected with structured errors containing remediation guidance. No silent failures, no guessing, no heuristic fallbacks.

---

## INPUT VALIDATION

### 1. FILE VALIDATION

**Security Checks:**
```typescript
✓ File type whitelist (PDF, TXT, CSV, JPG, PNG)
✓ MIME type validation (magic bytes)
✓ Executable content detection (PE, ELF, Mach-O headers)
✓ Filename sanitization (no .., no path separators)
✓ Size limits (10 MB max)
✓ Empty file rejection
```

**Implementation:** `lib/security-guards.ts`

**Rejection Criteria:**
- File size > 10 MB → `FILE_TOO_LARGE`
- Invalid extension → `INVALID_FILE_EXTENSION`
- MIME mismatch → `MIME_TYPE_MISMATCH`
- Executable detected → `EXECUTABLE_DETECTED`
- Directory traversal → `INVALID_FILENAME_PATTERN`

---

### 2. ESTIMATE VALIDATION

**Parse Confidence:**
```typescript
if (parseConfidence < 0.75) {
  throw ValidationError('LOW_PARSE_CONFIDENCE', ...)
}
```

**Line Items:**
```typescript
✓ At least 1 line item required
✓ All quantities must be numeric (no NaN, no Infinity)
✓ All RCV values must be numeric and > 0
✓ Trade codes must be recognized
✓ Max 1,000 line items
```

**Totals:**
```typescript
✓ Total RCV > 0
✓ Total ACV ≥ 0
✓ Depreciation ≥ 0
```

**Implementation:** `lib/validation-engine.ts → validateEstimate()`

---

### 3. DIMENSION VALIDATION

**Room Requirements:**
```typescript
✓ At least 1 room required
✓ Each room must have: name, length, width, height
✓ Length > 0
✓ Width > 0
✓ Height > 0 (typically 6-20 ft)
✓ Max 50 rooms
```

**Sanity Checks:**
```typescript
⚠ Length > 100 ft → Warning (unusual)
⚠ Width > 100 ft → Warning (unusual)
⚠ Height < 6 ft or > 20 ft → Warning (unusual)
```

**Implementation:** `lib/validation-engine.ts → validateDimensions()`

---

### 4. EXPERT REPORT VALIDATION

**Directive Extraction:**
```typescript
✓ At least 1 directive extracted (or warning)
✓ Measurable directives identified
✓ Parse confidence logged
```

**No Hard Failures:**
- Reports with zero directives generate warnings, not errors
- Low confidence logged but not rejected

**Implementation:** `lib/validation-engine.ts → validateReport()`

---

### 5. CSV VALIDATION

**Structure:**
```typescript
✓ At least 2 lines (header + data)
✓ Consistent column count
✓ No null bytes
✓ No control characters (except \n, \r, \t)
✓ Max line length: 10,000 characters
```

**Implementation:** `lib/validation-engine.ts → validateCSVStructure()`

---

## CALCULATION VALIDATION

### 1. HEIGHT EXTRACTION VALIDATION

**Rules:**
```typescript
ExtractedHeight = Quantity SF ÷ Perimeter LF

Validation:
✓ Perimeter > 0 (reject if zero)
✓ Quantity > 0 (reject if zero)
✓ ExtractedHeight ≤ Room.Height (reject if exceeds)
```

**Error Handling:**
```typescript
if (extractedHeight > room.height) {
  throw CalculationError(
    'HEIGHT_EXCEEDS_CEILING',
    `Extracted height ${extractedHeight} ft exceeds ceiling ${room.height} ft`,
    'Ceiling may be included in wall removal quantity. Separate line items.'
  )
}
```

**Implementation:** `lib/height-extraction-engine.ts`

---

### 2. PERIMETER VALIDATION

**Rules:**
```typescript
Perimeter = 2 × (Length + Width)

Validation:
✓ Perimeter > 0
✓ Perimeter is finite
✓ Perimeter is not NaN
```

**Error Handling:**
```typescript
if (perimeter <= 0) {
  throw DimensionError(
    'ZERO_PERIMETER',
    `Room "${roomName}" has zero perimeter`,
    'Check length and width values'
  )
}
```

**Implementation:** `lib/validation-engine.ts → validatePerimeter()`

---

### 3. DELTA VALIDATION

**Rules:**
```typescript
DeltaSF = ReportSF - EstimateSF

Validation:
✓ DeltaSF ≥ 0 (cap negative at 0)
✓ DeltaSF is finite
✓ DeltaSF is not NaN
✓ DeltaSF ≤ 2 × ExpectedSF (sanity check)
```

**Error Handling:**
```typescript
if (deltaSF < 0) {
  // Cap at zero, return null (no deviation)
  return null;
}

if (deltaSF > expectedSF * 2) {
  throw CalculationError('INVALID_DELTA', ...)
}
```

**Implementation:** `lib/validation-engine.ts → validateDelta()`

---

### 4. EXPOSURE RANGE VALIDATION

**Rules:**
```typescript
Exposure = DeltaSF × CostPerUnit

Validation:
✓ Min ≥ 0
✓ Max ≥ 0
✓ Min ≤ Max
✓ Both are finite
✓ Both are not NaN
```

**Error Handling:**
```typescript
if (min > max) {
  throw CalculationError(
    'INVALID_EXPOSURE_RANGE',
    `Min exposure ($${min}) exceeds max ($${max})`,
    'Internal calculation error'
  )
}
```

**Implementation:** `lib/validation-engine.ts → validateDeviationOutput()`

---

### 5. RISK SCORE VALIDATION

**Rules:**
```typescript
ConsolidatedRiskScore ∈ [0, 100]

Validation:
✓ Is numeric
✓ Is finite
✓ Is not NaN
✓ 0 ≤ Score ≤ 100
```

**Error Handling:**
```typescript
if (score < 0 || score > 100) {
  throw ValidationError(
    'RISK_SCORE_OUT_OF_RANGE',
    `Risk score ${score} outside valid range (0-100)`,
    'Internal error - score must be capped'
  )
}
```

**Implementation:** `lib/validation-engine.ts → validateRiskScore()`

---

## OUTPUT VALIDATION

### 1. API RESPONSE VALIDATION

**Required Fields:**
```typescript
✓ success: boolean
✓ data (if success = true)
✓ error (if success = false)
```

**Data Object Validation:**
```typescript
✓ parseConfidence ∈ [0, 1]
✓ structuralIntegrityScore ∈ [0, 100]
✓ consolidatedRiskScore ∈ [0, 100]
✓ baselineExposure: { min, max } (valid range)
✓ deviationExposure: { min, max } (valid range)
✓ codeRiskExposure: { min, max } (valid range)
✓ deviations: Array (each validated)
✓ auditTrail: object (present)
✓ metadata: object (present)
```

**Implementation:** `lib/output-validator.ts → validateAPIOutput()`

---

### 2. PDF OUTPUT VALIDATION

**Structure:**
```typescript
✓ title: non-empty string
✓ sections: array (at least 1)
✓ Each section: { title, content }
✓ metadata: { generatedAt, requestId, version }
```

**Format Lock:**
- Fixed layout (no dynamic changes)
- Fixed sections (Summary, Deviations, Exposure, etc.)
- Fixed typography (font, size, spacing)
- Fixed table structure

**Implementation:** `lib/output-validator.ts → validatePDFStructure()`

---

### 3. EXCEL OUTPUT VALIDATION

**Structure:**
```typescript
✓ sheets: array (at least 1)
✓ Each sheet: { name, headers, rows }
✓ metadata: { generatedAt, requestId, version }
```

**Implementation:** `lib/output-validator.ts → validateExcelStructure()`

---

## EDGE CASE HANDLING

### 1. Zero Perimeter
```typescript
if (perimeter === 0) {
  throw DimensionError('ZERO_PERIMETER', ...)
}
```

### 2. Estimate Exceeds Directive
```typescript
deltaSF = reportSF - estimateSF

if (deltaSF <= 0) {
  return null; // No deviation
}
```

### 3. Missing Dimension Data
```typescript
if (report && !dimensions) {
  throw ValidationError('DIMENSIONS_REQUIRED', ...)
}
```

### 4. Height Exceeds Ceiling
```typescript
if (extractedHeight > room.height) {
  throw CalculationError('HEIGHT_EXCEEDS_CEILING', ...)
}
```

### 5. Negative Delta
```typescript
deltaSF = Math.max(0, reportSF - estimateSF)
```

### 6. NaN in Output
```typescript
if (isNaN(value) || !isFinite(value)) {
  throw ValidationError('INVALID_NUMERIC_VALUE', ...)
}
```

---

## VALIDATION FLOW

```
INPUT
  ↓
SECURITY VALIDATION
  ├─ File type/size/MIME
  ├─ Filename sanitization
  └─ Executable detection
  ↓
STRUCTURE VALIDATION
  ├─ Estimate structure
  ├─ Dimension structure
  └─ Report structure
  ↓
CALCULATION VALIDATION
  ├─ Height extraction
  ├─ Perimeter check
  ├─ Delta calculation
  └─ Exposure range
  ↓
OUTPUT VALIDATION
  ├─ Numeric fields
  ├─ Range validity
  ├─ Score bounds
  └─ Required fields
  ↓
RESPONSE (or structured error)
```

---

## ERROR CODES

See `docs/ERROR_CODES.md` for complete list.

---

## TESTING

All validation logic is covered by:
- `tests/founder-scenario-updated.test.ts`
- `tests/edge-case-suite.test.ts`
- Unit tests for each validation function

**Coverage Target:** 95%+
