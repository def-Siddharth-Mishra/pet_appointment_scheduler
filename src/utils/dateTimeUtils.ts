// Date and time calculation utilities for appointment scheduling
import { TimeSlot, DateRange } from '../types';

export class DateTimeUtils {
  /**
   * Format date to display string (e.g., "Mon, Jan 15, 2024")
   */
  static formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Format time to display string (e.g., "2:30 PM")
   */
  static formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  /**
   * Format date and time together (e.g., "Mon, Jan 15, 2024 at 2:30 PM")
   */
  static formatDateTime(date: Date): string {
    return `${this.formatDate(date)} at ${this.formatTime(date)}`;
  }

  /**
   * Convert time string (HH:MM) to Date object for today
   */
  static timeStringToDate(timeString: string, baseDate?: Date): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = baseDate ? new Date(baseDate) : new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  /**
   * Convert Date to time string (HH:MM)
   */
  static dateToTimeString(date: Date): string {
    return date.toTimeString().slice(0, 5);
  }

  /**
   * Get the start of day for a given date
   */
  static getStartOfDay(date: Date): Date {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  }

  /**
   * Get the end of day for a given date
   */
  static getEndOfDay(date: Date): Date {
    const newDate = new Date(date);
    newDate.setHours(23, 59, 59, 999);
    return newDate;
  }

  /**
   * Check if two dates are on the same day
   */
  static isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  /**
   * Get day of week string from date
   */
  static getDayOfWeek(date: Date): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  }

  /**
   * Generate time slots for a given day based on start/end times and interval
   */
  static generateTimeSlots(
    startTime: string,
    endTime: string,
    intervalMinutes: number = 30
  ): string[] {
    const slots: string[] = [];
    const start = this.timeStringToDate(startTime);
    const end = this.timeStringToDate(endTime);

    let current = new Date(start);
    while (current < end) {
      slots.push(this.dateToTimeString(current));
      current.setMinutes(current.getMinutes() + intervalMinutes);
    }

    return slots;
  }

  /**
   * Get date range for the next N days
   */
  static getDateRange(days: number, startDate?: Date): DateRange {
    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(start);
    end.setDate(start.getDate() + days);

    return {
      startDate: this.getStartOfDay(start),
      endDate: this.getEndOfDay(end)
    };
  }

  /**
   * Check if a date is in the past
   */
  static isInPast(date: Date): boolean {
    return date < new Date();
  }

  /**
   * Check if a date is within business hours
   */
  static isBusinessHours(date: Date, businessStart = '09:00', businessEnd = '17:00'): boolean {
    const timeString = this.dateToTimeString(date);
    return timeString >= businessStart && timeString <= businessEnd;
  }

  /**
   * Add minutes to a date
   */
  static addMinutes(date: Date, minutes: number): Date {
    const newDate = new Date(date);
    newDate.setMinutes(newDate.getMinutes() + minutes);
    return newDate;
  }

  /**
   * Get duration between two dates in minutes
   */
  static getDurationMinutes(startDate: Date, endDate: Date): number {
    return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
  }

  /**
   * Check if two time ranges overlap
   */
  static timeRangesOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
  ): boolean {
    return start1 < end2 && start2 < end1;
  }

  /**
   * Get relative time string (e.g., "in 2 hours", "3 days ago")
   */
  static getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (Math.abs(diffMinutes) < 60) {
      if (diffMinutes === 0) return 'now';
      return diffMinutes > 0 ? `in ${diffMinutes} minutes` : `${Math.abs(diffMinutes)} minutes ago`;
    }

    if (Math.abs(diffHours) < 24) {
      return diffHours > 0 ? `in ${diffHours} hours` : `${Math.abs(diffHours)} hours ago`;
    }

    if (Math.abs(diffDays) < 7) {
      return diffDays > 0 ? `in ${diffDays} days` : `${Math.abs(diffDays)} days ago`;
    }

    return this.formatDate(date);
  }
}