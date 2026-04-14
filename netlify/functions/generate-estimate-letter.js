/**
 * generate-estimate-letter.js — Phase 0 wizard contract (Section 2.3)
 * POST JSON → plain text letter (six fixed sections, eight placeholders).
 */

const OpenAI = require("openai");
const {
  corsHeaders,
  optionsResponse,
  verifyWizardAuth,
} = require("./_wizardAuth.js");

const STRATEGIES = [
  "FULL_SUPPLEMENT_DEMAND",
  "PARTIAL_DISPUTE",
  "DEMAND_REINSPECTION",
  "INVOKE_APPRAISAL",
  "OTHER_CUSTOM",
];

const LETTER_TYPES = [
  "SUPPLEMENT_DEMAND",
  "DISPUTE",
  "REINSPECTION_REQUEST",
  "APPRAISAL_INVOCATION",
  "CUSTOM_NARRATIVE",
];

const REQUIRED_TONE = "FORMAL_PROFESSIONAL";

const PLACEHOLDERS = [
  "[INSURED NAME]",
  "[POLICY NUMBER]",
  "[CLAIM NUMBER]",
  "[DATE OF LOSS]",
  "[ADJUSTER NAME]",
  "[CARRIER NAME]",
  "[DISPUTED AMOUNT]",
  "[RESPONSE DEADLINE]",
];

const SECTION_HEADINGS = [
  "BACKGROUND",
  "BASIS FOR SUPPLEMENT",
  "POLICY OBLIGATIONS",
  "REGULATORY DUTIES",
  "DEMAND",
  "RESERVATION OF RIGHTS",
];

function letterTypeInstructions(letterType) {
  switch (letterType) {
    case "SUPPLEMENT_DEMAND":
      return `Letter type SUPPLEMENT_DEMAND: write a formal demand for additional payment. Ground the request in the analysis JSON (scope omissions, pricing flags, code gaps, O&P, procedural notes) without inventing line items not implied by the analysis.`;
    case "DISPUTE":
      return `Letter type DISPUTE: contest specific line items and findings reflected in the analysis only. Do not invent additional disputed items beyond what the analysis supports.`;
    case "REINSPECTION_REQUEST":
      return `Letter type REINSPECTION_REQUEST: request a new inspection and document the factual basis using only themes present in the analysis (e.g. scope verification needs).`;
    case "APPRAISAL_INVOCATION":
      return `Letter type APPRAISAL_INVOCATION: formally invoke the appraisal process in a neutral, procedural way, tied only to valuation disagreement context found in the analysis. Do not cite specific policy appraisal clauses unless they are plainly supplied in the analysis text (they usually are not — keep language general).`;
    case "CUSTOM_NARRATIVE":
      return `Letter type CUSTOM_NARRATIVE: use a structured but flexible narrative that follows the same six sections, reflecting the user’s situation only as described by the analysis JSON (no invented facts).`;
    default:
      return `Letter type: ${letterType}.`;
  }
}

const LETTER_SYSTEM_PROMPT = `You write a formal insurance correspondence letter as plain text only.

OUTPUT RULES (strict):
- Output plain text only. No HTML, no markdown, no code fences, no bullet markdown syntax (you may use simple line breaks and plain dashes if needed).
- Tone is always formal and professional (FORMAL_PROFESSIONAL): clear, respectful, precise; no slang.
- The letter MUST contain exactly six sections in this order. Each section begins with its heading alone on the first line of that section, then a blank line, then the body:
  1. BACKGROUND
  2. BASIS FOR SUPPLEMENT
  3. POLICY OBLIGATIONS
  4. REGULATORY DUTIES
  5. DEMAND
  6. RESERVATION OF RIGHTS
- The DEMAND section body MUST include the literal phrase: 10-day deadline
- Include ALL of these placeholders somewhere in the letter (exact spelling, square brackets, ALL CAPS, spaces not underscores): [INSURED NAME], [POLICY NUMBER], [CLAIM NUMBER], [DATE OF LOSS], [ADJUSTER NAME], [CARRIER NAME], [DISPUTED AMOUNT], [RESPONSE DEADLINE]
- Do not include any attorney-review disclaimer or any text suggesting legal advice.
- Do not fabricate statute numbers, case citations, or specific policy contract language not supported by the supplied analysis summary. Use general duty-of-good-faith and reasonable-investigation framing without naming fake statutes or cases.
- The user message specifies letterType; follow the letter-type framing instructions there. Also reflect the selected strategy code from the payload (supplement vs partial dispute vs re-inspection vs appraisal vs custom) using only facts and themes present in the analysis JSON.
- Never output a line or sentence that begins with the word "Strategy:" or reads like an internal label (for example, do not paste phrases such as "Strategy: full supplement demand"). Instead, weave the intent of the selected strategy into normal sentences in BACKGROUND and BASIS FOR SUPPLEMENT only, in plain language, without naming the raw code string.`;

/** Short prose reflecting the strategy — no "Strategy:" labels (used in fallback and guides model). */
function strategyVoiceForProse(strategy) {
  switch (strategy) {
    case "FULL_SUPPLEMENT_DEMAND":
      return "Overall, we are pursuing correction of scope and valuation consistent with a full supplement demand grounded in the documented findings.";
    case "PARTIAL_DISPUTE":
      return "The focus is on selected line items and omissions while acknowledging portions that may already align, consistent with a narrower dispute posture.";
    case "DEMAND_REINSPECTION":
      return "The file supports requesting a new inspection to resolve documented scope questions before dollars are finalized.";
    case "INVOKE_APPRAISAL":
      return "Valuation remains materially apart; the narrative should move toward appraisal in a neutral, procedural way tied only to the analysis context.";
    case "OTHER_CUSTOM":
      return "The request is structured to the situation reflected in the analysis without over-stating coverage or remedies.";
    default:
      return "The request follows the posture implied by the selected approach while staying within the analysis record.";
  }
}

function basisBodyForLetterType(letterType, strategy) {
  const voice = strategyVoiceForProse(strategy);
  switch (letterType) {
    case "SUPPLEMENT_DEMAND":
      return `This section supports a formal demand for additional payment. The estimate review identifies scope and valuation items that require correction. ${voice} The referenced findings are summarized from the structured analysis supplied and are presented for documentation and adjustment purposes. Policy reference: [POLICY NUMBER]. Claim reference: [CLAIM NUMBER].`;
    case "DISPUTE":
      return `This section contests specific line items and findings reflected in the structured analysis only. ${voice} The items in controversy are documented from that analysis output (not legal advice). Policy reference: [POLICY NUMBER]. Claim reference: [CLAIM NUMBER].`;
    case "REINSPECTION_REQUEST":
      return `This section documents the basis for requesting a new inspection, drawn only from the analysis themes (for example, scope verification needs). ${voice} Policy reference: [POLICY NUMBER]. Claim reference: [CLAIM NUMBER].`;
    case "APPRAISAL_INVOCATION":
      return `This section frames valuation disagreement in a procedural way appropriate to appraisal invocation, using only the analysis context. ${voice} Policy reference: [POLICY NUMBER]. Claim reference: [CLAIM NUMBER].`;
    case "CUSTOM_NARRATIVE":
      return `This section presents a structured narrative of the situation using only the analysis JSON as the fact base. ${voice} Policy reference: [POLICY NUMBER]. Claim reference: [CLAIM NUMBER].`;
    default:
      return `The estimate review identifies items for correction. ${voice} Policy reference: [POLICY NUMBER]. Claim reference: [CLAIM NUMBER].`;
  }
}

function buildFallbackLetter(strategy, letterType) {
  const strat = STRATEGIES.includes(strategy) ? strategy : "OTHER_CUSTOM";
  const lt = LETTER_TYPES.includes(letterType) ? letterType : "SUPPLEMENT_DEMAND";
  const basis = basisBodyForLetterType(lt, strat);
  const bgVoice = strategyVoiceForProse(strat);
  return [
    "BACKGROUND",
    "",
    `This correspondence relates to claim [CLAIM NUMBER] under policy [POLICY NUMBER] for [INSURED NAME], date of loss [DATE OF LOSS]. We have communicated with [ADJUSTER NAME] at [CARRIER NAME]. The amount in controversy is [DISPUTED AMOUNT]. ${bgVoice}`,
    "",
    "BASIS FOR SUPPLEMENT",
    "",
    basis,
    "",
    "POLICY OBLIGATIONS",
    "",
    "The carrier is requested to evaluate the claim file consistent with the policy’s loss-settlement and cooperation obligations, using good faith and fair dealing, without citing specific policy language not already in the file. Insured: [INSURED NAME]. Carrier: [CARRIER NAME].",
    "",
    "REGULATORY DUTIES",
    "",
    "The carrier should document its position and complete a reasonable review of the materials submitted, consistent with generally applicable unfair-claims-practice principles (no specific statute numbers stated here). Adjuster of record: [ADJUSTER NAME]. Response calendar: [RESPONSE DEADLINE].",
    "",
    "DEMAND",
    "",
    "Within the 10-day deadline referenced here, please provide a written response addressing the items noted above, and confirm the schedule for resolution. This 10-day deadline is offered as a reasonable response window; calendar date [RESPONSE DEADLINE] remains relevant for scheduling. Disputed amount context: [DISPUTED AMOUNT].",
    "",
    "RESERVATION OF RIGHTS",
    "",
    "Nothing herein waives any rights or remedies available to [INSURED NAME]. All rights are expressly reserved. [CARRIER NAME] — claim [CLAIM NUMBER], policy [POLICY NUMBER], DOL [DATE OF LOSS].",
    "",
  ].join("\n");
}

function validateLetter(text) {
  if (!text || typeof text !== "string") return false;
  const t = text.trim();
  if (!t.toLowerCase().includes("10-day deadline")) return false;
  let last = -1;
  for (const h of SECTION_HEADINGS) {
    const idx = t.indexOf(h);
    if (idx === -1) return false;
    if (idx <= last) return false;
    last = idx;
  }
  for (const p of PLACEHOLDERS) {
    if (!t.includes(p)) return false;
  }
  if (/attorney\s+review/i.test(t)) return false;
  return true;
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

  const strategy = String(body.strategy || "").trim();
  if (!STRATEGIES.includes(strategy)) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        error:
          "strategy must be one of FULL_SUPPLEMENT_DEMAND, PARTIAL_DISPUTE, DEMAND_REINSPECTION, INVOKE_APPRAISAL, OTHER_CUSTOM",
        code: "INVALID_STRATEGY",
      }),
    };
  }

  const letterType = String(body.letterType || "").trim();
  if (!LETTER_TYPES.includes(letterType)) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        error:
          "letterType must be one of SUPPLEMENT_DEMAND, DISPUTE, REINSPECTION_REQUEST, APPRAISAL_INVOCATION, CUSTOM_NARRATIVE",
        code: "INVALID_LETTER_TYPE",
      }),
    };
  }

  const tone = String(body.tone || "").trim();
  if (tone !== REQUIRED_TONE) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'tone must be "FORMAL_PROFESSIONAL"',
        code: "INVALID_TONE",
      }),
    };
  }

  const claimType = String(body.claimType ?? "");
  const analysis =
    body.analysis !== undefined && body.analysis !== null && typeof body.analysis === "object"
      ? body.analysis
      : {};

  if (!process.env.OPENAI_API_KEY) {
    return {
      statusCode: 503,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "OpenAI API key not configured",
        code: "NO_OPENAI",
      }),
    };
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const userPayload = JSON.stringify(
    { analysis, strategy, claimType, letterType, tone },
    null,
    2
  );

  const typeBlock = letterTypeInstructions(letterType);
  const systemContent = `${LETTER_SYSTEM_PROMPT}\n\nLETTER_TYPE_RULES:\n${typeBlock}`;

  let letterText = "";
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 3500,
      messages: [
        { role: "system", content: systemContent },
        {
          role: "user",
          content: `Produce the letter now.\n\n${userPayload}`,
        },
      ],
    });
    letterText = String(
      completion.choices[0]?.message?.content || ""
    ).trim();
  } catch (e) {
    console.error("generate-estimate-letter OpenAI:", e);
    letterText = buildFallbackLetter(strategy, letterType);
  }

  if (!validateLetter(letterText)) {
    letterText = buildFallbackLetter(strategy, letterType);
  }

  const textHeaders = {
    ...corsHeaders,
    "Content-Type": "text/plain; charset=utf-8",
  };

  return {
    statusCode: 200,
    headers: textHeaders,
    body: letterText,
  };
};
