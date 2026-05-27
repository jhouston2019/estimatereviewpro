/**
 * PDF page OCR for the upload wizard (preview and paid). No auth — same vision
 * prompt as analyze-estimate `extract_only`; paid analysis stays on analyze-estimate.
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

const REFUSAL_RX = [
  /unable to extract text from the image/i,
  /cannot extract text from the image/i,
  /if you can provide the text or necessary details/i,
  /i can help you with any questions/i,
  /i'?m unable to extract/i,
];

function isRefusalParagraph(p) {
  const t = String(p || "").trim();
  if (!t) return true;
  if (t.length > 500) return false;
  return REFUSAL_RX.some((rx) => rx.test(t));
}

function stripRefusalPreamble(text) {
  let raw = String(text || "").trim();
  if (!raw) return { text: "", stripped: false };
  if (raw.includes("[UNREADABLE_PAGE]")) {
    const after = raw
      .split("[UNREADABLE_PAGE]")
      .map((s) => s.trim())
      .filter(Boolean)
      .join("\n\n");
    return { text: after, stripped: true };
  }
  const parts = raw.split(/\n\s*\n/);
  let stripped = false;
  while (parts.length && isRefusalParagraph(parts[0])) {
    stripped = true;
    parts.shift();
  }
  const joined = parts.join("\n\n").trim();
  return { text: joined || raw, stripped };
}

function isUnusableOcr(text) {
  const cleaned = stripRefusalPreamble(text).text.trim();
  if (!cleaned) return true;
  if (cleaned.length < 80 && REFUSAL_RX.some((rx) => rx.test(cleaned))) return true;
  const hasEstimate =
    /\$\s*[\d,]+/.test(cleaned) ||
    /\b(qty|quantity|total|replace|remove)\b/i.test(cleaned) ||
    (cleaned.length > 400 && /\d{2,}/.test(cleaned));
  if (!hasEstimate && REFUSAL_RX.some((rx) => rx.test(cleaned))) return true;
  return false;
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

  const maxB64 = 4_500_000;
  for (let i = 0; i < images.length; i++) {
    const len = String(images[i] || "").length;
    if (len > maxB64) {
      return {
        statusCode: 413,
        headers: corsHeaders,
        body: JSON.stringify({
          error: `Page ${i + 1} image is too large for OCR. Paste text or use a smaller PDF.`,
          code: "IMAGE_TOO_LARGE",
        }),
      };
    }
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
      text: "You are an OCR engine for insurance estimate PDF pages. Extract every visible line item row with DESCRIPTION, QTY, REMOVE, REPLACE, TAX, O&P, TOTAL, quantities, unit costs, and all dollar amounts. Include headers and footer totals. Preserve table rows line-by-line. Return plain text only — no commentary. Do not apologize or ask the user to paste text. If the page is unreadable, respond with exactly [UNREADABLE_PAGE] and nothing else.",
    },
    ...images.map((base64) => ({
      type: "image_url",
      image_url: { url: `data:image/jpeg;base64,${base64}`, detail: "high" },
    })),
  ];

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 4096,
      messages: [{ role: "user", content }],
    });
    const rawText = response.choices[0]?.message?.content ?? "";
    const { text: extractedText, stripped } = stripRefusalPreamble(rawText);
    if (isUnusableOcr(extractedText)) {
      return {
        statusCode: 422,
        headers: corsHeaders,
        body: JSON.stringify({
          error:
            "AI vision could not read this page. Paste the estimate text below or try a clearer PDF export.",
          code: "OCR_UNREADABLE",
        }),
      };
    }
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        text: extractedText,
        pages: images.length,
        fileName: fileName ?? null,
        strippedRefusal: stripped,
      }),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isQuota =
      /429|quota|billing|insufficient/i.test(message) ||
      (err && typeof err === "object" && "status" in err && err.status === 429);
    const userMessage = isQuota
      ? "AI reading limit reached on the server (OpenAI quota). Paste the estimate text below, or retry after billing is updated."
      : message;
    return {
      statusCode: isQuota ? 429 : 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: userMessage,
        code: isQuota ? "OPENAI_QUOTA" : "OCR_FAILED",
      }),
    };
  }
};
