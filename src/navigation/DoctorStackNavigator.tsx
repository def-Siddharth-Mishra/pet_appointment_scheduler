import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { DoctorStackParamList } from './types';

// Import doctor screens
import DoctorDashboardScreen from '../screens/doctor/DoctorDashboardScreen';
import ScheduleManagementScreen from '../screens/doctor/ScheduleManagementScreen';
import AppointmentsListScreen from '../screens/doctor/AppointmentsListScreen';
import AppointmentDetailsScreen from '../screens/doctor/AppointmentDetailsScreen';

const Stack = createStackNavigator<DoctorStackParamList>();

const DoctorStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="DoctorDashboard"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#4CAF50',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="DoctorDashboard"
        component={DoctorDashboardScreen}
        options={{
          title: 'Dashboard',
          headerLeft: () => null, // Prevent going back to user selection
        }}
      />
      <Stack.Screen
        name="ScheduleManagement"
        component={ScheduleManagementScreen}
        options={{
          title: 'Manage Schedule',
        }}
      />
      <Stack.Screen
        name="AppointmentsList"
        component={AppointmentsListScreen}
        options={{
          title: 'My Appointments',
        }}
      />
      <Stack.Screen
        name="AppointmentDetails"
        component={AppointmentDetailsScreen}
        options={{
          title: 'Appointment Details',
        }}
      />
    </Stack.Navigator>
  );
};

export default DoctorStackNavigator;