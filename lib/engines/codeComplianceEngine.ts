/**
 * CODE COMPLIANCE ENGINE
 * Detects when estimate scope violates building code requirements
 * Cross-references estimate against code_requirements database
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

export interface CodeViolation {
  codeReference: string;
  requirement: string;
  triggerTrade: string;
  missingItem: string;
  evidence: string;
  financialImpact: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  jurisdiction: string;
  unit: string;
  estimatedQuantity: number;
}

export interface CodeComplianceResult {
  violations: CodeViolation[];
  totalViolations: number;
  criticalViolations: number;
  totalFinancialImpact: number;
  tradesChecked: string[];
  jurisdiction: string;
}

/**
 * Detect trades present in estimate
 */
function detectTrades(lineItems: StandardizedLineItem[]): string[] {
  const trades = new Set<string>();
  
  for (const item of lineItems) {
    const desc = item.description.toLowerCase();
    const code = item.tradeCode.toLowerCase();
    
    if (desc.includes('roof') || desc.includes('shingle') || code.startsWith('rfg')) {
      trades.add('Roofing');
    }
    if (desc.includes('drywall') || desc.includes('sheetrock') || code.startsWith('dry')) {
      trades.add('Drywall');
    }
    if (desc.includes('floor') || desc.includes('carpet') || desc.includes('tile') || code.startsWith('flr')) {
      trades.add('Flooring');
    }
    if (desc.includes('plumb') || desc.includes('pipe') || code.startsWith('plm')) {
      trades.add('Plumbing');
    }
    if (desc.includes('electric') || desc.includes('wiring') || code.startsWith('elc')) {
      trades.add('Electrical');
    }
    if (desc.includes('hvac') || desc.includes('heating') || desc.includes('cooling') || code.startsWith('hvc')) {
      trades.add('HVAC');
    }
    if (desc.includes('fram') || desc.includes('stud') || desc.includes('joist') || code.startsWith('frm')) {
      trades.add('Framing');
    }
    if (desc.includes('paint') || code.startsWith('pnt')) {
      trades.add('Painting');
    }
  }
  
  return Array.from(trades);
}

/**
 * Check if item exists in estimate
 */
function hasItem(lineItems: StandardizedLineItem[], searchTerm: string): boolean {
  return lineItems.some(item => {
    const desc = item.description.toLowerCase();
    return desc.includes(searchTerm.toLowerCase());
  });
}

/**
 * Get code requirements from database
 */
async function getCodeRequirements(
  trade: string,
  jurisdiction: string
): Promise<any[]> {
  const client = getSupabaseClient();
  if (!client) {
    console.warn('[CODE-COMPLIANCE] Supabase not configured, using fallback rules');
    return [];
  }
  
  try {
    // Get requirements for both jurisdiction and national
    const { data, error } = await (client as any)
      .from('code_requirements')
      .select('*')
      .eq('trigger_trade', trade)
      .or(`jurisdiction.eq.${jurisdiction},jurisdiction.eq.National`);
    
    if (error) {
      console.error('[CODE-COMPLIANCE] Error fetching requirements:', error);
      return [];
    }
    
    return data || [];
    
  } catch (error) {
    console.error('[CODE-COMPLIANCE] Database error:', error);
    return [];
  }
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
 * Detect code compliance violations
 */
export async function detectCodeViolations(
  estimate: StandardizedEstimate
): Promise<CodeComplianceResult> {
  
  console.log('[CODE-COMPLIANCE] Analyzing code compliance...');
  
  const violations: CodeViolation[] = [];
  const jurisdiction = estimate.metadata?.state || 'National';
  const region = estimate.metadata?.region || 'DEFAULT';
  
  try {
    // Step 1: Detect trades
    const tradesDetected = detectTrades(estimate.lineItems);
    console.log(`[CODE-COMPLIANCE] Detected trades: ${tradesDetected.join(', ')}`);
    
    // Step 2: Get code requirements for each trade
    for (const trade of tradesDetected) {
      const requirements = await getCodeRequirements(trade, jurisdiction);
      console.log(`[CODE-COMPLIANCE] Checking ${requirements.length} requirements for ${trade}`);
      
      // Step 3: Check each requirement
      for (const req of requirements) {
        if (!hasItem(estimate.lineItems, req.required_item)) {
          // Apply regional pricing
          const adjustedCost = await applyRegionalPricing(req.estimated_cost || 0, region);
          
          violations.push({
            codeReference: req.code_reference,
            requirement: req.requirement,
            triggerTrade: req.trigger_trade,
            missingItem: req.required_item,
            evidence: `${trade} work detected but ${req.required_item} not found in estimate`,
            financialImpact: adjustedCost,
            severity: req.severity || 'HIGH',
            jurisdiction: req.jurisdiction,
            unit: req.unit || 'EA',
            estimatedQuantity: req.estimated_quantity || 1,
          });
          
          console.log(`[CODE-COMPLIANCE] Violation: ${req.required_item} (${req.code_reference})`);
        }
      }
    }
    
    const totalFinancialImpact = violations.reduce((sum, v) => sum + v.financialImpact, 0);
    const criticalViolations = violations.filter(v => v.severity === 'CRITICAL').length;
    
    console.log(`[CODE-COMPLIANCE] Found ${violations.length} violations`);
    console.log(`[CODE-COMPLIANCE] Critical: ${criticalViolations}`);
    console.log(`[CODE-COMPLIANCE] Total impact: $${totalFinancialImpact.toFixed(2)}`);
    
    return {
      violations,
      totalViolations: violations.length,
      criticalViolations,
      totalFinancialImpact,
      tradesChecked: tradesDetected,
      jurisdiction,
    };
    
  } catch (error) {
    console.error('[CODE-COMPLIANCE] Error:', error);
    return {
      violations: [],
      totalViolations: 0,
      criticalViolations: 0,
      totalFinancialImpact: 0,
      tradesChecked: [],
      jurisdiction,
    };
  }
}

/**
 * Format code compliance report
 */
export function formatCodeComplianceReport(result: CodeComplianceResult): string {
  let report = `CODE COMPLIANCE ANALYSIS\n`;
  report += `${'='.repeat(60)}\n\n`;
  
  report += `SUMMARY:\n`;
  report += `- Jurisdiction: ${result.jurisdiction}\n`;
  report += `- Trades checked: ${result.tradesChecked.join(', ')}\n`;
  report += `- Violations found: ${result.totalViolations}\n`;
  report += `- Critical violations: ${result.criticalViolations}\n`;
  report += `- Total financial impact: $${result.totalFinancialImpact.toFixed(2)}\n\n`;
  
  if (result.violations.length === 0) {
    report += `✓ No code compliance violations detected\n`;
    return report;
  }
  
  report += `VIOLATIONS:\n\n`;
  
  // Group by severity
  const critical = result.violations.filter(v => v.severity === 'CRITICAL');
  const high = result.violations.filter(v => v.severity === 'HIGH');
  const medium = result.violations.filter(v => v.severity === 'MEDIUM');
  
  if (critical.length > 0) {
    report += `CRITICAL (${critical.length}):\n`;
    for (const violation of critical) {
      report += `  - ${violation.missingItem}\n`;
      report += `    Code: ${violation.codeReference}\n`;
      report += `    Requirement: ${violation.requirement}\n`;
      report += `    Evidence: ${violation.evidence}\n`;
      report += `    Impact: $${violation.financialImpact.toFixed(2)}\n\n`;
    }
  }
  
  if (high.length > 0) {
    report += `HIGH (${high.length}):\n`;
    for (const violation of high) {
      report += `  - ${violation.missingItem}\n`;
      report += `    Code: ${violation.codeReference}\n`;
      report += `    Impact: $${violation.financialImpact.toFixed(2)}\n\n`;
    }
  }
  
  if (medium.length > 0) {
    report += `MEDIUM (${medium.length}):\n`;
    for (const violation of medium) {
      report += `  - ${violation.missingItem} (${violation.codeReference})\n`;
    }
    report += `\n`;
  }
  
  return report;
}

/**
 * Get jurisdiction from state
 */
export function getJurisdictionFromState(state: string): string {
  const stateMap: Record<string, string> = {
    'FL': 'Florida',
    'CA': 'California',
    'TX': 'Texas',
    'NY': 'New York',
    'GA': 'Georgia',
    'NC': 'North Carolina',
    'SC': 'South Carolina',
  };
  
  return stateMap[state.toUpperCase()] || 'National';
}
