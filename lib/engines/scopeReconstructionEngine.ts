/**
 * SCOPE GAP RECONSTRUCTION ENGINE
 * Reconstructs what the estimate SHOULD include based on detected trades
 * and industry standards
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

export interface MissingLineItem {
  tradeType: string;
  itemCode: string;
  description: string;
  estimatedQuantity: number;
  unit: string;
  estimatedUnitPrice: number;
  estimatedTotal: number;
  reason: string;
  industryStandard: string;
  frequency: number;
}

export interface ReconstructedEstimate {
  originalValue: number;
  reconstructedValue: number;
  gapValue: number;
  gapPercentage: number;
  missingLineItems: MissingLineItem[];
  methodology: string;
  confidenceScore: number;
}

export interface ScopeReconstructionResult {
  reconstruction: ReconstructedEstimate;
  tradesDetected: string[];
  itemsAdded: number;
  summary: string;
}

/**
 * Detect trades present in estimate
 */
function detectTrades(lineItems: StandardizedLineItem[]): string[] {
  const trades = new Set<string>();
  
  for (const item of lineItems) {
    const desc = item.description.toLowerCase();
    const code = item.tradeCode.toLowerCase();
    
    // Roofing
    if (desc.includes('roof') || desc.includes('shingle') || desc.includes('flashing') || code.startsWith('rfg')) {
      trades.add('Roofing');
    }
    
    // Drywall
    if (desc.includes('drywall') || desc.includes('sheetrock') || desc.includes('gypsum') || code.startsWith('dry')) {
      trades.add('Drywall');
    }
    
    // Painting
    if (desc.includes('paint') || desc.includes('primer') || code.startsWith('pnt')) {
      trades.add('Painting');
    }
    
    // Flooring
    if (desc.includes('floor') || desc.includes('carpet') || desc.includes('tile') || desc.includes('vinyl') || code.startsWith('flr')) {
      trades.add('Flooring');
    }
    
    // Plumbing
    if (desc.includes('plumb') || desc.includes('pipe') || desc.includes('drain') || code.startsWith('plm')) {
      trades.add('Plumbing');
    }
    
    // Electrical
    if (desc.includes('electric') || desc.includes('wiring') || desc.includes('outlet') || code.startsWith('elc')) {
      trades.add('Electrical');
    }
    
    // HVAC
    if (desc.includes('hvac') || desc.includes('heating') || desc.includes('cooling') || desc.includes('duct') || code.startsWith('hvc')) {
      trades.add('HVAC');
    }
    
    // Framing
    if (desc.includes('fram') || desc.includes('stud') || desc.includes('joist') || code.startsWith('frm')) {
      trades.add('Framing');
    }
    
    // Insulation
    if (desc.includes('insulat') || code.startsWith('ins')) {
      trades.add('Insulation');
    }
  }
  
  return Array.from(trades);
}

/**
 * Check if item exists in estimate
 */
function hasItem(lineItems: StandardizedLineItem[], searchTerms: string[]): boolean {
  return lineItems.some(item => {
    const desc = item.description.toLowerCase();
    return searchTerms.some(term => desc.includes(term.toLowerCase()));
  });
}

/**
 * Get expected missing items for a trade
 */
async function getExpectedMissingItems(
  trade: string,
  lineItems: StandardizedLineItem[]
): Promise<MissingLineItem[]> {
  const missing: MissingLineItem[] = [];
  
  // Roofing scope gaps
  if (trade === 'Roofing') {
    if (!hasItem(lineItems, ['drip edge', 'drip-edge'])) {
      missing.push({
        tradeType: 'Roofing',
        itemCode: 'RFG-DRIP',
        description: 'Drip Edge',
        estimatedQuantity: 120,
        unit: 'LF',
        estimatedUnitPrice: 10.00,
        estimatedTotal: 1200.00,
        reason: 'Required by IRC R903.2 for all roof edges',
        industryStandard: 'IRC R903.2',
        frequency: 41,
      });
    }
    
    if (!hasItem(lineItems, ['ice and water', 'ice & water', 'ice water shield'])) {
      missing.push({
        tradeType: 'Roofing',
        itemCode: 'RFG-ICE',
        description: 'Ice & Water Shield',
        estimatedQuantity: 8,
        unit: 'SQ',
        estimatedUnitPrice: 300.00,
        estimatedTotal: 2400.00,
        reason: 'Required in valleys and eaves per IRC R905.2.7',
        industryStandard: 'IRC R905.2.7',
        frequency: 38,
      });
    }
    
    if (!hasItem(lineItems, ['starter strip', 'starter course'])) {
      missing.push({
        tradeType: 'Roofing',
        itemCode: 'RFG-START',
        description: 'Starter Strip',
        estimatedQuantity: 120,
        unit: 'LF',
        estimatedUnitPrice: 6.50,
        estimatedTotal: 780.00,
        reason: 'Required for proper shingle installation per manufacturer specs',
        industryStandard: 'Manufacturer specifications',
        frequency: 35,
      });
    }
    
    if (!hasItem(lineItems, ['ridge vent', 'ridge ventilation'])) {
      missing.push({
        tradeType: 'Roofing',
        itemCode: 'RFG-RIDGE',
        description: 'Ridge Vent',
        estimatedQuantity: 40,
        unit: 'LF',
        estimatedUnitPrice: 45.00,
        estimatedTotal: 1800.00,
        reason: 'Required for proper attic ventilation per IRC R806',
        industryStandard: 'IRC R806',
        frequency: 28,
      });
    }
  }
  
  // Drywall scope gaps
  if (trade === 'Drywall') {
    if (!hasItem(lineItems, ['texture', 'texturing'])) {
      missing.push({
        tradeType: 'Drywall',
        itemCode: 'DRY-TEX',
        description: 'Texture Matching',
        estimatedQuantity: 500,
        unit: 'SF',
        estimatedUnitPrice: 3.00,
        estimatedTotal: 1500.00,
        reason: 'Required to match existing wall texture',
        industryStandard: 'Industry standard practice',
        frequency: 44,
      });
    }
    
    if (!hasItem(lineItems, ['primer', 'sealer', 'prime'])) {
      missing.push({
        tradeType: 'Drywall',
        itemCode: 'DRY-PRM',
        description: 'Primer/Sealer',
        estimatedQuantity: 500,
        unit: 'SF',
        estimatedUnitPrice: 1.80,
        estimatedTotal: 900.00,
        reason: 'Required before painting new drywall',
        industryStandard: 'Paint manufacturer specifications',
        frequency: 39,
      });
    }
  }
  
  // Flooring scope gaps
  if (trade === 'Flooring') {
    if (!hasItem(lineItems, ['underlayment', 'underlayment pad'])) {
      missing.push({
        tradeType: 'Flooring',
        itemCode: 'FLR-UNDER',
        description: 'Flooring Underlayment',
        estimatedQuantity: 400,
        unit: 'SF',
        estimatedUnitPrice: 5.50,
        estimatedTotal: 2200.00,
        reason: 'Required for proper flooring installation',
        industryStandard: 'Flooring manufacturer specifications',
        frequency: 33,
      });
    }
    
    if (!hasItem(lineItems, ['transition', 'transition strip', 'reducer'])) {
      missing.push({
        tradeType: 'Flooring',
        itemCode: 'FLR-TRANS',
        description: 'Transition Strips',
        estimatedQuantity: 30,
        unit: 'LF',
        estimatedUnitPrice: 20.00,
        estimatedTotal: 600.00,
        reason: 'Required at doorways and flooring transitions',
        industryStandard: 'Industry standard practice',
        frequency: 31,
      });
    }
  }
  
  // Permit gaps (applies to multiple trades)
  if ((trade === 'Plumbing' || trade === 'Electrical' || trade === 'HVAC') && 
      !hasItem(lineItems, ['permit', 'building permit'])) {
    missing.push({
      tradeType: trade,
      itemCode: `${trade.substring(0, 3).toUpperCase()}-PRM`,
      description: `${trade} Permit`,
      estimatedQuantity: 1,
      unit: 'EA',
      estimatedUnitPrice: trade === 'Plumbing' ? 350.00 : 400.00,
      estimatedTotal: trade === 'Plumbing' ? 350.00 : 400.00,
      reason: 'Required by local building codes',
      industryStandard: 'Local building code',
      frequency: trade === 'Plumbing' ? 47 : 45,
    });
  }
  
  return missing;
}

/**
 * Apply pricing database to missing items
 */
async function applyPricingDatabase(
  missingItems: MissingLineItem[],
  region: string
): Promise<MissingLineItem[]> {
  const client = getSupabaseClient();
  if (!client) {
    return missingItems; // Return as-is if no database
  }
  
  try {
    // Get regional multiplier
    const { data: multiplierData } = await (client as any)
      .from('regional_multipliers')
      .select('multiplier')
      .eq('region', region)
      .single();
    
    const multiplier = multiplierData?.multiplier || 1.0;
    
    // Adjust prices for region
    return missingItems.map(item => ({
      ...item,
      estimatedUnitPrice: item.estimatedUnitPrice * multiplier,
      estimatedTotal: item.estimatedTotal * multiplier,
    }));
    
  } catch (error) {
    console.error('[SCOPE-RECONSTRUCTION] Error applying pricing:', error);
    return missingItems;
  }
}

/**
 * Main reconstruction function
 */
export async function reconstructScope(
  estimate: StandardizedEstimate
): Promise<ScopeReconstructionResult> {
  
  const startTime = Date.now();
  
  try {
    // Step 1: Detect trades
    const tradesDetected = detectTrades(estimate.lineItems);
    console.log(`[SCOPE-RECONSTRUCTION] Detected trades: ${tradesDetected.join(', ')}`);
    
    // Step 2: Identify missing scope for each trade
    let allMissingItems: MissingLineItem[] = [];
    
    for (const trade of tradesDetected) {
      const missingForTrade = await getExpectedMissingItems(trade, estimate.lineItems);
      allMissingItems.push(...missingForTrade);
    }
    
    console.log(`[SCOPE-RECONSTRUCTION] Found ${allMissingItems.length} missing items`);
    
    // Step 3: Apply pricing database
    const region = estimate.metadata?.region || 'DEFAULT';
    allMissingItems = await applyPricingDatabase(allMissingItems, region);
    
    // Step 4: Calculate totals
    const originalValue = estimate.totals.rcv;
    const missingValue = allMissingItems.reduce((sum, item) => sum + item.estimatedTotal, 0);
    const reconstructedValue = originalValue + missingValue;
    const gapPercentage = originalValue > 0 ? (missingValue / originalValue) * 100 : 0;
    
    // Step 5: Calculate confidence score
    const confidenceScore = calculateConfidenceScore(allMissingItems, tradesDetected);
    
    const processingTime = Date.now() - startTime;
    console.log(`[SCOPE-RECONSTRUCTION] Complete in ${processingTime}ms`);
    console.log(`[SCOPE-RECONSTRUCTION] Original: $${originalValue.toFixed(2)}`);
    console.log(`[SCOPE-RECONSTRUCTION] Reconstructed: $${reconstructedValue.toFixed(2)}`);
    console.log(`[SCOPE-RECONSTRUCTION] Gap: $${missingValue.toFixed(2)} (${gapPercentage.toFixed(1)}%)`);
    
    return {
      reconstruction: {
        originalValue,
        reconstructedValue,
        gapValue: missingValue,
        gapPercentage,
        missingLineItems: allMissingItems,
        methodology: 'Trade-based scope analysis with industry standards',
        confidenceScore,
      },
      tradesDetected,
      itemsAdded: allMissingItems.length,
      summary: `Found ${allMissingItems.length} missing items across ${tradesDetected.length} trades. Recovery opportunity: $${missingValue.toFixed(2)} (${gapPercentage.toFixed(1)}% increase).`,
    };
    
  } catch (error) {
    console.error('[SCOPE-RECONSTRUCTION] Error:', error);
    
    // Return empty reconstruction on error
    return {
      reconstruction: {
        originalValue: estimate.totals.rcv,
        reconstructedValue: estimate.totals.rcv,
        gapValue: 0,
        gapPercentage: 0,
        missingLineItems: [],
        methodology: 'Error during reconstruction',
        confidenceScore: 0,
      },
      tradesDetected: [],
      itemsAdded: 0,
      summary: 'Scope reconstruction failed',
    };
  }
}

/**
 * Calculate confidence score based on data quality
 */
function calculateConfidenceScore(
  missingItems: MissingLineItem[],
  tradesDetected: string[]
): number {
  let score = 100;
  
  // Reduce confidence if no trades detected
  if (tradesDetected.length === 0) {
    score -= 50;
  }
  
  // Reduce confidence if too many missing items (might be incomplete estimate)
  if (missingItems.length > 20) {
    score -= 20;
  }
  
  // Increase confidence if items have high frequency
  const avgFrequency = missingItems.reduce((sum, item) => sum + item.frequency, 0) / missingItems.length;
  if (avgFrequency > 35) {
    score += 10;
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Get scope gap patterns from database for intelligence
 */
export async function getScopeGapPatterns(trade: string): Promise<any[]> {
  const client = getSupabaseClient();
  if (!client) {
    return [];
  }
  
  try {
    const { data, error } = await (client as any)
      .from('scope_gap_patterns')
      .select('*')
      .eq('trade_type', trade)
      .order('frequency', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('[SCOPE-RECONSTRUCTION] Error fetching patterns:', error);
      return [];
    }
    
    return data || [];
    
  } catch (error) {
    console.error('[SCOPE-RECONSTRUCTION] Database error:', error);
    return [];
  }
}

/**
 * Format reconstruction as text report
 */
export function formatReconstructionReport(result: ScopeReconstructionResult): string {
  let report = `SCOPE RECONSTRUCTION ANALYSIS\n`;
  report += `${'='.repeat(60)}\n\n`;
  
  report += `SUMMARY:\n`;
  report += `- Original Estimate: $${result.reconstruction.originalValue.toFixed(2)}\n`;
  report += `- Reconstructed Estimate: $${result.reconstruction.reconstructedValue.toFixed(2)}\n`;
  report += `- Gap: $${result.reconstruction.gapValue.toFixed(2)} (${result.reconstruction.gapPercentage.toFixed(1)}%)\n`;
  report += `- Trades Detected: ${result.tradesDetected.join(', ')}\n`;
  report += `- Missing Items: ${result.itemsAdded}\n`;
  report += `- Confidence: ${result.reconstruction.confidenceScore}%\n\n`;
  
  if (result.reconstruction.missingLineItems.length === 0) {
    report += `✓ No significant scope gaps detected\n`;
    return report;
  }
  
  report += `MISSING LINE ITEMS:\n\n`;
  
  // Group by trade
  const byTrade = result.reconstruction.missingLineItems.reduce((acc, item) => {
    if (!acc[item.tradeType]) {
      acc[item.tradeType] = [];
    }
    acc[item.tradeType].push(item);
    return acc;
  }, {} as Record<string, MissingLineItem[]>);
  
  for (const [trade, items] of Object.entries(byTrade)) {
    report += `${trade.toUpperCase()}:\n`;
    for (const item of items) {
      report += `  - ${item.description}\n`;
      report += `    Quantity: ${item.estimatedQuantity} ${item.unit}\n`;
      report += `    Unit Price: $${item.estimatedUnitPrice.toFixed(2)}\n`;
      report += `    Total: $${item.estimatedTotal.toFixed(2)}\n`;
      report += `    Reason: ${item.reason}\n`;
      report += `    Standard: ${item.industryStandard}\n`;
      report += `    Frequency: ${item.frequency}% of estimates\n\n`;
    }
  }
  
  return report;
}
