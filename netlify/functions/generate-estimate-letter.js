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
const { getStateContextForPrompt } = require("./_stateContext.js");

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
  "APPEAL",
  "REINSPECTION_REQUEST",
  "APPRAISAL_INVOCATION",
  "CUSTOM_NARRATIVE",
  "CUSTOM",
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

const INLINE_HEADINGS_REQUIRED = [
  "Policy Obligations.",
  "Regulatory Duties.",
  "Demand.",
  "Reservation of Rights.",
];

const INLINE_HEADINGS_FIRST_SECTION = [
  "Basis for Supplement.",
  "Basis for Dispute.",
  "Basis for Appeal.",
  "Basis for Request.",
  "Basis for",
];

function letterTypeInstructions(letterType) {
  switch (letterType) {
    case "SUPPLEMENT_DEMAND":
      return `Letter type SUPPLEMENT_DEMAND: write a formal demand for additional payment. Ground the request in the analysis JSON (scope omissions, pricing flags, code gaps, O&P, procedural notes) without inventing line items not implied by the analysis.`;
    case "DISPUTE":
      return `Letter type DISPUTE: contest specific line items and findings reflected in the analysis only. Do not invent additional disputed items beyond what the analysis supports.`;
    case "APPEAL":
      return `Letter type APPEAL: write a formal appeal of the carrier's position, using only facts and themes present in the analysis. Use appeal-appropriate framing (administrative appeal, request for reconsideration of the position). Do not label the letter "Dispute Letter" and do not use the word "DISPUTE" as a standalone title or section label.`;
    case "REINSPECTION_REQUEST":
      return `Letter type REINSPECTION_REQUEST: request a new inspection and document the factual basis using only themes present in the analysis (e.g. scope verification needs).`;
    case "APPRAISAL_INVOCATION":
      return `Letter type APPRAISAL_INVOCATION: formally invoke the appraisal process in a neutral, procedural way, tied only to valuation disagreement context found in the analysis. Do not cite specific policy appraisal clauses unless they are plainly supplied in the analysis text (they usually are not — keep language general).`;
    case "CUSTOM_NARRATIVE":
      return `Letter type CUSTOM_NARRATIVE: use a structured but flexible narrative that follows the same six sections, reflecting the user’s situation only as described by the analysis JSON (no invented facts).`;
    case "CUSTOM":
      return `Letter type CUSTOM: follow the user’s "CUSTOM LETTER INSTRUCTIONS" in the user message as the main thematic and substantive direction. You must still use the same six-section letter structure, all placeholders, and ground facts only in the analysis JSON. If custom instructions conflict with a structural rule, follow structure and placeholders first. Do not invent facts not supported by the analysis.`;
    default:
      return `Letter type: ${letterType}.`;
  }
}

const LETTER_SYSTEM_PROMPT = `You are a senior public adjuster and insurance claims advocate
writing a formal demand letter on behalf of a property insurance claimant. Your letters are
known for being precise, evidence-grounded, persuasive, and professionally intimidating to
carriers — without fabricating facts, statutes, or policy provisions not in the record.

OUTPUT RULES (strict):
- Output plain text only. No HTML, no markdown, no code fences.
- The letter must follow this exact structure and order:

[TODAY'S DATE]

[INSURED NAME]

[ADJUSTER NAME]
[CARRIER NAME]

Re: Claim No. [CLAIM NUMBER] | Policy No. [POLICY NUMBER] | Date of Loss: [DATE OF LOSS] | Insured: [INSURED NAME]

Dear [ADJUSTER NAME]:

[BACKGROUND paragraph — no heading, just prose. State the claim context, the nature of the loss,
and the insured's position. Reference the carrier's estimate amount and the disputed amount.
Set an assertive but professional tone from the first sentence.]

[BASIS FOR SUPPLEMENT paragraph — start inline: "Basis for Supplement.  " then prose.
This is the substantive core of the letter. Draw directly from the analysis JSON:
- If scopeOmissions is non-empty: identify the most significant omissions by trade and explain
  why they are required.
- If pricingFlags is non-empty: cite the suppressed pricing categories and why fair market
  value is higher.
- If depreciationFindings is non-empty: identify the depreciation methodology defects —
  non-depreciable items held, excessive rates, recoverable depreciation not scheduled.
- If opFindings is non-empty: state the O&P entitlement basis (number of trades, GC
  coordination requirement) and the dollar impact.
- If codeUpgradeGaps is non-empty: identify code-required items that must be included
  regardless of the carrier's scope preference.
- If badFaithIndicators is non-empty: note the pattern of deficiencies in a way that
  signals awareness of bad faith exposure without using the phrase "bad faith" directly —
  use language like "pattern of suppression", "unreasonable scope narrowing", or
  "failure to document basis for exclusions."
Do not invent facts not in the analysis. Do not cite specific Xactimate codes or statute
numbers unless they appear in the analysis JSON.]

[POLICY OBLIGATIONS paragraph — start inline: "Policy Obligations.  " then prose.
Reference the carrier's general obligations under the policy — to pay the full replacement
cost value of covered losses, to document the basis for any depreciation applied, to include
code-required upgrades, and to provide a complete scope. Use [POLICY NUMBER] and [CLAIM NUMBER].
Do not cite specific policy sections or endorsements unless they appear in the analysis JSON.]

[REGULATORY DUTIES paragraph — start inline: "Regulatory Duties.  " then prose.
Reference the carrier's general regulatory obligations: prompt claims handling, good faith
adjustment, and documentation requirements. If the state field in the analysis metadata is
present and is a state known for specific bad faith or prompt payment exposure (TX, FL, CA,
GA, CO, OK, LA, MS, AL), include a state-specific sentence noting that the state's regulatory
framework is being monitored and that the insured's rights under applicable unfair claims
practices standards are reserved — without citing specific statute numbers unless they appear
in the analysis. If state is unknown or not a high-exposure state, use general language only.
Reference [ADJUSTER NAME] and [RESPONSE DEADLINE].]

[DEMAND paragraph — start inline: "Demand.  " then prose.
State the specific demand clearly: payment of [DISPUTED AMOUNT] within the 10-day deadline
referenced here, or a written response identifying each disputed item with specific factual
and policy basis for the carrier's position. This 10-day deadline is offered as a reasonable
response window; calendar date [RESPONSE DEADLINE] remains relevant for scheduling.
State that failure to respond will result in escalation through all available channels.]

[RESERVATION OF RIGHTS paragraph — start inline: "Reservation of Rights.  " then prose.
Expressly reserve all rights and remedies available to [INSURED NAME] under the policy,
applicable law, and regulatory standards. Reference the claim number [CLAIM NUMBER], policy
[POLICY NUMBER], and carrier [CARRIER NAME]. State that nothing in this letter waives or
limits any right, remedy, or cause of action available to the insured.]

Very truly yours,

[INSURED NAME]

ADDITIONAL RULES:
- Do NOT use ALL-CAPS standalone section headings on their own line.
- Include ALL placeholders: [INSURED NAME], [POLICY NUMBER], [CLAIM NUMBER], [DATE OF LOSS],
  [ADJUSTER NAME], [CARRIER NAME], [DISPUTED AMOUNT], [RESPONSE DEADLINE]
- Tone: assertive, formal, professional. The letter should feel like it came from someone
  who knows exactly what they are doing and is not going away.
- No attorney-review disclaimers.
- No fabricated statute numbers, case citations, or specific policy language not in the analysis.
- The letter should be substantive — 600 to 900 words of body content. Thin letters do not
  move carriers. Use the analysis findings to fill every section with specific, grounded content.
- Never output a line beginning with "Strategy:" or any internal label. Weave the strategy
  intent into natural sentences only.`;

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
    case "APPEAL":
      return `This section sets out the basis for a formal appeal of the carrier's position, documented from the structured analysis only. ${voice} Policy reference: [POLICY NUMBER]. Claim reference: [CLAIM NUMBER].`;
    case "REINSPECTION_REQUEST":
      return `This section documents the basis for requesting a new inspection, drawn only from the analysis themes (for example, scope verification needs). ${voice} Policy reference: [POLICY NUMBER]. Claim reference: [CLAIM NUMBER].`;
    case "APPRAISAL_INVOCATION":
      return `This section frames valuation disagreement in a procedural way appropriate to appraisal invocation, using only the analysis context. ${voice} Policy reference: [POLICY NUMBER]. Claim reference: [CLAIM NUMBER].`;
    case "CUSTOM_NARRATIVE":
      return `This section presents a structured narrative of the situation using only the analysis JSON as the fact base. ${voice} Policy reference: [POLICY NUMBER]. Claim reference: [CLAIM NUMBER].`;
    case "CUSTOM":
      return `This section implements the custom letter direction supplied by the user, while staying within facts supported by the analysis JSON. ${voice} Policy reference: [POLICY NUMBER]. Claim reference: [CLAIM NUMBER].`;
    default:
      return `The estimate review identifies items for correction. ${voice} Policy reference: [POLICY NUMBER]. Claim reference: [CLAIM NUMBER].`;
  }
}

function demandLineForLetterType(letterType) {
  const rd = "[RESPONSE DEADLINE]";
  const amt = "[DISPUTED AMOUNT]";
  const base = `Within the 10-day deadline referenced here, please provide a written response addressing the items noted above, and confirm the schedule for resolution. This 10-day deadline is offered as a reasonable response window; calendar date ${rd} remains relevant for scheduling.`;
  if (letterType === "APPEAL") {
    return `Demand.  ${base} Amount in controversy (appeal context): ${amt}.`;
  }
  return `Demand.  ${base} Disputed amount context: ${amt}.`;
}

function buildFallbackLetter(strategy, letterType) {
  const strat = STRATEGIES.includes(strategy) ? strategy : "OTHER_CUSTOM";
  const lt = LETTER_TYPES.includes(letterType) ? letterType : "SUPPLEMENT_DEMAND";
  const basis = basisBodyForLetterType(lt, strat);
  const bgVoice = strategyVoiceForProse(strat);
  const todayStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return [
    todayStr,
    "",
    "[INSURED NAME]",
    "",
    "[ADJUSTER NAME]",
    "[CARRIER NAME]",
    "",
    "Re: Claim No. [CLAIM NUMBER] | Policy No. [POLICY NUMBER] | Date of Loss: [DATE OF LOSS] | Insured: [INSURED NAME]",
    "",
    "Dear [ADJUSTER NAME]:",
    "",
    `This correspondence relates to claim [CLAIM NUMBER] under policy [POLICY NUMBER] for [INSURED NAME], date of loss [DATE OF LOSS]. We have communicated with [ADJUSTER NAME] at [CARRIER NAME]. The amount in controversy is [DISPUTED AMOUNT]. ${bgVoice}`,
    "",
    `Basis for Supplement.  ${basis}`,
    "",
    "Policy Obligations.  The carrier is requested to evaluate the claim file consistent with the policy’s loss-settlement and cooperation obligations, using good faith and fair dealing, without citing specific policy language not already in the file. Insured: [INSURED NAME]. Carrier: [CARRIER NAME].",
    "",
    "Regulatory Duties.  The carrier should document its position and complete a reasonable review of the materials submitted, consistent with generally applicable unfair-claims-practice principles (no specific statute numbers stated here). Adjuster of record: [ADJUSTER NAME]. Response calendar: [RESPONSE DEADLINE].",
    "",
    demandLineForLetterType(lt),
    "",
    "Reservation of Rights.  Nothing herein waives any rights or remedies available to [INSURED NAME]. All rights are expressly reserved. [CARRIER NAME] - claim [CLAIM NUMBER], policy [POLICY NUMBER], DOL [DATE OF LOSS].",
    "",
    "Very truly yours,",
    "",
    "[INSURED NAME]",
    "",
  ].join("\n");
}

function validateLetter(text) {
  if (!text || typeof text !== "string") {
    console.warn("LETTER_VALIDATE_FAIL: not a string");
    return false;
  }
  const t = text.trim();

  // Check 10-day deadline phrasing
  if (
    !/10[\s-]day\s+deadline/i.test(t) &&
    !/10[\s-]day\s+response/i.test(t) &&
    !/ten[\s-]day/i.test(t)
  ) {
    console.warn(
      "LETTER_VALIDATE_FAIL: missing 10-day deadline. First 300 chars:",
      t.slice(0, 300)
    );
    return false;
  }

  // Check always-required headings in order
  let last = -1;
  for (const h of INLINE_HEADINGS_REQUIRED) {
    const idx = t.indexOf(h);
    if (idx === -1) {
      console.warn(`LETTER_VALIDATE_FAIL: missing heading "${h}"`);
      return false;
    }
    if (idx <= last) {
      console.warn(
        `LETTER_VALIDATE_FAIL: heading out of order "${h}" at ${idx}, last was ${last}`
      );
      return false;
    }
    last = idx;
  }

  // Check first-section heading exists before Policy Obligations
  const policyIdx = t.indexOf("Policy Obligations.");
  const hasFirstSection = INLINE_HEADINGS_FIRST_SECTION.some(
    (h) => t.indexOf(h) !== -1 && t.indexOf(h) < policyIdx
  );
  if (!hasFirstSection) {
    console.warn(
      "LETTER_VALIDATE_FAIL: no first-section heading before Policy Obligations"
    );
    return false;
  }

  // Check structural anchors
  const hasReHeader = /Re:\s+Claim No\./i.test(t);
  const hasDear = /Dear\s+\S+/i.test(t);
  if (!hasReHeader || !hasDear) {
    console.warn("LETTER_VALIDATE_FAIL: missing Re: header or Dear salutation");
    return false;
  }

  if (!t.includes("[RESPONSE DEADLINE]") && !t.includes("[DISPUTED AMOUNT]")) {
    console.warn(
      "LETTER_VALIDATE_FAIL: missing both RESPONSE DEADLINE and DISPUTED AMOUNT placeholders"
    );
    return false;
  }

  if (/attorney\s+review/i.test(t)) {
    console.warn("LETTER_VALIDATE_FAIL: contains 'attorney review'");
    return false;
  }

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
          "letterType must be one of SUPPLEMENT_DEMAND, DISPUTE, APPEAL, REINSPECTION_REQUEST, APPRAISAL_INVOCATION, CUSTOM_NARRATIVE, CUSTOM",
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
  const customInstructions = String(body.customInstructions ?? "").trim();
  const additionalNotes = String(body.additionalNotes ?? "").trim();
  const analysis =
    body.analysis !== undefined && body.analysis !== null && typeof body.analysis === "object"
      ? body.analysis
      : {};
  const state = String(body.state ?? analysis?.state ?? "").trim().toUpperCase();
  const stateContextBlock = getStateContextForPrompt(state);

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
    {
      analysis,
      strategy,
      claimType,
      letterType,
      tone,
      state,
      ...(customInstructions ? { customInstructions } : {}),
      ...(additionalNotes ? { additionalNotes } : {}),
    },
    null,
    2
  );

  const typeBlock = letterTypeInstructions(letterType);
  const systemContent = `${LETTER_SYSTEM_PROMPT}\n\nLETTER_TYPE_RULES:\n${typeBlock}`;

  let contextBlocks = "";
  if (additionalNotes) {
    contextBlocks += `\n\n---\nADDITIONAL NOTES OR CONTEXT (user-provided; incorporate where appropriate without inventing facts beyond the analysis and comparison in the JSON):\n${additionalNotes}\n---`;
  }
  if (letterType === "CUSTOM" && customInstructions) {
    contextBlocks += `\n\n---\nCUSTOM LETTER INSTRUCTIONS (primary direction for this letter; follow while preserving the required structure and all placeholders):\n${customInstructions}\n---`;
  } else if (letterType === "CUSTOM" && !customInstructions) {
    contextBlocks += `\n\n---\nCUSTOM LETTER: No custom instructions were provided; produce the letter from the analysis JSON only, still following the CUSTOM letter type rules and structure.\n---`;
  }
  if (stateContextBlock) {
    contextBlocks += `\n\n---\nSTATE REGULATORY CONTEXT (use this to inform the Regulatory Duties paragraph — do not quote statute numbers verbatim, but use the context to calibrate the tone and leverage referenced):\n${stateContextBlock}\n---`;
  }

  const userMessage = `Produce the letter now.\n\n${userPayload}${contextBlocks}`;

  let letterText = "";
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 4500,
      messages: [
        { role: "system", content: systemContent },
        {
          role: "user",
          content: userMessage,
        },
      ],
    });
    letterText = String(
      completion.choices[0]?.message?.content || ""
    ).trim();
  } catch (e) {
    console.error(
      "generate-estimate-letter OpenAI ERROR:",
      e?.message || String(e)
    );
    console.error("generate-estimate-letter OpenAI STACK:", e?.stack);
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
