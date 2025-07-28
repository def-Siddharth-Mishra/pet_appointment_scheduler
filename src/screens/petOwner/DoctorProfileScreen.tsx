import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import type { PetOwnerStackNavigationProp, PetOwnerStackRouteProp } from '../../navigation/types';
import { useDoctors } from '../../hooks/useDoctors';
import { useLoadingState } from '../../hooks/useLoadingState';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { LoadingSpinner, ErrorMessage } from '../../components/shared';
import { DoctorAvailabilityService } from '../../services/DoctorAvailabilityService';
import { Doctor } from '../../types';

interface Props {
  navigation: PetOwnerStackNavigationProp<'DoctorProfile'>;
  route: PetOwnerStackRouteProp<'DoctorProfile'>;
}

const DoctorProfileScreen: React.FC<Props> = ({ navigation, route }) => {
  const { doctorId } = route.params;
  const { getDoctorById } = useDoctors();
  const { isLoading } = useLoadingState();
  const { currentError, handleError, dismissError } = useErrorHandler();
  
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
  const [nextAvailableSlot, setNextAvailableSlot] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  const availabilityService = DoctorAvailabilityService.getInstance();

  useEffect(() => {
    loadDoctorData();
  }, [doctorId]);

  const loadDoctorData = async () => {
    try {
      setLoading(true);
      
      const doctorData = getDoctorById(doctorId);
      if (!doctorData) {
        Alert.alert('Error', 'Doctor not found', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
        return;
      }

      setDoctor(doctorData);

      // Load availability data
      const [slots, nextSlot] = await Promise.all([
        availabilityService.getAvailableSlots(doctorId, 7), // Next 7 days
        availabilityService.getNextAvailableSlot(doctorId),
      ]);

      setAvailableSlots(slots);
      setNextAvailableSlot(nextSlot);
    } catch (error) {
      handleError(error, 'Failed to load doctor information');
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = () => {
    if (!doctor) return;
    
    navigation.navigate('BookingReason', { doctorId: doctor.id });
  };

  const renderRating = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push('★');
    }
    if (hasHalfStar) {
      stars.push('☆');
    }
    while (stars.length < 5) {
      stars.push('☆');
    }
    
    return stars.join('');
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getScheduleText = (doctor: Doctor) => {
    const days = Object.keys(doctor.schedule).filter(day => 
      doctor.schedule[day] && doctor.schedule[day].length > 0
    );
    
    if (days.length === 0) {
      return 'No schedule available';
    }

    return days.map(day => {
      const timeSlots = doctor.schedule[day];
      const timeRanges = timeSlots.map(slot => `${slot.startTime}-${slot.endTime}`);
      return `${day.charAt(0).toUpperCase() + day.slice(1)}: ${timeRanges.join(', ')}`;
    }).join('\n');
  };

  if (loading || isLoading) {
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
          onRetry={currentError.retryAction}
        />
      </SafeAreaView>
    );
  }

  if (!doctor) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Doctor not found</Text>
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{doctor.name}</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.stars}>{renderRating(doctor.rating)}</Text>
            <Text style={styles.ratingText}>{doctor.rating.toFixed(1)}</Text>
          </View>
        </View>

        {/* Specializations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specializations</Text>
          <View style={styles.specializations}>
            {doctor.specializations.map((spec, index) => (
              <View key={index} style={styles.specializationTag}>
                <Text style={styles.specializationText}>{spec}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Experience & Languages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience & Languages</Text>
          <Text style={styles.detailText}>
            {doctor.experienceYears} {doctor.experienceYears === 1 ? 'year' : 'years'} of experience
          </Text>
          <Text style={styles.detailText}>
            Languages: {doctor.languages.join(', ')}
          </Text>
        </View>

        {/* Availability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Availability</Text>
          {nextAvailableSlot ? (
            <View style={styles.availabilityInfo}>
              <Text style={styles.nextSlotLabel}>Next available:</Text>
              <Text style={styles.nextSlotText}>
                {formatDate(nextAvailableSlot)} at {formatTime(nextAvailableSlot)}
              </Text>
              <Text style={styles.totalSlotsText}>
                {availableSlots.length} slots available in the next 7 days
              </Text>
            </View>
          ) : (
            <Text style={styles.noAvailabilityText}>
              No available slots in the next 7 days
            </Text>
          )}
        </View>

        {/* Schedule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Schedule</Text>
          <Text style={styles.scheduleText}>{getScheduleText(doctor)}</Text>
        </View>

        {/* Upcoming Slots Preview */}
        {availableSlots.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Available Slots</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {availableSlots.slice(0, 10).map((slot, index) => (
                <View key={index} style={styles.slotCard}>
                  <Text style={styles.slotDate}>{formatDate(slot)}</Text>
                  <Text style={styles.slotTime}>{formatTime(slot)}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Book Appointment Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.bookButton,
            availableSlots.length === 0 && styles.bookButtonDisabled,
          ]}
          onPress={handleBookAppointment}
          disabled={availableSlots.length === 0}
        >
          <Text style={[
            styles.bookButtonText,
            availableSlots.length === 0 && styles.bookButtonTextDisabled,
          ]}>
            {availableSlots.length > 0 ? 'Book Appointment' : 'No Available Slots'}
          </Text>
        </TouchableOpacity>
      </View>
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
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    fontSize: 18,
    color: '#FFD700',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  specializations: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  specializationTag: {
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  specializationText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '500',
  },
  detailText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  availabilityInfo: {
    backgroundColor: '#F1F8E9',
    padding: 16,
    borderRadius: 8,
  },
  nextSlotLabel: {
    fontSize: 14,
    color: '#558B2F',
    fontWeight: '500',
  },
  nextSlotText: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '600',
    marginTop: 4,
  },
  totalSlotsText: {
    fontSize: 14,
    color: '#558B2F',
    marginTop: 8,
  },
  noAvailabilityText: {
    fontSize: 16,
    color: '#F44336',
    fontStyle: 'italic',
  },
  scheduleText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontFamily: 'monospace',
  },
  slotCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  slotDate: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  slotTime: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '600',
    marginTop: 2,
  },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  bookButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  bookButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bookButtonTextDisabled: {
    color: '#999',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#F44336',
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});export default DoctorProfileScreen;