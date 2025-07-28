import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  SectionList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import type { PetOwnerStackNavigationProp } from '../../navigation/types';
import { useAppContext } from '../../context/AppContext';
import { useAppointments } from '../../hooks/useAppointments';
import { AppointmentCard } from '../../components/shared/AppointmentCard';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { ErrorMessage } from '../../components/shared/ErrorMessage';
import LazyAppointmentList from '../../components/shared/LazyAppointmentList';
import { Appointment, Doctor, PetInfo } from '../../types';
import { DateTimeUtils } from '../../utils/dateTimeUtils';

interface Props {
  navigation: PetOwnerStackNavigationProp<'MyAppointments'>;
}

interface AppointmentSection {
  title: string;
  data: Appointment[];
}

interface GroupedAppointments {
  [petName: string]: {
    upcoming: Appointment[];
    past: Appointment[];
  };
}

const MyAppointmentsScreen: React.FC<Props> = ({ navigation }) => {
  const { state, clearError } = useAppContext();
  const { 
    appointmentsByPetOwner, 
    cancelAppointment, 
    rescheduleAppointment,
    isBookingInProgress 
  } = useAppointments();

  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'chronological' | 'by-pet'>('chronological');

  // Get current user's appointments
  const userAppointments = useMemo(() => {
    if (!state.currentUser) return [];
    return appointmentsByPetOwner(state.currentUser.id);
  }, [state.currentUser, appointmentsByPetOwner]);

  // Group appointments by upcoming/past
  const { upcomingAppointments, pastAppointments } = useMemo(() => {
    const now = new Date();
    const upcoming = userAppointments
      .filter(apt => apt.dateTime > now && apt.status === 'scheduled')
      .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
    
    const past = userAppointments
      .filter(apt => apt.dateTime <= now || apt.status === 'completed' || apt.status === 'cancelled')
      .sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime());
    
    return { upcomingAppointments: upcoming, pastAppointments: past };
  }, [userAppointments]);

  // Group appointments by pet
  const appointmentsByPet = useMemo(() => {
    const grouped: GroupedAppointments = {};
    
    userAppointments.forEach(appointment => {
      const petName = appointment.petInfo.name;
      if (!grouped[petName]) {
        grouped[petName] = { upcoming: [], past: [] };
      }
      
      const now = new Date();
      if (appointment.dateTime > now && appointment.status === 'scheduled') {
        grouped[petName].upcoming.push(appointment);
      } else {
        grouped[petName].past.push(appointment);
      }
    });

    // Sort appointments within each pet group
    Object.keys(grouped).forEach(petName => {
      grouped[petName].upcoming.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
      grouped[petName].past.sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime());
    });

    return grouped;
  }, [userAppointments]);

  // Create sections for SectionList
  const appointmentSections = useMemo((): AppointmentSection[] => {
    if (viewMode === 'chronological') {
      const sections: AppointmentSection[] = [];
      
      if (upcomingAppointments.length > 0) {
        sections.push({
          title: 'Upcoming Appointments',
          data: upcomingAppointments,
        });
      }
      
      if (pastAppointments.length > 0) {
        sections.push({
          title: 'Past Appointments',
          data: pastAppointments,
        });
      }
      
      return sections;
    } else {
      // Group by pet
      const sections: AppointmentSection[] = [];
      
      Object.keys(appointmentsByPet).forEach(petName => {
        const petAppointments = appointmentsByPet[petName];
        const allPetAppointments = [...petAppointments.upcoming, ...petAppointments.past];
        
        if (allPetAppointments.length > 0) {
          sections.push({
            title: petName,
            data: allPetAppointments,
          });
        }
      });
      
      return sections;
    }
  }, [viewMode, upcomingAppointments, pastAppointments, appointmentsByPet]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Clear any existing errors
      clearError();
      // The data will be automatically refreshed through the context
    } catch (error) {
      console.error('Error refreshing appointments:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAppointmentPress = (appointment: Appointment) => {
    navigation.navigate('AppointmentDetails', { appointmentId: appointment.id });
  };

  const handleCancelAppointment = (appointment: Appointment) => {
    const now = new Date();
    const timeDiff = appointment.dateTime.getTime() - now.getTime();
    const hoursUntilAppointment = timeDiff / (1000 * 60 * 60);

    // Check if cancellation is within 2 hours (as per requirement 5.5)
    if (hoursUntilAppointment < 2 && hoursUntilAppointment > 0) {
      Alert.alert(
        'Short Notice Cancellation',
        'You are cancelling this appointment with less than 2 hours notice. Are you sure you want to proceed?',
        [
          { text: 'No', style: 'cancel' },
          { 
            text: 'Yes, Cancel', 
            style: 'destructive',
            onPress: () => performCancellation(appointment)
          }
        ]
      );
    } else {
      Alert.alert(
        'Cancel Appointment',
        `Are you sure you want to cancel your appointment on ${DateTimeUtils.formatDateTime(appointment.dateTime)}?`,
        [
          { text: 'No', style: 'cancel' },
          { 
            text: 'Yes, Cancel', 
            style: 'destructive',
            onPress: () => performCancellation(appointment)
          }
        ]
      );
    }
  };

  const performCancellation = async (appointment: Appointment) => {
    try {
      await cancelAppointment(appointment.id);
      Alert.alert('Success', 'Appointment cancelled successfully');
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      Alert.alert('Error', 'Failed to cancel appointment. Please try again.');
    }
  };

  const handleRescheduleAppointment = (appointment: Appointment) => {
    // Navigate to booking flow with reschedule context
    // For now, we'll show an alert - full reschedule flow would be implemented in a separate task
    Alert.alert(
      'Reschedule Appointment',
      'Rescheduling functionality will redirect you to select a new time slot.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue',
          onPress: () => {
            // Navigate to doctor profile to select new time
            const doctor = state.doctors.find(d => d.id === appointment.doctorId);
            if (doctor) {
              navigation.navigate('DoctorProfile', { doctorId: doctor.id });
            }
          }
        }
      ]
    );
  };

  const getDoctorForAppointment = (appointment: Appointment): Doctor | undefined => {
    return state.doctors.find(doctor => doctor.id === appointment.doctorId);
  };

  const renderAppointmentCard = ({ item: appointment }: { item: Appointment }) => {
    const doctor = getDoctorForAppointment(appointment);
    
    return (
      <AppointmentCard
        appointment={appointment}
        doctor={doctor}
        userType="petOwner"
        onPress={() => handleAppointmentPress(appointment)}
        onCancel={() => handleCancelAppointment(appointment)}
        onReschedule={() => handleRescheduleAppointment(appointment)}
        showActions={appointment.status === 'scheduled' && !DateTimeUtils.isInPast(appointment.dateTime)}
      />
    );
  };

  const renderSectionHeader = ({ section }: { section: AppointmentSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionCount}>
        {section.data.length} appointment{section.data.length !== 1 ? 's' : ''}
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No Appointments</Text>
      <Text style={styles.emptyMessage}>
        You don't have any appointments yet. Browse doctors to book your first appointment.
      </Text>
      <TouchableOpacity
        style={styles.browseButton}
        onPress={() => navigation.navigate('DoctorDirectory')}
      >
        <Text style={styles.browseButtonText}>Browse Doctors</Text>
      </TouchableOpacity>
    </View>
  );

  const renderViewModeToggle = () => (
    <View style={styles.viewModeContainer}>
      <TouchableOpacity
        style={[
          styles.viewModeButton,
          viewMode === 'chronological' && styles.viewModeButtonActive
        ]}
        onPress={() => setViewMode('chronological')}
      >
        <Text style={[
          styles.viewModeText,
          viewMode === 'chronological' && styles.viewModeTextActive
        ]}>
          By Date
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.viewModeButton,
          viewMode === 'by-pet' && styles.viewModeButtonActive
        ]}
        onPress={() => setViewMode('by-pet')}
      >
        <Text style={[
          styles.viewModeText,
          viewMode === 'by-pet' && styles.viewModeTextActive
        ]}>
          By Pet
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (state.loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner message="Loading your appointments..." />
      </SafeAreaView>
    );
  }

  if (state.error) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorMessage
          message={state.error.message}
          onRetry={state.error.retryAction}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Appointments</Text>
        {userAppointments.length > 0 && renderViewModeToggle()}
      </View>

      {userAppointments.length === 0 ? (
        renderEmptyState()
      ) : (
        <LazyAppointmentList
          appointments={userAppointments}
          doctors={state.doctors}
          userType="petOwner"
          onAppointmentPress={handleAppointmentPress}
          onCancel={handleCancelAppointment}
          onReschedule={handleRescheduleAppointment}
          onRefresh={handleRefresh}
          groupBy={viewMode === 'chronological' ? 'date' : 'pet'}
          pageSize={15}
          enableVirtualization={true}
          showActions={true}
        />
      )}

      {isBookingInProgress && (
        <LoadingSpinner overlay message="Processing..." />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  viewModeContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewModeButtonActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  viewModeTextActive: {
    color: '#007AFF',
  },
  listContainer: {
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  sectionCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MyAppointmentsScreen;