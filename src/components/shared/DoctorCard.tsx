import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Doctor } from '../../types';

interface DoctorCardProps {
  doctor: Doctor;
  onPress: () => void;
  showAvailability?: boolean;
  availableSlots?: number;
  highlightSpecialization?: string;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({
  doctor,
  onPress,
  showAvailability = false,
  availableSlots = 0,
  highlightSpecialization,
}) => {
  const renderRating = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push('★');
    }
    if (hasHalfStar) {
      stars.push('☆');
    }
    while (stars.length < 5) {
      stars.push('☆');
    }
    
    return stars.join('');
  };

  const getExperienceText = (years: number) => {
    if (years === 1) return '1 year';
    return `${years} years`;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.name}>{doctor.name}</Text>
        <View style={styles.ratingContainer}>
          <Text style={styles.stars}>{renderRating(doctor.rating)}</Text>
          <Text style={styles.ratingText}>{doctor.rating.toFixed(1)}</Text>
        </View>
      </View>
      
      <View style={styles.specializations}>
        {doctor.specializations.map((spec, index) => {
          const isHighlighted = highlightSpecialization && (
            spec.toLowerCase().includes(highlightSpecialization.toLowerCase()) ||
            highlightSpecialization.toLowerCase().includes(spec.toLowerCase())
          );
          
          return (
            <View 
              key={index} 
              style={[
                styles.specializationTag,
                isHighlighted && styles.highlightedSpecializationTag
              ]}
            >
              <Text style={[
                styles.specializationText,
                isHighlighted && styles.highlightedSpecializationText
              ]}>
                {spec}
              </Text>
            </View>
          );
        })}
      </View>
      
      <View style={styles.details}>
        <Text style={styles.experience}>
          {getExperienceText(doctor.experienceYears)} experience
        </Text>
        
        {doctor.languages.length > 0 && (
          <Text style={styles.languages}>
            Languages: {doctor.languages.join(', ')}
          </Text>
        )}
        
        {showAvailability && (
          <Text style={styles.availability}>
            {availableSlots > 0 
              ? `${availableSlots} available slots` 
              : 'No available slots'
            }
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    fontSize: 16,
    color: '#FFD700',
    marginRight: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  specializations: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  specializationTag: {
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  highlightedSpecializationTag: {
    backgroundColor: '#4CAF50',
  },
  specializationText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  highlightedSpecializationText: {
    color: '#fff',
  },
  details: {
    gap: 4,
  },
  experience: {
    fontSize: 14,
    color: '#666',
  },
  languages: {
    fontSize: 14,
    color: '#666',
  },
  availability: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
});