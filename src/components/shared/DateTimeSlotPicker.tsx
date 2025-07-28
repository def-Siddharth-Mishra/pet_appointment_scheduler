import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
} from 'react-native';
import { useAppContext } from '../../context/AppContext';
import { DateTimeUtils } from '../../utils/dateTimeUtils';
import { LoadingSpinner } from './LoadingSpinner';

interface DateTimeSlotPickerProps {
  selectedDateTime: Date | null;
  onDateTimeSelect: (dateTime: Date | null) => void;
  doctorId: string;
  duration: number;
  excludeAppointmentId?: string;
  daysAhead?: number;
}

interface DateSlot {
  date: Date;
  dateString: string;
  timeSlots: string[];
}

export const DateTimeSlotPicker: React.FC<DateTimeSlotPickerProps> = ({
  selectedDateTime,
  onDateTimeSelect,
  doctorId,
  duration,
  excludeAppointmentId,
  daysAhead = 30,
}) => {
  const { state } = useAppContext();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Get doctor information
  const doctor = useMemo(() => {
    return state.doctors.find(d => d.id === doctorId);
  }, [state.doctors, doctorId]);

  // Generate available dates and time slots
  const availableDateSlots = useMemo(() => {
    if (!doctor) return [];

    const dateSlots: DateSlot[] = [];
    const today = new Date();
    
    for (let i = 0; i < daysAhead; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayOfWeek = DateTimeUtils.getDayOfWeek(date);
      const daySchedule = doctor.schedule[dayOfWeek];
      
      if (!daySchedule || daySchedule.length === 0) {
        continue; // No schedule for this day
      }

      // Generate time slots for this day
      const timeSlots: string[] = [];
      
      daySchedule.forEach(timeSlot => {
        const slots = DateTimeUtils.generateTimeSlots(
          timeSlot.startTime,
          timeSlot.endTime,
          duration
        );
        timeSlots.push(...slots);
      });

      // Filter out past time slots for today
      const availableTimeSlots = timeSlots.filter(timeString => {
        const slotDateTime = DateTimeUtils.timeStringToDate(timeString, date);
        
        // Skip if in the past
        if (DateTimeUtils.isInPast(slotDateTime)) {
          return false;
        }

        // Check for conflicts with existing appointments
        const hasConflict = state.appointments.some(appointment => {
          if (appointment.doctorId !== doctorId) return false;
          if (appointment.status === 'cancelled') return false;
          if (excludeAppointmentId && appointment.id === excludeAppointmentId) return false;

          const appointmentStart = appointment.dateTime.getTime();
          const appointmentEnd = appointmentStart + (appointment.duration * 60 * 1000);
          const slotStart = slotDateTime.getTime();
          const slotEnd = slotStart + (duration * 60 * 1000);

          // Check for overlap
          return slotStart < appointmentEnd && slotEnd > appointmentStart;
        });

        return !hasConflict;
      });

      if (availableTimeSlots.length > 0) {
        dateSlots.push({
          date,
          dateString: DateTimeUtils.formatDate(date),
          timeSlots: availableTimeSlots,
        });
      }
    }

    return dateSlots;
  }, [doctor, state.appointments, doctorId, duration, excludeAppointmentId, daysAhead]);

  // Update selected date and time when selectedDateTime changes
  useEffect(() => {
    if (selectedDateTime) {
      setSelectedDate(selectedDateTime);
      setSelectedTimeSlot(DateTimeUtils.dateToTimeString(selectedDateTime));
    } else {
      setSelectedDate(null);
      setSelectedTimeSlot(null);
    }
  }, [selectedDateTime]);

  // Handle date selection
  const handleDateSelect = (dateSlot: DateSlot) => {
    setSelectedDate(dateSlot.date);
    setSelectedTimeSlot(null);
    onDateTimeSelect(null);
  };

  // Handle time slot selection
  const handleTimeSlotSelect = (timeSlot: string) => {
    if (!selectedDate) return;

    setSelectedTimeSlot(timeSlot);
    const dateTime = DateTimeUtils.timeStringToDate(timeSlot, selectedDate);
    onDateTimeSelect(dateTime);
  };

  // Get time slots for selected date
  const selectedDateSlots = useMemo(() => {
    if (!selectedDate) return [];
    
    const dateSlot = availableDateSlots.find(slot => 
      DateTimeUtils.isSameDay(slot.date, selectedDate)
    );
    
    return dateSlot ? dateSlot.timeSlots : [];
  }, [availableDateSlots, selectedDate]);

  const formatTimeSlot = (timeString: string) => {
    const date = DateTimeUtils.timeStringToDate(timeString);
    return DateTimeUtils.formatTime(date);
  };

  if (!doctor) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Doctor not found</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Date Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Date</Text>
        {availableDateSlots.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No available dates in the next {daysAhead} days
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateScrollContainer}
          >
            {availableDateSlots.map((dateSlot, index) => {
              const isSelected = selectedDate && DateTimeUtils.isSameDay(dateSlot.date, selectedDate);
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dateButton,
                    isSelected && styles.selectedDateButton
                  ]}
                  onPress={() => handleDateSelect(dateSlot)}
                >
                  <Text style={[
                    styles.dateButtonText,
                    isSelected && styles.selectedDateButtonText
                  ]}>
                    {dateSlot.dateString}
                  </Text>
                  <Text style={[
                    styles.slotsCountText,
                    isSelected && styles.selectedSlotsCountText
                  ]}>
                    {dateSlot.timeSlots.length} slot{dateSlot.timeSlots.length !== 1 ? 's' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Time Slot Selection */}
      {selectedDate && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Select Time - {DateTimeUtils.formatDate(selectedDate)}
          </Text>
          {selectedDateSlots.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No available time slots for this date
              </Text>
            </View>
          ) : (
            <View style={styles.timeSlotsGrid}>
              {selectedDateSlots.map((timeSlot) => {
                const isSelected = selectedTimeSlot === timeSlot;
                
                return (
                  <TouchableOpacity
                    key={timeSlot}
                    style={[
                      styles.timeSlotButton,
                      isSelected && styles.selectedTimeSlotButton
                    ]}
                    onPress={() => handleTimeSlotSelect(timeSlot)}
                  >
                    <Text style={[
                      styles.timeSlotButtonText,
                      isSelected && styles.selectedTimeSlotButtonText
                    ]}>
                      {formatTimeSlot(timeSlot)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* Selected DateTime Summary */}
      {selectedDateTime && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Selected Appointment Time</Text>
          <Text style={styles.summaryText}>
            {DateTimeUtils.formatDateTime(selectedDateTime)}
          </Text>
          <Text style={styles.summaryDuration}>
            Duration: {duration} minutes
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  dateScrollContainer: {
    paddingHorizontal: 4,
    gap: 12,
  },
  dateButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
    minWidth: 120,
    alignItems: 'center',
  },
  selectedDateButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  dateButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  selectedDateButtonText: {
    color: 'white',
  },
  slotsCountText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  selectedSlotsCountText: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlotButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
    minWidth: 80,
    alignItems: 'center',
  },
  selectedTimeSlotButton: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  timeSlotButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  selectedTimeSlotButtonText: {
    color: 'white',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    padding: 24,
  },
  summaryContainer: {
    backgroundColor: '#EBF8FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 16,
    color: '#1E40AF',
    fontWeight: '500',
  },
  summaryDuration: {
    fontSize: 14,
    color: '#3B82F6',
    marginTop: 4,
  },
});