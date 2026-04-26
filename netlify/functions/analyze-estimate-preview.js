/**
 * Lightweight estimate classification for marketing preview — no auth, no heavy analysis.
 * POST JSON: { "documentText": "..." } — plain text from OCR.
 */

const OpenAI = require("openai");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function optionsResponse() {
  return { statusCode: 200, headers: corsHeaders, body: "" };
}

const PREVIEW_SYSTEM = `You classify property/casualty carrier estimate text for a short product preview.
Respond ONLY in valid JSON matching this exact shape and key names (no markdown, no code fences, no other text):
{
  "estimate_type": "string — damage category and trade scope, e.g. roof + water damage",
  "confidence": "High" | "Moderate" | "Low",
  "summary": "2-4 sentences in plain English, no jargon — what seems wrong or risky about the estimate",
  "key_issues": [ "at most 3 short bullet strings" ],
  "underpayment_risk": "High" | "Moderate" | "Low",
  "strategy": "one clear paragraph — single direction, not a list",
  "teaser": [ "exactly 4 short strings: what the full product includes" ]
}

Rules:
- Identify estimate type (damage category and trade scope).
- Classify underpayment_risk as High, Moderate, or Low with the summary supporting that level.
- key_issues: at most 3 items; imply more detail exists in a full analysis.
- summary: plain English only.
- teaser should match these themes in order: full line-item gap analysis; carrier vs Xactimate-style comparison; demand letter ready to send; PDF + Word export (word naturally).
- Base claims ONLY on the provided text; do not invent dollar amounts, policy numbers, or line items not evidenced.
- If the text is too short or unusable, still return valid JSON with conservative wording and Moderate or Low risk.`;

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return optionsResponse();
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Method not allowed", code: "METHOD" }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Invalid JSON", code: "JSON_PARSE" }),
    };
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

  const excerpt =
    documentText.length > 24000
      ? documentText.slice(0, 24000) + "\n\n[…truncated for preview…]"
      : documentText;

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 1200,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: PREVIEW_SYSTEM },
        {
          role: "user",
          content: `CARRIER ESTIMATE TEXT (excerpt):\n\n${excerpt}`,
        },
      ],
    });
    const raw = completion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(parsed),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: msg, code: "PREVIEW_FAILED" }),
    };
  }
};
