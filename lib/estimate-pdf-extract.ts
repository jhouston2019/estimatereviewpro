const PDFJS_CDN_VERSION = "4.4.168";

async function loadPdfDocument(file: File) {
  const pdfjsLib = await import("pdfjs-dist");
  if (typeof window !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_CDN_VERSION}/pdf.worker.min.mjs`;
  }
  const arrayBuffer = await file.arrayBuffer();
  return pdfjsLib.getDocument({ data: arrayBuffer }).promise;
}

/** One string per PDF page (1-based index maps to array index 0). */
export async function extractTextPagesFromPDF(file: File): Promise<string[]> {
  const pdf = await loadPdfDocument(file);
  const textPages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    textPages.push(pageText);
  }
  return textPages;
}

export async function extractTextFromPDF(file: File): Promise<string> {
  const pages = await extractTextPagesFromPDF(file);
  return pages.join("\n\n");
}

export const PDF_OCR_MAX_PAGES = 12;

const OCR_MAX_PIXEL_WIDTH = 1800;
const OCR_JPEG_QUALITY = 0.82;

/**
 * Renders up to 3 pages as JPEG base64 (matches upload wizard for OCR).
 * Images are capped in width so Netlify/OpenAI vision requests stay under limits.
 */
export async function extractImagesFromPDF(
  file: File,
  maxPages: number = PDF_OCR_MAX_PAGES
): Promise<string[]> {
  const pdf = await loadPdfDocument(file);
  const images: string[] = [];
  const pageLimit = Math.min(pdf.numPages, maxPages);
  for (let i = 1; i <= pageLimit; i++) {
    const page = await pdf.getPage(i);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(2, OCR_MAX_PIXEL_WIDTH / baseViewport.width);
    const viewport = page.getViewport({ scale: Math.max(0.75, scale) });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    await page.render({ canvasContext: ctx, viewport }).promise;
    const dataUrl = canvas.toDataURL("image/jpeg", OCR_JPEG_QUALITY);
    const base64 = dataUrl.split(",")[1];
    if (base64) images.push(base64);
  }
  return images;
}
