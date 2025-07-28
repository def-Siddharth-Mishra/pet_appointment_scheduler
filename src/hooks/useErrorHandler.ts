import { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { AppError, ErrorType } from '../types';
import { withRetry, RetryOptions } from '../utils/retryMechanism';
import { useOfflineHandler } from './useOfflineHandler';

export const useErrorHandler = () => {
  const { state, clearError } = useAppContext();
  const { isOffline, executeWithOfflineHandling } = useOfflineHandler();

  const handleError = useCallback((error: any, fallbackMessage: string = 'An unexpected error occurred') => {
    console.error('Error handled:', error);
    
    // If it's already an AppError, we don't need to transform it
    if (error && typeof error === 'object' && 'type' in error) {
      return error as AppError;
    }
    
    // Transform different error types
    let appError: AppError;
    
    if (error instanceof Error) {
      // Handle specific error messages
      if (error.message.includes('validation')) {
        appError = {
          type: ErrorType.VALIDATION_ERROR,
          message: error.message,
          recoverable: false,
        };
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        appError = {
          type: ErrorType.NETWORK_ERROR,
          message: 'Network connection failed. Please check your internet connection.',
          recoverable: true,
          retryAction: () => {
            console.log('Retrying network operation...');
          },
        };
      } else if (error.message.includes('storage') || error.message.includes('AsyncStorage')) {
        appError = {
          type: ErrorType.STORAGE_ERROR,
          message: 'Failed to save data. Please try again.',
          recoverable: true,
          retryAction: () => {
            console.log('Retrying storage operation...');
          },
        };
      } else {
        appError = {
          type: ErrorType.STORAGE_ERROR,
          message: fallbackMessage,
          recoverable: true,
        };
      }
    } else {
      appError = {
        type: ErrorType.STORAGE_ERROR,
        message: fallbackMessage,
        recoverable: true,
      };
    }
    
    return appError;
  }, []);

  const getErrorMessage = useCallback((error: AppError): string => {
    switch (error.type) {
      case ErrorType.VALIDATION_ERROR:
        return `Validation Error: ${error.message}`;
      case ErrorType.BOOKING_CONFLICT:
        return `Booking Conflict: ${error.message}`;
      case ErrorType.NETWORK_ERROR:
        return `Network Error: ${error.message}`;
      case ErrorType.STORAGE_ERROR:
        return `Storage Error: ${error.message}`;
      default:
        return error.message;
    }
  }, []);

  const getErrorSeverity = useCallback((error: AppError): 'low' | 'medium' | 'high' => {
    switch (error.type) {
      case ErrorType.VALIDATION_ERROR:
        return 'low';
      case ErrorType.BOOKING_CONFLICT:
        return 'medium';
      case ErrorType.NETWORK_ERROR:
        return 'medium';
      case ErrorType.STORAGE_ERROR:
        return 'high';
      default:
        return 'medium';
    }
  }, []);

  const isRecoverable = useCallback((error: AppError): boolean => {
    return error.recoverable === true;
  }, []);

  const retry = useCallback((error: AppError) => {
    if (error.retryAction) {
      error.retryAction();
    }
  }, []);

  const dismissError = useCallback(() => {
    clearError();
  }, [clearError]);

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string,
    retryOptions?: Partial<RetryOptions>
  ): Promise<T> => {
    try {
      return await withRetry(operation, retryOptions);
    } catch (error) {
      const appError = handleError(error, `Failed to ${operationName}`);
      throw appError;
    }
  }, [handleError]);

  const executeWithOfflineSupport = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string,
    fallbackValue?: T
  ): Promise<T> => {
    return executeWithOfflineHandling(operation, operationName, fallbackValue);
  }, [executeWithOfflineHandling]);

  const getRecoveryActions = useCallback((error: AppError): Array<{
    label: string;
    action: () => void;
  }> => {
    const actions: Array<{ label: string; action: () => void }> = [];

    if (error.recoverable && error.retryAction) {
      actions.push({
        label: 'Try Again',
        action: error.retryAction,
      });
    }

    switch (error.type) {
      case ErrorType.NETWORK_ERROR:
        if (isOffline) {
          actions.push({
            label: 'Work Offline',
            action: () => {
              // Switch to offline mode with cached data
              console.log('Switching to offline mode');
            },
          });
        }
        break;
      
      case ErrorType.STORAGE_ERROR:
        actions.push({
          label: 'Clear Cache',
          action: () => {
            // Clear app cache/storage
            console.log('Clearing app cache');
          },
        });
        break;
      
      case ErrorType.BOOKING_CONFLICT:
        actions.push({
          label: 'View Alternatives',
          action: () => {
            // Show alternative time slots
            console.log('Showing alternative slots');
          },
        });
        break;
    }

    actions.push({
      label: 'Dismiss',
      action: dismissError,
    });

    return actions;
  }, [isOffline, dismissError]);

  return {
    currentError: state.error,
    hasError: state.error !== null,
    isOffline,
    handleError,
    getErrorMessage,
    getErrorSeverity,
    isRecoverable,
    retry,
    dismissError,
    clearError,
    executeWithRetry,
    executeWithOfflineSupport,
    getRecoveryActions,
  };
};