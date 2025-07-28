import { AppError, ErrorType } from '../types';

export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: ErrorType[];
  onRetry?: (attempt: number, error: any) => void;
  onMaxAttemptsReached?: (error: any) => void;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: [ErrorType.NETWORK_ERROR, ErrorType.STORAGE_ERROR],
  onRetry: (attempt, error) => console.log(`Retry attempt ${attempt}:`, error.message),
  onMaxAttemptsReached: (error) => console.error('Max retry attempts reached:', error.message),
};

export class RetryMechanism {
  private options: RetryOptions;

  constructor(options: Partial<RetryOptions> = {}) {
    this.options = { ...DEFAULT_RETRY_OPTIONS, ...options };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= this.options.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Check if error is retryable
        if (!this.isRetryableError(error)) {
          throw error;
        }
        
        // If this was the last attempt, don't retry
        if (attempt === this.options.maxAttempts) {
          if (this.options.onMaxAttemptsReached) {
            this.options.onMaxAttemptsReached(error);
          }
          throw error;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.options.baseDelay * Math.pow(this.options.backoffMultiplier, attempt - 1),
          this.options.maxDelay
        );
        
        // Call retry callback
        if (this.options.onRetry) {
          this.options.onRetry(attempt, error);
        }
        
        // Wait before retrying
        await this.delay(delay);
      }
    }
    
    throw lastError;
  }

  private isRetryableError(error: any): boolean {
    // Check if it's an AppError with retryable type
    if (error && typeof error === 'object' && 'type' in error) {
      const appError = error as AppError;
      return this.options.retryableErrors.includes(appError.type) && appError.recoverable;
    }
    
    // Check for common retryable error patterns
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('connection') ||
        message.includes('storage') ||
        message.includes('asyncstorage')
      );
    }
    
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Utility function for quick retry operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const retryMechanism = new RetryMechanism(options);
  return retryMechanism.execute(operation);
}

// Specialized retry for storage operations
export async function withStorageRetry<T>(
  operation: () => Promise<T>,
  customOptions: Partial<RetryOptions> = {}
): Promise<T> {
  const options: Partial<RetryOptions> = {
    maxAttempts: 3,
    baseDelay: 500,
    maxDelay: 5000,
    retryableErrors: [ErrorType.STORAGE_ERROR],
    onRetry: (attempt, error) => console.log(`Storage retry attempt ${attempt}:`, error.message),
    ...customOptions,
  };
  
  return withRetry(operation, options);
}

// Specialized retry for network operations
export async function withNetworkRetry<T>(
  operation: () => Promise<T>,
  customOptions: Partial<RetryOptions> = {}
): Promise<T> {
  const options: Partial<RetryOptions> = {
    maxAttempts: 5,
    baseDelay: 1000,
    maxDelay: 15000,
    retryableErrors: [ErrorType.NETWORK_ERROR],
    onRetry: (attempt, error) => console.log(`Network retry attempt ${attempt}:`, error.message),
    ...customOptions,
  };
  
  return withRetry(operation, options);
}