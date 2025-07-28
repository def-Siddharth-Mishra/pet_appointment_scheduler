import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { TimeSlot } from '../../types';
import { DAYS_OF_WEEK, DayOfWeek } from '../../utils/constants';
import { TimeSlotModel } from '../../models';

interface DayScheduleSelectorProps {
  selectedDays: DayOfWeek[];
  onDaysChange: (days: DayOfWeek[]) => void;
  daySchedules: Record<string, TimeSlot[]>;
  onDayScheduleChange: (day: DayOfWeek, timeSlots: TimeSlot[]) => void;
}

export const DayScheduleSelector: React.FC<DayScheduleSelectorProps> = ({
  selectedDays,
  onDaysChange,
  daySchedules,
  onDayScheduleChange,
}) => {
  const [expandedDay, setExpandedDay] = useState<DayOfWeek | null>(null);

  const toggleDay = (day: DayOfWeek) => {
    if (selectedDays.includes(day)) {
      // Remove day
      onDaysChange(selectedDays.filter(d => d !== day));
      // Clear schedule for this day
      onDayScheduleChange(day, []);
    } else {
      // Add day
      onDaysChange([...selectedDays, day]);
      // Initialize with default time slot
      onDayScheduleChange(day, [{
        startTime: '09:00',
        endTime: '17:00',
        isRecurring: true,
      }]);
    }
  };

  const addTimeSlot = (day: DayOfWeek) => {
    const currentSlots = daySchedules[day] || [];
    const newSlot: TimeSlot = {
      startTime: '09:00',
      endTime: '10:00',
      isRecurring: true,
    };
    onDayScheduleChange(day, [...currentSlots, newSlot]);
  };

  const updateTimeSlot = (day: DayOfWeek, index: number, field: 'startTime' | 'endTime', value: string) => {
    const currentSlots = daySchedules[day] || [];
    const updatedSlots = [...currentSlots];
    updatedSlots[index] = { ...updatedSlots[index], [field]: value };
    
    // Validate the time slot
    const errors = TimeSlotModel.validate(updatedSlots[index]);
    if (errors.length > 0) {
      Alert.alert('Invalid Time Slot', errors.join('\n'));
      return;
    }
    
    onDayScheduleChange(day, updatedSlots);
  };

  const removeTimeSlot = (day: DayOfWeek, index: number) => {
    const currentSlots = daySchedules[day] || [];
    const updatedSlots = currentSlots.filter((_, i) => i !== index);
    onDayScheduleChange(day, updatedSlots);
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 6; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push(timeString);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Available Days</Text>
      
      <ScrollView style={styles.daysContainer}>
        {DAYS_OF_WEEK.map((day) => {
          const isSelected = selectedDays.includes(day);
          const isExpanded = expandedDay === day;
          const daySlots = daySchedules[day] || [];

          return (
            <View key={day} style={styles.dayContainer}>
              <TouchableOpacity
                style={[styles.dayButton, isSelected && styles.selectedDayButton]}
                onPress={() => toggleDay(day)}
              >
                <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>
                  {day}
                </Text>
                {isSelected && (
                  <TouchableOpacity
                    style={styles.expandButton}
                    onPress={() => setExpandedDay(isExpanded ? null : day)}
                  >
                    <Text style={styles.expandButtonText}>
                      {isExpanded ? '−' : '+'}
                    </Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>

              {isSelected && isExpanded && (
                <View style={styles.timeSlotsContainer}>
                  <Text style={styles.timeSlotsTitle}>Time Slots for {day}</Text>
                  
                  {daySlots.map((slot, index) => (
                    <View key={index} style={styles.timeSlotRow}>
                      <View style={styles.timeInputContainer}>
                        <Text style={styles.timeLabel}>From:</Text>
                        <TouchableOpacity
                          style={styles.timeButton}
                          onPress={() => {
                            Alert.alert(
                              'Select Start Time',
                              '',
                              timeOptions.map(time => ({
                                text: time,
                                onPress: () => updateTimeSlot(day, index, 'startTime', time)
                              }))
                            );
                          }}
                        >
                          <Text style={styles.timeButtonText}>{slot.startTime}</Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.timeInputContainer}>
                        <Text style={styles.timeLabel}>To:</Text>
                        <TouchableOpacity
                          style={styles.timeButton}
                          onPress={() => {
                            Alert.alert(
                              'Select End Time',
                              '',
                              timeOptions.map(time => ({
                                text: time,
                                onPress: () => updateTimeSlot(day, index, 'endTime', time)
                              }))
                            );
                          }}
                        >
                          <Text style={styles.timeButtonText}>{slot.endTime}</Text>
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        style={styles.removeSlotButton}
                        onPress={() => removeTimeSlot(day, index)}
                      >
                        <Text style={styles.removeSlotButtonText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}

                  <TouchableOpacity
                    style={styles.addSlotButton}
                    onPress={() => addTimeSlot(day)}
                  >
                    <Text style={styles.addSlotButtonText}>+ Add Time Slot</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  daysContainer: {
    maxHeight: 400,
  },
  dayContainer: {
    marginBottom: 8,
  },
  dayButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
  },
  selectedDayButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  selectedDayText: {
    color: 'white',
  },
  expandButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  timeSlotsContainer: {
    marginTop: 8,
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  timeSlotsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 8,
  },
  timeSlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  timeInputContainer: {
    flex: 1,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  timeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
    minWidth: 70,
    alignItems: 'center',
  },
  timeButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  removeSlotButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeSlotButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addSlotButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4CAF50',
    backgroundColor: 'transparent',
    alignItems: 'center',
    marginTop: 4,
  },
  addSlotButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
  },
});