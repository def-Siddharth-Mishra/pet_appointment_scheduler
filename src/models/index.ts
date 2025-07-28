// Data model classes with validation for the Pet Appointment Scheduler
import { Doctor, Appointment, PetInfo, PetOwner, TimeSlot } from '../types';

export class DoctorModel {
  static validate(doctor: Partial<Doctor>): string[] {
    const errors: string[] = [];
    
    if (!doctor.id || doctor.id.trim() === '') {
      errors.push('Doctor ID is required');
    }
    
    if (!doctor.name || doctor.name.trim() === '') {
      errors.push('Doctor name is required');
    }
    
    if (!doctor.specializations || doctor.specializations.length === 0) {
      errors.push('At least one specialization is required');
    }
    
    if (doctor.rating !== undefined && (doctor.rating < 0 || doctor.rating > 5)) {
      errors.push('Rating must be between 0 and 5');
    }
    
    if (doctor.experienceYears !== undefined && doctor.experienceYears < 0) {
      errors.push('Experience years cannot be negative');
    }
    
    return errors;
  }
  
  static create(data: Omit<Doctor, 'id'>): Doctor {
    const id = `doctor_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    return {
      id,
      ...data,
      rating: data.rating || 0,
      experienceYears: data.experienceYears || 0,
      languages: data.languages || ['English']
    };
  }
}

export class AppointmentModel {
  static validate(appointment: Partial<Appointment>): string[] {
    const errors: string[] = [];
    
    if (!appointment.doctorId || appointment.doctorId.trim() === '') {
      errors.push('Doctor ID is required');
    }
    
    if (!appointment.petOwnerId || appointment.petOwnerId.trim() === '') {
      errors.push('Pet owner ID is required');
    }
    
    if (!appointment.petInfo) {
      errors.push('Pet information is required');
    } else {
      const petErrors = PetInfoModel.validate(appointment.petInfo);
      errors.push(...petErrors);
    }
    
    if (!appointment.dateTime) {
      errors.push('Appointment date and time is required');
    } else if (appointment.dateTime < new Date()) {
      errors.push('Appointment cannot be scheduled in the past');
    }
    
    if (!appointment.duration || appointment.duration < 30) {
      errors.push('Appointment duration must be at least 30 minutes');
    }
    
    if (!appointment.reason || appointment.reason.trim() === '') {
      errors.push('Reason for visit is required');
    }
    
    return errors;
  }
  
  static create(data: Omit<Appointment, 'id' | 'createdAt'>): Appointment {
    const id = `appointment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      id,
      ...data,
      createdAt: new Date(),
      status: 'scheduled'
    };
  }
}

export class PetInfoModel {
  static validate(petInfo: Partial<PetInfo>): string[] {
    const errors: string[] = [];
    
    if (!petInfo.name || petInfo.name.trim() === '') {
      errors.push('Pet name is required');
    }
    
    if (!petInfo.species || petInfo.species.trim() === '') {
      errors.push('Pet species is required');
    }
    
    if (petInfo.age !== undefined && petInfo.age < 0) {
      errors.push('Pet age cannot be negative');
    }
    
    return errors;
  }
}

export class PetOwnerModel {
  static validate(petOwner: Partial<PetOwner>): string[] {
    const errors: string[] = [];
    
    if (!petOwner.id || petOwner.id.trim() === '') {
      errors.push('Pet owner ID is required');
    }
    
    if (!petOwner.name || petOwner.name.trim() === '') {
      errors.push('Pet owner name is required');
    }
    
    if (!petOwner.email || petOwner.email.trim() === '') {
      errors.push('Email is required');
    } else if (!/\S+@\S+\.\S+/.test(petOwner.email)) {
      errors.push('Email format is invalid');
    }
    
    if (!petOwner.phone || petOwner.phone.trim() === '') {
      errors.push('Phone number is required');
    }
    
    return errors;
  }
  
  static create(data: Omit<PetOwner, 'id'>): PetOwner {
    const id = `petowner_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      id,
      ...data,
      pets: data.pets || []
    };
  }
}

export class TimeSlotModel {
  static validate(timeSlot: Partial<TimeSlot>): string[] {
    const errors: string[] = [];
    
    if (!timeSlot.startTime || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeSlot.startTime)) {
      errors.push('Start time must be in HH:MM format');
    }
    
    if (!timeSlot.endTime || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeSlot.endTime)) {
      errors.push('End time must be in HH:MM format');
    }
    
    if (timeSlot.startTime && timeSlot.endTime) {
      const start = new Date(`2000-01-01T${timeSlot.startTime}:00`);
      const end = new Date(`2000-01-01T${timeSlot.endTime}:00`);
      
      if (start >= end) {
        errors.push('End time must be after start time');
      }
      
      const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
      if (durationMinutes < 30) {
        errors.push('Time slot must be at least 30 minutes long');
      }
    }
    
    return errors;
  }
  
  static getDurationMinutes(timeSlot: TimeSlot): number {
    const start = new Date(`2000-01-01T${timeSlot.startTime}:00`);
    const end = new Date(`2000-01-01T${timeSlot.endTime}:00`);
    return (end.getTime() - start.getTime()) / (1000 * 60);
  }
}