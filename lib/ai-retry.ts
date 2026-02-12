import { AIValidationError, validateAIResponse, AIAnalysisResponse } from './ai-validation';

/**
 * AI Retry Configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  timeoutMs: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  timeoutMs: 60000, // 60 seconds
};

/**
 * Retry Error Types
 */
export class AITimeoutError extends Error {
  constructor(message: string, public readonly attemptNumber: number) {
    super(message);
    this.name = 'AITimeoutError';
  }
}

export class AIRetryExhaustedError extends Error {
  constructor(
    message: string,
    public readonly attempts: number,
    public readonly lastError: Error
  ) {
    super(message);
    this.name = 'AIRetryExhaustedError';
  }
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function calculateBackoff(
  attemptNumber: number,
  config: RetryConfig
): number {
  const delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attemptNumber - 1);
  return Math.min(delay, config.maxDelayMs);
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  shouldRetry: (error: Error) => boolean = () => true
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      // Add timeout protection
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new AITimeoutError(`AI call timed out after ${config.timeoutMs}ms`, attempt)),
            config.timeoutMs
          )
        ),
      ]);

      return result;
    } catch (error) {
      lastError = error as Error;

      // Log attempt failure
      console.error(`AI call attempt ${attempt}/${config.maxAttempts} failed:`, {
        error: lastError.message,
        attempt,
      });

      // Check if we should retry
      if (!shouldRetry(lastError) || attempt === config.maxAttempts) {
        break;
      }

      // Calculate and apply backoff delay
      const delay = calculateBackoff(attempt, config);
      console.log(`Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  // All retries exhausted
  throw new AIRetryExhaustedError(
    `AI call failed after ${config.maxAttempts} attempts`,
    config.maxAttempts,
    lastError!
  );
}

/**
 * Determine if error is retryable
 */
export function isRetryableError(error: Error): boolean {
  // Retry on timeout errors
  if (error instanceof AITimeoutError) {
    return true;
  }

  // Retry on validation errors (malformed response)
  if (error instanceof AIValidationError) {
    return true;
  }

  // Retry on network errors
  if (error.message.includes('ECONNRESET') || error.message.includes('ETIMEDOUT')) {
    return true;
  }

  // Retry on OpenAI rate limits
  if (error.message.includes('rate_limit_exceeded')) {
    return true;
  }

  // Retry on OpenAI server errors (5xx)
  if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
    return true;
  }

  // Don't retry on client errors (4xx except rate limit)
  if (error.message.includes('400') || error.message.includes('401') || error.message.includes('403')) {
    return false;
  }

  // Default: retry
  return true;
}

/**
 * Retry AI call with validation
 */
export async function retryAICall(
  aiCallFn: () => Promise<unknown>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<AIAnalysisResponse> {
  return retryWithBackoff(
    async () => {
      // Execute AI call
      const rawResponse = await aiCallFn();

      // Validate response
      const validated = validateAIResponse(rawResponse);

      return validated;
    },
    config,
    isRetryableError
  );
}

/**
 * Retry with circuit breaker pattern
 */
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly resetTimeoutMs: number = 60000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check circuit state
    if (this.state === 'OPEN') {
      const now = Date.now();
      if (this.lastFailureTime && now - this.lastFailureTime >= this.resetTimeoutMs) {
        // Try to recover
        this.state = 'HALF_OPEN';
        console.log('Circuit breaker: Attempting recovery (HALF_OPEN)');
      } else {
        throw new Error('Circuit breaker is OPEN - too many failures');
      }
    }

    try {
      const result = await fn();

      // Success - reset circuit
      if (this.state === 'HALF_OPEN') {
        console.log('Circuit breaker: Recovery successful (CLOSED)');
      }
      this.state = 'CLOSED';
      this.failureCount = 0;
      this.lastFailureTime = null;

      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.failureThreshold) {
        this.state = 'OPEN';
        console.error('Circuit breaker: OPEN - too many failures', {
          failureCount: this.failureCount,
          threshold: this.failureThreshold,
        });
      }

      throw error;
    }
  }

  getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN' {
    return this.state;
  }

  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = null;
  }
}

// Global circuit breaker instance
export const aiCircuitBreaker = new CircuitBreaker(5, 60000);
