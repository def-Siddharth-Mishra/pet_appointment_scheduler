import { Appointment, Doctor, TimeSlot } from '../types';

export interface BookingAttempt {
  appointmentData: Omit<Appointment, 'id' | 'createdAt'>;
  timestamp: Date;
  userId: string;
}

export interface ConflictResolutionResult {
  winner: BookingAttempt;
  conflicts: BookingAttempt[];
  resolution: 'timestamp_priority' | 'no_conflict';
}

/**
 * Resolves booking conflicts using timestamp-based priority
 * The earliest timestamp wins
 */
export const resolveBookingConflict = (attempts: BookingAttempt[]): ConflictResolutionResult => {
  if (attempts.length <= 1) {
    return {
      winner: attempts[0],
      conflicts: [],
      resolution: 'no_conflict',
    };
  }

  // Sort by timestamp (earliest first)
  const sortedAttempts = [...attempts].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  
  return {
    winner: sortedAttempts[0],
    conflicts: sortedAttempts.slice(1),
    resolution: 'timestamp_priority',
  };
};

/**
 * Checks if two appointments have time conflicts
 */
export const hasTimeConflict = (appointment1: Appointment, appointment2: Appointment): boolean => {
  if (appointment1.doctorId !== appointment2.doctorId) {
    return false;
  }

  const start1 = appointment1.dateTime.getTime();
  const end1 = start1 + (appointment1.duration * 60 * 1000);
  
  const start2 = appointment2.dateTime.getTime();
  const end2 = start2 + (appointment2.duration * 60 * 1000);

  // Check for overlap
  return start1 < end2 && end1 > start2;
};

/**
 * Finds all appointments that conflict with a given appointment
 */
export const findConflictingAppointments = (
  targetAppointment: Omit<Appointment, 'id' | 'createdAt'>,
  existingAppointments: Appointment[]
): Appointment[] => {
  return existingAppointments.filter(existing => {
    if (existing.status === 'cancelled') {
      return false;
    }

    if (existing.doctorId !== targetAppointment.doctorId) {
      return false;
    }

    const targetStart = targetAppointment.dateTime.getTime();
    const targetEnd = targetStart + (targetAppointment.duration * 60 * 1000);
    
    const existingStart = existing.dateTime.getTime();
    const existingEnd = existingStart + (existing.duration * 60 * 1000);

    // Check for overlap
    return targetStart < existingEnd && targetEnd > existingStart;
  });
};

/**
 * Validates if a time slot is within doctor's schedule
 */
export const isWithinDoctorSchedule = (
  doctor: Doctor,
  appointmentDateTime: Date,
  duration: number
): boolean => {
  const dayOfWeek = appointmentDateTime.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const timeSlots = doctor.schedule[dayOfWeek];
  
  if (!timeSlots || timeSlots.length === 0) {
    return false;
  }

  const appointmentTime = appointmentDateTime.toTimeString().substring(0, 5); // HH:MM format
  const appointmentEndTime = new Date(appointmentDateTime.getTime() + duration * 60 * 1000)
    .toTimeString().substring(0, 5);

  return timeSlots.some(slot => {
    return appointmentTime >= slot.startTime && appointmentEndTime <= slot.endTime;
  });
};

/**
 * Suggests alternative time slots when a conflict occurs
 */
export const suggestAlternativeSlots = (
  doctor: Doctor,
  preferredDate: Date,
  duration: number,
  existingAppointments: Appointment[],
  maxSuggestions: number = 5
): Date[] => {
  const suggestions: Date[] = [];
  const dayOfWeek = preferredDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const timeSlots = doctor.schedule[dayOfWeek];
  
  if (!timeSlots || timeSlots.length === 0) {
    return suggestions;
  }

  // Get the date part of the preferred date
  const dateOnly = new Date(preferredDate);
  dateOnly.setHours(0, 0, 0, 0);

  for (const slot of timeSlots) {
    const [startHour, startMinute] = slot.startTime.split(':').map(Number);
    const [endHour, endMinute] = slot.endTime.split(':').map(Number);
    
    const slotStart = new Date(dateOnly);
    slotStart.setHours(startHour, startMinute, 0, 0);
    
    const slotEnd = new Date(dateOnly);
    slotEnd.setHours(endHour, endMinute, 0, 0);
    
    // Generate 30-minute intervals within the slot
    let currentTime = new Date(slotStart);
    
    while (currentTime.getTime() + duration * 60 * 1000 <= slotEnd.getTime()) {
      const potentialAppointment = {
        doctorId: doctor.id,
        petOwnerId: 'temp',
        petInfo: { name: 'temp', species: 'temp', age: 0 },
        dateTime: new Date(currentTime),
        duration,
        reason: 'temp',
        status: 'scheduled' as const,
      };

      const conflicts = findConflictingAppointments(potentialAppointment, existingAppointments);
      
      if (conflicts.length === 0) {
        suggestions.push(new Date(currentTime));
        
        if (suggestions.length >= maxSuggestions) {
          return suggestions;
        }
      }
      
      // Move to next 30-minute interval
      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }
  }

  return suggestions;
};

/**
 * Validates schedule update against existing appointments
 */
export const validateScheduleUpdate = (
  doctorId: string,
  newSchedule: { [day: string]: TimeSlot[] },
  existingAppointments: Appointment[]
): { isValid: boolean; conflictingAppointments: Appointment[] } => {
  const conflictingAppointments: Appointment[] = [];
  
  const doctorAppointments = existingAppointments.filter(
    appointment => appointment.doctorId === doctorId && appointment.status === 'scheduled'
  );

  for (const appointment of doctorAppointments) {
    const dayOfWeek = appointment.dateTime.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const appointmentTime = appointment.dateTime.toTimeString().substring(0, 5);
    const appointmentEndTime = new Date(appointment.dateTime.getTime() + appointment.duration * 60 * 1000)
      .toTimeString().substring(0, 5);
    
    const daySlots = newSchedule[dayOfWeek] || [];
    
    const isWithinNewSchedule = daySlots.some(slot => {
      return appointmentTime >= slot.startTime && appointmentEndTime <= slot.endTime;
    });
    
    if (!isWithinNewSchedule) {
      conflictingAppointments.push(appointment);
    }
  }

  return {
    isValid: conflictingAppointments.length === 0,
    conflictingAppointments,
  };
};