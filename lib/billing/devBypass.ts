/**
 * Dev-only payment bypass. Never enable BYPASS_PAYMENT outside development.
 */

export function isPaymentBypassActive(): boolean {
  if (process.env.NODE_ENV !== "development") {
    return false;
  }
  const v = process.env.BYPASS_PAYMENT;
  return v === "true" || v === "1";
}

/** Call from middleware / API when bypass would grant access */
export function productionBypassPaymentMisconfigurationResponse() {
  return process.env.NODE_ENV === "production" &&
    (process.env.BYPASS_PAYMENT === "true" || process.env.BYPASS_PAYMENT === "1");
}
