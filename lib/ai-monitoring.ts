/**
 * AI Monitoring & Error Logging
 * Tracks AI performance, failures, and quality metrics
 */

export interface AICallMetrics {
  requestId: string;
  userId: string;
  estimateName: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  attemptNumber: number;
  maxAttempts: number;
  success: boolean;
  error?: string;
  errorType?: string;
  validationErrors?: string[];
  qualityWarnings?: string[];
  confidence?: number;
  modelVersion?: string;
}

export interface AIPerformanceStats {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  successRate: number;
  averageDurationMs: number;
  timeoutCount: number;
  validationErrorCount: number;
  retryCount: number;
}

/**
 * AI Monitoring Service
 */
export class AIMonitor {
  private static metrics: AICallMetrics[] = [];
  private static readonly MAX_STORED_METRICS = 1000;

  /**
   * Log AI call start
   */
  static startCall(
    requestId: string,
    userId: string,
    estimateName: string,
    attemptNumber: number = 1,
    maxAttempts: number = 3
  ): AICallMetrics {
    const metric: AICallMetrics = {
      requestId,
      userId,
      estimateName,
      startTime: Date.now(),
      attemptNumber,
      maxAttempts,
      success: false,
    };

    this.metrics.push(metric);
    this.pruneMetrics();

    return metric;
  }

  /**
   * Log AI call success
   */
  static logSuccess(
    requestId: string,
    confidence: number,
    modelVersion: string,
    qualityWarnings: string[] = []
  ): void {
    const metric = this.findMetric(requestId);
    if (!metric) return;

    metric.endTime = Date.now();
    metric.durationMs = metric.endTime - metric.startTime;
    metric.success = true;
    metric.confidence = confidence;
    metric.modelVersion = modelVersion;
    metric.qualityWarnings = qualityWarnings;

    console.log('AI call successful', {
      requestId,
      durationMs: metric.durationMs,
      confidence,
      attemptNumber: metric.attemptNumber,
      qualityWarnings: qualityWarnings.length,
    });
  }

  /**
   * Log AI call failure
   */
  static logFailure(
    requestId: string,
    error: Error,
    validationErrors: string[] = []
  ): void {
    const metric = this.findMetric(requestId);
    if (!metric) return;

    metric.endTime = Date.now();
    metric.durationMs = metric.endTime - metric.startTime;
    metric.success = false;
    metric.error = error.message;
    metric.errorType = error.name;
    metric.validationErrors = validationErrors;

    console.error('AI call failed', {
      requestId,
      error: error.message,
      errorType: error.name,
      attemptNumber: metric.attemptNumber,
      validationErrors: validationErrors.length,
    });

    // Alert if critical failure
    if (metric.attemptNumber === metric.maxAttempts) {
      this.alertCriticalFailure(metric);
    }
  }

  /**
   * Get performance statistics
   */
  static getStats(): AIPerformanceStats {
    const totalCalls = this.metrics.length;
    const successfulCalls = this.metrics.filter((m) => m.success).length;
    const failedCalls = totalCalls - successfulCalls;
    const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0;

    const durations = this.metrics
      .filter((m) => m.durationMs !== undefined)
      .map((m) => m.durationMs!);
    const averageDurationMs =
      durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0;

    const timeoutCount = this.metrics.filter((m) =>
      m.errorType?.includes('Timeout')
    ).length;

    const validationErrorCount = this.metrics.filter(
      (m) => m.validationErrors && m.validationErrors.length > 0
    ).length;

    const retryCount = this.metrics.filter((m) => m.attemptNumber > 1).length;

    return {
      totalCalls,
      successfulCalls,
      failedCalls,
      successRate,
      averageDurationMs,
      timeoutCount,
      validationErrorCount,
      retryCount,
    };
  }

  /**
   * Get recent failures
   */
  static getRecentFailures(limit: number = 10): AICallMetrics[] {
    return this.metrics
      .filter((m) => !m.success)
      .slice(-limit)
      .reverse();
  }

  /**
   * Check system health
   */
  static checkHealth(): {
    healthy: boolean;
    issues: string[];
    stats: AIPerformanceStats;
  } {
    const stats = this.getStats();
    const issues: string[] = [];

    // Check success rate
    if (stats.successRate < 90) {
      issues.push(`Low success rate: ${stats.successRate.toFixed(1)}%`);
    }

    // Check timeout rate
    const timeoutRate = (stats.timeoutCount / stats.totalCalls) * 100;
    if (timeoutRate > 10) {
      issues.push(`High timeout rate: ${timeoutRate.toFixed(1)}%`);
    }

    // Check validation error rate
    const validationRate = (stats.validationErrorCount / stats.totalCalls) * 100;
    if (validationRate > 5) {
      issues.push(`High validation error rate: ${validationRate.toFixed(1)}%`);
    }

    // Check average duration
    if (stats.averageDurationMs > 45000) {
      issues.push(`Slow response time: ${(stats.averageDurationMs / 1000).toFixed(1)}s`);
    }

    const healthy = issues.length === 0;

    return { healthy, issues, stats };
  }

  /**
   * Alert on critical failure
   */
  private static alertCriticalFailure(metric: AICallMetrics): void {
    console.error('🚨 CRITICAL AI FAILURE', {
      requestId: metric.requestId,
      userId: metric.userId,
      estimateName: metric.estimateName,
      error: metric.error,
      attempts: metric.attemptNumber,
      durationMs: metric.durationMs,
    });

    // TODO: Send alert to monitoring service (e.g., Sentry, DataDog)
    // TODO: Send email to admin
    // TODO: Log to external service
  }

  /**
   * Find metric by request ID
   */
  private static findMetric(requestId: string): AICallMetrics | undefined {
    return this.metrics.find((m) => m.requestId === requestId);
  }

  /**
   * Prune old metrics to prevent memory leak
   */
  private static pruneMetrics(): void {
    if (this.metrics.length > this.MAX_STORED_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_STORED_METRICS);
    }
  }

  /**
   * Export metrics for analysis
   */
  static exportMetrics(): AICallMetrics[] {
    return [...this.metrics];
  }

  /**
   * Clear all metrics (for testing)
   */
  static clearMetrics(): void {
    this.metrics = [];
  }
}

/**
 * Error Classification
 */
export class ErrorClassifier {
  static classify(error: Error): {
    category: 'timeout' | 'validation' | 'rate_limit' | 'network' | 'unknown';
    severity: 'low' | 'medium' | 'high' | 'critical';
    retryable: boolean;
  } {
    const message = error.message.toLowerCase();

    // Timeout errors
    if (message.includes('timeout') || error.name.includes('Timeout')) {
      return { category: 'timeout', severity: 'high', retryable: true };
    }

    // Validation errors
    if (error.name === 'AIValidationError' || message.includes('validation')) {
      return { category: 'validation', severity: 'medium', retryable: true };
    }

    // Rate limit errors
    if (message.includes('rate_limit') || message.includes('429')) {
      return { category: 'rate_limit', severity: 'medium', retryable: true };
    }

    // Network errors
    if (
      message.includes('econnreset') ||
      message.includes('etimedout') ||
      message.includes('network')
    ) {
      return { category: 'network', severity: 'high', retryable: true };
    }

    // Unknown errors
    return { category: 'unknown', severity: 'critical', retryable: false };
  }
}
