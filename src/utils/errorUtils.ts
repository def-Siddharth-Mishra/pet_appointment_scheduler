import { AppError, ErrorType } from '../types';

/**
 * Safely access nested object properties
 */
export function safeGet<T>(obj: any, path: string, defaultValue?: T): T | undefined {
  try {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result == null || typeof result !== 'object') {
        return defaultValue;
      }
      result = result[key];
    }
    
    return result !== undefined ? result : defaultValue;
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Safely execute a function and return a default value on error
 */
export function safeExecute<T>(fn: () => T, defaultValue: T): T {
  try {
    return fn();
  } catch (error) {
    console.warn('Safe execute caught error:', error);
    return defaultValue;
  }
}

/**
 * Safely execute an async function and return a default value on error
 */
export async function safeExecuteAsync<T>(fn: () => Promise<T>, defaultValue: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.warn('Safe execute async caught error:', error);
    return defaultValue;
  }
}

/**
 * Create a standardized AppError from any error
 */
export function createAppError(
  error: any, 
  fallbackMessage: string = 'An unexpected error occurred',
  type: ErrorType = ErrorType.STORAGE_ERROR
): AppError {
  // If it's already an AppError, return it
  if (error && typeof error === 'object' && 'type' in error && 'message' in error) {
    return error as AppError;
  }
  
  let message = fallbackMessage;
  let errorType = type;
  
  if (error instanceof Error) {
    message = error.message;
    
    // Determine error type based on message content
    if (error.message.includes('validation')) {
      errorType = ErrorType.VALIDATION_ERROR;
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      errorType = ErrorType.NETWORK_ERROR;
    } else if (error.message.includes('storage') || error.message.includes('AsyncStorage')) {
      errorType = ErrorType.STORAGE_ERROR;
    } else if (error.message.includes('conflict') || error.message.includes('booking')) {
      errorType = ErrorType.BOOKING_CONFLICT;
    }
  } else if (typeof error === 'string') {
    message = error;
  }
  
  return {
    type: errorType,
    message,
    recoverable: errorType !== ErrorType.VALIDATION_ERROR,
    retryAction: errorType !== ErrorType.VALIDATION_ERROR ? () => {
      console.log('Retry action triggered for:', message);
    } : undefined,
  };
}

/**
 * Safely check if a value is a valid array
 */
export function isValidArray(value: any): value is any[] {
  return Array.isArray(value) && value !== null && value !== undefined;
}

/**
 * Safely check if a value is a valid string
 */
export function isValidString(value: any): value is string {
  return typeof value === 'string' && value !== null && value !== undefined;
}

/**
 * Safely check if a value is a valid number
 */
export function isValidNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Safely check if a value is a valid object
 */
export function isValidObject(value: any): value is object {
  return value !== null && value !== undefined && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Safely filter an array with error handling
 */
export function safeFilter<T>(array: any, predicate: (item: T) => boolean): T[] {
  try {
    if (!isValidArray(array)) {
      return [];
    }
    
    return array.filter((item: T) => {
      try {
        return predicate(item);
      } catch (error) {
        console.warn('Filter predicate error:', error);
        return false;
      }
    });
  } catch (error) {
    console.warn('Safe filter error:', error);
    return [];
  }
}

/**
 * Safely map an array with error handling
 */
export function safeMap<T, U>(array: any, mapper: (item: T) => U): U[] {
  try {
    if (!isValidArray(array)) {
      return [];
    }
    
    return array.map((item: T) => {
      try {
        return mapper(item);
      } catch (error) {
        console.warn('Map function error:', error);
        return null as any;
      }
    }).filter(item => item !== null);
  } catch (error) {
    console.warn('Safe map error:', error);
    return [];
  }
}

/**
 * Safely sort an array with error handling
 */
export function safeSort<T>(array: any, compareFn?: (a: T, b: T) => number): T[] {
  try {
    if (!isValidArray(array)) {
      return [];
    }
    
    const safeCopy = [...array];
    
    if (compareFn) {
      return safeCopy.sort((a: T, b: T) => {
        try {
          return compareFn(a, b);
        } catch (error) {
          console.warn('Sort compare function error:', error);
          return 0;
        }
      });
    }
    
    return safeCopy.sort();
  } catch (error) {
    console.warn('Safe sort error:', error);
    return [];
  }
}

/**
 * Debounce function to prevent excessive calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function to limit call frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Safely parse JSON with error handling
 */
export function safeJsonParse<T>(jsonString: string, defaultValue: T): T {
  try {
    if (!jsonString || typeof jsonString !== 'string') {
      return defaultValue;
    }
    
    const parsed = JSON.parse(jsonString);
    return parsed !== undefined ? parsed : defaultValue;
  } catch (error) {
    console.warn('JSON parse error:', error);
    return defaultValue;
  }
}

/**
 * Safely stringify JSON with error handling
 */
export function safeJsonStringify(value: any, defaultValue: string = '{}'): string {
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.warn('JSON stringify error:', error);
    return defaultValue;
  }
}