const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const {
  corsHeaders,
  optionsResponse,
  verifyWizardAuth,
} = require("./_wizardAuth.js");

function sanitizeFileName(name) {
  if (typeof name !== "string" || !name.trim()) return "dispute-letter.pdf";
  const safe = name.replace(/[^a-zA-Z0-9._-]+/g, "_").trim();
  if (!safe.toLowerCase().endsWith(".pdf")) {
    return `${(safe || "export").slice(0, 180)}.pdf`;
  }
  return safe.slice(0, 200) || "dispute-letter.pdf";
}

function jsonError(statusCode, error, details, code) {
  const body = { error };
  if (details) body.details = details;
  if (code) body.code = code;
  return {
    statusCode,
    headers: { ...corsHeaders },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return optionsResponse();

  if (event.httpMethod !== "POST") {
    return jsonError(405, "Method not allowed", null, "METHOD");
  }

  console.log("[generate-pdf] request", {
    hasBody: Boolean(event.body),
    bodyLength: event.body != null ? String(event.body).length : 0,
  });
  // In-process text layout via pdf-lib only — no headless browser / PUPPETEER_* required on Netlify.
  console.log("[generate-pdf] runtime", {
    NODE_ENV: process.env.NODE_ENV,
    NETLIFY: process.env.NETLIFY,
    NETLIFY_CONTEXT: process.env.NETLIFY_CONTEXT,
  });

  const auth = await verifyWizardAuth(event);
  if (!auth.ok) return auth.response;

  let body;
  try {
    if (event.body == null || String(event.body).trim() === "") {
      body = {};
    } else {
      body = JSON.parse(event.body);
    }
  } catch (e) {
    return jsonError(
      400,
      "Invalid JSON in request body",
      e && e.message ? e.message : String(e),
      "INVALID_JSON"
    );
  }

  console.log("[generate-pdf] parsed", {
    keys: body && typeof body === "object" ? Object.keys(body) : [],
    textType: body && typeof body.text,
    fileNameType: body && typeof body.fileName,
    certifiedMailHeader: Boolean(body && body.certifiedMailHeader),
  });

  const { text: rawText, fileName: rawName, certifiedMailHeader } = body || {};

  if (rawText != null && typeof rawText !== "string") {
    return jsonError(
      400,
      'Field "text" must be a string (or omitted for empty body)',
      null,
      "TEXT_TYPE"
    );
  }

  const fileName = sanitizeFileName(
    typeof rawName === "string" ? rawName : undefined
  );

  const headerBlock = certifiedMailHeader
    ? "SENT VIA CERTIFIED MAIL — RETURN RECEIPT REQUESTED\n\n"
    : "";
  const text = rawText == null ? "" : rawText;
  const fullText = headerBlock + text;

  if (!String(fullText).trim()) {
    return jsonError(
      400,
      "No text provided for PDF export (empty or missing after parsing)",
      "Send a non-empty string in the JSON field \"text\".",
      "EMPTY_TEXT"
    );
  }

  try {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const fontSize = 12;
    const lineHeight = fontSize * 1.6;
    const margin = 72;
    const headingLineRe =
      /^(Basis for Supplement|Policy Obligations|Regulatory Duties|Demand|Reservation of Rights)\./;

    const addPage = () => {
      const p = pdfDoc.addPage([612, 792]);
      return { page: p, y: p.getHeight() - margin };
    };

    let { page, y } = addPage();
    const maxWidth = 612 - margin * 2;

    const rawLines = String(fullText).split("\n");
    const wrappedLines = [];

    for (const raw of rawLines) {
      if (raw.trim() === "") {
        wrappedLines.push("");
        continue;
      }
      const words = raw.split(" ");
      let current = "";
      for (const word of words) {
        const test = current ? current + " " + word : word;
        if (font.widthOfTextAtSize(test, fontSize) <= maxWidth) {
          current = test;
        } else {
          if (current) wrappedLines.push(current);
          current = word;
        }
      }
      if (current) wrappedLines.push(current);
    }

    for (const line of wrappedLines) {
      if (y < margin + lineHeight) {
        const next = addPage();
        page = next.page;
        y = next.y;
      }
      if (line.trim()) {
        const lineFont = headingLineRe.test(line) ? boldFont : font;
        page.drawText(line, {
          x: margin,
          y,
          size: fontSize,
          font: lineFont,
          color: rgb(0, 0, 0),
        });
      }
      y -= lineHeight;
    }

    const pages = pdfDoc.getPages();
    const totalPages = pages.length;
    const pageNumSize = 10;
    for (let i = 0; i < totalPages; i++) {
      const label = `${i + 1} of ${totalPages}`;
      const w = font.widthOfTextAtSize(label, pageNumSize);
      pages[i].drawText(label, {
        x: 306 - w / 2,
        y: 36,
        size: pageNumSize,
        font,
        color: rgb(0, 0, 0),
      });
    }

    const pdfBytes = await pdfDoc.save();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Access-Control-Allow-Origin": "*",
      },
      body: Buffer.from(pdfBytes).toString("base64"),
      isBase64Encoded: true,
    };
  } catch (err) {
    console.error("generate-pdf error:", err);
    return {
      statusCode: 500,
      headers: { ...corsHeaders },
      body: JSON.stringify({
        error: "Failed to generate PDF",
        details: err && err.message ? err.message : String(err),
        code: "PDF_BUILD",
      }),
    };
  }
};
