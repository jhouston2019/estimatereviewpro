/**
 * PERFORMANCE GUARDS
 * ENTERPRISE-GRADE: Timeouts, limits, graceful degradation
 * Ensures system stability under load
 */

import { PerformanceError } from './structured-errors';

export const PERFORMANCE_LIMITS = {
  MAX_PROCESSING_TIME_MS: 30000, // 30 seconds
  MAX_FILE_SIZE_MB: 10,
  MAX_CONCURRENT_REQUESTS: 10,
  MAX_ROOMS: 50,
  MAX_LINE_ITEMS: 1000,
  MAX_PHOTOS: 20,
  MAX_PHOTO_SIZE_MB: 5,
  AI_TIMEOUT_MS: 15000,
  PARSE_TIMEOUT_MS: 10000,
  DIMENSION_TIMEOUT_MS: 5000,
  DEVIATION_TIMEOUT_MS: 10000
};

/**
 * Timeout wrapper for async operations
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operationName: string
): Promise<T> {
  
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(
        () => reject(new PerformanceError(
          'TIMEOUT_EXCEEDED',
          `Operation "${operationName}" exceeded timeout of ${timeoutMs}ms`,
          'Try with a smaller file or simpler estimate. Contact support if issue persists.',
          { operation: operationName, timeoutMs }
        )),
        timeoutMs
      )
    )
  ]);
}

/**
 * Validate file size
 */
export function validateFileSize(
  buffer: Buffer,
  maxSizeMB: number,
  filename?: string
): void {
  const sizeMB = buffer.length / (1024 * 1024);
  
  if (sizeMB > maxSizeMB) {
    throw new PerformanceError(
      'FILE_TOO_LARGE',
      `File ${filename ? `"${filename}" ` : ''}size ${sizeMB.toFixed(2)} MB exceeds maximum ${maxSizeMB} MB`,
      `Reduce file size to under ${maxSizeMB} MB or split into multiple files.`,
      { sizeMB, maxSizeMB, filename }
    );
  }
}

/**
 * Validate room count
 */
export function validateRoomCount(roomCount: number): void {
  if (roomCount > PERFORMANCE_LIMITS.MAX_ROOMS) {
    throw new PerformanceError(
      'TOO_MANY_ROOMS',
      `Room count ${roomCount} exceeds maximum ${PERFORMANCE_LIMITS.MAX_ROOMS}`,
      'For properties with more than 50 rooms, contact enterprise support for custom processing.',
      { roomCount, maxRooms: PERFORMANCE_LIMITS.MAX_ROOMS }
    );
  }
}

/**
 * Validate line item count
 */
export function validateLineItemCount(count: number): void {
  if (count > PERFORMANCE_LIMITS.MAX_LINE_ITEMS) {
    throw new PerformanceError(
      'TOO_MANY_LINE_ITEMS',
      `Line item count ${count} exceeds maximum ${PERFORMANCE_LIMITS.MAX_LINE_ITEMS}`,
      'For estimates with more than 1000 line items, contact enterprise support.',
      { count, maxItems: PERFORMANCE_LIMITS.MAX_LINE_ITEMS }
    );
  }
}

/**
 * Validate photo count
 */
export function validatePhotoCount(count: number): void {
  if (count > PERFORMANCE_LIMITS.MAX_PHOTOS) {
    throw new PerformanceError(
      'TOO_MANY_PHOTOS',
      `Photo count ${count} exceeds maximum ${PERFORMANCE_LIMITS.MAX_PHOTOS}`,
      `Limit photo uploads to ${PERFORMANCE_LIMITS.MAX_PHOTOS} images per request.`,
      { count, maxPhotos: PERFORMANCE_LIMITS.MAX_PHOTOS }
    );
  }
}

/**
 * Rate limiter (simple in-memory implementation)
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;
  
  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  
  check(identifier: string): { allowed: boolean; remaining: number; resetMs: number } {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // Remove old requests outside window
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...validRequests);
      const resetMs = this.windowMs - (now - oldestRequest);
      
      return {
        allowed: false,
        remaining: 0,
        resetMs
      };
    }
    
    // Add new request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return {
      allowed: true,
      remaining: this.maxRequests - validRequests.length,
      resetMs: this.windowMs
    };
  }
  
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }
}

// Global rate limiter: 10 requests per minute per IP
export const globalRateLimiter = new RateLimiter(10, 60000);

/**
 * Check rate limit
 */
export function checkRateLimit(ip: string): void {
  const result = globalRateLimiter.check(ip);
  
  if (!result.allowed) {
    throw new PerformanceError(
      'RATE_LIMIT_EXCEEDED',
      'Too many requests. Please try again later.',
      `Rate limit: ${PERFORMANCE_LIMITS.MAX_CONCURRENT_REQUESTS} requests per minute. Retry in ${Math.ceil(result.resetMs / 1000)} seconds.`,
      { 
        remaining: result.remaining,
        resetMs: result.resetMs,
        resetSeconds: Math.ceil(result.resetMs / 1000)
      }
    );
  }
}

/**
 * Graceful AI failure handler
 */
export async function withAIFallback<T>(
  aiOperation: () => Promise<T>,
  fallbackValue: T,
  operationName: string
): Promise<{ result: T; usedFallback: boolean; error?: string }> {
  
  try {
    const result = await withTimeout(
      aiOperation(),
      PERFORMANCE_LIMITS.AI_TIMEOUT_MS,
      operationName
    );
    
    return { result, usedFallback: false };
    
  } catch (error: any) {
    console.error(`[AI FALLBACK] ${operationName} failed:`, error.message);
    
    return {
      result: fallbackValue,
      usedFallback: true,
      error: error.message
    };
  }
}

/**
 * Performance monitor
 */
export class PerformanceMonitor {
  private startTime: number;
  private checkpoints: Map<string, number> = new Map();
  
  constructor() {
    this.startTime = Date.now();
  }
  
  checkpoint(name: string): void {
    this.checkpoints.set(name, Date.now());
  }
  
  getDuration(checkpointName?: string): number {
    if (checkpointName) {
      const checkpointTime = this.checkpoints.get(checkpointName);
      if (!checkpointTime) {
        return 0;
      }
      return Date.now() - checkpointTime;
    }
    
    return Date.now() - this.startTime;
  }
  
  getTimings(): Record<string, number> {
    const timings: Record<string, number> = {};
    const checkpointArray = Array.from(this.checkpoints.entries()).sort((a, b) => a[1] - b[1]);
    
    for (let i = 0; i < checkpointArray.length; i++) {
      const [name, time] = checkpointArray[i];
      const prevTime = i === 0 ? this.startTime : checkpointArray[i - 1][1];
      timings[name] = time - prevTime;
    }
    
    return timings;
  }
  
  checkTimeout(maxMs: number): void {
    const elapsed = this.getDuration();
    
    if (elapsed > maxMs) {
      throw new PerformanceError(
        'PROCESSING_TIMEOUT',
        `Total processing time ${elapsed}ms exceeded maximum ${maxMs}ms`,
        'Try with a smaller file or simpler estimate.',
        { elapsedMs: elapsed, maxMs }
      );
    }
  }
}
