import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
} from 'react-native';
import type { PetOwnerStackNavigationProp, PetOwnerStackRouteProp } from '../../navigation/types';
import { SPECIALIZATIONS } from '../../utils/constants';
import { SpecializationSelector } from '../../components/shared';

interface Props {
  navigation: PetOwnerStackNavigationProp<'BookingReason'>;
  route: PetOwnerStackRouteProp<'BookingReason'>;
}

const BookingReasonScreen: React.FC<Props> = ({ navigation, route }) => {
  const { doctorId } = route.params;
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);

  const handleSpecializationSelect = (specialization: string) => {
    setSelectedSpecialization(specialization);
    setShowCustomInput(false);
    setCustomReason('');
  };

  const handleCustomReasonSelect = () => {
    setSelectedSpecialization('');
    setShowCustomInput(true);
  };

  const handleContinue = () => {
    const reason = showCustomInput ? customReason.trim() : selectedSpecialization;
    
    if (!reason) {
      return;
    }

    navigation.navigate('BookingDetails', {
      doctorId,
      reason,
    });
  };

  const canContinue = showCustomInput ? customReason.trim().length > 0 : selectedSpecialization.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>What's the reason for your visit?</Text>
          <Text style={styles.subtitle}>
            Select the type of care your pet needs or describe the issue
          </Text>
        </View>

        {/* Specialization Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Common Reasons</Text>
          <View style={styles.reasonsGrid}>
            {SPECIALIZATIONS.map((specialization) => {
              const isSelected = selectedSpecialization === specialization;
              
              return (
                <TouchableOpacity
                  key={specialization}
                  style={[
                    styles.reasonButton,
                    isSelected && styles.selectedReasonButton,
                  ]}
                  onPress={() => handleSpecializationSelect(specialization)}
                >
                  <Text style={[
                    styles.reasonButtonText,
                    isSelected && styles.selectedReasonButtonText,
                  ]}>
                    {specialization}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Custom Reason Option */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[
              styles.customReasonButton,
              showCustomInput && styles.selectedCustomReasonButton,
            ]}
            onPress={handleCustomReasonSelect}
          >
            <Text style={[
              styles.customReasonButtonText,
              showCustomInput && styles.selectedCustomReasonButtonText,
            ]}>
              Other - Describe your pet's condition
            </Text>
          </TouchableOpacity>

          {showCustomInput && (
            <View style={styles.customInputContainer}>
              <TextInput
                style={styles.customInput}
                placeholder="Please describe your pet's condition or the reason for the visit..."
                value={customReason}
                onChangeText={setCustomReason}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={200}
              />
              <Text style={styles.characterCount}>
                {customReason.length}/200 characters
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !canContinue && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!canContinue}
        >
          <Text style={[
            styles.continueButtonText,
            !canContinue && styles.continueButtonTextDisabled,
          ]}>
            Continue
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
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
  reasonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reasonButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  selectedReasonButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  reasonButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  selectedReasonButtonText: {
    color: '#fff',
  },
  customReasonButton: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2196F3',
    backgroundColor: '#fff',
    borderStyle: 'dashed',
  },
  selectedCustomReasonButton: {
    backgroundColor: '#E3F2FD',
    borderStyle: 'solid',
  },
  customReasonButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2196F3',
    textAlign: 'center',
  },
  selectedCustomReasonButtonText: {
    color: '#1976D2',
  },
  customInputContainer: {
    marginTop: 16,
  },
  customInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
    minHeight: 100,
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButtonTextDisabled: {
    color: '#999',
  },
});

export default BookingReasonScreen;