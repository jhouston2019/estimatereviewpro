/**
 * Keeps public/*.html single-review pricing in sync with lib/billing/marketingPlanPricing.ts
 * Run automatically before `next build` via package.json.
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const marketingPath = join(root, "lib", "billing", "marketingPlanPricing.ts");

function parseMarketingSingle() {
  const src = readFileSync(marketingPath, "utf8");
  const block = src.match(/single:\s*\{[\s\S]*?\},/);
  if (!block) {
    throw new Error("Could not parse single plan in marketingPlanPricing.ts");
  }
  const displayMatch = block[0].match(/displayAmount:\s*"([^"]+)"/);
  if (!displayMatch) {
    throw new Error("Could not parse single.displayAmount");
  }
  const displayAmount = displayMatch[1];
  const note = `${displayAmount} one-time • 1 estimate review • No subscription`;
  return { displayAmount, note };
}

const LEGACY_SINGLE = /\$149\b/g;
const PRICING_NOTE =
  /<p class="pricing-note">[^<]*<\/p>/g;
const PRICING_H3 = /<h3>\$[\d,]+<\/h3>/g;
const INLINE_PRICE_H3 =
  /<h3 style="font-size: 48px;[^"]*margin: 0;">\$[\d,]+<\/h3>/g;

function syncFile(filePath, { displayAmount, note }) {
  let html = readFileSync(filePath, "utf8");
  const before = html;

  html = html.replace(LEGACY_SINGLE, displayAmount);

  if (filePath.endsWith("estimate-review.html")) {
    html = html.replace(PRICING_NOTE, `<p class="pricing-note">${note}</p>`);
    html = html.replace(PRICING_H3, `<h3>${displayAmount}</h3>`);
  }

  html = html.replace(INLINE_PRICE_H3, (match) =>
    match.replace(/\$[\d,]+/, displayAmount)
  );

  if (html !== before) {
    writeFileSync(filePath, html, "utf8");
    console.log(`[sync-static-html-pricing] updated ${filePath}`);
  }
}

function main() {
  const { displayAmount, note } = parseMarketingSingle();
  const publicDir = join(root, "public");
  const htmlFiles = readdirSync(publicDir).filter((f) => f.endsWith(".html"));

  for (const file of htmlFiles) {
    syncFile(join(publicDir, file), { displayAmount, note });
  }

  console.log(
    `[sync-static-html-pricing] single review display: ${displayAmount}`
  );
}

main();
