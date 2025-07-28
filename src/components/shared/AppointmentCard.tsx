import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Appointment, Doctor, PetOwner } from '../../types';
import { DateTimeUtils } from '../../utils/dateTimeUtils';

interface AppointmentCardProps {
  appointment: Appointment;
  doctor?: Doctor;
  petOwner?: PetOwner;
  onPress?: () => void;
  onCancel?: () => void;
  onReschedule?: () => void;
  showActions?: boolean;
  userType: 'doctor' | 'petOwner';
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  doctor,
  petOwner,
  onPress,
  onCancel,
  onReschedule,
  showActions = true,
  userType
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return '#10B981';
      case 'completed':
        return '#6B7280';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const isPastAppointment = DateTimeUtils.isInPast(appointment.dateTime);
  const canCancel = appointment.status === 'scheduled' && !isPastAppointment;
  const canReschedule = appointment.status === 'scheduled' && !isPastAppointment;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.dateTimeContainer}>
          <Text style={styles.date}>
            {DateTimeUtils.formatDate(appointment.dateTime)}
          </Text>
          <Text style={styles.time}>
            {DateTimeUtils.formatTime(appointment.dateTime)}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
          <Text style={styles.statusText}>
            {getStatusText(appointment.status)}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        {userType === 'doctor' && petOwner && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Pet Owner:</Text>
            <Text style={styles.value}>{petOwner.name}</Text>
          </View>
        )}

        {userType === 'petOwner' && doctor && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Doctor:</Text>
            <Text style={styles.value}>{doctor.name}</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.label}>Pet:</Text>
          <Text style={styles.value}>
            {appointment.petInfo.name} ({appointment.petInfo.species})
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Reason:</Text>
          <Text style={styles.value} numberOfLines={2}>
            {appointment.reason}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Duration:</Text>
          <Text style={styles.value}>{appointment.duration} minutes</Text>
        </View>
      </View>

      {showActions && (canCancel || canReschedule) && (
        <View style={styles.actions}>
          {canReschedule && onReschedule && (
            <TouchableOpacity
              style={[styles.actionButton, styles.rescheduleButton]}
              onPress={onReschedule}
            >
              <Text style={styles.rescheduleButtonText}>Reschedule</Text>
            </TouchableOpacity>
          )}
          {canCancel && onCancel && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateTimeContainer: {
    flex: 1,
  },
  date: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  time: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    width: 80,
  },
  value: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  rescheduleButton: {
    backgroundColor: 'white',
    borderColor: '#007AFF',
  },
  rescheduleButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: 'white',
    borderColor: '#EF4444',
  },
  cancelButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
  },
});