/**
 * ClaimWorks-Style PDF Generator for Estimate Review Pro
 * 
 * Generates professional, clean PDF reports with:
 * - Professional header with branding
 * - Estimate summary section
 * - Comparison results
 * - Missing items table
 * - Underpriced items table
 * - Carrier report summary
 * - Footer with timestamp and disclaimer
 */

import PDFDocument from "pdfkit";
import type {
  EstimateComparisonResult,
  ReportSummary,
  ParsedLineItem,
} from "../ai/prompts";

export interface PDFInput {
  comparison: EstimateComparisonResult;
  reportSummary?: ReportSummary;
  contractorItems: ParsedLineItem[];
  carrierItems?: ParsedLineItem[];
  reviewId?: string;
}

// Color palette (ClaimWorks-inspired)
const COLORS = {
  primary: "#0f172a", // Slate 900
  secondary: "#475569", // Slate 600
  accent: "#f59e0b", // Amber 500
  text: "#1e293b", // Slate 800
  textLight: "#64748b", // Slate 500
  border: "#e2e8f0", // Slate 200
  background: "#f8fafc", // Slate 50
  success: "#10b981", // Emerald 500
  warning: "#f59e0b", // Amber 500
  danger: "#ef4444", // Red 500
};

// Typography
const FONTS = {
  heading: { size: 18, weight: "bold" },
  subheading: { size: 14, weight: "bold" },
  body: { size: 10, weight: "normal" },
  small: { size: 8, weight: "normal" },
  caption: { size: 7, weight: "normal" },
};

// Layout
const MARGINS = {
  top: 60,
  bottom: 60,
  left: 50,
  right: 50,
};

const PAGE_WIDTH = 612; // Letter size
const PAGE_HEIGHT = 792;
const CONTENT_WIDTH = PAGE_WIDTH - MARGINS.left - MARGINS.right;

/**
 * Generate PDF report buffer
 */
export async function generatePDFReport(input: PDFInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "LETTER",
        margins: MARGINS,
        bufferPages: true,
        info: {
          Title: "Estimate Review Report",
          Author: "Estimate Review Pro",
          Subject: "Insurance Claim Estimate Analysis",
          Creator: "Estimate Review Pro",
        },
      });

      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Generate report content
      addHeader(doc);
      addEstimateSummary(doc, input);
      addComparisonResults(doc, input);
      addMissingItems(doc, input);
      addUnderpricedItems(doc, input);
      addCarrierReportSummary(doc, input);
      addFooter(doc, input);

      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Add professional header with branding
 */
function addHeader(doc: PDFKit.PDFDocument) {
  // Logo area (simulated with colored box + text)
  doc
    .rect(MARGINS.left, 30, 40, 40)
    .fillAndStroke(COLORS.accent, COLORS.accent);

  doc
    .fontSize(16)
    .fillColor("#ffffff")
    .font("Helvetica-Bold")
    .text("ER", MARGINS.left + 12, 45);

  // Company name and tagline
  doc
    .fontSize(20)
    .fillColor(COLORS.primary)
    .font("Helvetica-Bold")
    .text("Estimate Review Pro", MARGINS.left + 50, 35, {
      width: CONTENT_WIDTH - 50,
    });

  doc
    .fontSize(9)
    .fillColor(COLORS.textLight)
    .font("Helvetica")
    .text("AI-Powered Estimate Analysis Report", MARGINS.left + 50, 55, {
      width: CONTENT_WIDTH - 50,
    });

  // Horizontal divider
  doc
    .moveTo(MARGINS.left, 85)
    .lineTo(PAGE_WIDTH - MARGINS.right, 85)
    .strokeColor(COLORS.border)
    .lineWidth(1)
    .stroke();

  doc.moveDown(3);
}

/**
 * Add estimate summary section
 */
function addEstimateSummary(doc: PDFKit.PDFDocument, input: PDFInput) {
  const { comparison } = input;

  addSectionHeading(doc, "Estimate Summary");

  const contractorTotal = comparison.summary?.contractorTotal || 0;
  const carrierTotal = comparison.summary?.carrierTotal || 0;
  const difference = comparison.summary?.difference || 0;
  const percentDiff = comparison.summary?.percentDifference || 0;

  // Summary boxes
  const boxWidth = (CONTENT_WIDTH - 20) / 3;
  const startY = doc.y;

  // Contractor Total
  drawSummaryBox(
    doc,
    MARGINS.left,
    startY,
    boxWidth,
    "Contractor Estimate",
    `$${contractorTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    COLORS.primary
  );

  // Carrier Total
  drawSummaryBox(
    doc,
    MARGINS.left + boxWidth + 10,
    startY,
    boxWidth,
    "Carrier Estimate",
    `$${carrierTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    COLORS.secondary
  );

  // Difference
  const diffColor = difference > 0 ? COLORS.danger : COLORS.success;
  drawSummaryBox(
    doc,
    MARGINS.left + (boxWidth + 10) * 2,
    startY,
    boxWidth,
    "Difference",
    `$${Math.abs(difference).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${Math.abs(percentDiff).toFixed(1)}%)`,
    diffColor
  );

  doc.y = startY + 70;
  doc.moveDown(1);
}

/**
 * Draw summary box
 */
function drawSummaryBox(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string,
  color: string
) {
  // Box background
  doc.rect(x, y, width, 60).fillAndStroke(COLORS.background, COLORS.border);

  // Label
  doc
    .fontSize(8)
    .fillColor(COLORS.textLight)
    .font("Helvetica")
    .text(label.toUpperCase(), x + 10, y + 12, {
      width: width - 20,
      align: "center",
    });

  // Value
  doc
    .fontSize(16)
    .fillColor(color)
    .font("Helvetica-Bold")
    .text(value, x + 10, y + 30, {
      width: width - 20,
      align: "center",
    });
}

/**
 * Add comparison results section
 */
function addComparisonResults(doc: PDFKit.PDFDocument, input: PDFInput) {
  const { comparison } = input;

  if (!comparison.summary?.keyFindings || comparison.summary.keyFindings.length === 0) {
    return;
  }

  checkPageBreak(doc, 100);

  addSectionHeading(doc, "Key Findings");

  // Key findings box
  doc
    .rect(MARGINS.left, doc.y, CONTENT_WIDTH, 10)
    .fillAndStroke(COLORS.accent, COLORS.accent);

  doc.y += 15;

  comparison.summary.keyFindings.forEach((finding, index) => {
    checkPageBreak(doc, 30);

    doc
      .fontSize(10)
      .fillColor(COLORS.text)
      .font("Helvetica")
      .text(`${index + 1}. ${finding}`, MARGINS.left + 10, doc.y, {
        width: CONTENT_WIDTH - 20,
        align: "left",
      });

    doc.moveDown(0.5);
  });

  doc.moveDown(1);
}

/**
 * Add missing items section
 */
function addMissingItems(doc: PDFKit.PDFDocument, input: PDFInput) {
  const { comparison } = input;

  if (!comparison.missingItems || comparison.missingItems.length === 0) {
    return;
  }

  checkPageBreak(doc, 150);

  addSectionHeading(doc, "Missing Items");

  doc
    .fontSize(9)
    .fillColor(COLORS.textLight)
    .font("Helvetica")
    .text(
      "The following items appear in the contractor estimate but are not included in the carrier estimate:",
      MARGINS.left,
      doc.y,
      { width: CONTENT_WIDTH }
    );

  doc.moveDown(0.5);

  // Table header
  const tableTop = doc.y;
  drawTableHeader(doc, tableTop, [
    { label: "Trade", width: 80 },
    { label: "Description", width: 240 },
    { label: "Qty", width: 50, align: "right" },
    { label: "Unit Price", width: 70, align: "right" },
    { label: "Total", width: 72, align: "right" },
  ]);

  doc.y = tableTop + 20;

  // Table rows
  comparison.missingItems.slice(0, 20).forEach((missing, index) => {
    checkPageBreak(doc, 40);

    const item = missing.item;
    const rowY = doc.y;

    // Alternating row background
    if (index % 2 === 0) {
      doc.rect(MARGINS.left, rowY, CONTENT_WIDTH, 35).fill(COLORS.background);
    }

    // Row data
    doc
      .fontSize(8)
      .fillColor(COLORS.text)
      .font("Helvetica")
      .text(item.trade || "General", MARGINS.left + 5, rowY + 5, {
        width: 70,
      });

    doc.text(item.description || "Item", MARGINS.left + 85, rowY + 5, {
      width: 230,
    });

    doc.text(
      `${item.quantity || 0} ${item.unit || "EA"}`,
      MARGINS.left + 320,
      rowY + 5,
      { width: 50, align: "right" }
    );

    doc.text(
      `$${(item.unitPrice || 0).toFixed(2)}`,
      MARGINS.left + 375,
      rowY + 5,
      { width: 70, align: "right" }
    );

    doc
      .font("Helvetica-Bold")
      .text(`$${(item.total || 0).toFixed(2)}`, MARGINS.left + 450, rowY + 5, {
        width: 72,
        align: "right",
      });

    // Reason (if provided)
    if (missing.reason) {
      doc
        .fontSize(7)
        .fillColor(COLORS.danger)
        .font("Helvetica-Oblique")
        .text(missing.reason, MARGINS.left + 85, rowY + 20, { width: 437 });
    }

    doc.y = rowY + 35;
  });

  if (comparison.missingItems.length > 20) {
    doc
      .fontSize(8)
      .fillColor(COLORS.textLight)
      .font("Helvetica-Oblique")
      .text(
        `... and ${comparison.missingItems.length - 20} more items`,
        MARGINS.left,
        doc.y + 5
      );
  }

  doc.moveDown(1);
}

/**
 * Add underpriced items section
 */
function addUnderpricedItems(doc: PDFKit.PDFDocument, input: PDFInput) {
  const { comparison } = input;

  if (!comparison.underpricedItems || comparison.underpricedItems.length === 0) {
    return;
  }

  checkPageBreak(doc, 150);

  addSectionHeading(doc, "Underpriced Items");

  doc
    .fontSize(9)
    .fillColor(COLORS.textLight)
    .font("Helvetica")
    .text(
      "The following items are priced significantly lower in the carrier estimate:",
      MARGINS.left,
      doc.y,
      { width: CONTENT_WIDTH }
    );

  doc.moveDown(0.5);

  // Table header
  const tableTop = doc.y;
  drawTableHeader(doc, tableTop, [
    { label: "Description", width: 200 },
    { label: "Contractor", width: 80, align: "right" },
    { label: "Carrier", width: 80, align: "right" },
    { label: "Difference", width: 80, align: "right" },
    { label: "%", width: 72, align: "right" },
  ]);

  doc.y = tableTop + 20;

  // Table rows
  comparison.underpricedItems.slice(0, 15).forEach((item, index) => {
    checkPageBreak(doc, 40);

    const rowY = doc.y;

    // Alternating row background
    if (index % 2 === 0) {
      doc.rect(MARGINS.left, rowY, CONTENT_WIDTH, 35).fill(COLORS.background);
    }

    // Row data
    doc
      .fontSize(8)
      .fillColor(COLORS.text)
      .font("Helvetica")
      .text(
        item.contractorItem?.description || "Item",
        MARGINS.left + 5,
        rowY + 5,
        { width: 190 }
      );

    doc.text(
      `$${(item.contractorItem?.total || 0).toFixed(2)}`,
      MARGINS.left + 200,
      rowY + 5,
      { width: 80, align: "right" }
    );

    doc.text(
      `$${(item.carrierItem?.total || 0).toFixed(2)}`,
      MARGINS.left + 285,
      rowY + 5,
      { width: 80, align: "right" }
    );

    doc
      .fillColor(COLORS.danger)
      .font("Helvetica-Bold")
      .text(
        `$${(item.priceDifference || 0).toFixed(2)}`,
        MARGINS.left + 370,
        rowY + 5,
        { width: 80, align: "right" }
      );

    doc.text(
      `${(item.percentDifference || 0).toFixed(1)}%`,
      MARGINS.left + 455,
      rowY + 5,
      { width: 72, align: "right" }
    );

    // Reason (if provided)
    if (item.reason) {
      doc
        .fontSize(7)
        .fillColor(COLORS.textLight)
        .font("Helvetica-Oblique")
        .text(item.reason, MARGINS.left + 5, rowY + 20, { width: 522 });
    }

    doc.y = rowY + 35;
  });

  if (comparison.underpricedItems.length > 15) {
    doc
      .fontSize(8)
      .fillColor(COLORS.textLight)
      .font("Helvetica-Oblique")
      .text(
        `... and ${comparison.underpricedItems.length - 15} more items`,
        MARGINS.left,
        doc.y + 5
      );
  }

  doc.moveDown(1);
}

/**
 * Add carrier report summary section
 */
function addCarrierReportSummary(doc: PDFKit.PDFDocument, input: PDFInput) {
  const { reportSummary } = input;

  if (!reportSummary || !reportSummary.plainEnglishSummary) {
    return;
  }

  checkPageBreak(doc, 150);

  addSectionHeading(doc, "Carrier Letter Summary");

  // Approval status badge
  const status = reportSummary.approvalStatus || "unclear";
  const statusColor =
    status === "approved"
      ? COLORS.success
      : status === "denied"
      ? COLORS.danger
      : COLORS.warning;

  doc
    .rect(MARGINS.left, doc.y, 80, 20)
    .fillAndStroke(statusColor, statusColor);

  doc
    .fontSize(9)
    .fillColor("#ffffff")
    .font("Helvetica-Bold")
    .text(status.toUpperCase(), MARGINS.left + 10, doc.y - 14, {
      width: 60,
      align: "center",
    });

  doc.y += 10;
  doc.moveDown(1);

  // Plain English summary
  doc
    .fontSize(10)
    .fillColor(COLORS.text)
    .font("Helvetica")
    .text(reportSummary.plainEnglishSummary, MARGINS.left, doc.y, {
      width: CONTENT_WIDTH,
      align: "justify",
    });

  doc.moveDown(1);

  // Key findings
  if (reportSummary.keyFindings && reportSummary.keyFindings.length > 0) {
    checkPageBreak(doc, 80);

    doc
      .fontSize(11)
      .fillColor(COLORS.primary)
      .font("Helvetica-Bold")
      .text("Key Points:", MARGINS.left, doc.y);

    doc.moveDown(0.5);

    reportSummary.keyFindings.forEach((finding) => {
      checkPageBreak(doc, 25);

      doc
        .fontSize(9)
        .fillColor(COLORS.text)
        .font("Helvetica")
        .text(`• ${finding}`, MARGINS.left + 10, doc.y, {
          width: CONTENT_WIDTH - 10,
        });

      doc.moveDown(0.3);
    });

    doc.moveDown(0.5);
  }

  // Recommended actions
  if (
    reportSummary.recommendedActions &&
    reportSummary.recommendedActions.length > 0
  ) {
    checkPageBreak(doc, 80);

    doc
      .fontSize(11)
      .fillColor(COLORS.primary)
      .font("Helvetica-Bold")
      .text("Recommended Next Steps:", MARGINS.left, doc.y);

    doc.moveDown(0.5);

    reportSummary.recommendedActions.forEach((action, index) => {
      checkPageBreak(doc, 25);

      doc
        .fontSize(9)
        .fillColor(COLORS.text)
        .font("Helvetica")
        .text(`${index + 1}. ${action}`, MARGINS.left + 10, doc.y, {
          width: CONTENT_WIDTH - 10,
        });

      doc.moveDown(0.3);
    });
  }
}

/**
 * Add footer with timestamp and disclaimer
 */
function addFooter(doc: PDFKit.PDFDocument, input: PDFInput) {
  const pages = doc.bufferedPageRange();

  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);

    // Footer divider
    doc
      .moveTo(MARGINS.left, PAGE_HEIGHT - 50)
      .lineTo(PAGE_WIDTH - MARGINS.right, PAGE_HEIGHT - 50)
      .strokeColor(COLORS.border)
      .lineWidth(0.5)
      .stroke();

    // Timestamp
    doc
      .fontSize(7)
      .fillColor(COLORS.textLight)
      .font("Helvetica")
      .text(
        `Generated: ${new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}`,
        MARGINS.left,
        PAGE_HEIGHT - 40,
        { width: CONTENT_WIDTH / 2, align: "left" }
      );

    // Page number
    doc.text(
      `Page ${i + 1} of ${pages.count}`,
      PAGE_WIDTH / 2,
      PAGE_HEIGHT - 40,
      { width: CONTENT_WIDTH / 2, align: "right" }
    );

    // Disclaimer
    doc
      .fontSize(6)
      .fillColor(COLORS.textLight)
      .font("Helvetica-Oblique")
      .text(
        "This report is generated by Estimate Review Pro using AI analysis. For informational purposes only. Not legal, insurance, or financial advice.",
        MARGINS.left,
        PAGE_HEIGHT - 28,
        { width: CONTENT_WIDTH, align: "center" }
      );
  }
}

/**
 * Add section heading
 */
function addSectionHeading(doc: PDFKit.PDFDocument, title: string) {
  checkPageBreak(doc, 40);

  doc
    .fontSize(14)
    .fillColor(COLORS.primary)
    .font("Helvetica-Bold")
    .text(title, MARGINS.left, doc.y);

  doc.moveDown(0.5);

  // Underline
  doc
    .moveTo(MARGINS.left, doc.y)
    .lineTo(MARGINS.left + 150, doc.y)
    .strokeColor(COLORS.accent)
    .lineWidth(2)
    .stroke();

  doc.moveDown(1);
}

/**
 * Draw table header
 */
function drawTableHeader(
  doc: PDFKit.PDFDocument,
  y: number,
  columns: Array<{ label: string; width: number; align?: string }>
) {
  // Header background
  doc.rect(MARGINS.left, y, CONTENT_WIDTH, 18).fill(COLORS.primary);

  // Column headers
  let x = MARGINS.left + 5;
  columns.forEach((col) => {
    doc
      .fontSize(8)
      .fillColor("#ffffff")
      .font("Helvetica-Bold")
      .text(col.label.toUpperCase(), x, y + 5, {
        width: col.width - 10,
        align: col.align || "left",
      });
    x += col.width;
  });
}

/**
 * Check if page break is needed
 */
function checkPageBreak(doc: PDFKit.PDFDocument, requiredSpace: number) {
  if (doc.y + requiredSpace > PAGE_HEIGHT - MARGINS.bottom - 60) {
    doc.addPage();
  }
}

/**
 * Export default generator function
 */
export default generatePDFReport;

