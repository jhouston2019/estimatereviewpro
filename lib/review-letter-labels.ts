const letterTypeStoredLabel: Record<string, string> = {
  SUPPLEMENT_DEMAND: "Supplement demand letter",
  APPEAL: "Appeal letter",
  DISPUTE: "Dispute letter",
  REINSPECTION_REQUEST: "Re-inspection request",
  APPRAISAL_INVOCATION: "Appraisal invocation",
  CUSTOM_NARRATIVE: "Custom / narrative",
  CUSTOM: "Custom letter",
};

export function labelForStoredLetterType(code: string | null): string {
  if (!code?.trim()) return "—";
  return letterTypeStoredLabel[code] ?? code;
}
