import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import type { DoctorStackNavigationProp } from '../../navigation/types';
import { useAppContext } from '../../context/AppContext';
import { initializeSampleData } from '../../utils/sampleData';

interface Props {
  navigation: DoctorStackNavigationProp<'DoctorDashboard'>;
}

const DoctorDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { state, loadAllData } = useAppContext();
  const [initializingData, setInitializingData] = useState(false);

  const handleInitializeSampleData = async () => {
    Alert.alert(
      'Initialize Sample Data',
      'This will clear all existing data and add sample doctors, pet owners, and appointments. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Initialize',
          style: 'destructive',
          onPress: async () => {
            setInitializingData(true);
            try {
              await initializeSampleData();
              await loadAllData();
              Alert.alert('Success', 'Sample data initialized successfully!');
            } catch (error) {
              console.error('Error initializing sample data:', error);
              Alert.alert('Error', 'Failed to initialize sample data. Please try again.');
            } finally {
              setInitializingData(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Doctor Dashboard</Text>
        <Text style={styles.subtitle}>Welcome, Doctor!</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('ScheduleManagement')}
          >
            <Text style={styles.buttonText}>Manage Schedule</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('AppointmentsList')}
          >
            <Text style={styles.buttonText}>My Appointments</Text>
          </TouchableOpacity>

          {/* Development helper - only show if no appointments exist */}
          {state.appointments.length === 0 && (
            <TouchableOpacity
              style={[styles.button, styles.sampleDataButton]}
              onPress={handleInitializeSampleData}
              disabled={initializingData}
            >
              <Text style={styles.buttonText}>
                {initializingData ? 'Initializing...' : 'Add Sample Data'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  sampleDataButton: {
    backgroundColor: '#FF9500',
  },
});

export default DoctorDashboardScreen;