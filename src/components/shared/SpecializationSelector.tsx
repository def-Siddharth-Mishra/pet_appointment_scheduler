import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SPECIALIZATIONS, Specialization } from '../../utils/constants';

interface SpecializationSelectorProps {
  selectedSpecializations: string[];
  onSpecializationsChange: (specializations: string[]) => void;
  maxSelections?: number;
}

export const SpecializationSelector: React.FC<SpecializationSelectorProps> = ({
  selectedSpecializations,
  onSpecializationsChange,
  maxSelections = 5,
}) => {
  const toggleSpecialization = (specialization: Specialization) => {
    if (selectedSpecializations.includes(specialization)) {
      // Remove specialization
      onSpecializationsChange(
        selectedSpecializations.filter(s => s !== specialization)
      );
    } else {
      // Add specialization if under limit
      if (selectedSpecializations.length < maxSelections) {
        onSpecializationsChange([...selectedSpecializations, specialization]);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Select Your Specializations ({selectedSpecializations.length}/{maxSelections})
      </Text>
      <Text style={styles.subtitle}>
        Choose the medical areas you specialize in
      </Text>
      
      <ScrollView style={styles.specializationsContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.specializationsGrid}>
          {SPECIALIZATIONS.map((specialization) => {
            const isSelected = selectedSpecializations.includes(specialization);
            const canSelect = selectedSpecializations.length < maxSelections || isSelected;

            return (
              <TouchableOpacity
                key={specialization}
                style={[
                  styles.specializationButton,
                  isSelected && styles.selectedSpecializationButton,
                  !canSelect && styles.disabledSpecializationButton,
                ]}
                onPress={() => toggleSpecialization(specialization)}
                disabled={!canSelect}
              >
                <Text
                  style={[
                    styles.specializationText,
                    isSelected && styles.selectedSpecializationText,
                    !canSelect && styles.disabledSpecializationText,
                  ]}
                >
                  {specialization}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {selectedSpecializations.length > 0 && (
        <View style={styles.selectedContainer}>
          <Text style={styles.selectedTitle}>Selected Specializations:</Text>
          <View style={styles.selectedList}>
            {selectedSpecializations.map((specialization, index) => (
              <View key={specialization} style={styles.selectedItem}>
                <Text style={styles.selectedItemText}>
                  {index + 1}. {specialization}
                </Text>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => toggleSpecialization(specialization as Specialization)}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  specializationsContainer: {
    maxHeight: 300,
  },
  specializationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specializationButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
    marginBottom: 8,
  },
  selectedSpecializationButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  disabledSpecializationButton: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    opacity: 0.6,
  },
  specializationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  selectedSpecializationText: {
    color: 'white',
  },
  disabledSpecializationText: {
    color: '#9CA3AF',
  },
  selectedContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  selectedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0369A1',
    marginBottom: 8,
  },
  selectedList: {
    gap: 4,
  },
  selectedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  selectedItemText: {
    fontSize: 14,
    color: '#0369A1',
    flex: 1,
  },
  removeButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});