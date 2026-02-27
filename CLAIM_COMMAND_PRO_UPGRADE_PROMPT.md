# 🚀 CURSOR PROMPT: UPGRADE CLAIM COMMAND PRO ESTIMATE TOOL

**Objective:** Upgrade Claim Command Pro's estimate analysis tool to match and exceed Estimate Review Pro's capabilities

**Target System:** Claim Command Pro (existing production system)  
**Reference System:** Estimate Review Pro (this codebase)  
**Timeline:** 3-4 weeks  
**Complexity:** High - Enterprise-grade upgrade

---

## 📋 CONTEXT

Claim Command Pro currently has:
- ✅ Multi-format parsing (Standard, Xactimate, Tabular, Compact)
- ✅ Multi-phase matching (Exact → Fuzzy → Category → AI)
- ✅ Unit normalization (SF ↔ SQ, LF ↔ FT)
- ✅ O&P gap detection
- ✅ Full audit trail with AI decision tracing
- ✅ 6-table database schema
- ✅ Production deployment

Claim Command Pro is MISSING:
- ❌ Loss type intelligence (Water, Fire, Wind, Hail, Collision matrices)
- ❌ Severity-based analysis (Level 1-3, Light-Heavy)
- ❌ Code upgrade detection (AFCI, GFCI, drip edge, etc.)
- ❌ Trade completeness scoring (0-100 per trade)
- ❌ Exposure modeling with financial risk ranges
- ❌ Pricing validation against market data
- ❌ Depreciation abuse detection
- ❌ Labor rate validation
- ❌ Carrier tactic recognition
- ❌ Stronger guardrails (6-layer system)

---

## 🎯 OBJECTIVE

Transform Claim Command Pro from a **structural analysis tool** into a **comprehensive estimate intelligence platform** by adding:

1. **Domain Intelligence** (from Estimate Review Pro)
2. **Financial Validation** (new - neither system has this)
3. **Carrier Tactic Detection** (new - neither system has this)
4. **Enhanced Safety** (from Estimate Review Pro)

---

## 📦 PHASE 1: ADD LOSS TYPE INTELLIGENCE

### 1.1 Create Loss Expectation Engine

**File:** `lib/loss-expectation-engine.ts` (copy from Estimate Review Pro)

**Requirements:**
- Support 5 loss types: WATER, FIRE, WIND, HAIL, COLLISION
- Support severity levels:
  - Water: LEVEL_1, LEVEL_2, LEVEL_3, CATEGORY_3
  - Fire: LIGHT, MODERATE, HEAVY
  - Wind: MINOR, MAJOR
  - Hail: MINOR, MAJOR
  - Collision: MINOR, MAJOR
- 100+ expected trade mappings
- Probability scores per trade (0.0 - 1.0)
- Automatic severity inference from trade density and quantities

**Expected Trade Mappings:**
```typescript
const WATER_EXPECTATIONS = {
  LEVEL_1: {
    // Surface water, <24 hours
    REQUIRED: [
      { trade: 'DRY', probability: 0.95, description: 'Drying equipment' },
      { trade: 'CLN', probability: 0.90, description: 'Cleaning & sanitizing' },
    ],
    COMMON: [
      { trade: 'DEM', probability: 0.60, description: 'Demolition if materials wet' },
      { trade: 'FLR', probability: 0.50, description: 'Flooring if carpet affected' },
    ],
  },
  LEVEL_2: {
    // Significant absorption, >24 hours
    REQUIRED: [
      { trade: 'DEM', probability: 0.95, description: 'Demolition of wet materials' },
      { trade: 'DRY', probability: 1.00, description: 'Drywall replacement' },
      { trade: 'PNT', probability: 0.95, description: 'Paint after drywall' },
      { trade: 'FLR', probability: 0.90, description: 'Flooring replacement' },
    ],
    COMMON: [
      { trade: 'INS', probability: 0.80, description: 'Insulation if wet' },
      { trade: 'TRM', probability: 0.75, description: 'Trim replacement' },
      { trade: 'CAB', probability: 0.40, description: 'Cabinets if affected' },
    ],
  },
  LEVEL_3: {
    // Deep saturation, structural impact
    REQUIRED: [
      { trade: 'DEM', probability: 1.00, description: 'Extensive demolition' },
      { trade: 'DRY', probability: 1.00, description: 'Drywall replacement' },
      { trade: 'PNT', probability: 1.00, description: 'Complete repainting' },
      { trade: 'FLR', probability: 1.00, description: 'Complete flooring replacement' },
      { trade: 'INS', probability: 0.95, description: 'Insulation replacement' },
    ],
    COMMON: [
      { trade: 'FRM', probability: 0.60, description: 'Framing if structural damage' },
      { trade: 'ELE', probability: 0.70, description: 'Electrical if affected' },
      { trade: 'PLM', probability: 0.80, description: 'Plumbing if source' },
      { trade: 'CAB', probability: 0.70, description: 'Cabinet replacement' },
      { trade: 'CTR', probability: 0.60, description: 'Countertop replacement' },
    ],
  },
  CATEGORY_3: {
    // Contaminated water (sewage)
    REQUIRED: [
      { trade: 'DEM', probability: 1.00, description: 'Complete demolition' },
      { trade: 'CLN', probability: 1.00, description: 'Biohazard cleaning' },
      { trade: 'DRY', probability: 1.00, description: 'All drywall replacement' },
      { trade: 'FLR', probability: 1.00, description: 'All flooring replacement' },
      { trade: 'INS', probability: 1.00, description: 'All insulation replacement' },
      { trade: 'PNT', probability: 1.00, description: 'Complete repainting' },
    ],
    COMMON: [
      { trade: 'CAB', probability: 0.90, description: 'Cabinet replacement' },
      { trade: 'TRM', probability: 0.95, description: 'All trim replacement' },
      { trade: 'DOR', probability: 0.70, description: 'Door replacement if affected' },
    ],
  },
};

const FIRE_EXPECTATIONS = {
  LIGHT: {
    // Smoke damage, no structural
    REQUIRED: [
      { trade: 'CLN', probability: 1.00, description: 'Smoke cleaning' },
      { trade: 'PNT', probability: 0.95, description: 'Repainting' },
    ],
    COMMON: [
      { trade: 'FLR', probability: 0.40, description: 'Flooring if smoke damaged' },
      { trade: 'CAB', probability: 0.30, description: 'Cabinet cleaning/refinish' },
    ],
  },
  MODERATE: {
    // Partial structural, localized fire
    REQUIRED: [
      { trade: 'DEM', probability: 0.95, description: 'Demolition of burned materials' },
      { trade: 'CLN', probability: 1.00, description: 'Smoke & soot removal' },
      { trade: 'DRY', probability: 0.90, description: 'Drywall replacement' },
      { trade: 'PNT', probability: 0.95, description: 'Complete repainting' },
    ],
    COMMON: [
      { trade: 'FRM', probability: 0.60, description: 'Framing if structural' },
      { trade: 'ELE', probability: 0.80, description: 'Electrical repair' },
      { trade: 'FLR', probability: 0.75, description: 'Flooring replacement' },
      { trade: 'CAB', probability: 0.60, description: 'Cabinet replacement' },
      { trade: 'RFG', probability: 0.40, description: 'Roofing if fire penetrated' },
    ],
  },
  HEAVY: {
    // Extensive structural, major fire
    REQUIRED: [
      { trade: 'DEM', probability: 1.00, description: 'Complete demolition' },
      { trade: 'CLN', probability: 1.00, description: 'Extensive cleaning' },
      { trade: 'FRM', probability: 0.95, description: 'Structural framing' },
      { trade: 'DRY', probability: 1.00, description: 'Complete drywall' },
      { trade: 'PNT', probability: 1.00, description: 'Complete painting' },
      { trade: 'FLR', probability: 1.00, description: 'Complete flooring' },
    ],
    COMMON: [
      { trade: 'RFG', probability: 0.90, description: 'Roofing replacement' },
      { trade: 'ELE', probability: 0.95, description: 'Complete electrical' },
      { trade: 'PLM', probability: 0.85, description: 'Plumbing replacement' },
      { trade: 'HVA', probability: 0.80, description: 'HVAC replacement' },
      { trade: 'CAB', probability: 0.95, description: 'All cabinets' },
      { trade: 'WIN', probability: 0.85, description: 'Window replacement' },
      { trade: 'DOR', probability: 0.90, description: 'Door replacement' },
    ],
  },
};

const WIND_EXPECTATIONS = {
  MINOR: {
    // Shingles, gutters, minor exterior
    REQUIRED: [
      { trade: 'RFG', probability: 0.95, description: 'Roofing repair' },
    ],
    COMMON: [
      { trade: 'GUT', probability: 0.70, description: 'Gutter repair' },
      { trade: 'SID', probability: 0.40, description: 'Siding if damaged' },
      { trade: 'WIN', probability: 0.30, description: 'Window if broken' },
    ],
  },
  MAJOR: {
    // Structural damage, extensive exterior
    REQUIRED: [
      { trade: 'RFG', probability: 1.00, description: 'Complete roofing' },
      { trade: 'SID', probability: 0.85, description: 'Siding replacement' },
    ],
    COMMON: [
      { trade: 'FRM', probability: 0.70, description: 'Structural framing' },
      { trade: 'WIN', probability: 0.80, description: 'Window replacement' },
      { trade: 'DOR', probability: 0.60, description: 'Door replacement' },
      { trade: 'GUT', probability: 0.90, description: 'Gutter replacement' },
      { trade: 'DRY', probability: 0.60, description: 'Interior drywall' },
      { trade: 'PNT', probability: 0.60, description: 'Interior painting' },
    ],
  },
};
```

**Integration:**
- Add to main analysis pipeline in Step 5 (after parsing, before exposure)
- Output: `lossExpectation` section in report
- Include: detected loss type, inferred severity, expected trades, missing critical trades

---

### 1.2 Create Code Upgrade Detection Engine

**File:** `lib/code-upgrade-engine.ts` (copy from Estimate Review Pro)

**Requirements:**
- Detect 8 code items with NEC/IRC references
- Calculate cost ranges for missing items
- Severity classification (CRITICAL, HIGH, MODERATE)

**Code Items to Detect:**
```typescript
const CODE_REQUIREMENTS = [
  {
    code: 'AFCI',
    name: 'Arc-Fault Circuit Interrupters',
    reference: 'NEC 210.12',
    description: 'Required in bedrooms, living areas (2008+ NEC)',
    typical_cost_range: { min: 150, max: 300, unit: 'per circuit' },
    severity: 'HIGH',
    detection_keywords: ['afci', 'arc fault', 'circuit breaker upgrade'],
  },
  {
    code: 'GFCI',
    name: 'Ground-Fault Circuit Interrupters',
    reference: 'NEC 210.8',
    description: 'Required in bathrooms, kitchens, garages, outdoors',
    typical_cost_range: { min: 75, max: 150, unit: 'per outlet' },
    severity: 'HIGH',
    detection_keywords: ['gfci', 'ground fault', 'gfi outlet'],
  },
  {
    code: 'SMOKE_DETECTOR',
    name: 'Smoke Detectors',
    reference: 'IRC R314',
    description: 'Required in bedrooms, hallways, each level',
    typical_cost_range: { min: 50, max: 150, unit: 'per detector' },
    severity: 'CRITICAL',
    detection_keywords: ['smoke detector', 'smoke alarm', 'fire alarm'],
  },
  {
    code: 'CO_DETECTOR',
    name: 'Carbon Monoxide Detectors',
    reference: 'IRC R315',
    description: 'Required near bedrooms if fuel-burning appliances',
    typical_cost_range: { min: 40, max: 100, unit: 'per detector' },
    severity: 'CRITICAL',
    detection_keywords: ['co detector', 'carbon monoxide', 'co alarm'],
  },
  {
    code: 'DRIP_EDGE',
    name: 'Drip Edge',
    reference: 'IRC R905.2.8.5',
    description: 'Required at eaves and rakes',
    typical_cost_range: { min: 2, max: 4, unit: 'per LF' },
    severity: 'MODERATE',
    detection_keywords: ['drip edge', 'eave edge', 'rake edge'],
  },
  {
    code: 'ICE_WATER_SHIELD',
    name: 'Ice & Water Shield',
    reference: 'IRC R905.2.7.1',
    description: 'Required in cold climates at eaves',
    typical_cost_range: { min: 1.50, max: 3, unit: 'per SF' },
    severity: 'MODERATE',
    detection_keywords: ['ice and water', 'ice & water', 'underlayment'],
  },
  {
    code: 'PERMIT',
    name: 'Building Permit',
    reference: 'IRC R105',
    description: 'Required for structural work, electrical, plumbing',
    typical_cost_range: { min: 200, max: 1500, unit: 'per permit' },
    severity: 'HIGH',
    detection_keywords: ['permit', 'building permit', 'inspection fee'],
  },
  {
    code: 'DETACH_RESET',
    name: 'Detach & Reset',
    reference: 'Industry Standard',
    description: 'Labor to remove and reinstall fixtures, appliances',
    typical_cost_range: { min: 50, max: 200, unit: 'per item' },
    severity: 'MODERATE',
    detection_keywords: ['detach', 'reset', 'remove and reinstall', 'r&r'],
  },
];
```

**Integration:**
- Add to main analysis pipeline in Step 7 (after completeness scoring)
- Output: `codeUpgradeFlags` section in report
- Include: missing items, code references, cost estimates, severity

---

### 1.3 Create Trade Completeness Scoring Engine

**File:** `lib/trade-completeness-engine.ts` (copy from Estimate Review Pro)

**Requirements:**
- Score each trade 0-100 based on 5 criteria:
  1. Removal present?
  2. Replacement present?
  3. Finish layer present?
  4. Material + labor present?
  5. Quantity consistency?
- Calculate overall structural integrity score (0-100)
- Issue classification: CRITICAL, HIGH, MODERATE, LOW

**Scoring Logic:**
```typescript
function scoreTradeCompleteness(trade: TradeGroup): TradeScore {
  let score = 100;
  const issues: Issue[] = [];
  
  // Check 1: Removal present if needed?
  const hasRemoval = trade.items.some(item => 
    item.actionType === 'REMOVE' || item.description.match(/remove|demo|tear out/i)
  );
  const hasReplacement = trade.items.some(item => 
    item.actionType === 'REPLACE' || item.actionType === 'INSTALL'
  );
  
  if (hasReplacement && !hasRemoval && trade.requiresRemoval) {
    score -= 20;
    issues.push({
      severity: 'HIGH',
      description: 'Replacement without removal detected',
      impact: 'Missing demolition costs',
    });
  }
  
  // Check 2: Replacement present if removal found?
  if (hasRemoval && !hasReplacement) {
    score -= 25;
    issues.push({
      severity: 'CRITICAL',
      description: 'Removal without replacement detected',
      impact: 'Incomplete scope - work not finished',
    });
  }
  
  // Check 3: Finish layer present?
  if (trade.code === 'DRY' && !hasPaint(allTrades)) {
    score -= 15;
    issues.push({
      severity: 'HIGH',
      description: 'Drywall without paint detected',
      impact: 'Missing finish layer',
    });
  }
  
  // Check 4: Material + labor present?
  const materialOnly = trade.items.some(item => 
    item.description.match(/material only|materials only/i)
  );
  const laborOnly = trade.items.some(item => 
    item.description.match(/labor only|installation only/i)
  );
  
  if (materialOnly && !hasCorrespondingLabor(trade)) {
    score -= 15;
    issues.push({
      severity: 'MODERATE',
      description: 'Material without labor detected',
      impact: 'Missing installation costs',
    });
  }
  
  // Check 5: Quantity consistency?
  const removalQty = sumQuantities(trade.items.filter(i => i.actionType === 'REMOVE'));
  const replaceQty = sumQuantities(trade.items.filter(i => i.actionType === 'REPLACE'));
  
  if (Math.abs(removalQty - replaceQty) > removalQty * 0.1) {
    score -= 10;
    issues.push({
      severity: 'MODERATE',
      description: 'Quantity mismatch between removal and replacement',
      impact: 'Incomplete scope or calculation error',
    });
  }
  
  return {
    trade: trade.code,
    tradeName: trade.name,
    score: Math.max(0, score),
    issues,
    itemCount: trade.items.length,
  };
}
```

**Integration:**
- Add to main analysis pipeline in Step 6 (after exposure, before code upgrades)
- Output: `tradeScores` section in report
- Include: per-trade scores, overall integrity score, critical issues

---

## 📦 PHASE 2: ADD FINANCIAL VALIDATION

### 2.1 Create Pricing Validation Engine

**File:** `lib/pricing-validation-engine.ts` (NEW - neither system has this)

**Requirements:**
- Compare line item prices against Xactimate database
- Compare against RSMeans database
- Apply regional cost multipliers
- Flag items >20% above/below market rate
- Calculate total pricing variance

**Database Schema:**
```sql
-- Add to Claim Command Pro database
CREATE TABLE pricing_database (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_code TEXT NOT NULL,
  item_code TEXT, -- Xactimate code (e.g., 'DRY REM')
  description TEXT NOT NULL,
  unit TEXT NOT NULL,
  base_price NUMERIC NOT NULL,
  price_source TEXT NOT NULL, -- 'xactimate', 'rsmeans', 'market'
  region TEXT NOT NULL,
  effective_date DATE NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX idx_pricing_trade_region ON pricing_database(trade_code, region);
CREATE INDEX idx_pricing_item_code ON pricing_database(item_code);
CREATE INDEX idx_pricing_effective_date ON pricing_database(effective_date DESC);

-- Regional cost multipliers
CREATE TABLE regional_multipliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL,
  city TEXT,
  multiplier NUMERIC NOT NULL,
  effective_date DATE NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO regional_multipliers (region, state, city, multiplier, effective_date) VALUES
  ('CA-San Francisco', 'CA', 'San Francisco', 1.45, '2026-01-01'),
  ('CA-Los Angeles', 'CA', 'Los Angeles', 1.38, '2026-01-01'),
  ('NY-New York City', 'NY', 'New York', 1.42, '2026-01-01'),
  ('IL-Chicago', 'IL', 'Chicago', 1.15, '2026-01-01'),
  ('TX-Houston', 'TX', 'Houston', 0.95, '2026-01-01'),
  ('TX-Dallas', 'TX', 'Dallas', 0.98, '2026-01-01'),
  ('FL-Miami', 'FL', 'Miami', 1.08, '2026-01-01'),
  ('FL-Orlando', 'FL', 'Orlando', 1.02, '2026-01-01'),
  ('GA-Atlanta', 'GA', 'Atlanta', 1.05, '2026-01-01'),
  ('WA-Seattle', 'WA', 'Seattle', 1.28, '2026-01-01'),
  ('CO-Denver', 'CO', 'Denver', 1.12, '2026-01-01'),
  ('AZ-Phoenix', 'AZ', 'Phoenix', 0.98, '2026-01-01'),
  ('NC-Charlotte', 'NC', 'Charlotte', 0.96, '2026-01-01'),
  ('TN-Nashville', 'TN', 'Nashville', 0.94, '2026-01-01'),
  ('OR-Portland', 'OR', 'Portland', 1.18, '2026-01-01');
```

**Pricing Validation Logic:**
```typescript
interface PricingValidationResult {
  totalVariance: number;
  variancePercentage: number;
  overpriced: LineItemVariance[];
  underpriced: LineItemVariance[];
  marketComparison: MarketComparison;
  regionalMultiplier: number;
  confidence: number; // 0-100
}

interface LineItemVariance {
  lineNumber: number;
  description: string;
  estimatePrice: number;
  marketPrice: number;
  variance: number;
  variancePercentage: number;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  explanation: string;
}

async function validatePricing(
  lineItems: LineItem[],
  region: string
): Promise<PricingValidationResult> {
  
  // Get regional multiplier
  const multiplier = await getRegionalMultiplier(region);
  
  const overpriced: LineItemVariance[] = [];
  const underpriced: LineItemVariance[] = [];
  let totalVariance = 0;
  
  for (const item of lineItems) {
    // Look up market price
    const marketPrice = await lookupMarketPrice(
      item.tradeCode,
      item.description,
      item.unit,
      region
    );
    
    if (!marketPrice) continue;
    
    // Apply regional multiplier
    const adjustedMarketPrice = marketPrice * multiplier;
    
    // Calculate variance
    const variance = item.unitPrice - adjustedMarketPrice;
    const variancePercentage = (variance / adjustedMarketPrice) * 100;
    
    totalVariance += variance * item.quantity;
    
    // Flag if >20% variance
    if (Math.abs(variancePercentage) > 20) {
      const issue: LineItemVariance = {
        lineNumber: item.lineNumber,
        description: item.description,
        estimatePrice: item.unitPrice,
        marketPrice: adjustedMarketPrice,
        variance,
        variancePercentage,
        severity: Math.abs(variancePercentage) > 50 ? 'CRITICAL' : 
                  Math.abs(variancePercentage) > 35 ? 'HIGH' : 'MODERATE',
        explanation: variancePercentage > 0 
          ? `Priced ${Math.abs(variancePercentage).toFixed(1)}% above market rate`
          : `Priced ${Math.abs(variancePercentage).toFixed(1)}% below market rate`,
      };
      
      if (variancePercentage > 0) {
        overpriced.push(issue);
      } else {
        underpriced.push(issue);
      }
    }
  }
  
  return {
    totalVariance,
    variancePercentage: (totalVariance / sumTotal(lineItems)) * 100,
    overpriced,
    underpriced,
    marketComparison: {
      estimateTotal: sumTotal(lineItems),
      marketTotal: sumTotal(lineItems) - totalVariance,
      variance: totalVariance,
    },
    regionalMultiplier: multiplier,
    confidence: calculateConfidence(lineItems, marketPrice),
  };
}
```

**Integration:**
- Add to main analysis pipeline in Step 8 (new step after code upgrades)
- Output: `pricingAnalysis` section in report
- Require: property address or ZIP code for regional pricing

---

### 2.2 Create Depreciation Validation Engine

**File:** `lib/depreciation-validator.ts` (NEW - neither system has this)

**Requirements:**
- Validate depreciation percentages against industry standards
- Flag depreciation >50% on structural items
- Detect depreciation on non-depreciable items
- Calculate recoverable depreciation with O&P

**Depreciation Rules:**
```typescript
const DEPRECIATION_LIMITS = {
  // Roofing
  'Asphalt Shingles': { max: 50, typical: 25, lifespan: 20, perYear: 5 },
  'Metal Roofing': { max: 30, typical: 15, lifespan: 40, perYear: 2.5 },
  'Tile Roofing': { max: 25, typical: 10, lifespan: 50, perYear: 2 },
  
  // Interior
  'Drywall': { max: 25, typical: 10, lifespan: 30, perYear: 3.3 },
  'Paint - Interior': { max: 40, typical: 20, lifespan: 10, perYear: 10 },
  'Paint - Exterior': { max: 50, typical: 30, lifespan: 7, perYear: 14 },
  
  // Flooring
  'Carpet': { max: 80, typical: 50, lifespan: 7, perYear: 14 },
  'Hardwood Flooring': { max: 40, typical: 20, lifespan: 25, perYear: 4 },
  'Tile Flooring': { max: 30, typical: 15, lifespan: 30, perYear: 3.3 },
  'Vinyl Flooring': { max: 60, typical: 40, lifespan: 10, perYear: 10 },
  'Laminate Flooring': { max: 50, typical: 30, lifespan: 15, perYear: 6.7 },
  
  // Mechanical
  'HVAC System': { max: 60, typical: 40, lifespan: 15, perYear: 6.7 },
  'Water Heater': { max: 70, typical: 50, lifespan: 10, perYear: 10 },
  'Plumbing Fixtures': { max: 30, typical: 15, lifespan: 30, perYear: 3.3 },
  
  // Structural
  'Framing': { max: 20, typical: 5, lifespan: 100, perYear: 1 },
  'Foundation': { max: 15, typical: 5, lifespan: 100, perYear: 1 },
  'Windows': { max: 40, typical: 25, lifespan: 20, perYear: 5 },
  'Doors': { max: 40, typical: 25, lifespan: 20, perYear: 5 },
  
  // Cabinets & Counters
  'Cabinets': { max: 40, typical: 20, lifespan: 25, perYear: 4 },
  'Countertops - Laminate': { max: 50, typical: 30, lifespan: 15, perYear: 6.7 },
  'Countertops - Granite': { max: 30, typical: 15, lifespan: 30, perYear: 3.3 },
};

const NON_DEPRECIABLE = [
  'Labor',
  'Installation',
  'Permits',
  'Inspections',
  'Overhead & Profit',
  'Overhead',
  'Profit',
  'Demolition',
  'Disposal',
  'Dumpster',
  'Haul Away',
  'Drying Equipment',
  'Dehumidification',
  'Air Mover',
  'Cleaning',
  'Sanitizing',
  'Antimicrobial',
  'Detach & Reset',
  'Protection',
  'Temporary',
];

interface DepreciationIssue {
  lineNumber: number;
  description: string;
  depreciationApplied: number;
  depreciationPercentage: number;
  maxAllowed: number;
  typicalRange: number;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  issue: string;
  impact: number; // Dollar amount
}

function validateDepreciation(lineItems: LineItem[]): DepreciationAnalysis {
  const excessiveDepreciation: DepreciationIssue[] = [];
  const improperDepreciation: DepreciationIssue[] = [];
  let totalDepreciation = 0;
  let recoverableWithOP = 0;
  
  for (const item of lineItems) {
    const depreciation = item.rcv - item.acv;
    const depreciationPercentage = (depreciation / item.rcv) * 100;
    totalDepreciation += depreciation;
    
    // Check if item is non-depreciable
    const isNonDepreciable = NON_DEPRECIABLE.some(keyword => 
      item.description.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (isNonDepreciable && depreciation > 0) {
      improperDepreciation.push({
        lineNumber: item.lineNumber,
        description: item.description,
        depreciationApplied: depreciation,
        depreciationPercentage,
        maxAllowed: 0,
        typicalRange: 0,
        severity: 'CRITICAL',
        issue: 'Depreciation applied to non-depreciable item',
        impact: depreciation,
      });
      continue;
    }
    
    // Look up depreciation limits
    const limits = findDepreciationLimits(item.description);
    if (!limits) continue;
    
    // Check if depreciation exceeds maximum
    if (depreciationPercentage > limits.max) {
      excessiveDepreciation.push({
        lineNumber: item.lineNumber,
        description: item.description,
        depreciationApplied: depreciation,
        depreciationPercentage,
        maxAllowed: limits.max,
        typicalRange: limits.typical,
        severity: depreciationPercentage > limits.max * 1.5 ? 'CRITICAL' : 'HIGH',
        issue: `Depreciation ${depreciationPercentage.toFixed(1)}% exceeds maximum ${limits.max}%`,
        impact: (depreciationPercentage - limits.max) / 100 * item.rcv,
      });
    }
    
    // Calculate recoverable depreciation with O&P
    if (depreciation > 0) {
      recoverableWithOP += depreciation * 1.20; // Add 20% O&P
    }
  }
  
  // Calculate depreciation score (0-100)
  const depreciationScore = calculateDepreciationScore(
    excessiveDepreciation,
    improperDepreciation,
    totalDepreciation
  );
  
  return {
    totalDepreciation,
    excessiveDepreciation,
    improperDepreciation,
    recoverableWithOP,
    depreciationScore,
  };
}
```

**Integration:**
- Add to main analysis pipeline in Step 9 (after pricing validation)
- Output: `depreciationAnalysis` section in report
- Include: excessive depreciation, improper depreciation, recoverable amount

---

### 2.3 Create Labor Rate Validation Engine

**File:** `lib/labor-rate-validator.ts` (NEW - neither system has this)

**Requirements:**
- Compare labor rates against regional standards
- Flag rates >20% below market (underpayment)
- Flag rates >30% above market (potential fraud)
- Validate labor hours against industry standards

**Regional Labor Rates Database:**
```sql
-- Add to Claim Command Pro database
CREATE TABLE labor_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade TEXT NOT NULL,
  region TEXT NOT NULL,
  min_rate NUMERIC NOT NULL,
  avg_rate NUMERIC NOT NULL,
  max_rate NUMERIC NOT NULL,
  unit TEXT DEFAULT 'per hour',
  effective_date DATE NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  source TEXT, -- 'BLS', 'industry_survey', 'market_data'
  metadata JSONB
);

CREATE INDEX idx_labor_trade_region ON labor_rates(trade, region);

-- Sample data (expand to 50+ regions)
INSERT INTO labor_rates (trade, region, min_rate, avg_rate, max_rate, effective_date, source) VALUES
  -- California - San Francisco
  ('General Contractor', 'CA-San Francisco', 85, 110, 145, '2026-01-01', 'market_data'),
  ('Carpenter', 'CA-San Francisco', 75, 95, 125, '2026-01-01', 'market_data'),
  ('Electrician', 'CA-San Francisco', 85, 110, 140, '2026-01-01', 'market_data'),
  ('Plumber', 'CA-San Francisco', 80, 105, 135, '2026-01-01', 'market_data'),
  ('HVAC Technician', 'CA-San Francisco', 75, 95, 125, '2026-01-01', 'market_data'),
  ('Painter', 'CA-San Francisco', 55, 75, 95, '2026-01-01', 'market_data'),
  ('Drywall Installer', 'CA-San Francisco', 60, 80, 105, '2026-01-01', 'market_data'),
  ('Flooring Installer', 'CA-San Francisco', 55, 75, 100, '2026-01-01', 'market_data'),
  ('Roofer', 'CA-San Francisco', 65, 85, 110, '2026-01-01', 'market_data'),
  
  -- Texas - Houston
  ('General Contractor', 'TX-Houston', 55, 75, 95, '2026-01-01', 'market_data'),
  ('Carpenter', 'TX-Houston', 45, 65, 85, '2026-01-01', 'market_data'),
  ('Electrician', 'TX-Houston', 55, 75, 95, '2026-01-01', 'market_data'),
  ('Plumber', 'TX-Houston', 50, 70, 90, '2026-01-01', 'market_data'),
  ('HVAC Technician', 'TX-Houston', 50, 65, 85, '2026-01-01', 'market_data'),
  ('Painter', 'TX-Houston', 35, 50, 65, '2026-01-01', 'market_data'),
  ('Drywall Installer', 'TX-Houston', 40, 55, 70, '2026-01-01', 'market_data'),
  ('Flooring Installer', 'TX-Houston', 35, 50, 70, '2026-01-01', 'market_data'),
  ('Roofer', 'TX-Houston', 45, 60, 80, '2026-01-01', 'market_data'),
  
  -- Illinois - Chicago
  ('General Contractor', 'IL-Chicago', 65, 85, 110, '2026-01-01', 'market_data'),
  ('Carpenter', 'IL-Chicago', 55, 75, 95, '2026-01-01', 'market_data'),
  ('Electrician', 'IL-Chicago', 65, 85, 110, '2026-01-01', 'market_data'),
  ('Plumber', 'IL-Chicago', 60, 80, 105, '2026-01-01', 'market_data'),
  ('HVAC Technician', 'IL-Chicago', 55, 75, 95, '2026-01-01', 'market_data'),
  ('Painter', 'IL-Chicago', 40, 60, 75, '2026-01-01', 'market_data'),
  ('Drywall Installer', 'IL-Chicago', 45, 65, 85, '2026-01-01', 'market_data'),
  ('Flooring Installer', 'IL-Chicago', 40, 60, 80, '2026-01-01', 'market_data'),
  ('Roofer', 'IL-Chicago', 50, 70, 90, '2026-01-01', 'market_data');
```

**Labor Validation Logic:**
```typescript
interface LaborIssue {
  lineNumber: number;
  description: string;
  trade: string;
  estimateRate: number;
  marketRate: { min: number; avg: number; max: number };
  variance: number;
  variancePercentage: number;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  issue: string;
  impact: number;
}

async function validateLaborRates(
  lineItems: LineItem[],
  region: string
): Promise<LaborAnalysis> {
  
  const undervaluedLabor: LaborIssue[] = [];
  const overvaluedLabor: LaborIssue[] = [];
  let totalLaborCost = 0;
  let totalLaborVariance = 0;
  
  for (const item of lineItems) {
    // Detect if line item is labor
    const isLabor = detectLaborItem(item);
    if (!isLabor) continue;
    
    totalLaborCost += item.total;
    
    // Identify trade
    const trade = identifyTrade(item);
    if (!trade) continue;
    
    // Look up market rates
    const marketRates = await lookupLaborRate(trade, region);
    if (!marketRates) continue;
    
    // Calculate hourly rate from item
    const estimateRate = calculateHourlyRate(item);
    
    // Calculate variance
    const variance = estimateRate - marketRates.avg;
    const variancePercentage = (variance / marketRates.avg) * 100;
    
    totalLaborVariance += variance * item.quantity;
    
    // Flag if >20% below market (underpayment)
    if (variancePercentage < -20) {
      undervaluedLabor.push({
        lineNumber: item.lineNumber,
        description: item.description,
        trade,
        estimateRate,
        marketRate: marketRates,
        variance,
        variancePercentage,
        severity: variancePercentage < -40 ? 'CRITICAL' : 'HIGH',
        issue: `Labor rate ${Math.abs(variancePercentage).toFixed(1)}% below market average`,
        impact: Math.abs(variance) * item.quantity,
      });
    }
    
    // Flag if >30% above market (potential fraud)
    if (variancePercentage > 30) {
      overvaluedLabor.push({
        lineNumber: item.lineNumber,
        description: item.description,
        trade,
        estimateRate,
        marketRate: marketRates,
        variance,
        variancePercentage,
        severity: variancePercentage > 50 ? 'CRITICAL' : 'MODERATE',
        issue: `Labor rate ${variancePercentage.toFixed(1)}% above market average`,
        impact: variance * item.quantity,
      });
    }
  }
  
  // Calculate labor score (0-100)
  const laborScore = calculateLaborScore(
    undervaluedLabor,
    overvaluedLabor,
    totalLaborVariance
  );
  
  return {
    totalLaborCost,
    laborVariance: totalLaborVariance,
    undervaluedLabor,
    overvaluedLabor,
    laborScore,
  };
}
```

**Integration:**
- Add to main analysis pipeline in Step 10 (after depreciation validation)
- Output: `laborAnalysis` section in report
- Require: property address or ZIP code for regional rates

---

### 2.4 Create Carrier Tactic Detection Engine

**File:** `lib/carrier-tactic-detector.ts` (NEW - neither system has this)

**Requirements:**
- Detect 10 common carrier underpayment tactics
- Calculate financial impact per tactic
- Provide counter-arguments and documentation

**Carrier Tactics to Detect:**
```typescript
const CARRIER_TACTICS = [
  {
    id: 'DEPRECIATION_STACKING',
    name: 'Depreciation Stacking',
    description: 'Applying depreciation multiple times (e.g., to material AND labor)',
    severity: 'CRITICAL',
    detection: (estimate) => {
      // Check if depreciation applied to both material and labor on same item
      return estimate.lineItems.some(item => 
        item.description.includes('labor') && 
        item.depreciation > 0 &&
        hasCorrespondingMaterialWithDepreciation(item, estimate)
      );
    },
    counter_argument: 'Labor is not depreciable. Only materials depreciate over time. Applying depreciation to labor is improper and violates standard insurance practices.',
  },
  
  {
    id: 'MISSING_OP_ON_RECOVERABLE',
    name: 'Missing O&P on Recoverable Depreciation',
    description: 'Not including overhead & profit on recoverable depreciation',
    severity: 'HIGH',
    detection: (estimate) => {
      const hasRecoverableDepreciation = estimate.lineItems.some(i => i.depreciation > 0);
      const hasOP = estimate.lineItems.some(i => 
        i.description.match(/overhead|profit|o&p|o & p/i)
      );
      return hasRecoverableDepreciation && !hasOP;
    },
    counter_argument: 'Overhead and profit should be applied to recoverable depreciation. This is standard industry practice and required for proper restoration.',
  },
  
  {
    id: 'LABOR_ONLY_LINE_ITEMS',
    name: 'Labor-Only Line Items',
    description: 'Line items with labor but missing material costs',
    severity: 'HIGH',
    detection: (estimate) => {
      return estimate.lineItems.filter(item => 
        item.description.match(/install|labor/i) &&
        !hasCorrespondingMaterial(item, estimate)
      );
    },
    counter_argument: 'Installation labor requires materials. Material costs must be included for complete scope of work.',
  },
  
  {
    id: 'MATERIAL_ONLY_LINE_ITEMS',
    name: 'Material-Only Line Items',
    description: 'Line items with materials but missing labor costs',
    severity: 'HIGH',
    detection: (estimate) => {
      return estimate.lineItems.filter(item => 
        item.description.match(/material|supply/i) &&
        !hasCorrespondingLabor(item, estimate)
      );
    },
    counter_argument: 'Materials require installation labor. Labor costs must be included for complete scope of work.',
  },
  
  {
    id: 'PARTIAL_SCOPE',
    name: 'Partial Scope / Incomplete Repairs',
    description: 'Estimate covers only partial repairs, leaving work incomplete',
    severity: 'CRITICAL',
    detection: (estimate) => {
      // Check for removal without replacement
      const removals = estimate.lineItems.filter(i => i.actionType === 'REMOVE');
      const replacements = estimate.lineItems.filter(i => 
        i.actionType === 'REPLACE' || i.actionType === 'INSTALL'
      );
      return removals.length > replacements.length;
    },
    counter_argument: 'Partial repairs leave the property in worse condition than before the loss. Complete restoration to pre-loss condition is required.',
  },
  
  {
    id: 'BETTERMENT_DEDUCTIONS',
    name: 'Excessive Betterment Deductions',
    description: 'Excessive deductions for "upgrades" that are actually code requirements',
    severity: 'HIGH',
    detection: (estimate) => {
      return estimate.lineItems.filter(item => 
        item.description.match(/betterment|upgrade/i) &&
        item.depreciation > 50
      );
    },
    counter_argument: 'Code-required upgrades are not betterment. Building codes must be followed for legal occupancy.',
  },
  
  {
    id: 'CODE_UPGRADE_OMISSIONS',
    name: 'Code Upgrade Omissions',
    description: 'Missing code-required items (AFCI, GFCI, permits, etc.)',
    severity: 'CRITICAL',
    detection: (estimate) => {
      // Use code upgrade engine results
      return estimate.codeUpgradeFlags.length > 0;
    },
    counter_argument: 'Code upgrades are required by law and must be included in any repair estimate. Omitting them leaves the property in violation of building codes.',
  },
  
  {
    id: 'MATCHING_EXISTING',
    name: 'Matching Existing / Forced Partial Repairs',
    description: 'Forcing partial repairs to "match existing" instead of proper restoration',
    severity: 'HIGH',
    detection: (estimate) => {
      return estimate.lineItems.some(item => 
        item.description.match(/match existing|partial|patch/i)
      );
    },
    counter_argument: 'Partial repairs often result in visible lines of demarcation and improper restoration. Complete area restoration may be required for proper matching.',
  },
  
  {
    id: 'COSMETIC_EXCLUSIONS',
    name: 'Cosmetic Damage Exclusions',
    description: 'Denying visible damage as "cosmetic only"',
    severity: 'MODERATE',
    detection: (estimate) => {
      return estimate.lineItems.some(item => 
        item.description.match(/cosmetic|appearance/i) &&
        item.quantity === 0
      );
    },
    counter_argument: 'Visible damage affects property value and marketability. Cosmetic damage is covered under most policies.',
  },
  
  {
    id: 'FUNCTIONAL_OBSOLESCENCE',
    name: 'Functional Obsolescence Deductions',
    description: 'Excessive deductions for "functional obsolescence"',
    severity: 'HIGH',
    detection: (estimate) => {
      return estimate.lineItems.filter(item => 
        item.description.match(/obsolescence|outdated/i) &&
        item.depreciation > 30
      );
    },
    counter_argument: 'Functional obsolescence deductions should be minimal. The policy covers replacement with like kind and quality, not reduction for age.',
  },
];

interface CarrierTactic {
  tactic: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  description: string;
  estimated_impact: number;
  evidence: string[];
  counter_argument: string;
  line_items_affected: number[];
}

function detectCarrierTactics(estimate: ParsedEstimate): CarrierTacticsAnalysis {
  const tacticsDetected: CarrierTactic[] = [];
  let totalImpact = 0;
  
  for (const tacticDef of CARRIER_TACTICS) {
    const detected = tacticDef.detection(estimate);
    
    if (detected) {
      const impact = calculateTacticImpact(tacticDef, detected, estimate);
      const evidence = gatherEvidence(tacticDef, detected, estimate);
      
      tacticsDetected.push({
        tactic: tacticDef.name,
        severity: tacticDef.severity,
        description: tacticDef.description,
        estimated_impact: impact,
        evidence,
        counter_argument: tacticDef.counter_argument,
        line_items_affected: detected.map(item => item.lineNumber),
      });
      
      totalImpact += impact;
    }
  }
  
  // Calculate severity score (0-100)
  const severityScore = calculateSeverityScore(tacticsDetected, totalImpact);
  
  return {
    tacticsDetected,
    totalImpact,
    severityScore,
    recommendations: generateRecommendations(tacticsDetected),
  };
}
```

**Integration:**
- Add to main analysis pipeline in Step 11 (after labor validation)
- Output: `carrierTactics` section in report
- Include: detected tactics, financial impact, counter-arguments

---

## 📦 PHASE 3: ENHANCE SAFETY & GUARDRAILS

### 3.1 Upgrade to 6-Layer Guardrail System

**File:** `lib/enhanced-guardrails.ts` (upgrade from existing)

**Current:** Basic guardrails  
**Target:** 6-layer defense system (from Estimate Review Pro)

**6 Layers:**
1. **Layer 1: Input Validation** - Structured forms only, no free-text chat
2. **Layer 2: Content Filtering** - 40+ prohibited phrases blocked
3. **Layer 3: Document Classification** - 75% confidence threshold
4. **Layer 4: Processing Rules** - Deterministic logic, no AI decision-making
5. **Layer 5: Output Filtering** - Neutral language enforcement
6. **Layer 6: AI Safety** - Temperature 0.0, output scanning

**Implementation:**
```typescript
// Layer 1: Input Validation
function validateInput(input: any): ValidationResult {
  // Reject free-form chat
  if (input.type === 'chat' || input.conversational) {
    return {
      allowed: false,
      reason: 'This system does not support conversational input. Please use the structured upload form.',
    };
  }
  
  // Require structured data
  if (!input.estimateText && !input.estimateFile) {
    return {
      allowed: false,
      reason: 'Please provide an estimate document.',
    };
  }
  
  return { allowed: true };
}

// Layer 2: Content Filtering (40+ phrases)
const PROHIBITED_PHRASES = [
  // Payment/Entitlement
  'should be paid', 'must pay', 'owed to', 'entitled to', 'deserve',
  
  // Legal/Bad Faith
  'bad faith', 'breach of contract', 'sue', 'lawsuit', 'attorney', 'lawyer',
  'legal action', 'litigation',
  
  // Negotiation/Dispute
  'demand', 'insist', 'require payment', 'force them', 'make them pay',
  'fight', 'dispute', 'argue', 'negotiate',
  
  // Coverage Interpretation
  'coverage should', 'policy requires', 'they have to', 'obligation to pay',
  'contractual duty',
  
  // Unfair/Bias
  'unfair', 'cheating', 'lowball', 'ripping off', 'scam', 'fraud',
  
  // Advocacy
  'recommend hiring', 'should hire', 'get a lawyer', 'file a complaint',
  'report them', 'contact the DOI',
];

// Layer 3: Document Classification (75% confidence)
function classifyDocument(text: string): ClassificationResult {
  const confidence = calculateConfidence(text);
  
  if (confidence < 0.75) {
    return {
      classification: 'UNKNOWN',
      confidence,
      allowed: false,
      reason: 'Document format not recognized. Confidence below 75% threshold.',
    };
  }
  
  return {
    classification: detectFormat(text),
    confidence,
    allowed: true,
  };
}

// Layer 4: Processing Rules (deterministic only)
// All engines must be deterministic
// AI only used for formatting, never for decisions

// Layer 5: Output Filtering
function filterOutput(report: any): FilteredReport {
  // Scan for prohibited language
  const reportText = JSON.stringify(report);
  
  for (const phrase of PROHIBITED_PHRASES) {
    if (reportText.toLowerCase().includes(phrase)) {
      // Remove or replace prohibited content
      report = sanitizeReport(report, phrase);
    }
  }
  
  // Enforce neutral tone
  report = enforceNeutralTone(report);
  
  return report;
}

// Layer 6: AI Safety
const AI_CONFIG = {
  temperature: 0.0, // 100% deterministic
  max_tokens: 2000,
  response_format: { type: 'json_object' },
  timeout: 60000, // 60 seconds
  retries: 3,
};
```

---

### 3.2 Reduce Temperature to 0.0

**Current:** Temperature 0.2  
**Target:** Temperature 0.0 (100% deterministic)

**Files to Modify:**
- All AI calls in the system
- Change `temperature: 0.2` to `temperature: 0.0`

**Rationale:**
- More deterministic output
- Same input = same output (100% reproducible)
- Lower legal liability
- More defensible results

---

## 📦 PHASE 4: INTEGRATION & TESTING

### 4.1 Update Main Analysis Pipeline

**File:** `pages/api/claim-intelligence-v2.ts` (or equivalent)

**New Pipeline:**
```typescript
async function analyzeEstimate(estimateText: string, metadata: any) {
  
  // STEP 1: Input validation (Layer 1)
  const inputValidation = validateInput({ estimateText, metadata });
  if (!inputValidation.allowed) {
    throw new Error(inputValidation.reason);
  }
  
  // STEP 2: Content filtering (Layer 2)
  const contentCheck = checkProhibitedContent(estimateText);
  if (!contentCheck.allowed) {
    throw new Error(contentCheck.reason);
  }
  
  // STEP 3: Document classification (Layer 3)
  const classification = classifyDocument(estimateText);
  if (!classification.allowed) {
    throw new Error(classification.reason);
  }
  
  // STEP 4: Parse estimate (deterministic)
  const parsedEstimate = await parseEstimate(estimateText, classification);
  
  // STEP 5: Loss type & severity inference (NEW - deterministic)
  const lossExpectation = calculateLossExpectation(parsedEstimate);
  
  // STEP 6: Trade completeness scoring (NEW - deterministic)
  const tradeScores = calculateTradeCompleteness(parsedEstimate);
  
  // STEP 7: Code upgrade detection (NEW - deterministic)
  const codeUpgrades = analyzeCodeUpgrades(parsedEstimate);
  
  // STEP 8: Pricing validation (NEW - deterministic)
  const pricingAnalysis = await validatePricing(
    parsedEstimate.lineItems,
    metadata.region
  );
  
  // STEP 9: Depreciation validation (NEW - deterministic)
  const depreciationAnalysis = validateDepreciation(parsedEstimate.lineItems);
  
  // STEP 10: Labor rate validation (NEW - deterministic)
  const laborAnalysis = await validateLaborRates(
    parsedEstimate.lineItems,
    metadata.region
  );
  
  // STEP 11: Carrier tactic detection (NEW - deterministic)
  const carrierTactics = detectCarrierTactics({
    ...parsedEstimate,
    codeUpgradeFlags: codeUpgrades,
    pricingAnalysis,
    depreciationAnalysis,
    laborAnalysis,
  });
  
  // STEP 12: Exposure modeling (existing - deterministic)
  const exposureAnalysis = calculateExposure(parsedEstimate);
  
  // STEP 13: Multi-phase matching (existing - deterministic)
  const matchingAnalysis = await performMultiPhaseMatching(
    parsedEstimate,
    metadata.comparisonEstimate // if comparing two estimates
  );
  
  // STEP 14: AI insights (optional, non-blocking, Temperature 0.0)
  let aiInsights = undefined;
  if (metadata.includeAI !== false) {
    try {
      aiInsights = await generateAIInsights({
        parsedEstimate,
        lossExpectation,
        tradeScores,
        codeUpgrades,
        pricingAnalysis,
        depreciationAnalysis,
        laborAnalysis,
        carrierTactics,
      });
    } catch (error) {
      console.error('AI insights failed (non-blocking):', error);
      aiInsights = { error: 'AI insights unavailable' };
    }
  }
  
  // STEP 15: Output filtering (Layer 5)
  const report = filterOutput({
    classification,
    lossExpectation,
    tradeScores,
    codeUpgrades,
    pricingAnalysis,
    depreciationAnalysis,
    laborAnalysis,
    carrierTactics,
    exposureAnalysis,
    matchingAnalysis,
    aiInsights,
    metadata: {
      processingTime: Date.now() - startTime,
      enginesUsed: [
        'parser',
        'loss-expectation',
        'trade-completeness',
        'code-upgrade',
        'pricing-validation',
        'depreciation-validation',
        'labor-validation',
        'carrier-tactic-detection',
        'exposure-modeling',
        'multi-phase-matching',
        'ai-insights',
      ],
    },
  });
  
  return report;
}
```

---

### 4.2 Database Migrations

**Files to Create:**
- `migrations/add_pricing_database.sql`
- `migrations/add_labor_rates.sql`
- `migrations/add_regional_multipliers.sql`
- `migrations/enhance_audit_trail.sql`

**Apply in order:**
```bash
# 1. Pricing database
psql -d claimcommandpro -f migrations/add_pricing_database.sql

# 2. Labor rates
psql -d claimcommandpro -f migrations/add_labor_rates.sql

# 3. Regional multipliers
psql -d claimcommandpro -f migrations/add_regional_multipliers.sql

# 4. Enhanced audit trail
psql -d claimcommandpro -f migrations/enhance_audit_trail.sql
```

---

### 4.3 Frontend Updates

**Files to Modify:**
- `components/EstimateUploadForm.tsx` - Add region selection
- `components/ReportDisplay.tsx` - Display new sections
- `components/PricingAnalysisCard.tsx` - NEW
- `components/DepreciationAnalysisCard.tsx` - NEW
- `components/LaborAnalysisCard.tsx` - NEW
- `components/CarrierTacticsCard.tsx` - NEW
- `components/LossExpectationCard.tsx` - NEW
- `components/CodeUpgradesCard.tsx` - NEW
- `components/TradeCompletenessCard.tsx` - NEW

---

### 4.4 Testing Plan

**Unit Tests:**
- [ ] Test loss expectation engine (100+ scenarios)
- [ ] Test code upgrade detection (8 code items)
- [ ] Test trade completeness scoring (5 criteria)
- [ ] Test pricing validation (1000+ items)
- [ ] Test depreciation validation (50+ rules)
- [ ] Test labor rate validation (50+ regions)
- [ ] Test carrier tactic detection (10 tactics)

**Integration Tests:**
- [ ] Test full pipeline with sample estimates
- [ ] Test all 4 estimate formats
- [ ] Test all 5 loss types
- [ ] Test all 3 severity levels per loss type
- [ ] Test pricing validation with regional multipliers
- [ ] Test depreciation validation with edge cases
- [ ] Test labor validation with edge cases
- [ ] Test carrier tactic detection with real estimates

**Performance Tests:**
- [ ] Processing time <20 seconds
- [ ] Database query performance
- [ ] API response time
- [ ] Load testing (100 concurrent requests)

---

## 📊 SUCCESS METRICS

### Technical Metrics:
- [ ] Parsing accuracy: 95%+
- [ ] Loss type detection: 90%+
- [ ] Code upgrade detection: 95%+
- [ ] Pricing validation accuracy: 90%+
- [ ] Depreciation detection: 95%+
- [ ] Labor rate validation: 90%+
- [ ] Carrier tactic detection: 85%+
- [ ] Processing time: <20 seconds
- [ ] System reliability: 99%+

### Business Metrics:
- [ ] User satisfaction: 4.5/5 stars
- [ ] Report accuracy: 95%+
- [ ] Customer retention: 80%+
- [ ] Revenue increase: 30%+

---

## 🎯 TIMELINE

**Week 1: Loss Type Intelligence**
- Day 1-2: Implement loss expectation engine
- Day 3-4: Implement code upgrade detection
- Day 5: Implement trade completeness scoring
- Day 6-7: Integration & testing

**Week 2: Financial Validation**
- Day 1-2: Build pricing database (1000+ items)
- Day 3: Implement pricing validation engine
- Day 4: Implement depreciation validation
- Day 5: Implement labor rate validation
- Day 6-7: Integration & testing

**Week 3: Carrier Tactics & Safety**
- Day 1-2: Implement carrier tactic detection
- Day 3: Upgrade to 6-layer guardrails
- Day 4: Reduce temperature to 0.0
- Day 5-7: Integration & testing

**Week 4: Polish & Deploy**
- Day 1-2: Frontend updates
- Day 3: Database migrations
- Day 4-5: End-to-end testing
- Day 6: Performance optimization
- Day 7: Deploy to production

---

## 📝 CONSTRAINTS

**CRITICAL - MUST MAINTAIN:**
- ✅ Neutral tone (no advocacy)
- ✅ No legal advice
- ✅ No negotiation tactics
- ✅ No coverage interpretation
- ✅ Observational findings only
- ✅ Deterministic precedence (AI last)
- ✅ All existing functionality
- ✅ Backward compatibility
- ✅ Production uptime 99%+

**MUST ADD:**
- ✅ Explicit disclaimers about pricing validation
- ✅ Warnings about depreciation findings
- ✅ Notices about labor rate comparisons
- ✅ Disclaimers about carrier tactic detection

**Example Disclaimer:**
```
PRICING VALIDATION DISCLAIMER:
This report compares estimate pricing against market data from Xactimate, 
RSMeans, and regional surveys. Pricing validation is for informational 
purposes only and does not constitute:
- A guarantee of fair pricing
- Legal advice about coverage
- Recommendations for negotiation
- Opinions about carrier practices

For coverage questions, consult your policy or agent.
For legal questions, consult an attorney.
For pricing disputes, consult a licensed contractor or public adjuster.
```

---

## 🚀 DEPLOYMENT CHECKLIST

**Pre-Deployment:**
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Performance tests passing
- [ ] Database migrations tested
- [ ] Backup database
- [ ] Rollback plan ready

**Deployment:**
- [ ] Deploy to staging
- [ ] Test on staging
- [ ] Deploy to production
- [ ] Monitor error logs
- [ ] Monitor performance
- [ ] Monitor user feedback

**Post-Deployment:**
- [ ] Verify all features working
- [ ] Check database performance
- [ ] Monitor API costs (OpenAI)
- [ ] Collect user feedback
- [ ] Iterate based on feedback

---

## 📚 REFERENCE FILES

**Copy from Estimate Review Pro:**
- `lib/loss-expectation-engine.ts` (430 lines)
- `lib/code-upgrade-engine.ts` (380 lines)
- `lib/trade-completeness-engine.ts` (280 lines)
- `lib/enhanced-guardrails.ts` (upgrade existing)

**Create New:**
- `lib/pricing-validation-engine.ts` (~500 lines)
- `lib/depreciation-validator.ts` (~400 lines)
- `lib/labor-rate-validator.ts` (~400 lines)
- `lib/carrier-tactic-detector.ts` (~600 lines)

**Total New Code:** ~3,000 lines  
**Total Modified Code:** ~1,000 lines  
**Total Effort:** 120-160 hours (3-4 weeks)

---

## 🎓 LEARNING RESOURCES

**Pricing Data Sources:**
- Xactimate Price List (subscription required)
- RSMeans Online (subscription required)
- Bureau of Labor Statistics (BLS) - free
- HomeAdvisor Cost Guides - free
- Angi (formerly Angie's List) - free

**Code References:**
- National Electrical Code (NEC) 2023
- International Residential Code (IRC) 2021
- International Building Code (IBC) 2021

**Industry Standards:**
- IICRC S500 (Water Damage)
- IICRC S520 (Mold Remediation)
- NFPA 1 (Fire Code)

---

**END OF CURSOR PROMPT**

---

## 📋 QUICK START

To begin implementation, copy this entire prompt and paste it into a new Cursor chat in the Claim Command Pro codebase. Then say:

**"Implement Phase 1: Loss Type Intelligence. Start with the loss expectation engine."**

Cursor will guide you through each phase systematically.

---

**Generated:** February 27, 2026  
**For:** Claim Command Pro Upgrade  
**Reference:** Estimate Review Pro v2.0  
**Complexity:** Enterprise-grade  
**Timeline:** 3-4 weeks
