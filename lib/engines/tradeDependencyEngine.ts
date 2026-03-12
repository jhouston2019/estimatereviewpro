/**
 * TRADE DEPENDENCY ENGINE
 * Detects missing dependent construction components when a trade appears
 * Uses construction logic to identify incomplete scope
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

export interface TradeDependency {
  trade: string;
  trigger: string[];
  required: Array<{
    item: string;
    reason: string;
    estimatedCost: number;
    unit: string;
    estimatedQuantity: number;
  }>;
}

export interface DependencyViolation {
  trade: string;
  triggerFound: string;
  missingItems: Array<{
    item: string;
    reason: string;
    estimatedCost: number;
    unit: string;
    estimatedQuantity: number;
  }>;
  totalFinancialImpact: number;
}

export interface TradeDependencyResult {
  violations: DependencyViolation[];
  totalViolations: number;
  totalFinancialImpact: number;
  tradesAnalyzed: string[];
}

/**
 * Trade dependency rules
 */
const TRADE_DEPENDENCIES: TradeDependency[] = [
  {
    trade: 'Roofing',
    trigger: ['shingle', 'laminate', 'architectural shingle', 'roofing', 'roof replacement'],
    required: [
      {
        item: 'starter strip',
        reason: 'Required for proper shingle installation per manufacturer warranty',
        estimatedCost: 780,
        unit: 'LF',
        estimatedQuantity: 120,
      },
      {
        item: 'drip edge',
        reason: 'Required by IRC R903.2 at all roof edges',
        estimatedCost: 1200,
        unit: 'LF',
        estimatedQuantity: 120,
      },
      {
        item: 'ridge cap',
        reason: 'Required to seal ridge line per manufacturer specifications',
        estimatedCost: 900,
        unit: 'LF',
        estimatedQuantity: 40,
      },
      {
        item: 'flashing',
        reason: 'Required at all roof penetrations and transitions per IRC R903.2',
        estimatedCost: 1500,
        unit: 'EA',
        estimatedQuantity: 8,
      },
      {
        item: 'valley metal',
        reason: 'Required in roof valleys per IRC R905.2.8.3',
        estimatedCost: 800,
        unit: 'LF',
        estimatedQuantity: 25,
      },
    ],
  },
  {
    trade: 'Drywall',
    trigger: ['drywall', 'sheetrock', 'gypsum board', 'drywall hanging'],
    required: [
      {
        item: 'joint compound',
        reason: 'Required for finishing drywall seams',
        estimatedCost: 400,
        unit: 'SF',
        estimatedQuantity: 500,
      },
      {
        item: 'tape',
        reason: 'Required for drywall seam finishing',
        estimatedCost: 200,
        unit: 'SF',
        estimatedQuantity: 500,
      },
      {
        item: 'texture',
        reason: 'Required to match existing wall finish',
        estimatedCost: 1500,
        unit: 'SF',
        estimatedQuantity: 500,
      },
      {
        item: 'primer',
        reason: 'Required before painting new drywall per manufacturer specs',
        estimatedCost: 900,
        unit: 'SF',
        estimatedQuantity: 500,
      },
    ],
  },
  {
    trade: 'Flooring',
    trigger: ['flooring', 'floor install', 'lvp', 'vinyl plank', 'hardwood', 'tile', 'carpet'],
    required: [
      {
        item: 'underlayment',
        reason: 'Required for proper flooring installation per manufacturer specs',
        estimatedCost: 2200,
        unit: 'SF',
        estimatedQuantity: 400,
      },
      {
        item: 'transition',
        reason: 'Required at doorways and flooring transitions',
        estimatedCost: 600,
        unit: 'LF',
        estimatedQuantity: 30,
      },
      {
        item: 'baseboard',
        reason: 'Required to finish flooring perimeter',
        estimatedCost: 800,
        unit: 'LF',
        estimatedQuantity: 80,
      },
    ],
  },
  {
    trade: 'Plumbing',
    trigger: ['plumbing', 'pipe', 'water line', 'drain line', 'fixture'],
    required: [
      {
        item: 'permit',
        reason: 'Required by local building code for plumbing work',
        estimatedCost: 350,
        unit: 'EA',
        estimatedQuantity: 1,
      },
      {
        item: 'inspection',
        reason: 'Required by building code for plumbing systems',
        estimatedCost: 150,
        unit: 'EA',
        estimatedQuantity: 1,
      },
    ],
  },
  {
    trade: 'Electrical',
    trigger: ['electrical', 'wiring', 'outlet', 'switch', 'circuit', 'panel'],
    required: [
      {
        item: 'permit',
        reason: 'Required by local building code for electrical work',
        estimatedCost: 400,
        unit: 'EA',
        estimatedQuantity: 1,
      },
      {
        item: 'inspection',
        reason: 'Required by building code for electrical systems',
        estimatedCost: 175,
        unit: 'EA',
        estimatedQuantity: 1,
      },
    ],
  },
  {
    trade: 'HVAC',
    trigger: ['hvac', 'air handler', 'condenser', 'ductwork', 'heating', 'cooling'],
    required: [
      {
        item: 'permit',
        reason: 'Required by local building code for HVAC work',
        estimatedCost: 450,
        unit: 'EA',
        estimatedQuantity: 1,
      },
      {
        item: 'refrigerant',
        reason: 'Required for HVAC system operation',
        estimatedCost: 600,
        unit: 'EA',
        estimatedQuantity: 1,
      },
    ],
  },
  {
    trade: 'Framing',
    trigger: ['framing', 'stud', 'joist', 'rafter', 'structural'],
    required: [
      {
        item: 'engineering',
        reason: 'Required for structural modifications per building code',
        estimatedCost: 1500,
        unit: 'EA',
        estimatedQuantity: 1,
      },
      {
        item: 'permit',
        reason: 'Required by building code for structural work',
        estimatedCost: 500,
        unit: 'EA',
        estimatedQuantity: 1,
      },
    ],
  },
  {
    trade: 'Painting',
    trigger: ['paint', 'painting'],
    required: [
      {
        item: 'primer',
        reason: 'Required before topcoat application per manufacturer specs',
        estimatedCost: 800,
        unit: 'SF',
        estimatedQuantity: 500,
      },
      {
        item: 'caulk',
        reason: 'Required for proper paint finish at joints and seams',
        estimatedCost: 300,
        unit: 'EA',
        estimatedQuantity: 10,
      },
    ],
  },
];

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
 * Apply regional pricing adjustment
 */
async function applyRegionalPricing(cost: number, region: string): Promise<number> {
  const client = getSupabaseClient();
  if (!client) {
    return cost;
  }
  
  try {
    const { data } = await (client as any)
      .from('regional_multipliers')
      .select('multiplier')
      .eq('region', region)
      .single();
    
    return cost * (data?.multiplier || 1.0);
  } catch (error) {
    return cost;
  }
}

/**
 * Detect trade dependency violations
 */
export async function detectTradeDependencies(
  estimate: StandardizedEstimate
): Promise<TradeDependencyResult> {
  
  console.log('[TRADE-DEPENDENCY] Analyzing trade dependencies...');
  
  const violations: DependencyViolation[] = [];
  const tradesAnalyzed: string[] = [];
  const region = estimate.metadata?.region || 'DEFAULT';
  
  try {
    // Check each trade dependency rule
    for (const dependency of TRADE_DEPENDENCIES) {
      // Check if trigger is present
      const triggerFound = dependency.trigger.find(trigger => 
        hasItem(estimate.lineItems, [trigger])
      );
      
      if (triggerFound) {
        tradesAnalyzed.push(dependency.trade);
        console.log(`[TRADE-DEPENDENCY] Found ${dependency.trade} trade (trigger: ${triggerFound})`);
        
        const missingItems: DependencyViolation['missingItems'] = [];
        
        // Check each required item
        for (const requiredItem of dependency.required) {
          if (!hasItem(estimate.lineItems, [requiredItem.item])) {
            // Apply regional pricing
            const adjustedCost = await applyRegionalPricing(requiredItem.estimatedCost, region);
            
            missingItems.push({
              item: requiredItem.item,
              reason: requiredItem.reason,
              estimatedCost: adjustedCost,
              unit: requiredItem.unit,
              estimatedQuantity: requiredItem.estimatedQuantity,
            });
            
            console.log(`[TRADE-DEPENDENCY] Missing: ${requiredItem.item} ($${adjustedCost.toFixed(2)})`);
          }
        }
        
        // If any items missing, add violation
        if (missingItems.length > 0) {
          const totalImpact = missingItems.reduce((sum, item) => sum + item.estimatedCost, 0);
          
          violations.push({
            trade: dependency.trade,
            triggerFound,
            missingItems,
            totalFinancialImpact: totalImpact,
          });
        }
      }
    }
    
    const totalFinancialImpact = violations.reduce((sum, v) => sum + v.totalFinancialImpact, 0);
    
    console.log(`[TRADE-DEPENDENCY] Found ${violations.length} violations`);
    console.log(`[TRADE-DEPENDENCY] Total impact: $${totalFinancialImpact.toFixed(2)}`);
    
    return {
      violations,
      totalViolations: violations.length,
      totalFinancialImpact,
      tradesAnalyzed,
    };
    
  } catch (error) {
    console.error('[TRADE-DEPENDENCY] Error:', error);
    return {
      violations: [],
      totalViolations: 0,
      totalFinancialImpact: 0,
      tradesAnalyzed: [],
    };
  }
}

/**
 * Format trade dependency report
 */
export function formatTradeDependencyReport(result: TradeDependencyResult): string {
  let report = `TRADE DEPENDENCY ANALYSIS\n`;
  report += `${'='.repeat(60)}\n\n`;
  
  report += `SUMMARY:\n`;
  report += `- Trades analyzed: ${result.tradesAnalyzed.join(', ')}\n`;
  report += `- Violations found: ${result.totalViolations}\n`;
  report += `- Total financial impact: $${result.totalFinancialImpact.toFixed(2)}\n\n`;
  
  if (result.violations.length === 0) {
    report += `✓ No trade dependency violations detected\n`;
    return report;
  }
  
  report += `VIOLATIONS:\n\n`;
  
  for (const violation of result.violations) {
    report += `${violation.trade.toUpperCase()} (triggered by: ${violation.triggerFound})\n`;
    report += `Missing ${violation.missingItems.length} required items:\n`;
    
    for (const item of violation.missingItems) {
      report += `  - ${item.item}\n`;
      report += `    Quantity: ${item.estimatedQuantity} ${item.unit}\n`;
      report += `    Cost: $${item.estimatedCost.toFixed(2)}\n`;
      report += `    Reason: ${item.reason}\n\n`;
    }
    
    report += `Trade impact: $${violation.totalFinancialImpact.toFixed(2)}\n`;
    report += `${'-'.repeat(60)}\n\n`;
  }
  
  return report;
}
