import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  SectionList,
} from 'react-native';
import type { DoctorStackNavigationProp } from '../../navigation/types';
import { useAppContext } from '../../context/AppContext';
import { AppointmentCard } from '../../components/shared/AppointmentCard';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { ErrorMessage } from '../../components/shared/ErrorMessage';
import LazyAppointmentList from '../../components/shared/LazyAppointmentList';
import { Appointment, PetOwner } from '../../types';
import { DateTimeUtils } from '../../utils/dateTimeUtils';

interface Props {
  navigation: DoctorStackNavigationProp<'AppointmentsList'>;
}

interface AppointmentSection {
  title: string;
  data: Appointment[];
}

const AppointmentsListScreen: React.FC<Props> = ({ navigation }) => {
  const { state, cancelAppointment, loadAllData, clearError } = useAppContext();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');

  // Get current doctor's appointments
  const doctorAppointments = useMemo(() => {
    if (!state.currentUser) return [];
    return state.appointments.filter(appointment => 
      appointment.doctorId === state.currentUser!.id
    );
  }, [state.appointments, state.currentUser]);

  // Filter appointments based on selected filter
  const filteredAppointments = useMemo(() => {
    const now = new Date();
    
    switch (filter) {
      case 'upcoming':
        return doctorAppointments.filter(appointment => 
          appointment.dateTime >= now && appointment.status !== 'cancelled'
        );
      case 'past':
        return doctorAppointments.filter(appointment => 
          appointment.dateTime < now || appointment.status === 'completed'
        );
      default:
        return doctorAppointments;
    }
  }, [doctorAppointments, filter]);

  // Group appointments by date
  const appointmentSections = useMemo(() => {
    const grouped = filteredAppointments.reduce((acc, appointment) => {
      const dateKey = DateTimeUtils.formatDate(appointment.dateTime);
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(appointment);
      return acc;
    }, {} as Record<string, Appointment[]>);

    // Sort appointments within each date by time
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
    });

    // Convert to sections array and sort by date
    const sections: AppointmentSection[] = Object.keys(grouped)
      .sort((a, b) => {
        const dateA = new Date(grouped[a][0].dateTime);
        const dateB = new Date(grouped[b][0].dateTime);
        return filter === 'past' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
      })
      .map(dateKey => ({
        title: dateKey,
        data: grouped[dateKey],
      }));

    return sections;
  }, [filteredAppointments, filter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadAllData();
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
              Alert.alert('Success', 'Appointment cancelled successfully');
            } catch (error) {
              console.error('Error cancelling appointment:', error);
              Alert.alert('Error', 'Failed to cancel appointment. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleRescheduleAppointment = (appointment: Appointment) => {
    // Navigate to appointment details where rescheduling can be handled
    navigation.navigate('AppointmentDetails', { appointmentId: appointment.id });
  };

  const getPetOwnerForAppointment = (appointment: Appointment): PetOwner | undefined => {
    return state.petOwners.find(owner => owner.id === appointment.petOwnerId);
  };

  const renderFilterButton = (filterType: typeof filter, label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterType && styles.activeFilterButton
      ]}
      onPress={() => setFilter(filterType)}
    >
      <Text style={[
        styles.filterButtonText,
        filter === filterType && styles.activeFilterButtonText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderAppointmentItem = ({ item }: { item: Appointment }) => {
    const petOwner = getPetOwnerForAppointment(item);
    
    return (
      <AppointmentCard
        appointment={item}
        petOwner={petOwner}
        userType="doctor"
        onPress={() => handleAppointmentPress(item)}
        onCancel={() => handleCancelAppointment(item)}
        onReschedule={() => handleRescheduleAppointment(item)}
        showActions={item.status === 'scheduled' && !DateTimeUtils.isInPast(item.dateTime)}
      />
    );
  };

  const renderSectionHeader = ({ section }: { section: AppointmentSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
      <Text style={styles.sectionHeaderCount}>
        {section.data.length} appointment{section.data.length !== 1 ? 's' : ''}
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>
        {filter === 'upcoming' ? 'No Upcoming Appointments' : 
         filter === 'past' ? 'No Past Appointments' : 'No Appointments'}
      </Text>
      <Text style={styles.emptyStateSubtitle}>
        {filter === 'upcoming' 
          ? 'Your upcoming appointments will appear here'
          : filter === 'past'
          ? 'Your completed and past appointments will appear here'
          : 'Your appointments will appear here'
        }
      </Text>
    </View>
  );

  if (state.loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {state.error && (
        <ErrorMessage
          message={state.error.message}
          onRetry={state.error.retryAction}
        />
      )}

      <View style={styles.header}>
        <Text style={styles.title}>My Appointments</Text>
        <View style={styles.filterContainer}>
          {renderFilterButton('upcoming', 'Upcoming')}
          {renderFilterButton('past', 'Past')}
          {renderFilterButton('all', 'All')}
        </View>
      </View>

      <LazyAppointmentList
        appointments={filteredAppointments}
        petOwners={state.petOwners}
        userType="doctor"
        onAppointmentPress={handleAppointmentPress}
        onCancel={handleCancelAppointment}
        onReschedule={handleRescheduleAppointment}
        onRefresh={handleRefresh}
        groupBy="date"
        pageSize={20}
        enableVirtualization={true}
        showActions={true}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  activeFilterButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeFilterButtonText: {
    color: 'white',
  },
  sectionHeader: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  sectionHeaderCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AppointmentsListScreen;