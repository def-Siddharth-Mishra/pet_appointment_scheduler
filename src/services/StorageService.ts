import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageService } from './index';
import { ErrorType, AppError } from '../types';

export class AsyncStorageService implements StorageService {
	private static instance: AsyncStorageService;

	public static getInstance(): AsyncStorageService {
		if (!AsyncStorageService.instance) {
			AsyncStorageService.instance = new AsyncStorageService();
		}
		return AsyncStorageService.instance;
	}

	async getData<T>(key: string): Promise<T | null> {
		try {
			const jsonValue = await AsyncStorage.getItem(key);
			if (jsonValue === null) {
				return null;
			}

			const parsedData = JSON.parse(jsonValue);

			// Handle Date deserialization
			return this.deserializeDates(parsedData);
		} catch (error) {
			console.error(`Error getting data for key ${key}:`, error);
			throw this.createStorageError(`Failed to retrieve data for key: ${key}`, error);
		}
	}

	async setData<T>(key: string, data: T): Promise<void> {
		try {
			const jsonValue = JSON.stringify(data, this.dateReplacer.bind(this));
			await AsyncStorage.setItem(key, jsonValue);
		} catch (error) {
			console.error(`Error setting data for key ${key}:`, error);
			throw this.createStorageError(`Failed to store data for key: ${key}`, error);
		}
	}

	async removeData(key: string): Promise<void> {
		try {
			await AsyncStorage.removeItem(key);
		} catch (error) {
			console.error(`Error removing data for key ${key}:`, error);
			throw this.createStorageError(`Failed to remove data for key: ${key}`, error);
		}
	}

	async clearAll(): Promise<void> {
		try {
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
			return await AsyncStorage.multiGet(keys);
		} catch (error) {
			console.error('Error getting multiple keys:', error);
			throw this.createStorageError('Failed to get multiple keys', error);
		}
	}

	async multiSet(keyValuePairs: Array<[string, string]>): Promise<void> {
		try {
			await AsyncStorage.multiSet(keyValuePairs);
		} catch (error) {
			console.error('Error setting multiple keys:', error);
			throw this.createStorageError('Failed to set multiple keys', error);
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
				// Could implement retry logic here
				console.log('Retry action for storage error');
			}
		};
	}
}