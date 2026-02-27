/**
 * PRICING VALIDATION ENGINE
 * Validates estimate pricing against market data (Xactimate, RSMeans, regional surveys)
 * Detects overpricing and underpricing with regional cost adjustments
 */

import { normalizeQuantity } from './unit-normalizer';

export interface PricingDatabase {
  tradeCode: string;
  itemCode?: string;
  description: string;
  unit: string;
  basePrice: number;
  priceSource: 'xactimate' | 'rsmeans' | 'market';
  region: string;
  effectiveDate: Date;
  metadata?: Record<string, any>;
}

export interface RegionalMultiplier {
  region: string;
  state: string;
  city?: string;
  multiplier: number;
  effectiveDate: Date;
}

export interface LineItemVariance {
  lineNumber: number;
  description: string;
  estimatePrice: number;
  marketPrice: number;
  variance: number;
  variancePercentage: number;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  explanation: string;
  priceSource: string;
}

export interface PricingValidationResult {
  totalVariance: number;
  variancePercentage: number;
  overpriced: LineItemVariance[];
  underpriced: LineItemVariance[];
  marketComparison: {
    estimateTotal: number;
    marketTotal: number;
    variance: number;
  };
  regionalMultiplier: number;
  confidence: number; // 0-100
  itemsValidated: number;
  itemsSkipped: number;
}

/**
 * Regional cost multipliers (sample data - expand to 50+ regions)
 */
const REGIONAL_MULTIPLIERS: Record<string, number> = {
  // California
  'CA-San Francisco': 1.45,
  'CA-Los Angeles': 1.38,
  'CA-San Diego': 1.32,
  'CA-Sacramento': 1.25,
  
  // New York
  'NY-New York City': 1.42,
  'NY-Buffalo': 1.12,
  'NY-Albany': 1.15,
  
  // Texas
  'TX-Houston': 0.95,
  'TX-Dallas': 0.98,
  'TX-Austin': 1.02,
  'TX-San Antonio': 0.92,
  
  // Illinois
  'IL-Chicago': 1.15,
  'IL-Springfield': 0.98,
  
  // Florida
  'FL-Miami': 1.08,
  'FL-Orlando': 1.02,
  'FL-Tampa': 1.00,
  'FL-Jacksonville': 0.96,
  
  // Other major cities
  'WA-Seattle': 1.28,
  'CO-Denver': 1.12,
  'AZ-Phoenix': 0.98,
  'GA-Atlanta': 1.05,
  'NC-Charlotte': 0.96,
  'TN-Nashville': 0.94,
  'OR-Portland': 1.18,
  'NV-Las Vegas': 1.05,
  'MA-Boston': 1.35,
  'PA-Philadelphia': 1.18,
  
  // Default
  'DEFAULT': 1.00,
};

/**
 * Base pricing database (sample data - expand to 1000+ items)
 */
const BASE_PRICING_DATABASE: Record<string, PricingDatabase> = {
  // Drywall
  'DRY-REMOVE': {
    tradeCode: 'DRY',
    itemCode: 'DRY REM',
    description: 'Remove drywall',
    unit: 'SF',
    basePrice: 1.85,
    priceSource: 'xactimate',
    region: 'NATIONAL',
    effectiveDate: new Date('2026-01-01'),
  },
  'DRY-INSTALL': {
    tradeCode: 'DRY',
    itemCode: 'DRY HANG',
    description: 'Install drywall',
    unit: 'SF',
    basePrice: 2.50,
    priceSource: 'xactimate',
    region: 'NATIONAL',
    effectiveDate: new Date('2026-01-01'),
  },
  'DRY-FINISH': {
    tradeCode: 'DRY',
    itemCode: 'DRY FIN',
    description: 'Finish drywall (tape, mud, sand)',
    unit: 'SF',
    basePrice: 1.75,
    priceSource: 'xactimate',
    region: 'NATIONAL',
    effectiveDate: new Date('2026-01-01'),
  },
  
  // Painting
  'PNT-INTERIOR': {
    tradeCode: 'PNT',
    itemCode: 'PNT INT',
    description: 'Paint interior walls',
    unit: 'SF',
    basePrice: 1.25,
    priceSource: 'xactimate',
    region: 'NATIONAL',
    effectiveDate: new Date('2026-01-01'),
  },
  'PNT-CEILING': {
    tradeCode: 'PNT',
    itemCode: 'PNT CEIL',
    description: 'Paint ceiling',
    unit: 'SF',
    basePrice: 1.35,
    priceSource: 'xactimate',
    region: 'NATIONAL',
    effectiveDate: new Date('2026-01-01'),
  },
  'PNT-TRIM': {
    tradeCode: 'PNT',
    itemCode: 'PNT TRM',
    description: 'Paint trim',
    unit: 'LF',
    basePrice: 2.50,
    priceSource: 'xactimate',
    region: 'NATIONAL',
    effectiveDate: new Date('2026-01-01'),
  },
  
  // Flooring
  'FLR-CARPET-REMOVE': {
    tradeCode: 'FLR',
    itemCode: 'FLR REM CRP',
    description: 'Remove carpet and pad',
    unit: 'SF',
    basePrice: 0.95,
    priceSource: 'xactimate',
    region: 'NATIONAL',
    effectiveDate: new Date('2026-01-01'),
  },
  'FLR-CARPET-INSTALL': {
    tradeCode: 'FLR',
    itemCode: 'FLR CRP',
    description: 'Install carpet and pad',
    unit: 'SF',
    basePrice: 4.50,
    priceSource: 'xactimate',
    region: 'NATIONAL',
    effectiveDate: new Date('2026-01-01'),
  },
  'FLR-VINYL-REMOVE': {
    tradeCode: 'FLR',
    itemCode: 'FLR REM VNL',
    description: 'Remove vinyl flooring',
    unit: 'SF',
    basePrice: 0.75,
    priceSource: 'xactimate',
    region: 'NATIONAL',
    effectiveDate: new Date('2026-01-01'),
  },
  'FLR-VINYL-INSTALL': {
    tradeCode: 'FLR',
    itemCode: 'FLR VNL',
    description: 'Install vinyl flooring',
    unit: 'SF',
    basePrice: 5.25,
    priceSource: 'xactimate',
    region: 'NATIONAL',
    effectiveDate: new Date('2026-01-01'),
  },
  
  // Roofing
  'RFG-SHINGLES-REMOVE': {
    tradeCode: 'RFG',
    itemCode: 'RFG REM',
    description: 'Remove asphalt shingles',
    unit: 'SQ',
    basePrice: 125.00,
    priceSource: 'xactimate',
    region: 'NATIONAL',
    effectiveDate: new Date('2026-01-01'),
  },
  'RFG-SHINGLES-INSTALL': {
    tradeCode: 'RFG',
    itemCode: 'RFG SHNG',
    description: 'Install asphalt shingles',
    unit: 'SQ',
    basePrice: 350.00,
    priceSource: 'xactimate',
    region: 'NATIONAL',
    effectiveDate: new Date('2026-01-01'),
  },
  
  // Demolition
  'DEM-GENERAL': {
    tradeCode: 'DEM',
    itemCode: 'DEM GEN',
    description: 'General demolition',
    unit: 'HR',
    basePrice: 75.00,
    priceSource: 'market',
    region: 'NATIONAL',
    effectiveDate: new Date('2026-01-01'),
  },
  'DEM-DUMPSTER': {
    tradeCode: 'DEM',
    itemCode: 'DEM DUMP',
    description: 'Dumpster rental',
    unit: 'EA',
    basePrice: 450.00,
    priceSource: 'market',
    region: 'NATIONAL',
    effectiveDate: new Date('2026-01-01'),
  },
  
  // Insulation
  'INS-BATT': {
    tradeCode: 'INS',
    itemCode: 'INS BATT',
    description: 'Install batt insulation R-19',
    unit: 'SF',
    basePrice: 1.25,
    priceSource: 'xactimate',
    region: 'NATIONAL',
    effectiveDate: new Date('2026-01-01'),
  },
  
  // Trim
  'TRM-BASEBOARD': {
    tradeCode: 'TRM',
    itemCode: 'TRM BASE',
    description: 'Install baseboard trim',
    unit: 'LF',
    basePrice: 4.50,
    priceSource: 'xactimate',
    region: 'NATIONAL',
    effectiveDate: new Date('2026-01-01'),
  },
};

/**
 * Main pricing validation function
 */
export async function validatePricing(
  lineItems: Array<{
    lineNumber: number;
    tradeCode: string;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
  }>,
  region: string
): Promise<PricingValidationResult> {
  
  console.log(`[PRICING] Validating ${lineItems.length} line items for region: ${region}`);
  
  const overpriced: LineItemVariance[] = [];
  const underpriced: LineItemVariance[] = [];
  let totalVariance = 0;
  let estimateTotal = 0;
  let marketTotal = 0;
  let itemsValidated = 0;
  let itemsSkipped = 0;
  
  // Get regional multiplier
  const multiplier = getRegionalMultiplier(region);
  console.log(`[PRICING] Regional multiplier: ${multiplier}`);
  
  for (const item of lineItems) {
    estimateTotal += item.total;
    
    // Look up market price
    const marketPriceData = lookupMarketPrice(item.tradeCode, item.description, item.unit);
    
    if (!marketPriceData) {
      console.log(`[PRICING] No market data for: ${item.description}`);
      itemsSkipped++;
      marketTotal += item.total; // Assume estimate is correct if no data
      continue;
    }
    
    itemsValidated++;
    
    // Apply regional multiplier
    const adjustedMarketPrice = marketPriceData.basePrice * multiplier;
    const marketItemTotal = adjustedMarketPrice * item.quantity;
    marketTotal += marketItemTotal;
    
    // Calculate variance
    const variance = item.unitPrice - adjustedMarketPrice;
    const variancePercentage = (variance / adjustedMarketPrice) * 100;
    const totalVarianceAmount = variance * item.quantity;
    
    totalVariance += totalVarianceAmount;
    
    // Flag if >20% variance
    if (Math.abs(variancePercentage) > 20) {
      const severity = determineSeverity(Math.abs(variancePercentage));
      
      const issue: LineItemVariance = {
        lineNumber: item.lineNumber,
        description: item.description,
        estimatePrice: item.unitPrice,
        marketPrice: adjustedMarketPrice,
        variance,
        variancePercentage,
        severity,
        explanation: variancePercentage > 0 
          ? `Priced ${Math.abs(variancePercentage).toFixed(1)}% above market rate (${marketPriceData.priceSource})`
          : `Priced ${Math.abs(variancePercentage).toFixed(1)}% below market rate (${marketPriceData.priceSource})`,
        priceSource: marketPriceData.priceSource,
      };
      
      if (variancePercentage > 0) {
        overpriced.push(issue);
      } else {
        underpriced.push(issue);
      }
    }
  }
  
  // Calculate overall variance percentage
  const overallVariancePercentage = estimateTotal > 0 
    ? (totalVariance / estimateTotal) * 100 
    : 0;
  
  // Calculate confidence based on validation coverage
  const confidence = Math.round((itemsValidated / lineItems.length) * 100);
  
  console.log(`[PRICING] Validation complete:`);
  console.log(`[PRICING] - Items validated: ${itemsValidated}/${lineItems.length}`);
  console.log(`[PRICING] - Total variance: $${totalVariance.toFixed(2)} (${overallVariancePercentage.toFixed(1)}%)`);
  console.log(`[PRICING] - Overpriced items: ${overpriced.length}`);
  console.log(`[PRICING] - Underpriced items: ${underpriced.length}`);
  
  return {
    totalVariance,
    variancePercentage: overallVariancePercentage,
    overpriced,
    underpriced,
    marketComparison: {
      estimateTotal,
      marketTotal,
      variance: totalVariance,
    },
    regionalMultiplier: multiplier,
    confidence,
    itemsValidated,
    itemsSkipped,
  };
}

/**
 * Get regional cost multiplier
 */
function getRegionalMultiplier(region: string): number {
  // Try exact match
  if (REGIONAL_MULTIPLIERS[region]) {
    return REGIONAL_MULTIPLIERS[region];
  }
  
  // Try state match (e.g., "CA" from "CA-San Francisco")
  const state = region.split('-')[0];
  const stateMatches = Object.entries(REGIONAL_MULTIPLIERS)
    .filter(([key]) => key.startsWith(state + '-'));
  
  if (stateMatches.length > 0) {
    // Return average of state matches
    const avg = stateMatches.reduce((sum, [, multiplier]) => sum + multiplier, 0) / stateMatches.length;
    return avg;
  }
  
  // Default multiplier
  return REGIONAL_MULTIPLIERS['DEFAULT'];
}

/**
 * Look up market price for line item
 */
function lookupMarketPrice(
  tradeCode: string,
  description: string,
  unit: string
): PricingDatabase | null {
  
  const descLower = description.toLowerCase();
  
  // Try exact item code match first
  for (const [key, priceData] of Object.entries(BASE_PRICING_DATABASE)) {
    if (priceData.tradeCode === tradeCode && priceData.unit.toUpperCase() === unit.toUpperCase()) {
      // Check description match
      const priceDescLower = priceData.description.toLowerCase();
      
      // Exact match
      if (descLower === priceDescLower) {
        return priceData;
      }
      
      // Partial match (contains key words)
      const keywords = priceDescLower.split(' ');
      const matchCount = keywords.filter(keyword => descLower.includes(keyword)).length;
      
      if (matchCount >= keywords.length * 0.7) {
        return priceData;
      }
    }
  }
  
  // Try fuzzy match by trade code only
  for (const [key, priceData] of Object.entries(BASE_PRICING_DATABASE)) {
    if (priceData.tradeCode === tradeCode) {
      const similarity = calculateDescriptionSimilarity(descLower, priceData.description.toLowerCase());
      
      if (similarity > 0.6) {
        return priceData;
      }
    }
  }
  
  return null;
}

/**
 * Calculate description similarity
 */
function calculateDescriptionSimilarity(desc1: string, desc2: string): number {
  const words1 = desc1.split(/\s+/);
  const words2 = desc2.split(/\s+/);
  
  const commonWords = words1.filter(word => words2.includes(word));
  
  return commonWords.length / Math.max(words1.length, words2.length);
}

/**
 * Determine severity based on variance percentage
 */
function determineSeverity(variancePercentage: number): 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' {
  if (variancePercentage > 50) return 'CRITICAL';
  if (variancePercentage > 35) return 'HIGH';
  if (variancePercentage > 20) return 'MODERATE';
  return 'LOW';
}

/**
 * Generate pricing validation summary
 */
export function generatePricingSummary(result: PricingValidationResult): string {
  let summary = `PRICING VALIDATION SUMMARY\n`;
  summary += `${'='.repeat(60)}\n\n`;
  
  summary += `OVERALL ANALYSIS:\n`;
  summary += `- Estimate total: $${result.marketComparison.estimateTotal.toFixed(2)}\n`;
  summary += `- Market total: $${result.marketComparison.marketTotal.toFixed(2)}\n`;
  summary += `- Total variance: $${result.totalVariance.toFixed(2)} (${result.variancePercentage.toFixed(1)}%)\n`;
  summary += `- Regional multiplier: ${result.regionalMultiplier.toFixed(2)}x\n`;
  summary += `- Confidence: ${result.confidence}%\n`;
  summary += `- Items validated: ${result.itemsValidated}\n`;
  summary += `- Items skipped: ${result.itemsSkipped}\n\n`;
  
  if (result.overpriced.length > 0) {
    summary += `OVERPRICED ITEMS (${result.overpriced.length}):\n`;
    for (const item of result.overpriced.slice(0, 10)) {
      summary += `- Line ${item.lineNumber}: ${item.description}\n`;
      summary += `  Estimate: $${item.estimatePrice.toFixed(2)}, Market: $${item.marketPrice.toFixed(2)}\n`;
      summary += `  Variance: $${item.variance.toFixed(2)} (${item.variancePercentage.toFixed(1)}%) - ${item.severity}\n`;
    }
    if (result.overpriced.length > 10) {
      summary += `... and ${result.overpriced.length - 10} more\n`;
    }
    summary += `\n`;
  }
  
  if (result.underpriced.length > 0) {
    summary += `UNDERPRICED ITEMS (${result.underpriced.length}):\n`;
    for (const item of result.underpriced.slice(0, 10)) {
      summary += `- Line ${item.lineNumber}: ${item.description}\n`;
      summary += `  Estimate: $${item.estimatePrice.toFixed(2)}, Market: $${item.marketPrice.toFixed(2)}\n`;
      summary += `  Variance: $${item.variance.toFixed(2)} (${item.variancePercentage.toFixed(1)}%) - ${item.severity}\n`;
    }
    if (result.underpriced.length > 10) {
      summary += `... and ${result.underpriced.length - 10} more\n`;
    }
  }
  
  return summary;
}

/**
 * Add pricing data to database (for future expansion)
 */
export function addPricingData(data: PricingDatabase): void {
  const key = `${data.tradeCode}-${data.itemCode || 'GENERIC'}`;
  BASE_PRICING_DATABASE[key] = data;
}

/**
 * Get all pricing data for a trade
 */
export function getPricingDataByTrade(tradeCode: string): PricingDatabase[] {
  return Object.values(BASE_PRICING_DATABASE).filter(data => data.tradeCode === tradeCode);
}

/**
 * Get supported regions
 */
export function getSupportedRegions(): string[] {
  return Object.keys(REGIONAL_MULTIPLIERS).filter(key => key !== 'DEFAULT');
}
