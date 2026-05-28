import { netlifyFunctionUrl } from "@/lib/netlify-function-url";
import { normalizeOcrPageText } from "@/lib/estimate-ocr-text";

export type OcrPageRequest = {
  base64Image: string;
  fileName: string;
  pageNumber: number;
  totalPages: number;
};

/**
 * PDF page OCR — always uses estimate-ocr-preview (no auth).
 * Reading uploaded PDFs is input extraction, not paid analysis; gating OCR
 * behind analyze-estimate auth caused regressions after production auth tightened.
 */
export async function requestEstimateOcrPage(
  req: OcrPageRequest
): Promise<string> {
  const res = await fetch(netlifyFunctionUrl("estimate-ocr-preview"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      images: [req.base64Image],
      fileName: req.fileName,
      pageNumber: req.pageNumber,
      totalPages: req.totalPages,
    }),
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

  const raw = payload.text?.trim() ?? "";
  if (!raw) {
    throw new Error("OCR returned no text for this page");
  }
  const normalized = normalizeOcrPageText(raw);
  if (normalized.unusable) {
    throw new Error(
      "AI vision could not read this page. Paste the estimate text below or try a clearer PDF export."
    );
  }
  return normalized.text;
}

export type OcrPageJob = {
  pageIndex: number;
  pageNumber: number;
  base64Image: string;
};

/** Run single-page OCR jobs in parallel (faster than one-by-one). */
export async function requestEstimateOcrParallel(
  jobs: OcrPageJob[],
  fileName: string,
  totalPages: number,
  options?: {
    maxConcurrent?: number;
    onProgress?: (done: number, total: number) => void;
  }
): Promise<{ results: Map<number, string>; failedPageNumbers: number[] }> {
  const maxConcurrent = options?.maxConcurrent ?? 3;
  const results = new Map<number, string>();
  const failedPageNumbers: number[] = [];
  let done = 0;

  const runOne = async (job: OcrPageJob) => {
    try {
      const text = await requestEstimateOcrPage({
        base64Image: job.base64Image,
        fileName,
        pageNumber: job.pageNumber,
        totalPages,
      });
      results.set(job.pageIndex, text);
    } catch {
      failedPageNumbers.push(job.pageNumber);
    } finally {
      done += 1;
      options?.onProgress?.(done, jobs.length);
    }
  };

  const queue = [...jobs];
  const workers = Array.from(
    { length: Math.min(maxConcurrent, queue.length) },
    async () => {
      while (queue.length > 0) {
        const job = queue.shift();
        if (job) await runOne(job);
      }
    }
  );
  await Promise.all(workers);

  return { results, failedPageNumbers };
}

/** ~5.5MB JSON body budget for Netlify (base64 page images). */
export const OCR_MAX_BASE64_CHARS = 4_000_000;

export function ocrImageTooLarge(base64: string): boolean {
  return base64.length > OCR_MAX_BASE64_CHARS;
}
