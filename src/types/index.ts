// Core data models for the Pet Appointment Scheduler

export interface Doctor {
  id: string;
  name: string;
  specializations: string[];
  schedule: WeeklySchedule;
  rating: number;
  experienceYears: number;
  languages: string[];
}

export interface WeeklySchedule {
  [day: string]: TimeSlot[];
}

export interface TimeSlot {
  startTime: string; // HH:MM format
  endTime: string;
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
}

export interface RecurringPattern {
  type: 'weekly' | 'bi-weekly' | 'monthly';
  interval: number;
  endDate?: Date;
}

export interface Appointment {
  id: string;
  doctorId: string;
  petOwnerId: string;
  petInfo: PetInfo;
  dateTime: Date;
  duration: number; // minutes
  reason: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: Date;
}

export interface PetInfo {
  name: string;
  species: string;
  breed?: string;
  age: number;
}

export interface PetOwner {
  id: string;
  name: string;
  email: string;
  phone: string;
  pets: PetInfo[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'doctor' | 'petOwner';
}

// Date range utility type
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// Error handling types
export enum ErrorType {
  STORAGE_ERROR = 'STORAGE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  BOOKING_CONFLICT = 'BOOKING_CONFLICT',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

export interface AppError {
  type: ErrorType;
  message: string;
  recoverable: boolean;
  retryAction?: () => void;
}

// Storage keys
export const STORAGE_KEYS = {
  DOCTORS: '@doctors',
  APPOINTMENTS: '@appointments',
  PET_OWNERS: '@petOwners',
  USER_PROFILE: '@userProfile',
  APP_STATE: '@appState'
} as const;

// Stored data structure
export interface StoredData {
  doctors: Doctor[];
  appointments: Appointment[];
  petOwners: PetOwner[];
  userProfile: UserProfile | null;
  lastSync: Date;
}