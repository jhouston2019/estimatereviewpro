/**
 * ENHANCED AUDIT TRAIL SYSTEM
 * Comprehensive event logging with AI decision tracing
 * Provides full transparency and debugging capabilities
 */

export interface AuditEvent {
  id: string;
  reportId: string;
  eventType: 'parse' | 'match' | 'ai_decision' | 'exposure_calc' | 'pricing_validation' | 
             'depreciation_validation' | 'labor_validation' | 'carrier_tactic_detection' | 'other';
  timestamp: Date;
  engineName: string;
  inputData: any;
  outputData: any;
  confidenceScore?: number;
  processingTimeMs: number;
  metadata?: Record<string, any>;
}

export interface AIDecision {
  id: string;
  reportId: string;
  decisionType: 'semantic_match' | 'insight_generation' | 'classification' | 'other';
  inputPrompt: string;
  aiResponse: any;
  confidence: number;
  fallbackUsed: boolean;
  timestamp: Date;
  model: string;
  temperature: number;
  tokensUsed?: number;
  costUsd?: number;
}

export interface AuditTrailResult {
  events: AuditEvent[];
  aiDecisions: AIDecision[];
  summary: {
    totalEvents: number;
    totalAIDecisions: number;
    totalProcessingTime: number;
    enginesUsed: string[];
    aiCostTotal: number;
  };
}

/**
 * Audit trail manager class
 */
export class AuditTrailManager {
  private events: AuditEvent[] = [];
  private aiDecisions: AIDecision[] = [];
  private reportId: string;
  
  constructor(reportId: string) {
    this.reportId = reportId;
  }
  
  /**
   * Log a processing event
   */
  logEvent(
    eventType: AuditEvent['eventType'],
    engineName: string,
    inputData: any,
    outputData: any,
    processingTimeMs: number,
    confidenceScore?: number,
    metadata?: Record<string, any>
  ): void {
    
    const event: AuditEvent = {
      id: generateId(),
      reportId: this.reportId,
      eventType,
      timestamp: new Date(),
      engineName,
      inputData: sanitizeForLogging(inputData),
      outputData: sanitizeForLogging(outputData),
      confidenceScore,
      processingTimeMs,
      metadata,
    };
    
    this.events.push(event);
    
    console.log(`[AUDIT] Event logged: ${eventType} - ${engineName} (${processingTimeMs}ms)`);
  }
  
  /**
   * Log an AI decision
   */
  logAIDecision(
    decisionType: AIDecision['decisionType'],
    inputPrompt: string,
    aiResponse: any,
    confidence: number,
    fallbackUsed: boolean,
    model: string,
    temperature: number,
    tokensUsed?: number,
    costUsd?: number
  ): void {
    
    const decision: AIDecision = {
      id: generateId(),
      reportId: this.reportId,
      decisionType,
      inputPrompt: truncatePrompt(inputPrompt),
      aiResponse: sanitizeForLogging(aiResponse),
      confidence,
      fallbackUsed,
      timestamp: new Date(),
      model,
      temperature,
      tokensUsed,
      costUsd,
    };
    
    this.aiDecisions.push(decision);
    
    console.log(`[AUDIT] AI decision logged: ${decisionType} - ${model} (fallback: ${fallbackUsed})`);
  }
  
  /**
   * Get complete audit trail
   */
  getAuditTrail(): AuditTrailResult {
    const enginesUsed = [...new Set(this.events.map(e => e.engineName))];
    const totalProcessingTime = this.events.reduce((sum, e) => sum + e.processingTimeMs, 0);
    const aiCostTotal = this.aiDecisions.reduce((sum, d) => sum + (d.costUsd || 0), 0);
    
    return {
      events: this.events,
      aiDecisions: this.aiDecisions,
      summary: {
        totalEvents: this.events.length,
        totalAIDecisions: this.aiDecisions.length,
        totalProcessingTime,
        enginesUsed,
        aiCostTotal,
      },
    };
  }
  
  /**
   * Export audit trail as JSON
   */
  exportJSON(): string {
    return JSON.stringify(this.getAuditTrail(), null, 2);
  }
  
  /**
   * Export audit trail as text
   */
  exportText(): string {
    const trail = this.getAuditTrail();
    
    let output = `AUDIT TRAIL REPORT\n`;
    output += `${'='.repeat(80)}\n\n`;
    
    output += `SUMMARY:\n`;
    output += `- Total events: ${trail.summary.totalEvents}\n`;
    output += `- Total AI decisions: ${trail.summary.totalAIDecisions}\n`;
    output += `- Total processing time: ${trail.summary.totalProcessingTime}ms\n`;
    output += `- Engines used: ${trail.summary.enginesUsed.join(', ')}\n`;
    output += `- AI cost: $${trail.summary.aiCostTotal.toFixed(4)}\n\n`;
    
    output += `PROCESSING EVENTS:\n`;
    output += `${'-'.repeat(80)}\n`;
    for (const event of trail.events) {
      output += `[${event.timestamp.toISOString()}] ${event.engineName}\n`;
      output += `  Type: ${event.eventType}\n`;
      output += `  Processing time: ${event.processingTimeMs}ms\n`;
      if (event.confidenceScore) {
        output += `  Confidence: ${event.confidenceScore}\n`;
      }
      output += `\n`;
    }
    
    if (trail.aiDecisions.length > 0) {
      output += `AI DECISIONS:\n`;
      output += `${'-'.repeat(80)}\n`;
      for (const decision of trail.aiDecisions) {
        output += `[${decision.timestamp.toISOString()}] ${decision.decisionType}\n`;
        output += `  Model: ${decision.model}\n`;
        output += `  Temperature: ${decision.temperature}\n`;
        output += `  Confidence: ${decision.confidence}\n`;
        output += `  Fallback used: ${decision.fallbackUsed}\n`;
        if (decision.tokensUsed) {
          output += `  Tokens: ${decision.tokensUsed}\n`;
        }
        if (decision.costUsd) {
          output += `  Cost: $${decision.costUsd.toFixed(4)}\n`;
        }
        output += `\n`;
      }
    }
    
    return output;
  }
  
  /**
   * Save audit trail to database
   */
  async saveToDatabase(supabaseClient: any): Promise<void> {
    const trail = this.getAuditTrail();
    
    // Insert audit events
    if (trail.events.length > 0) {
      const { error: eventsError } = await supabaseClient
        .from('audit_events')
        .insert(
          trail.events.map(event => ({
            report_id: event.reportId,
            event_type: event.eventType,
            timestamp: event.timestamp,
            engine_name: event.engineName,
            input_data: event.inputData,
            output_data: event.outputData,
            confidence_score: event.confidenceScore,
            processing_time_ms: event.processingTimeMs,
            metadata: event.metadata,
          }))
        );
      
      if (eventsError) {
        console.error('[AUDIT] Failed to save events:', eventsError);
      } else {
        console.log(`[AUDIT] Saved ${trail.events.length} events to database`);
      }
    }
    
    // Insert AI decisions
    if (trail.aiDecisions.length > 0) {
      const { error: decisionsError } = await supabaseClient
        .from('ai_decisions')
        .insert(
          trail.aiDecisions.map(decision => ({
            report_id: decision.reportId,
            decision_type: decision.decisionType,
            input_prompt: decision.inputPrompt,
            ai_response: decision.aiResponse,
            confidence: decision.confidence,
            fallback_used: decision.fallbackUsed,
            timestamp: decision.timestamp,
            model: decision.model,
            temperature: decision.temperature,
            tokens_used: decision.tokensUsed,
            cost_usd: decision.costUsd,
          }))
        );
      
      if (decisionsError) {
        console.error('[AUDIT] Failed to save AI decisions:', decisionsError);
      } else {
        console.log(`[AUDIT] Saved ${trail.aiDecisions.length} AI decisions to database`);
      }
    }
  }
}

/**
 * Helper: Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Helper: Sanitize data for logging (remove sensitive info, limit size)
 */
function sanitizeForLogging(data: any): any {
  if (!data) return null;
  
  // Convert to string and check size
  const str = JSON.stringify(data);
  
  // Limit to 10KB
  if (str.length > 10000) {
    return {
      _truncated: true,
      _originalSize: str.length,
      _preview: str.substring(0, 1000) + '...',
    };
  }
  
  return data;
}

/**
 * Helper: Truncate prompt for logging
 */
function truncatePrompt(prompt: string): string {
  if (prompt.length > 2000) {
    return prompt.substring(0, 2000) + '... [truncated]';
  }
  return prompt;
}

/**
 * Create audit trail manager for a report
 */
export function createAuditTrail(reportId: string): AuditTrailManager {
  return new AuditTrailManager(reportId);
}

/**
 * Load audit trail from database
 */
export async function loadAuditTrail(reportId: string, supabaseClient: any): Promise<AuditTrailResult> {
  // Load events
  const { data: events, error: eventsError } = await supabaseClient
    .from('audit_events')
    .select('*')
    .eq('report_id', reportId)
    .order('timestamp', { ascending: true });
  
  if (eventsError) {
    console.error('[AUDIT] Failed to load events:', eventsError);
  }
  
  // Load AI decisions
  const { data: decisions, error: decisionsError } = await supabaseClient
    .from('ai_decisions')
    .select('*')
    .eq('report_id', reportId)
    .order('timestamp', { ascending: true });
  
  if (decisionsError) {
    console.error('[AUDIT] Failed to load AI decisions:', decisionsError);
  }
  
  const auditEvents: AuditEvent[] = (events || []).map(e => ({
    id: e.id,
    reportId: e.report_id,
    eventType: e.event_type,
    timestamp: new Date(e.timestamp),
    engineName: e.engine_name,
    inputData: e.input_data,
    outputData: e.output_data,
    confidenceScore: e.confidence_score,
    processingTimeMs: e.processing_time_ms,
    metadata: e.metadata,
  }));
  
  const aiDecisions: AIDecision[] = (decisions || []).map(d => ({
    id: d.id,
    reportId: d.report_id,
    decisionType: d.decision_type,
    inputPrompt: d.input_prompt,
    aiResponse: d.ai_response,
    confidence: d.confidence,
    fallbackUsed: d.fallback_used,
    timestamp: new Date(d.timestamp),
    model: d.model,
    temperature: d.temperature,
    tokensUsed: d.tokens_used,
    costUsd: d.cost_usd,
  }));
  
  const enginesUsed = [...new Set(auditEvents.map(e => e.engineName))];
  const totalProcessingTime = auditEvents.reduce((sum, e) => sum + e.processingTimeMs, 0);
  const aiCostTotal = aiDecisions.reduce((sum, d) => sum + (d.costUsd || 0), 0);
  
  return {
    events: auditEvents,
    aiDecisions,
    summary: {
      totalEvents: auditEvents.length,
      totalAIDecisions: aiDecisions.length,
      totalProcessingTime,
      enginesUsed,
      aiCostTotal,
    },
  };
}
