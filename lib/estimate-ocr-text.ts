/**
 * Detect and strip conversational OCR refusals from vision model output.
 * Models sometimes return apologies instead of raising an error.
 */

const OCR_REFUSAL_LINE_PATTERNS: RegExp[] = [
  /unable to extract text from the image/i,
  /cannot extract text from the image/i,
  /can't extract text from the image/i,
  /if you can provide the text or necessary details/i,
  /i can help you with any questions/i,
  /i'?m unable to extract/i,
  /i am unable to extract/i,
  /as an ai language model/i,
  /i don'?t have the ability to extract/i,
];

const OCR_UNREADABLE_MARKER = "[UNREADABLE_PAGE]";

/** Paragraphs that are only model refusals (short, no estimate structure). */
function isRefusalParagraph(paragraph: string): boolean {
  const p = paragraph.trim();
  if (!p) return true;
  if (p.length > 500) return false;
  if (OCR_REFUSAL_LINE_PATTERNS.some((rx) => rx.test(p))) return true;
  if (
    p.length < 280 &&
    /^(i'?m|i am|unfortunately|sorry)[^.!?]*[.!?]?\s*$/i.test(p) &&
    !/\$\s*\d|\bqty\b/i.test(p)
  ) {
    return true;
  }
  return false;
}

export function stripOcrRefusalPreamble(text: string): {
  text: string;
  strippedRefusal: boolean;
} {
  let raw = text.trim();
  if (!raw) return { text: "", strippedRefusal: false };

  if (raw.includes(OCR_UNREADABLE_MARKER)) {
    const after = raw
      .split(OCR_UNREADABLE_MARKER)
      .map((s) => s.trim())
      .filter(Boolean)
      .join("\n\n");
    return {
      text: after,
      strippedRefusal: true,
    };
  }

  const parts = raw.split(/\n\s*\n/);
  let strippedRefusal = false;
  while (parts.length > 0 && isRefusalParagraph(parts[0]!)) {
    strippedRefusal = true;
    parts.shift();
  }

  const joined = parts.join("\n\n").trim();
  return {
    text: joined || raw,
    strippedRefusal,
  };
}

/** True when nothing usable remains for estimate analysis. */
export function isOcrTextUnusable(text: string): boolean {
  const { text: cleaned } = stripOcrRefusalPreamble(text);
  const t = cleaned.trim();
  if (!t) return true;
  if (t === OCR_UNREADABLE_MARKER) return true;
  if (t.length < 80 && OCR_REFUSAL_LINE_PATTERNS.some((rx) => rx.test(t))) {
    return true;
  }
  const hasEstimateSignals =
    /\$\s*[\d,]+/.test(t) ||
    /\b(qty|quantity|total|replace|remove|rcv|acv)\b/i.test(t) ||
    /\b\d+\.?\d*\s*(sf|lf|ea|sq|hr|day)\b/i.test(t) ||
    (t.length > 400 && /\d{2,}/.test(t));
  if (!hasEstimateSignals && OCR_REFUSAL_LINE_PATTERNS.some((rx) => rx.test(t))) {
    return true;
  }
  return false;
}

export function normalizeOcrPageText(raw: string): {
  text: string;
  strippedRefusal: boolean;
  unusable: boolean;
} {
  const { text, strippedRefusal } = stripOcrRefusalPreamble(raw);
  return {
    text,
    strippedRefusal,
    unusable: isOcrTextUnusable(text),
  };
}
