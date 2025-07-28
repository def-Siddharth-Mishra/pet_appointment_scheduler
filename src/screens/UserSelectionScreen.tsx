import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import type { RootStackNavigationProp } from '../navigation/types';

interface Props {
  navigation: RootStackNavigationProp<'UserSelection'>;
}

const UserSelectionScreen: React.FC<Props> = ({ navigation }) => {
  const handleDoctorSelection = () => {
    navigation.navigate('DoctorFlow', { screen: 'DoctorDashboard' });
  };

  const handlePetOwnerSelection = () => {
    navigation.navigate('PetOwnerFlow', { screen: 'DoctorDirectory' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Pet Appointment Scheduler</Text>
        <Text style={styles.subtitle}>Choose your role to continue</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.doctorButton]}
            onPress={handleDoctorSelection}
            testID="doctor-selection-button"
          >
            <Text style={styles.buttonText}>I'm a Doctor</Text>
            <Text style={styles.buttonSubtext}>
              Manage schedules and appointments
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.petOwnerButton]}
            onPress={handlePetOwnerSelection}
            testID="pet-owner-selection-button"
          >
            <Text style={styles.buttonText}>I'm a Pet Owner</Text>
            <Text style={styles.buttonSubtext}>
              Book appointments for my pet
            </Text>
          </TouchableOpacity>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  button: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  doctorButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  petOwnerButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  buttonSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default UserSelectionScreen;