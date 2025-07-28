import type { NavigatorScreenParams } from '@react-navigation/native';

// Root navigation structure
export type RootStackParamList = {
  UserSelection: undefined;
  DoctorFlow: NavigatorScreenParams<DoctorStackParamList>;
  PetOwnerFlow: NavigatorScreenParams<PetOwnerStackParamList>;
};

// Doctor flow navigation
export type DoctorStackParamList = {
  DoctorDashboard: undefined;
  ScheduleManagement: undefined;
  AppointmentsList: undefined;
  AppointmentDetails: { appointmentId: string };
};

// Pet Owner flow navigation
export type PetOwnerStackParamList = {
  DoctorDirectory: undefined;
  DoctorProfile: { doctorId: string };
  BookingFlow: undefined;
  DoctorSelection: { reason: string };
  BookingReason: { doctorId: string };
  BookingDetails: { doctorId: string; reason: string };
  MyAppointments: undefined;
  AppointmentDetails: { appointmentId: string };
};

// Navigation prop types for type safety
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';

export type RootStackNavigationProp<T extends keyof RootStackParamList> = 
  StackNavigationProp<RootStackParamList, T>;

export type DoctorStackNavigationProp<T extends keyof DoctorStackParamList> = 
  StackNavigationProp<DoctorStackParamList, T>;

export type PetOwnerStackNavigationProp<T extends keyof PetOwnerStackParamList> = 
  StackNavigationProp<PetOwnerStackParamList, T>;

export type RootStackRouteProp<T extends keyof RootStackParamList> = 
  RouteProp<RootStackParamList, T>;

export type DoctorStackRouteProp<T extends keyof DoctorStackParamList> = 
  RouteProp<DoctorStackParamList, T>;

export type PetOwnerStackRouteProp<T extends keyof PetOwnerStackParamList> = 
  RouteProp<PetOwnerStackParamList, T>;