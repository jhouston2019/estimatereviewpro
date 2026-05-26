const PDFJS_CDN_VERSION = "4.4.168";

export async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  if (typeof window !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_CDN_VERSION}/pdf.worker.min.mjs`;
  }
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const textPages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    textPages.push(pageText);
  }
  return textPages.join("\n\n");
}

const PREVIEW_PDF_OCR_MAX_PAGES = 3;
const OCR_MAX_PIXEL_WIDTH = 1024;
const OCR_JPEG_QUALITY = 0.72;

/**
 * Renders up to 3 pages as JPEG base64 (matches upload wizard for OCR).
 * Images are capped in width so Netlify/OpenAI vision requests stay under limits.
 */
export async function extractImagesFromPDF(file: File): Promise<string[]> {
  const pdfjsLib = await import("pdfjs-dist");
  if (typeof window !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_CDN_VERSION}/pdf.worker.min.mjs`;
  }
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const images: string[] = [];
  const maxPages = Math.min(pdf.numPages, PREVIEW_PDF_OCR_MAX_PAGES);
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(1.5, OCR_MAX_PIXEL_WIDTH / baseViewport.width);
    const viewport = page.getViewport({ scale: Math.max(0.5, scale) });
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
