import type React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface LoadingIndicatorProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  overlay?: boolean;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message = 'Loading...',
  size = 'large',
  color = '#007AFF',
  overlay = false,
}) => {
  const containerStyle = overlay
    ? [styles.container, styles.overlay]
    : styles.container;

  return (
    <View style={containerStyle}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

interface ProgressIndicatorProps {
  progress: number; // 0 to 1
  message?: string;
  showPercentage?: boolean;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  message,
  showPercentage = true,
}) => {
  const percentage = Math.round(progress * 100);

  return (
    <View style={styles.progressContainer}>
      {message && <Text style={styles.progressMessage}>{message}</Text>}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${percentage}%` }]} />
      </View>
      {showPercentage && <Text style={styles.progressText}>{percentage}%</Text>}
    </View>
  );
};

interface InlineLoadingProps {
  message?: string;
  size?: 'small' | 'large';
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  message = 'Processing...',
  size = 'small',
}) => {
  return (
    <View style={styles.inlineContainer}>
      <ActivityIndicator
        size={size}
        color="#007AFF"
        style={styles.inlineSpinner}
      />
      <Text style={styles.inlineMessage}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1000,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  progressContainer: {
    padding: 20,
    alignItems: 'center',
  },
  progressMessage: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  inlineSpinner: {
    marginRight: 8,
  },
  inlineMessage: {
    fontSize: 14,
    color: '#666',
  },
});
