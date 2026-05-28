/**
 * Deterministic line-item comparison when OpenAI returns empty or fails.
 * Extracts dollar lines from pasted estimate text and pairs carrier vs contractor.
 */

const SKIP_DESC =
  /^(total|subtotal|grand\s+total|tax|o&p|overhead|profit|depreciation|deductible|rcv|acv|net\s+claim|amount\s+of\s+loss|page\s+\d+)/i;

const TRADE_KEYWORDS = [
  ["Roofing", /\b(roof|shingle|underlayment|ridge\s+vent)\b/i],
  ["Drywall", /\b(drywall|sheetrock|gypsum)\b/i],
  ["Painting", /\b(paint|primer|seal(er)?)\b/i],
  ["Flooring", /\b(carpet|vinyl|laminate|hardwood|floor(ing)?)\b/i],
  ["Plumbing", /\b(plumb|toilet|faucet|pipe|water\s+heater)\b/i],
  ["Electrical", /\b(electric|outlet|wiring|panel)\b/i],
  ["HVAC", /\b(hvac|furnace|a\/c|air\s+condition)\b/i],
  ["Mitigation", /\b(mitigation|dehumid|dry\s+out|moisture|anti-?microbial)\b/i],
  ["Demolition", /\b(demo|demolition|tear\s+out|remove)\b/i],
  ["General", /.*/],
];

function inferTrade(description) {
  for (const [name, rx] of TRADE_KEYWORDS) {
    if (name !== "General" && rx.test(description)) return name;
  }
  return "General";
}

function parseAmount(str) {
  const n = parseFloat(String(str || "").replace(/[$,]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

function normalizeDesc(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function descTokens(s) {
  const n = normalizeDesc(s);
  return n.split(" ").filter((w) => w.length > 2 && !/^\d+$/.test(w));
}

function tokenOverlap(a, b) {
  const ta = new Set(descTokens(a));
  const tb = new Set(descTokens(b));
  if (!ta.size || !tb.size) return 0;
  let hit = 0;
  for (const t of ta) {
    if (tb.has(t)) hit++;
  }
  return hit / Math.max(ta.size, tb.size);
}

function extractDollarLineItems(text) {
  const items = [];
  const lines = String(text || "").split(/\r?\n/);
  let currentRoom = "";

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.length < 6) continue;

    if (
      /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*\s*[-–—]?\s*\d/.test(line) ||
      /^(kitchen|living|bedroom|bathroom|garage|hallway|roof)\b/i.test(line)
    ) {
      if (line.length < 80 && !/\$\s*[\d,]+/.test(line)) {
        currentRoom = line.slice(0, 60);
        continue;
      }
    }

    const tradeCode = line.match(/^([A-Z]{3})\s*[-:]\s*(.+)/);
    let working = line;
    if (tradeCode) working = tradeCode[2];

    const moneyMatches = [
      ...working.matchAll(
        /(?:^|\s)\$?\s*([\d]{1,3}(?:,\d{3})*\.\d{2})(?=\s*(?:$|[A-Z]{2}\b|\s))/gi
      ),
    ];
    if (!moneyMatches.length) continue;

    let best = moneyMatches[moneyMatches.length - 1];
    let amount = parseAmount(best[1]);
    if (moneyMatches.length > 1) {
      for (const m of moneyMatches) {
        const a = parseAmount(m[1]);
        if (a > amount) {
          amount = a;
          best = m;
        }
      }
    }
    if (amount < 0.01 || amount > 50_000_000) continue;

    let desc = working.slice(0, working.indexOf(best[0])).trim();
    desc = desc.replace(/\s+\d+\.?\d*\s*(SF|LF|SY|EA|HR|CY|TON|GAL|LB)\b/gi, " ");
    desc = desc.replace(/\s+/g, " ").trim();
    if (desc.length < 6) desc = working.slice(0, 120).trim();
    if (SKIP_DESC.test(desc)) continue;
    if (desc.length < 6) continue;

    const prefix = currentRoom ? `${currentRoom}: ` : "";
    items.push({
      description: (prefix + desc).slice(0, 220),
      amount,
      trade: inferTrade(desc),
    });
  }

  const seen = new Set();
  const out = [];
  for (const it of items) {
    const key = `${normalizeDesc(it.description)}|${it.amount}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out.slice(0, 120);
}

function flagRow(carrierAmount, contractorAmount) {
  if (carrierAmount <= 0 && contractorAmount > 0) return true;
  if (carrierAmount > 0 && Math.abs(contractorAmount - carrierAmount) > 0.25 * carrierAmount) {
    return true;
  }
  return false;
}

function buildLineCompareRows(carrierItems, contractorItems) {
  const usedContractor = new Set();
  const rows = [];

  for (const c of carrierItems) {
    let bestIdx = -1;
    let bestScore = 0;
    for (let i = 0; i < contractorItems.length; i++) {
      if (usedContractor.has(i)) continue;
      const score = tokenOverlap(c.description, contractorItems[i].description);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }
    const contractor =
      bestIdx >= 0 && bestScore >= 0.2 ? contractorItems[bestIdx] : null;
    if (bestIdx >= 0 && bestScore >= 0.2) usedContractor.add(bestIdx);

    const carrierAmount = c.amount;
    const contractorAmount = contractor ? contractor.amount : 0;
    const delta = Math.round((contractorAmount - carrierAmount) * 100) / 100;
    const flagged = flagRow(carrierAmount, contractorAmount);

    rows.push({
      trade: c.trade || inferTrade(c.description),
      carrierItem: c.description,
      carrierAmount,
      contractorItem: contractor ? contractor.description : "—",
      contractorAmount,
      delta,
      flagged,
      reason: contractor
        ? flagged
          ? "Amount or scope mismatch between carrier and contractor lines."
          : "Paired from estimate text (automated match)."
        : "Listed on contractor/PA estimate but not matched on carrier side.",
    });
  }

  for (let i = 0; i < contractorItems.length; i++) {
    if (usedContractor.has(i)) continue;
    const ct = contractorItems[i];
    rows.push({
      trade: ct.trade || inferTrade(ct.description),
      carrierItem: "—",
      carrierAmount: 0,
      contractorItem: ct.description,
      contractorAmount: ct.amount,
      delta: ct.amount,
      flagged: true,
      reason: "Listed on contractor/PA estimate but not matched on carrier side.",
    });
  }

  return rows;
}

function buildReconRows(carrierItems) {
  return carrierItems.map((c) => ({
    trade: c.trade || inferTrade(c.description),
    carrierItem: c.description,
    carrierAmount: c.amount,
    contractorItem: c.description,
    contractorAmount: c.amount,
    delta: 0,
    flagged: false,
    reason: "Carrier line (reconstructed scope mode — review amounts on Step 1).",
  }));
}

function finalizeFallback(mode, lineItems) {
  let totalCarrier = 0;
  let totalContractor = 0;
  for (const r of lineItems) {
    totalCarrier += r.carrierAmount;
    totalContractor += r.contractorAmount;
  }
  return {
    mode,
    lineItems,
    totalCarrier: Math.round(totalCarrier * 100) / 100,
    totalContractor: Math.round(totalContractor * 100) / 100,
    totalDelta: Math.round((totalContractor - totalCarrier) * 100) / 100,
    comparisonSource: "fallback",
  };
}

/**
 * Build comparison from raw texts when AI output is empty.
 * @returns {object|null} Same shape as compare-estimates success body, or null.
 */
function buildFallbackComparison(mode, carrierText, contractorText) {
  const carrierItems = extractDollarLineItems(carrierText);
  if (carrierItems.length === 0) return null;

  if (mode === "LINE_COMPARE" && contractorText) {
    const contractorItems = extractDollarLineItems(contractorText);
    if (contractorItems.length === 0) {
      const recon = buildReconRows(carrierItems);
      return finalizeFallback("RECON_VS_CARRIER", recon);
    }
    const rows = buildLineCompareRows(carrierItems, contractorItems);
    if (rows.length === 0) return null;
    return finalizeFallback("LINE_COMPARE", rows);
  }

  const recon = buildReconRows(carrierItems);
  if (recon.length === 0) return null;
  return finalizeFallback("RECON_VS_CARRIER", recon);
}

function textLooksLikeEstimate(text) {
  const t = String(text || "");
  if (!t.trim()) return false;
  const dollarHits = (t.match(/\$\s*[\d,]+(?:\.\d{2})?/g) || []).length;
  if (dollarHits >= 2) return true;
  const amountHits = (t.match(/\b\d{1,3}(?:,\d{3})+\.\d{2}\b/g) || []).length;
  if (amountHits >= 4) return true;
  return /\b(DESCRIPTION|QTY|QUANTITY|REMOVE|REPLACE|RCV|ACV|LINE\s+TOTAL)\b/i.test(
    t
  );
}

module.exports = {
  buildFallbackComparison,
  textLooksLikeEstimate,
  extractDollarLineItems,
};
