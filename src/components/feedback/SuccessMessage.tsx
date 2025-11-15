import { Button, Post } from '@toss/tds-react-native';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';
import type {
  AuthenticationEntry,
  ExerciseEntry,
  FoodEntry,
} from '../../types';

interface SuccessMessageProps {
  message: string;
  onDismiss?: () => void;
  autoHide?: boolean;
  duration?: number;
  style?: ViewStyle;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({
  message,
  onDismiss,
  autoHide = false,
  duration = 3000,
  style,
}) => {
  React.useEffect(() => {
    if (autoHide && onDismiss) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [autoHide, duration, onDismiss]);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        <Text style={styles.icon}>✅</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
      {onDismiss && (
        <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
          <Text style={styles.dismissText}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

interface DataPreviewProps {
  entry:
  | AuthenticationEntry
  | Omit<ExerciseEntry, 'id' | 'createdAt'>
  | Omit<FoodEntry, 'id' | 'createdAt'>;
  onSave?: () => void;
  onDiscard?: () => void;
  isLoading?: boolean;
}

export const DataPreview: React.FC<DataPreviewProps> = ({
  entry,
  onSave,
  onDiscard,
  isLoading = false,
}) => {
  const renderExerciseData = (exercise: ExerciseEntry) => (
    <View style={styles.previewData}>
      <Text style={styles.previewTitle}>Exercise Data</Text>
      <View style={styles.dataRow}>
        <Text style={styles.dataLabel}>Type:</Text>
        <Text style={styles.dataValue}>{exercise.exerciseType}</Text>
      </View>
      <View style={styles.dataRow}>
        <Text style={styles.dataLabel}>Duration:</Text>
        <Text style={styles.dataValue}>{exercise.duration}</Text>
      </View>
      <View style={styles.dataRow}>
        <Text style={styles.dataLabel}>Calories:</Text>
        <Text style={styles.dataValue}>{exercise.calories}</Text>
      </View>
      <View style={styles.dataRow}>
        <Text style={styles.dataLabel}>Date:</Text>
        <Text style={styles.dataValue}>{exercise.date}</Text>
      </View>
    </View>
  );

  const renderFoodData = (food: FoodEntry) => (
    <View style={styles.previewData}>
      <Text style={styles.previewTitle}>Food Analysis</Text>
      <View style={styles.dataRow}>
        <Text style={styles.dataLabel}>Health Status:</Text>
        <Text
          style={[
            styles.dataValue,
            food.isHealthy ? styles.healthy : styles.unhealthy,
          ]}
        >
          {food.isHealthy ? '✅ Healthy' : '⚠️ Less Healthy'}
        </Text>
      </View>
      <View style={styles.dataRow}>
        <Text style={styles.dataLabel}>Meal Type:</Text>
        <Text style={styles.dataValue}>{food.mealType}</Text>
      </View>
      <View style={styles.dataRow}>
        <Text style={styles.dataLabel}>Estimated Calories:</Text>
        <Text style={styles.dataValue}>{food.estimatedCalories}</Text>
      </View>
      <View style={styles.dataRow}>
        <Text style={styles.dataLabel}>Main Ingredients:</Text>
        <ScrollView
          style={styles.ingredientsContainer}
          showsVerticalScrollIndicator={false}
        >
          {food.mainIngredients.map((ingredient) => (
            <Text key={ingredient} style={styles.ingredient}>
              • {ingredient}
            </Text>
          ))}
        </ScrollView>
      </View>
      <View style={styles.dataRow}>
        <Text style={styles.dataLabel}>Date:</Text>
        <Text style={styles.dataValue}>{food.date}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.previewContainer}>
      <Text style={styles.previewHeader}>Review Your Data</Text>

      {entry.type === 'exercise'
        ? renderExerciseData(entry as ExerciseEntry)
        : renderFoodData(entry as FoodEntry)}

      <View style={styles.actionButtons}>
        {onDiscard && (
          <TouchableOpacity
            style={[styles.actionButton, styles.discardButton]}
            onPress={onDiscard}
            disabled={isLoading}
          >
            <Text style={styles.discardButtonText}>Discard</Text>
          </TouchableOpacity>
        )}
        {onSave && (
          <TouchableOpacity
            style={[styles.actionButton, styles.saveButton]}
            onPress={onSave}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Saving...' : 'Save Entry'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

interface ConfirmationDialogProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  // isDestructive = false,
}) => {
  return (
    <View style={styles.dialogOverlay}>
      <View style={styles.dialogContainer}>
        <Post.H2>{title}</Post.H2>
        <Post.Paragraph>{message}</Post.Paragraph>
        <View style={styles.dialogActions}>
          <Button type="dark" style="weak" onPress={onCancel}>
            {cancelText}
          </Button>
          {/* isDestructive ? */}
          <Button type="primary" onPress={onConfirm}>
            {confirmText}
          </Button>
        </View>
      </View>
    </View >
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F0F9FF',
    borderColor: '#7DD3FC',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    margin: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
  },
  message: {
    fontSize: 16,
    color: '#0369A1',
    flex: 1,
  },
  dismissButton: {
    padding: 4,
  },
  dismissText: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: 'bold',
  },
  previewContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  previewHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  previewData: {
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  dataLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  dataValue: {
    fontSize: 16,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  healthy: {
    color: '#16A34A',
    fontWeight: '600',
  },
  unhealthy: {
    color: '#DC2626',
    fontWeight: '600',
  },
  ingredientsContainer: {
    flex: 2,
    maxHeight: 100,
  },
  ingredient: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    textAlign: 'right',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  discardButton: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
    borderWidth: 1,
  },
  discardButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
  dialogOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  dialogContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    minWidth: 280,
    maxWidth: 400,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  dialogMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  dialogCancelText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  dialogConfirmText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
  destructiveText: {
    color: '#FFF',
  },
});
