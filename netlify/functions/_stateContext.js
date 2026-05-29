/**
 * _stateContext.js
 * State-specific insurance context for analysis and letter generation.
 * Keys are 2-letter uppercase state codes.
 */

const STATE_CONTEXT = {
  TX: {
    badFaithExposure: "high",
    promptPaymentDays: 15,
    notes: "Texas Insurance Code Chapter 542 (Texas Prompt Payment of Claims Act) imposes strict timelines and penalty interest. Texas Chapter 541 covers unfair settlement practices. Carriers have heightened exposure in TX.",
  },
  FL: {
    badFaithExposure: "high",
    promptPaymentDays: 90,
    notes: "Florida Statute 627.70131 governs prompt payment. Florida has a Civil Remedy Notice (CRN) process that must be filed before a bad faith claim. DFS complaints are a meaningful lever.",
  },
  CA: {
    badFaithExposure: "high",
    promptPaymentDays: 40,
    notes: "California Fair Claims Settlement Practices Regulations (10 CCR 2695) are among the most detailed in the nation. CDI complaints carry weight. Bad faith tort claims are available.",
  },
  GA: {
    badFaithExposure: "moderate-high",
    promptPaymentDays: 60,
    notes: "Georgia O.C.G.A. 33-4-6 allows up to 50% penalty and attorney fees for bad faith refusal to pay. Georgia DOI complaints are an available lever.",
  },
  CO: {
    badFaithExposure: "high",
    promptPaymentDays: 60,
    notes: "Colorado HB21-1283 (FAIR Act) provides statutory bad faith claims. Colorado Division of Insurance is active. Treble damages available for certain violations.",
  },
  OK: {
    badFaithExposure: "high",
    promptPaymentDays: 45,
    notes: "Oklahoma has a robust bad faith common law tort framework. Punitive damages available. OID complaints are meaningful.",
  },
  LA: {
    badFaithExposure: "high",
    promptPaymentDays: 30,
    notes: "Louisiana R.S. 22:1973 and 22:1892 impose penalties and attorney fees. Louisiana has one of the shortest prompt payment windows in the country.",
  },
  MS: {
    badFaithExposure: "high",
    promptPaymentDays: 30,
    notes: "Mississippi has strong bad faith common law. MID complaints carry weight in this market.",
  },
  AL: {
    badFaithExposure: "moderate-high",
    promptPaymentDays: 45,
    notes: "Alabama bad faith claims available. ALDOI is an available escalation channel.",
  },
  NC: {
    badFaithExposure: "moderate",
    promptPaymentDays: 30,
    notes: "North Carolina G.S. 58-63-15 covers unfair trade practices. NCDOI complaints available.",
  },
  SC: {
    badFaithExposure: "moderate",
    promptPaymentDays: 45,
    notes: "South Carolina Unfair Trade Practices Act applies. SCDOI complaints available.",
  },
  TN: {
    badFaithExposure: "moderate",
    promptPaymentDays: 60,
    notes: "Tennessee T.C.A. 56-7-105 allows bad faith penalty of 25%. TDCI available.",
  },
  AZ: {
    badFaithExposure: "moderate",
    promptPaymentDays: 40,
    notes: "Arizona bad faith common law. DIFI complaints available.",
  },
  NV: {
    badFaithExposure: "moderate",
    promptPaymentDays: 30,
    notes: "Nevada NRS 686A.310 covers unfair practices. DOI complaints available.",
  },
  IL: {
    badFaithExposure: "moderate",
    promptPaymentDays: 45,
    notes: "Illinois Section 155 allows attorney fees and penalties. IDOI available.",
  },
  OH: {
    badFaithExposure: "moderate",
    promptPaymentDays: 45,
    notes: "Ohio bad faith common law. ODI complaints available.",
  },
  MI: {
    badFaithExposure: "moderate",
    promptPaymentDays: 60,
    notes: "Michigan bad faith tort available. DIFS available.",
  },
  PA: {
    badFaithExposure: "moderate",
    promptPaymentDays: 30,
    notes: "Pennsylvania 42 Pa.C.S. 8371 — interest, attorney fees, punitive damages for bad faith. PDOI available.",
  },
};

/**
 * Returns state context object or null if state not found.
 * @param {string} stateCode - 2-letter uppercase state code
 */
function getStateContext(stateCode) {
  const code = String(stateCode || "").trim().toUpperCase();
  return STATE_CONTEXT[code] || null;
}

/**
 * Returns a plain-English state context string for injection into prompts.
 * @param {string} stateCode
 */
function getStateContextForPrompt(stateCode) {
  const ctx = getStateContext(stateCode);
  if (!ctx) return "";
  return `STATE CONTEXT (${stateCode}): Bad faith exposure: ${ctx.badFaithExposure}. Prompt payment window: ${ctx.promptPaymentDays} days. ${ctx.notes}`;
}

module.exports = { getStateContext, getStateContextForPrompt };
