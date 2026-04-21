const { Document, Packer, Paragraph, TextRun, AlignmentType } = require("docx");
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
    const { text, fileName = 'dispute-letter.docx', certifiedMailHeader } = JSON.parse(event.body || '{}');

    if (!text) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'No text provided' })
      };
    }

    const headerText = certifiedMailHeader
      ? 'SENT VIA CERTIFIED MAIL — RETURN RECEIPT REQUESTED'
      : null;

    const lines = text.split('\n');
    const children = [];

    if (headerText) {
      children.push(new Paragraph({
        children: [new TextRun({ text: headerText, bold: true, size: 20 })],
        spacing: { after: 200 }
      }));
      children.push(new Paragraph({ text: '' }));
    }

    for (const line of lines) {
      const trimmed = line.trim();
      const isSectionHeader = /^(Basis for Supplement|Policy Obligations|Regulatory Duties|Demand|Reservation of Rights)\./.test(trimmed);
      const isEmpty = trimmed === '';

      children.push(new Paragraph({
        children: [new TextRun({
          text: trimmed,
          bold: isSectionHeader,
          size: isSectionHeader ? 22 : 20,
          font: 'Times New Roman'
        })],
        spacing: { after: isEmpty ? 0 : isSectionHeader ? 160 : 120, before: isSectionHeader ? 200 : 0 }
      }));
    }

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }
          }
        },
        children
      }]
    });

    const buffer = await Packer.toBuffer(doc);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Access-Control-Allow-Origin': '*'
      },
      body: Buffer.from(buffer).toString('base64'),
      isBase64Encoded: true
    };

  } catch (err) {
    console.error('generate-docx error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to generate DOCX', details: err.message })
    };
  }
};
