# ESTIMATE REVIEW PRO — ARCHITECTURE

**Version:** 1.0.0  
**Last Updated:** 2026-02-10  
**Status:** Production-Ready

---

## SYSTEM OVERVIEW

Estimate Review Pro (ERP) is an **enforcement-grade claim intelligence platform** that transforms multi-modal inputs (Xactimate estimates, dimension data, expert reports, photos) into **deterministic financial exposure analysis** with structured deviation detection.

### Core Principle

**Deterministic First, AI Overlay Optional**

All financial calculations, geometry math, and deviation detection are **rule-based and reproducible**. AI is used only for:
- Classification (photo damage types)
- Executive summary generation (non-financial)
- Fallback when deterministic parsing fails

---

## ARCHITECTURE LAYERS

### 1. INPUT LAYER

**Files:**
- `lib/security-guards.ts` — File validation, sanitization, threat detection
- `lib/validation-engine.ts` — Input structure validation

**Responsibilities:**
- File type/size/MIME validation
- Filename sanitization (prevent directory traversal)
- Executable content detection
- CSV structure validation
- Input gating (estimate required, reject standalone inputs)

**Constraints:**
- Max file size: 10 MB
- Allowed types: PDF, TXT, CSV, JPG, PNG
- Max rooms: 50
- Max line items: 1,000
- Max photos: 20

---

### 2. PARSING LAYER

**Files:**
- `lib/xactimate-structural-parser.ts` — Column-mapped estimate parsing
- `lib/report-parser.ts` — Expert report directive extraction
- `lib/matterport-adapter.ts` — Dimension data ingestion

**Responsibilities:**
- Convert raw text/CSV into structured JSON
- Extract trade codes, quantities, units, prices
- Parse expert directives with measurability flags
- Map Matterport CSV to room dimensions

**Output:**
- `StructuredEstimate` (line items, totals, parse confidence)
- `ParsedReport` (directives, priority, measurability)
- `DimensionInput` (rooms with length/width/height)

**Constraints:**
- Parse confidence ≥ 75% required
- Column alignment detection mandatory
- No guessing of quantities
- Reject malformed data

---

### 3. CALCULATION LAYER

**Files:**
- `lib/dimension-engine.ts` — Expected quantity calculations
- `lib/per-room-deviation-engine.ts` — Per-room geometry deviation
- `lib/height-extraction-engine.ts` — Height validation & extraction
- `lib/exposure-engine.ts` — Financial exposure modeling
- `lib/loss-expectation-engine.ts` — Severity-based loss modeling
- `lib/trade-completeness-engine.ts` — Trade scope scoring
- `lib/cost-baseline.ts` — Regional cost database

**Responsibilities:**

#### Dimension Engine
- Calculate expected quantities from room dimensions
- Wall SF = Perimeter × Height
- Ceiling SF = Length × Width
- Floor SF = Length × Width
- Perimeter LF = 2 × (Length + Width)
- Preserve per-room data (no aggregation loss)

#### Per-Room Deviation Engine
- **Per-room iteration** (not aggregate shortcuts)
- Map estimate items to specific rooms
- Calculate height delta per room: `Perimeter × (ReportHeight - EstimateHeight)`
- Sum deltas across rooms
- Validate extracted height ≤ room ceiling height
- Handle unmapped items with aggregate fallback
- Zero perimeter guard
- Negative delta cap (no negative exposure)

#### Height Extraction Engine
- Extract height from description (e.g., "Remove drywall 4 ft")
- Calculate height from quantity: `Height = Quantity SF ÷ Perimeter LF`
- Validate extracted height ≤ room ceiling height
- Reject if validation fails (structured error)
- Confidence scoring (HIGH/MEDIUM/LOW)

#### Exposure Engine
- Calculate min/max cost ranges using `COST_BASELINE`
- No static fallback values
- Tie exposure to parsed quantities or dimension deltas
- Reject if neither exists

#### Cost Baseline
- Version: 1.0.0 (2026-02-10)
- Region: US_NATIONAL_AVERAGE
- 30+ trade items with min/max costs
- Logged in every report

---

### 4. INTELLIGENCE LAYER

**Files:**
- `lib/claim-intelligence-engine.ts` — Unified orchestration
- `lib/photo-analysis-engine.ts` — GPT-4 Vision classification

**Responsibilities:**
- Orchestrate all engines
- Combine deviation + exposure + code risk
- Calculate consolidated risk score (0-100)
- Generate executive summary (neutral tone)
- Classify photo damage (no quantity inference)

**Risk Score Formula:**
```
Base = (100 - StructuralIntegrity) × 0.30
     + BaselineExposure% × 0.25
     + DeviationExposure% × 0.30
     + CodeRisk% × 0.15

Multiplier = CriticalDeviations > 0 ? 1.2 : 1.0

ConsolidatedRiskScore = min(Base × Multiplier, 100)
```

---

### 5. OUTPUT LAYER

**Files:**
- `lib/output-validator.ts` — Output structure validation
- `lib/pdf-generator.ts` — Professional PDF reports
- `lib/excel-export.ts` — Excel workbook generation
- `lib/claim-letter-generator.ts` — Neutral claim letters

**Responsibilities:**
- Validate all numeric fields (no NaN, no undefined)
- Validate exposure ranges (min ≤ max)
- Validate risk score (0-100)
- Lock PDF format (fixed layout, typography, sections)
- Generate Excel with multiple sheets
- Generate claim letter (fact-based, neutral)

**Constraints:**
- No undefined/NaN in output
- Risk score capped at 100
- Exposure ranges validated
- PDF format locked (no dynamic changes)

---

### 6. INFRASTRUCTURE LAYER

**Files:**
- `lib/audit-trail.ts` — Enterprise audit logging
- `lib/telemetry.ts` — Performance tracking
- `lib/performance-guards.ts` — Timeouts, rate limiting
- `lib/structured-errors.ts` — Unified error handling

**Responsibilities:**

#### Audit Trail
- Log parse confidence
- Log room-level perimeter/heights
- Log delta calculations with formulas
- Log cost per unit
- Log exposure math
- Log risk score breakdown
- Log AI retry count
- Return full `auditTrail` object

#### Telemetry
- Track execution time per engine
- Track parse success/rejection rates
- Track deviation frequency
- Track average exposure
- Persist to `logs/telemetry/metrics.jsonl`
- No silent failures

#### Performance Guards
- Max processing time: 30 seconds
- Timeout wrapper for all async operations
- Rate limiting: 10 requests/minute per IP
- Graceful AI failure (fallback to deterministic)
- Concurrent request guard

#### Structured Errors
- Unified format: `{ errorCode, errorType, message, remediation, timestamp }`
- No raw stack traces in production
- User-friendly remediation guidance
- Error type classification

---

## API ENDPOINTS

### POST `/api/claim-intelligence`

**Input:**
```json
{
  "estimateText": "string (REQUIRED)",
  "dimensions": {
    "rooms": [
      { "name": "string", "length": number, "width": number, "height": number }
    ]
  },
  "expertReport": "string",
  "photos": ["base64 string"]
}
```

**Output:**
```json
{
  "success": true,
  "data": {
    "parseConfidence": 0.95,
    "structuralIntegrityScore": 72,
    "consolidatedRiskScore": 68,
    "baselineExposure": { "min": 5000, "max": 15000 },
    "deviationExposure": { "min": 8000, "max": 20000 },
    "codeRiskExposure": { "min": 2000, "max": 6000 },
    "deviations": [...],
    "classification": {...},
    "auditTrail": {...},
    "metadata": {...}
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "errorCode": "LOW_PARSE_CONFIDENCE",
    "errorType": "VALIDATION_ERROR",
    "message": "Parse confidence 68.5% below minimum threshold (75%)",
    "remediation": "Verify estimate format is Xactimate standard...",
    "timestamp": "2026-02-10T12:34:56.789Z"
  }
}
```

---

## DATA FLOW

```
1. REQUEST
   ↓
2. SECURITY VALIDATION (sanitize, MIME check, size limit)
   ↓
3. INPUT GATING (estimate required, validate structure)
   ↓
4. PARSING
   ├─ Xactimate Parser → StructuredEstimate
   ├─ Report Parser → ParsedReport
   └─ Dimension Adapter → ExpectedQuantities
   ↓
5. VALIDATION (parse confidence ≥ 75%, no NaN, no zero perimeter)
   ↓
6. CALCULATION
   ├─ Dimension Engine → Expected quantities per room
   ├─ Per-Room Deviation Engine → Geometry-based deltas
   ├─ Exposure Engine → Financial impact ranges
   ├─ Loss Expectation Engine → Severity inference
   ├─ Trade Completeness Engine → Scope scoring
   └─ Photo Analysis Engine → Damage classification
   ↓
7. INTELLIGENCE SYNTHESIS
   ├─ Consolidated Risk Score (0-100)
   ├─ Executive Summary (neutral)
   └─ Audit Trail (full transparency)
   ↓
8. OUTPUT VALIDATION (no NaN, ranges valid, score 0-100)
   ↓
9. RESPONSE (JSON, PDF, Excel, Claim Letter)
```

---

## PERFORMANCE CHARACTERISTICS

| Metric | Target | Enforcement |
|--------|--------|-------------|
| Max processing time | 30 seconds | Hard timeout |
| Parse time | < 10 seconds | Timeout wrapper |
| Dimension calculation | < 5 seconds | Timeout wrapper |
| Deviation calculation | < 10 seconds | Timeout wrapper |
| AI vision (per photo) | < 15 seconds | Graceful fallback |
| Rate limit | 10 req/min per IP | Enforced |
| Max file size | 10 MB | Rejected |
| Max rooms | 50 | Rejected |

---

## SECURITY POSTURE

### Threat Model

1. **Malicious File Upload**
   - Mitigation: MIME validation, executable detection, size limits
2. **Directory Traversal**
   - Mitigation: Filename sanitization, path.basename()
3. **Injection Attacks**
   - Mitigation: Input sanitization, no eval(), no shell commands
4. **DoS via Large Files**
   - Mitigation: Size limits, timeout wrappers, rate limiting
5. **Data Exfiltration**
   - Mitigation: No file writes to user-controlled paths

### Security Controls

- File type whitelist
- MIME type validation
- Executable content detection
- Filename sanitization
- Rate limiting per IP
- Timeout enforcement
- Input size limits
- CSV structure validation

---

## SCALABILITY

### Current Limits
- Single-threaded Node.js
- In-memory processing
- File-based telemetry

### Scaling Path
1. **Horizontal:** Deploy multiple instances behind load balancer
2. **Async Processing:** Queue large files for background processing
3. **Database:** Migrate telemetry to PostgreSQL/TimescaleDB
4. **Caching:** Cache parsed estimates by hash
5. **CDN:** Serve static assets (PDFs, Excel) via CDN

---

## DEPLOYMENT

### Environment Variables
```
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
NODE_ENV=production
```

### Build
```bash
npm run build
```

### Run
```bash
npm start
```

### Health Check
```
GET /api/health
```

---

## MONITORING

### Key Metrics
- Parse success rate
- Parse rejection rate
- Average processing time
- Deviation detection rate
- Average exposure
- Average risk score
- Error rate by type

### Logs
- `logs/telemetry/metrics.jsonl` — Request metrics
- `logs/telemetry/events.jsonl` — Detailed events

### Alerts
- Processing time > 25 seconds
- Parse success rate < 80%
- Error rate > 5%

---

## MAINTENANCE

### Cost Baseline Updates
1. Edit `lib/cost-baseline.ts`
2. Increment `COST_BASELINE_VERSION`
3. Update `COST_BASELINE_DATE`
4. Run regression tests
5. Deploy

### Adding New Trade Codes
1. Add to `TRADE_CODE_MAP` in `xactimate-structural-parser.ts`
2. Add cost baseline in `cost-baseline.ts`
3. Update deviation engine if geometry-based
4. Add test cases
5. Update documentation

---

## DEPENDENCIES

### Core
- Next.js 14
- React 18
- TypeScript 5
- Tailwind CSS

### Parsing
- pdf-parse (PDF extraction)
- Zod (schema validation)

### AI
- OpenAI GPT-4 Turbo Preview
- OpenAI GPT-4 Vision Preview

### Infrastructure
- Supabase (database, auth)
- Stripe (payments)

---

## VERSION HISTORY

### 1.0.0 (2026-02-10)
- Enterprise hardening complete
- Per-room geometry validation
- Height extraction with validation
- Structured error handling
- Performance guards
- Security hardening
- Telemetry system
- Comprehensive documentation
