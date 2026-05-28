const PDFJS_CDN_VERSION = "4.4.168";

/** Max pages sent to AI vision on normal-sized PDFs. */
export const PDF_VISION_MAX_PAGES = 10;

/** Above this page count we cap vision and use sparse native text scan. */
export const PDF_LARGE_PAGE_THRESHOLD = 25;

/** Above this page count, vision is further reduced (paste recommended). */
export const PDF_HUGE_PAGE_THRESHOLD = 80;

/** For large PDFs, only read embedded text on head/tail pages (not all 300+). */
export const LARGE_PDF_NATIVE_HEAD_PAGES = 35;
export const LARGE_PDF_NATIVE_TAIL_PAGES = 12;

function pageNumbersToScan(totalPages: number): number[] {
  if (totalPages <= PDF_LARGE_PAGE_THRESHOLD) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const head = Math.min(LARGE_PDF_NATIVE_HEAD_PAGES, totalPages);
  const tail = Math.min(LARGE_PDF_NATIVE_TAIL_PAGES, totalPages);
  const set = new Set<number>();
  for (let p = 1; p <= head; p++) set.add(p);
  for (let p = Math.max(1, totalPages - tail + 1); p <= totalPages; p++) {
    set.add(p);
  }
  return [...set].sort((a, b) => a - b);
}

/** Vision page cap scales down on very large uploads. */
export function visionPageCap(totalPages: number): number {
  if (totalPages > PDF_HUGE_PAGE_THRESHOLD) return 6;
  if (totalPages > PDF_LARGE_PAGE_THRESHOLD) return 8;
  return PDF_VISION_MAX_PAGES;
}

async function loadPdfDocument(file: File) {
  const pdfjsLib = await import("pdfjs-dist");
  if (typeof window !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_CDN_VERSION}/pdf.worker.min.mjs`;
  }
  const arrayBuffer = await file.arrayBuffer();
  return pdfjsLib.getDocument({ data: arrayBuffer }).promise;
}

export type PdfTextExtractionResult = {
  pages: string[];
  totalPages: number;
  /** True when only head/tail pages were scanned for embedded text. */
  sparseNativeScan?: boolean;
};

/** One string per PDF page (index 0 = page 1). Large PDFs scan head/tail only for speed. */
export async function extractTextPagesFromPDF(
  file: File,
  onProgress?: (
    page: number,
    total: number,
    scanned: number,
    scanTotal: number,
    sparseNativeScan: boolean
  ) => void
): Promise<PdfTextExtractionResult> {
  const pdf = await loadPdfDocument(file);
  const total = pdf.numPages;
  const textPages: string[] = new Array(total).fill("");
  const toScan = pageNumbersToScan(total);
  const sparse = total > PDF_LARGE_PAGE_THRESHOLD;

  for (let si = 0; si < toScan.length; si++) {
    const i = toScan[si]!;
    onProgress?.(i, total, si + 1, toScan.length, sparse);
    try {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");
      textPages[i - 1] = pageText;
    } catch {
      textPages[i - 1] = "";
    }
    if (si % 12 === 0) {
      await new Promise<void>((r) => setTimeout(r, 0));
    }
  }

  return { pages: textPages, totalPages: total, sparseNativeScan: sparse };
}

/** First N page indices (0-based) to run AI vision on for large/scanned PDFs. */
export function defaultVisionPageIndices(
  totalPages: number,
  maxVision: number = visionPageCap(totalPages)
): number[] {
  const n = Math.min(totalPages, maxVision);
  return Array.from({ length: n }, (_, i) => i);
}

export async function extractTextFromPDF(file: File): Promise<string> {
  const { pages } = await extractTextPagesFromPDF(file);
  return pages.join("\n\n");
}

const OCR_MAX_PIXEL_WIDTH = 1500;
const OCR_JPEG_QUALITY = 0.75;

/** Render specific 1-based page numbers as JPEG base64 for vision OCR. */
export async function extractPageImagesFromPDF(
  file: File,
  pageNumbers: number[]
): Promise<string[]> {
  if (pageNumbers.length === 0) return [];
  const pdf = await loadPdfDocument(file);
  const images: string[] = [];
  for (const pageNum of pageNumbers) {
    if (pageNum < 1 || pageNum > pdf.numPages) continue;
    const page = await pdf.getPage(pageNum);
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

/** @deprecated Use extractPageImagesFromPDF — renders first N pages only. */
export async function extractImagesFromPDF(
  file: File,
  maxPages: number = PDF_VISION_MAX_PAGES
): Promise<string[]> {
  const indices = Array.from({ length: maxPages }, (_, i) => i + 1);
  return extractPageImagesFromPDF(file, indices);
}

export function countNativePagesWithText(pages: string[], minChars = 40): number {
  return pages.filter((p) => p.trim().length >= minChars).length;
}

export function mergeNativeAndVisionPages(
  nativePages: string[],
  visionByPageIndex: Map<number, string>,
  pageHasSufficientNative: (pageText: string) => boolean
): string {
  const parts: string[] = [];
  for (let i = 0; i < nativePages.length; i++) {
    const native = (nativePages[i] ?? "").trim();
    const vision = visionByPageIndex.get(i)?.trim();
    if (vision && !pageHasSufficientNative(native)) {
      parts.push(vision);
    } else if (native) {
      parts.push(native);
    }
  }
  return parts.join("\n\n");
}
