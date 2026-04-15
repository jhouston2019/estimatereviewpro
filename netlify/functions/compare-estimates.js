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

function buildUserMessage(
  mode,
  carrierText,
  contractorText,
  claimType,
  category
) {
  const contractorBlock =
    mode === "LINE_COMPARE"
      ? `CONTRACTOR / INDEPENDENT ESTIMATE TEXT:\n${String(contractorText)}`
      : "CONTRACTOR TEXT: (none — reconstructed vs carrier mode)";

  const cat = String(category || "").trim().toUpperCase();
  const allowed = new Set([
    "BUILDING",
    "CONTENTS",
    "ALE",
    "MITIGATION",
    "OTHER",
  ]);
  const scopeLine =
    cat && allowed.has(cat)
      ? `SCOPE CATEGORY (labels only): ${cat}\n\n`
      : cat
        ? `SCOPE CATEGORY (labels only): OTHER\n\n`
        : "";

  return `${scopeLine}CLAIM TYPE (labels only, not a source of dollars): ${String(claimType || "unknown")}

CARRIER ESTIMATE TEXT:
${String(carrierText)}

${contractorBlock}`;
}

const VERSION_DIFF_SYSTEM = `You compare two versions of a carrier estimate: PREVIOUS versus CURRENT.
Return ONE JSON object only (no markdown) with this exact shape:
{
  "added": [ { "description": "string", "amount": number } ],
  "removed": [ { "description": "string", "amount": number } ],
  "changed": [ { "description": "string", "previousAmount": number, "currentAmount": number, "delta": number } ],
  "netChange": number
}
Rules:
- Base amounts only on explicit figures in the pasted texts; use 0 if not stated.
- For "changed" rows, delta MUST equal currentAmount minus previousAmount.
- netChange = reasonable net monetary movement from PREVIOUS to CURRENT as evidenced in the texts (not invented).
- Arrays may be empty. Descriptions must be short and tied to the text.`;

function normalizeVersionDiffFromModel(body, raw) {
  const req = body.versionDiff || {};
  const prevV = String(req.previousVersion || "");
  const currV = String(req.currentVersion || "");
  const mapAdded = (arr) => {
    if (!Array.isArray(arr)) return [];
    return arr.map((row) => {
      const r = row && typeof row === "object" ? row : {};
      return {
        description: String(r.description ?? ""),
        amount: Math.round((Number(r.amount) || 0) * 100) / 100,
      };
    });
  };
  const mapChanged = (arr) => {
    if (!Array.isArray(arr)) return [];
    return arr.map((row) => {
      const r = row && typeof row === "object" ? row : {};
      const pa = Math.round((Number(r.previousAmount) || 0) * 100) / 100;
      const ca = Math.round((Number(r.currentAmount) || 0) * 100) / 100;
      const delta =
        Number.isFinite(Number(r.delta))
          ? Math.round(Number(r.delta) * 100) / 100
          : Math.round((ca - pa) * 100) / 100;
      return {
        description: String(r.description ?? ""),
        previousAmount: pa,
        currentAmount: ca,
        delta,
      };
    });
  };
  const added = mapAdded(raw?.added);
  const removed = mapAdded(raw?.removed);
  const changed = mapChanged(raw?.changed);
  let netChange = Math.round((Number(raw?.netChange) || 0) * 100) / 100;
  if (!Number.isFinite(netChange)) netChange = 0;
  return {
    previousVersion: prevV,
    currentVersion: currV,
    added,
    removed,
    changed,
    netChange,
  };
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
  const category = body.category;

  const vdRaw = body.versionDiff;
  const hasVersionDiff =
    vdRaw &&
    typeof vdRaw === "object" &&
    String(vdRaw.previousText || "").trim().length > 0 &&
    String(vdRaw.currentText || "").trim().length > 0;

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
    claimType,
    category
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
    if (hasVersionDiff) {
      const vdUser = `PREVIOUS CARRIER VERSION (${String(vdRaw.previousVersion || "PREVIOUS")}):\n${String(vdRaw.previousText)}\n\nCURRENT CARRIER VERSION (${String(vdRaw.currentVersion || "CURRENT")}):\n${String(vdRaw.currentText)}`;
      try {
        const vdCompletion = await openai.chat.completions.create({
          model: "gpt-4o",
          temperature: 0.2,
          max_tokens: 3000,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: VERSION_DIFF_SYSTEM },
            { role: "user", content: vdUser },
          ],
        });
        const vdRawJson =
          vdCompletion.choices[0]?.message?.content || "{}";
        const vdParsed = JSON.parse(vdRawJson);
        out.versionDiff = normalizeVersionDiffFromModel(body, vdParsed);
      } catch (vdErr) {
        console.error("compare-estimates versionDiff OpenAI:", vdErr);
      }
    }
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
