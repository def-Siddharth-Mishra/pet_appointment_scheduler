/**
 * Pet Appointment Scheduler App
 * Main entry point for the React Native application
 *
 * @format
 */

import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import 'react-native-gesture-handler';

// Import the root navigator and context provider
import RootNavigator from './src/navigation/RootNavigator';
import { AppProvider } from './src/context/AppContext';
import { ErrorBoundary } from './src/components/shared/ErrorBoundary';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log to crash reporting service in production
        console.error('App crashed:', error, errorInfo);
      }}
    >
      <AppProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <RootNavigator />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
