import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';

export interface DoctorFilterOptions {
  specialization?: string;
  minRating?: number;
  minExperience?: number;
  language?: string;
  sortBy?: 'rating' | 'experience' | 'availability' | 'name';
  sortOrder?: 'asc' | 'desc';
}

interface DoctorFiltersProps {
  filters: DoctorFilterOptions;
  onFiltersChange: (filters: DoctorFilterOptions) => void;
  availableSpecializations: string[];
  availableLanguages: string[];
}

export const DoctorFilters: React.FC<DoctorFiltersProps> = ({
  filters,
  onFiltersChange,
  availableSpecializations,
  availableLanguages,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [tempFilters, setTempFilters] = useState<DoctorFilterOptions>(filters);

  const handleApplyFilters = () => {
    onFiltersChange(tempFilters);
    setIsModalVisible(false);
  };

  const handleClearFilters = () => {
    const clearedFilters: DoctorFilterOptions = {
      sortBy: 'rating',
      sortOrder: 'desc',
    };
    setTempFilters(clearedFilters);
    onFiltersChange(clearedFilters);
    setIsModalVisible(false);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.specialization) count++;
    if (filters.minRating && filters.minRating > 0) count++;
    if (filters.minExperience && filters.minExperience > 0) count++;
    if (filters.language) count++;
    return count;
  };

  const renderSpecializationOptions = () => (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>Specialization</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            !tempFilters.specialization && styles.filterChipActive,
          ]}
          onPress={() => setTempFilters({ ...tempFilters, specialization: undefined })}
        >
          <Text style={[
            styles.filterChipText,
            !tempFilters.specialization && styles.filterChipTextActive,
          ]}>
            All
          </Text>
        </TouchableOpacity>
        {availableSpecializations.map((spec) => (
          <TouchableOpacity
            key={spec}
            style={[
              styles.filterChip,
              tempFilters.specialization === spec && styles.filterChipActive,
            ]}
            onPress={() => setTempFilters({ 
              ...tempFilters, 
              specialization: tempFilters.specialization === spec ? undefined : spec 
            })}
          >
            <Text style={[
              styles.filterChipText,
              tempFilters.specialization === spec && styles.filterChipTextActive,
            ]}>
              {spec}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderRatingFilter = () => (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>Minimum Rating</Text>
      <View style={styles.ratingContainer}>
        {[0, 3, 4, 4.5].map((rating) => (
          <TouchableOpacity
            key={rating}
            style={[
              styles.ratingChip,
              tempFilters.minRating === rating && styles.filterChipActive,
            ]}
            onPress={() => setTempFilters({ 
              ...tempFilters, 
              minRating: tempFilters.minRating === rating ? undefined : rating 
            })}
          >
            <Text style={[
              styles.filterChipText,
              tempFilters.minRating === rating && styles.filterChipTextActive,
            ]}>
              {rating === 0 ? 'Any' : `${rating}+ ★`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderExperienceFilter = () => (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>Minimum Experience</Text>
      <View style={styles.ratingContainer}>
        {[0, 2, 5, 10].map((years) => (
          <TouchableOpacity
            key={years}
            style={[
              styles.ratingChip,
              tempFilters.minExperience === years && styles.filterChipActive,
            ]}
            onPress={() => setTempFilters({ 
              ...tempFilters, 
              minExperience: tempFilters.minExperience === years ? undefined : years 
            })}
          >
            <Text style={[
              styles.filterChipText,
              tempFilters.minExperience === years && styles.filterChipTextActive,
            ]}>
              {years === 0 ? 'Any' : `${years}+ years`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderLanguageFilter = () => (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>Language</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            !tempFilters.language && styles.filterChipActive,
          ]}
          onPress={() => setTempFilters({ ...tempFilters, language: undefined })}
        >
          <Text style={[
            styles.filterChipText,
            !tempFilters.language && styles.filterChipTextActive,
          ]}>
            Any
          </Text>
        </TouchableOpacity>
        {availableLanguages.map((lang) => (
          <TouchableOpacity
            key={lang}
            style={[
              styles.filterChip,
              tempFilters.language === lang && styles.filterChipActive,
            ]}
            onPress={() => setTempFilters({ 
              ...tempFilters, 
              language: tempFilters.language === lang ? undefined : lang 
            })}
          >
            <Text style={[
              styles.filterChipText,
              tempFilters.language === lang && styles.filterChipTextActive,
            ]}>
              {lang}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderSortOptions = () => (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>Sort By</Text>
      <View style={styles.sortContainer}>
        {[
          { key: 'rating', label: 'Rating' },
          { key: 'experience', label: 'Experience' },
          { key: 'availability', label: 'Availability' },
          { key: 'name', label: 'Name' },
        ].map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.sortChip,
              tempFilters.sortBy === option.key && styles.filterChipActive,
            ]}
            onPress={() => setTempFilters({ 
              ...tempFilters, 
              sortBy: option.key as any,
              sortOrder: option.key === 'name' ? 'asc' : 'desc',
            })}
          >
            <Text style={[
              styles.filterChipText,
              tempFilters.sortBy === option.key && styles.filterChipTextActive,
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <>
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setIsModalVisible(true)}
      >
        <Text style={styles.filterButtonText}>
          Filters {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Filter Doctors</Text>
            <TouchableOpacity onPress={handleClearFilters}>
              <Text style={styles.clearButton}>Clear</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {renderSpecializationOptions()}
            {renderRatingFilter()}
            {renderExperienceFilter()}
            {renderLanguageFilter()}
            {renderSortOptions()}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApplyFilters}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  filterButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  clearButton: {
    fontSize: 16,
    color: '#F44336',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  filterSection: {
    marginVertical: 16,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  filterChip: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipActive: {
    backgroundColor: '#2196F3',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  ratingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  ratingChip: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  sortContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sortChip: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  applyButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});