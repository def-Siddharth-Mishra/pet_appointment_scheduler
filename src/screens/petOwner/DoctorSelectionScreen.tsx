import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import type { PetOwnerStackNavigationProp, PetOwnerStackRouteProp } from '../../navigation/types';
import { useDoctors } from '../../hooks/useDoctors';
import { useLoadingState } from '../../hooks/useLoadingState';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import {
  LoadingSpinner,
  ErrorMessage,
  DoctorCard,
} from '../../components/shared';
import { DoctorAvailabilityService } from '../../services/DoctorAvailabilityService';
import { Doctor } from '../../types';

interface Props {
  navigation: PetOwnerStackNavigationProp<'DoctorSelection'>;
  route: PetOwnerStackRouteProp<'DoctorSelection'>;
}

interface DoctorWithAvailability {
  doctor: Doctor;
  availableSlots: number;
}

const DoctorSelectionScreen: React.FC<Props> = ({ navigation, route }) => {
  const { reason } = route.params;
  const { doctors } = useDoctors();
  const { isLoading } = useLoadingState();
  const { currentError, handleError, dismissError } = useErrorHandler();

  const [doctorsWithAvailability, setDoctorsWithAvailability] = useState<DoctorWithAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const availabilityService = DoctorAvailabilityService.getInstance();

  // Filter doctors based on the selected reason/specialization
  const filteredDoctors = useMemo(() => {
    return doctors.filter(doctor => {
      // If the reason matches a specialization, filter by that
      const hasMatchingSpecialization = doctor.specializations.some(spec =>
        spec.toLowerCase().includes(reason.toLowerCase()) ||
        reason.toLowerCase().includes(spec.toLowerCase())
      );

      // For general practice or if no specific match, include general practitioners
      const isGeneralPractitioner = doctor.specializations.includes('General Practice');

      return hasMatchingSpecialization || isGeneralPractitioner;
    });
  }, [doctors, reason]);

  useEffect(() => {
    loadDoctorsWithAvailability();
  }, [filteredDoctors]);

  const loadDoctorsWithAvailability = async () => {
    try {
      setLoading(true);
      const doctorsWithSlots = await availabilityService.getDoctorsWithAvailability(filteredDoctors);
      
      // Sort by availability (most available first) and then by rating
      const sortedDoctors = doctorsWithSlots.sort((a, b) => {
        if (a.availableSlots !== b.availableSlots) {
          return b.availableSlots - a.availableSlots;
        }
        return b.doctor.rating - a.doctor.rating;
      });
      
      setDoctorsWithAvailability(sortedDoctors);
    } catch (error) {
      handleError(error, 'Failed to load doctor availability');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDoctorsWithAvailability();
    setRefreshing(false);
  };

  const handleDoctorPress = (doctorId: string) => {
    navigation.navigate('BookingDetails', { doctorId, reason });
  };

  const renderDoctorItem = ({ item }: { item: DoctorWithAvailability }) => (
    <DoctorCard
      doctor={item.doctor}
      onPress={() => handleDoctorPress(item.doctor.id)}
      showAvailability={true}
      availableSlots={item.availableSlots}
      highlightSpecialization={reason}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>No doctors available</Text>
      <Text style={styles.emptyStateText}>
        No doctors found for "{reason}". Try selecting a different reason or check back later.
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  if (currentError) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorMessage
          message={currentError.message}
          onRetry={currentError.retryAction || loadDoctorsWithAvailability}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Available Doctors</Text>
        <Text style={styles.subtitle}>
          For: {reason}
        </Text>
        <Text style={styles.resultCount}>
          {doctorsWithAvailability.length} doctor{doctorsWithAvailability.length !== 1 ? 's' : ''} available
        </Text>
      </View>

      {/* Doctor List */}
      <FlatList
        data={doctorsWithAvailability}
        renderItem={renderDoctorItem}
        keyExtractor={(item) => item.doctor.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#2196F3']}
          />
        }
        ListEmptyComponent={renderEmptyState}
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
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
    marginBottom: 4,
  },
  resultCount: {
    fontSize: 14,
    color: '#666',
  },
  listContainer: {
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default DoctorSelectionScreen;