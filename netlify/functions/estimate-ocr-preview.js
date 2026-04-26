/**
 * Unauthenticated page OCR for /analysis-preview only — same vision prompt as
 * analyze-estimate `extract_only` (no auth; no full analysis).
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

  const { images, fileName } = body;
  if (!images || !Array.isArray(images) || images.length === 0) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "No images provided", code: "NO_IMAGES" }),
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

  const content = [
    {
      type: "text",
      text: "Extract all text from this insurance estimate document. Return the complete text including all line items, quantities, unit prices, totals, header information (insured name, policy number, claim number, date of loss, adjuster name, carrier name), and any other visible text. Preserve structure as much as possible. Return plain text only.",
    },
    ...images.map((base64) => ({
      type: "image_url",
      image_url: { url: `data:image/jpeg;base64,${base64}`, detail: "high" },
    })),
  ];

  try {
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
    const message = err instanceof Error ? err.message : String(err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: message, code: "OCR_FAILED" }),
    };
  }
};
