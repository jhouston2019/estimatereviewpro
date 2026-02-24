# CALCULATION FORMULAS

**Version:** 1.0.0  
**Last Updated:** 2026-02-10

---

## OVERVIEW

All financial calculations in ERP are **deterministic, reproducible, and auditable**. This document defines every formula used in the system.

---

## DIMENSION CALCULATIONS

### 1. Room Perimeter
```
Perimeter (LF) = 2 × (Length + Width)
```

**Example:**
```
Room: 15 ft × 12 ft
Perimeter = 2 × (15 + 12) = 54 LF
```

---

### 2. Wall Surface Area
```
Wall SF = Perimeter (LF) × Wall Height (ft)
```

**Example:**
```
Perimeter: 54 LF
Height: 8 ft
Wall SF = 54 × 8 = 432 SF
```

**Notes:**
- Does NOT deduct windows/doors
- Assumes 4 walls at full height
- Per-room calculation, then summed

---

### 3. Ceiling Surface Area
```
Ceiling SF = Length (ft) × Width (ft)
```

**Example:**
```
Room: 15 ft × 12 ft
Ceiling SF = 15 × 12 = 180 SF
```

---

### 4. Floor Surface Area
```
Floor SF = Length (ft) × Width (ft)
```

**Example:**
```
Room: 15 ft × 12 ft
Floor SF = 15 × 12 = 180 SF
```

---

### 5. Insulation Surface Area
```
Insulation SF = Wall SF (exterior walls only, if specified)
             OR Total Wall SF (if scope is "all walls")
```

**Default:** Total Wall SF for water loss

---

## HEIGHT EXTRACTION

### 1. Height from Quantity
```
Extracted Height (ft) = Quantity (SF) ÷ Perimeter (LF)
```

**Example:**
```
Estimate: Remove drywall 108 SF
Perimeter: 54 LF
Extracted Height = 108 ÷ 54 = 2 ft
```

**Validation:**
```
if (Extracted Height > Room Height) {
  REJECT: "HEIGHT_EXCEEDS_CEILING"
}
```

---

### 2. Height from Description
```
Pattern Match: "(\d+)\s*(ft|feet|foot|')"
```

**Example:**
```
Description: "Remove drywall 4 ft"
Extracted Height = 4 ft
```

**Validation:**
```
if (Extracted Height > Room Height) {
  REJECT: "HEIGHT_EXCEEDS_CEILING"
}
```

---

## DEVIATION CALCULATIONS

### 1. Drywall Height Delta (Per-Room)

**Formula:**
```
For each room:
  Estimate Height = Wall Removal SF ÷ Perimeter LF
  Report Height = Directive Height (e.g., FULL_HEIGHT = Room.Height)
  
  Report Wall SF = Perimeter × Report Height
  Estimate Wall SF = Perimeter × Estimate Height
  
  Delta SF = Report Wall SF - Estimate Wall SF

Total Delta SF = Σ (Delta SF per room)
```

**Example:**
```
Room: 15 ft × 12 ft, 8 ft ceiling
Perimeter = 54 LF

Estimate: 108 SF removal
Estimate Height = 108 ÷ 54 = 2 ft

Report: "Remove drywall full height"
Report Height = 8 ft

Report Wall SF = 54 × 8 = 432 SF
Estimate Wall SF = 54 × 2 = 108 SF

Delta SF = 432 - 108 = 324 SF
```

**Validation:**
```
if (Delta SF < 0) {
  Delta SF = 0 (estimate meets or exceeds directive)
}
```

---

### 2. Insulation Delta (Per-Room)

**Formula:**
```
For each room:
  Expected Insulation SF = Perimeter × Wall Height
  Estimate Insulation SF = Sum of INS line items for room
  
  Delta SF = Expected - Estimate

Total Delta SF = Σ (Delta SF per room)
```

**Example:**
```
Room: 15 ft × 12 ft, 8 ft ceiling
Perimeter = 54 LF

Expected Insulation SF = 54 × 8 = 432 SF
Estimate Insulation SF = 0 SF

Delta SF = 432 - 0 = 432 SF
```

---

### 3. Ceiling Delta

**Formula:**
```
Expected Ceiling SF = Σ (Length × Width per room)
Estimate Ceiling SF = Sum of ceiling removal items

Delta SF = Expected - Estimate
```

**Example:**
```
Room: 15 ft × 12 ft
Expected Ceiling SF = 180 SF
Estimate Ceiling SF = 0 SF

Delta SF = 180 SF
```

---

### 4. Flooring Delta

**Formula:**
```
Expected Floor SF = Σ (Length × Width per room)
Estimate Floor SF = Sum of FLR/CRP/VCT/TIL items

Delta SF = Expected - Estimate
```

---

### 5. Baseboard Delta

**Formula:**
```
Expected Baseboard LF = Σ (Perimeter per room)
Estimate Baseboard LF = Sum of MLD items

Delta LF = Expected - Estimate
```

---

## EXPOSURE CALCULATIONS

### 1. Missing Item Exposure

**Formula:**
```
Exposure Min = Delta Quantity × Cost Baseline Min
Exposure Max = Delta Quantity × Cost Baseline Max
```

**Example:**
```
Delta SF = 324 SF
Cost Baseline (DRY_REPLACE_1/2): $2.50 - $4.50/SF

Exposure Min = 324 × 2.50 = $810
Exposure Max = 324 × 4.50 = $1,458
```

---

### 2. Total Baseline Exposure

**Formula:**
```
Total Baseline Exposure = Σ (Missing Item Exposure)
```

**Components:**
- Missing paint
- Missing baseboard
- Missing ceiling
- Missing insulation
- Code upgrades

---

### 3. Total Deviation Exposure

**Formula:**
```
Total Deviation Exposure = Σ (Deviation Exposure)
```

**Components:**
- Insufficient cut height
- Dimension mismatches
- Quantity shortfalls

---

## RISK SCORE CALCULATION

### Consolidated Risk Score (0-100)

**Formula:**
```
Base Components:
  A = (100 - Structural Integrity Score) × 0.30
  B = (Baseline Exposure / Total RCV) × 100 × 0.25
  C = (Deviation Exposure / Total RCV) × 100 × 0.30
  D = (Code Risk Exposure / Total RCV) × 100 × 0.15

Critical Multiplier:
  M = Critical Deviations > 0 ? 1.2 : 1.0

Raw Score = (A + B + C + D) × M

Consolidated Risk Score = min(Raw Score, 100)
```

**Component Weights:**
- Structural Integrity: 30%
- Baseline Exposure: 25%
- Deviation Exposure: 30%
- Code Risk: 15%

**Critical Multiplier:** +20% if any CRITICAL deviations

**Example:**
```
Structural Integrity = 72
Total RCV = $50,000
Baseline Exposure = $8,000
Deviation Exposure = $12,000
Code Risk = $3,000
Critical Deviations = 1

A = (100 - 72) × 0.30 = 8.4
B = (8000 / 50000) × 100 × 0.25 = 4.0
C = (12000 / 50000) × 100 × 0.30 = 7.2
D = (3000 / 50000) × 100 × 0.15 = 0.9

M = 1.2 (critical present)

Raw Score = (8.4 + 4.0 + 7.2 + 0.9) × 1.2 = 24.6

Consolidated Risk Score = min(24.6, 100) = 25
```

---

## TRADE COMPLETENESS SCORING

### Formula
```
Score = Base Score
      - Missing Removal Penalty
      - Missing Reinstall Penalty
      - Missing Finish Penalty
      - Missing Code Upgrade Penalty
      + Scope Completeness Bonus

Capped at [0, 100]
```

**Penalties:**
- Missing removal: -15 points
- Missing reinstall: -20 points
- Missing finish: -10 points
- Missing code upgrade: -15 points

**Bonuses:**
- Full scope present: +10 points

---

## SEVERITY INFERENCE

### Loss Type Detection
```
if (RoofingItems > 0) → ROOF_LEAK
if (PlumbingItems > 0) → PLUMBING
if (DrywallRemoval > 200 SF) → WATER_LOSS
else → GENERAL
```

### Severity Levels
```
Level 1: Drywall < 100 SF
Level 2: Drywall 100-500 SF
Level 3: Drywall 500-2000 SF
Level 4: Drywall > 2000 SF
```

---

## COST BASELINE

**Version:** 1.0.0  
**Date:** 2026-02-10  
**Region:** US_NATIONAL_AVERAGE

### Key Items

| Item | Unit | Min | Max |
|------|------|-----|-----|
| DRY_REPLACE_1/2 | SF | $2.50 | $4.50 |
| DRY_CEILING | SF | $3.00 | $5.50 |
| INS_BATT_R13 | SF | $1.50 | $3.00 |
| PNT_WALL_2COAT | SF | $1.80 | $3.20 |
| MLD_BASEBOARD | LF | $2.00 | $4.00 |
| FLR_CARPET | SF | $3.00 | $8.00 |
| PLM_WATER_HEATER | EA | $800 | $1,500 |
| ELE_OUTLET_GFCI | EA | $75 | $150 |

See `lib/cost-baseline.ts` for complete list.

---

## VALIDATION THRESHOLDS

### Parse Confidence
```
Reject: < 75%
Warn: < 85%
Accept: ≥ 85%
```

### Deviation Thresholds
```
Dimension Mismatch: > 20% variance
Quantity Shortfall: > 20% variance
```

### Severity Assignment
```
CRITICAL: Delta > 400 SF OR Exposure > $10,000
HIGH: Delta > 200 SF OR Exposure > $5,000
MODERATE: Delta > 100 SF OR Exposure > $2,000
LOW: Delta ≤ 100 SF AND Exposure ≤ $2,000
```

---

## AUDIT TRAIL FORMULAS

Every calculation is logged with:
```
{
  formula: "Perimeter 54 LF × (8 ft - 2 ft) = 324 SF",
  inputs: { perimeter: 54, reportHeight: 8, estimateHeight: 2 },
  output: { deltaSF: 324 },
  costPerUnit: { min: 2.50, max: 4.50 },
  exposure: { min: 810, max: 1458 }
}
```

---

## REPRODUCIBILITY

All calculations are:
- ✓ Deterministic (same inputs → same outputs)
- ✓ Auditable (full formula logged)
- ✓ Bounded (no infinite loops, no unbounded growth)
- ✓ Validated (no NaN, no negative exposure)
- ✓ Versioned (cost baseline version logged)

---

## REFERENCES

- `lib/dimension-engine.ts` — Dimension calculations
- `lib/per-room-deviation-engine.ts` — Deviation calculations
- `lib/height-extraction-engine.ts` — Height extraction
- `lib/exposure-engine.ts` — Exposure calculations
- `lib/cost-baseline.ts` — Cost data
