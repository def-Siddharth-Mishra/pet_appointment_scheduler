// Constants for the Pet Appointment Scheduler

// Days of the week
export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday', 
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
] as const;

export type DayOfWeek = typeof DAYS_OF_WEEK[number];

// Medical specializations for veterinarians
export const SPECIALIZATIONS = [
  'General Practice',
  'Surgery',
  'Dermatology (Skin)',
  'Dentistry',
  'Behavioral Medicine',
  'Cardiology',
  'Oncology',
  'Orthopedics',
  'Ophthalmology (Eyes)',
  'Emergency Medicine',
  'Internal Medicine',
  'Neurology',
  'Radiology',
  'Anesthesiology',
  'Exotic Animals',
  'Reproduction',
  'Nutrition',
  'Pathology'
] as const;

export type Specialization = typeof SPECIALIZATIONS[number];

// Recurring pattern types
export const RECURRING_PATTERNS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi-weekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' }
] as const;

// Time slot intervals (in minutes)
export const TIME_SLOT_INTERVALS = [
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' }
] as const;

// Default working hours
export const DEFAULT_WORKING_HOURS = {
  start: '09:00',
  end: '17:00'
} as const;

// Languages commonly spoken by veterinarians
export const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Chinese',
  'Japanese',
  'Korean',
  'Arabic',
  'Russian',
  'Dutch',
  'Swedish',
  'Norwegian',
  'Danish'
] as const;

export type Language = typeof LANGUAGES[number];