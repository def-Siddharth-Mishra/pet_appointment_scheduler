import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import type { PetOwnerStackNavigationProp } from '../../navigation/types';
import { useDoctors } from '../../hooks/useDoctors';
import { useLoadingState } from '../../hooks/useLoadingState';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import {
  LoadingSpinner,
  ErrorMessage,
  DoctorCard,
  DoctorFilters,
  type DoctorFilterOptions
} from '../../components/shared';
import { SafeErrorBoundary } from '../../components/shared/SafeErrorBoundary';
import { DoctorAvailabilityService } from '../../services/DoctorAvailabilityService';
import { Doctor } from '../../types';
import { safeExecuteAsync, isValidArray, safeFilter, safeSort, isValidString } from '../../utils/errorUtils';

interface Props {
  navigation: PetOwnerStackNavigationProp<'DoctorDirectory'>;
}

interface DoctorWithAvailability {
  doctor: Doctor;
  availableSlots: number;
}

const DoctorDirectoryScreen: React.FC<Props> = ({ navigation }) => {
  const { doctors = [] } = useDoctors() || {};
  const { isLoading = false } = useLoadingState() || {};
  const { currentError, handleError, dismissError } = useErrorHandler() || {};

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<DoctorFilterOptions>({
    sortBy: 'rating',
    sortOrder: 'desc',
  });
  const [doctorsWithAvailability, setDoctorsWithAvailability] = useState<DoctorWithAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const availabilityService = DoctorAvailabilityService.getInstance();

  useEffect(() => {
    loadDoctorsWithAvailability();
  }, [doctors]);

  const loadDoctorsWithAvailability = async () => {
    setLoading(true);
    
    const result = await safeExecuteAsync(async () => {
      if (availabilityService && isValidArray(doctors) && doctors.length > 0) {
        return await availabilityService.getDoctorsWithAvailability(doctors);
      }
      return [];
    }, []);
    
    setDoctorsWithAvailability(result);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDoctorsWithAvailability();
    setRefreshing(false);
  };

  const handleDoctorPress = (doctorId: string) => {
    try {
      if (doctorId && navigation) {
        navigation.navigate('DoctorProfile', { doctorId });
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  // Get unique specializations and languages for filters
  const availableSpecializations = useMemo(() => {
    const specs = new Set<string>();
    
    if (isValidArray(doctors)) {
      doctors.forEach(doctor => {
        if (doctor && isValidArray(doctor.specializations)) {
          doctor.specializations.forEach(spec => {
            if (isValidString(spec)) {
              specs.add(spec);
            }
          });
        }
      });
    }
    
    return Array.from(specs).sort();
  }, [doctors]);

  const availableLanguages = useMemo(() => {
    const langs = new Set<string>();
    
    if (isValidArray(doctors)) {
      doctors.forEach(doctor => {
        if (doctor && isValidArray(doctor.languages)) {
          doctor.languages.forEach(lang => {
            if (isValidString(lang)) {
              langs.add(lang);
            }
          });
        }
      });
    }
    
    return Array.from(langs).sort();
  }, [doctors]);

  // Filter and sort doctors
  const filteredAndSortedDoctors = useMemo(() => {
    let filtered = doctorsWithAvailability || [];

    // Apply search query
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(({ doctor }) => {
        if (!doctor) return false;
        
        const nameMatch = doctor.name && doctor.name.toLowerCase().includes(query);
        const specMatch = doctor.specializations && Array.isArray(doctor.specializations) && 
          doctor.specializations.some(spec => spec && spec.toLowerCase().includes(query));
        const langMatch = doctor.languages && Array.isArray(doctor.languages) && 
          doctor.languages.some(lang => lang && lang.toLowerCase().includes(query));
        
        return nameMatch || specMatch || langMatch;
      });
    }

    // Apply filters
    if (filters && filters.specialization) {
      filtered = filtered.filter(({ doctor }) => {
        if (!doctor || !doctor.specializations || !Array.isArray(doctor.specializations)) return false;
        return doctor.specializations.some(spec =>
          spec && spec.toLowerCase().includes(filters.specialization!.toLowerCase())
        );
      });
    }

    if (filters && filters.minRating && filters.minRating > 0) {
      filtered = filtered.filter(({ doctor }) => 
        doctor && typeof doctor.rating === 'number' && doctor.rating >= filters.minRating!
      );
    }

    if (filters && filters.minExperience && filters.minExperience > 0) {
      filtered = filtered.filter(({ doctor }) => 
        doctor && typeof doctor.experienceYears === 'number' && doctor.experienceYears >= filters.minExperience!
      );
    }

    if (filters && filters.language) {
      filtered = filtered.filter(({ doctor }) => {
        if (!doctor || !doctor.languages || !Array.isArray(doctor.languages)) return false;
        return doctor.languages.some(lang =>
          lang && lang.toLowerCase().includes(filters.language!.toLowerCase())
        );
      });
    }

    // Apply sorting
    if (filtered && Array.isArray(filtered)) {
      filtered.sort((a, b) => {
        if (!a || !b || !a.doctor || !b.doctor) return 0;
        
        let comparison = 0;
        const sortBy = filters?.sortBy || 'rating';

        switch (sortBy) {
          case 'rating':
            comparison = (b.doctor.rating || 0) - (a.doctor.rating || 0);
            break;
          case 'experience':
            comparison = (b.doctor.experienceYears || 0) - (a.doctor.experienceYears || 0);
            break;
          case 'availability':
            comparison = (b.availableSlots || 0) - (a.availableSlots || 0);
            break;
          case 'name':
            comparison = (a.doctor.name || '').localeCompare(b.doctor.name || '');
            break;
          default:
            comparison = (b.doctor.rating || 0) - (a.doctor.rating || 0);
        }

        return filters?.sortOrder === 'asc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [doctorsWithAvailability, searchQuery, filters]);

  const renderDoctorItem = ({ item }: { item: DoctorWithAvailability }) => (
    <DoctorCard
      doctor={item.doctor}
      onPress={() => handleDoctorPress(item.doctor.id)}
      showAvailability={true}
      availableSlots={item.availableSlots}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>
        {searchQuery.trim() || Object.keys(filters).some(key =>
          key !== 'sortBy' && key !== 'sortOrder' && filters[key as keyof DoctorFilterOptions]
        ) ? 'No doctors found' : 'No doctors available'}
      </Text>
      <Text style={styles.emptyStateText}>
        {searchQuery.trim() || Object.keys(filters).some(key =>
          key !== 'sortBy' && key !== 'sortOrder' && filters[key as keyof DoctorFilterOptions]
        )
          ? 'Try adjusting your search or filters'
          : 'Check back later for available doctors'
        }
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
    <SafeErrorBoundary>
      <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Find a Doctor</Text>
            <Text style={styles.subtitle}>
              {filteredAndSortedDoctors.length} doctor{filteredAndSortedDoctors.length !== 1 ? 's' : ''} available
            </Text>
          </View>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => {
              try {
                navigation.navigate('BookingFlow');
              } catch (error) {
                console.error('Navigation error:', error);
              }
            }}
          >
            <Text style={styles.bookButtonText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search doctors, specializations, or languages..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
      </View>

      {/* Filters */}
      <DoctorFilters
        filters={filters}
        onFiltersChange={setFilters}
        availableSpecializations={availableSpecializations}
        availableLanguages={availableLanguages}
      />

      {/* Doctor List */}
      <FlatList
        data={filteredAndSortedDoctors}
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
    </SafeErrorBoundary>
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
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
  bookButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
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

export default DoctorDirectoryScreen;