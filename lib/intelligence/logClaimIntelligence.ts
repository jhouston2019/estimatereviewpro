/**
 * CLAIMS INTELLIGENCE DATASET ENGINE
 * Every analyzed estimate contributes structured data to the intelligence dataset
 * This builds long-term carrier behavior intelligence
 */

import { ClaimIssue, StandardizedEstimate } from '../../types/claim-engine';
import { ReconstructedEstimate } from '../engines/scopeReconstructionEngine';
import { RecoveryCalculation } from '../engines/impactCalculator';
import { createClient } from '@supabase/supabase-js';
import {
  updateCarrierPatterns,
  updateScopeGapPatterns,
  updatePricingDeviationPatterns,
  updateLaborRatePatterns,
} from './carrierPatternAnalyzer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabase && supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

export interface ClaimIntelligenceData {
  reportId: string;
  carrier: string;
  state: string;
  claimType: string;
  estimate: StandardizedEstimate;
  issues: ClaimIssue[];
  reconstruction: ReconstructedEstimate | null;
  recovery: RecoveryCalculation;
}

/**
 * Log complete claim intelligence to dataset
 */
export async function logClaimIntelligence(data: ClaimIntelligenceData): Promise<void> {
  const client = getSupabaseClient();
  if (!client) {
    console.warn('[CLAIM-INTELLIGENCE] Supabase not configured, skipping intelligence logging');
    return;
  }
  
  console.log('[CLAIM-INTELLIGENCE] Logging claim to intelligence dataset...');
  
  try {
    // 1. Log claim recovery pattern
    await logClaimRecoveryPattern(data);
    
    // 2. Update carrier behavior patterns
    await updateCarrierPatterns(data.carrier, data.state, data.issues);
    
    // 3. Update scope gap patterns
    if (data.reconstruction && data.reconstruction.missingLineItems.length > 0) {
      const missingItems = data.reconstruction.missingLineItems.map(item => ({
        tradeType: item.tradeType,
        description: item.description,
        estimatedTotal: item.estimatedTotal,
      }));
      await updateScopeGapPatterns(
        data.carrier,
        data.estimate.metadata?.region || 'DEFAULT',
        missingItems
      );
    }
    
    // 4. Update pricing deviation patterns
    const pricingIssues = extractPricingIssues(data.issues, data.estimate);
    if (pricingIssues.length > 0) {
      await updatePricingDeviationPatterns(
        data.carrier,
        data.estimate.metadata?.region || 'DEFAULT',
        pricingIssues
      );
    }
    
    // 5. Update labor rate patterns
    const laborIssues = extractLaborIssues(data.issues, data.estimate);
    if (laborIssues.length > 0) {
      await updateLaborRatePatterns(
        data.carrier,
        data.estimate.metadata?.region || 'DEFAULT',
        laborIssues
      );
    }
    
    // 6. Store reconstructed estimate
    if (data.reconstruction) {
      await storeReconstructedEstimate(data.reportId, data.reconstruction);
    }
    
    // 7. Mark report as logged
    await markIntelligenceLogged(data.reportId);
    
    console.log('[CLAIM-INTELLIGENCE] Intelligence logging complete');
    
  } catch (error) {
    console.error('[CLAIM-INTELLIGENCE] Error logging intelligence:', error);
  }
}

/**
 * Log claim recovery pattern
 */
async function logClaimRecoveryPattern(data: ClaimIntelligenceData): Promise<void> {
  const client = getSupabaseClient();
  if (!client) {
    return;
  }
  
  try {
    const estimateValue = data.estimate.totals.rcv;
    const reconstructedValue = data.reconstruction?.reconstructedValue || estimateValue;
    const underpaymentGap = data.recovery.totalRecoveryValue;
    const recoveryPercentage = estimateValue > 0 ? (underpaymentGap / estimateValue) * 100 : 0;
    
    await (client as any)
      .from('claim_recovery_patterns')
      .insert({
        report_id: data.reportId,
        claim_type: data.claimType,
        carrier: data.carrier,
        state: data.state,
        estimate_value: estimateValue,
        reconstructed_value: reconstructedValue,
        underpayment_gap: underpaymentGap,
        recovery_percentage: recoveryPercentage,
        issues_detected: data.issues.map(i => ({
          type: i.type,
          severity: i.severity,
          impact: i.financialImpact,
        })),
      });
    
    console.log(`[CLAIM-INTELLIGENCE] Logged recovery pattern: $${underpaymentGap.toFixed(2)} gap`);
    
  } catch (error) {
    console.error('[CLAIM-INTELLIGENCE] Error logging recovery pattern:', error);
  }
}

/**
 * Store reconstructed estimate
 */
async function storeReconstructedEstimate(
  reportId: string,
  reconstruction: ReconstructedEstimate
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) {
    return;
  }
  
  try {
    await (client as any)
      .from('reconstructed_estimates')
      .insert({
        report_id: reportId,
        original_value: reconstruction.originalValue,
        reconstructed_value: reconstruction.reconstructedValue,
        gap_value: reconstruction.gapValue,
        missing_line_items: reconstruction.missingLineItems,
        reconstruction_methodology: reconstruction.methodology,
        confidence_score: reconstruction.confidenceScore,
      });
    
    // Also update reports table
    await (client as any)
      .from('reports')
      .update({
        reconstructed_value: reconstruction.reconstructedValue,
        recovery_opportunity: reconstruction.gapValue,
        scope_reconstruction_data: {
          missingItems: reconstruction.missingLineItems.length,
          gapPercentage: reconstruction.gapPercentage,
          confidence: reconstruction.confidenceScore,
        },
      })
      .eq('id', reportId);
    
    console.log(`[CLAIM-INTELLIGENCE] Stored reconstructed estimate`);
    
  } catch (error) {
    console.error('[CLAIM-INTELLIGENCE] Error storing reconstruction:', error);
  }
}

/**
 * Mark report as intelligence logged
 */
async function markIntelligenceLogged(reportId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) {
    return;
  }
  
  try {
    await (client as any)
      .from('reports')
      .update({ carrier_pattern_logged: true })
      .eq('id', reportId);
  } catch (error) {
    console.error('[CLAIM-INTELLIGENCE] Error marking logged:', error);
  }
}

/**
 * Extract pricing issues for pattern logging
 */
function extractPricingIssues(
  issues: ClaimIssue[],
  estimate: StandardizedEstimate
): Array<{
  lineItemCode: string;
  description: string;
  expectedPrice: number;
  observedPrice: number;
}> {
  const pricingIssues = issues.filter(i => i.type.includes('pricing'));
  const extracted: Array<any> = [];
  
  for (const issue of pricingIssues) {
    if (issue.lineItemsAffected && issue.lineItemsAffected.length > 0) {
      for (const lineNum of issue.lineItemsAffected) {
        const lineItem = estimate.lineItems.find(li => li.lineNumber === lineNum);
        if (lineItem && issue.financialImpact) {
          // Estimate expected price from financial impact
          const observedPrice = lineItem.unitPrice;
          const expectedPrice = issue.type.includes('under') 
            ? observedPrice + (issue.financialImpact / lineItem.quantity)
            : observedPrice - (issue.financialImpact / lineItem.quantity);
          
          extracted.push({
            lineItemCode: lineItem.tradeCode,
            description: lineItem.description,
            expectedPrice,
            observedPrice,
          });
        }
      }
    }
  }
  
  return extracted;
}

/**
 * Extract labor issues for pattern logging
 */
function extractLaborIssues(
  issues: ClaimIssue[],
  estimate: StandardizedEstimate
): Array<{
  tradeType: string;
  industryRate: number;
  carrierRate: number;
}> {
  const laborIssues = issues.filter(i => i.type.includes('labor'));
  const extracted: Array<any> = [];
  
  for (const issue of laborIssues) {
    if (issue.lineItemsAffected && issue.lineItemsAffected.length > 0) {
      for (const lineNum of issue.lineItemsAffected) {
        const lineItem = estimate.lineItems.find(li => li.lineNumber === lineNum);
        if (lineItem && issue.financialImpact) {
          // Determine trade type from description
          const tradeType = determineTradeType(lineItem.description);
          
          // Estimate rates
          const carrierRate = lineItem.unitPrice;
          const industryRate = carrierRate + (issue.financialImpact / lineItem.quantity);
          
          extracted.push({
            tradeType,
            industryRate,
            carrierRate,
          });
        }
      }
    }
  }
  
  return extracted;
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
 * Get intelligence summary for carrier
 */
export async function getCarrierIntelligenceSummary(carrier: string): Promise<string> {
  const client = getSupabaseClient();
  if (!client) {
    return 'Intelligence data not available';
  }
  
  try {
    // Get carrier stats
    const { data: patterns } = await (client as any)
      .from('carrier_behavior_patterns')
      .select('*')
      .eq('carrier_name', carrier);
    
    const { data: recoveries } = await (client as any)
      .from('claim_recovery_patterns')
      .select('underpayment_gap')
      .eq('carrier', carrier);
    
    if (!patterns || patterns.length === 0) {
      return `No historical data available for ${carrier}`;
    }
    
    const avgGap = recoveries && recoveries.length > 0
      ? recoveries.reduce((sum: number, r: any) => sum + (r.underpayment_gap || 0), 0) / recoveries.length
      : 0;
    
    let summary = `CARRIER INTELLIGENCE: ${carrier}\n`;
    summary += `- Claims analyzed: ${recoveries?.length || 0}\n`;
    summary += `- Average underpayment: $${avgGap.toFixed(2)}\n`;
    summary += `- Common tactics:\n`;
    
    for (const pattern of patterns.slice(0, 5)) {
      summary += `  • ${pattern.issue_type}: ${pattern.frequency}% frequency, $${pattern.average_gap} avg gap\n`;
    }
    
    return summary;
    
  } catch (error) {
    console.error('[CLAIM-INTELLIGENCE] Error fetching summary:', error);
    return 'Error retrieving intelligence data';
  }
}
