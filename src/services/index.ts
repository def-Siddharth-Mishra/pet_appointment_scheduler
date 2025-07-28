// Service interfaces and implementations for the Pet Appointment Scheduler
import { Appointment, Doctor, WeeklySchedule, TimeSlot, DateRange, PetOwner } from '../types';

export interface AppointmentService {
  bookAppointment(appointment: Omit<Appointment, 'id' | 'createdAt'>): Promise<Appointment>;
  cancelAppointment(appointmentId: string): Promise<void>;
  rescheduleAppointment(appointmentId: string, newDateTime: Date): Promise<Appointment>;
  getAppointmentsByDoctor(doctorId: string): Promise<Appointment[]>;
  getAppointmentsByPetOwner(petOwnerId: string): Promise<Appointment[]>;
  checkSlotAvailability(doctorId: string, dateTime: Date): Promise<boolean>;
}

export interface IScheduleService {
  updateDoctorSchedule(doctorId: string, schedule: WeeklySchedule): Promise<void>;
  getDoctorAvailability(doctorId: string, dateRange: DateRange): Promise<TimeSlot[]>;
  generateRecurringSlots(schedule: WeeklySchedule, days: number): Promise<TimeSlot[]>;
}

export interface DoctorService {
  getAllDoctors(): Promise<Doctor[]>;
  getDoctorById(doctorId: string): Promise<Doctor | null>;
  updateDoctorProfile(doctor: Doctor): Promise<void>;
  getDoctorsBySpecialization(specialization: string): Promise<Doctor[]>;
}

export interface PetOwnerService {
  getAllPetOwners(): Promise<PetOwner[]>;
  getPetOwnerById(petOwnerId: string): Promise<PetOwner | null>;
  updatePetOwnerProfile(petOwner: PetOwner): Promise<void>;
}

export interface StorageService {
  getData<T>(key: string): Promise<T | null>;
  setData<T>(key: string, data: T): Promise<void>;
  removeData(key: string): Promise<void>;
  clearAll(): Promise<void>;
}

// Export service implementations
export { AsyncStorageService } from './StorageService';
export { DataService } from './DataService';
export { ScheduleService } from './ScheduleService';
export { DoctorAvailabilityService } from './DoctorAvailabilityService';