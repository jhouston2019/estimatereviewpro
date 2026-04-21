const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const {
  corsHeaders,
  optionsResponse,
  verifyWizardAuth,
} = require("./_wizardAuth.js");

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

  try {
    const body = JSON.parse(event.body || '{}');
    const { text, fileName = 'dispute-letter.pdf', certifiedMailHeader } = body;

    const headerBlock = certifiedMailHeader
      ? 'SENT VIA CERTIFIED MAIL — RETURN RECEIPT REQUESTED\n\n'
      : '';
    const fullText = headerBlock + (text || '');

    if (!fullText.trim()) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'No text provided' })
      };
    }

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

    const rawLines = fullText.split('\n');
    const wrappedLines = [];

    for (const raw of rawLines) {
      if (raw.trim() === '') {
        wrappedLines.push('');
        continue;
      }
      const words = raw.split(' ');
      let current = '';
      for (const word of words) {
        const test = current ? current + ' ' + word : word;
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
          color: rgb(0, 0, 0)
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
        color: rgb(0, 0, 0)
      });
    }

    const pdfBytes = await pdfDoc.save();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Access-Control-Allow-Origin': '*'
      },
      body: Buffer.from(pdfBytes).toString('base64'),
      isBase64Encoded: true
    };

  } catch (err) {
    console.error('generate-pdf error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to generate PDF', details: err.message })
    };
  }
};
