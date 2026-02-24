/**
 * TELEMETRY & MONITORING
 * ENTERPRISE-GRADE: Performance tracking, success rates, operational metrics
 * Persistent logging for analytics and debugging
 */

import * as fs from 'fs';
import * as path from 'path';

export interface TelemetryEvent {
  eventId: string;
  timestamp: string;
  eventType: 'REQUEST' | 'PARSE' | 'ANALYSIS' | 'DEVIATION' | 'ERROR' | 'PERFORMANCE';
  requestId: string;
  userId?: string;
  data: Record<string, any>;
}

export interface PerformanceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageProcessingTimeMs: number;
  parseSuccessRate: number;
  parseRejectionRate: number;
  deviationDetectionRate: number;
  averageExposure: number;
  averageRiskScore: number;
  criticalDeviationRate: number;
}

export interface RequestMetrics {
  requestId: string;
  timestamp: string;
  processingTimeMs: number;
  success: boolean;
  parseConfidence?: number;
  deviationsFound?: number;
  totalExposure?: number;
  riskScore?: number;
  errorCode?: string;
  inputTypes: {
    estimate: boolean;
    dimensions: boolean;
    report: boolean;
    photos: boolean;
  };
}

/**
 * Telemetry logger
 */
export class TelemetryLogger {
  private logDir: string;
  private metricsFile: string;
  private eventsFile: string;
  
  constructor(logDir: string = './logs/telemetry') {
    this.logDir = logDir;
    this.metricsFile = path.join(logDir, 'metrics.jsonl');
    this.eventsFile = path.join(logDir, 'events.jsonl');
    
    // Ensure log directory exists
    this.ensureLogDirectory();
  }
  
  private ensureLogDirectory(): void {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    } catch (error) {
      console.error('[TELEMETRY] Failed to create log directory:', error);
    }
  }
  
  /**
   * Log event
   */
  logEvent(
    eventType: TelemetryEvent['eventType'],
    requestId: string,
    data: Record<string, any>,
    userId?: string
  ): void {
    
    const event: TelemetryEvent = {
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      eventType,
      requestId,
      userId,
      data
    };
    
    try {
      fs.appendFileSync(this.eventsFile, JSON.stringify(event) + '\n');
    } catch (error) {
      console.error('[TELEMETRY] Failed to log event:', error);
    }
  }
  
  /**
   * Log request metrics
   */
  logRequest(metrics: RequestMetrics): void {
    try {
      fs.appendFileSync(this.metricsFile, JSON.stringify(metrics) + '\n');
    } catch (error) {
      console.error('[TELEMETRY] Failed to log metrics:', error);
    }
    
    // Also log as event
    this.logEvent('REQUEST', metrics.requestId, {
      success: metrics.success,
      processingTimeMs: metrics.processingTimeMs,
      parseConfidence: metrics.parseConfidence,
      deviationsFound: metrics.deviationsFound,
      riskScore: metrics.riskScore,
      errorCode: metrics.errorCode
    });
  }
  
  /**
   * Log parse attempt
   */
  logParse(
    requestId: string,
    success: boolean,
    confidence?: number,
    lineItemCount?: number,
    errorCode?: string
  ): void {
    
    this.logEvent('PARSE', requestId, {
      success,
      confidence,
      lineItemCount,
      errorCode
    });
  }
  
  /**
   * Log deviation detection
   */
  logDeviation(
    requestId: string,
    deviationType: string,
    trade: string,
    severity: string,
    exposureMin: number,
    exposureMax: number
  ): void {
    
    this.logEvent('DEVIATION', requestId, {
      deviationType,
      trade,
      severity,
      exposureMin,
      exposureMax
    });
  }
  
  /**
   * Log error
   */
  logError(
    requestId: string,
    errorCode: string,
    errorType: string,
    message: string
  ): void {
    
    this.logEvent('ERROR', requestId, {
      errorCode,
      errorType,
      message
    });
  }
  
  /**
   * Log performance warning
   */
  logPerformanceWarning(
    requestId: string,
    operation: string,
    durationMs: number,
    threshold: number
  ): void {
    
    this.logEvent('PERFORMANCE', requestId, {
      operation,
      durationMs,
      threshold,
      exceeded: durationMs > threshold
    });
  }
  
  /**
   * Get metrics summary
   */
  getMetrics(since?: Date): PerformanceMetrics {
    try {
      if (!fs.existsSync(this.metricsFile)) {
        return this.getEmptyMetrics();
      }
      
      const content = fs.readFileSync(this.metricsFile, 'utf8');
      const lines = content.split('\n').filter(line => line.trim().length > 0);
      
      let allMetrics: RequestMetrics[] = lines.map(line => JSON.parse(line));
      
      // Filter by date if provided
      if (since) {
        allMetrics = allMetrics.filter(m => new Date(m.timestamp) >= since);
      }
      
      if (allMetrics.length === 0) {
        return this.getEmptyMetrics();
      }
      
      const totalRequests = allMetrics.length;
      const successfulRequests = allMetrics.filter(m => m.success).length;
      const failedRequests = totalRequests - successfulRequests;
      
      const totalProcessingTime = allMetrics.reduce((sum, m) => sum + m.processingTimeMs, 0);
      const averageProcessingTimeMs = totalProcessingTime / totalRequests;
      
      const parsedRequests = allMetrics.filter(m => m.parseConfidence !== undefined);
      const parseSuccessRate = parsedRequests.filter(m => m.parseConfidence! >= 0.75).length / Math.max(parsedRequests.length, 1);
      const parseRejectionRate = 1 - parseSuccessRate;
      
      const requestsWithDeviations = allMetrics.filter(m => m.deviationsFound && m.deviationsFound > 0);
      const deviationDetectionRate = requestsWithDeviations.length / totalRequests;
      
      const exposures = allMetrics.filter(m => m.totalExposure !== undefined).map(m => m.totalExposure!);
      const averageExposure = exposures.length > 0 ? exposures.reduce((sum, e) => sum + e, 0) / exposures.length : 0;
      
      const riskScores = allMetrics.filter(m => m.riskScore !== undefined).map(m => m.riskScore!);
      const averageRiskScore = riskScores.length > 0 ? riskScores.reduce((sum, r) => sum + r, 0) / riskScores.length : 0;
      
      // Critical deviation rate (requires reading events)
      const criticalDeviationRate = 0; // Placeholder - would require event log parsing
      
      return {
        totalRequests,
        successfulRequests,
        failedRequests,
        averageProcessingTimeMs: Math.round(averageProcessingTimeMs),
        parseSuccessRate: Math.round(parseSuccessRate * 100) / 100,
        parseRejectionRate: Math.round(parseRejectionRate * 100) / 100,
        deviationDetectionRate: Math.round(deviationDetectionRate * 100) / 100,
        averageExposure: Math.round(averageExposure),
        averageRiskScore: Math.round(averageRiskScore),
        criticalDeviationRate
      };
      
    } catch (error) {
      console.error('[TELEMETRY] Failed to read metrics:', error);
      return this.getEmptyMetrics();
    }
  }
  
  private getEmptyMetrics(): PerformanceMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageProcessingTimeMs: 0,
      parseSuccessRate: 0,
      parseRejectionRate: 0,
      deviationDetectionRate: 0,
      averageExposure: 0,
      averageRiskScore: 0,
      criticalDeviationRate: 0
    };
  }
}

// Global telemetry instance
export const telemetry = new TelemetryLogger();

/**
 * Track request
 */
export function trackRequest(metrics: RequestMetrics): void {
  telemetry.logRequest(metrics);
}

/**
 * Track parse
 */
export function trackParse(
  requestId: string,
  success: boolean,
  confidence?: number,
  lineItemCount?: number,
  errorCode?: string
): void {
  telemetry.logParse(requestId, success, confidence, lineItemCount, errorCode);
}

/**
 * Track deviation
 */
export function trackDeviation(
  requestId: string,
  deviationType: string,
  trade: string,
  severity: string,
  exposureMin: number,
  exposureMax: number
): void {
  telemetry.logDeviation(requestId, deviationType, trade, severity, exposureMin, exposureMax);
}

/**
 * Track error
 */
export function trackError(
  requestId: string,
  errorCode: string,
  errorType: string,
  message: string
): void {
  telemetry.logError(requestId, errorCode, errorType, message);
}

/**
 * Track performance warning
 */
export function trackPerformanceWarning(
  requestId: string,
  operation: string,
  durationMs: number,
  threshold: number
): void {
  telemetry.logPerformanceWarning(requestId, operation, durationMs, threshold);
}

/**
 * Get performance metrics
 */
export function getPerformanceMetrics(since?: Date): PerformanceMetrics {
  return telemetry.getMetrics(since);
}
