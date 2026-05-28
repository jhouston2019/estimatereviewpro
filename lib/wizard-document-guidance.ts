import { hasEstimateLineContent } from "@/lib/estimate-ocr-text";

export type DocumentExtractIssue =
  | "partial_pdf"
  | "ocr_failed"
  | "no_line_items"
  | null;

export type WizardGuidance = {
  severity: "warning" | "error";
  title: string;
  body?: string;
  steps: string[];
};

export function inferExtractIssue(
  extractStatus: string,
  statusMessage: string | undefined,
  extractedText: string
): DocumentExtractIssue {
  const msg = (statusMessage ?? "").toLowerCase();
  const text = extractedText.trim();
  if (extractStatus === "error") return "ocr_failed";
  if (
    msg.includes("incomplete") ||
    msg.includes("paste the full") ||
    msg.includes("line items may be incomplete")
  ) {
    return "partial_pdf";
  }
  if (text && !hasEstimateLineContent(text)) return "no_line_items";
  return null;
}

export function guidanceForExtractIssue(
  issue: DocumentExtractIssue,
  sideLabel: string
): WizardGuidance | null {
  if (!issue) return null;
  if (issue === "ocr_failed") {
    return {
      severity: "error",
      title: `${sideLabel}: PDF page could not be read`,
      body: "AI vision did not return usable line items for one or more pages.",
      steps: [
        "Paste the full estimate from Xactimate into the text field below (select all line items → Ctrl+C).",
        "Or export a clearer PDF: File → Print → Save as PDF with line-item detail.",
        "Image-only pages and very large scans often need pasted text instead of upload alone.",
      ],
    };
  }
  if (issue === "partial_pdf") {
    return {
      severity: "warning",
      title: `${sideLabel}: only part of this PDF was captured`,
      body: "Large or scanned estimates are read page-by-page; some pages may be missing.",
      steps: [
        "Review the text below — if line items or dollar amounts are missing, paste the full estimate from Xactimate.",
        "For 100+ page files, paste the line-item export instead of relying on the PDF alone.",
        "Use File → Print → Save as PDF (detail report) rather than a photo scan when possible.",
      ],
    };
  }
  if (issue === "no_line_items") {
    return {
      severity: "warning",
      title: `${sideLabel}: no line items with dollar amounts detected`,
      body: "Comparison needs descriptions, quantities, and dollar figures — not just a cover sheet or summary.",
      steps: [
        "In Xactimate, open the line-item list, select all rows, and paste into the field below.",
        "Include RCV/ACV or line totals — we look for amounts like $1,234.56 across multiple rows.",
        "If you uploaded a PDF, scroll the pasted text and confirm line items appear before continuing.",
      ],
    };
  }
  return null;
}

export function documentSideLabel(
  side: string,
  category: string
): string {
  if (side === "CARRIER") return "Carrier estimate";
  if (side === "CONTRACTOR") return "Contractor / PA estimate";
  return `${category} (${side})`;
}

/** Inspect wizard documents before compare / Step 3. */
export function analyzeDocumentsForComparison(
  documents: Array<{
    side: string;
    category: string;
    label: string;
    extractedText: string;
    extractStatus: string;
    statusMessage?: string;
    extractIssue?: DocumentExtractIssue;
  }>
): {
  missingCarrier: boolean;
  missingContractor: boolean;
  carrierNoLines: boolean;
  contractorNoLines: boolean;
  partialDocLabels: string[];
} {
  const carrierDocs = documents.filter(
    (d) => d.side === "CARRIER" && d.extractedText.trim()
  );
  const otherDocs = documents.filter(
    (d) => d.side !== "CARRIER" && d.extractedText.trim()
  );
  const missingCarrier = !documents.some(
    (d) => d.side === "CARRIER" && d.extractedText.trim()
  );
  const missingContractor = !documents.some(
    (d) => d.side !== "CARRIER" && d.extractedText.trim()
  );
  const carrierNoLines =
    carrierDocs.length > 0 &&
    carrierDocs.every((d) => !hasEstimateLineContent(d.extractedText));
  const contractorNoLines =
    otherDocs.length > 0 &&
    otherDocs.every((d) => !hasEstimateLineContent(d.extractedText));
  const partialDocLabels: string[] = [];
  for (const d of documents) {
    const issue =
      d.extractIssue ??
      inferExtractIssue(d.extractStatus, d.statusMessage, d.extractedText);
    if (issue === "partial_pdf" || issue === "ocr_failed") {
      partialDocLabels.push(d.label || documentSideLabel(d.side, d.category));
    }
  }
  return {
    missingCarrier,
    missingContractor,
    carrierNoLines,
    contractorNoLines,
    partialDocLabels,
  };
}

export function guidanceForDocument(doc: {
  side: string;
  category: string;
  label: string;
  extractStatus: string;
  statusMessage?: string;
  extractedText: string;
  extractIssue?: DocumentExtractIssue;
}): WizardGuidance | null {
  if (
    doc.extractStatus === "idle" &&
    doc.statusMessage?.toLowerCase().includes("paste")
  ) {
    return {
      severity: "warning",
      title: `${documentSideLabel(doc.side, doc.category)}: paste estimate text`,
      body: "Uploaded images are not auto-read in the browser.",
      steps: [
        "Copy all line items from your estimate software (Xactimate: select rows → Ctrl+C).",
        "Paste into the text field below — include quantities and dollar amounts.",
        "Or upload a PDF instead of a photo when possible.",
      ],
    };
  }
  const issue =
    doc.extractIssue ??
    inferExtractIssue(
      doc.extractStatus,
      doc.statusMessage,
      doc.extractedText
    );
  return guidanceForExtractIssue(
    issue,
    doc.label || documentSideLabel(doc.side, doc.category)
  );
}

export function guidanceForComparisonBlocked(args: {
  missingCarrier: boolean;
  missingContractor: boolean;
  carrierNoLines: boolean;
  contractorNoLines: boolean;
  partialDocs: string[];
}): WizardGuidance {
  const steps: string[] = [];
  if (args.missingCarrier || args.missingContractor) {
    steps.push(
      "On Step 1, add both a carrier estimate and a contractor or PA estimate (upload PDF or paste text)."
    );
  }
  if (args.carrierNoLines) {
    steps.push(
      "Carrier text must include line items with dollar amounts — paste from Xactimate if the PDF only captured cover pages."
    );
  }
  if (args.contractorNoLines) {
    steps.push(
      "Contractor/PA text must include line items with dollar amounts — paste the full scope, not a summary page."
    );
  }
  for (const name of args.partialDocs) {
    steps.push(
      `"${name}" may be incomplete — paste the full line-item export for that document on Step 1.`
    );
  }
  if (steps.length === 0) {
    steps.push(
      "Go back to Step 1, confirm both estimates show line items with dollar amounts, then use Re-run comparison."
    );
  }
  return {
    severity: "error",
    title: "Comparison table could not be built",
    body: "The wizard needs readable line-item text on both sides before Step 3 can show a table.",
    steps,
  };
}
