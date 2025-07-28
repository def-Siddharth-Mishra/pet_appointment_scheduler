import { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Doctor } from '../types';

export const useDoctors = () => {
  const { state, addDoctor, updateDoctor, removeDoctor } = useAppContext();

  // Memoized selectors for better performance
  const doctorsBySpecialization = useMemo(() => {
    return (specialization: string): Doctor[] => {
      return state.doctors.filter(doctor =>
        doctor.specializations.some(spec => 
          spec.toLowerCase().includes(specialization.toLowerCase())
        )
      );
    };
  }, [state.doctors]);

  const availableDoctors = useMemo(() => {
    // Doctors who have future availability (simplified - would need schedule checking in real implementation)
    return state.doctors.filter(doctor => doctor.schedule && Object.keys(doctor.schedule).length > 0);
  }, [state.doctors]);

  const topRatedDoctors = useMemo(() => {
    return [...state.doctors]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 10);
  }, [state.doctors]);

  const experiencedDoctors = useMemo(() => {
    return [...state.doctors]
      .sort((a, b) => b.experienceYears - a.experienceYears)
      .slice(0, 10);
  }, [state.doctors]);

  const getDoctorById = useMemo(() => {
    return (doctorId: string): Doctor | undefined => {
      return state.doctors.find(doctor => doctor.id === doctorId);
    };
  }, [state.doctors]);

  const searchDoctors = useMemo(() => {
    return (query: string): Doctor[] => {
      const lowercaseQuery = query.toLowerCase();
      return state.doctors.filter(doctor =>
        doctor.name.toLowerCase().includes(lowercaseQuery) ||
        doctor.specializations.some(spec => 
          spec.toLowerCase().includes(lowercaseQuery)
        ) ||
        doctor.languages.some(lang => 
          lang.toLowerCase().includes(lowercaseQuery)
        )
      );
    };
  }, [state.doctors]);

  const filterDoctors = useMemo(() => {
    return (filters: {
      specialization?: string;
      minRating?: number;
      minExperience?: number;
      language?: string;
    }): Doctor[] => {
      return state.doctors.filter(doctor => {
        if (filters.specialization && !doctor.specializations.some(spec => 
          spec.toLowerCase().includes(filters.specialization!.toLowerCase())
        )) {
          return false;
        }
        
        if (filters.minRating && doctor.rating < filters.minRating) {
          return false;
        }
        
        if (filters.minExperience && doctor.experienceYears < filters.minExperience) {
          return false;
        }
        
        if (filters.language && !doctor.languages.some(lang => 
          lang.toLowerCase().includes(filters.language!.toLowerCase())
        )) {
          return false;
        }
        
        return true;
      });
    };
  }, [state.doctors]);

  return {
    doctors: state.doctors,
    doctorsBySpecialization,
    availableDoctors,
    topRatedDoctors,
    experiencedDoctors,
    getDoctorById,
    searchDoctors,
    filterDoctors,
    addDoctor,
    updateDoctor,
    removeDoctor,
    isScheduleUpdateInProgress: state.scheduleUpdateInProgress,
  };
};