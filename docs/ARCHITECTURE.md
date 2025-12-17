# 🏗️ ESTIMATE REVIEW PRO - SYSTEM ARCHITECTURE

## OVERVIEW

Estimate Review Pro is a serverless, procedural insurance estimate analysis system built on Netlify Functions with strict safety guardrails.

---

## 🎯 DESIGN PRINCIPLES

1. **Safety First** - Multiple layers of guardrails
2. **Procedural, Not Conversational** - No free-form chat
3. **Neutral Output** - Facts only, no opinions
4. **Deterministic** - Temperature 0.2, consistent results
5. **Fail-Safe** - Reject ambiguous or prohibited requests

---

## 📊 SYSTEM FLOW

```
┌─────────────────────────────────────────────────────────────┐
│                         USER INPUT                          │
│  (upload-estimate.html - Structured form with dropdowns)   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              STEP 1: GUARDRAILS CHECK                       │
│         (estimate-risk-guardrails.js)                       │
│                                                             │
│  • Block prohibited phrases (40+)                          │
│  • Block negotiation requests                              │
│  • Block coverage interpretation                           │
│  • Block legal advice requests                             │
│  • Pattern detection for sneaky attempts                   │
│                                                             │
│  ❌ FAIL → Return 403 Error                                │
│  ✅ PASS → Continue to Step 2                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              STEP 2: CLASSIFICATION                         │
│            (estimate-classifier.js)                         │
│                                                             │
│  • Keyword-based scoring                                   │
│  • Property / Auto / Commercial                            │
│  • Minimum 3 keywords required                             │
│  • Ambiguity detection (within 2 points)                   │
│                                                             │
│  ❌ FAIL → Return 400 Error (Unknown/Ambiguous)            │
│  ✅ PASS → Continue to Step 3                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│           STEP 3: LINE ITEM ANALYSIS                        │
│         (estimate-lineitem-analyzer.js)                     │
│                                                             │
│  • Check for expected categories                           │
│  • Detect missing categories                               │
│  • Detect zero-quantity items                              │
│  • Detect under-scoped items                               │
│  • Generate neutral observations                           │
│                                                             │
│  ✅ Always succeeds → Continue to Step 4                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│            STEP 4: OUTPUT FORMATTING                        │
│          (estimate-output-formatter.js)                     │
│                                                             │
│  • Build 5-section report:                                 │
│    1. Summary                                              │
│    2. Included Items                                       │
│    3. Potential Omissions                                  │
│    4. Potential Under-Scoping                              │
│    5. Limitations                                          │
│                                                             │
│  • Enforce neutral language                                │
│  • Add disclaimers                                         │
│                                                             │
│  ✅ Always succeeds → Return to user                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    RESULTS DISPLAY                          │
│         (upload-estimate.html - Results section)            │
│                                                             │
│  • Show classification                                     │
│  • Show full report                                        │
│  • Download button                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 COMPONENT ARCHITECTURE

### Frontend Layer

```
public/upload-estimate.html
├── Warning Banner (What tool does NOT do)
├── Form Section
│   ├── Estimate Type Dropdown (Property/Auto/Commercial)
│   ├── Damage Type Dropdown (Water/Fire/Wind/etc)
│   ├── Estimate Text Area (paste only, no file upload yet)
│   └── Acknowledgement Checkbox
├── Limitations Section
└── Results Display Section
```

### Backend Layer (Netlify Functions)

```
netlify/functions/
├── analyze-estimate.js (Orchestrator)
│   ├── Calls: estimate-risk-guardrails.js
│   ├── Calls: estimate-classifier.js
│   ├── Calls: estimate-lineitem-analyzer.js
│   └── Calls: estimate-output-formatter.js
│
├── estimate-risk-guardrails.js (Safety)
│   ├── Prohibited phrases list
│   ├── Prohibited requests list
│   └── Pattern detection
│
├── estimate-classifier.js (Classification)
│   ├── Property keywords
│   ├── Auto keywords
│   ├── Commercial keywords
│   └── Scoring algorithm
│
├── estimate-lineitem-analyzer.js (Analysis)
│   ├── Expected categories by type
│   ├── Under-scoping patterns
│   └── Observation generator
│
├── estimate-output-formatter.js (Formatting)
│   ├── Report structure
│   ├── Neutral language enforcement
│   └── Limitations builder
│
├── generate-estimate-review.js (AI Alternative)
│   ├── OpenAI GPT-4 integration
│   ├── Temperature 0.2
│   ├── Constrained system prompt
│   └── Output safety scanning
│
└── test-safety.js (Testing)
    ├── 10 test cases
    └── Automated validation
```

---

## 🔒 SAFETY ARCHITECTURE

### Multi-Layer Defense

```
┌─────────────────────────────────────────────────────────────┐
│                    LAYER 1: INPUT                           │
│                  Frontend Validation                        │
│                                                             │
│  • Required fields                                         │
│  • Structured dropdowns only                               │
│  • No free-form question fields                            │
│  • Explicit warnings                                       │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    LAYER 2: GUARDRAILS                      │
│                  Content Filtering                          │
│                                                             │
│  • 40+ prohibited phrases                                  │
│  • Pattern detection                                       │
│  • Request type validation                                 │
│  • Immediate rejection (403)                               │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  LAYER 3: CLASSIFICATION                    │
│                  Document Validation                        │
│                                                             │
│  • Keyword-based scoring                                   │
│  • Minimum threshold (3 keywords)                          │
│  • Ambiguity detection                                     │
│  • Unknown type rejection (400)                            │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   LAYER 4: PROCESSING                       │
│                  Neutral Analysis Only                      │
│                                                             │
│  • Factual observations only                               │
│  • No pricing opinions                                     │
│  • No recommendations                                      │
│  • No coverage interpretation                              │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    LAYER 5: OUTPUT                          │
│                  Language Filtering                         │
│                                                             │
│  • Neutral language only                                   │
│  • Required limitations section                            │
│  • No "should", "must", "entitled"                         │
│  • Clear disclaimers                                       │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   LAYER 6: AI SAFETY                        │
│              (When using AI generation)                     │
│                                                             │
│  • Temperature 0.2 (deterministic)                         │
│  • Constrained system prompt                               │
│  • Output scanning for prohibited phrases                  │
│  • Regeneration if violations found                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ DATA FLOW

### Request Flow

```
User Input (JSON)
    │
    ├─ estimateText: string
    ├─ lineItems: string[] (optional)
    ├─ userInput: string (optional)
    └─ metadata: object
        ├─ estimateType: string
        └─ damageType: string
    │
    ▼
Guardrails Check
    │
    ├─ PASS → Continue
    └─ FAIL → 403 Error
    │
    ▼
Classification
    │
    ├─ classification: "PROPERTY" | "AUTO" | "COMMERCIAL"
    ├─ confidence: "HIGH" | "MEDIUM"
    └─ scores: { property, auto, commercial }
    │
    ▼
Line Item Analysis
    │
    ├─ includedCategories: array
    ├─ missingCategories: array
    ├─ zeroQuantityItems: array
    ├─ potentialUnderScoping: array
    └─ observations: array
    │
    ▼
Output Formatting
    │
    ├─ summary: string
    ├─ includedItems: string
    ├─ potentialOmissions: string
    ├─ potentialUnderScoping: string
    └─ limitations: string
    │
    ▼
Response (JSON)
    │
    ├─ status: "SUCCESS"
    ├─ classification: object
    ├─ analysis: object
    ├─ report: object
    └─ timestamp: string
```

---

## 🌐 DEPLOYMENT ARCHITECTURE

### Netlify Serverless

```
┌─────────────────────────────────────────────────────────────┐
│                      NETLIFY CDN                            │
│                  (Global Edge Network)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌──────────────────┐          ┌──────────────────┐
│  Static Assets   │          │  Serverless      │
│                  │          │  Functions       │
│  • HTML          │          │                  │
│  • CSS           │          │  • Node.js 20    │
│  • JavaScript    │          │  • Auto-scaling  │
│  • Images        │          │  • Pay-per-use   │
└──────────────────┘          └────────┬─────────┘
                                       │
                         ┌─────────────┴─────────────┐
                         │                           │
                         ▼                           ▼
              ┌────────────────────┐      ┌────────────────────┐
              │  OpenAI API        │      │  Environment Vars  │
              │  (GPT-4)           │      │                    │
              │  Temperature: 0.2  │      │  • OPENAI_API_KEY  │
              └────────────────────┘      │  • URL             │
                                          │  • NODE_ENV        │
                                          └────────────────────┘
```

---

## 📦 TECHNOLOGY STACK

### Runtime
- **Node.js 20** - JavaScript runtime
- **Netlify Functions** - Serverless compute

### Frontend
- **HTML5** - Markup
- **CSS3** - Styling (no frameworks)
- **Vanilla JavaScript** - No React/Vue for upload page

### Backend
- **Next.js** - Framework (for existing app)
- **OpenAI SDK** - AI integration
- **HTTP/HTTPS** - Inter-function communication

### Optional
- **Supabase** - Authentication (not yet implemented)
- **Stripe** - Payments (not yet implemented)

---

## 🔄 FUNCTION ORCHESTRATION

### Main Orchestrator (analyze-estimate.js)

```javascript
async function analyzeEstimate(input) {
  // Step 1: Guardrails
  const guardrails = await callFunction('estimate-risk-guardrails', {
    text: input.estimateText,
    userInput: input.userInput
  });
  
  if (guardrails.statusCode !== 200) {
    return error(403, guardrails.data);
  }
  
  // Step 2: Classification
  const classification = await callFunction('estimate-classifier', {
    text: input.estimateText,
    lineItems: input.lineItems
  });
  
  if (classification.statusCode !== 200) {
    return error(400, classification.data);
  }
  
  // Step 3: Analysis
  const analysis = await callFunction('estimate-lineitem-analyzer', {
    lineItems: input.lineItems,
    classification: classification.data.classification
  });
  
  // Step 4: Formatting
  const report = await callFunction('estimate-output-formatter', {
    analysis: analysis.data.analysis,
    classification: classification.data.classification
  });
  
  return success(200, {
    classification: classification.data,
    analysis: analysis.data,
    report: report.data.report
  });
}
```

---

## 🧪 TESTING ARCHITECTURE

### Test Suite (test-safety.js)

```
Test Cases (10 total)
├── Valid Estimates (2)
│   ├── Property estimate → Should pass
│   └── Auto estimate → Should pass
│
├── Prohibited Content (6)
│   ├── Negotiation request → Should fail (403)
│   ├── Coverage question → Should fail (403)
│   ├── Legal advice → Should fail (403)
│   ├── Pricing opinion → Should fail (403)
│   ├── Demand letter → Should fail (403)
│   └── Entitlement language → Should fail (403)
│
└── Invalid Documents (2)
    ├── Unknown type → Should fail (400)
    └── Ambiguous type → Should fail (400)
```

---

## 📊 PERFORMANCE CHARACTERISTICS

### Function Execution Times (Estimated)

| Function | Avg Time | Max Time |
|----------|----------|----------|
| estimate-classifier | 50ms | 200ms |
| estimate-risk-guardrails | 30ms | 100ms |
| estimate-lineitem-analyzer | 100ms | 500ms |
| estimate-output-formatter | 50ms | 200ms |
| analyze-estimate (total) | 500ms | 2s |
| generate-estimate-review (AI) | 3s | 10s |

### Resource Usage

- **Memory:** 128MB - 256MB per function
- **CPU:** Auto-scaled by Netlify
- **Bandwidth:** ~50KB per request (without AI)
- **Bandwidth:** ~5KB per request (with AI, due to tokens)

---

## 🔐 SECURITY ARCHITECTURE

### Environment Variables
- Stored in Netlify (encrypted)
- Never exposed to client
- Rotated regularly

### API Keys
- OpenAI API key (backend only)
- No client-side API keys
- Rate limiting recommended

### HTTPS
- Enforced by Netlify
- Auto SSL certificates
- TLS 1.2+

### CORS
- Configured per function
- Restrictive by default
- No wildcard origins in production

---

## 💰 COST ARCHITECTURE

### Netlify Free Tier
- 100GB bandwidth/month
- 125k function invocations/month
- 100 hours function runtime/month

### OpenAI Costs
- ~$0.03 per analysis (GPT-4)
- ~$0.01 per analysis (GPT-3.5-turbo)

### Scaling Costs
- 1,000 analyses/month = ~$30 (OpenAI only)
- 10,000 analyses/month = ~$300 + Netlify Pro ($19)

---

## 🚀 SCALABILITY

### Horizontal Scaling
- Netlify auto-scales functions
- No server management
- Pay per invocation

### Vertical Scaling
- Increase function memory if needed
- Optimize function code
- Cache responses (future enhancement)

### Bottlenecks
- OpenAI API rate limits (primary)
- Function cold starts (minimal)
- Network latency (minimal)

---

## 🔮 FUTURE ENHANCEMENTS

### Phase 5 (Planned)
- PDF upload support
- Multi-page estimates
- Comparison mode
- PDF export
- Usage analytics
- API authentication
- Rate limiting
- Batch processing

---

## 📚 REFERENCES

- [Netlify Functions Docs](https://docs.netlify.com/functions/overview/)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Next.js Docs](https://nextjs.org/docs)

---

**Architecture designed for safety, scalability, and simplicity.** 🏗️

