// Validation functions for appointment conflicts and availability
import { Appointment, Doctor, TimeSlot, PetInfo } from '../types';
import { DateTimeUtils } from './dateTimeUtils';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictingAppointments: Appointment[];
  message?: string;
}

export class ValidationUtils {
  /**
   * Validate appointment booking data
   */
  static validateAppointmentBooking(
    doctorId: string,
    dateTime: Date,
    duration: number,
    petInfo: PetInfo,
    reason: string
  ): ValidationResult {
    const errors: string[] = [];

    // Basic field validation
    if (!doctorId?.trim()) {
      errors.push('Doctor selection is required');
    }

    if (!dateTime) {
      errors.push('Appointment date and time is required');
    } else {
      // Date/time specific validation
      if (DateTimeUtils.isInPast(dateTime)) {
        errors.push('Cannot schedule appointments in the past');
      }

      const dayOfWeek = dateTime.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        errors.push('Appointments can only be scheduled on weekdays');
      }

      if (!DateTimeUtils.isBusinessHours(dateTime)) {
        errors.push('Appointments must be scheduled during business hours (9 AM - 5 PM)');
      }
    }

    if (!duration || duration < 30) {
      errors.push('Appointment duration must be at least 30 minutes');
    }

    if (duration > 240) {
      errors.push('Appointment duration cannot exceed 4 hours');
    }

    // Pet info validation
    if (!petInfo?.name?.trim()) {
      errors.push('Pet name is required');
    }

    if (!petInfo?.species?.trim()) {
      errors.push('Pet species is required');
    }

    if (petInfo?.age !== undefined && petInfo.age < 0) {
      errors.push('Pet age cannot be negative');
    }

    if (!reason?.trim()) {
      errors.push('Reason for visit is required');
    }

    if (reason && reason.length < 10) {
      errors.push('Please provide a more detailed reason for the visit (at least 10 characters)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check for appointment conflicts
   */
  static checkAppointmentConflicts(
    doctorId: string,
    dateTime: Date,
    duration: number,
    existingAppointments: Appointment[],
    excludeAppointmentId?: string
  ): ConflictCheckResult {
    const appointmentStart = dateTime;
    const appointmentEnd = DateTimeUtils.addMinutes(dateTime, duration);

    const conflictingAppointments = existingAppointments.filter(appointment => {
      // Skip the appointment being updated
      if (excludeAppointmentId && appointment.id === excludeAppointmentId) {
        return false;
      }

      // Only check appointments for the same doctor
      if (appointment.doctorId !== doctorId) {
        return false;
      }

      // Only check scheduled appointments
      if (appointment.status !== 'scheduled') {
        return false;
      }

      const existingStart = appointment.dateTime;
      const existingEnd = DateTimeUtils.addMinutes(appointment.dateTime, appointment.duration);

      return DateTimeUtils.timeRangesOverlap(
        appointmentStart,
        appointmentEnd,
        existingStart,
        existingEnd
      );
    });

    const hasConflict = conflictingAppointments.length > 0;
    let message: string | undefined;

    if (hasConflict) {
      const conflictTime = DateTimeUtils.formatDateTime(conflictingAppointments[0].dateTime);
      message = `This time slot conflicts with an existing appointment at ${conflictTime}`;
    }

    return {
      hasConflict,
      conflictingAppointments,
      message
    };
  }

  /**
   * Check if doctor is available at the specified time
   */
  static isDoctorAvailable(
    doctor: Doctor,
    dateTime: Date,
    duration: number,
    existingAppointments: Appointment[]
  ): ValidationResult {
    const errors: string[] = [];
    const dayOfWeek = DateTimeUtils.getDayOfWeek(dateTime);
    const timeString = DateTimeUtils.dateToTimeString(dateTime);
    const endTime = DateTimeUtils.dateToTimeString(
      DateTimeUtils.addMinutes(dateTime, duration)
    );

    // Check if doctor has schedule for this day
    const daySchedule = doctor.schedule[dayOfWeek];
    if (!daySchedule || daySchedule.length === 0) {
      errors.push(`Doctor is not available on ${dayOfWeek}s`);
      return { isValid: false, errors };
    }

    // Check if the requested time falls within any available time slot
    const isWithinSchedule = daySchedule.some(slot => {
      return timeString >= slot.startTime && endTime <= slot.endTime;
    });

    if (!isWithinSchedule) {
      errors.push('Requested time is outside doctor\'s available hours');
    }

    // Check for conflicts with existing appointments
    const conflictCheck = this.checkAppointmentConflicts(
      doctor.id,
      dateTime,
      duration,
      existingAppointments
    );

    if (conflictCheck.hasConflict) {
      errors.push(conflictCheck.message || 'Time slot is already booked');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate doctor schedule configuration
   */
  static validateDoctorSchedule(schedule: { [day: string]: TimeSlot[] }): ValidationResult {
    const errors: string[] = [];
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    Object.entries(schedule).forEach(([day, slots]) => {
      if (!validDays.includes(day.toLowerCase())) {
        errors.push(`Invalid day: ${day}`);
        return;
      }

      if (!Array.isArray(slots)) {
        errors.push(`Schedule for ${day} must be an array of time slots`);
        return;
      }

      // Validate each time slot
      slots.forEach((slot, index) => {
        if (!slot.startTime || !slot.endTime) {
          errors.push(`${day} slot ${index + 1}: Start and end times are required`);
          return;
        }

        const start = DateTimeUtils.timeStringToDate(slot.startTime);
        const end = DateTimeUtils.timeStringToDate(slot.endTime);

        if (start >= end) {
          errors.push(`${day} slot ${index + 1}: End time must be after start time`);
        }

        const duration = DateTimeUtils.getDurationMinutes(start, end);
        if (duration < 30) {
          errors.push(`${day} slot ${index + 1}: Time slot must be at least 30 minutes`);
        }
      });

      // Check for overlapping slots on the same day
      for (let i = 0; i < slots.length; i++) {
        for (let j = i + 1; j < slots.length; j++) {
          const slot1Start = DateTimeUtils.timeStringToDate(slots[i].startTime);
          const slot1End = DateTimeUtils.timeStringToDate(slots[i].endTime);
          const slot2Start = DateTimeUtils.timeStringToDate(slots[j].startTime);
          const slot2End = DateTimeUtils.timeStringToDate(slots[j].endTime);

          if (DateTimeUtils.timeRangesOverlap(slot1Start, slot1End, slot2Start, slot2End)) {
            errors.push(`${day}: Time slots ${i + 1} and ${j + 1} overlap`);
          }
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): ValidationResult {
    const errors: string[] = [];
    
    if (!email?.trim()) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Please enter a valid email address');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate phone number format
   */
  static validatePhone(phone: string): ValidationResult {
    const errors: string[] = [];
    
    if (!phone?.trim()) {
      errors.push('Phone number is required');
    } else {
      // Remove all non-digit characters
      const digitsOnly = phone.replace(/\D/g, '');
      
      if (digitsOnly.length < 10) {
        errors.push('Phone number must be at least 10 digits');
      } else if (digitsOnly.length > 15) {
        errors.push('Phone number cannot exceed 15 digits');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get available time slots for a doctor on a specific date
   */
  static getAvailableTimeSlots(
    doctor: Doctor,
    date: Date,
    existingAppointments: Appointment[],
    slotDuration: number = 30
  ): string[] {
    const dayOfWeek = DateTimeUtils.getDayOfWeek(date);
    const daySchedule = doctor.schedule[dayOfWeek];

    if (!daySchedule || daySchedule.length === 0) {
      return [];
    }

    const availableSlots: string[] = [];

    daySchedule.forEach(slot => {
      const slots = DateTimeUtils.generateTimeSlots(
        slot.startTime,
        slot.endTime,
        slotDuration
      );

      slots.forEach(timeString => {
        const slotDateTime = DateTimeUtils.timeStringToDate(timeString, date);
        
        // Skip past time slots
        if (DateTimeUtils.isInPast(slotDateTime)) {
          return;
        }

        // Check if slot is available (no conflicts)
        const conflictCheck = this.checkAppointmentConflicts(
          doctor.id,
          slotDateTime,
          slotDuration,
          existingAppointments
        );

        if (!conflictCheck.hasConflict) {
          availableSlots.push(timeString);
        }
      });
    });

    return availableSlots.sort();
  }
}