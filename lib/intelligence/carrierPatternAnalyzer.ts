/**
 * CARRIER PATTERN INTELLIGENCE ENGINE
 * Aggregates issue data across claims to build carrier behavior intelligence
 */

import { ClaimIssue } from '../../types/claim-engine';
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

export interface CarrierBehaviorUpdate {
  carrier: string;
  issueType: string;
  gap: number;
  state: string;
}

/**
 * Update carrier behavior patterns
 */
export async function updateCarrierPatterns(
  carrier: string,
  state: string,
  issues: ClaimIssue[]
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) {
    console.warn('[CARRIER-PATTERNS] Supabase not configured, skipping pattern logging');
    return;
  }
  
  console.log(`[CARRIER-PATTERNS] Updating patterns for ${carrier}...`);
  
  try {
    // Group issues by type
    const issuesByType = issues.reduce((acc, issue) => {
      if (!acc[issue.type]) {
        acc[issue.type] = [];
      }
      acc[issue.type].push(issue);
      return acc;
    }, {} as Record<string, ClaimIssue[]>);
    
    // Update each issue type
    for (const [issueType, issuesOfType] of Object.entries(issuesByType)) {
      const totalGap = issuesOfType.reduce((sum, i) => sum + (i.financialImpact || 0), 0);
      
      // Check if pattern exists
      const { data: existing } = await (client as any)
        .from('carrier_behavior_patterns')
        .select('*')
        .eq('carrier_name', carrier)
        .eq('issue_type', issueType)
        .single();
      
      if (existing) {
        // Update existing pattern
        const newFrequency = existing.frequency + 1;
        const newTotalClaims = existing.total_claims_analyzed + 1;
        const newAverageGap = ((existing.average_gap * existing.total_claims_analyzed) + totalGap) / newTotalClaims;
        
        const states = existing.states_observed || [];
        if (!states.includes(state)) {
          states.push(state);
        }
        
        await (client as any)
          .from('carrier_behavior_patterns')
          .update({
            frequency: newFrequency,
            average_gap: newAverageGap,
            total_claims_analyzed: newTotalClaims,
            states_observed: states,
            last_seen: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        
        console.log(`[CARRIER-PATTERNS] Updated ${issueType} for ${carrier}`);
        
      } else {
        // Create new pattern
        await (client as any)
          .from('carrier_behavior_patterns')
          .insert({
            carrier_name: carrier,
            issue_type: issueType,
            frequency: 1,
            average_gap: totalGap,
            total_claims_analyzed: 1,
            states_observed: [state],
          });
        
        console.log(`[CARRIER-PATTERNS] Created new pattern ${issueType} for ${carrier}`);
      }
    }
    
  } catch (error) {
    console.error('[CARRIER-PATTERNS] Error updating patterns:', error);
  }
}

/**
 * Update scope gap patterns
 */
export async function updateScopeGapPatterns(
  carrier: string,
  region: string,
  missingItems: Array<{ tradeType: string; description: string; estimatedTotal: number }>
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) {
    return;
  }
  
  console.log(`[CARRIER-PATTERNS] Updating scope gap patterns...`);
  
  try {
    for (const item of missingItems) {
      // Check if pattern exists
      const { data: existing } = await (client as any)
        .from('scope_gap_patterns')
        .select('*')
        .eq('trade_type', item.tradeType)
        .eq('missing_item', item.description)
        .single();
      
      if (existing) {
        // Update existing
        const newFrequency = existing.frequency + 1;
        const newAvgCost = ((existing.average_cost_impact * existing.frequency) + item.estimatedTotal) / newFrequency;
        
        const carriers = existing.carriers_observed || [];
        if (!carriers.includes(carrier)) {
          carriers.push(carrier);
        }
        
        const regions = existing.regions_observed || [];
        if (!regions.includes(region)) {
          regions.push(region);
        }
        
        await (client as any)
          .from('scope_gap_patterns')
          .update({
            frequency: newFrequency,
            average_cost_impact: newAvgCost,
            carriers_observed: carriers,
            regions_observed: regions,
            last_seen: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        
      } else {
        // Create new
        await (client as any)
          .from('scope_gap_patterns')
          .insert({
            trade_type: item.tradeType,
            missing_item: item.description,
            frequency: 1,
            average_cost_impact: item.estimatedTotal,
            carriers_observed: [carrier],
            regions_observed: [region],
          });
      }
    }
    
    console.log(`[CARRIER-PATTERNS] Updated ${missingItems.length} scope gap patterns`);
    
  } catch (error) {
    console.error('[CARRIER-PATTERNS] Error updating scope patterns:', error);
  }
}

/**
 * Update pricing deviation patterns
 */
export async function updatePricingDeviationPatterns(
  carrier: string,
  region: string,
  pricingIssues: Array<{
    lineItemCode: string;
    description: string;
    expectedPrice: number;
    observedPrice: number;
  }>
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) {
    return;
  }
  
  console.log(`[CARRIER-PATTERNS] Updating pricing deviation patterns...`);
  
  try {
    for (const issue of pricingIssues) {
      const suppressionRate = ((issue.observedPrice - issue.expectedPrice) / issue.expectedPrice) * 100;
      
      // Check if pattern exists
      const { data: existing } = await (client as any)
        .from('pricing_deviation_patterns')
        .select('*')
        .eq('line_item_code', issue.lineItemCode)
        .eq('region', region)
        .eq('carrier', carrier)
        .single();
      
      if (existing) {
        // Update existing
        const newOccurrences = existing.occurrences + 1;
        const newAvgExpected = ((existing.expected_price * existing.occurrences) + issue.expectedPrice) / newOccurrences;
        const newAvgObserved = ((existing.observed_price * existing.occurrences) + issue.observedPrice) / newOccurrences;
        const newSuppressionRate = ((newAvgObserved - newAvgExpected) / newAvgExpected) * 100;
        
        await (client as any)
          .from('pricing_deviation_patterns')
          .update({
            expected_price: newAvgExpected,
            observed_price: newAvgObserved,
            suppression_rate: newSuppressionRate,
            occurrences: newOccurrences,
            last_updated: new Date().toISOString(),
          })
          .eq('id', existing.id);
        
      } else {
        // Create new
        await (client as any)
          .from('pricing_deviation_patterns')
          .insert({
            line_item_code: issue.lineItemCode,
            line_item_description: issue.description,
            expected_price: issue.expectedPrice,
            observed_price: issue.observedPrice,
            suppression_rate: suppressionRate,
            region,
            carrier,
            occurrences: 1,
          });
      }
    }
    
    console.log(`[CARRIER-PATTERNS] Updated ${pricingIssues.length} pricing patterns`);
    
  } catch (error) {
    console.error('[CARRIER-PATTERNS] Error updating pricing patterns:', error);
  }
}

/**
 * Update labor rate patterns
 */
export async function updateLaborRatePatterns(
  carrier: string,
  region: string,
  laborIssues: Array<{
    tradeType: string;
    industryRate: number;
    carrierRate: number;
  }>
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) {
    return;
  }
  
  console.log(`[CARRIER-PATTERNS] Updating labor rate patterns...`);
  
  try {
    for (const issue of laborIssues) {
      const suppressionPct = ((issue.carrierRate - issue.industryRate) / issue.industryRate) * 100;
      
      // Check if pattern exists
      const { data: existing } = await (client as any)
        .from('labor_rate_patterns')
        .select('*')
        .eq('region', region)
        .eq('trade_type', issue.tradeType)
        .eq('carrier', carrier)
        .single();
      
      if (existing) {
        // Update existing
        const newOccurrences = existing.occurrences + 1;
        const newAvgIndustry = ((existing.industry_rate * existing.occurrences) + issue.industryRate) / newOccurrences;
        const newAvgCarrier = ((existing.carrier_rate * existing.occurrences) + issue.carrierRate) / newOccurrences;
        const newSuppressionPct = ((newAvgCarrier - newAvgIndustry) / newAvgIndustry) * 100;
        
        await (client as any)
          .from('labor_rate_patterns')
          .update({
            industry_rate: newAvgIndustry,
            carrier_rate: newAvgCarrier,
            suppression_percentage: newSuppressionPct,
            occurrences: newOccurrences,
            last_seen: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        
      } else {
        // Create new
        await (client as any)
          .from('labor_rate_patterns')
          .insert({
            region,
            trade_type: issue.tradeType,
            industry_rate: issue.industryRate,
            carrier_rate: issue.carrierRate,
            suppression_percentage: suppressionPct,
            carrier,
            occurrences: 1,
          });
      }
    }
    
    console.log(`[CARRIER-PATTERNS] Updated ${laborIssues.length} labor patterns`);
    
  } catch (error) {
    console.error('[CARRIER-PATTERNS] Error updating labor patterns:', error);
  }
}

/**
 * Get carrier behavior statistics
 */
export async function getCarrierBehaviorStats(carrier: string): Promise<any> {
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }
  
  try {
    const { data, error } = await (client as any)
      .from('carrier_behavior_patterns')
      .select('*')
      .eq('carrier_name', carrier)
      .order('frequency', { ascending: false });
    
    if (error) {
      console.error('[CARRIER-PATTERNS] Error fetching stats:', error);
      return null;
    }
    
    return data;
    
  } catch (error) {
    console.error('[CARRIER-PATTERNS] Database error:', error);
    return null;
  }
}
