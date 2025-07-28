import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import type { DoctorStackNavigationProp, DoctorStackRouteProp } from '../../navigation/types';
import { useAppContext } from '../../context/AppContext';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { ErrorMessage } from '../../components/shared/ErrorMessage';
import { DateTimeSlotPicker } from '../../components/shared/DateTimeSlotPicker';
import { Appointment, PetOwner } from '../../types';
import { DateTimeUtils } from '../../utils/dateTimeUtils';

interface Props {
  navigation: DoctorStackNavigationProp<'AppointmentDetails'>;
  route: DoctorStackRouteProp<'AppointmentDetails'>;
}

const AppointmentDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { appointmentId } = route.params;
  const { 
    state, 
    cancelAppointment, 
    rescheduleAppointment, 
    loadAllData, 
    clearError,
    checkSlotAvailability
  } = useAppContext();
  
  // Import DataService for direct appointment updates
  const dataService = React.useMemo(() => {
    const { DataService } = require('../../services/DataService');
    return DataService.getInstance();
  }, []);
  
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [petOwner, setPetOwner] = useState<PetOwner | null>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedNewDateTime, setSelectedNewDateTime] = useState<Date | null>(null);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  useEffect(() => {
    const foundAppointment = state.appointments.find(a => a.id === appointmentId);
    setAppointment(foundAppointment || null);

    if (foundAppointment) {
      const foundPetOwner = state.petOwners.find(owner => owner.id === foundAppointment.petOwnerId);
      setPetOwner(foundPetOwner || null);
    }
  }, [appointmentId, state.appointments, state.petOwners]);

  const handleCancelAppointment = () => {
    if (!appointment) return;

    const timeUntilAppointment = appointment.dateTime.getTime() - new Date().getTime();
    const hoursUntilAppointment = timeUntilAppointment / (1000 * 60 * 60);

    let alertMessage = `Are you sure you want to cancel the appointment with ${appointment.petInfo.name}?`;
    
    if (hoursUntilAppointment < 24 && hoursUntilAppointment > 0) {
      alertMessage += '\n\nNote: This appointment is within 24 hours.';
    }

    Alert.alert(
      'Cancel Appointment',
      alertMessage,
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelAppointment(appointment.id);
              Alert.alert('Success', 'Appointment cancelled successfully', [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error) {
              console.error('Error cancelling appointment:', error);
              Alert.alert('Error', 'Failed to cancel appointment. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleMarkCompleted = async () => {
    if (!appointment) return;

    Alert.alert(
      'Mark as Completed',
      `Mark the appointment with ${appointment.petInfo.name} as completed?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Mark Completed',
          onPress: async () => {
            try {
              const updatedAppointment = { ...appointment, status: 'completed' as const };
              await dataService.updateAppointment(updatedAppointment);
              await loadAllData(); // Refresh data
              Alert.alert('Success', 'Appointment marked as completed');
            } catch (error) {
              console.error('Error marking appointment as completed:', error);
              Alert.alert('Error', 'Failed to update appointment status. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleReschedulePress = () => {
    setShowRescheduleModal(true);
  };

  const handleRescheduleConfirm = async () => {
    if (!appointment || !selectedNewDateTime) return;

    setRescheduleLoading(true);
    try {
      // Check if the new slot is available
      const isAvailable = await checkSlotAvailability(
        appointment.doctorId,
        selectedNewDateTime,
        appointment.duration
      );

      if (!isAvailable) {
        Alert.alert(
          'Time Slot Unavailable',
          'The selected time slot is no longer available. Please choose a different time.'
        );
        return;
      }

      await rescheduleAppointment(appointment.id, selectedNewDateTime);
      setShowRescheduleModal(false);
      setSelectedNewDateTime(null);
      Alert.alert('Success', 'Appointment rescheduled successfully');
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      Alert.alert('Error', 'Failed to reschedule appointment. Please try again.');
    } finally {
      setRescheduleLoading(false);
    }
  };

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

  if (state.loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  if (!appointment) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Appointment Not Found</Text>
          <Text style={styles.errorSubtitle}>
            The appointment you're looking for could not be found.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isPastAppointment = DateTimeUtils.isInPast(appointment.dateTime);
  const canCancel = appointment.status === 'scheduled' && !isPastAppointment;
  const canReschedule = appointment.status === 'scheduled' && !isPastAppointment;
  const canMarkCompleted = appointment.status === 'scheduled' && isPastAppointment;

  return (
    <SafeAreaView style={styles.container}>
      {state.error && (
        <ErrorMessage
          message={state.error.message}
          onRetry={state.error.retryAction}
        />
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
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

        {/* Pet Owner Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pet Owner Information</Text>
          {petOwner ? (
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Name:</Text>
                <Text style={styles.value}>{petOwner.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{petOwner.email}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Phone:</Text>
                <Text style={styles.value}>{petOwner.phone}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.noDataText}>Pet owner information not available</Text>
          )}
        </View>

        {/* Pet Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pet Information</Text>
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.value}>{appointment.petInfo.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Species:</Text>
              <Text style={styles.value}>{appointment.petInfo.species}</Text>
            </View>
            {appointment.petInfo.breed && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Breed:</Text>
                <Text style={styles.value}>{appointment.petInfo.breed}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.label}>Age:</Text>
              <Text style={styles.value}>{appointment.petInfo.age} years old</Text>
            </View>
          </View>
        </View>

        {/* Appointment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appointment Details</Text>
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Reason:</Text>
              <Text style={styles.value}>{appointment.reason}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Duration:</Text>
              <Text style={styles.value}>{appointment.duration} minutes</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Booked:</Text>
              <Text style={styles.value}>
                {DateTimeUtils.formatDateTime(appointment.createdAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        {(canCancel || canReschedule || canMarkCompleted) && (
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Actions</Text>
            <View style={styles.actionsContainer}>
              {canMarkCompleted && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.completeButton]}
                  onPress={handleMarkCompleted}
                >
                  <Text style={styles.completeButtonText}>Mark as Completed</Text>
                </TouchableOpacity>
              )}
              {canReschedule && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.rescheduleButton]}
                  onPress={handleReschedulePress}
                >
                  <Text style={styles.rescheduleButtonText}>Reschedule</Text>
                </TouchableOpacity>
              )}
              {canCancel && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={handleCancelAppointment}
                >
                  <Text style={styles.cancelButtonText}>Cancel Appointment</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Reschedule Modal */}
      <Modal
        visible={showRescheduleModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRescheduleModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowRescheduleModal(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Reschedule Appointment</Text>
            <TouchableOpacity
              onPress={handleRescheduleConfirm}
              style={[
                styles.modalSaveButton,
                (!selectedNewDateTime || rescheduleLoading) && styles.modalSaveButtonDisabled
              ]}
              disabled={!selectedNewDateTime || rescheduleLoading}
            >
              <Text style={[
                styles.modalSaveText,
                (!selectedNewDateTime || rescheduleLoading) && styles.modalSaveTextDisabled
              ]}>
                {rescheduleLoading ? 'Saving...' : 'Confirm'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>
              Select a new date and time for the appointment with {appointment.petInfo.name}
            </Text>
            
            <DateTimeSlotPicker
              selectedDateTime={selectedNewDateTime}
              onDateTimeSelect={setSelectedNewDateTime}
              doctorId={appointment.doctorId}
              duration={appointment.duration}
              excludeAppointmentId={appointment.id}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dateTimeContainer: {
    flex: 1,
  },
  date: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  time: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  infoContainer: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    width: 100,
  },
  value: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  noDataText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  actionsSection: {
    backgroundColor: 'white',
    marginTop: 12,
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  completeButton: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  completeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  rescheduleButton: {
    backgroundColor: 'white',
    borderColor: '#007AFF',
  },
  rescheduleButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'white',
    borderColor: '#EF4444',
  },
  cancelButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCloseButton: {
    paddingVertical: 8,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalSaveButton: {
    paddingVertical: 8,
  },
  modalSaveButtonDisabled: {
    opacity: 0.5,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  modalSaveTextDisabled: {
    color: '#9CA3AF',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
});

export default AppointmentDetailsScreen;