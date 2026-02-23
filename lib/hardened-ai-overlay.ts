/**
 * HARDENED AI OVERLAY
 * Temperature = 0.0, 3 retries, 15s timeout, strict JSON schema
 * Receives structured JSON only, returns structured observations only
 * NO negotiation, NO legal advice, NO advocacy
 */

import { StructuredEstimate } from './xactimate-structural-parser';

export interface AIObservations {
  structuralObservations: string[];
  patternObservations: string[];
  neutralSummary: string;
}

export interface AIOverlayResult {
  observations: AIObservations;
  status: 'SUCCESS' | 'FALLBACK' | 'SKIPPED';
  metadata: {
    attempts: number;
    durationMs: number;
    model: string;
    temperature: number;
  };
}

/**
 * Timeout wrapper
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`AI call timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

/**
 * Retry with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  timeoutMs: number = 15000
): Promise<{ result: T; attempts: number; durationMs: number }> {
  const startTime = Date.now();
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[AI] Attempt ${attempt}/${maxAttempts}`);
      const result = await withTimeout(fn(), timeoutMs);
      const durationMs = Date.now() - startTime;
      
      return { result, attempts: attempt, durationMs };
      
    } catch (error: any) {
      lastError = error;
      console.error(`[AI] Attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxAttempts) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`[AI] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('AI call failed after retries');
}

/**
 * Validate AI response schema
 */
function validateAISchema(data: any): AIObservations {
  if (!data || typeof data !== 'object') {
    throw new Error('AI response is not an object');
  }
  
  if (!Array.isArray(data.structuralObservations)) {
    throw new Error('Missing or invalid structuralObservations array');
  }
  
  if (!Array.isArray(data.patternObservations)) {
    throw new Error('Missing or invalid patternObservations array');
  }
  
  if (typeof data.neutralSummary !== 'string' || data.neutralSummary.length < 10) {
    throw new Error('Missing or invalid neutralSummary');
  }
  
  // Validate no prohibited language
  const prohibited = [
    'should', 'must', 'recommend', 'advise', 'negotiate', 'demand',
    'entitled', 'owed', 'deserve', 'bad faith', 'lawsuit', 'sue'
  ];
  
  const allText = [
    ...data.structuralObservations,
    ...data.patternObservations,
    data.neutralSummary
  ].join(' ').toLowerCase();
  
  const foundProhibited = prohibited.filter(word => allText.includes(word));
  
  if (foundProhibited.length > 0) {
    throw new Error(`AI output contains prohibited language: ${foundProhibited.join(', ')}`);
  }
  
  return {
    structuralObservations: data.structuralObservations,
    patternObservations: data.patternObservations,
    neutralSummary: data.neutralSummary
  };
}

/**
 * Generate fallback observations
 */
function generateFallbackObservations(estimate: StructuredEstimate): AIObservations {
  return {
    structuralObservations: [
      `Estimate contains ${estimate.lineItems.length} line items`,
      `Total RCV: $${estimate.totals.rcv.toLocaleString()}`,
      `Parse confidence: ${(estimate.parseConfidence * 100).toFixed(1)}%`
    ],
    patternObservations: [
      'AI analysis unavailable - deterministic findings provided'
    ],
    neutralSummary: 'The estimate was analyzed using deterministic engines. AI overlay could not be generated. Review the structured findings for details.'
  };
}

/**
 * Call AI with hardened retry logic
 */
export async function generateAIOverlay(
  estimate: StructuredEstimate,
  openaiApiKey: string
): Promise<AIOverlayResult> {
  
  // Prepare structured input for AI
  const structuredInput = {
    lineItemCount: estimate.lineItems.length,
    totalRCV: estimate.totals.rcv,
    totalACV: estimate.totals.acv,
    trades: Array.from(new Set(estimate.lineItems.map(item => item.tradeCode))),
    parseConfidence: estimate.parseConfidence
  };
  
  const systemPrompt = `You are an insurance estimate analysis system. Your ONLY function is to provide neutral, factual observations about estimate structure.

STRICT RULES:
- NO recommendations or advice
- NO "should", "must", "entitled", "owed" language
- NO negotiation guidance
- NO legal interpretation
- NO coverage opinions
- State facts only

You will receive structured JSON data from a parsed estimate.

Return ONLY valid JSON with this structure:
{
  "structuralObservations": ["factual observation 1", "factual observation 2"],
  "patternObservations": ["pattern 1", "pattern 2"],
  "neutralSummary": "Brief neutral summary of the estimate structure"
}`;

  const userPrompt = `Analyze this structured estimate data and provide neutral observations:\n\n${JSON.stringify(structuredInput, null, 2)}`;
  
  try {
    // Dynamic import of OpenAI
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: openaiApiKey });
    
    // Call with retry logic
    const { result: completion, attempts, durationMs } = await retryWithBackoff(async () => {
      return await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        temperature: 0.0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1000
      });
    }, 3, 15000);
    
    // Parse and validate response
    const responseText = completion.choices[0]?.message?.content;
    
    if (!responseText) {
      throw new Error('Empty AI response');
    }
    
    // Remove markdown if present
    let cleaned = responseText.trim();
    cleaned = cleaned.replace(/^```json\s*/i, '');
    cleaned = cleaned.replace(/^```\s*/i, '');
    cleaned = cleaned.replace(/\s*```$/i, '');
    
    const parsed = JSON.parse(cleaned);
    const validated = validateAISchema(parsed);
    
    return {
      observations: validated,
      status: 'SUCCESS',
      metadata: {
        attempts,
        durationMs,
        model: completion.model,
        temperature: 0.0
      }
    };
    
  } catch (error: any) {
    console.error('[AI] Failed after retries:', error.message);
    
    // Use fallback
    return {
      observations: generateFallbackObservations(estimate),
      status: 'FALLBACK',
      metadata: {
        attempts: 3,
        durationMs: 0,
        model: 'fallback',
        temperature: 0.0
      }
    };
  }
}
