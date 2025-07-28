import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  FlatList,
  SectionList,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ListRenderItem,
  SectionListRenderItem,
} from 'react-native';
import { AppointmentCard } from './AppointmentCard';
import { LoadingSpinner } from './LoadingSpinner';
import { Appointment, Doctor, PetOwner } from '../../types';
import { DateTimeUtils } from '../../utils/dateTimeUtils';

interface AppointmentSection {
  title: string;
  data: Appointment[];
}

interface LazyAppointmentListProps {
  appointments: Appointment[];
  doctors?: Doctor[];
  petOwners?: PetOwner[];
  userType: 'doctor' | 'petOwner';
  onAppointmentPress: (appointment: Appointment) => void;
  onCancel?: (appointment: Appointment) => void;
  onReschedule?: (appointment: Appointment) => void;
  onRefresh?: () => Promise<void>;
  groupBy?: 'date' | 'pet' | 'none';
  pageSize?: number;
  enableVirtualization?: boolean;
  showActions?: boolean;
}

const LazyAppointmentList: React.FC<LazyAppointmentListProps> = ({
  appointments,
  doctors = [],
  petOwners = [],
  userType,
  onAppointmentPress,
  onCancel,
  onReschedule,
  onRefresh,
  groupBy = 'date',
  pageSize = 20,
  enableVirtualization = true,
  showActions = true,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loadedCount, setLoadedCount] = useState(pageSize);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const sectionListRef = useRef<SectionList>(null);

  // Create lookup maps for better performance
  const doctorMap = useMemo(() => {
    const map = new Map<string, Doctor>();
    doctors.forEach(doctor => map.set(doctor.id, doctor));
    return map;
  }, [doctors]);

  const petOwnerMap = useMemo(() => {
    const map = new Map<string, PetOwner>();
    petOwners.forEach(petOwner => map.set(petOwner.id, petOwner));
    return map;
  }, [petOwners]);

  // Paginated appointments for lazy loading
  const paginatedAppointments = useMemo(() => {
    return appointments.slice(0, loadedCount);
  }, [appointments, loadedCount]);

  // Group appointments based on groupBy prop
  const groupedData = useMemo(() => {
    if (groupBy === 'none') {
      return paginatedAppointments;
    }

    if (groupBy === 'date') {
      const grouped = paginatedAppointments.reduce((acc, appointment) => {
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
      return Object.keys(grouped)
        .sort((a, b) => {
          const dateA = new Date(grouped[a][0].dateTime);
          const dateB = new Date(grouped[b][0].dateTime);
          return dateA.getTime() - dateB.getTime();
        })
        .map(dateKey => ({
          title: dateKey,
          data: grouped[dateKey],
        }));
    }

    if (groupBy === 'pet') {
      const grouped = paginatedAppointments.reduce((acc, appointment) => {
        const petName = appointment.petInfo.name;
        if (!acc[petName]) {
          acc[petName] = [];
        }
        acc[petName].push(appointment);
        return acc;
      }, {} as Record<string, Appointment[]>);

      // Sort appointments within each pet group by date
      Object.keys(grouped).forEach(petName => {
        grouped[petName].sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
      });

      return Object.keys(grouped)
        .sort()
        .map(petName => ({
          title: petName,
          data: grouped[petName],
        }));
    }

    return paginatedAppointments;
  }, [paginatedAppointments, groupBy]);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    
    setRefreshing(true);
    try {
      await onRefresh();
      setLoadedCount(pageSize); // Reset to initial page size
    } catch (error) {
      console.error('Error refreshing appointments:', error);
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh, pageSize]);

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || loadedCount >= appointments.length) return;

    setIsLoadingMore(true);
    // Simulate async loading with setTimeout to prevent blocking
    setTimeout(() => {
      setLoadedCount(prev => Math.min(prev + pageSize, appointments.length));
      setIsLoadingMore(false);
    }, 100);
  }, [isLoadingMore, loadedCount, appointments.length, pageSize]);

  const getItemLayout = useCallback((data: any, index: number) => {
    const ITEM_HEIGHT = 120; // Approximate height of AppointmentCard
    return {
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    };
  }, []);

  const keyExtractor = useCallback((item: Appointment) => item.id, []);

  const renderAppointmentItem: ListRenderItem<Appointment> = useCallback(({ item }) => {
    const doctor = doctorMap.get(item.doctorId);
    const petOwner = petOwnerMap.get(item.petOwnerId);

    return (
      <AppointmentCard
        appointment={item}
        doctor={userType === 'petOwner' ? doctor : undefined}
        petOwner={userType === 'doctor' ? petOwner : undefined}
        userType={userType}
        onPress={() => onAppointmentPress(item)}
        onCancel={onCancel ? () => onCancel(item) : undefined}
        onReschedule={onReschedule ? () => onReschedule(item) : undefined}
        showActions={showActions && item.status === 'scheduled' && !DateTimeUtils.isInPast(item.dateTime)}
      />
    );
  }, [doctorMap, petOwnerMap, userType, onAppointmentPress, onCancel, onReschedule, showActions]);

  const renderSectionItem: SectionListRenderItem<Appointment, AppointmentSection> = useCallback(({ item }) => {
    return renderAppointmentItem({ item, index: 0, separators: {} as any });
  }, [renderAppointmentItem]);

  const renderSectionHeader = useCallback(({ section }: { section: AppointmentSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
      <Text style={styles.sectionHeaderCount}>
        {section.data.length} appointment{section.data.length !== 1 ? 's' : ''}
      </Text>
    </View>
  ), []);

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.loadingText}>Loading more appointments...</Text>
      </View>
    );
  }, [isLoadingMore]);

  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>No Appointments</Text>
      <Text style={styles.emptyStateText}>
        Your appointments will appear here when available.
      </Text>
    </View>
  ), []);

  if (appointments.length === 0) {
    return renderEmptyState();
  }

  // Render as SectionList if grouping is enabled
  if (groupBy !== 'none' && Array.isArray(groupedData)) {
    return (
      <SectionList
        ref={sectionListRef}
        sections={groupedData as AppointmentSection[]}
        keyExtractor={keyExtractor}
        renderItem={renderSectionItem}
        renderSectionHeader={renderSectionHeader}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#007AFF']}
              tintColor="#007AFF"
            />
          ) : undefined
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={enableVirtualization}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={pageSize}
        getItemLayout={enableVirtualization ? getItemLayout : undefined}
      />
    );
  }

  // Render as FlatList for simple list
  return (
    <FlatList
      ref={flatListRef}
      data={groupedData as Appointment[]}
      keyExtractor={keyExtractor}
      renderItem={renderAppointmentItem}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        ) : undefined
      }
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmptyState}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews={enableVirtualization}
      maxToRenderPerBatch={10}
      windowSize={10}
      initialNumToRender={pageSize}
      getItemLayout={enableVirtualization ? getItemLayout : undefined}
    />
  );
};

const styles = StyleSheet.create({
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
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  sectionHeaderCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default LazyAppointmentList;