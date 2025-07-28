import { useState, useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useAppContext } from '../context/AppContext';
import { AppError, ErrorType } from '../types';

interface OfflineState {
  isOffline: boolean;
  isConnected: boolean;
  connectionType: string | null;
  hasInternetReachability: boolean;
}

interface OfflineHandlerOptions {
  enableCaching: boolean;
  showOfflineMessage: boolean;
  retryOnReconnect: boolean;
}

export const useOfflineHandler = (options: OfflineHandlerOptions = {
  enableCaching: true,
  showOfflineMessage: true,
  retryOnReconnect: true,
}) => {
  const { state, loadAllData, clearError } = useAppContext();
  const [offlineState, setOfflineState] = useState<OfflineState>({
    isOffline: false,
    isConnected: true,
    connectionType: null,
    hasInternetReachability: true,
  });
  const [pendingOperations, setPendingOperations] = useState<Array<() => Promise<void>>>([]);
  const [cachedData, setCachedData] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const isOffline = !state.isConnected || !state.isInternetReachable;
      
      setOfflineState({
        isOffline,
        isConnected: state.isConnected || false,
        connectionType: state.type,
        hasInternetReachability: state.isInternetReachable || false,
      });

      // Handle reconnection
      if (!isOffline && offlineState.isOffline && options.retryOnReconnect) {
        handleReconnection();
      }

      // Show offline message
      if (isOffline && options.showOfflineMessage) {
        // This would typically show a toast or banner
        console.log('App is offline - using cached data');
      }
    });

    return () => unsubscribe();
  }, [offlineState.isOffline, options.retryOnReconnect, options.showOfflineMessage]);

  const handleReconnection = useCallback(async () => {
    try {
      // Clear any offline-related errors
      clearError();
      
      // Retry pending operations
      if (pendingOperations.length > 0) {
        console.log(`Retrying ${pendingOperations.length} pending operations...`);
        
        for (const operation of pendingOperations) {
          try {
            await operation();
          } catch (error) {
            console.error('Failed to retry operation:', error);
          }
        }
        
        setPendingOperations([]);
      }
      
      // Refresh data from storage
      await loadAllData();
    } catch (error) {
      console.error('Error during reconnection:', error);
    }
  }, [pendingOperations, clearError, loadAllData]);

  const addPendingOperation = useCallback((operation: () => Promise<void>) => {
    setPendingOperations(prev => [...prev, operation]);
  }, []);

  const getCachedData = useCallback(() => {
    if (options.enableCaching && offlineState.isOffline) {
      return cachedData || {
        doctors: state.doctors,
        appointments: state.appointments,
        petOwners: state.petOwners,
      };
    }
    return null;
  }, [options.enableCaching, offlineState.isOffline, cachedData, state]);

  const updateCache = useCallback((data: any) => {
    if (options.enableCaching) {
      setCachedData(data);
    }
  }, [options.enableCaching]);

  const createOfflineError = useCallback((operation: string): AppError => {
    return {
      type: ErrorType.NETWORK_ERROR,
      message: `Cannot ${operation} while offline. Changes will be saved when connection is restored.`,
      recoverable: true,
      retryAction: () => {
        if (!offlineState.isOffline) {
          handleReconnection();
        }
      },
    };
  }, [offlineState.isOffline, handleReconnection]);

  const executeWithOfflineHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string,
    fallbackValue?: T
  ): Promise<T> => {
    if (offlineState.isOffline) {
      // Add to pending operations for retry when online
      addPendingOperation(async () => {
        await operation();
      });
      
      // Throw offline error
      throw createOfflineError(operationName);
    }
    
    try {
      const result = await operation();
      
      // Update cache with successful result
      if (options.enableCaching) {
        updateCache(result);
      }
      
      return result;
    } catch (error) {
      // If it's a network error and we have cached data, use it
      if (options.enableCaching && cachedData && fallbackValue !== undefined) {
        console.log(`Using cached data for ${operationName} due to network error`);
        return fallbackValue;
      }
      
      throw error;
    }
  }, [offlineState.isOffline, addPendingOperation, createOfflineError, options.enableCaching, updateCache, cachedData]);

  return {
    ...offlineState,
    pendingOperationsCount: pendingOperations.length,
    getCachedData,
    updateCache,
    executeWithOfflineHandling,
    createOfflineError,
    handleReconnection,
  };
};