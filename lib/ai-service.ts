import OpenAI from 'openai';
import {
  AIAnalysisResponse,
  validateAIResponse,
  AIValidationError,
} from './ai-validation';
import {
  retryAICall,
  DEFAULT_RETRY_CONFIG,
  RetryConfig,
  AIRetryExhaustedError,
  aiCircuitBreaker,
} from './ai-retry';
import {
  FallbackStrategy,
  ResponseQualityChecker,
  RecoveryStrategies,
  generateFallbackResponse,
} from './ai-fallback';
import {
  AIMonitor,
  ErrorClassifier,
} from './ai-monitoring';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * AI Service Configuration
 */
export interface AIServiceConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  retryConfig: RetryConfig;
  enableCircuitBreaker: boolean;
  enableFallback: boolean;
}

export const DEFAULT_AI_CONFIG: AIServiceConfig = {
  model: 'gpt-4-turbo-preview',
  temperature: 0.0, // Deterministic
  maxTokens: 4000,
  retryConfig: DEFAULT_RETRY_CONFIG,
  enableCircuitBreaker: true,
  enableFallback: true,
};

/**
 * Hardened AI Service
 * Production-grade AI wrapper with validation, retry, and fallback
 */
export class HardenedAIService {
  constructor(private config: AIServiceConfig = DEFAULT_AI_CONFIG) {}

  /**
   * Analyze estimate with full error handling
   */
  async analyzeEstimate(
    estimateText: string,
    estimateType: string,
    damageType: string,
    userId: string,
    estimateName: string
  ): Promise<AIAnalysisResponse> {
    const requestId = this.generateRequestId();

    // Start monitoring
    const startMetric = AIMonitor.startCall(
      requestId,
      userId,
      estimateName,
      1,
      this.config.retryConfig.maxAttempts
    );

    try {
      // Execute with circuit breaker if enabled
      if (this.config.enableCircuitBreaker) {
        return await aiCircuitBreaker.execute(() =>
          this.executeAnalysisWithRetry(
            estimateText,
            estimateType,
            damageType,
            requestId,
            userId,
            estimateName
          )
        );
      } else {
        return await this.executeAnalysisWithRetry(
          estimateText,
          estimateType,
          damageType,
          requestId,
          userId,
          estimateName
        );
      }
    } catch (error) {
      // Log failure
      const err = error as Error;
      const classified = ErrorClassifier.classify(err);

      AIMonitor.logFailure(requestId, err, []);

      // If fallback enabled, return safe response
      if (this.config.enableFallback) {
        console.warn('AI analysis failed - using fallback response', {
          requestId,
          error: err.message,
          errorCategory: classified.category,
        });

        return generateFallbackResponse({
          estimateName,
          estimateType,
          damageType,
          errorMessage: err.message,
        });
      }

      // Otherwise, rethrow
      throw err;
    }
  }

  /**
   * Execute analysis with retry logic
   */
  private async executeAnalysisWithRetry(
    estimateText: string,
    estimateType: string,
    damageType: string,
    requestId: string,
    userId: string,
    estimateName: string
  ): Promise<AIAnalysisResponse> {
    let attemptNumber = 0;
    let lastRawResponse: any = null;

    const result = await retryAICall(
      async () => {
        attemptNumber++;

        // Update monitoring
        AIMonitor.startCall(
          requestId,
          userId,
          estimateName,
          attemptNumber,
          this.config.retryConfig.maxAttempts
        );

        // Call OpenAI
        const rawResponse = await this.callOpenAI(
          estimateText,
          estimateType,
          damageType,
          attemptNumber
        );

        lastRawResponse = rawResponse;

        // Parse JSON if needed
        const parsed = this.parseResponse(rawResponse);

        // Validate structure
        const validated = validateAIResponse(parsed);

        // Check quality
        const qualityCheck = ResponseQualityChecker.checkQuality(validated);

        if (!qualityCheck.isHighQuality && attemptNumber < this.config.retryConfig.maxAttempts) {
          console.warn('Low quality response, retrying...', {
            warnings: qualityCheck.warnings,
            attempt: attemptNumber,
          });

          throw new AIValidationError(
            `Low quality response: ${qualityCheck.warnings.join(', ')}`,
            null,
            validated
          );
        }

        // Success - log metrics
        AIMonitor.logSuccess(
          requestId,
          validated.classification.confidence,
          validated.metadata.model_version,
          qualityCheck.warnings
        );

        return validated;
      },
      this.config.retryConfig
    );

    return result;
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(
    estimateText: string,
    estimateType: string,
    damageType: string,
    attemptNumber: number
  ): Promise<any> {
    const prompt = this.buildPrompt(estimateText, estimateType, damageType, attemptNumber);

    const response = await openai.chat.completions.create({
      model: this.config.model,
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
      response_format: { type: 'json_object' }, // Force JSON output
      messages: [
        {
          role: 'system',
          content: 'You are a deterministic estimate analysis engine. Return ONLY valid JSON. No markdown, no explanations.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    return content;
  }

  /**
   * Build AI prompt (adjust based on attempt number)
   */
  private buildPrompt(
    estimateText: string,
    estimateType: string,
    damageType: string,
    attemptNumber: number
  ): string {
    let basePrompt = `Analyze this ${damageType} damage estimate for ${estimateType} property.

Estimate text:
${estimateText}

Return a structured JSON response with:
- classification (type, confidence, platform)
- detected_trades (array of trade categories found)
- missing_items (array of categories not detected)
- quantity_issues (array of quantity inconsistencies)
- structural_gaps (array of structural problems)
- summary (plain English summary)
- metadata (processing time, model version, timestamp)

Use deterministic analysis. No subjective opinions. Structured findings only.`;

    // Adjust prompt based on retry attempt
    if (attemptNumber === 2) {
      basePrompt = RecoveryStrategies.simplifyPrompt(basePrompt);
    } else if (attemptNumber >= 3) {
      basePrompt = RecoveryStrategies.enforceJSONFormat(basePrompt);
    }

    return basePrompt;
  }

  /**
   * Parse response (handle various formats)
   */
  private parseResponse(rawResponse: any): any {
    // If already object, return
    if (typeof rawResponse === 'object' && rawResponse !== null) {
      return rawResponse;
    }

    // If string, try to parse JSON
    if (typeof rawResponse === 'string') {
      // Remove markdown code blocks if present
      let cleaned = rawResponse.trim();
      cleaned = cleaned.replace(/^```json\s*/i, '');
      cleaned = cleaned.replace(/^```\s*/i, '');
      cleaned = cleaned.replace(/\s*```$/i, '');
      cleaned = cleaned.trim();

      try {
        return JSON.parse(cleaned);
      } catch (error) {
        throw new AIValidationError(
          'Failed to parse AI response as JSON',
          null,
          rawResponse
        );
      }
    }

    throw new AIValidationError(
      'AI response is not a valid format',
      null,
      rawResponse
    );
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Global hardened AI service instance
 */
export const aiService = new HardenedAIService();

/**
 * Convenience function for estimate analysis
 */
export async function analyzeEstimateWithRetry(
  estimateText: string,
  estimateType: string,
  damageType: string,
  userId: string,
  estimateName: string
): Promise<AIAnalysisResponse> {
  return aiService.analyzeEstimate(
    estimateText,
    estimateType,
    damageType,
    userId,
    estimateName
  );
}
