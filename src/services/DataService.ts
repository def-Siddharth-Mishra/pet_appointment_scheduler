import { OptimizedStorageService } from './OptimizedStorageService';
import { PerformanceMonitoringService } from './PerformanceMonitoringService';
import { 
  Doctor, 
  Appointment, 
  PetOwner, 
  UserProfile, 
  STORAGE_KEYS, 
  StoredData,
  ErrorType,
  AppError 
} from '../types';
import { 
  DoctorModel, 
  AppointmentModel, 
  PetOwnerModel 
} from '../models';
import { withStorageRetry } from '../utils/retryMechanism';

export class DataService {
  private static instance: DataService;
  private storageService: OptimizedStorageService;
  private performanceService: PerformanceMonitoringService;

  private constructor() {
    this.storageService = OptimizedStorageService.getInstance();
    this.performanceService = PerformanceMonitoringService.getInstance();
  }

  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  // Initialize storage with default data structure
  async initializeStorage(): Promise<void> {
    return this.performanceService.measureAsync('DataService.initializeStorage', async () => {
      try {
        const existingData = await withStorageRetry(() => 
          this.storageService.getData<StoredData>(STORAGE_KEYS.APP_STATE)
        );
      
      if (!existingData) {
        const initialData: StoredData = {
          doctors: [],
          appointments: [],
          petOwners: [],
          userProfile: null,
          lastSync: new Date()
        };
        
        await withStorageRetry(() => 
          this.storageService.setData(STORAGE_KEYS.APP_STATE, initialData)
        );
        await withStorageRetry(() => 
          this.storageService.setData(STORAGE_KEYS.DOCTORS, [])
        );
        await withStorageRetry(() => 
          this.storageService.setData(STORAGE_KEYS.APPOINTMENTS, [])
        );
        await withStorageRetry(() => 
          this.storageService.setData(STORAGE_KEYS.PET_OWNERS, [])
        );
        await withStorageRetry(() => 
          this.storageService.setData(STORAGE_KEYS.USER_PROFILE, null)
        );
        }
      } catch (error) {
        console.error('Error initializing storage:', error);
        throw this.createDataError('Failed to initialize storage', error);
      }
    });
  }

  // Doctor CRUD operations
  async getAllDoctors(): Promise<Doctor[]> {
    return this.performanceService.measureAsync('DataService.getAllDoctors', async () => {
      try {
        const doctors = await withStorageRetry(() => 
          this.storageService.getData<Doctor[]>(STORAGE_KEYS.DOCTORS)
        );
        return doctors || [];
      } catch (error) {
        console.error('Error getting all doctors:', error);
        throw this.createDataError('Failed to retrieve doctors', error);
      }
    });
  }

  async getDoctorById(doctorId: string): Promise<Doctor | null> {
    try {
      const doctors = await this.getAllDoctors();
      return doctors.find(doctor => doctor.id === doctorId) || null;
    } catch (error) {
      console.error(`Error getting doctor ${doctorId}:`, error);
      throw this.createDataError(`Failed to retrieve doctor: ${doctorId}`, error);
    }
  }

  async saveDoctor(doctorData: Omit<Doctor, 'id'>): Promise<Doctor> {
    try {
      // Create doctor with temporary ID for validation
      const tempDoctor = DoctorModel.create(doctorData);
      
      // Validate doctor data
      const validationErrors = DoctorModel.validate(tempDoctor);
      if (validationErrors.length > 0) {
        const error = this.createValidationError(`Doctor validation failed: ${validationErrors.join(', ')}`);
        console.error('Error saving doctor:', error);
        throw error;
      }

      const doctors = await this.getAllDoctors();
      
      doctors.push(tempDoctor);
      await withStorageRetry(() => 
        this.storageService.setData(STORAGE_KEYS.DOCTORS, doctors)
      );
      await this.updateLastSync();
      
      return tempDoctor;
    } catch (error) {
      if (error && typeof error === 'object' && 'type' in error && error.type === ErrorType.VALIDATION_ERROR) {
        throw error;
      }
      console.error('Error saving doctor:', error);
      throw this.createDataError('Failed to save doctor', error);
    }
  }

  async updateDoctor(doctor: Doctor): Promise<void> {
    try {
      // Validate doctor data
      const validationErrors = DoctorModel.validate(doctor);
      if (validationErrors.length > 0) {
        throw this.createValidationError(`Doctor validation failed: ${validationErrors.join(', ')}`);
      }

      const doctors = await this.getAllDoctors();
      const index = doctors.findIndex(d => d.id === doctor.id);
      
      if (index === -1) {
        throw this.createDataError(`Doctor not found: ${doctor.id}`, null);
      }
      
      doctors[index] = doctor;
      await this.storageService.setData(STORAGE_KEYS.DOCTORS, doctors);
      await this.updateLastSync();
    } catch (error) {
      console.error('Error updating doctor:', error);
      if (error instanceof Error && error.message.includes('validation')) {
        throw error;
      }
      throw this.createDataError('Failed to update doctor', error);
    }
  }

  async deleteDoctor(doctorId: string): Promise<void> {
    try {
      const doctors = await this.getAllDoctors();
      const filteredDoctors = doctors.filter(doctor => doctor.id !== doctorId);
      
      if (doctors.length === filteredDoctors.length) {
        throw this.createDataError(`Doctor not found: ${doctorId}`, null);
      }
      
      await this.storageService.setData(STORAGE_KEYS.DOCTORS, filteredDoctors);
      await this.updateLastSync();
    } catch (error) {
      console.error('Error deleting doctor:', error);
      throw this.createDataError('Failed to delete doctor', error);
    }
  }

  // Appointment CRUD operations
  async getAllAppointments(): Promise<Appointment[]> {
    return this.performanceService.measureAsync('DataService.getAllAppointments', async () => {
      try {
        const appointments = await this.storageService.getData<Appointment[]>(STORAGE_KEYS.APPOINTMENTS);
        return appointments || [];
      } catch (error) {
        console.error('Error getting all appointments:', error);
        throw this.createDataError('Failed to retrieve appointments', error);
      }
    });
  }

  async getAppointmentById(appointmentId: string): Promise<Appointment | null> {
    try {
      const appointments = await this.getAllAppointments();
      return appointments.find(appointment => appointment.id === appointmentId) || null;
    } catch (error) {
      console.error(`Error getting appointment ${appointmentId}:`, error);
      throw this.createDataError(`Failed to retrieve appointment: ${appointmentId}`, error);
    }
  }

  async saveAppointment(appointmentData: Omit<Appointment, 'id' | 'createdAt'>): Promise<Appointment> {
    try {
      // Create appointment with temporary ID for validation
      const tempAppointment = AppointmentModel.create(appointmentData);
      
      // Validate appointment data
      const validationErrors = AppointmentModel.validate(tempAppointment);
      if (validationErrors.length > 0) {
        const error = this.createValidationError(`Appointment validation failed: ${validationErrors.join(', ')}`);
        console.error('Error saving appointment:', error);
        throw error;
      }

      const appointments = await this.getAllAppointments();
      
      appointments.push(tempAppointment);
      await this.storageService.setData(STORAGE_KEYS.APPOINTMENTS, appointments);
      await this.updateLastSync();
      
      return tempAppointment;
    } catch (error) {
      if (error && typeof error === 'object' && 'type' in error && error.type === ErrorType.VALIDATION_ERROR) {
        throw error;
      }
      console.error('Error saving appointment:', error);
      throw this.createDataError('Failed to save appointment', error);
    }
  }

  async updateAppointment(appointment: Appointment): Promise<void> {
    try {
      // Validate appointment data
      const validationErrors = AppointmentModel.validate(appointment);
      if (validationErrors.length > 0) {
        throw this.createValidationError(`Appointment validation failed: ${validationErrors.join(', ')}`);
      }

      const appointments = await this.getAllAppointments();
      const index = appointments.findIndex(a => a.id === appointment.id);
      
      if (index === -1) {
        throw this.createDataError(`Appointment not found: ${appointment.id}`, null);
      }
      
      appointments[index] = appointment;
      await this.storageService.setData(STORAGE_KEYS.APPOINTMENTS, appointments);
      await this.updateLastSync();
    } catch (error) {
      console.error('Error updating appointment:', error);
      if (error instanceof Error && error.message.includes('validation')) {
        throw error;
      }
      throw this.createDataError('Failed to update appointment', error);
    }
  }

  async deleteAppointment(appointmentId: string): Promise<void> {
    try {
      const appointments = await this.getAllAppointments();
      const filteredAppointments = appointments.filter(appointment => appointment.id !== appointmentId);
      
      if (appointments.length === filteredAppointments.length) {
        throw this.createDataError(`Appointment not found: ${appointmentId}`, null);
      }
      
      await this.storageService.setData(STORAGE_KEYS.APPOINTMENTS, filteredAppointments);
      await this.updateLastSync();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw this.createDataError('Failed to delete appointment', error);
    }
  }

  // PetOwner CRUD operations
  async getAllPetOwners(): Promise<PetOwner[]> {
    try {
      const petOwners = await this.storageService.getData<PetOwner[]>(STORAGE_KEYS.PET_OWNERS);
      return petOwners || [];
    } catch (error) {
      console.error('Error getting all pet owners:', error);
      throw this.createDataError('Failed to retrieve pet owners', error);
    }
  }

  async getPetOwnerById(petOwnerId: string): Promise<PetOwner | null> {
    try {
      const petOwners = await this.getAllPetOwners();
      return petOwners.find(petOwner => petOwner.id === petOwnerId) || null;
    } catch (error) {
      console.error(`Error getting pet owner ${petOwnerId}:`, error);
      throw this.createDataError(`Failed to retrieve pet owner: ${petOwnerId}`, error);
    }
  }

  async savePetOwner(petOwnerData: Omit<PetOwner, 'id'>): Promise<PetOwner> {
    try {
      // Create pet owner with temporary ID for validation
      const tempPetOwner = PetOwnerModel.create(petOwnerData);
      
      // Validate pet owner data
      const validationErrors = PetOwnerModel.validate(tempPetOwner);
      if (validationErrors.length > 0) {
        const error = this.createValidationError(`Pet owner validation failed: ${validationErrors.join(', ')}`);
        console.error('Error saving pet owner:', error);
        throw error;
      }

      const petOwners = await this.getAllPetOwners();
      
      petOwners.push(tempPetOwner);
      await this.storageService.setData(STORAGE_KEYS.PET_OWNERS, petOwners);
      await this.updateLastSync();
      
      return tempPetOwner;
    } catch (error) {
      if (error && typeof error === 'object' && 'type' in error && error.type === ErrorType.VALIDATION_ERROR) {
        throw error;
      }
      console.error('Error saving pet owner:', error);
      throw this.createDataError('Failed to save pet owner', error);
    }
  }

  async updatePetOwner(petOwner: PetOwner): Promise<void> {
    try {
      // Validate pet owner data
      const validationErrors = PetOwnerModel.validate(petOwner);
      if (validationErrors.length > 0) {
        throw this.createValidationError(`Pet owner validation failed: ${validationErrors.join(', ')}`);
      }

      const petOwners = await this.getAllPetOwners();
      const index = petOwners.findIndex(p => p.id === petOwner.id);
      
      if (index === -1) {
        throw this.createDataError(`Pet owner not found: ${petOwner.id}`, null);
      }
      
      petOwners[index] = petOwner;
      await this.storageService.setData(STORAGE_KEYS.PET_OWNERS, petOwners);
      await this.updateLastSync();
    } catch (error) {
      console.error('Error updating pet owner:', error);
      if (error instanceof Error && error.message.includes('validation')) {
        throw error;
      }
      throw this.createDataError('Failed to update pet owner', error);
    }
  }

  async deletePetOwner(petOwnerId: string): Promise<void> {
    try {
      const petOwners = await this.getAllPetOwners();
      const filteredPetOwners = petOwners.filter(petOwner => petOwner.id !== petOwnerId);
      
      if (petOwners.length === filteredPetOwners.length) {
        throw this.createDataError(`Pet owner not found: ${petOwnerId}`, null);
      }
      
      await this.storageService.setData(STORAGE_KEYS.PET_OWNERS, filteredPetOwners);
      await this.updateLastSync();
    } catch (error) {
      console.error('Error deleting pet owner:', error);
      throw this.createDataError('Failed to delete pet owner', error);
    }
  }

  // User profile operations
  async getUserProfile(): Promise<UserProfile | null> {
    try {
      return await this.storageService.getData<UserProfile>(STORAGE_KEYS.USER_PROFILE);
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw this.createDataError('Failed to retrieve user profile', error);
    }
  }

  async setUserProfile(userProfile: UserProfile): Promise<void> {
    try {
      await this.storageService.setData(STORAGE_KEYS.USER_PROFILE, userProfile);
      await this.updateLastSync();
    } catch (error) {
      console.error('Error setting user profile:', error);
      throw this.createDataError('Failed to save user profile', error);
    }
  }

  // Utility methods
  async getAppointmentsByDoctor(doctorId: string): Promise<Appointment[]> {
    try {
      const appointments = await this.getAllAppointments();
      return appointments.filter(appointment => appointment.doctorId === doctorId);
    } catch (error) {
      console.error(`Error getting appointments for doctor ${doctorId}:`, error);
      throw this.createDataError(`Failed to retrieve appointments for doctor: ${doctorId}`, error);
    }
  }

  async getAppointmentsByPetOwner(petOwnerId: string): Promise<Appointment[]> {
    try {
      const appointments = await this.getAllAppointments();
      return appointments.filter(appointment => appointment.petOwnerId === petOwnerId);
    } catch (error) {
      console.error(`Error getting appointments for pet owner ${petOwnerId}:`, error);
      throw this.createDataError(`Failed to retrieve appointments for pet owner: ${petOwnerId}`, error);
    }
  }

  async checkSlotAvailability(doctorId: string, dateTime: Date, duration: number = 30): Promise<boolean> {
    try {
      const appointments = await this.getAppointmentsByDoctor(doctorId);
      const requestedStart = dateTime.getTime();
      const requestedEnd = requestedStart + (duration * 60 * 1000);

      // Check for conflicts with existing appointments
      const hasConflict = appointments.some(appointment => {
        if (appointment.status === 'cancelled') return false;
        
        const appointmentStart = appointment.dateTime.getTime();
        const appointmentEnd = appointmentStart + (appointment.duration * 60 * 1000);
        
        // Check for overlap
        return (requestedStart < appointmentEnd && requestedEnd > appointmentStart);
      });

      return !hasConflict;
    } catch (error) {
      console.error(`Error checking slot availability for doctor ${doctorId}:`, error);
      throw this.createDataError(`Failed to check slot availability for doctor: ${doctorId}`, error);
    }
  }

  private async updateLastSync(): Promise<void> {
    try {
      const appState = await this.storageService.getData<StoredData>(STORAGE_KEYS.APP_STATE);
      if (appState) {
        appState.lastSync = new Date();
        await this.storageService.setData(STORAGE_KEYS.APP_STATE, appState);
      }
    } catch (error) {
      console.error('Error updating last sync:', error);
      // Don't throw here as this is not critical
    }
  }

  private createDataError(message: string, originalError: any): AppError {
    return {
      type: ErrorType.STORAGE_ERROR,
      message,
      recoverable: true,
      retryAction: () => {
        console.log('Retry action for data error');
      }
    };
  }

  private createValidationError(message: string): AppError {
    return {
      type: ErrorType.VALIDATION_ERROR,
      message,
      recoverable: false
    };
  }

  // Batch operations for better performance
  async batchSaveAppointments(appointments: Omit<Appointment, 'id' | 'createdAt'>[]): Promise<Appointment[]> {
    try {
      const validatedAppointments: Appointment[] = [];
      
      // Validate all appointments first
      for (const appointmentData of appointments) {
        const tempAppointment = AppointmentModel.create(appointmentData);
        const validationErrors = AppointmentModel.validate(tempAppointment);
        
        if (validationErrors.length > 0) {
          throw this.createValidationError(`Appointment validation failed: ${validationErrors.join(', ')}`);
        }
        
        validatedAppointments.push(tempAppointment);
      }

      // Get existing appointments and add new ones
      const existingAppointments = await this.getAllAppointments();
      const allAppointments = [...existingAppointments, ...validatedAppointments];
      
      // Save all at once
      await this.storageService.setData(STORAGE_KEYS.APPOINTMENTS, allAppointments, true);
      await this.updateLastSync();
      
      return validatedAppointments;
    } catch (error) {
      if (error && typeof error === 'object' && 'type' in error && error.type === ErrorType.VALIDATION_ERROR) {
        throw error;
      }
      console.error('Error batch saving appointments:', error);
      throw this.createDataError('Failed to batch save appointments', error);
    }
  }

  async batchUpdateAppointments(appointments: Appointment[]): Promise<void> {
    try {
      // Validate all appointments first
      for (const appointment of appointments) {
        const validationErrors = AppointmentModel.validate(appointment);
        if (validationErrors.length > 0) {
          throw this.createValidationError(`Appointment validation failed: ${validationErrors.join(', ')}`);
        }
      }

      const existingAppointments = await this.getAllAppointments();
      const appointmentMap = new Map(appointments.map(apt => [apt.id, apt]));
      
      // Update existing appointments
      const updatedAppointments = existingAppointments.map(existing => 
        appointmentMap.get(existing.id) || existing
      );
      
      await this.storageService.setData(STORAGE_KEYS.APPOINTMENTS, updatedAppointments, true);
      await this.updateLastSync();
    } catch (error) {
      if (error && typeof error === 'object' && 'type' in error && error.type === ErrorType.VALIDATION_ERROR) {
        throw error;
      }
      console.error('Error batch updating appointments:', error);
      throw this.createDataError('Failed to batch update appointments', error);
    }
  }

  // Get paginated appointments for lazy loading
  async getPaginatedAppointments(
    page: number = 0, 
    pageSize: number = 20, 
    sortBy: 'dateTime' | 'createdAt' = 'dateTime',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ appointments: Appointment[]; hasMore: boolean; total: number }> {
    try {
      const allAppointments = await this.getAllAppointments();
      
      // Sort appointments
      const sortedAppointments = [...allAppointments].sort((a, b) => {
        const aValue = sortBy === 'dateTime' ? a.dateTime.getTime() : a.createdAt.getTime();
        const bValue = sortBy === 'dateTime' ? b.dateTime.getTime() : b.createdAt.getTime();
        
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      });

      const startIndex = page * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedAppointments = sortedAppointments.slice(startIndex, endIndex);
      
      return {
        appointments: paginatedAppointments,
        hasMore: endIndex < sortedAppointments.length,
        total: sortedAppointments.length,
      };
    } catch (error) {
      console.error('Error getting paginated appointments:', error);
      throw this.createDataError('Failed to get paginated appointments', error);
    }
  }

  // Get appointments with filtering and pagination
  async getFilteredAppointments(filters: {
    doctorId?: string;
    petOwnerId?: string;
    status?: string[];
    dateRange?: { start: Date; end: Date };
    page?: number;
    pageSize?: number;
  }): Promise<{ appointments: Appointment[]; hasMore: boolean; total: number }> {
    try {
      const allAppointments = await this.getAllAppointments();
      
      // Apply filters
      let filteredAppointments = allAppointments.filter(appointment => {
        if (filters.doctorId && appointment.doctorId !== filters.doctorId) {
          return false;
        }
        
        if (filters.petOwnerId && appointment.petOwnerId !== filters.petOwnerId) {
          return false;
        }
        
        if (filters.status && !filters.status.includes(appointment.status)) {
          return false;
        }
        
        if (filters.dateRange) {
          const appointmentTime = appointment.dateTime.getTime();
          const startTime = filters.dateRange.start.getTime();
          const endTime = filters.dateRange.end.getTime();
          
          if (appointmentTime < startTime || appointmentTime > endTime) {
            return false;
          }
        }
        
        return true;
      });

      // Sort by date (most recent first)
      filteredAppointments.sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime());

      // Apply pagination
      const page = filters.page || 0;
      const pageSize = filters.pageSize || 20;
      const startIndex = page * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedAppointments = filteredAppointments.slice(startIndex, endIndex);
      
      return {
        appointments: paginatedAppointments,
        hasMore: endIndex < filteredAppointments.length,
        total: filteredAppointments.length,
      };
    } catch (error) {
      console.error('Error getting filtered appointments:', error);
      throw this.createDataError('Failed to get filtered appointments', error);
    }
  }

  // Performance monitoring methods
  getPerformanceStats(): Record<string, any> {
    const performanceReport = this.performanceService.getPerformanceReport();
    const cacheStats = this.storageService.getCacheStats();
    
    return {
      operations: performanceReport,
      cache: cacheStats,
      timestamp: new Date().toISOString(),
    };
  }

  async flushPendingOperations(): Promise<void> {
    try {
      await this.storageService.flushBatch();
    } catch (error) {
      console.error('Error flushing pending operations:', error);
      throw this.createDataError('Failed to flush pending operations', error);
    }
  }

  clearPerformanceMetrics(): void {
    this.performanceService.clearMetrics();
  }

  // Clear all data (useful for testing or reset)
  async clearAllData(): Promise<void> {
    try {
      await this.storageService.clearAll();
      await this.initializeStorage();
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw this.createDataError('Failed to clear all data', error);
    }
  }
}