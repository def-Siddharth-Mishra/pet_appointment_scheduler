import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageService } from './index';
import { ErrorType, AppError } from '../types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface BatchOperation {
  type: 'set' | 'remove';
  key: string;
  value?: any;
}

export class OptimizedStorageService implements StorageService {
  private static instance: OptimizedStorageService;
  private cache = new Map<string, CacheEntry<any>>();
  private batchQueue: BatchOperation[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 100; // ms
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 100;

  public static getInstance(): OptimizedStorageService {
    if (!OptimizedStorageService.instance) {
      OptimizedStorageService.instance = new OptimizedStorageService();
    }
    return OptimizedStorageService.instance;
  }

  async getData<T>(key: string, ttl: number = this.DEFAULT_TTL): Promise<T | null> {
    try {
      // Check cache first
      const cached = this.getCachedData<T>(key);
      if (cached !== null) {
        return cached;
      }

      const jsonValue = await AsyncStorage.getItem(key);
      if (jsonValue === null || jsonValue === undefined || jsonValue === 'undefined') {
        return null;
      }

      const parsedData = JSON.parse(jsonValue);
      const deserializedData = this.deserializeDates(parsedData);

      // Cache the result
      this.setCachedData(key, deserializedData, ttl);

      return deserializedData;
    } catch (error) {
      console.error(`Error getting data for key ${key}:`, error);
      throw this.createStorageError(`Failed to retrieve data for key: ${key}`, error);
    }
  }

  async setData<T>(key: string, data: T, immediate: boolean = false): Promise<void> {
    try {
      // Update cache immediately
      this.setCachedData(key, data, this.DEFAULT_TTL);

      if (immediate) {
        // Write immediately for critical data
        const jsonValue = JSON.stringify(data, this.dateReplacer.bind(this));
        await AsyncStorage.setItem(key, jsonValue);
      } else {
        // Add to batch queue
        this.addToBatch('set', key, data);
      }
    } catch (error) {
      console.error(`Error setting data for key ${key}:`, error);
      throw this.createStorageError(`Failed to store data for key: ${key}`, error);
    }
  }

  async removeData(key: string, immediate: boolean = false): Promise<void> {
    try {
      // Remove from cache immediately
      this.cache.delete(key);

      if (immediate) {
        await AsyncStorage.removeItem(key);
      } else {
        this.addToBatch('remove', key);
      }
    } catch (error) {
      console.error(`Error removing data for key ${key}:`, error);
      throw this.createStorageError(`Failed to remove data for key: ${key}`, error);
    }
  }

  async clearAll(): Promise<void> {
    try {
      this.cache.clear();
      this.batchQueue = [];
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
        this.batchTimeout = null;
      }
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw this.createStorageError('Failed to clear all data', error);
    }
  }

  async getAllKeys(): Promise<readonly string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Error getting all keys:', error);
      throw this.createStorageError('Failed to get all keys', error);
    }
  }

  async multiGet(keys: string[]): Promise<readonly [string, string | null][]> {
    try {
      // Check cache for each key first
      const cachedResults: [string, string | null][] = [];
      const uncachedKeys: string[] = [];

      keys.forEach(key => {
        const cached = this.getCachedData(key);
        if (cached !== null) {
          cachedResults.push([key, JSON.stringify(cached, this.dateReplacer.bind(this))]);
        } else {
          uncachedKeys.push(key);
        }
      });

      // Fetch uncached keys from storage
      let storageResults: readonly [string, string | null][] = [];
      if (uncachedKeys.length > 0) {
        storageResults = await AsyncStorage.multiGet(uncachedKeys);
        
        // Cache the results
        storageResults.forEach(([key, value]) => {
          if (value !== null) {
            try {
              const parsedData = JSON.parse(value);
              const deserializedData = this.deserializeDates(parsedData);
              this.setCachedData(key, deserializedData, this.DEFAULT_TTL);
            } catch (error) {
              console.warn(`Failed to parse cached data for key ${key}:`, error);
            }
          }
        });
      }

      return [...cachedResults, ...storageResults];
    } catch (error) {
      console.error('Error getting multiple keys:', error);
      throw this.createStorageError('Failed to get multiple keys', error);
    }
  }

  async multiSet(keyValuePairs: Array<[string, string]>): Promise<void> {
    try {
      // Update cache for all pairs
      keyValuePairs.forEach(([key, value]) => {
        try {
          const parsedData = JSON.parse(value);
          const deserializedData = this.deserializeDates(parsedData);
          this.setCachedData(key, deserializedData, this.DEFAULT_TTL);
        } catch (error) {
          console.warn(`Failed to cache data for key ${key}:`, error);
        }
      });

      await AsyncStorage.multiSet(keyValuePairs);
    } catch (error) {
      console.error('Error setting multiple keys:', error);
      throw this.createStorageError('Failed to set multiple keys', error);
    }
  }

  // Force flush all pending batch operations
  async flushBatch(): Promise<void> {
    if (this.batchQueue.length === 0) return;

    try {
      const operations = [...this.batchQueue];
      this.batchQueue = [];

      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
        this.batchTimeout = null;
      }

      // Group operations by type for efficiency
      const setOperations: Array<[string, string]> = [];
      const removeKeys: string[] = [];

      operations.forEach(op => {
        if (op.type === 'set') {
          const jsonValue = JSON.stringify(op.value, this.dateReplacer.bind(this));
          setOperations.push([op.key, jsonValue]);
        } else if (op.type === 'remove') {
          removeKeys.push(op.key);
        }
      });

      // Execute batch operations
      const promises: Promise<void>[] = [];
      
      if (setOperations.length > 0) {
        promises.push(AsyncStorage.multiSet(setOperations));
      }
      
      if (removeKeys.length > 0) {
        promises.push(
          Promise.all(removeKeys.map(key => AsyncStorage.removeItem(key))).then(() => {})
        );
      }

      await Promise.all(promises);
    } catch (error) {
      console.error('Error flushing batch operations:', error);
      throw this.createStorageError('Failed to flush batch operations', error);
    }
  }

  // Get cache statistics for monitoring
  getCacheStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    this.cache.forEach(entry => {
      if (now - entry.timestamp < entry.ttl) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    });

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      hitRate: this.cacheHits / Math.max(this.cacheRequests, 1),
      maxSize: this.MAX_CACHE_SIZE,
    };
  }

  // Clear expired cache entries
  clearExpiredCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp >= entry.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  private cacheHits = 0;
  private cacheRequests = 0;

  private getCachedData<T>(key: string): T | null {
    this.cacheRequests++;
    
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp >= entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    this.cacheHits++;
    return entry.data;
  }

  private setCachedData<T>(key: string, data: T, ttl: number): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE && !this.cache.has(key)) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  private addToBatch(type: 'set' | 'remove', key: string, value?: any): void {
    this.batchQueue.push({ type, key, value });

    // Schedule batch flush if not already scheduled
    if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => {
        this.flushBatch().catch(error => {
          console.error('Error in batch flush:', error);
        });
      }, this.BATCH_DELAY);
    }
  }

  // Date serialization helper
  private dateReplacer(_key: string, value: any): any {
    if (value instanceof Date) {
      return { __type: 'Date', value: value.toISOString() };
    }
    return value;
  }

  // Date deserialization helper
  private deserializeDates(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'object' && obj.__type === 'Date') {
      return new Date(obj.value);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.deserializeDates(item));
    }

    if (typeof obj === 'object') {
      const result: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          result[key] = this.deserializeDates(obj[key]);
        }
      }
      return result;
    }

    return obj;
  }

  private createStorageError(message: string, _originalError: any): AppError {
    return {
      type: ErrorType.STORAGE_ERROR,
      message,
      recoverable: true,
      retryAction: () => {
        console.log('Retry action for storage error');
      }
    };
  }
}