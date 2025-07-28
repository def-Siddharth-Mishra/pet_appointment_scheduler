import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { DateTimeUtils } from '../../utils/dateTimeUtils';

interface TimeSlotPickerProps {
  availableSlots: string[];
  selectedSlot?: string;
  onSlotSelect: (slot: string) => void;
  date: Date;
  loading?: boolean;
  emptyMessage?: string;
}

export const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  availableSlots,
  selectedSlot,
  onSlotSelect,
  date,
  loading = false,
  emptyMessage = 'No available time slots for this date'
}) => {
  const formatSlotTime = (timeString: string) => {
    const date = DateTimeUtils.timeStringToDate(timeString);
    return DateTimeUtils.formatTime(date);
  };

  const isSlotInPast = (timeString: string) => {
    const slotDateTime = DateTimeUtils.timeStringToDate(timeString, date);
    return DateTimeUtils.isInPast(slotDateTime);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Available Time Slots</Text>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading available slots...</Text>
        </View>
      </View>
    );
  }

  if (availableSlots.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Available Time Slots</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Available Time Slots - {DateTimeUtils.formatDate(date)}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.slotsContainer}
      >
        {availableSlots.map((slot) => {
          const isPast = isSlotInPast(slot);
          const isSelected = selectedSlot === slot;
          
          return (
            <TouchableOpacity
              key={slot}
              style={[
                styles.slotButton,
                isSelected && styles.selectedSlot,
                isPast && styles.pastSlot
              ]}
              onPress={() => !isPast && onSlotSelect(slot)}
              disabled={isPast}
            >
              <Text
                style={[
                  styles.slotText,
                  isSelected && styles.selectedSlotText,
                  isPast && styles.pastSlotText
                ]}
              >
                {formatSlotTime(slot)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      
      {selectedSlot && (
        <View style={styles.selectedInfo}>
          <Text style={styles.selectedInfoText}>
            Selected: {formatSlotTime(selectedSlot)} on {DateTimeUtils.formatDate(date)}
          </Text>
        </View>
      )}
    </View>
  );
};

// Alternative grid layout for when there are many slots
export const TimeSlotGrid: React.FC<TimeSlotPickerProps> = ({
  availableSlots,
  selectedSlot,
  onSlotSelect,
  date,
  loading = false,
  emptyMessage = 'No available time slots for this date'
}) => {
  const formatSlotTime = (timeString: string) => {
    const date = DateTimeUtils.timeStringToDate(timeString);
    return DateTimeUtils.formatTime(date);
  };

  const isSlotInPast = (timeString: string) => {
    const slotDateTime = DateTimeUtils.timeStringToDate(timeString, date);
    return DateTimeUtils.isInPast(slotDateTime);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Available Time Slots</Text>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading available slots...</Text>
        </View>
      </View>
    );
  }

  if (availableSlots.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Available Time Slots</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Available Time Slots - {DateTimeUtils.formatDate(date)}
      </Text>
      <View style={styles.gridContainer}>
        {availableSlots.map((slot) => {
          const isPast = isSlotInPast(slot);
          const isSelected = selectedSlot === slot;
          
          return (
            <TouchableOpacity
              key={slot}
              style={[
                styles.gridSlotButton,
                isSelected && styles.selectedSlot,
                isPast && styles.pastSlot
              ]}
              onPress={() => !isPast && onSlotSelect(slot)}
              disabled={isPast}
            >
              <Text
                style={[
                  styles.slotText,
                  isSelected && styles.selectedSlotText,
                  isPast && styles.pastSlotText
                ]}
              >
                {formatSlotTime(slot)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      
      {selectedSlot && (
        <View style={styles.selectedInfo}>
          <Text style={styles.selectedInfoText}>
            Selected: {formatSlotTime(selectedSlot)} on {DateTimeUtils.formatDate(date)}
          </Text>
        </View>
      )}
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
    paddingHorizontal: 16,
  },
  slotsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
  },
  slotButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
    minWidth: 80,
    alignItems: 'center',
  },
  gridSlotButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
    minWidth: 70,
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedSlot: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  pastSlot: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    opacity: 0.6,
  },
  slotText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  selectedSlotText: {
    color: 'white',
  },
  pastSlotText: {
    color: '#9CA3AF',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  selectedInfo: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#EBF8FF',
    borderRadius: 8,
    marginHorizontal: 16,
  },
  selectedInfoText: {
    fontSize: 14,
    color: '#1E40AF',
    textAlign: 'center',
    fontWeight: '500',
  },
});