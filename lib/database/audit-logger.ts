/**
 * DATABASE AUDIT LOGGER
 * Persists audit events and AI decisions to Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { AuditEvent, ClaimIssue } from '../../types/claim-engine';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabase && supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

/**
 * Log audit events to database
 */
export async function logAuditEvents(
  reportId: string,
  events: AuditEvent[]
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) {
    console.warn('[AUDIT-LOGGER] Supabase not configured, skipping database logging');
    return;
  }
  
  try {
    const records = events.map(event => ({
      report_id: reportId,
      event_type: event.engine,
      event_data: {
        decision: event.decision,
        confidence: event.confidence,
        timestamp: event.timestamp,
        processingTimeMs: event.processingTimeMs,
        inputData: event.inputData,
        outputData: event.outputData,
      },
      created_at: new Date(event.timestamp).toISOString(),
    }));
    
    const { error } = await client
      .from('audit_events')
      .insert(records);
    
    if (error) {
      console.error('[AUDIT-LOGGER] Failed to insert audit events:', error);
    } else {
      console.log(`[AUDIT-LOGGER] Logged ${records.length} audit events for report ${reportId}`);
    }
  } catch (error) {
    console.error('[AUDIT-LOGGER] Error logging audit events:', error);
  }
}

/**
 * Log AI decisions to database
 */
export async function logAIDecisions(
  reportId: string,
  events: AuditEvent[]
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) {
    console.warn('[AUDIT-LOGGER] Supabase not configured, skipping AI decision logging');
    return;
  }
  
  try {
    const records = events
      .filter(event => event.confidence !== undefined)
      .map(event => ({
        report_id: reportId,
        engine_name: event.engine,
        decision_type: 'analysis',
        input_data: event.inputData || {},
        output_data: event.outputData || {},
        confidence_score: event.confidence,
        model_used: 'gpt-4',
        processing_time_ms: event.processingTimeMs || 0,
        created_at: new Date(event.timestamp).toISOString(),
      }));
    
    if (records.length === 0) {
      return;
    }
    
    const { error } = await client
      .from('ai_decisions')
      .insert(records);
    
    if (error) {
      console.error('[AUDIT-LOGGER] Failed to insert AI decisions:', error);
    } else {
      console.log(`[AUDIT-LOGGER] Logged ${records.length} AI decisions for report ${reportId}`);
    }
  } catch (error) {
    console.error('[AUDIT-LOGGER] Error logging AI decisions:', error);
  }
}

/**
 * Update report with intelligence summary
 */
export async function updateReportWithIntelligence(
  reportId: string,
  issues: ClaimIssue[],
  summary: any
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) {
    console.warn('[AUDIT-LOGGER] Supabase not configured, skipping report update');
    return;
  }
  
  try {
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    const totalFinancialImpact = issues.reduce((sum, i) => sum + (i.financialImpact || 0), 0);
    
    const { error } = await client
      .from('reports')
      .update({
        intelligence_issues: issues,
        intelligence_summary: summary,
        critical_issues_count: criticalIssues,
        high_issues_count: highIssues,
        total_financial_impact: totalFinancialImpact,
        intelligence_processed_at: new Date().toISOString(),
      })
      .eq('id', reportId);
    
    if (error) {
      console.error('[AUDIT-LOGGER] Failed to update report:', error);
    } else {
      console.log(`[AUDIT-LOGGER] Updated report ${reportId} with intelligence data`);
    }
  } catch (error) {
    console.error('[AUDIT-LOGGER] Error updating report:', error);
  }
}

/**
 * Log complete pipeline execution
 */
export async function logPipelineExecution(
  reportId: string,
  events: AuditEvent[],
  issues: ClaimIssue[],
  summary: any
): Promise<void> {
  await Promise.all([
    logAuditEvents(reportId, events),
    logAIDecisions(reportId, events),
    updateReportWithIntelligence(reportId, issues, summary),
  ]);
}
