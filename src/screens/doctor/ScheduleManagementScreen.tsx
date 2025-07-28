import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import type { DoctorStackNavigationProp } from '../../navigation/types';
import { useAppContext } from '../../context/AppContext';
import { 
  LoadingSpinner, 
  ErrorMessage, 
  SuccessMessage,
  DayScheduleSelector,
  SpecializationSelector,
  FormInput
} from '../../components/shared';
import { Doctor, WeeklySchedule, TimeSlot, RecurringPattern } from '../../types';
import { DayOfWeek, LANGUAGES, RECURRING_PATTERNS } from '../../utils/constants';
import { ScheduleService } from '../../services/ScheduleService';
import { DoctorModel } from '../../models';

interface Props {
  navigation: DoctorStackNavigationProp<'ScheduleManagement'>;
}

const ScheduleManagementScreen: React.FC<Props> = ({ navigation }) => {
  const { state, updateDoctor, addDoctor, clearError } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Doctor profile state
  const [doctorName, setDoctorName] = useState('');
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['English']);
  const [experienceYears, setExperienceYears] = useState('');
  
  // Schedule state
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const [daySchedules, setDaySchedules] = useState<Record<string, TimeSlot[]>>({});
  const [recurringPattern, setRecurringPattern] = useState<'weekly' | 'bi-weekly' | 'monthly'>('weekly');
  
  // Current doctor (if editing existing profile)
  const [currentDoctor, setCurrentDoctor] = useState<Doctor | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const scheduleService = ScheduleService.getInstance();

  useEffect(() => {
    // Check if current user is a doctor and load their profile
    if (state.currentUser && state.userType === 'doctor') {
      const doctor = state.doctors.find(d => d.id === state.currentUser?.id);
      if (doctor) {
        setCurrentDoctor(doctor);
        setIsEditing(true);
        loadDoctorProfile(doctor);
      } else {
        // New doctor profile
        setDoctorName(state.currentUser.name);
        setIsEditing(false);
      }
    }
  }, [state.currentUser, state.doctors]);

  const loadDoctorProfile = (doctor: Doctor) => {
    setDoctorName(doctor.name);
    setSelectedSpecializations(doctor.specializations);
    setSelectedLanguages(doctor.languages);
    setExperienceYears(doctor.experienceYears.toString());
    
    // Load schedule
    const schedule = doctor.schedule;
    const days: DayOfWeek[] = [];
    const schedules: Record<string, TimeSlot[]> = {};
    
    Object.entries(schedule).forEach(([day, slots]) => {
      if (slots && slots.length > 0) {
        days.push(day as DayOfWeek);
        schedules[day] = slots;
      }
    });
    
    setSelectedDays(days);
    setDaySchedules(schedules);
  };

  const handleLanguageToggle = (language: string) => {
    if (selectedLanguages.includes(language)) {
      if (selectedLanguages.length > 1) {
        setSelectedLanguages(selectedLanguages.filter(l => l !== language));
      }
    } else {
      setSelectedLanguages([...selectedLanguages, language]);
    }
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!doctorName.trim()) {
      errors.push('Doctor name is required');
    }
    
    if (selectedSpecializations.length === 0) {
      errors.push('At least one specialization must be selected');
    }
    
    if (selectedDays.length === 0) {
      errors.push('At least one working day must be selected');
    }
    
    if (selectedLanguages.length === 0) {
      errors.push('At least one language must be selected');
    }
    
    const expYears = parseInt(experienceYears);
    if (isNaN(expYears) || expYears < 0) {
      errors.push('Experience years must be a valid positive number');
    }
    
    // Validate schedule
    const schedule: WeeklySchedule = {};
    selectedDays.forEach(day => {
      schedule[day] = daySchedules[day] || [];
    });
    
    const scheduleValidation = scheduleService.validateSchedule(schedule);
    if (!scheduleValidation.isValid) {
      errors.push(...scheduleValidation.errors);
    }
    
    return errors;
  };

  const handleSave = async () => {
    try {
      clearError();
      setSuccessMessage(null);
      
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        Alert.alert('Validation Error', validationErrors.join('\n'));
        return;
      }
      
      setLoading(true);
      
      // Build schedule
      const schedule: WeeklySchedule = {};
      selectedDays.forEach(day => {
        const slots = daySchedules[day] || [];
        // Add recurring pattern to slots
        schedule[day] = slots.map(slot => ({
          ...slot,
          isRecurring: true,
          recurringPattern: {
            type: recurringPattern,
            interval: 1,
          } as RecurringPattern
        }));
      });
      
      const doctorData: Omit<Doctor, 'id'> = {
        name: doctorName.trim(),
        specializations: selectedSpecializations,
        languages: selectedLanguages,
        experienceYears: parseInt(experienceYears),
        rating: currentDoctor?.rating || 0,
        schedule,
      };
      
      if (isEditing && currentDoctor) {
        // Update existing doctor
        const updatedDoctor: Doctor = {
          ...currentDoctor,
          ...doctorData,
        };
        await updateDoctor(updatedDoctor);
        setSuccessMessage('Doctor profile updated successfully!');
      } else {
        // Create new doctor
        const newDoctor = await addDoctor(doctorData);
        setCurrentDoctor(newDoctor);
        setIsEditing(true);
        setSuccessMessage('Doctor profile created successfully!');
      }
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (error) {
      console.error('Error saving doctor profile:', error);
      // Error is handled by the context
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Form',
      'Are you sure you want to reset all changes?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            if (currentDoctor) {
              loadDoctorProfile(currentDoctor);
            } else {
              // Reset to initial state
              setDoctorName(state.currentUser?.name || '');
              setSelectedSpecializations([]);
              setSelectedLanguages(['English']);
              setExperienceYears('');
              setSelectedDays([]);
              setDaySchedules({});
              setRecurringPattern('weekly');
            }
            setSuccessMessage(null);
            clearError();
          }
        }
      ]
    );
  };

  if (state.loading || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner message="Saving doctor profile..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>
            {isEditing ? 'Update Your Profile' : 'Create Your Profile'}
          </Text>
          <Text style={styles.subtitle}>
            Configure your professional information and availability
          </Text>

          {state.error && (
            <ErrorMessage 
              message={state.error.message} 
              onRetry={state.error.retryAction || clearError}
            />
          )}

          {successMessage && (
            <SuccessMessage 
              message={successMessage} 
              visible={!!successMessage}
              onHide={() => setSuccessMessage(null)}
            />
          )}

          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <FormInput
              label="Full Name"
              value={doctorName}
              onChangeText={setDoctorName}
              placeholder="Enter your full name"
              required
            />
            
            <FormInput
              label="Years of Experience"
              value={experienceYears}
              onChangeText={setExperienceYears}
              placeholder="Enter years of experience"
              keyboardType="numeric"
              required
            />
          </View>

          {/* Specializations */}
          <View style={styles.section}>
            <SpecializationSelector
              selectedSpecializations={selectedSpecializations}
              onSpecializationsChange={setSelectedSpecializations}
              maxSelections={5}
            />
          </View>

          {/* Languages */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Languages Spoken</Text>
            <View style={styles.languagesGrid}>
              {LANGUAGES.slice(0, 10).map((language) => (
                <TouchableOpacity
                  key={language}
                  style={[
                    styles.languageButton,
                    selectedLanguages.includes(language) && styles.selectedLanguageButton
                  ]}
                  onPress={() => handleLanguageToggle(language)}
                >
                  <Text
                    style={[
                      styles.languageText,
                      selectedLanguages.includes(language) && styles.selectedLanguageText
                    ]}
                  >
                    {language}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Schedule Configuration */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Weekly Schedule</Text>
            
            {/* Recurring Pattern Selection */}
            <View style={styles.recurringPatternContainer}>
              <Text style={styles.recurringPatternTitle}>Recurring Pattern:</Text>
              <View style={styles.recurringPatternButtons}>
                {RECURRING_PATTERNS.map((pattern) => (
                  <TouchableOpacity
                    key={pattern.value}
                    style={[
                      styles.recurringPatternButton,
                      recurringPattern === pattern.value && styles.selectedRecurringPatternButton
                    ]}
                    onPress={() => setRecurringPattern(pattern.value as any)}
                  >
                    <Text
                      style={[
                        styles.recurringPatternButtonText,
                        recurringPattern === pattern.value && styles.selectedRecurringPatternButtonText
                      ]}
                    >
                      {pattern.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <DayScheduleSelector
              selectedDays={selectedDays}
              onDaysChange={setSelectedDays}
              daySchedules={daySchedules}
              onDayScheduleChange={(day, timeSlots) => {
                setDaySchedules(prev => ({
                  ...prev,
                  [day]: timeSlots
                }));
              }}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleReset}
            >
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {isEditing ? 'Update Profile' : 'Create Profile'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  languagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
  },
  selectedLanguageButton: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  languageText: {
    fontSize: 14,
    color: '#374151',
  },
  selectedLanguageText: {
    color: 'white',
  },
  recurringPatternContainer: {
    marginBottom: 16,
  },
  recurringPatternTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  recurringPatternButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  recurringPatternButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
    alignItems: 'center',
  },
  selectedRecurringPatternButton: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  recurringPatternButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  selectedRecurringPatternButtonText: {
    color: 'white',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 32,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  saveButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default ScheduleManagementScreen;