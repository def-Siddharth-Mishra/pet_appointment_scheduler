import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import type { PetOwnerStackNavigationProp, PetOwnerStackRouteProp } from '../../navigation/types';
import { useAppContext } from '../../context/AppContext';
import { useDoctors } from '../../hooks/useDoctors';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import {
  LoadingSpinner,
  ErrorMessage,
  SuccessMessage,
  FormInput,
  DateTimeSlotPicker,
} from '../../components/shared';
import { PetInfo } from '../../types';

interface Props {
  navigation: PetOwnerStackNavigationProp<'BookingDetails'>;
  route: PetOwnerStackRouteProp<'BookingDetails'>;
}

const BookingDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { doctorId, reason } = route.params;
  const { state, bookAppointment } = useAppContext();
  const { getDoctorById } = useDoctors();
  const { currentError, handleError, dismissError } = useErrorHandler();

  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);
  const [petInfo, setPetInfo] = useState<PetInfo>({
    name: '',
    species: '',
    breed: '',
    age: 0,
  });
  const [loading, setLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const doctor = getDoctorById(doctorId);

  useEffect(() => {
    if (!doctor) {
      Alert.alert('Error', 'Doctor not found', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    }
  }, [doctor, navigation]);

  const handlePetInfoChange = (field: keyof PetInfo, value: string | number) => {
    setPetInfo(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validatePetInfo = (): boolean => {
    if (!petInfo.name.trim()) {
      Alert.alert('Validation Error', 'Please enter your pet\'s name');
      return false;
    }
    if (!petInfo.species.trim()) {
      Alert.alert('Validation Error', 'Please enter your pet\'s species');
      return false;
    }
    if (petInfo.age <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid age for your pet');
      return false;
    }
    return true;
  };

  const handleBookAppointment = async () => {
    if (!selectedDateTime) {
      Alert.alert('Validation Error', 'Please select a date and time');
      return;
    }

    if (!validatePetInfo()) {
      return;
    }

    if (!state.currentUser) {
      Alert.alert('Error', 'User not found. Please restart the app.');
      return;
    }

    try {
      setLoading(true);
      dismissError();

      const appointmentData = {
        doctorId,
        petOwnerId: state.currentUser.id,
        petInfo: {
          ...petInfo,
          breed: petInfo.breed || undefined,
        },
        dateTime: selectedDateTime,
        duration: 30, // Default 30 minutes
        reason,
        status: 'scheduled' as const,
      };

      await bookAppointment(appointmentData);
      setBookingSuccess(true);

      // Navigate to success screen after a short delay
      setTimeout(() => {
        navigation.navigate('MyAppointments');
      }, 2000);

    } catch (error) {
      handleError(error, 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

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

  if (bookingSuccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <SuccessMessage
            message="Appointment booked successfully! You will be redirected to your appointments shortly."
            visible={true}
          />
        </View>
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Book Appointment</Text>
          <Text style={styles.subtitle}>
            Dr. {doctor.name} - {reason}
          </Text>
        </View>

        {/* Pet Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pet Information</Text>
          
          <FormInput
            label="Pet Name *"
            value={petInfo.name}
            onChangeText={(value) => handlePetInfoChange('name', value)}
            placeholder="Enter your pet's name"
          />

          <FormInput
            label="Species *"
            value={petInfo.species}
            onChangeText={(value) => handlePetInfoChange('species', value)}
            placeholder="e.g., Dog, Cat, Bird, etc."
          />

          <FormInput
            label="Breed (Optional)"
            value={petInfo.breed || ''}
            onChangeText={(value) => handlePetInfoChange('breed', value)}
            placeholder="e.g., Golden Retriever, Persian, etc."
          />

          <FormInput
            label="Age (years) *"
            value={petInfo.age.toString()}
            onChangeText={(value) => {
              const age = parseInt(value) || 0;
              handlePetInfoChange('age', age);
            }}
            placeholder="Enter your pet's age"
            keyboardType="numeric"
          />
        </View>

        {/* Date and Time Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date & Time</Text>
          <DateTimeSlotPicker
            selectedDateTime={selectedDateTime}
            onDateTimeSelect={setSelectedDateTime}
            doctorId={doctorId}
            duration={30}
            daysAhead={30}
          />
        </View>

        {/* Appointment Summary */}
        {selectedDateTime && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Appointment Summary</Text>
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Doctor:</Text>
                <Text style={styles.summaryValue}>Dr. {doctor.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Pet:</Text>
                <Text style={styles.summaryValue}>
                  {petInfo.name || 'Not specified'} ({petInfo.species || 'Not specified'})
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Reason:</Text>
                <Text style={styles.summaryValue}>{reason}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Date & Time:</Text>
                <Text style={styles.summaryValue}>
                  {selectedDateTime.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })} at {selectedDateTime.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Duration:</Text>
                <Text style={styles.summaryValue}>30 minutes</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Book Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.bookButton,
            (!selectedDateTime || loading) && styles.bookButtonDisabled,
          ]}
          onPress={handleBookAppointment}
          disabled={!selectedDateTime || loading}
        >
          {loading ? (
            <LoadingSpinner size="small" color="#fff" />
          ) : (
            <Text style={[
              styles.bookButtonText,
              (!selectedDateTime || loading) && styles.bookButtonTextDisabled,
            ]}>
              Book Appointment
            </Text>
          )}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
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
    marginBottom: 16,
  },
  summaryContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    flex: 2,
    textAlign: 'right',
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
    flexDirection: 'row',
    justifyContent: 'center',
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
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

export default BookingDetailsScreen;