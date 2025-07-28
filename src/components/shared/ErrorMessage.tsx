import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { AppError, ErrorType } from '../../types';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  retryText?: string;
  type?: 'error' | 'warning' | 'info';
  error?: AppError;
  showDetails?: boolean;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  retryText = 'Try Again',
  type = 'error',
  error,
  showDetails = false
}) => {
  const getContainerStyle = () => {
    switch (type) {
      case 'warning':
        return [styles.container, styles.warningContainer];
      case 'info':
        return [styles.container, styles.infoContainer];
      default:
        return [styles.container, styles.errorContainer];
    }
  };

  const getTextStyle = () => {
    switch (type) {
      case 'warning':
        return [styles.message, styles.warningText];
      case 'info':
        return [styles.message, styles.infoText];
      default:
        return [styles.message, styles.errorText];
    }
  };

  const getRecoverySuggestion = (error?: AppError): string => {
    if (!error) return '';
    
    switch (error.type) {
      case ErrorType.STORAGE_ERROR:
        return 'Try restarting the app or clearing app data if the problem persists.';
      case ErrorType.NETWORK_ERROR:
        return 'Check your internet connection and try again.';
      case ErrorType.BOOKING_CONFLICT:
        return 'Please select a different time slot or try booking again.';
      case ErrorType.VALIDATION_ERROR:
        return 'Please check your input and correct any errors.';
      default:
        return 'Please try again or contact support if the problem continues.';
    }
  };

  const showErrorDetails = () => {
    if (!error) return;
    
    Alert.alert(
      'Error Details',
      `Type: ${error.type}\nMessage: ${error.message}\n\nSuggestion: ${getRecoverySuggestion(error)}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={getContainerStyle()}>
      <Text style={getTextStyle()}>{message}</Text>
      
      {error && (
        <Text style={styles.suggestion}>
          {getRecoverySuggestion(error)}
        </Text>
      )}
      
      <View style={styles.buttonContainer}>
        {onRetry && error?.recoverable && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryButtonText}>{retryText}</Text>
          </TouchableOpacity>
        )}
        
        {showDetails && error && (
          <TouchableOpacity style={styles.detailsButton} onPress={showErrorDetails}>
            <Text style={styles.detailsButtonText}>Details</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  errorContainer: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FEB2B2',
  },
  warningContainer: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  infoContainer: {
    backgroundColor: '#EBF8FF',
    borderColor: '#90CDF4',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorText: {
    color: '#C53030',
  },
  warningText: {
    color: '#D69E2E',
  },
  infoText: {
    color: '#2B6CB0',
  },
  suggestion: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  detailsButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#6B7280',
  },
  detailsButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
});