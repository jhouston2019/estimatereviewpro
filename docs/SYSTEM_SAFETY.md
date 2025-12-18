# ESTIMATE REVIEW PRO - SYSTEM SAFETY DOCUMENTATION

## CRITICAL CONSTRAINTS

This system is designed with strict safety guardrails to prevent misuse and ensure it operates ONLY as a neutral estimate analysis tool.

## WHAT THIS SYSTEM DOES

✅ **ALLOWED:**
- Classify insurance estimates (Property/Auto/Commercial)
- Identify line item categories present in estimates
- Identify categories NOT present (factual observation only)
- Detect zero-quantity line items
- Detect potentially incomplete scope indicators
- Generate neutral, factual findings reports

## WHAT THIS SYSTEM DOES NOT DO

❌ **PROHIBITED:**
- Negotiate with insurance companies
- Interpret insurance policy coverage or exclusions
- Provide legal advice or claim strategy
- Give pricing opinions or cost assessments
- Recommend actions or advocate on behalf of users
- Write demand letters or dispute documents
- Argue coverage or bad faith
- Use entitlement or legal language

## SAFETY LAYERS

### Layer 1: Input Guardrails (estimate-risk-guardrails.js)

Blocks requests containing:
- Payment/entitlement language ("should be paid", "entitled to", "owed")
- Legal/bad faith language ("bad faith", "sue", "attorney")
- Negotiation language ("demand", "force them", "make them pay")
- Coverage interpretation requests ("am I covered", "policy requires")
- Unfair/bias language ("unfair", "lowball", "scam")

### Layer 2: Classification Validation (estimate-classifier.js)

Rejects:
- Unknown document types
- Ambiguous estimates (multiple types detected)
- Documents with insufficient recognizable content

### Layer 3: Output Filtering (estimate-output-formatter.js)

Ensures output:
- Uses neutral, factual language only
- Includes clear limitations section
- Avoids recommendations or advice
- States observations as facts, not opinions

### Layer 4: AI Safety (generate-estimate-review.js)

When using AI generation:
- Temperature: 0.2 (low variability, deterministic)
- System prompt enforces constraints
- Output scanned for prohibited language
- Refusal behavior for out-of-scope requests

## REFUSAL BEHAVIORS

The system will refuse and return an error for:

1. **Negotiation Requests**
   - "Help me negotiate with the adjuster"
   - "What should I say to get more money?"
   - "Write a demand letter"

2. **Coverage Interpretation**
   - "Am I covered for this?"
   - "Does my policy include this?"
   - "What does my policy say about..."

3. **Legal Advice**
   - "Can I sue them?"
   - "Is this bad faith?"
   - "What are my legal rights?"

4. **Pricing Opinions**
   - "Is this price fair?"
   - "Are they lowballing me?"
   - "What should this cost?"

5. **Non-Estimate Documents**
   - Policy documents
   - Claim letters
   - Legal documents
   - Invoices or bills

## OUTPUT FORMAT

All reports follow this structure:

1. **Summary** - Factual overview of findings
2. **Included Items** - Categories detected in estimate
3. **Potential Omissions** - Categories NOT detected (observation only)
4. **Potential Under-Scoping** - Line items with scope limitations
5. **Limitations** - Clear statement of what the review does NOT cover

## LANGUAGE RULES

### ✅ APPROVED LANGUAGE:
- "The estimate includes..."
- "The following categories were not detected..."
- "This line item shows zero quantity"
- "This is a factual observation only"
- "This review does not provide opinions on..."

### ❌ PROHIBITED LANGUAGE:
- "You should..."
- "They must..."
- "You are entitled to..."
- "This is unfair..."
- "Demand that they..."
- "You deserve..."

## POSITIONING

This system is positioned as:
- **$149 one-time fee** (vs. ChatGPT subscription)
- **Safer than ChatGPT** (built-in guardrails)
- **Procedural, not conversational** (no free-form chat)
- **Neutral findings only** (no advocacy)

## MONITORING

System logs should track:
- Guardrail violations (what was blocked)
- Classification failures (ambiguous/unknown types)
- Output safety check failures
- Usage patterns

## LEGAL DISCLAIMER

Every page and report must include:

> This tool provides factual estimate analysis only. It does not provide legal advice, coverage interpretation, pricing opinions, or claim strategy. Missing items may not be applicable or covered under your policy. For coverage questions, consult your policy or agent. For legal questions, consult an attorney.

## TEMPERATURE SETTING

All AI operations use **Temperature = 0.2** for:
- Consistency across requests
- Deterministic outputs
- Reduced hallucination risk
- Factual, boring responses

## TESTING SAFETY

Test cases should include:
1. Valid estimate → Success
2. "Help me negotiate" → Blocked
3. "Am I covered?" → Blocked
4. "Is this price fair?" → Blocked
5. Non-estimate document → Rejected
6. Ambiguous estimate → Rejected

## MAINTENANCE

Regular review required for:
- New prohibited phrases
- Edge cases in classification
- Output language drift
- User feedback on safety


