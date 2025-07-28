import { Appointment, Doctor, AppError, ErrorType } from '../types';
import { DataService } from './DataService';
import { 
  BookingAttempt, 
  ConflictResolutionResult,
  findConflictingAppointments,
  suggestAlternativeSlots,
  resolveBookingConflict 
} from '../utils/conflictResolution';

export interface OptimisticBookingState {
  appointmentId: string;
  originalState: Appointment[];
  rollbackActions: (() => Promise<void>)[];
  timestamp: Date;
}

export interface ConflictResolutionOptions {
  enableOptimisticUpdates: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  maxAlternativeSuggestions: number;
}

export class BookingConflictService {
  private static instance: BookingConflictService;
  private dataService: DataService;
  private pendingBookings: Map<string, BookingAttempt> = new Map();
  private optimisticStates: Map<string, OptimisticBookingState> = new Map();
  
  private defaultOptions: ConflictResolutionOptions = {
    enableOptimisticUpdates: true,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    maxAlternativeSuggestions: 5,
  };

  private constructor() {
    this.dataService = DataService.getInstance();
  }

  public static getInstance(): BookingConflictService {
    if (!BookingConflictService.instance) {
      BookingConflictService.instance = new BookingConflictService();
    }
    return BookingConflictService.instance;
  }

  /**
   * Attempts to book an appointment with conflict detection and resolution
   */
  async bookAppointmentWithConflictResolution(
    appointmentData: Omit<Appointment, 'id' | 'createdAt'>,
    userId: string,
    options: Partial<ConflictResolutionOptions> = {}
  ): Promise<{
    success: boolean;
    appointment?: Appointment;
    error?: AppError;
    alternatives?: Date[];
  }> {
    const resolvedOptions = { ...this.defaultOptions, ...options };
    const bookingId = this.generateBookingId();
    
    try {
      // Create booking attempt with timestamp
      const bookingAttempt: BookingAttempt = {
        appointmentData,
        timestamp: new Date(),
        userId,
      };

      // Store pending booking
      this.pendingBookings.set(bookingId, bookingAttempt);

      // Perform optimistic update if enabled
      let optimisticState: OptimisticBookingState | undefined;
      if (resolvedOptions.enableOptimisticUpdates) {
        optimisticState = await this.performOptimisticUpdate(appointmentData, bookingId);
      }

      // Attempt booking with retry logic
      const result = await this.attemptBookingWithRetry(
        bookingAttempt,
        resolvedOptions.maxRetryAttempts,
        resolvedOptions.retryDelayMs
      );

      if (result.success) {
        // Clean up optimistic state on success
        if (optimisticState) {
          this.optimisticStates.delete(bookingId);
        }
        this.pendingBookings.delete(bookingId);
        
        return {
          success: true,
          appointment: result.appointment,
        };
      } else {
        // Rollback optimistic update on failure
        if (optimisticState) {
          await this.rollbackOptimisticUpdate(bookingId);
        }
        this.pendingBookings.delete(bookingId);

        // Generate alternative suggestions
        const alternatives = await this.generateAlternatives(
          appointmentData,
          resolvedOptions.maxAlternativeSuggestions
        );

        return {
          success: false,
          error: result.error,
          alternatives,
        };
      }
    } catch (error) {
      // Clean up on unexpected error
      this.pendingBookings.delete(bookingId);
      if (this.optimisticStates.has(bookingId)) {
        await this.rollbackOptimisticUpdate(bookingId);
      }


      return {
        success: false,
        error: this.createBookingError('Unexpected error during booking', error),
      };
    }
  }

  /**
   * Detects simultaneous booking attempts for the same slot
   */
  async detectSimultaneousBookings(
    appointmentData: Omit<Appointment, 'id' | 'createdAt'>,
    excludeUserId?: string
  ): Promise<BookingAttempt[]> {
    const simultaneousAttempts: BookingAttempt[] = [];
    
    // Check pending bookings for conflicts
    for (const [bookingId, attempt] of this.pendingBookings.entries()) {
      // Skip the current user's attempt to avoid self-detection
      if (excludeUserId && attempt.userId === excludeUserId) {
        continue;
      }
      
      if (this.hasTimeConflict(appointmentData, attempt.appointmentData)) {
        simultaneousAttempts.push(attempt);
      }
    }

    return simultaneousAttempts;
  }

  /**
   * Resolves conflicts between simultaneous booking attempts
   */
  async resolveSimultaneousBookings(
    currentAttempt: BookingAttempt,
    conflictingAttempts: BookingAttempt[]
  ): Promise<ConflictResolutionResult> {
    const allAttempts = [currentAttempt, ...conflictingAttempts];
    return resolveBookingConflict(allAttempts);
  }

  /**
   * Performs optimistic UI update
   */
  private async performOptimisticUpdate(
    appointmentData: Omit<Appointment, 'id' | 'createdAt'>,
    bookingId: string
  ): Promise<OptimisticBookingState> {
    // Get current appointments state
    const currentAppointments = await this.dataService.getAllAppointments();
    
    // Create temporary appointment for optimistic update
    const tempAppointment: Appointment = {
      id: `temp_${bookingId}`,
      ...appointmentData,
      createdAt: new Date(),
    };

    // Store rollback information
    const optimisticState: OptimisticBookingState = {
      appointmentId: tempAppointment.id,
      originalState: [...currentAppointments],
      rollbackActions: [],
      timestamp: new Date(),
    };

    this.optimisticStates.set(bookingId, optimisticState);
    return optimisticState;
  }

  /**
   * Rolls back optimistic update
   */
  private async rollbackOptimisticUpdate(bookingId: string): Promise<void> {
    const optimisticState = this.optimisticStates.get(bookingId);
    if (!optimisticState) {
      return;
    }

    try {
      // Execute rollback actions
      for (const rollbackAction of optimisticState.rollbackActions) {
        await rollbackAction();
      }

      // Clean up
      this.optimisticStates.delete(bookingId);
    } catch (error) {
      console.error('Error during rollback:', error);
      // Log rollback failure but don't throw to avoid cascading errors
    }
  }

  /**
   * Attempts booking with retry logic
   */
  private async attemptBookingWithRetry(
    bookingAttempt: BookingAttempt,
    maxRetries: number,
    retryDelay: number
  ): Promise<{ success: boolean; appointment?: Appointment; error?: AppError }> {
    let lastError: AppError | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Check for conflicts with existing appointments
        const existingAppointments = await this.dataService.getAllAppointments();
        const conflicts = findConflictingAppointments(bookingAttempt.appointmentData, existingAppointments);

        if (conflicts.length > 0) {
          // Check for simultaneous booking attempts
          const simultaneousAttempts = await this.detectSimultaneousBookings(bookingAttempt.appointmentData, bookingAttempt.userId);
          
          if (simultaneousAttempts.length > 0) {
            // Resolve using timestamp priority
            const resolution = await this.resolveSimultaneousBookings(bookingAttempt, simultaneousAttempts);
            
            if (resolution.winner.userId !== bookingAttempt.userId) {
              lastError = this.createConflictError(
                'Another user booked this slot first',
                conflicts.length
              );
              if (attempt < maxRetries) {
                await this.delay(retryDelay * Math.pow(2, attempt));
                continue;
              } else {
                break;
              }
            }
          } else {
            lastError = this.createConflictError(
              'Time slot is no longer available',
              conflicts.length
            );
            break; // No point in retrying for existing conflicts
          }
        }

        // Double-check availability with storage service
        const isAvailable = await this.dataService.checkSlotAvailability(
          bookingAttempt.appointmentData.doctorId,
          bookingAttempt.appointmentData.dateTime,
          bookingAttempt.appointmentData.duration
        );

        if (!isAvailable) {
          lastError = this.createConflictError(
            'Slot became unavailable during booking process',
            1
          );
          
          if (attempt < maxRetries) {
            await this.delay(retryDelay * Math.pow(2, attempt)); // Exponential backoff
            continue;
          } else {
            break; // Exit loop on final attempt
          }
        }

        // Attempt to save the appointment
        const appointment = await this.dataService.saveAppointment(bookingAttempt.appointmentData);
        
        return {
          success: true,
          appointment,
        };

      } catch (error) {
        lastError = this.createBookingError('Failed to save appointment', error);
        
        if (attempt < maxRetries) {
          await this.delay(retryDelay * Math.pow(2, attempt));
        }
      }
    }

    return {
      success: false,
      error: lastError || this.createBookingError('Maximum retry attempts exceeded', null),
    };
  }

  /**
   * Generates alternative time slot suggestions
   */
  private async generateAlternatives(
    appointmentData: Omit<Appointment, 'id' | 'createdAt'>,
    maxSuggestions: number
  ): Promise<Date[]> {
    try {
      const doctors = await this.dataService.getAllDoctors();
      const doctor = doctors.find(d => d.id === appointmentData.doctorId);
      
      if (!doctor) {
        return [];
      }

      const existingAppointments = await this.dataService.getAllAppointments();
      
      return suggestAlternativeSlots(
        doctor,
        appointmentData.dateTime,
        appointmentData.duration,
        existingAppointments,
        maxSuggestions
      );
    } catch (error) {
      console.error('Error generating alternatives:', error);
      return [];
    }
  }

  /**
   * Checks if two appointment data objects have time conflicts
   */
  private hasTimeConflict(
    appointment1: Omit<Appointment, 'id' | 'createdAt'>,
    appointment2: Omit<Appointment, 'id' | 'createdAt'>
  ): boolean {
    if (appointment1.doctorId !== appointment2.doctorId) {
      return false;
    }

    const start1 = appointment1.dateTime.getTime();
    const end1 = start1 + (appointment1.duration * 60 * 1000);
    
    const start2 = appointment2.dateTime.getTime();
    const end2 = start2 + (appointment2.duration * 60 * 1000);

    return start1 < end2 && end1 > start2;
  }

  /**
   * Creates a booking conflict error
   */
  private createConflictError(message: string, conflictCount: number): AppError {
    return {
      type: ErrorType.BOOKING_CONFLICT,
      message: `${message}${conflictCount > 1 ? ` (${conflictCount} conflicts detected)` : ''}`,
      recoverable: true,
      retryAction: () => {
        console.log('Retry booking after conflict resolution');
      },
    };
  }

  /**
   * Creates a general booking error
   */
  private createBookingError(message: string, originalError: any): AppError {
    return {
      type: ErrorType.STORAGE_ERROR,
      message,
      recoverable: true,
      retryAction: () => {
        console.log('Retry booking operation');
      },
    };
  }

  /**
   * Generates a unique booking ID
   */
  private generateBookingId(): string {
    return `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clears all pending bookings (useful for cleanup)
   */
  clearPendingBookings(): void {
    this.pendingBookings.clear();
  }

  /**
   * Gets current pending bookings count
   */
  getPendingBookingsCount(): number {
    return this.pendingBookings.size;
  }

  /**
   * Gets optimistic states count
   */
  getOptimisticStatesCount(): number {
    return this.optimisticStates.size;
  }
}