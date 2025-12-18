# ESTIMATE REVIEW PRO - API DOCUMENTATION

## OVERVIEW

Estimate Review Pro provides a set of Netlify serverless functions for analyzing insurance estimates.

## BASE URL

```
Production: https://your-domain.netlify.app/.netlify/functions/
Development: http://localhost:8888/.netlify/functions/
```

## ENDPOINTS

### 1. Estimate Classifier

**Endpoint:** `POST /estimate-classifier`

**Purpose:** Classifies estimate type (Property/Auto/Commercial)

**Request Body:**
```json
{
  "text": "Full estimate text...",
  "lineItems": ["Line 1", "Line 2", ...]
}
```

**Success Response (200):**
```json
{
  "classification": "PROPERTY",
  "confidence": "HIGH",
  "scores": {
    "property": 8,
    "auto": 1,
    "commercial": 0
  }
}
```

**Error Response (400):**
```json
{
  "error": "Unable to classify estimate type",
  "reason": "Insufficient recognizable line items",
  "classification": "UNKNOWN",
  "scores": {...}
}
```

---

### 2. Risk Guardrails

**Endpoint:** `POST /estimate-risk-guardrails`

**Purpose:** Validates input against prohibited content

**Request Body:**
```json
{
  "text": "Estimate text...",
  "userInput": "Optional user comments..."
}
```

**Success Response (200):**
```json
{
  "status": "APPROVED",
  "message": "Content passes safety guardrails"
}
```

**Error Response (403):**
```json
{
  "error": "Prohibited content detected",
  "reason": "This system provides neutral estimate analysis only",
  "violations": ["should be paid", "entitled to"],
  "message": "This tool does not provide negotiation assistance..."
}
```

---

### 3. Line Item Analyzer

**Endpoint:** `POST /estimate-lineitem-analyzer`

**Purpose:** Analyzes line items for omissions and under-scoping

**Request Body:**
```json
{
  "lineItems": ["Line 1", "Line 2", ...],
  "classification": "PROPERTY",
  "metadata": {}
}
```

**Success Response (200):**
```json
{
  "status": "COMPLETE",
  "classification": "PROPERTY",
  "analysis": {
    "totalLineItems": 25,
    "includedCategories": [
      {"category": "ROOFING", "status": "PRESENT"},
      {"category": "INTERIOR", "status": "PRESENT"}
    ],
    "missingCategories": [
      {
        "category": "DEMOLITION",
        "status": "NOT_FOUND",
        "note": "This category was not detected in the estimate"
      }
    ],
    "zeroQuantityItems": [
      {
        "lineNumber": 5,
        "description": "Remove debris - Qty: 0",
        "issue": "Zero quantity detected"
      }
    ],
    "potentialUnderScoping": [
      {
        "lineNumber": 12,
        "description": "Drywall materials only",
        "issue": "Material-only line item (no labor component mentioned)"
      }
    ],
    "observations": [
      "1 expected category(ies) not detected in estimate",
      "1 line item(s) with zero quantity"
    ]
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

### 4. Output Formatter

**Endpoint:** `POST /estimate-output-formatter`

**Purpose:** Formats analysis into neutral findings report

**Request Body:**
```json
{
  "analysis": {...},
  "classification": "PROPERTY",
  "metadata": {}
}
```

**Success Response (200):**
```json
{
  "status": "SUCCESS",
  "report": {
    "title": "Estimate Review Findings",
    "generated": "2024-01-01T12:00:00.000Z",
    "classification": "PROPERTY",
    "summary": "SUMMARY OF FINDINGS\n\n...",
    "includedItems": "INCLUDED CATEGORIES\n\n...",
    "potentialOmissions": "POTENTIAL OMISSIONS\n\n...",
    "potentialUnderScoping": "POTENTIAL UNDER-SCOPING\n\n...",
    "limitations": "LIMITATIONS OF THIS REVIEW\n\n...",
    "metadata": {
      "totalLineItems": 25,
      "categoriesFound": 2,
      "categoriesMissing": 1,
      "issuesDetected": 2
    }
  }
}
```

---

### 5. Analyze Estimate (Main Orchestrator)

**Endpoint:** `POST /analyze-estimate`

**Purpose:** Complete estimate analysis (runs all steps)

**Request Body:**
```json
{
  "estimateText": "Full estimate text...",
  "lineItems": ["Optional pre-parsed lines"],
  "userInput": "Optional user comments",
  "metadata": {
    "estimateType": "PROPERTY",
    "damageType": "WATER"
  }
}
```

**Success Response (200):**
```json
{
  "status": "SUCCESS",
  "classification": {
    "classification": "PROPERTY",
    "confidence": "HIGH",
    "scores": {...}
  },
  "analysis": {
    "status": "COMPLETE",
    "analysis": {...}
  },
  "report": {
    "title": "Estimate Review Findings",
    "summary": "...",
    "includedItems": "...",
    "potentialOmissions": "...",
    "potentialUnderScoping": "...",
    "limitations": "..."
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Error Responses:**
- 400: Invalid input
- 403: Prohibited content detected
- 500: Processing error

---

### 6. Generate Estimate Review (AI-Powered)

**Endpoint:** `POST /generate-estimate-review`

**Purpose:** Generate report using OpenAI (Temperature: 0.2)

**Request Body:**
```json
{
  "estimateText": "Full estimate text...",
  "lineItems": ["Line 1", "Line 2", ...],
  "classification": "PROPERTY",
  "userInput": "Optional context"
}
```

**Success Response (200):**
```json
{
  "status": "SUCCESS",
  "report": "ESTIMATE REVIEW FINDINGS\n\n...",
  "classification": "PROPERTY",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "model": "gpt-4",
  "usage": {
    "prompt_tokens": 500,
    "completion_tokens": 800,
    "total_tokens": 1300
  }
}
```

**Error Response (500):**
```json
{
  "error": "Output safety check failed",
  "message": "Generated report contained prohibited language. Please try again."
}
```

---

## ERROR CODES

| Code | Meaning |
|------|---------|
| 200  | Success |
| 400  | Bad Request (invalid input, classification failed) |
| 403  | Forbidden (prohibited content detected) |
| 405  | Method Not Allowed (use POST) |
| 500  | Internal Server Error |

---

## RATE LIMITING

Consider implementing rate limiting in production:
- Per IP: 10 requests per minute
- Per user: 100 requests per day

---

## AUTHENTICATION

Currently: None (public endpoints)

For production, consider:
- API keys
- JWT tokens
- Supabase auth integration

---

## ENVIRONMENT VARIABLES

Required:
```
OPENAI_API_KEY=sk-...
URL=https://your-domain.netlify.app
```

Optional:
```
NODE_ENV=production
```

---

## TESTING

### Test with cURL:

```bash
# Test classifier
curl -X POST http://localhost:8888/.netlify/functions/estimate-classifier \
  -H "Content-Type: application/json" \
  -d '{"text": "roof shingles underlayment flashing", "lineItems": []}'

# Test guardrails (should fail)
curl -X POST http://localhost:8888/.netlify/functions/estimate-risk-guardrails \
  -H "Content-Type: application/json" \
  -d '{"text": "help me negotiate with the adjuster"}'

# Test full analysis
curl -X POST http://localhost:8888/.netlify/functions/analyze-estimate \
  -H "Content-Type: application/json" \
  -d '{
    "estimateText": "Line 1: Remove damaged shingles - 200 SF\nLine 2: Install new shingles - 200 SF",
    "metadata": {"estimateType": "PROPERTY"}
  }'
```

---

## INTEGRATION EXAMPLE

```javascript
async function analyzeEstimate(estimateText) {
  try {
    const response = await fetch('/.netlify/functions/analyze-estimate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        estimateText: estimateText,
        metadata: {
          estimateType: 'PROPERTY',
          damageType: 'WATER'
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Analysis failed');
    }

    const data = await response.json();
    return data.report;

  } catch (error) {
    console.error('Analysis error:', error);
    throw error;
  }
}
```

---

## SUPPORT

For issues or questions:
- Check SYSTEM_SAFETY.md for constraints
- Review error messages carefully
- Ensure input meets requirements
- Contact: support@estimatereviewpro.com


