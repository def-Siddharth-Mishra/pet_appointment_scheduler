import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { 
  Doctor, 
  Appointment, 
  PetOwner, 
  UserProfile, 
  AppError, 
  ErrorType 
} from '../types';
import { DataService } from '../services/DataService';
import { PerformanceMonitoringService } from '../services/PerformanceMonitoringService';
import { 
  findConflictingAppointments, 
  validateScheduleUpdate,
  suggestAlternativeSlots 
} from '../utils/conflictResolution';
import { BookingConflictService } from '../services/BookingConflictService';

// State interface
export interface AppState {
  // User state
  currentUser: UserProfile | null;
  userType: 'doctor' | 'petOwner' | null;
  
  // Data state
  doctors: Doctor[];
  appointments: Appointment[];
  petOwners: PetOwner[];
  
  // UI state
  loading: boolean;
  error: AppError | null;
  
  // Operation states
  bookingInProgress: boolean;
  scheduleUpdateInProgress: boolean;
}

// Action types
export type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: AppError | null }
  | { type: 'SET_USER'; payload: { user: UserProfile; userType: 'doctor' | 'petOwner' } }
  | { type: 'CLEAR_USER' }
  | { type: 'SET_DOCTORS'; payload: Doctor[] }
  | { type: 'ADD_DOCTOR'; payload: Doctor }
  | { type: 'UPDATE_DOCTOR'; payload: Doctor }
  | { type: 'REMOVE_DOCTOR'; payload: string }
  | { type: 'SET_APPOINTMENTS'; payload: Appointment[] }
  | { type: 'ADD_APPOINTMENT'; payload: Appointment }
  | { type: 'UPDATE_APPOINTMENT'; payload: Appointment }
  | { type: 'REMOVE_APPOINTMENT'; payload: string }
  | { type: 'SET_PET_OWNERS'; payload: PetOwner[] }
  | { type: 'ADD_PET_OWNER'; payload: PetOwner }
  | { type: 'UPDATE_PET_OWNER'; payload: PetOwner }
  | { type: 'REMOVE_PET_OWNER'; payload: string }
  | { type: 'SET_BOOKING_IN_PROGRESS'; payload: boolean }
  | { type: 'SET_SCHEDULE_UPDATE_IN_PROGRESS'; payload: boolean };

// Initial state
const initialState: AppState = {
  currentUser: null,
  userType: null,
  doctors: [],
  appointments: [],
  petOwners: [],
  loading: false,
  error: null,
  bookingInProgress: false,
  scheduleUpdateInProgress: false,
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_USER':
      return { 
        ...state, 
        currentUser: action.payload.user, 
        userType: action.payload.userType 
      };
    
    case 'CLEAR_USER':
      return { 
        ...state, 
        currentUser: null, 
        userType: null 
      };
    
    case 'SET_DOCTORS':
      return { ...state, doctors: action.payload };
    
    case 'ADD_DOCTOR':
      return { 
        ...state, 
        doctors: [...state.doctors, action.payload] 
      };
    
    case 'UPDATE_DOCTOR':
      return {
        ...state,
        doctors: state.doctors.map(doctor =>
          doctor.id === action.payload.id ? action.payload : doctor
        ),
      };
    
    case 'REMOVE_DOCTOR':
      return {
        ...state,
        doctors: state.doctors.filter(doctor => doctor.id !== action.payload),
      };
    
    case 'SET_APPOINTMENTS':
      return { ...state, appointments: action.payload };
    
    case 'ADD_APPOINTMENT':
      return { 
        ...state, 
        appointments: [...state.appointments, action.payload] 
      };
    
    case 'UPDATE_APPOINTMENT':
      return {
        ...state,
        appointments: state.appointments.map(appointment =>
          appointment.id === action.payload.id ? action.payload : appointment
        ),
      };
    
    case 'REMOVE_APPOINTMENT':
      return {
        ...state,
        appointments: state.appointments.filter(appointment => appointment.id !== action.payload),
      };
    
    case 'SET_PET_OWNERS':
      return { ...state, petOwners: action.payload };
    
    case 'ADD_PET_OWNER':
      return { 
        ...state, 
        petOwners: [...state.petOwners, action.payload] 
      };
    
    case 'UPDATE_PET_OWNER':
      return {
        ...state,
        petOwners: state.petOwners.map(petOwner =>
          petOwner.id === action.payload.id ? action.payload : petOwner
        ),
      };
    
    case 'REMOVE_PET_OWNER':
      return {
        ...state,
        petOwners: state.petOwners.filter(petOwner => petOwner.id !== action.payload),
      };
    
    case 'SET_BOOKING_IN_PROGRESS':
      return { ...state, bookingInProgress: action.payload };
    
    case 'SET_SCHEDULE_UPDATE_IN_PROGRESS':
      return { ...state, scheduleUpdateInProgress: action.payload };
    
    default:
      return state;
  }
}

// Context interface
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  
  // User actions
  setUser: (user: UserProfile, userType: 'doctor' | 'petOwner') => void;
  clearUser: () => void;
  
  // Data loading actions
  loadAllData: () => Promise<void>;
  
  // Doctor actions
  addDoctor: (doctorData: Omit<Doctor, 'id'>) => Promise<Doctor>;
  updateDoctor: (doctor: Doctor) => Promise<void>;
  removeDoctor: (doctorId: string) => Promise<void>;
  
  // Appointment actions
  bookAppointment: (appointmentData: Omit<Appointment, 'id' | 'createdAt'>) => Promise<Appointment>;
  cancelAppointment: (appointmentId: string) => Promise<void>;
  rescheduleAppointment: (appointmentId: string, newDateTime: Date) => Promise<void>;
  
  // Pet owner actions
  addPetOwner: (petOwnerData: Omit<PetOwner, 'id'>) => Promise<PetOwner>;
  updatePetOwner: (petOwner: PetOwner) => Promise<void>;
  removePetOwner: (petOwnerId: string) => Promise<void>;
  
  // Utility actions
  checkSlotAvailability: (doctorId: string, dateTime: Date, duration?: number) => Promise<boolean>;
  getAlternativeSlots: (doctorId: string, preferredDate: Date, duration?: number, maxSuggestions?: number) => Date[];
  getAlternativeSlotsWithConflictCheck: (appointmentData: Omit<Appointment, 'id' | 'createdAt'>, maxSuggestions?: number) => Promise<Date[]>;
  clearError: () => void;
}

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const dataService = DataService.getInstance();
  const conflictService = BookingConflictService.getInstance();
  const performanceService = PerformanceMonitoringService.getInstance();

  // Initialize data on mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        await dataService.initializeStorage();
        await loadAllData();
      } catch (error) {
        console.error('Failed to initialize app:', error);
        dispatch({
          type: 'SET_ERROR',
          payload: {
            type: ErrorType.STORAGE_ERROR,
            message: 'Failed to initialize application',
            recoverable: true,
            retryAction: () => initializeApp(),
          },
        });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeApp();
  }, []);

  // Helper function to handle errors
  const handleError = (error: any, defaultMessage: string, retryAction?: () => void) => {
    console.error(defaultMessage, error);
    
    if (error && typeof error === 'object' && 'type' in error) {
      dispatch({ type: 'SET_ERROR', payload: error as AppError });
    } else {
      dispatch({
        type: 'SET_ERROR',
        payload: {
          type: ErrorType.STORAGE_ERROR,
          message: defaultMessage,
          recoverable: true,
          retryAction,
        },
      });
    }
  };

  // User actions
  const setUser = (user: UserProfile, userType: 'doctor' | 'petOwner') => {
    dispatch({ type: 'SET_USER', payload: { user, userType } });
    dataService.setUserProfile(user).catch(error => {
      handleError(error, 'Failed to save user profile');
    });
  };

  const clearUser = () => {
    dispatch({ type: 'CLEAR_USER' });
  };

  // Data loading with performance monitoring
  const loadAllData = async () => {
    const timerId = performanceService.startTimer('AppContext.loadAllData');
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const [doctors, appointments, petOwners, userProfile] = await Promise.all([
        dataService.getAllDoctors(),
        dataService.getAllAppointments(),
        dataService.getAllPetOwners(),
        dataService.getUserProfile(),
      ]);

      dispatch({ type: 'SET_DOCTORS', payload: doctors });
      dispatch({ type: 'SET_APPOINTMENTS', payload: appointments });
      dispatch({ type: 'SET_PET_OWNERS', payload: petOwners });
      
      if (userProfile) {
        dispatch({ 
          type: 'SET_USER', 
          payload: { 
            user: userProfile, 
            userType: userProfile.type 
          } 
        });
      }
    } catch (error) {
      performanceService.recordError('AppContext.loadAllData', error as Error);
      handleError(error, 'Failed to load application data', loadAllData);
    } finally {
      performanceService.endTimer(timerId);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Doctor actions
  const addDoctor = async (doctorData: Omit<Doctor, 'id'>): Promise<Doctor> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const newDoctor = await dataService.saveDoctor(doctorData);
      dispatch({ type: 'ADD_DOCTOR', payload: newDoctor });
      return newDoctor;
    } catch (error) {
      handleError(error, 'Failed to add doctor');
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateDoctor = async (doctor: Doctor): Promise<void> => {
    try {
      dispatch({ type: 'SET_SCHEDULE_UPDATE_IN_PROGRESS', payload: true });
      
      // Validate schedule update against existing appointments
      const scheduleValidation = validateScheduleUpdate(
        doctor.id,
        doctor.schedule,
        state.appointments
      );
      
      if (!scheduleValidation.isValid) {
        const conflictError: AppError = {
          type: ErrorType.BOOKING_CONFLICT,
          message: `Schedule update conflicts with ${scheduleValidation.conflictingAppointments.length} existing appointment(s). Please reschedule or cancel conflicting appointments first.`,
          recoverable: true,
          retryAction: () => loadAllData(),
        };
        dispatch({ type: 'SET_ERROR', payload: conflictError });
        throw conflictError;
      }
      
      await dataService.updateDoctor(doctor);
      dispatch({ type: 'UPDATE_DOCTOR', payload: doctor });
    } catch (error) {
      if (error && typeof error === 'object' && 'type' in error && error.type === ErrorType.BOOKING_CONFLICT) {
        throw error;
      }
      handleError(error, 'Failed to update doctor');
      throw error;
    } finally {
      dispatch({ type: 'SET_SCHEDULE_UPDATE_IN_PROGRESS', payload: false });
    }
  };

  const removeDoctor = async (doctorId: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await dataService.deleteDoctor(doctorId);
      dispatch({ type: 'REMOVE_DOCTOR', payload: doctorId });
    } catch (error) {
      handleError(error, 'Failed to remove doctor');
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Appointment actions with enhanced conflict resolution
  const bookAppointment = async (appointmentData: Omit<Appointment, 'id' | 'createdAt'>): Promise<Appointment> => {
    try {
      dispatch({ type: 'SET_BOOKING_IN_PROGRESS', payload: true });
      
      // Use the enhanced conflict resolution service
      const userId = state.currentUser?.id || 'anonymous';
      const result = await conflictService.bookAppointmentWithConflictResolution(
        appointmentData,
        userId,
        {
          enableOptimisticUpdates: true,
          maxRetryAttempts: 3,
          retryDelayMs: 1000,
          maxAlternativeSuggestions: 5,
        }
      );
      
      if (result.success && result.appointment) {
        dispatch({ type: 'ADD_APPOINTMENT', payload: result.appointment });
        return result.appointment;
      } else {
        // Handle booking failure with alternatives
        const errorMessage = result.error?.message || 'Failed to book appointment';
        const alternativesMessage = result.alternatives && result.alternatives.length > 0 
          ? ` Alternative times are available.` 
          : ' Please choose a different time.';
        
        const conflictError: AppError = {
          type: result.error?.type || ErrorType.BOOKING_CONFLICT,
          message: errorMessage + alternativesMessage,
          recoverable: true,
          retryAction: () => loadAllData(),
        };
        
        dispatch({ type: 'SET_ERROR', payload: conflictError });
        throw conflictError;
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'type' in error) {
        throw error;
      }
      handleError(error, 'Failed to book appointment');
      throw error;
    } finally {
      dispatch({ type: 'SET_BOOKING_IN_PROGRESS', payload: false });
    }
  };

  const cancelAppointment = async (appointmentId: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Update appointment status to cancelled instead of deleting
      const appointment = state.appointments.find(a => a.id === appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found');
      }
      
      const updatedAppointment = { ...appointment, status: 'cancelled' as const };
      await dataService.updateAppointment(updatedAppointment);
      dispatch({ type: 'UPDATE_APPOINTMENT', payload: updatedAppointment });
    } catch (error) {
      handleError(error, 'Failed to cancel appointment');
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const rescheduleAppointment = async (appointmentId: string, newDateTime: Date): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const appointment = state.appointments.find(a => a.id === appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found');
      }
      
      // Create temporary appointment data for conflict checking
      const tempAppointmentData = {
        ...appointment,
        dateTime: newDateTime,
      };
      
      // Check for conflicts with other appointments (excluding the current one)
      const otherAppointments = state.appointments.filter(a => a.id !== appointmentId);
      const conflictingAppointments = findConflictingAppointments(tempAppointmentData, otherAppointments);
      
      if (conflictingAppointments.length > 0) {
        // Find the doctor for alternative suggestions
        const doctor = state.doctors.find(d => d.id === appointment.doctorId);
        let alternativeSlots: Date[] = [];
        
        if (doctor) {
          alternativeSlots = suggestAlternativeSlots(
            doctor,
            newDateTime,
            appointment.duration,
            otherAppointments,
            3
          );
        }
        
        const conflictError: AppError = {
          type: ErrorType.BOOKING_CONFLICT,
          message: `The selected time slot is not available. ${alternativeSlots.length > 0 ? 'Alternative times are suggested.' : 'Please choose a different time.'}`,
          recoverable: true,
          retryAction: () => loadAllData(),
        };
        dispatch({ type: 'SET_ERROR', payload: conflictError });
        throw conflictError;
      }
      
      // Double-check with storage service
      const isAvailable = await dataService.checkSlotAvailability(
        appointment.doctorId,
        newDateTime,
        appointment.duration
      );
      
      if (!isAvailable) {
        const conflictError: AppError = {
          type: ErrorType.BOOKING_CONFLICT,
          message: 'The selected time slot was just booked by another user',
          recoverable: true,
          retryAction: () => loadAllData(),
        };
        dispatch({ type: 'SET_ERROR', payload: conflictError });
        throw conflictError;
      }
      
      const updatedAppointment = { ...appointment, dateTime: newDateTime };
      await dataService.updateAppointment(updatedAppointment);
      dispatch({ type: 'UPDATE_APPOINTMENT', payload: updatedAppointment });
    } catch (error) {
      if (error && typeof error === 'object' && 'type' in error && error.type === ErrorType.BOOKING_CONFLICT) {
        throw error;
      }
      handleError(error, 'Failed to reschedule appointment');
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Pet owner actions
  const addPetOwner = async (petOwnerData: Omit<PetOwner, 'id'>): Promise<PetOwner> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const newPetOwner = await dataService.savePetOwner(petOwnerData);
      dispatch({ type: 'ADD_PET_OWNER', payload: newPetOwner });
      return newPetOwner;
    } catch (error) {
      handleError(error, 'Failed to add pet owner');
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updatePetOwner = async (petOwner: PetOwner): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await dataService.updatePetOwner(petOwner);
      dispatch({ type: 'UPDATE_PET_OWNER', payload: petOwner });
    } catch (error) {
      handleError(error, 'Failed to update pet owner');
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const removePetOwner = async (petOwnerId: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await dataService.deletePetOwner(petOwnerId);
      dispatch({ type: 'REMOVE_PET_OWNER', payload: petOwnerId });
    } catch (error) {
      handleError(error, 'Failed to remove pet owner');
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Utility actions
  const checkSlotAvailability = async (doctorId: string, dateTime: Date, duration: number = 30): Promise<boolean> => {
    try {
      return await dataService.checkSlotAvailability(doctorId, dateTime, duration);
    } catch (error) {
      handleError(error, 'Failed to check slot availability');
      return false;
    }
  };

  const getAlternativeSlots = (doctorId: string, preferredDate: Date, duration: number = 30, maxSuggestions: number = 5): Date[] => {
    const doctor = state.doctors.find(d => d.id === doctorId);
    if (!doctor) {
      return [];
    }
    
    return suggestAlternativeSlots(doctor, preferredDate, duration, state.appointments, maxSuggestions);
  };

  const getAlternativeSlotsWithConflictCheck = async (
    appointmentData: Omit<Appointment, 'id' | 'createdAt'>, 
    maxSuggestions: number = 5
  ): Promise<Date[]> => {
    try {
      const userId = state.currentUser?.id || 'anonymous';
      const result = await conflictService.bookAppointmentWithConflictResolution(
        appointmentData,
        userId,
        {
          enableOptimisticUpdates: false, // Don't perform optimistic updates for suggestions
          maxRetryAttempts: 1,
          retryDelayMs: 0,
          maxAlternativeSuggestions: maxSuggestions,
        }
      );
      
      return result.alternatives || [];
    } catch (error) {
      console.error('Error getting alternative slots:', error);
      return [];
    }
  };

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const contextValue: AppContextType = {
    state,
    dispatch,
    setUser,
    clearUser,
    loadAllData,
    addDoctor,
    updateDoctor,
    removeDoctor,
    bookAppointment,
    cancelAppointment,
    rescheduleAppointment,
    addPetOwner,
    updatePetOwner,
    removePetOwner,
    checkSlotAvailability,
    getAlternativeSlots,
    getAlternativeSlotsWithConflictCheck,
    clearError,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// Export context for testing purposes
export { AppContext };