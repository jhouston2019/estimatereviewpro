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
const {
  buildFallbackComparison,
  textLooksLikeEstimate,
  resolveCompareMode,
} = require("./_comparisonFallback.js");

const OPENAI_COMPARE_TIMEOUT_MS = 22000;

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
  const sharedRules = `You are a senior licensed public adjuster and property insurance claims
specialist with deep expertise in Xactimate line items, RSMeans cost data, trade-level pricing,
depreciation methodology, and carrier estimate review. Your job is to produce a precise,
line-by-line comparison that exposes every dollar gap between what the carrier paid and what
the work actually costs.

You return ONE JSON object only (no markdown) with this exact shape:

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
      "reason": "string",
      "depreciationNote": "string"
    }
  ]
}

GLOBAL RULES:
- delta MUST equal contractorAmount minus carrierAmount exactly. Positive = insured is owed more.
- All numbers must be finite. Use 0 when no amount is supported by the source text.
- Do not invent Xactimate line codes, statute numbers, case citations, or policy provisions.
- claimType and category are context for labeling trades only — never a numeric source for dollars.
- "reason" must be specific: name the trade, the discrepancy type, and why it matters.
  Bad: "Amounts differ." Good: "Carrier priced 1/2-inch drywall at $X/SF; contractor priced
  5/8-inch fire-rated drywall required by code at $Y/SF — $Z delta per SF across 400 SF."
- "depreciationNote": if carrier applied depreciation to this line and contractor did not (or
  applied it differently), note it here. If depreciation is not relevant to this line, use "".
- "trade" must be a specific trade name: Roofing, Drywall, Painting, HVAC, Electrical,
  Plumbing, Carpentry, Flooring, Masonry, Mitigation, Contents, ALE, Other.
  Do not use vague labels like "General" or "Misc" unless no trade can be determined.`;

  const modeRules =
    mode === "LINE_COMPARE"
      ? `
MODE: LINE_COMPARE
You have CARRIER ESTIMATE TEXT and CONTRACTOR (or independent) ESTIMATE TEXT.
Build a table of aligned or best-effort paired line items.

ALIGNMENT RULES:
- Match lines by trade and scope description first, then by room/area if available.
- Every carrierAmount and contractorAmount MUST come only from explicit figures in the
  respective pasted texts. If no dollar amount is stated for a row on one side, use 0.
- Where the contractor lists a line the carrier completely omitted, carrierAmount = 0,
  contractorAmount = stated contractor amount, flagged = true.
- Where the carrier lists a line the contractor did not address, contractorAmount = 0,
  flagged = false unless delta exceeds 25% threshold (it won't if contractor = 0 and
  carrier > 0 — that's carrier coverage, not a gap against the insured).

FLAGGING — set flagged = true ONLY when:
(1) carrierAmount = 0 AND contractorAmount > 0 (carrier omitted a line contractor included).
(2) carrierAmount > 0 AND |delta| > 0.25 * carrierAmount.
(3) Contractor line has no reasonable semantic counterpart in carrier text (orphan line).
Otherwise flagged MUST be false. Do not flag routine rounding or wording differences.

MINIMUM ROWS: When both texts contain estimate tables or dollar figures, return at minimum
one row per major trade present in either estimate, plus one row per room/area section if
the estimate is organized by room. Never return fewer than 8 rows if dollar figures exist.`
      : `
MODE: RECON_VS_CARRIER
There is no contractor estimate. For each line in the carrier estimate, you will:
1. Take carrierItem and carrierAmount directly from the carrier text.
2. Reconstruct what that scope of work would cost at fair market value based on the trade,
   quantities, units, and work described — NOT by defaulting to the carrier's amount.
3. Use your expertise in Xactimate pricing, regional cost data, and trade-level labor and
   material rates to set contractorAmount. If the carrier price appears reasonable for the
   described scope, delta may be zero or small. If it appears suppressed, set contractorAmount
   to what the work would actually cost and explain in "reason".

RECONSTRUCTION DISCIPLINE:
- Never simply copy carrierAmount as contractorAmount.
- Consider: are the quantities correct? Is the unit price at or below market? Is the line
  item description complete or does it omit components (e.g., "install drywall" with no
  texture match, no prime coat, no corner bead)?
- Flag depreciation separately in depreciationNote — do not embed it in the dollar amounts.

FLAGGING — set flagged = true ONLY when:
(1) carrierAmount = 0 but carrier text clearly describes work for that row AND your
    reconstructed contractorAmount > 0.
(2) carrierAmount > 0 AND |delta| > 0.25 * carrierAmount.
(3) Row cannot be defensibly tied to stated carrier scope.
Otherwise flagged MUST be false.

MINIMUM ROWS: Return one row per logical line item or scope section in the carrier estimate.
Never return fewer than 8 rows if dollar figures exist in the carrier text.`;

  return sharedRules + modeRules;
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
    depreciationNote: String(row?.depreciationNote ?? ""),
  };
}

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`OpenAI call timed out after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}

function truncateForModel(text, maxChars) {
  const t = String(text || "");
  if (t.length <= maxChars) return t;
  const head = Math.floor(maxChars * 0.55);
  const tail = maxChars - head - 80;
  if (tail < 1000) {
    return t.slice(0, maxChars) + "\n\n[... truncated for processing ...]";
  }
  return (
    t.slice(0, head) +
    "\n\n[... middle of document omitted for processing — totals and line items may appear below ...]\n\n" +
    t.slice(-tail)
  );
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
  const isPreview = auth.user?.isPreview === true;
  const model = isPreview ? "gpt-4o-mini" : "gpt-4o";
  const maxTokens = 5000;
  const textLimit = isPreview ? 120000 : 180000;

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

  const rawCarrier = String(body.carrierText || "").trim();
  const rawContractor =
    body.contractorText === undefined || body.contractorText === null
      ? null
      : String(body.contractorText).trim();

  const carrierText = truncateForModel(rawCarrier, textLimit);
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
    rawContractor === null ? null : truncateForModel(rawContractor, textLimit);
  const claimType = String(body.claimType || "");
  const category = body.category;

  const mode = resolveCompareMode(rawContractor);

  /** Fast path: deterministic table from pasted dollars (avoids 504 timeouts). */
  const instant = buildFallbackComparison(
    mode,
    rawCarrier,
    mode === "LINE_COMPARE" ? rawContractor : null
  );
  if (instant?.lineItems?.length > 0) {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(instant),
    };
  }

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
    mode === "LINE_COMPARE"
      ? truncateForModel(contractorText, textLimit)
      : null,
    claimType,
    category
  );

  async function callCompareModel(system, user) {
    const completion = await withTimeout(
      openai.chat.completions.create({
        model,
        temperature: 0.15,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      OPENAI_COMPARE_TIMEOUT_MS
    );
    const raw = completion.choices[0]?.message?.content || "{}";
    return JSON.parse(raw);
  }

  let parsed;
  try {
    parsed = await callCompareModel(systemPrompt, userMessage);
  } catch (e) {
    console.error("compare-estimates OpenAI:", e);
    const fallback = buildFallbackComparison(
      mode,
      rawCarrier,
      mode === "LINE_COMPARE" ? rawContractor : null
    );
    if (fallback?.lineItems?.length) {
      console.warn("compare-estimates: OpenAI failed, using fallback");
      parsed = fallback;
    } else {
      return {
        statusCode: 502,
        headers: corsHeaders,
        body: JSON.stringify({
          error: "Comparison generation failed",
          code: "COMPARE_OPENAI_FAILED",
          mode,
        }),
      };
    }
  }

  try {
    let out = finalizeResult(mode, parsed);
    const estimateLike =
      textLooksLikeEstimate(carrierText) &&
      (mode !== "LINE_COMPARE" || textLooksLikeEstimate(contractorText));

    if (out.lineItems.length === 0 && estimateLike) {
      const fallback = buildFallbackComparison(
        mode,
        rawCarrier,
        mode === "LINE_COMPARE" ? rawContractor : null
      );
      if (fallback?.lineItems?.length) {
        console.warn("compare-estimates: using deterministic fallback");
        out = fallback;
      }
    }

    if (out.lineItems.length === 0 && estimateLike) {
      console.warn("compare-estimates: no line items after AI and fallback");
      return {
        statusCode: 502,
        headers: corsHeaders,
        body: JSON.stringify({
          error:
            "Comparison returned no line items. Paste full line-item text for both estimates on Step 1.",
          code: "COMPARE_EMPTY",
          mode,
        }),
      };
    }
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(out),
    };
  } catch (e) {
    console.error("compare-estimates finalize:", e);
    return {
      statusCode: 502,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Comparison response invalid",
        code: "COMPARE_FINALIZE_FAILED",
        mode,
      }),
    };
  }
};
