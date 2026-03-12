/**
 * ESTIMATE MANIPULATION ENGINE
 * Detects common carrier estimate manipulation tactics
 * Three detection types: Quantity suppression, Labor suppression, Line item fragmentation
 */

import { StandardizedEstimate, StandardizedLineItem } from '../../types/claim-engine';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabase && supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

export interface QuantitySuppression {
  item: string;
  lineNumber: number;
  estimatedQuantity: number;
  expectedQuantity: number;
  suppressionPercentage: number;
  financialImpact: number;
}

export interface LaborSuppression {
  item: string;
  lineNumber: number;
  estimateRate: number;
  regionalRate: number;
  suppressionPercentage: number;
  financialImpact: number;
  tradeType: string;
}

export interface LineItemFragmentation {
  trade: string;
  fragmentedItems: string[];
  lineNumbers: number[];
  reason: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ManipulationResult {
  quantitySuppressions: QuantitySuppression[];
  laborSuppressions: LaborSuppression[];
  fragmentations: LineItemFragmentation[];
  totalFinancialImpact: number;
  manipulationScore: number;
  summary: string;
}

/**
 * Detect quantity suppression
 * Compares estimate quantities against expected geometry
 */
function detectQuantitySuppression(
  lineItems: StandardizedLineItem[]
): QuantitySuppression[] {
  const suppressions: QuantitySuppression[] = [];
  
  // Roofing area analysis
  const roofingItems = lineItems.filter(item => 
    item.description.toLowerCase().includes('roof') ||
    item.description.toLowerCase().includes('shingle')
  );
  
  for (const item of roofingItems) {
    // Simple heuristic: typical roof is 28-35 squares
    // If significantly lower, flag it
    if (item.unit.toLowerCase().includes('sq') && item.quantity < 20) {
      const expectedQuantity = 28; // Conservative estimate
      const suppressionPct = ((expectedQuantity - item.quantity) / expectedQuantity) * 100;
      
      if (suppressionPct > 20) {
        suppressions.push({
          item: item.description,
          lineNumber: item.lineNumber,
          estimatedQuantity: item.quantity,
          expectedQuantity,
          suppressionPercentage: suppressionPct,
          financialImpact: (expectedQuantity - item.quantity) * item.unitPrice,
        });
      }
    }
  }
  
  // Drywall area analysis
  const drywallItems = lineItems.filter(item => 
    item.description.toLowerCase().includes('drywall')
  );
  
  for (const item of drywallItems) {
    // Typical room: 400-600 SF of drywall
    if (item.unit.toLowerCase().includes('sf') && item.quantity < 300) {
      const expectedQuantity = 450;
      const suppressionPct = ((expectedQuantity - item.quantity) / expectedQuantity) * 100;
      
      if (suppressionPct > 25) {
        suppressions.push({
          item: item.description,
          lineNumber: item.lineNumber,
          estimatedQuantity: item.quantity,
          expectedQuantity,
          suppressionPercentage: suppressionPct,
          financialImpact: (expectedQuantity - item.quantity) * item.unitPrice,
        });
      }
    }
  }
  
  return suppressions;
}

/**
 * Detect labor rate suppression
 */
async function detectLaborSuppression(
  lineItems: StandardizedLineItem[],
  region: string
): Promise<LaborSuppression[]> {
  const suppressions: LaborSuppression[] = [];
  const client = getSupabaseClient();
  
  if (!client) {
    return suppressions;
  }
  
  try {
    // Get regional labor rates
    const { data: laborRates } = await (client as any)
      .from('labor_rates')
      .select('*')
      .eq('region', region);
    
    if (!laborRates || laborRates.length === 0) {
      return suppressions;
    }
    
    // Check labor items
    const laborItems = lineItems.filter(item => 
      item.description.toLowerCase().includes('labor') ||
      item.description.toLowerCase().includes('install') ||
      item.unit.toLowerCase().includes('hr')
    );
    
    for (const item of laborItems) {
      // Determine trade type
      const tradeType = determineTradeType(item.description);
      
      // Find matching labor rate
      const matchingRate = laborRates.find((rate: any) => 
        rate.trade.toLowerCase() === tradeType.toLowerCase()
      );
      
      if (matchingRate) {
        const estimateRate = item.unitPrice;
        const regionalRate = matchingRate.hourly_rate;
        const suppressionPct = ((regionalRate - estimateRate) / regionalRate) * 100;
        
        if (suppressionPct > 15) {
          suppressions.push({
            item: item.description,
            lineNumber: item.lineNumber,
            estimateRate,
            regionalRate,
            suppressionPercentage: suppressionPct,
            financialImpact: (regionalRate - estimateRate) * item.quantity,
            tradeType,
          });
        }
      }
    }
    
  } catch (error) {
    console.error('[MANIPULATION] Error detecting labor suppression:', error);
  }
  
  return suppressions;
}

/**
 * Determine trade type from description
 */
function determineTradeType(description: string): string {
  const desc = description.toLowerCase();
  
  if (desc.includes('roof')) return 'Roofing';
  if (desc.includes('drywall')) return 'Drywall';
  if (desc.includes('paint')) return 'Painting';
  if (desc.includes('floor')) return 'Flooring';
  if (desc.includes('plumb')) return 'Plumbing';
  if (desc.includes('electric')) return 'Electrical';
  if (desc.includes('hvac')) return 'HVAC';
  if (desc.includes('fram')) return 'Framing';
  
  return 'General';
}

/**
 * Detect line item fragmentation
 */
function detectFragmentation(
  lineItems: StandardizedLineItem[]
): LineItemFragmentation[] {
  const fragmentations: LineItemFragmentation[] = [];
  
  // Group items by trade
  const tradeGroups: Record<string, StandardizedLineItem[]> = {};
  
  for (const item of lineItems) {
    const trade = determineTradeType(item.description);
    if (!tradeGroups[trade]) {
      tradeGroups[trade] = [];
    }
    tradeGroups[trade].push(item);
  }
  
  // Check each trade for fragmentation
  for (const [trade, items] of Object.entries(tradeGroups)) {
    // Look for fragmentation patterns
    const removeItems = items.filter(i => i.description.toLowerCase().includes('remove'));
    const installItems = items.filter(i => 
      i.description.toLowerCase().includes('install') ||
      i.description.toLowerCase().includes('replace')
    );
    const finishItems = items.filter(i => 
      i.description.toLowerCase().includes('paint') ||
      i.description.toLowerCase().includes('texture') ||
      i.description.toLowerCase().includes('finish')
    );
    
    // If 3+ fragmented operations for same trade
    const totalFragmented = removeItems.length + installItems.length + finishItems.length;
    
    if (totalFragmented >= 3 && items.length >= 4) {
      fragmentations.push({
        trade,
        fragmentedItems: items.map(i => i.description),
        lineNumbers: items.map(i => i.lineNumber),
        reason: `${totalFragmented} separate line items for ${trade} work suggests scope fragmentation to reduce apparent cost`,
        severity: totalFragmented >= 5 ? 'HIGH' : 'MEDIUM',
      });
    }
  }
  
  return fragmentations;
}

/**
 * Calculate manipulation score (0-100, higher = more manipulation)
 */
function calculateManipulationScore(result: ManipulationResult): number {
  let score = 0;
  
  // Quantity suppression (up to 30 points)
  score += Math.min(30, result.quantitySuppressions.length * 10);
  
  // Labor suppression (up to 40 points)
  score += Math.min(40, result.laborSuppressions.length * 8);
  
  // Fragmentation (up to 30 points)
  score += Math.min(30, result.fragmentations.length * 15);
  
  return Math.min(100, score);
}

/**
 * Main manipulation detection function
 */
export async function detectEstimateManipulation(
  estimate: StandardizedEstimate
): Promise<ManipulationResult> {
  
  console.log('[MANIPULATION] Analyzing estimate manipulation...');
  
  const region = estimate.metadata?.region || 'DEFAULT';
  
  try {
    // Detection 1: Quantity suppression
    const quantitySuppressions = detectQuantitySuppression(estimate.lineItems);
    console.log(`[MANIPULATION] Quantity suppressions: ${quantitySuppressions.length}`);
    
    // Detection 2: Labor suppression
    const laborSuppressions = await detectLaborSuppression(estimate.lineItems, region);
    console.log(`[MANIPULATION] Labor suppressions: ${laborSuppressions.length}`);
    
    // Detection 3: Line item fragmentation
    const fragmentations = detectFragmentation(estimate.lineItems);
    console.log(`[MANIPULATION] Fragmentations: ${fragmentations.length}`);
    
    // Calculate totals
    const quantityImpact = quantitySuppressions.reduce((sum, s) => sum + s.financialImpact, 0);
    const laborImpact = laborSuppressions.reduce((sum, s) => sum + s.financialImpact, 0);
    const totalFinancialImpact = quantityImpact + laborImpact;
    
    const result: ManipulationResult = {
      quantitySuppressions,
      laborSuppressions,
      fragmentations,
      totalFinancialImpact,
      manipulationScore: 0,
      summary: '',
    };
    
    result.manipulationScore = calculateManipulationScore(result);
    result.summary = generateManipulationSummary(result);
    
    console.log(`[MANIPULATION] Manipulation score: ${result.manipulationScore}/100`);
    console.log(`[MANIPULATION] Total impact: $${totalFinancialImpact.toFixed(2)}`);
    
    return result;
    
  } catch (error) {
    console.error('[MANIPULATION] Error:', error);
    return {
      quantitySuppressions: [],
      laborSuppressions: [],
      fragmentations: [],
      totalFinancialImpact: 0,
      manipulationScore: 0,
      summary: 'Analysis failed',
    };
  }
}

/**
 * Generate manipulation summary
 */
function generateManipulationSummary(result: ManipulationResult): string {
  if (result.manipulationScore === 0) {
    return 'No significant manipulation indicators detected';
  }
  
  let summary = `Manipulation score: ${result.manipulationScore}/100. `;
  
  if (result.manipulationScore >= 70) {
    summary += 'CRITICAL: Multiple manipulation tactics detected. ';
  } else if (result.manipulationScore >= 40) {
    summary += 'HIGH: Significant manipulation indicators present. ';
  } else if (result.manipulationScore >= 20) {
    summary += 'MODERATE: Some manipulation tactics detected. ';
  }
  
  const tactics: string[] = [];
  if (result.quantitySuppressions.length > 0) {
    tactics.push(`${result.quantitySuppressions.length} quantity suppressions`);
  }
  if (result.laborSuppressions.length > 0) {
    tactics.push(`${result.laborSuppressions.length} labor suppressions`);
  }
  if (result.fragmentations.length > 0) {
    tactics.push(`${result.fragmentations.length} scope fragmentations`);
  }
  
  summary += `Detected: ${tactics.join(', ')}.`;
  
  return summary;
}

/**
 * Format manipulation report
 */
export function formatManipulationReport(result: ManipulationResult): string {
  let report = `ESTIMATE MANIPULATION ANALYSIS\n`;
  report += `${'='.repeat(60)}\n\n`;
  
  report += `SUMMARY:\n`;
  report += `- Manipulation score: ${result.manipulationScore}/100\n`;
  report += `- Total financial impact: $${result.totalFinancialImpact.toFixed(2)}\n`;
  report += `- Quantity suppressions: ${result.quantitySuppressions.length}\n`;
  report += `- Labor suppressions: ${result.laborSuppressions.length}\n`;
  report += `- Scope fragmentations: ${result.fragmentations.length}\n\n`;
  
  if (result.manipulationScore === 0) {
    report += `✓ No manipulation indicators detected\n`;
    return report;
  }
  
  report += `${result.summary}\n\n`;
  
  // Quantity suppressions
  if (result.quantitySuppressions.length > 0) {
    report += `QUANTITY SUPPRESSIONS (${result.quantitySuppressions.length}):\n`;
    for (const suppression of result.quantitySuppressions) {
      report += `  Line ${suppression.lineNumber}: ${suppression.item}\n`;
      report += `    Estimate: ${suppression.estimatedQuantity} units\n`;
      report += `    Expected: ${suppression.expectedQuantity} units\n`;
      report += `    Suppression: ${suppression.suppressionPercentage.toFixed(1)}%\n`;
      report += `    Impact: $${suppression.financialImpact.toFixed(2)}\n\n`;
    }
  }
  
  // Labor suppressions
  if (result.laborSuppressions.length > 0) {
    report += `LABOR RATE SUPPRESSIONS (${result.laborSuppressions.length}):\n`;
    for (const suppression of result.laborSuppressions) {
      report += `  Line ${suppression.lineNumber}: ${suppression.item}\n`;
      report += `    Estimate rate: $${suppression.estimateRate.toFixed(2)}/hr\n`;
      report += `    Regional rate: $${suppression.regionalRate.toFixed(2)}/hr\n`;
      report += `    Suppression: ${suppression.suppressionPercentage.toFixed(1)}%\n`;
      report += `    Impact: $${suppression.financialImpact.toFixed(2)}\n\n`;
    }
  }
  
  // Fragmentations
  if (result.fragmentations.length > 0) {
    report += `SCOPE FRAGMENTATIONS (${result.fragmentations.length}):\n`;
    for (const frag of result.fragmentations) {
      report += `  ${frag.trade} - ${frag.severity}\n`;
      report += `    Items: ${frag.fragmentedItems.length}\n`;
      report += `    Reason: ${frag.reason}\n`;
      report += `    Lines: ${frag.lineNumbers.join(', ')}\n\n`;
    }
  }
  
  return report;
}

/**
 * Get expected roof area based on structure type
 */
function getExpectedRoofArea(estimate: StandardizedEstimate): number {
  // Simple heuristic based on typical home sizes
  // In production, this could use property data or AI estimation
  
  const metadata = estimate.metadata || {};
  const structureType = metadata.structureType || 'single-family';
  
  const areaMap: Record<string, number> = {
    'single-family': 28,
    'townhouse': 20,
    'condo': 15,
    'commercial': 50,
  };
  
  return areaMap[structureType] || 28;
}

/**
 * Detect geometric inconsistencies
 */
export function detectGeometricInconsistencies(
  lineItems: StandardizedLineItem[]
): Array<{ issue: string; evidence: string; impact: number }> {
  const inconsistencies: Array<{ issue: string; evidence: string; impact: number }> = [];
  
  // Check roof area vs perimeter consistency
  const roofArea = lineItems.find(item => 
    item.description.toLowerCase().includes('shingle') &&
    item.unit.toLowerCase().includes('sq')
  );
  
  const dripEdge = lineItems.find(item => 
    item.description.toLowerCase().includes('drip')
  );
  
  if (roofArea && dripEdge) {
    // Typical roof: perimeter is roughly 4 * sqrt(area in SF)
    const areaInSF = roofArea.quantity * 100; // 1 SQ = 100 SF
    const expectedPerimeter = 4 * Math.sqrt(areaInSF);
    const actualPerimeter = dripEdge.quantity;
    
    const deviation = Math.abs(expectedPerimeter - actualPerimeter) / expectedPerimeter;
    
    if (deviation > 0.3) {
      inconsistencies.push({
        issue: 'Roof area/perimeter mismatch',
        evidence: `Roof area (${roofArea.quantity} SQ) suggests ${expectedPerimeter.toFixed(0)} LF perimeter, but estimate shows ${actualPerimeter} LF`,
        impact: 0,
      });
    }
  }
  
  return inconsistencies;
}
