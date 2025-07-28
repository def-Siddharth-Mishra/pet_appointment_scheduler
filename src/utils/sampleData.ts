import { Doctor, Appointment, PetOwner, PetInfo } from '../types';

// Sample data for testing the appointments functionality
export const sampleDoctors: Omit<Doctor, 'id'>[] = [
  {
    name: 'Dr. Sarah Johnson',
    specializations: ['General', 'Dental'],
    schedule: {
      monday: [
        { startTime: '09:00', endTime: '12:00', isRecurring: true },
        { startTime: '14:00', endTime: '17:00', isRecurring: true },
      ],
      tuesday: [
        { startTime: '09:00', endTime: '12:00', isRecurring: true },
        { startTime: '14:00', endTime: '17:00', isRecurring: true },
      ],
      wednesday: [
        { startTime: '09:00', endTime: '12:00', isRecurring: true },
        { startTime: '14:00', endTime: '17:00', isRecurring: true },
      ],
      thursday: [
        { startTime: '09:00', endTime: '12:00', isRecurring: true },
        { startTime: '14:00', endTime: '17:00', isRecurring: true },
      ],
      friday: [
        { startTime: '09:00', endTime: '12:00', isRecurring: true },
        { startTime: '14:00', endTime: '16:00', isRecurring: true },
      ],
    },
    rating: 4.8,
    experienceYears: 12,
    languages: ['English', 'Spanish'],
  },
  {
    name: 'Dr. Michael Chen',
    specializations: ['Behavioral', 'General'],
    schedule: {
      monday: [
        { startTime: '10:00', endTime: '13:00', isRecurring: true },
        { startTime: '15:00', endTime: '18:00', isRecurring: true },
      ],
      tuesday: [
        { startTime: '10:00', endTime: '13:00', isRecurring: true },
        { startTime: '15:00', endTime: '18:00', isRecurring: true },
      ],
      wednesday: [
        { startTime: '10:00', endTime: '13:00', isRecurring: true },
        { startTime: '15:00', endTime: '18:00', isRecurring: true },
      ],
      thursday: [
        { startTime: '10:00', endTime: '13:00', isRecurring: true },
        { startTime: '15:00', endTime: '18:00', isRecurring: true },
      ],
      friday: [
        { startTime: '10:00', endTime: '13:00', isRecurring: true },
      ],
    },
    rating: 4.6,
    experienceYears: 8,
    languages: ['English', 'Mandarin'],
  },
  {
    name: 'Dr. Emily Rodriguez',
    specializations: ['Skin', 'Dermatology'],
    schedule: {
      tuesday: [
        { startTime: '08:00', endTime: '12:00', isRecurring: true },
        { startTime: '13:00', endTime: '17:00', isRecurring: true },
      ],
      wednesday: [
        { startTime: '08:00', endTime: '12:00', isRecurring: true },
        { startTime: '13:00', endTime: '17:00', isRecurring: true },
      ],
      thursday: [
        { startTime: '08:00', endTime: '12:00', isRecurring: true },
        { startTime: '13:00', endTime: '17:00', isRecurring: true },
      ],
      friday: [
        { startTime: '08:00', endTime: '12:00', isRecurring: true },
      ],
      saturday: [
        { startTime: '09:00', endTime: '13:00', isRecurring: true },
      ],
    },
    rating: 4.9,
    experienceYears: 15,
    languages: ['English', 'Spanish', 'Portuguese'],
  },
  {
    name: 'Dr. James Wilson',
    specializations: ['Surgery', 'Emergency'],
    schedule: {
      monday: [
        { startTime: '07:00', endTime: '11:00', isRecurring: true },
        { startTime: '13:00', endTime: '16:00', isRecurring: true },
      ],
      tuesday: [
        { startTime: '07:00', endTime: '11:00', isRecurring: true },
        { startTime: '13:00', endTime: '16:00', isRecurring: true },
      ],
      wednesday: [
        { startTime: '07:00', endTime: '11:00', isRecurring: true },
        { startTime: '13:00', endTime: '16:00', isRecurring: true },
      ],
      thursday: [
        { startTime: '07:00', endTime: '11:00', isRecurring: true },
        { startTime: '13:00', endTime: '16:00', isRecurring: true },
      ],
    },
    rating: 4.7,
    experienceYears: 20,
    languages: ['English'],
  },
  {
    name: 'Dr. Lisa Park',
    specializations: ['Cardiology', 'Internal Medicine'],
    schedule: {
      monday: [
        { startTime: '09:00', endTime: '12:00', isRecurring: true },
        { startTime: '14:00', endTime: '18:00', isRecurring: true },
      ],
      wednesday: [
        { startTime: '09:00', endTime: '12:00', isRecurring: true },
        { startTime: '14:00', endTime: '18:00', isRecurring: true },
      ],
      friday: [
        { startTime: '09:00', endTime: '12:00', isRecurring: true },
        { startTime: '14:00', endTime: '18:00', isRecurring: true },
      ],
    },
    rating: 4.5,
    experienceYears: 6,
    languages: ['English', 'Korean'],
  },
  {
    name: 'Dr. Ahmed Hassan',
    specializations: ['Orthopedics', 'Sports Medicine'],
    schedule: {
      tuesday: [
        { startTime: '08:30', endTime: '12:30', isRecurring: true },
        { startTime: '14:30', endTime: '17:30', isRecurring: true },
      ],
      thursday: [
        { startTime: '08:30', endTime: '12:30', isRecurring: true },
        { startTime: '14:30', endTime: '17:30', isRecurring: true },
      ],
      saturday: [
        { startTime: '08:00', endTime: '14:00', isRecurring: true },
      ],
    },
    rating: 4.4,
    experienceYears: 10,
    languages: ['English', 'Arabic'],
  },
  {
    name: 'Dr. Maria Gonzalez',
    specializations: ['Pediatric', 'General'],
    schedule: {
      monday: [
        { startTime: '08:00', endTime: '12:00', isRecurring: true },
        { startTime: '13:00', endTime: '17:00', isRecurring: true },
      ],
      tuesday: [
        { startTime: '08:00', endTime: '12:00', isRecurring: true },
        { startTime: '13:00', endTime: '17:00', isRecurring: true },
      ],
      wednesday: [
        { startTime: '08:00', endTime: '12:00', isRecurring: true },
        { startTime: '13:00', endTime: '17:00', isRecurring: true },
      ],
      thursday: [
        { startTime: '08:00', endTime: '12:00', isRecurring: true },
        { startTime: '13:00', endTime: '17:00', isRecurring: true },
      ],
      friday: [
        { startTime: '08:00', endTime: '12:00', isRecurring: true },
      ],
    },
    rating: 4.9,
    experienceYears: 18,
    languages: ['English', 'Spanish'],
  },
  {
    name: 'Dr. Robert Kim',
    specializations: ['Neurology'],
    schedule: {
      monday: [
        { startTime: '10:00', endTime: '14:00', isRecurring: true },
      ],
      wednesday: [
        { startTime: '10:00', endTime: '14:00', isRecurring: true },
      ],
      friday: [
        { startTime: '10:00', endTime: '14:00', isRecurring: true },
      ],
    },
    rating: 4.3,
    experienceYears: 4,
    languages: ['English', 'Korean'],
  },
];

export const samplePetOwners: Omit<PetOwner, 'id'>[] = [
  {
    name: 'Alice Smith',
    email: 'alice.smith@email.com',
    phone: '(555) 123-4567',
    pets: [
      {
        name: 'Buddy',
        species: 'Dog',
        breed: 'Golden Retriever',
        age: 3,
      },
      {
        name: 'Whiskers',
        species: 'Cat',
        breed: 'Persian',
        age: 5,
      },
    ],
  },
  {
    name: 'Bob Johnson',
    email: 'bob.johnson@email.com',
    phone: '(555) 234-5678',
    pets: [
      {
        name: 'Max',
        species: 'Dog',
        breed: 'German Shepherd',
        age: 2,
      },
    ],
  },
  {
    name: 'Carol Davis',
    email: 'carol.davis@email.com',
    phone: '(555) 345-6789',
    pets: [
      {
        name: 'Luna',
        species: 'Cat',
        breed: 'Siamese',
        age: 4,
      },
      {
        name: 'Charlie',
        species: 'Dog',
        breed: 'Beagle',
        age: 6,
      },
    ],
  },
];

// Function to generate sample appointments
export const generateSampleAppointments = (
  doctorIds: string[],
  petOwnerIds: string[]
): Omit<Appointment, 'id' | 'createdAt'>[] => {
  const appointments: Omit<Appointment, 'id' | 'createdAt'>[] = [];
  const now = new Date();

  // Generate some upcoming appointments (all in the future to pass validation)
  for (let i = 0; i < 8; i++) {
    const futureDate = new Date(now);
    futureDate.setDate(now.getDate() + (i + 1));
    futureDate.setHours(10 + (i % 6), 0, 0, 0);

    const petOwnerIndex = i % petOwnerIds.length;
    const petOwner = samplePetOwners[petOwnerIndex];
    const pet = petOwner.pets[i % petOwner.pets.length];

    appointments.push({
      doctorId: doctorIds[i % doctorIds.length],
      petOwnerId: petOwnerIds[petOwnerIndex],
      petInfo: pet,
      dateTime: futureDate,
      duration: 30,
      reason: [
        'General checkup',
        'Dental cleaning', 
        'Behavioral consultation',
        'Vaccination',
        'Skin condition check',
        'Behavioral training',
        'Dental examination',
        'Follow-up visit',
      ][i],
      status: 'scheduled',
    });
  }

  return appointments;
};

// Function to initialize sample data
export const initializeSampleData = async () => {
  const { DataService } = require('../services/DataService');
  const dataService = DataService.getInstance();

  try {
    // Clear existing data
    await dataService.clearAllData();

    // Add sample doctors
    const createdDoctors: Doctor[] = [];
    for (const doctorData of sampleDoctors) {
      const doctor = await dataService.saveDoctor(doctorData);
      createdDoctors.push(doctor);
    }

    // Add sample pet owners
    const createdPetOwners: PetOwner[] = [];
    for (const petOwnerData of samplePetOwners) {
      const petOwner = await dataService.savePetOwner(petOwnerData);
      createdPetOwners.push(petOwner);
    }

    // Generate and add sample appointments
    const appointmentData = generateSampleAppointments(
      createdDoctors.map(d => d.id),
      createdPetOwners.map(p => p.id)
    );

    // Add one cancelled appointment to the data
    if (appointmentData.length > 0) {
      appointmentData[0].status = 'cancelled';
    }

    const createdAppointments: Appointment[] = [];
    for (const appointment of appointmentData) {
      const created = await dataService.saveAppointment(appointment);
      createdAppointments.push(created);
    }

    console.log('Sample data initialized successfully!');
    console.log(`Created ${createdDoctors.length} doctors`);
    console.log(`Created ${createdPetOwners.length} pet owners`);
    console.log(`Created ${appointmentData.length} appointments`);

    return {
      doctors: createdDoctors,
      petOwners: createdPetOwners,
      appointments: createdAppointments,
    };
  } catch (error) {
    console.error('Error initializing sample data:', error);
    throw error;
  }
};