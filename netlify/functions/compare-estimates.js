/**
 * compare-estimates.js — Phase 0 wizard contract (Section 2.2)
 * POST JSON → line comparison or reconstructed scope vs carrier.
 */

const OpenAI = require("openai");
const {
  corsHeaders,
  optionsResponse,
  verifyWizardAuth,
} = require("./_wizardAuth.js");

function resolveMode(contractorText) {
  if (contractorText == null) return "RECON_VS_CARRIER";
  const t = String(contractorText).trim();
  return t.length > 0 ? "LINE_COMPARE" : "RECON_VS_CARRIER";
}

function emptyResult(mode) {
  return {
    mode,
    lineItems: [],
    totalCarrier: 0,
    totalContractor: 0,
    totalDelta: 0,
  };
}

function buildSystemPrompt(mode) {
  const modeRules =
    mode === "LINE_COMPARE"
      ? `MODE: LINE_COMPARE
You have CARRIER ESTIMATE TEXT and CONTRACTOR (or independent) ESTIMATE TEXT.
Build a table of aligned or best-effort paired line items. Every carrierAmount and contractorAmount MUST be taken only from explicit figures, quantities, or line totals stated in the respective pasted texts. If a dollar amount is not stated in the text for a row, use 0 for that side and explain in reason.
For each row: delta MUST equal contractorAmount minus carrierAmount (contractorAmount - carrierAmount). Positive delta means contractor side is higher.

FLAGGING — set flagged to true ONLY when at least one of these applies; otherwise flagged MUST be false:
(1) carrierAmount is 0 and contractorAmount > 0 for a line the contractor estimate genuinely includes but the carrier estimate omits (missing carrier coverage for that item).
(2) carrierAmount > 0 AND the absolute delta is strictly greater than 25% of the carrier amount: |delta| > 0.25 * carrierAmount.
(3) The contractor-side item has no reasonable counterpart in the carrier text (orphan line / no semantic match on the carrier side).

Do NOT set flagged true for routine small variances, rounding differences, or wording-only differences. If both carrierAmount and contractorAmount are greater than 0 and |delta| <= 0.25 * carrierAmount, flagged MUST be false.`
      : `MODE: RECON_VS_CARRIER
There is NO contractor text. For each line item (or logical scope row) in the carrier estimate, take carrierItem and carrierAmount directly from the carrier text.
For contractorItem and contractorAmount: reconstruct what that line's scope of work would reasonably cost at fair market value, based on the trade, quantities, units, and work described in carrierText — NOT by copying or defaulting to the carrier's stated dollar amount. Do not simply repeat the carrier amount as the reconstructed amount.
If the carrier amount appears suppressed, incomplete, or below what the described scope would reasonably cost, contractorAmount should reflect what the work would reasonably cost; delta = contractorAmount - carrierAmount should be positive in those cases. Where the carrier line already appears reasonable for the described scope, delta may be zero or small.
Do not derive dollar amounts from claimType alone. Do not invent Xactimate codes or legal citations.

FLAGGING — set flagged to true ONLY when at least one of these applies; otherwise flagged MUST be false:
(1) carrierAmount is 0 but the carrier text clearly describes priced scope for that row and your reconstructed contractorAmount > 0 (carrier dollars missing for described work).
(2) carrierAmount > 0 AND |delta| > 0.25 * carrierAmount.
(3) The row cannot be defensibly tied to stated carrier scope (reconstruction not supported by the carrier text).

Do NOT default every row to flagged. Minor or moderate FMV deltas within 25% of the carrier line are not, by themselves, grounds to flag.
delta MUST equal contractorAmount minus carrierAmount. Positive delta means reconstructed (fair market) scope cost is higher than the carrier line.`;

  return `You return ONE JSON object only (no markdown) with this exact shape:

{
  "lineItems": [
    {
      "trade": "string",
      "carrierItem": "string",
      "carrierAmount": number,
      "contractorItem": "string",
      "contractorAmount": number,
      "delta": number,
      "flagged": boolean,
      "reason": "string"
    }
  ]
}

${modeRules}

Rules:
- Do not invent Xactimate line codes, statute numbers, case citations, or policy coverage provisions.
- claimType is context for labeling trades only; never use it as a numeric source for dollars.
- All numbers must be finite. Use 0 when no amount is supported by the text.
- lineItems may be an empty array only if the carrier text has no parseable line-level content; prefer at least one summary row if a total exists in the carrier text.`;
}

function buildUserMessage(mode, carrierText, contractorText, claimType) {
  const contractorBlock =
    mode === "LINE_COMPARE"
      ? `CONTRACTOR / INDEPENDENT ESTIMATE TEXT:\n${String(contractorText)}`
      : "CONTRACTOR TEXT: (none — reconstructed vs carrier mode)";

  return `CLAIM TYPE (labels only, not a source of dollars): ${String(claimType || "unknown")}

CARRIER ESTIMATE TEXT:
${String(carrierText)}

${contractorBlock}`;
}

function normalizeLineItem(row) {
  const trade = String(row?.trade ?? "");
  const carrierItem = String(row?.carrierItem ?? "");
  const contractorItem = String(row?.contractorItem ?? "");
  const reason = String(row?.reason ?? "");
  let carrierAmount = Number(row?.carrierAmount);
  let contractorAmount = Number(row?.contractorAmount);
  if (!Number.isFinite(carrierAmount)) carrierAmount = 0;
  if (!Number.isFinite(contractorAmount)) contractorAmount = 0;
  carrierAmount = Math.round(carrierAmount * 100) / 100;
  contractorAmount = Math.round(contractorAmount * 100) / 100;
  const delta = Math.round((contractorAmount - carrierAmount) * 100) / 100;
  const flagged = Boolean(row?.flagged);
  return {
    trade,
    carrierItem,
    carrierAmount,
    contractorItem,
    contractorAmount,
    delta,
    flagged,
    reason,
  };
}

function finalizeResult(mode, parsed) {
  const rawItems = Array.isArray(parsed?.lineItems) ? parsed.lineItems : [];
  const lineItems = rawItems.map(normalizeLineItem);
  let totalCarrier = 0;
  let totalContractor = 0;
  let totalDelta = 0;
  for (const r of lineItems) {
    totalCarrier += r.carrierAmount;
    totalContractor += r.contractorAmount;
    totalDelta += r.delta;
  }
  totalCarrier = Math.round(totalCarrier * 100) / 100;
  totalContractor = Math.round(totalContractor * 100) / 100;
  totalDelta = Math.round(totalDelta * 100) / 100;
  return {
    mode,
    lineItems,
    totalCarrier,
    totalContractor,
    totalDelta,
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

  const carrierText = String(body.carrierText || "").trim();
  if (!carrierText) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "carrierText is required",
        code: "MISSING_CARRIER",
      }),
    };
  }

  const contractorText =
    body.contractorText === undefined || body.contractorText === null
      ? null
      : body.contractorText;
  const claimType = String(body.claimType || "");

  const mode = resolveMode(contractorText);

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
  const systemPrompt = buildSystemPrompt(mode);
  const userMessage = buildUserMessage(
    mode,
    carrierText,
    mode === "LINE_COMPARE" ? contractorText : null,
    claimType
  );

  let parsed;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 4000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });
    const raw = completion.choices[0]?.message?.content || "{}";
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error("compare-estimates OpenAI:", e);
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(emptyResult(mode)),
    };
  }

  try {
    const out = finalizeResult(mode, parsed);
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(out),
    };
  } catch (e) {
    console.error("compare-estimates finalize:", e);
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(emptyResult(mode)),
    };
  }
};
