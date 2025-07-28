import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { PetOwnerStackParamList } from './types';

// Import pet owner screens
import DoctorDirectoryScreen from '../screens/petOwner/DoctorDirectoryScreen';
import DoctorProfileScreen from '../screens/petOwner/DoctorProfileScreen';
import BookingFlowScreen from '../screens/petOwner/BookingFlowScreen';
import DoctorSelectionScreen from '../screens/petOwner/DoctorSelectionScreen';
import BookingReasonScreen from '../screens/petOwner/BookingReasonScreen';
import BookingDetailsScreen from '../screens/petOwner/BookingDetailsScreen';
import MyAppointmentsScreen from '../screens/petOwner/MyAppointmentsScreen';

const Stack = createStackNavigator<PetOwnerStackParamList>();

const PetOwnerStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="DoctorDirectory"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2196F3',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="DoctorDirectory"
        component={DoctorDirectoryScreen}
        options={{
          title: 'Find a Doctor',
          headerLeft: () => null, // Prevent going back to user selection
        }}
      />
      <Stack.Screen
        name="DoctorProfile"
        component={DoctorProfileScreen}
        options={{
          title: 'Doctor Profile',
        }}
      />
      <Stack.Screen
        name="BookingFlow"
        component={BookingFlowScreen}
        options={{
          title: 'Book Appointment',
        }}
      />
      <Stack.Screen
        name="DoctorSelection"
        component={DoctorSelectionScreen}
        options={{
          title: 'Select Doctor',
        }}
      />
      <Stack.Screen
        name="BookingReason"
        component={BookingReasonScreen}
        options={{
          title: 'Reason for Visit',
        }}
      />
      <Stack.Screen
        name="BookingDetails"
        component={BookingDetailsScreen}
        options={{
          title: 'Book Appointment',
        }}
      />
      <Stack.Screen
        name="MyAppointments"
        component={MyAppointmentsScreen}
        options={{
          title: 'My Appointments',
        }}
      />
      {/* AppointmentDetails screen will be added in future tasks */}
    </Stack.Navigator>
  );
};

export default PetOwnerStackNavigator;