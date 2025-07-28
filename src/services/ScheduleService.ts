import { WeeklySchedule, TimeSlot, RecurringPattern, DateRange } from '../types';
import { DAYS_OF_WEEK, DayOfWeek } from '../utils/constants';

export class ScheduleService {
  private static instance: ScheduleService;

  private constructor() {}

  public static getInstance(): ScheduleService {
    if (!ScheduleService.instance) {
      ScheduleService.instance = new ScheduleService();
    }
    return ScheduleService.instance;
  }

  /**
   * Generate recurring time slots based on a weekly schedule
   */
  generateRecurringSlots(
    schedule: WeeklySchedule,
    startDate: Date,
    endDate: Date
  ): { date: Date; timeSlots: TimeSlot[] }[] {
    const result: { date: Date; timeSlots: TimeSlot[] }[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayName = this.getDayName(currentDate);
      const daySlots = schedule[dayName];

      if (daySlots && daySlots.length > 0) {
        // Filter only recurring slots
        const recurringSlots = daySlots.filter(slot => slot.isRecurring);
        
        if (recurringSlots.length > 0) {
          // Check if this date should be included based on recurring patterns
          const validSlots = recurringSlots.filter(slot => 
            this.shouldIncludeSlot(slot, currentDate, startDate)
          );

          if (validSlots.length > 0) {
            result.push({
              date: new Date(currentDate),
              timeSlots: validSlots
            });
          }
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }

  /**
   * Generate available time slots for a specific date range
   */
  getAvailableSlots(
    schedule: WeeklySchedule,
    dateRange: DateRange,
    bookedSlots: { date: Date; startTime: string; endTime: string }[] = []
  ): { date: Date; availableSlots: string[] }[] {
    const recurringSlots = this.generateRecurringSlots(
      schedule,
      dateRange.startDate,
      dateRange.endDate
    );

    return recurringSlots.map(({ date, timeSlots }) => {
      const availableSlots: string[] = [];

      timeSlots.forEach(slot => {
        // Generate individual time slots based on the time range
        const individualSlots = this.generateIndividualSlots(
          slot.startTime,
          slot.endTime,
          30 // 30-minute intervals
        );

        // Filter out booked slots
        const unbookedSlots = individualSlots.filter(timeString => {
          return !bookedSlots.some(booked => 
            this.isSameDay(booked.date, date) &&
            this.isTimeSlotOverlapping(timeString, booked.startTime, booked.endTime)
          );
        });

        availableSlots.push(...unbookedSlots);
      });

      return {
        date,
        availableSlots: availableSlots.sort()
      };
    });
  }

  /**
   * Validate a weekly schedule for conflicts and completeness
   */
  validateSchedule(schedule: WeeklySchedule): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if at least one day is selected
    const hasAnyDay = Object.values(schedule).some(slots => slots && slots.length > 0);
    if (!hasAnyDay) {
      errors.push('At least one day must be selected with time slots');
    }

    // Validate each day's time slots
    Object.entries(schedule).forEach(([day, slots]) => {
      if (!slots || slots.length === 0) return;

      slots.forEach((slot, index) => {
        // Validate time format
        if (!this.isValidTimeFormat(slot.startTime)) {
          errors.push(`Invalid start time format for ${day}, slot ${index + 1}`);
        }
        if (!this.isValidTimeFormat(slot.endTime)) {
          errors.push(`Invalid end time format for ${day}, slot ${index + 1}`);
        }

        // Validate time logic
        if (this.isValidTimeFormat(slot.startTime) && this.isValidTimeFormat(slot.endTime)) {
          const start = this.timeStringToMinutes(slot.startTime);
          const end = this.timeStringToMinutes(slot.endTime);

          if (start >= end) {
            errors.push(`End time must be after start time for ${day}, slot ${index + 1}`);
          }

          if (end - start < 30) {
            warnings.push(`Time slot for ${day}, slot ${index + 1} is less than 30 minutes`);
          }
        }
      });

      // Check for overlapping slots within the same day
      for (let i = 0; i < slots.length; i++) {
        for (let j = i + 1; j < slots.length; j++) {
          if (this.doTimeSlotsOverlap(slots[i], slots[j])) {
            errors.push(`Overlapping time slots found for ${day}`);
          }
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Create a default weekly schedule
   */
  createDefaultSchedule(): WeeklySchedule {
    const schedule: WeeklySchedule = {};
    
    // Initialize weekdays with default working hours
    const weekdays: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    weekdays.forEach(day => {
      schedule[day] = [{
        startTime: '09:00',
        endTime: '17:00',
        isRecurring: true,
      }];
    });

    return schedule;
  }

  /**
   * Clone a weekly schedule
   */
  cloneSchedule(schedule: WeeklySchedule): WeeklySchedule {
    const cloned: WeeklySchedule = {};
    Object.entries(schedule).forEach(([day, slots]) => {
      if (slots) {
        cloned[day] = slots.map(slot => ({ ...slot }));
      }
    });
    return cloned;
  }

  // Private helper methods

  private getDayName(date: Date): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }

  private shouldIncludeSlot(slot: TimeSlot, currentDate: Date, startDate: Date): boolean {
    if (!slot.recurringPattern) {
      return true; // Include all slots without specific patterns
    }

    const daysDiff = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    switch (slot.recurringPattern.type) {
      case 'weekly':
        return daysDiff % (7 * slot.recurringPattern.interval) === 0;
      case 'bi-weekly':
        return daysDiff % (14 * slot.recurringPattern.interval) === 0;
      case 'monthly':
        // Simplified monthly check - same day of month
        return currentDate.getDate() === startDate.getDate();
      default:
        return true;
    }
  }

  private generateIndividualSlots(startTime: string, endTime: string, intervalMinutes: number): string[] {
    const slots: string[] = [];
    const startMinutes = this.timeStringToMinutes(startTime);
    const endMinutes = this.timeStringToMinutes(endTime);

    for (let minutes = startMinutes; minutes < endMinutes; minutes += intervalMinutes) {
      slots.push(this.minutesToTimeString(minutes));
    }

    return slots;
  }

  private timeStringToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTimeString(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private isValidTimeFormat(timeString: string): boolean {
    return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeString);
  }

  private doTimeSlotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
    const start1 = this.timeStringToMinutes(slot1.startTime);
    const end1 = this.timeStringToMinutes(slot1.endTime);
    const start2 = this.timeStringToMinutes(slot2.startTime);
    const end2 = this.timeStringToMinutes(slot2.endTime);

    return start1 < end2 && start2 < end1;
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  private isTimeSlotOverlapping(timeString: string, bookedStart: string, bookedEnd: string): boolean {
    const time = this.timeStringToMinutes(timeString);
    const start = this.timeStringToMinutes(bookedStart);
    const end = this.timeStringToMinutes(bookedEnd);

    return time >= start && time < end;
  }
}