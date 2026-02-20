/**
 * PERFORMANCE MONITOR
 * Tracks execution time, success rates, and health metrics for all engines
 * Logs AI retries, parser confidence, exposure calculations
 */

interface PerformanceMetric {
  operation: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

interface HealthMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number;
  avgProcessingTimeMs: number;
  maxProcessingTimeMs: number;
  minProcessingTimeMs: number;
  engineMetrics: Record<string, {
    calls: number;
    successes: number;
    failures: number;
    avgDurationMs: number;
  }>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetricsStored = 1000;
  
  /**
   * Start tracking an operation
   */
  startOperation(operation: string, metadata?: Record<string, any>): string {
    const id = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.metrics.push({
      operation,
      startTime: Date.now(),
      success: false,
      metadata
    });
    
    console.log(`[PERF] Started: ${operation}`, metadata || '');
    
    return id;
  }
  
  /**
   * End tracking an operation
   */
  endOperation(operation: string, success: boolean = true, error?: string, metadata?: Record<string, any>): void {
    // Find the most recent metric for this operation
    const metric = [...this.metrics].reverse().find(m => 
      m.operation === operation && !m.endTime
    );
    
    if (metric) {
      metric.endTime = Date.now();
      metric.durationMs = metric.endTime - metric.startTime;
      metric.success = success;
      metric.error = error;
      
      if (metadata) {
        metric.metadata = { ...metric.metadata, ...metadata };
      }
      
      const status = success ? 'SUCCESS' : 'FAILED';
      console.log(`[PERF] ${status}: ${operation} (${metric.durationMs}ms)`, error || '');
    }
    
    // Trim old metrics
    if (this.metrics.length > this.maxMetricsStored) {
      this.metrics = this.metrics.slice(-this.maxMetricsStored);
    }
  }
  
  /**
   * Log AI retry attempt
   */
  logAIRetry(attempt: number, maxAttempts: number, error: string): void {
    console.log(`[AI-RETRY] Attempt ${attempt}/${maxAttempts} failed: ${error}`);
  }
  
  /**
   * Log parser confidence
   */
  logParserConfidence(confidence: string, parsedCount: number, totalLines: number): void {
    const ratio = (parsedCount / Math.max(totalLines, 1) * 100).toFixed(1);
    console.log(`[PARSER] Confidence: ${confidence}, Parsed: ${parsedCount}/${totalLines} (${ratio}%)`);
  }
  
  /**
   * Log exposure calculation
   */
  logExposureCalculation(exposureMin: number, exposureMax: number, itemCount: number): void {
    console.log(`[EXPOSURE] Range: $${exposureMin.toLocaleString()} - $${exposureMax.toLocaleString()}, Items: ${itemCount}`);
  }
  
  /**
   * Log code upgrade detection
   */
  logCodeUpgrades(riskCount: number, criticalCount: number): void {
    console.log(`[CODE] Detected ${riskCount} code items (${criticalCount} critical)`);
  }
  
  /**
   * Log trade completeness
   */
  logTradeCompleteness(overallScore: number, issueCount: number): void {
    console.log(`[COMPLETENESS] Overall: ${overallScore}/100, Issues: ${issueCount}`);
  }
  
  /**
   * Get health metrics
   */
  getHealthMetrics(): HealthMetrics {
    const completedMetrics = this.metrics.filter(m => m.endTime);
    
    if (completedMetrics.length === 0) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        successRate: 0,
        avgProcessingTimeMs: 0,
        maxProcessingTimeMs: 0,
        minProcessingTimeMs: 0,
        engineMetrics: {}
      };
    }
    
    const successfulRequests = completedMetrics.filter(m => m.success).length;
    const failedRequests = completedMetrics.filter(m => !m.success).length;
    const durations = completedMetrics.map(m => m.durationMs || 0);
    
    // Calculate engine-specific metrics
    const engineMetrics: Record<string, any> = {};
    const operations = new Set(completedMetrics.map(m => m.operation));
    
    for (const op of operations) {
      const opMetrics = completedMetrics.filter(m => m.operation === op);
      const opSuccesses = opMetrics.filter(m => m.success).length;
      const opFailures = opMetrics.filter(m => !m.success).length;
      const opDurations = opMetrics.map(m => m.durationMs || 0);
      const opAvgDuration = opDurations.reduce((a, b) => a + b, 0) / opDurations.length;
      
      engineMetrics[op] = {
        calls: opMetrics.length,
        successes: opSuccesses,
        failures: opFailures,
        avgDurationMs: Math.round(opAvgDuration)
      };
    }
    
    return {
      totalRequests: completedMetrics.length,
      successfulRequests,
      failedRequests,
      successRate: (successfulRequests / completedMetrics.length) * 100,
      avgProcessingTimeMs: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
      maxProcessingTimeMs: Math.max(...durations),
      minProcessingTimeMs: Math.min(...durations),
      engineMetrics
    };
  }
  
  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 10): Array<{ operation: string; error: string; timestamp: number }> {
    return this.metrics
      .filter(m => !m.success && m.error)
      .slice(-limit)
      .map(m => ({
        operation: m.operation,
        error: m.error!,
        timestamp: m.startTime
      }));
  }
  
  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    console.log('[PERF] Metrics cleared');
  }
  
  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    return JSON.stringify({
      metrics: this.metrics,
      health: this.getHealthMetrics(),
      timestamp: new Date().toISOString()
    }, null, 2);
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator for automatic performance tracking
 */
export function trackPerformance(operationName: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      performanceMonitor.startOperation(operationName);
      
      try {
        const result = await originalMethod.apply(this, args);
        performanceMonitor.endOperation(operationName, true);
        return result;
      } catch (error: any) {
        performanceMonitor.endOperation(operationName, false, error.message);
        throw error;
      }
    };
    
    return descriptor;
  };
}

/**
 * Simple wrapper for tracking async functions
 */
export async function trackAsync<T>(
  operationName: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  performanceMonitor.startOperation(operationName, metadata);
  
  try {
    const result = await fn();
    performanceMonitor.endOperation(operationName, true, undefined, metadata);
    return result;
  } catch (error: any) {
    performanceMonitor.endOperation(operationName, false, error.message, metadata);
    throw error;
  }
}

/**
 * Simple wrapper for tracking sync functions
 */
export function trackSync<T>(
  operationName: string,
  fn: () => T,
  metadata?: Record<string, any>
): T {
  performanceMonitor.startOperation(operationName, metadata);
  
  try {
    const result = fn();
    performanceMonitor.endOperation(operationName, true, undefined, metadata);
    return result;
  } catch (error: any) {
    performanceMonitor.endOperation(operationName, false, error.message, metadata);
    throw error;
  }
}

export type { PerformanceMetric, HealthMetrics };
