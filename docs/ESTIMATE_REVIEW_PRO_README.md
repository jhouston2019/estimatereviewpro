# 📊 ESTIMATE REVIEW PRO

**Procedural Insurance Estimate Analysis System**

A safer, more controlled alternative to ChatGPT for insurance estimate review.

---

## 🎯 WHAT IT DOES

Estimate Review Pro is a **procedural analysis tool** that:

✅ Classifies insurance estimates (Property/Auto/Commercial)  
✅ Identifies line item categories present in estimates  
✅ Identifies categories NOT present (factual observation only)  
✅ Detects zero-quantity or incomplete line items  
✅ Generates neutral, factual findings reports  

---

## 🚫 WHAT IT DOES NOT DO

This system is **NOT**:

❌ A chatbot or conversational AI  
❌ A negotiation tool  
❌ A policy interpretation service  
❌ A legal advice provider  
❌ A pricing opinion tool  
❌ An advocacy or claim strategy advisor  

---

## 🔒 SAFETY FEATURES

### Built-in Guardrails

1. **Input Filtering** - Blocks prohibited language and requests
2. **Classification Validation** - Rejects unknown/ambiguous documents
3. **Output Filtering** - Ensures neutral, factual language only
4. **AI Safety** - Temperature 0.2, constrained prompts, output scanning

### Prohibited Content

The system will **refuse** requests containing:
- Payment/entitlement language ("should be paid", "entitled to")
- Legal/bad faith language ("sue", "attorney", "bad faith")
- Negotiation language ("demand", "force them to pay")
- Coverage interpretation ("am I covered?", "policy requires")
- Pricing opinions ("is this fair?", "are they lowballing?")

---

## 🏗️ ARCHITECTURE

### Netlify Functions

```
netlify/functions/
├── estimate-classifier.js          # Classifies estimate type
├── estimate-risk-guardrails.js     # Blocks prohibited content
├── estimate-lineitem-analyzer.js   # Analyzes line items
├── estimate-output-formatter.js    # Formats neutral reports
├── analyze-estimate.js             # Main orchestrator
└── generate-estimate-review.js     # AI-powered generation
```

### Frontend

```
public/
└── upload-estimate.html            # Hardened upload interface
```

### Flow

```
User Input
    ↓
Guardrails Check (Block prohibited content)
    ↓
Classification (Property/Auto/Commercial)
    ↓
Line Item Analysis (Detect omissions/under-scoping)
    ↓
Output Formatting (Neutral findings report)
    ↓
Results Display
```

---

## 🚀 QUICK START

### Prerequisites

- Node.js 20+
- Netlify CLI
- OpenAI API key (for AI-powered generation)

### Installation

```bash
# Install dependencies
cd estimatereviewpro
npm install

# Install Netlify CLI globally
npm install -g netlify-cli

# Set environment variables
# Create .env file:
OPENAI_API_KEY=sk-your-key-here
URL=http://localhost:8888
```

### Development

```bash
# Start Netlify Dev server
netlify dev

# Access the app
# Frontend: http://localhost:8888/upload-estimate.html
# Functions: http://localhost:8888/.netlify/functions/
```

### Testing

```bash
# Test classifier
curl -X POST http://localhost:8888/.netlify/functions/estimate-classifier \
  -H "Content-Type: application/json" \
  -d '{"text": "roof shingles underlayment", "lineItems": []}'

# Test guardrails (should block)
curl -X POST http://localhost:8888/.netlify/functions/estimate-risk-guardrails \
  -H "Content-Type: application/json" \
  -d '{"text": "help me negotiate"}'

# Test full analysis
curl -X POST http://localhost:8888/.netlify/functions/analyze-estimate \
  -H "Content-Type: application/json" \
  -d '{
    "estimateText": "Line 1: Remove shingles - 200 SF\nLine 2: Install shingles - 200 SF"
  }'
```

---

## 📖 USAGE

### Web Interface

1. Navigate to `/upload-estimate.html`
2. Select estimate type (Property/Auto/Commercial)
3. Select damage type
4. Paste estimate text
5. Acknowledge limitations
6. Click "Analyze Estimate"
7. Review findings report
8. Download report (optional)

### API Usage

See `docs/API_DOCUMENTATION.md` for complete API reference.

**Example:**

```javascript
const response = await fetch('/.netlify/functions/analyze-estimate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    estimateText: 'Your estimate text here...',
    metadata: {
      estimateType: 'PROPERTY',
      damageType: 'WATER'
    }
  })
});

const data = await response.json();
console.log(data.report);
```

---

## 📋 OUTPUT FORMAT

Reports include:

1. **Summary** - Overview of findings
2. **Included Categories** - What was detected
3. **Potential Omissions** - What was NOT detected
4. **Potential Under-Scoping** - Line items with issues
5. **Limitations** - Clear statement of scope

**Example Output:**

```
SUMMARY OF FINDINGS

This report identifies 15 line items in the submitted estimate.

Key Observations:
• 2 expected category(ies) not detected in estimate
• 1 line item(s) with zero quantity

This is a factual review only. It does not constitute advice...

═══════════════════════════════════════════════════════════

INCLUDED CATEGORIES

The following categories were detected in the estimate:

• ROOFING
• INTERIOR

═══════════════════════════════════════════════════════════

POTENTIAL OMISSIONS

The following categories were NOT detected in the estimate:

• DEMOLITION
  Note: This category was not detected in the estimate

• WATER_DAMAGE
  Note: This category was not detected in the estimate

Note: Absence from this estimate does not indicate these items 
are required, covered, or applicable to your specific claim...

═══════════════════════════════════════════════════════════

LIMITATIONS OF THIS REVIEW

This review is subject to the following limitations:

• This is a text-based analysis only. No physical inspection...
• This review does not interpret insurance policy coverage...
• This review does not provide opinions on pricing...
• Missing items may not be applicable or covered...

For coverage questions, consult your insurance policy or agent.
For legal questions, consult an attorney.
```

---

## 💰 POSITIONING

**$149 One-Time Fee**

vs. ChatGPT Plus ($20/month = $240/year)

### Why Estimate Review Pro?

| Feature | Estimate Review Pro | ChatGPT |
|---------|-------------------|---------|
| Built-in safety guardrails | ✅ | ❌ |
| Procedural, not conversational | ✅ | ❌ |
| Refuses out-of-scope requests | ✅ | ❌ |
| Neutral findings only | ✅ | ❌ |
| No hallucination risk | ✅ | ⚠️ |
| Temperature 0.2 (deterministic) | ✅ | ⚠️ |
| Purpose-built for estimates | ✅ | ❌ |

---

## 🔧 CONFIGURATION

### Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...        # For AI generation
URL=https://your-domain.com  # Your Netlify URL

# Optional
NODE_ENV=production
```

### Customization

**Add more keywords to classifier:**

Edit `netlify/functions/estimate-classifier.js`:

```javascript
const PROPERTY_KEYWORDS = [
  'roofing', 'roof', 'shingles',
  // Add your keywords here
];
```

**Add more prohibited phrases:**

Edit `netlify/functions/estimate-risk-guardrails.js`:

```javascript
const PROHIBITED_PHRASES = [
  'should be paid',
  // Add your phrases here
];
```

---

## 🧪 TESTING SAFETY

Test cases to verify guardrails:

```bash
# Should succeed
curl -X POST .../analyze-estimate \
  -d '{"estimateText": "Remove shingles 200 SF"}'

# Should fail (negotiation)
curl -X POST .../analyze-estimate \
  -d '{"estimateText": "Help me negotiate with adjuster"}'

# Should fail (coverage)
curl -X POST .../analyze-estimate \
  -d '{"userInput": "Am I covered for this?"}'

# Should fail (pricing)
curl -X POST .../analyze-estimate \
  -d '{"userInput": "Is this price fair?"}'

# Should fail (unknown type)
curl -X POST .../analyze-estimate \
  -d '{"estimateText": "Lorem ipsum dolor sit amet"}'
```

---

## 📚 DOCUMENTATION

- `docs/SYSTEM_SAFETY.md` - Safety constraints and guardrails
- `docs/API_DOCUMENTATION.md` - Complete API reference
- `docs/PRICING_SETUP.md` - Stripe integration guide
- `docs/STRIPE_PRODUCTS.md` - Product configuration

---

## 🚨 IMPORTANT DISCLAIMERS

### For Users

This tool provides factual estimate analysis only. It does not provide:
- Legal advice or claim strategy
- Coverage interpretation
- Pricing opinions
- Negotiation assistance

Missing items may not be applicable or covered under your policy.

For coverage questions, consult your policy or agent.  
For legal questions, consult an attorney.

### For Developers

This system must maintain strict guardrails. Do NOT:
- Remove safety checks
- Add free-form chat features
- Provide recommendations or advice
- Interpret coverage or pricing
- Use advocacy language

Temperature must remain at 0.2 or lower.

---

## 🤝 SUPPORT

For technical issues:
- Check `docs/API_DOCUMENTATION.md`
- Review error messages
- Verify input format

For safety concerns:
- Review `docs/SYSTEM_SAFETY.md`
- Report violations
- Suggest additional guardrails

---

## 📄 LICENSE

Proprietary - All Rights Reserved

---

## 🔄 VERSION

**v1.0.0** - Initial Release

Features:
- Estimate classification (Property/Auto/Commercial)
- Risk guardrails (prohibited content blocking)
- Line item analysis (omissions/under-scoping detection)
- Neutral findings reports
- Web interface with warnings
- API endpoints
- Temperature 0.2 (deterministic)

---

## 🎯 ROADMAP

Future enhancements:
- [ ] PDF upload support (currently text only)
- [ ] Multi-page estimate handling
- [ ] Comparison between multiple estimates
- [ ] Export to PDF format
- [ ] Usage analytics dashboard
- [ ] Additional estimate types (Marine, Aviation, etc.)
- [ ] Batch processing
- [ ] API authentication

---

**Built with safety first. Neutral findings only. No advocacy. No advice.**


