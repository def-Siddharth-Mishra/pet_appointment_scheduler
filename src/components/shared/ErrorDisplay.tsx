import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { ErrorMessage } from './ErrorMessage';
import { AppError } from '../../types';

interface ErrorDisplayProps {
  error?: AppError;
  showOfflineStatus?: boolean;
  showRecoveryActions?: boolean;
  onDismiss?: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  showOfflineStatus = true,
  showRecoveryActions = true,
  onDismiss,
}) => {
  const { 
    currentError, 
    hasError, 
    isOffline, 
    getErrorMessage, 
    getErrorSeverity, 
    getRecoveryActions,
    dismissError 
  } = useErrorHandler();

  const displayError = error || currentError;
  const shouldShow = hasError || !!error;

  if (!shouldShow || !displayError) {
    return null;
  }

  const severity = getErrorSeverity(displayError);
  const recoveryActions = showRecoveryActions ? getRecoveryActions(displayError) : [];

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    } else {
      dismissError();
    }
  };

  return (
    <View style={styles.container}>
      {showOfflineStatus && isOffline && (
        <View style={styles.offlineBar}>
          <Text style={styles.offlineText}>
            📱 You're offline - using cached data
          </Text>
        </View>
      )}
      
      <ScrollView style={styles.errorContainer}>
        <ErrorMessage
          message={getErrorMessage(displayError)}
          error={displayError}
          type={severity === 'high' ? 'error' : severity === 'medium' ? 'warning' : 'info'}
          showDetails={true}
        />
        
        {showRecoveryActions && recoveryActions.length > 0 && (
          <View style={styles.actionsContainer}>
            <Text style={styles.actionsTitle}>What would you like to do?</Text>
            {recoveryActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.actionButton,
                  index === 0 ? styles.primaryAction : styles.secondaryAction
                ]}
                onPress={action.action}
              >
                <Text style={[
                  styles.actionButtonText,
                  index === 0 ? styles.primaryActionText : styles.secondaryActionText
                ]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  offlineBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFA500',
    paddingVertical: 8,
    paddingHorizontal: 16,
    zIndex: 1001,
  },
  offlineText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    maxHeight: '80%',
    maxWidth: '90%',
    minWidth: '80%',
  },
  actionsContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  primaryAction: {
    backgroundColor: '#007AFF',
  },
  secondaryAction: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryActionText: {
    color: 'white',
  },
  secondaryActionText: {
    color: '#6B7280',
  },
});