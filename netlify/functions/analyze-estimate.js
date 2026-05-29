/**
 * analyze-estimate.js — Phase 0 wizard contract
 * POST JSON → structured analysis (no legal citations, no fabricated codes).
 */

const OpenAI = require("openai");
const {
  corsHeaders,
  optionsResponse,
  verifyWizardAuth,
} = require("./_wizardAuth.js");
const { getStateContextForPrompt } = require("./_stateContext.js");

const CANONICAL_STRATEGIES = [
  "FULL_SUPPLEMENT_DEMAND",
  "PARTIAL_DISPUTE",
  "DEMAND_REINSPECTION",
  "INVOKE_APPRAISAL",
  "OTHER_CUSTOM",
];

const ANALYSIS_SYSTEM_PROMPT = `You are a senior licensed public adjuster and property insurance
claims specialist with 20+ years of experience handling residential and commercial property losses.
You have deep expertise in Xactimate estimating software, RSMeans cost data, carrier underpayment
patterns, depreciation methodology, O&P eligibility, building code compliance requirements, and
insurance bad faith indicators across all 50 states.

Your job is to analyze a carrier's property insurance estimate and identify every area where the
insured may be underpaid, underscoped, or procedurally harmed. Be specific, aggressive in identifying
deficiencies, and grounded only in what the estimate text shows. Do not invent facts, codes, or
citations not evidenced in the text.

Return ONE JSON object only (no markdown) with this exact shape and key names:

{
  "trueLossRange": { "low": number, "high": number },
  "riskLevel": "low" | "moderate" | "high",
  "carrierStrategy": string,
  "scopeOmissions": string[],
  "pricingFlags": string[],
  "depreciationFindings": string[],
  "codeUpgradeGaps": string[],
  "opFindings": string[],
  "proceduralDefects": string[],
  "badFaithIndicators": string[],
  "disputeAngles": string[],
  "actionItems": string[],
  "requiredDocuments": string[],
  "escalationOptions": string[],
  "availableStrategies": string[],
  "recommendedStrategy": string,
  "executiveSummary": string
}

FIELD INSTRUCTIONS:

"trueLossRange": Your expert assessment of the plausible total loss value range. Low = conservative
well-supported floor. High = what a fully supplemented, code-compliant, properly depreciated RCV
estimate would likely reach. Do NOT cap at 1.21x carrier. If the carrier estimate is severely
deficient, high may be 1.5x–2.5x the carrier amount. Be honest about the range.

"riskLevel": Rate the insured's risk of being materially underpaid. high = carrier estimate appears
significantly deficient or contains bad faith indicators. moderate = meaningful gaps identified.
low = estimate appears reasonably complete with minor issues only.

"carrierStrategy": In 1–2 sentences, characterize what the carrier appears to be doing in this
estimate (e.g., suppressing O&P, applying excessive depreciation, ignoring code upgrades, low-balling
unit prices, narrowing scope to cosmetic only, omitting trade-specific line items). Base this on
what you observe in the estimate text.

"scopeOmissions": List every scope item that appears missing or underscoped based on the described
damage and trade work. Be specific — name the trade, the item, and why it should be included.
Examples: "Roofing — no ice and water shield on eave or valley despite cold-climate state",
"Drywall — no texture match line item despite textured ceiling noted", "HVAC — no disconnect/
reconnect for equipment moved during repairs", "Exterior — no drip edge replacement on full
re-roof". Empty array only if estimate appears genuinely complete.

"pricingFlags": Identify every line item where the unit price, quantity, or removal/replacement
ratio appears suppressed or inconsistent with fair market value. Name the specific line item and
the nature of the pricing concern. Examples: "Roofing tear-off — carrier priced at $X/sq, market
rate is materially higher for this roof pitch/complexity", "Drywall hang and tape — single coat
price applied where skim coat finish is required".

"depreciationFindings": THIS IS CRITICAL. Identify every depreciation issue:
- Non-depreciable items that had depreciation applied (labor, HVAC systems less than useful life,
  code-required upgrades, electrical, plumbing)
- Excessive depreciation percentages relative to actual age/condition
- Recoverable depreciation that should be released on completion but was not discussed
- ACV-only election where RCV coverage likely applies
- Blanket depreciation applied to entire trades without line-level breakdown
Examples: "Labor depreciated on roofing line items — labor is non-depreciable in most jurisdictions",
"HVAC unit depreciated at 40% on a 6-year-old system with 15-year expected life",
"No recoverable depreciation schedule provided — insured cannot track release triggers".

"codeUpgradeGaps": Identify every applicable building code upgrade that should be included but
is absent. Consider: ICC/IBC requirements, IECC energy codes, local amendments, egress window
requirements, electrical panel upgrades on fire losses, arc-fault requirements, smoke/CO detector
requirements, deck ledger requirements, stair/railing code, permit and inspection fees, engineering
if required. State context is in metadata — apply state-specific awareness where possible.

"opFindings": Analyze O&P eligibility thoroughly:
- Is O&P included? At what percentage?
- If absent or suppressed: identify whether 3+ trades are involved (triggering GC O&P entitlement),
  whether the work requires a general contractor to coordinate, whether the carrier's own estimate
  implies GC-coordinated work
- If O&P is present but at a suppressed rate: flag it
- Identify any carrier O&P suppression argument that may be anticipated and should be countered
Examples: "O&P absent — estimate includes 6 trades (roofing, drywall, painting, HVAC, electrical,
carpentry) clearly requiring GC coordination", "O&P applied at 10/10 — industry standard for
this complexity is 20/10".

"proceduralDefects": Identify procedural failures in how the carrier handled or documented the
estimate: no unit price breakdown, no depreciation schedule, no scope narrative, no photo
documentation referenced, adjuster scope vs. field conditions, missing line item detail that
prevents meaningful review.

"badFaithIndicators": Identify any patterns in this estimate that suggest bad faith claims
handling: unreasonable scope narrowing, suppressed unit pricing across multiple trades,
excessive depreciation without justification, failure to include code upgrades in a state where
carrier has clear obligation, refusal to acknowledge contractor estimate without explanation,
pattern of denying line items without documentation. Empty array if none evident.

"disputeAngles": List the strongest angles for disputing or supplementing this estimate, ranked
by dollar impact. Be specific about what evidence would support each angle.

"actionItems": Concrete next steps for the insured/PA/contractor, in priority order.

"requiredDocuments": Specific documents needed to support the supplement/dispute.

"escalationOptions": Available escalation paths given what this estimate shows.

"availableStrategies": Non-empty subset of:
  FULL_SUPPLEMENT_DEMAND, PARTIAL_DISPUTE, DEMAND_REINSPECTION, INVOKE_APPRAISAL, OTHER_CUSTOM

"recommendedStrategy": One member of availableStrategies.

"executiveSummary": 3–5 sentence plain-language summary of the overall situation: what the carrier
estimate shows, what the key deficiencies are, and what the recommended path forward is. Written
for a homeowner or business owner to understand. No jargon.

RULES:
- Base findings ONLY on the provided estimate text and metadata.
- Do not invent Xactimate codes, statute numbers, case citations, or policy language not in the text.
- Arrays may be empty but must be arrays of strings.
- riskLevel must be exactly low, moderate, or high.
- availableStrategies must be a non-empty subset of the five canonical strings above.
- recommendedStrategy must equal one member of availableStrategies.
- All numbers must be finite.`;

function extractCarrierAmountFromDocument(documentText) {
  if (!documentText || typeof documentText !== "string") return 0;
  const moneyRe = /\$\s*([\d,]+(?:\.\d{1,2})?)/g;
  const keywords =
    /total|rcv|replacement\s*cost|grand\s*total|amount\s*due|estimate\s*total|subtotal|net\s*claim/i;

  let bestFromKeywordLine = 0;
  for (const line of documentText.split(/\r?\n/)) {
    if (!keywords.test(line)) continue;
    let m;
    const re = new RegExp(moneyRe.source, "gi");
    while ((m = re.exec(line)) !== null) {
      const n = parseFloat(String(m[1]).replace(/,/g, ""));
      if (Number.isFinite(n) && n > bestFromKeywordLine) bestFromKeywordLine = n;
    }
  }

  let bestGlobal = 0;
  let m;
  const globalRe = new RegExp(moneyRe.source, "g");
  while ((m = globalRe.exec(documentText)) !== null) {
    const n = parseFloat(String(m[1]).replace(/,/g, ""));
    if (Number.isFinite(n) && n < 1e9 && n > bestGlobal) bestGlobal = n;
  }

  const v = bestFromKeywordLine > 0 ? bestFromKeywordLine : bestGlobal;
  return Math.round(v * 100) / 100;
}

function clampStrategies(arr) {
  const raw = Array.isArray(arr) ? arr : [];
  const filtered = raw.filter((s) => CANONICAL_STRATEGIES.includes(s));
  const uniq = [...new Set(filtered)];
  if (uniq.length === 0) return [...CANONICAL_STRATEGIES];
  return uniq;
}

function normalizeRisk(r) {
  const x = String(r || "").toLowerCase();
  if (x === "low" || x === "moderate" || x === "high") return x;
  if (x === "medium") return "moderate";
  return "moderate";
}

function ensureStringArray(a) {
  if (!Array.isArray(a)) return [];
  return a.map((x) => String(x)).filter(Boolean);
}

function defaultTrueLossRange(carrierAmount) {
  if (!(carrierAmount > 0)) return { low: 0, high: 0 };
  const low = Math.round(carrierAmount * 0.9 * 100) / 100;
  const high = Math.round(carrierAmount * 1.15 * 100) / 100;
  return { low, high };
}

function mergeTrueLossRange(parsed, carrierAmount) {
  const low = Number(parsed?.trueLossRange?.low);
  const high = Number(parsed?.trueLossRange?.high);
  if (
    Number.isFinite(low) &&
    Number.isFinite(high) &&
    low >= 0 &&
    high >= low &&
    high > 0
  ) {
    return { low, high };
  }
  return defaultTrueLossRange(carrierAmount);
}

function pickRecommended(available, raw) {
  const s = String(raw || "").trim();
  if (available.includes(s)) return s;
  return available[0];
}

function buildUserPayload(body, carrierAmount) {
  const contractor =
    body.contractorText == null ? null : String(body.contractorText);
  return `CARRIER ESTIMATE TEXT (primary source for findings):
${String(body.documentText || "")}

OPTIONAL CONTRACTOR / INDEPENDENT ESTIMATE TEXT (may be null):
${contractor == null ? "null" : contractor}

EXTRACTED_CARRIER_AMOUNT_FROM_DOCUMENT (numeric, authoritative for carrier total line — use only as context, do not contradict with a different "carrier" field in JSON): ${carrierAmount}

METADATA (context only — do not invent dollar totals from claim type alone):
insuredName: ${body.insuredName || ""}
claimType: ${body.claimType || ""}
state: ${body.state || ""}
policyNumber: ${body.policyNumber || ""}
claimNumber: ${body.claimNumber || ""}
dateOfLoss: ${body.dateOfLoss || ""}
adjusterName: ${body.adjusterName || ""}
disputedAmount (user-normalized string): ${body.disputedAmount || ""}
responseDeadline: ${body.responseDeadline || ""}
STATE_REGULATORY_CONTEXT: ${getStateContextForPrompt(body.state || "")}`;
}

function buildAnalysisSystemPrompt(categoryRaw) {
  const c = String(categoryRaw || "").trim().toUpperCase();
  if (!c) return ANALYSIS_SYSTEM_PROMPT;
  const allowed = new Set([
    "BUILDING",
    "CONTENTS",
    "ALE",
    "MITIGATION",
    "OTHER",
  ]);
  const scope = allowed.has(c) ? c : "OTHER";
  return `This estimate covers ${scope} scope.\n\n${ANALYSIS_SYSTEM_PROMPT}`;
}

function emptyResult(carrierAmount, note) {
  const available = [...CANONICAL_STRATEGIES];
  return {
    carrierAmount,
    trueLossRange: defaultTrueLossRange(carrierAmount),
    riskLevel: "moderate",
    scopeOmissions: note ? [note] : [],
    pricingFlags: [],
    codeUpgradeGaps: [],
    opFindings: [],
    proceduralDefects: [],
    disputeAngles: [],
    actionItems: [
      "Verify all line items and totals against field scope and photos.",
    ],
    requiredDocuments: ["Complete carrier estimate", "Policy declarations"],
    escalationOptions: [
      "Written supplement request to carrier",
      "Appraisal (if policy permits)",
      "Department of insurance inquiry (as applicable)",
    ],
    availableStrategies: available,
    recommendedStrategy: "FULL_SUPPLEMENT_DEMAND",
    depreciationFindings: [],
    badFaithIndicators: [],
    executiveSummary: note || "",
    carrierStrategy: "",
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return optionsResponse();
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Method not allowed", code: "METHOD" }),
    };
  }

  const auth = await verifyWizardAuth(event);
  if (!auth.ok) return auth.response;

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Invalid JSON body",
        code: "JSON_PARSE",
      }),
    };
  }

  // OCR branch — handles scanned PDF pages sent as base64 images
  if (body.mode === "extract_only") {
    const { images, fileName } = body;
    if (!images || !Array.isArray(images) || images.length === 0) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "No images provided", code: "NO_IMAGES" }),
      };
    }
    const maxB64 = 4_500_000;
    for (let i = 0; i < images.length; i++) {
      const len = String(images[i] || "").length;
      if (len > maxB64) {
        return {
          statusCode: 413,
          headers: corsHeaders,
          body: JSON.stringify({
            error: `Page ${i + 1} image is too large for OCR (${Math.round(len / 1024)}KB). Paste text or use a smaller PDF.`,
            code: "IMAGE_TOO_LARGE",
          }),
        };
      }
    }
    console.log(
      "OCR ENV CHECK:",
      !!process.env.OPENAI_API_KEY,
      Object.keys(process.env).filter((k) => k.includes("OPENAI"))
    );
    if (!process.env.OPENAI_API_KEY) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          error: "OpenAI API key not configured",
          code: "NO_OPENAI",
        }),
      };
    }
    const content = [
      {
        type: "text",
        text: "Extract all text from this insurance estimate document. Return the complete text including all line items, quantities, unit prices, totals, header information (insured name, policy number, claim number, date of loss, adjuster name, carrier name), and any other visible text. Preserve structure as much as possible. Return plain text only.",
      },
      ...images.map((base64) => ({
        type: "image_url",
        image_url: { url: `data:image/jpeg;base64,${base64}`, detail: "auto" },
      })),
    ];
    try {
      console.log("OCR INPUT:", {
        imageCount: images.length,
        firstImageSize: images[0]?.length,
      });
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 4000,
        messages: [{ role: "user", content }],
      });
      const extractedText = response.choices[0]?.message?.content ?? "";
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          text: extractedText,
          pages: images.length,
          fileName: fileName ?? null,
        }),
      };
    } catch (err) {
      console.error("OCR ERROR:", err);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          error: err.message || String(err),
          stack: err.stack || null,
          code: "OCR_FAILED",
        }),
      };
    }
  }

  const documentText = String(body.documentText || "").trim();
  if (!documentText) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "documentText is required",
        code: "MISSING_DOCUMENT",
      }),
    };
  }

  const carrierAmount = extractCarrierAmountFromDocument(documentText);

  if (!process.env.OPENAI_API_KEY) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "OpenAI API key not configured",
        code: "NO_OPENAI",
      }),
    };
  }

  const userMessage = buildUserPayload(body, carrierAmount);
  const systemPrompt = buildAnalysisSystemPrompt(body.category);

  let parsed;
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 5000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });
    const raw = completion.choices[0]?.message?.content || "{}";
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error("analyze-estimate OpenAI:", e);
    const out = emptyResult(
      carrierAmount,
      "Automated analysis failed — review estimate manually."
    );
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(out),
    };
  }

  const availableStrategies = clampStrategies(parsed.availableStrategies);
  const recommendedStrategy = pickRecommended(
    availableStrategies,
    parsed.recommendedStrategy
  );

  const out = {
    carrierAmount,
    trueLossRange: mergeTrueLossRange(parsed, carrierAmount),
    riskLevel: normalizeRisk(parsed.riskLevel),
    scopeOmissions: ensureStringArray(parsed.scopeOmissions),
    pricingFlags: ensureStringArray(parsed.pricingFlags),
    codeUpgradeGaps: ensureStringArray(parsed.codeUpgradeGaps),
    opFindings: ensureStringArray(parsed.opFindings),
    proceduralDefects: ensureStringArray(parsed.proceduralDefects),
    disputeAngles: ensureStringArray(parsed.disputeAngles),
    actionItems: ensureStringArray(parsed.actionItems),
    requiredDocuments: ensureStringArray(parsed.requiredDocuments),
    escalationOptions: ensureStringArray(parsed.escalationOptions),
    availableStrategies,
    recommendedStrategy,
    depreciationFindings: ensureStringArray(parsed.depreciationFindings),
    badFaithIndicators: ensureStringArray(parsed.badFaithIndicators),
    executiveSummary: typeof parsed.executiveSummary === "string" ? parsed.executiveSummary.trim() : "",
    carrierStrategy: typeof parsed.carrierStrategy === "string" ? parsed.carrierStrategy.trim() : "",
  };

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify(out),
  };
};
