import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import type { RootStackParamList } from './types';

// Import screens and navigators
import UserSelectionScreen from '../screens/UserSelectionScreen';
import DoctorStackNavigator from './DoctorStackNavigator';
import PetOwnerStackNavigator from './PetOwnerStackNavigator';

const Stack = createStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="UserSelection"
        screenOptions={{
          headerShown: false, // Hide header for nested navigators
        }}
      >
        <Stack.Screen
          name="UserSelection"
          component={UserSelectionScreen}
          options={{
            headerShown: true,
            title: 'Pet Appointment Scheduler',
            headerStyle: {
              backgroundColor: '#6200EE',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
        <Stack.Screen
          name="DoctorFlow"
          component={DoctorStackNavigator}
        />
        <Stack.Screen
          name="PetOwnerFlow"
          component={PetOwnerStackNavigator}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;