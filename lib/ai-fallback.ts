import { AIAnalysisResponse } from './ai-validation';

/**
 * Fallback Response Generator
 * Provides safe fallback responses when AI fails completely
 */

export interface FallbackOptions {
  estimateName: string;
  estimateType?: string;
  damageType?: string;
  lineItemCount?: number;
  errorMessage: string;
}

/**
 * Generate safe fallback response
 * Used when AI fails after all retries
 */
export function generateFallbackResponse(options: FallbackOptions): AIAnalysisResponse {
  const timestamp = new Date().toISOString();

  return {
    classification: {
      classification: 'UNKNOWN',
      confidence: 0,
      platform: 'Unable to detect',
      metadata: {
        detected_format: 'FALLBACK_MODE',
        line_item_count: options.lineItemCount || 0,
        trade_codes_found: [],
      },
    },
    detected_trades: [],
    missing_items: [],
    quantity_issues: [],
    structural_gaps: [],
    summary: `Analysis could not be completed due to a technical error. The system attempted to process the estimate "${options.estimateName}" but encountered an issue. Please try again or contact support if the problem persists. Error: ${options.errorMessage}`,
    metadata: {
      processing_time_ms: 0,
      model_version: 'FALLBACK',
      timestamp,
    },
  };
}

/**
 * Partial Success Fallback
 * Used when AI returns partial data
 */
export function generatePartialSuccessResponse(
  partialData: Partial<AIAnalysisResponse>,
  options: FallbackOptions
): AIAnalysisResponse {
  const timestamp = new Date().toISOString();

  return {
    classification: partialData.classification || {
      classification: 'UNKNOWN',
      confidence: 0,
    },
    detected_trades: partialData.detected_trades || [],
    missing_items: partialData.missing_items || [],
    quantity_issues: partialData.quantity_issues || [],
    structural_gaps: partialData.structural_gaps || [],
    summary: partialData.summary || `Partial analysis completed for "${options.estimateName}". Some data may be incomplete. ${options.errorMessage}`,
    metadata: partialData.metadata || {
      processing_time_ms: 0,
      model_version: 'PARTIAL',
      timestamp,
    },
  };
}

/**
 * Graceful Degradation Strategy
 */
export class FallbackStrategy {
  /**
   * Try to extract any useful data from malformed response
   */
  static extractPartialData(rawResponse: any): Partial<AIAnalysisResponse> {
    const partial: Partial<AIAnalysisResponse> = {};

    try {
      // Try to extract classification
      if (rawResponse?.classification) {
        partial.classification = {
          classification: rawResponse.classification.classification || 'UNKNOWN',
          confidence: rawResponse.classification.confidence || 0,
        };
      }

      // Try to extract detected trades
      if (Array.isArray(rawResponse?.detected_trades)) {
        partial.detected_trades = rawResponse.detected_trades.filter(
          (trade: any) => trade?.code && trade?.name
        );
      }

      // Try to extract missing items
      if (Array.isArray(rawResponse?.missing_items)) {
        partial.missing_items = rawResponse.missing_items.filter(
          (item: any) => item?.category && item?.description
        );
      }

      // Try to extract summary
      if (typeof rawResponse?.summary === 'string' && rawResponse.summary.length > 0) {
        partial.summary = rawResponse.summary;
      }
    } catch (error) {
      console.error('Failed to extract partial data:', error);
    }

    return partial;
  }

  /**
   * Determine if partial data is usable
   */
  static isPartialDataUsable(partial: Partial<AIAnalysisResponse>): boolean {
    // At minimum, we need a summary or some detected trades
    return !!(
      partial.summary ||
      (partial.detected_trades && partial.detected_trades.length > 0) ||
      (partial.missing_items && partial.missing_items.length > 0)
    );
  }

  /**
   * Handle AI failure with graceful degradation
   */
  static handleFailure(
    rawResponse: any,
    error: Error,
    options: FallbackOptions
  ): AIAnalysisResponse {
    // Try to extract partial data
    const partialData = this.extractPartialData(rawResponse);

    // If partial data is usable, return partial success
    if (this.isPartialDataUsable(partialData)) {
      console.warn('AI response incomplete - using partial data', {
        hasClassification: !!partialData.classification,
        hasTrades: !!partialData.detected_trades?.length,
        hasSummary: !!partialData.summary,
      });

      return generatePartialSuccessResponse(partialData, {
        ...options,
        errorMessage: `Partial data recovered: ${error.message}`,
      });
    }

    // Complete failure - return safe fallback
    console.error('AI response completely failed - using fallback', {
      error: error.message,
      estimateName: options.estimateName,
    });

    return generateFallbackResponse(options);
  }
}

/**
 * Response Quality Checker
 */
export class ResponseQualityChecker {
  /**
   * Check if response meets minimum quality standards
   */
  static checkQuality(response: AIAnalysisResponse): {
    isHighQuality: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];

    // Check classification confidence
    if (response.classification.confidence < 75) {
      warnings.push(`Low classification confidence: ${response.classification.confidence}%`);
    }

    // Check if summary is too short
    if (response.summary.length < 50) {
      warnings.push('Summary is too short');
    }

    // Check if no trades detected (suspicious)
    if (response.detected_trades.length === 0) {
      warnings.push('No trades detected - may indicate parsing failure');
    }

    // Check if metadata is missing
    if (!response.metadata?.model_version || !response.metadata?.timestamp) {
      warnings.push('Metadata incomplete');
    }

    const isHighQuality = warnings.length === 0;

    return { isHighQuality, warnings };
  }

  /**
   * Validate response completeness
   */
  static isComplete(response: AIAnalysisResponse): boolean {
    return !!(
      response.classification &&
      response.summary &&
      response.metadata &&
      (response.detected_trades.length > 0 ||
        response.missing_items.length > 0 ||
        response.quantity_issues.length > 0)
    );
  }
}

/**
 * Error Recovery Strategies
 */
export const RecoveryStrategies = {
  /**
   * Retry with simplified prompt
   */
  simplifyPrompt: (originalPrompt: string): string => {
    return `Analyze this estimate and return ONLY structured JSON. Focus on: classification, detected trades, and summary. ${originalPrompt}`;
  },

  /**
   * Retry with explicit JSON format instruction
   */
  enforceJSONFormat: (originalPrompt: string): string => {
    return `${originalPrompt}\n\nIMPORTANT: Return ONLY valid JSON. No markdown, no code blocks, no explanations. Start with { and end with }.`;
  },

  /**
   * Retry with temperature adjustment
   */
  adjustTemperature: (currentTemp: number): number => {
    // Lower temperature for more deterministic output
    return Math.max(0, currentTemp - 0.2);
  },
};
