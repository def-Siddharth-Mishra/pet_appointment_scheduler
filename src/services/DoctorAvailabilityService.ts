import { Doctor, Appointment, TimeSlot } from '../types';
import { DataService } from './DataService';

export class DoctorAvailabilityService {
  private static instance: DoctorAvailabilityService;
  private dataService: DataService;

  private constructor() {
    this.dataService = DataService.getInstance();
  }

  public static getInstance(): DoctorAvailabilityService {
    if (!DoctorAvailabilityService.instance) {
      DoctorAvailabilityService.instance = new DoctorAvailabilityService();
    }
    return DoctorAvailabilityService.instance;
  }

  /**
   * Calculate available slots for a doctor in the next 30 days
   */
  async getAvailableSlots(doctorId: string, daysAhead: number = 30): Promise<Date[]> {
    try {
      const doctor = await this.dataService.getDoctorById(doctorId);
      if (!doctor) {
        return [];
      }

      const appointments = await this.dataService.getAppointmentsByDoctor(doctorId);
      const activeAppointments = appointments.filter(apt => apt.status !== 'cancelled');

      const availableSlots: Date[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + dayOffset);
        
        const dayName = this.getDayName(currentDate);
        const daySchedule = doctor.schedule[dayName.toLowerCase()];
        
        if (!daySchedule || daySchedule.length === 0) {
          continue;
        }

        for (const timeSlot of daySchedule) {
          const slots = this.generateSlotsFromTimeSlot(currentDate, timeSlot);
          
          for (const slot of slots) {
            // Skip past slots
            if (slot <= new Date()) {
              continue;
            }

            // Check if slot is available
            const isAvailable = await this.isSlotAvailable(slot, activeAppointments);
            if (isAvailable) {
              availableSlots.push(slot);
            }
          }
        }
      }

      return availableSlots.sort((a, b) => a.getTime() - b.getTime());
    } catch (error) {
      console.error('Error getting available slots:', error);
      return [];
    }
  }

  /**
   * Count available slots for a doctor
   */
  async countAvailableSlots(doctorId: string, daysAhead: number = 30): Promise<number> {
    const slots = await this.getAvailableSlots(doctorId, daysAhead);
    return slots.length;
  }

  /**
   * Check if a doctor has any available slots
   */
  async hasAvailableSlots(doctorId: string, daysAhead: number = 30): Promise<boolean> {
    const count = await this.countAvailableSlots(doctorId, daysAhead);
    return count > 0;
  }

  /**
   * Get doctors with available slots for a specific specialization
   */
  async getDoctorsWithAvailability(
    doctors: Doctor[], 
    specialization?: string,
    daysAhead: number = 30
  ): Promise<Array<{ doctor: Doctor; availableSlots: number }>> {
    const results: Array<{ doctor: Doctor; availableSlots: number }> = [];

    for (const doctor of doctors) {
      // Filter by specialization if provided
      if (specialization && !doctor.specializations.some(spec => 
        spec.toLowerCase().includes(specialization.toLowerCase())
      )) {
        continue;
      }

      const availableSlots = await this.countAvailableSlots(doctor.id, daysAhead);
      if (availableSlots > 0) {
        results.push({ doctor, availableSlots });
      }
    }

    return results;
  }

  /**
   * Generate 30-minute slots from a time slot
   */
  private generateSlotsFromTimeSlot(date: Date, timeSlot: TimeSlot): Date[] {
    const slots: Date[] = [];
    const slotDuration = 30; // minutes

    const startTime = this.parseTime(timeSlot.startTime);
    const endTime = this.parseTime(timeSlot.endTime);

    let currentTime = startTime;
    while (currentTime < endTime) {
      const slotDate = new Date(date);
      slotDate.setHours(Math.floor(currentTime / 60), currentTime % 60, 0, 0);
      slots.push(slotDate);
      
      currentTime += slotDuration;
    }

    return slots;
  }

  /**
   * Parse time string (HH:MM) to minutes since midnight
   */
  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Get day name from date
   */
  private getDayName(date: Date): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }

  /**
   * Check if a specific slot is available
   */
  private async isSlotAvailable(slotDate: Date, appointments: Appointment[]): Promise<boolean> {
    const slotStart = slotDate.getTime();
    const slotEnd = slotStart + (30 * 60 * 1000); // 30 minutes

    return !appointments.some(appointment => {
      const appointmentStart = appointment.dateTime.getTime();
      const appointmentEnd = appointmentStart + (appointment.duration * 60 * 1000);
      
      // Check for overlap
      return slotStart < appointmentEnd && slotEnd > appointmentStart;
    });
  }

  /**
   * Get next available slot for a doctor
   */
  async getNextAvailableSlot(doctorId: string): Promise<Date | null> {
    const slots = await this.getAvailableSlots(doctorId, 30);
    return slots.length > 0 ? slots[0] : null;
  }

  /**
   * Get available slots for a specific date
   */
  async getAvailableSlotsForDate(doctorId: string, date: Date): Promise<Date[]> {
    const doctor = await this.dataService.getDoctorById(doctorId);
    if (!doctor) {
      return [];
    }

    const appointments = await this.dataService.getAppointmentsByDoctor(doctorId);
    const activeAppointments = appointments.filter(apt => apt.status !== 'cancelled');

    const dayName = this.getDayName(date);
    const daySchedule = doctor.schedule[dayName.toLowerCase()];
    
    if (!daySchedule || daySchedule.length === 0) {
      return [];
    }

    const availableSlots: Date[] = [];

    for (const timeSlot of daySchedule) {
      const slots = this.generateSlotsFromTimeSlot(date, timeSlot);
      
      for (const slot of slots) {
        // Skip past slots
        if (slot <= new Date()) {
          continue;
        }

        // Check if slot is available
        const isAvailable = await this.isSlotAvailable(slot, activeAppointments);
        if (isAvailable) {
          availableSlots.push(slot);
        }
      }
    }

    return availableSlots.sort((a, b) => a.getTime() - b.getTime());
  }
}