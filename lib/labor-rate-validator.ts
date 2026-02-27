/**
 * LABOR RATE VALIDATION ENGINE
 * Validates labor rates against regional market standards
 * Detects undervalued and overvalued labor
 */

export interface LaborRate {
  trade: string;
  region: string;
  minRate: number;
  avgRate: number;
  maxRate: number;
  unit: string;
  effectiveDate: Date;
  source: 'BLS' | 'industry_survey' | 'market_data';
}

export interface LaborIssue {
  lineNumber: number;
  description: string;
  trade: string;
  estimateRate: number;
  marketRate: { min: number; avg: number; max: number };
  variance: number;
  variancePercentage: number;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  issue: string;
  impact: number;
}

export interface LaborAnalysis {
  totalLaborCost: number;
  laborVariance: number;
  undervaluedLabor: LaborIssue[];
  overvaluedLabor: LaborIssue[];
  laborScore: number; // 0-100
  itemsValidated: number;
  itemsSkipped: number;
}

/**
 * Regional labor rates database (sample - expand to 50+ regions)
 */
const LABOR_RATES: Record<string, Record<string, { min: number; avg: number; max: number }>> = {
  // California - San Francisco
  'CA-San Francisco': {
    'General Contractor': { min: 85, avg: 110, max: 145 },
    'Carpenter': { min: 75, avg: 95, max: 125 },
    'Electrician': { min: 85, avg: 110, max: 140 },
    'Plumber': { min: 80, avg: 105, max: 135 },
    'HVAC Technician': { min: 75, avg: 95, max: 125 },
    'Painter': { min: 55, avg: 75, max: 95 },
    'Drywall Installer': { min: 60, avg: 80, max: 105 },
    'Flooring Installer': { min: 55, avg: 75, max: 100 },
    'Roofer': { min: 65, avg: 85, max: 110 },
    'Laborer': { min: 45, avg: 60, max: 75 },
  },
  
  // Texas - Houston
  'TX-Houston': {
    'General Contractor': { min: 55, avg: 75, max: 95 },
    'Carpenter': { min: 45, avg: 65, max: 85 },
    'Electrician': { min: 55, avg: 75, max: 95 },
    'Plumber': { min: 50, avg: 70, max: 90 },
    'HVAC Technician': { min: 50, avg: 65, max: 85 },
    'Painter': { min: 35, avg: 50, max: 65 },
    'Drywall Installer': { min: 40, avg: 55, max: 70 },
    'Flooring Installer': { min: 35, avg: 50, max: 70 },
    'Roofer': { min: 45, avg: 60, max: 80 },
    'Laborer': { min: 30, avg: 40, max: 50 },
  },
  
  // Illinois - Chicago
  'IL-Chicago': {
    'General Contractor': { min: 65, avg: 85, max: 110 },
    'Carpenter': { min: 55, avg: 75, max: 95 },
    'Electrician': { min: 65, avg: 85, max: 110 },
    'Plumber': { min: 60, avg: 80, max: 105 },
    'HVAC Technician': { min: 55, avg: 75, max: 95 },
    'Painter': { min: 40, avg: 60, max: 75 },
    'Drywall Installer': { min: 45, avg: 65, max: 85 },
    'Flooring Installer': { min: 40, avg: 60, max: 80 },
    'Roofer': { min: 50, avg: 70, max: 90 },
    'Laborer': { min: 35, avg: 50, max: 65 },
  },
  
  // Florida - Miami
  'FL-Miami': {
    'General Contractor': { min: 60, avg: 80, max: 105 },
    'Carpenter': { min: 50, avg: 70, max: 90 },
    'Electrician': { min: 60, avg: 80, max: 105 },
    'Plumber': { min: 55, avg: 75, max: 95 },
    'HVAC Technician': { min: 55, avg: 70, max: 90 },
    'Painter': { min: 38, avg: 55, max: 70 },
    'Drywall Installer': { min: 42, avg: 60, max: 75 },
    'Flooring Installer': { min: 38, avg: 55, max: 75 },
    'Roofer': { min: 48, avg: 65, max: 85 },
    'Laborer': { min: 32, avg: 45, max: 58 },
  },
  
  // New York - New York City
  'NY-New York City': {
    'General Contractor': { min: 90, avg: 115, max: 150 },
    'Carpenter': { min: 80, avg: 100, max: 130 },
    'Electrician': { min: 90, avg: 115, max: 145 },
    'Plumber': { min: 85, avg: 110, max: 140 },
    'HVAC Technician': { min: 80, avg: 100, max: 130 },
    'Painter': { min: 60, avg: 80, max: 100 },
    'Drywall Installer': { min: 65, avg: 85, max: 110 },
    'Flooring Installer': { min: 60, avg: 80, max: 105 },
    'Roofer': { min: 70, avg: 90, max: 115 },
    'Laborer': { min: 50, avg: 65, max: 80 },
  },
  
  // Washington - Seattle
  'WA-Seattle': {
    'General Contractor': { min: 75, avg: 95, max: 125 },
    'Carpenter': { min: 65, avg: 85, max: 110 },
    'Electrician': { min: 75, avg: 95, max: 125 },
    'Plumber': { min: 70, avg: 90, max: 120 },
    'HVAC Technician': { min: 65, avg: 85, max: 110 },
    'Painter': { min: 48, avg: 65, max: 85 },
    'Drywall Installer': { min: 52, avg: 70, max: 90 },
    'Flooring Installer': { min: 48, avg: 65, max: 88 },
    'Roofer': { min: 58, avg: 75, max: 95 },
    'Laborer': { min: 40, avg: 55, max: 70 },
  },
  
  // Default/National Average
  'DEFAULT': {
    'General Contractor': { min: 60, avg: 80, max: 105 },
    'Carpenter': { min: 50, avg: 70, max: 90 },
    'Electrician': { min: 60, avg: 80, max: 105 },
    'Plumber': { min: 55, avg: 75, max: 95 },
    'HVAC Technician': { min: 55, avg: 70, max: 90 },
    'Painter': { min: 40, avg: 55, max: 70 },
    'Drywall Installer': { min: 45, avg: 60, max: 75 },
    'Flooring Installer': { min: 40, avg: 55, max: 75 },
    'Roofer': { min: 50, avg: 65, max: 85 },
    'Laborer': { min: 35, avg: 45, max: 60 },
  },
};

/**
 * Main labor rate validation function
 */
export async function validateLaborRates(
  lineItems: Array<{
    lineNumber: number;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
  }>,
  region: string
): Promise<LaborAnalysis> {
  
  console.log(`[LABOR] Validating labor rates for region: ${region}`);
  
  const undervaluedLabor: LaborIssue[] = [];
  const overvaluedLabor: LaborIssue[] = [];
  let totalLaborCost = 0;
  let totalLaborVariance = 0;
  let itemsValidated = 0;
  let itemsSkipped = 0;
  
  for (const item of lineItems) {
    // Detect if line item is labor
    const laborInfo = detectLaborItem(item);
    
    if (!laborInfo) {
      itemsSkipped++;
      continue;
    }
    
    totalLaborCost += item.total;
    itemsValidated++;
    
    // Look up market rates
    const marketRates = lookupLaborRate(laborInfo.trade, region);
    
    if (!marketRates) {
      console.log(`[LABOR] No market data for trade: ${laborInfo.trade} in ${region}`);
      continue;
    }
    
    // Calculate hourly rate from item
    const estimateRate = calculateHourlyRate(item, laborInfo);
    
    // Calculate variance
    const variance = estimateRate - marketRates.avg;
    const variancePercentage = (variance / marketRates.avg) * 100;
    
    totalLaborVariance += variance * item.quantity;
    
    // Flag if >20% below market (underpayment)
    if (variancePercentage < -20) {
      undervaluedLabor.push({
        lineNumber: item.lineNumber,
        description: item.description,
        trade: laborInfo.trade,
        estimateRate,
        marketRate: marketRates,
        variance,
        variancePercentage,
        severity: variancePercentage < -40 ? 'CRITICAL' : 'HIGH',
        issue: `Labor rate ${Math.abs(variancePercentage).toFixed(1)}% below market average`,
        impact: Math.abs(variance) * item.quantity,
      });
      
      console.log(`[LABOR] Undervalued labor detected - Line ${item.lineNumber}: ${estimateRate.toFixed(2)}/hr (market avg: ${marketRates.avg}/hr)`);
    }
    
    // Flag if >30% above market (potential fraud/error)
    if (variancePercentage > 30) {
      overvaluedLabor.push({
        lineNumber: item.lineNumber,
        description: item.description,
        trade: laborInfo.trade,
        estimateRate,
        marketRate: marketRates,
        variance,
        variancePercentage,
        severity: variancePercentage > 50 ? 'CRITICAL' : 'MODERATE',
        issue: `Labor rate ${variancePercentage.toFixed(1)}% above market average`,
        impact: variance * item.quantity,
      });
      
      console.log(`[LABOR] Overvalued labor detected - Line ${item.lineNumber}: ${estimateRate.toFixed(2)}/hr (market avg: ${marketRates.avg}/hr)`);
    }
  }
  
  // Calculate labor score (0-100)
  const laborScore = calculateLaborScore(
    undervaluedLabor,
    overvaluedLabor,
    totalLaborVariance,
    totalLaborCost
  );
  
  console.log(`[LABOR] Validation complete:`);
  console.log(`[LABOR] - Items validated: ${itemsValidated}`);
  console.log(`[LABOR] - Total labor cost: $${totalLaborCost.toFixed(2)}`);
  console.log(`[LABOR] - Labor variance: $${totalLaborVariance.toFixed(2)}`);
  console.log(`[LABOR] - Undervalued items: ${undervaluedLabor.length}`);
  console.log(`[LABOR] - Overvalued items: ${overvaluedLabor.length}`);
  console.log(`[LABOR] - Labor score: ${laborScore}/100`);
  
  return {
    totalLaborCost,
    laborVariance: totalLaborVariance,
    undervaluedLabor,
    overvaluedLabor,
    laborScore,
    itemsValidated,
    itemsSkipped,
  };
}

/**
 * Detect if line item is labor and identify trade
 */
function detectLaborItem(item: {
  description: string;
  unit: string;
}): { isLabor: boolean; trade: string } | null {
  
  const descLower = item.description.toLowerCase();
  const unitUpper = item.unit.toUpperCase();
  
  // Labor indicators
  const laborKeywords = [
    'labor', 'installation', 'install', 'remove', 'replace',
    'repair', 'service', 'work', 'crew', 'technician', 'contractor',
  ];
  
  const hasLaborKeyword = laborKeywords.some(keyword => descLower.includes(keyword));
  const isHourlyUnit = unitUpper === 'HR' || unitUpper === 'HOUR';
  
  if (!hasLaborKeyword && !isHourlyUnit) {
    return null;
  }
  
  // Identify trade
  let trade = 'Laborer'; // Default
  
  if (descLower.includes('general contractor') || descLower.includes('gc')) {
    trade = 'General Contractor';
  } else if (descLower.includes('carpenter') || descLower.includes('framing')) {
    trade = 'Carpenter';
  } else if (descLower.includes('electric')) {
    trade = 'Electrician';
  } else if (descLower.includes('plumb')) {
    trade = 'Plumber';
  } else if (descLower.includes('hvac') || descLower.includes('heating') || descLower.includes('cooling')) {
    trade = 'HVAC Technician';
  } else if (descLower.includes('paint')) {
    trade = 'Painter';
  } else if (descLower.includes('drywall') || descLower.includes('sheetrock')) {
    trade = 'Drywall Installer';
  } else if (descLower.includes('floor') || descLower.includes('carpet') || descLower.includes('tile')) {
    trade = 'Flooring Installer';
  } else if (descLower.includes('roof')) {
    trade = 'Roofer';
  }
  
  return { isLabor: true, trade };
}

/**
 * Calculate hourly rate from line item
 */
function calculateHourlyRate(
  item: { quantity: number; unit: string; unitPrice: number; total: number },
  laborInfo: { trade: string }
): number {
  
  const unitUpper = item.unit.toUpperCase();
  
  // If already hourly, return unit price
  if (unitUpper === 'HR' || unitUpper === 'HOUR') {
    return item.unitPrice;
  }
  
  // Estimate hours based on trade and quantity
  // This is a rough estimation - in production, use more sophisticated logic
  const estimatedHours = estimateHours(item.quantity, item.unit, laborInfo.trade);
  
  if (estimatedHours > 0) {
    return item.total / estimatedHours;
  }
  
  // Fallback: assume unit price is hourly
  return item.unitPrice;
}

/**
 * Estimate labor hours for a line item (rough estimation)
 */
function estimateHours(quantity: number, unit: string, trade: string): number {
  const unitUpper = unit.toUpperCase();
  
  // Production rates (units per hour) by trade
  const productionRates: Record<string, Record<string, number>> = {
    'Drywall Installer': {
      'SF': 50, // 50 SF per hour
    },
    'Painter': {
      'SF': 100, // 100 SF per hour
    },
    'Flooring Installer': {
      'SF': 40, // 40 SF per hour
    },
    'Roofer': {
      'SQ': 0.5, // 2 hours per square
      'SF': 50, // 50 SF per hour
    },
    'Carpenter': {
      'LF': 10, // 10 LF per hour
    },
  };
  
  if (productionRates[trade] && productionRates[trade][unitUpper]) {
    return quantity / productionRates[trade][unitUpper];
  }
  
  return 0;
}

/**
 * Look up labor rate for trade and region
 */
function lookupLaborRate(
  trade: string,
  region: string
): { min: number; avg: number; max: number } | null {
  
  // Try exact region match
  if (LABOR_RATES[region] && LABOR_RATES[region][trade]) {
    return LABOR_RATES[region][trade];
  }
  
  // Try state match
  const state = region.split('-')[0];
  for (const [regionKey, rates] of Object.entries(LABOR_RATES)) {
    if (regionKey.startsWith(state + '-') && rates[trade]) {
      return rates[trade];
    }
  }
  
  // Default rates
  if (LABOR_RATES['DEFAULT'][trade]) {
    return LABOR_RATES['DEFAULT'][trade];
  }
  
  return null;
}

/**
 * Calculate labor score (0-100)
 */
function calculateLaborScore(
  undervaluedLabor: LaborIssue[],
  overvaluedLabor: LaborIssue[],
  totalVariance: number,
  totalCost: number
): number {
  
  let score = 100;
  
  // Deduct for undervalued labor (more serious)
  score -= undervaluedLabor.filter(l => l.severity === 'CRITICAL').length * 15;
  score -= undervaluedLabor.filter(l => l.severity === 'HIGH').length * 10;
  
  // Deduct for overvalued labor (less serious, could be error)
  score -= overvaluedLabor.filter(l => l.severity === 'CRITICAL').length * 10;
  score -= overvaluedLabor.filter(l => l.severity === 'MODERATE').length * 5;
  
  // Deduct for high overall variance
  const variancePercentage = totalCost > 0 ? Math.abs(totalVariance / totalCost) * 100 : 0;
  if (variancePercentage > 30) {
    score -= 10;
  } else if (variancePercentage > 20) {
    score -= 5;
  }
  
  return Math.max(0, score);
}

/**
 * Generate labor validation summary
 */
export function generateLaborSummary(result: LaborAnalysis): string {
  let summary = `LABOR RATE VALIDATION SUMMARY\n`;
  summary += `${'='.repeat(60)}\n\n`;
  
  summary += `OVERALL ANALYSIS:\n`;
  summary += `- Total labor cost: $${result.totalLaborCost.toFixed(2)}\n`;
  summary += `- Labor variance: $${result.laborVariance.toFixed(2)}\n`;
  summary += `- Labor score: ${result.laborScore}/100\n`;
  summary += `- Items validated: ${result.itemsValidated}\n`;
  summary += `- Items skipped: ${result.itemsSkipped}\n\n`;
  
  if (result.undervaluedLabor.length > 0) {
    summary += `UNDERVALUED LABOR (${result.undervaluedLabor.length} items):\n`;
    summary += `These items have labor rates below market standards:\n\n`;
    
    for (const issue of result.undervaluedLabor) {
      summary += `- Line ${issue.lineNumber}: ${issue.description}\n`;
      summary += `  Trade: ${issue.trade}\n`;
      summary += `  Estimate rate: $${issue.estimateRate.toFixed(2)}/hr\n`;
      summary += `  Market average: $${issue.marketRate.avg.toFixed(2)}/hr (range: $${issue.marketRate.min}-$${issue.marketRate.max})\n`;
      summary += `  Variance: ${issue.variancePercentage.toFixed(1)}%\n`;
      summary += `  Impact: $${issue.impact.toFixed(2)}\n`;
      summary += `  Severity: ${issue.severity}\n\n`;
    }
  }
  
  if (result.overvaluedLabor.length > 0) {
    summary += `OVERVALUED LABOR (${result.overvaluedLabor.length} items):\n`;
    summary += `These items have labor rates above market standards:\n\n`;
    
    for (const issue of result.overvaluedLabor) {
      summary += `- Line ${issue.lineNumber}: ${issue.description}\n`;
      summary += `  Trade: ${issue.trade}\n`;
      summary += `  Estimate rate: $${issue.estimateRate.toFixed(2)}/hr\n`;
      summary += `  Market average: $${issue.marketRate.avg.toFixed(2)}/hr (range: $${issue.marketRate.min}-$${issue.marketRate.max})\n`;
      summary += `  Variance: ${issue.variancePercentage.toFixed(1)}%\n`;
      summary += `  Impact: $${issue.impact.toFixed(2)}\n`;
      summary += `  Severity: ${issue.severity}\n\n`;
    }
  }
  
  if (result.undervaluedLabor.length === 0 && result.overvaluedLabor.length === 0) {
    summary += `✓ No labor rate issues detected\n`;
    summary += `All labor rates appear to be within market standards.\n`;
  }
  
  return summary;
}

/**
 * Get supported regions
 */
export function getSupportedRegions(): string[] {
  return Object.keys(LABOR_RATES).filter(key => key !== 'DEFAULT');
}

/**
 * Get supported trades
 */
export function getSupportedTrades(): string[] {
  return Object.keys(LABOR_RATES['DEFAULT']);
}

/**
 * Add labor rate data (for future expansion)
 */
export function addLaborRate(region: string, trade: string, rates: { min: number; avg: number; max: number }): void {
  if (!LABOR_RATES[region]) {
    LABOR_RATES[region] = {};
  }
  LABOR_RATES[region][trade] = rates;
}
