/**
 * STRUCTURAL PERFORMANCE MONITOR
 * Logs parse confidence, engine runtimes, AI retries, failures
 * Enforces max runtime < 20s
 */

interface PerformanceLog {
  operation: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

class StructuralPerformanceMonitor {
  private logs: PerformanceLog[] = [];
  private maxLogs = 1000;
  
  /**
   * Start tracking operation
   */
  start(operation: string, metadata?: Record<string, any>): void {
    this.logs.push({
      operation,
      startTime: Date.now(),
      success: false,
      metadata
    });
    
    console.log(`[PERF] START: ${operation}`, metadata || '');
  }
  
  /**
   * End tracking operation
   */
  end(operation: string, success: boolean = true, error?: string, metadata?: Record<string, any>): void {
    const log = [...this.logs].reverse().find(l => l.operation === operation && !l.endTime);
    
    if (log) {
      log.endTime = Date.now();
      log.durationMs = log.endTime - log.startTime;
      log.success = success;
      log.error = error;
      
      if (metadata) {
        log.metadata = { ...log.metadata, ...metadata };
      }
      
      const status = success ? '✓' : '✗';
      console.log(`[PERF] ${status} ${operation}: ${log.durationMs}ms`, error || '');
    }
    
    // Trim old logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }
  
  /**
   * Log parse confidence
   */
  logParseConfidence(confidence: number, parsedCount: number, totalLines: number): void {
    const ratio = (parsedCount / Math.max(totalLines, 1) * 100).toFixed(1);
    console.log(`[PARSE] Confidence: ${(confidence * 100).toFixed(1)}%, Parsed: ${parsedCount}/${totalLines} (${ratio}%)`);
  }
  
  /**
   * Log AI retry
   */
  logAIRetry(attempt: number, maxAttempts: number, error: string): void {
    console.log(`[AI-RETRY] Attempt ${attempt}/${maxAttempts} failed: ${error}`);
  }
  
  /**
   * Log engine runtime
   */
  logEngineRuntime(engine: string, durationMs: number): void {
    console.log(`[ENGINE] ${engine}: ${durationMs}ms`);
  }
  
  /**
   * Log failure
   */
  logFailure(operation: string, error: string, fatal: boolean = false): void {
    const level = fatal ? 'FATAL' : 'ERROR';
    console.error(`[${level}] ${operation}: ${error}`);
  }
  
  /**
   * Enforce max runtime
   */
  enforceMaxRuntime(startTime: number, maxMs: number = 20000): void {
    const elapsed = Date.now() - startTime;
    
    if (elapsed > maxMs) {
      throw new Error(`Processing exceeded maximum runtime: ${elapsed}ms (limit: ${maxMs}ms)`);
    }
  }
  
  /**
   * Get performance summary
   */
  getSummary(): {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    avgDurationMs: number;
    maxDurationMs: number;
  } {
    const completed = this.logs.filter(l => l.endTime);
    
    if (completed.length === 0) {
      return {
        totalOperations: 0,
        successfulOperations: 0,
        failedOperations: 0,
        avgDurationMs: 0,
        maxDurationMs: 0
      };
    }
    
    const successful = completed.filter(l => l.success).length;
    const failed = completed.filter(l => !l.success).length;
    const durations = completed.map(l => l.durationMs || 0);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const maxDuration = Math.max(...durations);
    
    return {
      totalOperations: completed.length,
      successfulOperations: successful,
      failedOperations: failed,
      avgDurationMs: Math.round(avgDuration),
      maxDurationMs: maxDuration
    };
  }
  
  /**
   * Clear logs
   */
  clear(): void {
    this.logs = [];
  }
}

// Singleton
export const performanceMonitor = new StructuralPerformanceMonitor();

/**
 * Async wrapper with automatic tracking
 */
export async function trackOperation<T>(
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  performanceMonitor.start(operation, metadata);
  
  try {
    const result = await fn();
    performanceMonitor.end(operation, true, undefined, metadata);
    return result;
  } catch (error: any) {
    performanceMonitor.end(operation, false, error.message, metadata);
    throw error;
  }
}
