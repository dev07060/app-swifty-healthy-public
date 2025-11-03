import type React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { type AppError, ErrorHandlingUtils } from '../../utils/errorHandling';

interface ErrorMessageProps {
  error: AppError;
  onRetry?: () => void;
  onDismiss?: () => void;
  style?: any;
  showDetails?: boolean;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onRetry,
  onDismiss,
  style,
  showDetails = false,
}) => {
  const shouldShowRetry = ErrorHandlingUtils.shouldShowRetry(error);
  const userMessage = ErrorHandlingUtils.formatUserMessage(error);

  const handleShowDetails = () => {
    if (!showDetails) return;

    const details = [`Type: ${error.type}`, `Message: ${error.message}`];

    if ('code' in error && error.code) {
      details.push(`Code: ${error.code}`);
    }

    if ('statusCode' in error && error.statusCode) {
      details.push(`Status: ${error.statusCode}`);
    }

    Alert.alert('Error Details', details.join('\n'));
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        <Text style={styles.icon}>⚠️</Text>
        <View style={styles.textContainer}>
          <Text style={styles.message}>{userMessage}</Text>
          {showDetails && (
            <TouchableOpacity onPress={handleShowDetails}>
              <Text style={styles.detailsLink}>Show details</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        {onDismiss && (
          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissText}>Dismiss</Text>
          </TouchableOpacity>
        )}
        {shouldShowRetry && onRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

interface InlineErrorProps {
  error: AppError;
  onRetry?: () => void;
}

export const InlineError: React.FC<InlineErrorProps> = ({ error, onRetry }) => {
  const shouldShowRetry = ErrorHandlingUtils.shouldShowRetry(error);
  const userMessage = ErrorHandlingUtils.formatUserMessage(error);

  return (
    <View style={styles.inlineContainer}>
      <Text style={styles.inlineIcon}>⚠️</Text>
      <Text style={styles.inlineMessage}>{userMessage}</Text>
      {shouldShowRetry && onRetry && (
        <TouchableOpacity style={styles.inlineRetryButton} onPress={onRetry}>
          <Text style={styles.inlineRetryText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

interface ValidationErrorProps {
  error: AppError;
  field?: string;
}

export const ValidationError: React.FC<ValidationErrorProps> = ({
  error,
  field,
}) => {
  if (error.type !== 'validation') return null;

  return (
    <View style={styles.validationContainer}>
      <Text style={styles.validationMessage}>
        {field ? `${field}: ` : ''}
        {ErrorHandlingUtils.formatUserMessage(error)}
      </Text>
    </View>
  );
};

interface ErrorBoundaryFallbackProps {
  error: Error;
  onRetry?: () => void;
}

export const ErrorBoundaryFallback: React.FC<ErrorBoundaryFallbackProps> = ({
  error,
  onRetry,
}) => {
  return (
    <View style={styles.boundaryContainer}>
      <Text style={styles.boundaryIcon}>💥</Text>
      <Text style={styles.boundaryTitle}>Something went wrong</Text>
      <Text style={styles.boundaryMessage}>
        The app encountered an unexpected error. Please try again.
      </Text>
      {onRetry && (
        <TouchableOpacity style={styles.boundaryButton} onPress={onRetry}>
          <Text style={styles.boundaryButtonText}>Restart App</Text>
        </TouchableOpacity>
      )}
      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>Debug Info:</Text>
          <Text style={styles.debugText}>{error.message}</Text>
          <Text style={styles.debugText}>{error.stack}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF3F3',
    borderColor: '#FFB3B3',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    margin: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    fontSize: 16,
    color: '#D32F2F',
    lineHeight: 22,
  },
  detailsLink: {
    fontSize: 14,
    color: '#1976D2',
    marginTop: 4,
    textDecorationLine: 'underline',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  dismissButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  dismissText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  retryText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '500',
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3F3',
    borderColor: '#FFB3B3',
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    marginVertical: 4,
  },
  inlineIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  inlineMessage: {
    flex: 1,
    fontSize: 14,
    color: '#D32F2F',
  },
  inlineRetryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  inlineRetryText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '500',
  },
  validationContainer: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFD54F',
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    marginVertical: 4,
  },
  validationMessage: {
    fontSize: 14,
    color: '#F57C00',
  },
  boundaryContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF',
  },
  boundaryIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  boundaryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  boundaryMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  boundaryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  boundaryButtonText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '500',
  },
  debugContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    width: '100%',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
});
