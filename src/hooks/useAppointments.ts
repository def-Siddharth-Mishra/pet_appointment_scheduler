import { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Appointment } from '../types';

export const useAppointments = () => {
  const { state, bookAppointment, cancelAppointment, rescheduleAppointment } = useAppContext();

  // Memoized selectors for better performance
  const appointmentsByDoctor = useMemo(() => {
    return (doctorId: string): Appointment[] => {
      return state.appointments.filter(
        appointment => appointment.doctorId === doctorId && appointment.status !== 'cancelled'
      );
    };
  }, [state.appointments]);

  const appointmentsByPetOwner = useMemo(() => {
    return (petOwnerId: string): Appointment[] => {
      return state.appointments.filter(
        appointment => appointment.petOwnerId === petOwnerId && appointment.status !== 'cancelled'
      );
    };
  }, [state.appointments]);

  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    return state.appointments.filter(
      appointment => 
        appointment.dateTime > now && 
        appointment.status === 'scheduled'
    ).sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
  }, [state.appointments]);

  const pastAppointments = useMemo(() => {
    const now = new Date();
    return state.appointments.filter(
      appointment => 
        appointment.dateTime <= now || 
        appointment.status === 'completed'
    ).sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime());
  }, [state.appointments]);

  const getAppointmentById = useMemo(() => {
    return (appointmentId: string): Appointment | undefined => {
      return state.appointments.find(appointment => appointment.id === appointmentId);
    };
  }, [state.appointments]);

  return {
    appointments: state.appointments,
    appointmentsByDoctor,
    appointmentsByPetOwner,
    upcomingAppointments,
    pastAppointments,
    getAppointmentById,
    bookAppointment,
    cancelAppointment,
    rescheduleAppointment,
    isBookingInProgress: state.bookingInProgress,
  };
};