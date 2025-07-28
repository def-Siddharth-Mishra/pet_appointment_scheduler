import { useAppContext } from '../context/AppContext';

export const useLoadingState = () => {
  const { state } = useAppContext();

  return {
    isLoading: state.loading,
    isBookingInProgress: state.bookingInProgress,
    isScheduleUpdateInProgress: state.scheduleUpdateInProgress,
    isAnyOperationInProgress: state.loading || state.bookingInProgress || state.scheduleUpdateInProgress,
  };
};