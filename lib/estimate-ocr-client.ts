import { netlifyFunctionUrl } from "@/lib/netlify-function-url";

export type OcrPageRequest = {
  base64Image: string;
  fileName: string;
  pageNumber: number;
  totalPages: number;
  /** Use unauthenticated preview OCR (analysis-preview funnel). */
  usePreviewEndpoint: boolean;
  fetcher: (
    input: RequestInfo | URL,
    init?: RequestInit
  ) => Promise<Response>;
};

export async function requestEstimateOcrPage(
  req: OcrPageRequest
): Promise<string> {
  const endpoint = req.usePreviewEndpoint
    ? netlifyFunctionUrl("estimate-ocr-preview")
    : netlifyFunctionUrl("analyze-estimate");

  const body = req.usePreviewEndpoint
    ? JSON.stringify({
        images: [req.base64Image],
        fileName: req.fileName,
      })
    : JSON.stringify({
        mode: "extract_only",
        images: [req.base64Image],
        fileName: req.fileName,
        pageNumber: req.pageNumber,
        totalPages: req.totalPages,
      });

  const res = await req.fetcher(endpoint, {
    method: "POST",
    body,
  });

  const ct = (res.headers.get("content-type") || "").toLowerCase();
  let payload: { text?: string; error?: string; code?: string } = {};
  if (ct.includes("application/json")) {
    payload = (await res.json().catch(() => ({}))) as typeof payload;
  } else {
    const raw = await res.text().catch(() => "");
    if (raw) payload = { error: raw.slice(0, 200) };
  }

  if (!res.ok) {
    const detail =
      payload.error?.trim() ||
      (res.status === 413
        ? "PDF page image too large for upload"
        : res.status === 504
          ? "OCR timed out — try pasting text or a smaller PDF"
          : `OCR failed (HTTP ${res.status})`);
    throw new Error(detail);
  }

  const text = payload.text?.trim() ?? "";
  if (!text) {
    throw new Error("OCR returned no text for this page");
  }
  return text;
}

/** ~5.5MB JSON body budget for Netlify (base64 page images). */
export const OCR_MAX_BASE64_CHARS = 4_000_000;

export function ocrImageTooLarge(base64: string): boolean {
  return base64.length > OCR_MAX_BASE64_CHARS;
}
