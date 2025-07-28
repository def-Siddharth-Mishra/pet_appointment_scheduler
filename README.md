# Pet Appointment Scheduler

A comprehensive React Native application for managing veterinary appointments, built with TypeScript. This app supports both doctors and pet owners with separate user flows for schedule management and appointment booking.

## Features

### For Doctors
- Configure weekly schedules with available time slots
- Set specializations and expertise areas
- Manage appointments (view, cancel, reschedule)
- Handle recurring schedule patterns

### For Pet Owners
- Browse and filter doctors by specialization
- Book appointments with available doctors
- Manage pet profiles and appointment history
- Cancel and reschedule appointments

## Tech Stack

- **React Native 0.80.2** - Cross-platform mobile development
- **TypeScript** - Type-safe development
- **React Navigation 7** - Navigation and routing
- **AsyncStorage** - Local data persistence
- **Jest** - Testing framework

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── shared/         # Components used across both user types
│   ├── doctor/         # Doctor-specific components
│   └── petOwner/       # Pet owner-specific components
├── models/             # Data model classes with validation
├── navigation/         # Navigation configuration and types
├── screens/            # Screen components
│   ├── doctor/         # Doctor flow screens
│   └── petOwner/       # Pet owner flow screens
├── services/           # Service interfaces and implementations
├── types/              # TypeScript type definitions
└── utils/              # Utility functions and constants
```

## Getting Started

> **Note**: Make sure you have completed the [React Native Environment Setup](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

### Prerequisites

- Node.js >= 18
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. **Clone the repository and install dependencies:**

```bash
npm install
```

2. **For iOS development, install CocoaPods dependencies:**

```bash
# Install Ruby bundler (first time only)
bundle install

# Install CocoaPods dependencies
bundle exec pod install
```

### Running the App

1. **Start the Metro bundler:**

```bash
npm start
```

2. **Run on your target platform:**

**Android:**
```bash
npm run android
```

**iOS:**
```bash
npm run ios
```

### Development Commands

```bash
# Run tests
npm test

# Run linter
npm run lint

# Type checking
npx tsc --noEmit
```

## Core Data Models

### Doctor
- Profile information (name, specializations, experience)
- Weekly schedule configuration
- Rating and language preferences

### Appointment
- Doctor and pet owner association
- Pet information and visit reason
- Date/time and status tracking
- Conflict resolution support

### Pet Owner
- Contact information
- Multiple pet profiles
- Appointment history

## Key Features Implementation

### Local-First Architecture
- All data persisted using AsyncStorage
- Offline-capable with data synchronization
- Optimistic UI updates with rollback support

### Conflict Resolution
- Timestamp-based priority for simultaneous bookings
- Automatic availability updates
- User-friendly error handling

### Type Safety
- Comprehensive TypeScript interfaces
- Runtime validation for data models
- Type-safe navigation parameters

## Development Guidelines

### Code Organization
- Feature-based folder structure
- Separation of concerns between UI and business logic
- Reusable components with clear interfaces

### Data Flow
- Centralized state management
- Service layer abstraction
- Consistent error handling patterns

### Testing Strategy
- Unit tests for models and utilities
- Integration tests for services
- Component testing with React Native Testing Library

## Troubleshooting

### Common Issues

**Metro bundler issues:**
```bash
# Clear Metro cache
npx react-native start --reset-cache
```

**iOS build issues:**
```bash
# Clean and reinstall pods
cd ios && rm -rf Pods Podfile.lock && bundle exec pod install
```

**Android build issues:**
```bash
# Clean Android build
cd android && ./gradlew clean
```

### Development Tips

- Use React Native Debugger for debugging
- Enable Fast Refresh for rapid development
- Use TypeScript strict mode for better type safety
- Test on both platforms regularly

## Contributing

1. Follow the existing code style and patterns
2. Add tests for new features
3. Update documentation as needed
4. Ensure TypeScript compilation passes
5. Test on both iOS and Android platforms

## License

This project is private and proprietary.p# pet_appointment_scheduler
