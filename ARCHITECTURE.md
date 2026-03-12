# CLAIM INTELLIGENCE ENGINE - ARCHITECTURE

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                    (Next.js Dashboard)                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ PDF Upload
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                    NETLIFY FUNCTIONS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         analyze-with-intelligence (NEW)                  │  │
│  │                                                          │  │
│  │  ┌────────────────┐      ┌──────────────────────────┐  │  │
│  │  │ analyze-       │      │ Claim Intelligence       │  │  │
│  │  │ estimate       │      │ Pipeline                 │  │  │
│  │  │ (EXISTING)     │      │ (NEW)                    │  │  │
│  │  │                │      │                          │  │  │
│  │  │ • PDF Parse    │      │ ┌──────────────────────┐ │  │  │
│  │  │ • Guardrails   │      │ │ 1. Pricing Validator │ │  │  │
│  │  │ • Classify     │      │ └──────────────────────┘ │  │  │
│  │  │ • Analyze      │      │ ┌──────────────────────┐ │  │  │
│  │  │ • Format       │      │ │ 2. Depreciation Val  │ │  │  │
│  │  └────────┬───────┘      │ └──────────────────────┘ │  │  │
│  │           │              │ ┌──────────────────────┐ │  │  │
│  │           │              │ │ 3. Labor Validator   │ │  │  │
│  │           │              │ └──────────────────────┘ │  │  │
│  │           │              │ ┌──────────────────────┐ │  │  │
│  │           │              │ │ 4. Carrier Tactics   │ │  │  │
│  │           │              │ └──────────────────────┘ │  │  │
│  │           │              │ ┌──────────────────────┐ │  │  │
│  │           │              │ │ 5. O&P Gap Detector  │ │  │  │
│  │           │              │ └──────────────────────┘ │  │  │
│  │           │              └──────────┬───────────────┘  │  │
│  │           │                         │                  │  │
│  │           └─────────┬───────────────┘                  │  │
│  │                     │                                  │  │
│  │                     ↓                                  │  │
│  │              Enhanced Report                           │  │
│  │              + Intelligence                            │  │
│  └──────────────────────┬─────────────────────────────────┘  │
│                         │                                    │
└─────────────────────────┼────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE DATABASE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────┐  │
│  │  audit_events    │  │  ai_decisions    │  │  reports    │  │
│  │                  │  │                  │  │             │  │
│  │  • report_id     │  │  • report_id     │  │  • id       │  │
│  │  • event_type    │  │  • engine_name   │  │  • intel... │  │
│  │  • event_data    │  │  • confidence    │  │  • issues   │  │
│  │  • created_at    │  │  • model_used    │  │  • summary  │  │
│  └──────────────────┘  └──────────────────┘  └─────────────┘  │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐                   │
│  │  pricing_db      │  │  labor_rates     │                   │
│  │                  │  │                  │                   │
│  │  • item_code     │  │  • region        │                   │
│  │  • market_price  │  │  • trade         │                   │
│  │  • region        │  │  • hourly_rate   │                   │
│  └──────────────────┘  └──────────────────┘                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Upload Phase
```
User → Dashboard → analyze-with-intelligence
                         ↓
                   analyze-estimate
                         ↓
                   PDF Extraction
                         ↓
                   Text Parsing
                         ↓
                   Line Items
```

### 2. Standard Analysis Phase (Existing)
```
Line Items → Guardrails Check
           → Classification
           → Line Item Analysis
           → Output Formatting
           → Base Report
```

### 3. Intelligence Phase (New)
```
Base Report → standardizeEstimate()
                     ↓
            StandardizedEstimate
                     ↓
         ┌───────────┴───────────┐
         ↓                       ↓
    Engine Adapters      Pipeline Orchestrator
         ↓                       ↓
    EngineResult          Aggregate Results
         ↓                       ↓
    ClaimIssue[]          Summary Statistics
         ↓                       ↓
    AuditEvent[]          Database Logging
                               ↓
                        Enhanced Report
```

### 4. Database Logging Phase
```
Pipeline Results → logAuditEvents()
                 → logAIDecisions()
                 → updateReportWithIntelligence()
                         ↓
                   Supabase Tables
```

---

## Type System

### Core Types
```typescript
StandardizedEstimate
├── id: string
├── carrier: string
├── lineItems: StandardizedLineItem[]
│   ├── lineNumber: number
│   ├── tradeCode: string
│   ├── description: string
│   ├── quantity: number
│   ├── unit: string
│   ├── unitPrice: number
│   ├── rcv: number
│   ├── acv: number
│   └── depreciation: number
├── totals
│   ├── rcv: number
│   ├── acv: number
│   └── depreciation: number
└── metadata
    ├── format: string
    ├── region: string
    └── lossType: string

EngineResult
├── issues: ClaimIssue[]
├── audit: AuditEvent[]
└── metadata: Record<string, any>

ClaimIssue
├── id: string
├── type: string
├── severity: 'low' | 'medium' | 'high' | 'critical'
├── title: string
├── description: string
├── financialImpact?: number
├── lineItemsAffected?: number[]
└── recommendation?: string

AuditEvent
├── engine: string
├── decision: string
├── confidence: number
├── timestamp: number
├── inputData?: any
├── outputData?: any
└── processingTimeMs?: number
```

---

## Engine Pipeline

### Sequential Execution
```
1. Pricing Validation
   ├── Input: StandardizedEstimate
   ├── Process: Compare prices to market data
   ├── Output: Underpriced/overpriced items
   └── Financial Impact: $X underpriced

2. Depreciation Validation
   ├── Input: StandardizedEstimate
   ├── Process: Validate depreciation percentages
   ├── Output: Excessive/improper depreciation
   └── Financial Impact: $Y recoverable

3. Labor Rate Validation
   ├── Input: StandardizedEstimate
   ├── Process: Compare labor rates to regional standards
   ├── Output: Undervalued labor items
   └── Financial Impact: $Z undervalued

4. Carrier Tactic Detection
   ├── Input: StandardizedEstimate + Previous Results
   ├── Process: Pattern matching for 10 tactics
   ├── Output: Detected tactics with evidence
   └── Financial Impact: $A total exposure

5. O&P Gap Detection
   ├── Input: StandardizedEstimate
   ├── Process: Detect missing overhead & profit
   ├── Output: O&P gaps by type
   └── Financial Impact: $B missing O&P

Aggregate:
└── Total Financial Impact: $X + $Y + $Z + $A + $B
```

---

## Error Handling Strategy

### Levels of Failure

**Level 1: Individual Engine Failure**
```
try {
  runPricingValidation()
} catch (error) {
  log error
  continue to next engine
}
```
- Result: Other engines continue
- User sees: Partial results

**Level 2: Pipeline Failure**
```
try {
  runClaimIntelligencePipeline()
} catch (error) {
  return base report
}
```
- Result: Falls back to standard analysis
- User sees: Standard report (no intelligence)

**Level 3: Complete Failure**
```
try {
  analyze-with-intelligence
} catch (error) {
  call analyze-estimate directly
}
```
- Result: Original functionality preserved
- User sees: Standard analysis

---

## Database Schema

### audit_events
```sql
CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID REFERENCES reports(id),
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### ai_decisions
```sql
CREATE TABLE ai_decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID REFERENCES reports(id),
  engine_name TEXT NOT NULL,
  decision_type TEXT NOT NULL,
  input_data JSONB,
  output_data JSONB,
  confidence_score DECIMAL(5,4),
  model_used TEXT,
  tokens_used INTEGER,
  cost DECIMAL(10,6),
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### reports (columns added)
```sql
ALTER TABLE reports ADD COLUMN intelligence_issues JSONB;
ALTER TABLE reports ADD COLUMN intelligence_summary JSONB;
ALTER TABLE reports ADD COLUMN critical_issues_count INTEGER;
ALTER TABLE reports ADD COLUMN high_issues_count INTEGER;
ALTER TABLE reports ADD COLUMN total_financial_impact DECIMAL(12,2);
ALTER TABLE reports ADD COLUMN intelligence_processed_at TIMESTAMPTZ;
```

---

## API Response Format

### Standard Endpoint (Unchanged)
```json
POST /.netlify/functions/analyze-estimate

Response:
{
  "status": "SUCCESS",
  "classification": { ... },
  "analysis": { ... },
  "report": { ... },
  "timestamp": "2026-03-12T20:00:00Z"
}
```

### Enhanced Endpoint (New)
```json
POST /.netlify/functions/analyze-with-intelligence

Response:
{
  "status": "SUCCESS",
  "classification": { ... },
  "analysis": { ... },
  "report": { ... },
  "intelligence": {
    "enabled": true,
    "issues": [
      {
        "id": "pricing-under-1",
        "type": "pricing_suppression",
        "severity": "high",
        "title": "Underpriced Line Item",
        "description": "Line 1: \"Drywall repair\" is 32.5% below market rate",
        "financialImpact": 450.00,
        "lineItemsAffected": [1],
        "recommendation": "Market rate suggests $1,385.00 vs estimated $935.00"
      }
    ],
    "summary": {
      "totalIssues": 12,
      "criticalIssues": 2,
      "highIssues": 5,
      "mediumIssues": 3,
      "lowIssues": 2,
      "totalFinancialImpact": 8450.00,
      "enginesExecuted": [
        "pricing-validator",
        "depreciation-validator",
        "labor-rate-validator",
        "carrier-tactic-detector",
        "op-gap-detector"
      ],
      "processingTimeMs": 2340
    }
  },
  "timestamp": "2026-03-12T20:00:00Z"
}
```

---

## File Structure

```
estimatereviewpro/
├── types/
│   └── claim-engine.ts              (NEW - 75 lines)
│
├── lib/
│   ├── adapters/
│   │   └── engine-adapters.ts       (NEW - 410 lines)
│   │
│   ├── pipeline/
│   │   └── claimIntelligencePipeline.ts  (NEW - 280 lines)
│   │
│   ├── database/
│   │   └── audit-logger.ts          (NEW - 165 lines)
│   │
│   └── [existing engines]
│       ├── pricing-validation-engine.ts
│       ├── depreciation-validator.ts
│       ├── labor-rate-validator.ts
│       ├── carrier-tactic-detector.ts
│       └── op-gap-detector.ts
│
├── netlify/
│   └── functions/
│       ├── analyze-estimate.js      (EXISTING - unchanged)
│       └── analyze-with-intelligence.js  (NEW - 115 lines)
│
└── supabase/
    └── migrations/
        └── 03_pricing_and_validation_schema.sql  (EXISTING)
```

---

## Performance Characteristics

### Processing Time
- PDF Extraction: ~1-2s
- Standard Analysis: ~2-3s
- Intelligence Pipeline: ~2-3s
- Database Logging: ~0.5s
- **Total**: ~5-8s per estimate

### Database Operations
- Audit Events: 1 batch insert (5 records)
- AI Decisions: 1 batch insert (5 records)
- Report Update: 1 update query
- **Total**: 3 queries per analysis

### Memory Usage
- Estimate data: ~50-200 KB
- Engine results: ~10-50 KB per engine
- Total memory: ~100-500 KB per request

---

## Scalability

### Horizontal Scaling
- Netlify Functions: Auto-scales
- Supabase: Connection pooling
- No stateful components

### Optimization Opportunities
1. Cache market pricing data
2. Batch database operations
3. Parallel engine execution (future)
4. Result caching for duplicate estimates

---

## Security

### Authentication
- Supabase RLS policies
- User-scoped data access
- Service role key for functions

### Data Privacy
- No PII in audit logs
- Encrypted database connections
- Secure environment variables

### API Security
- Rate limiting (Netlify)
- Input validation
- Error message sanitization

---

**Architecture Version**: 1.0  
**Last Updated**: 2026-03-12  
**Status**: Production Ready
