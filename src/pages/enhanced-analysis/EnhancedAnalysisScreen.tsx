import type { NavigationProps } from '@granite-js/react-native';
import React, { useState } from 'react';
import {
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ConfirmationDialog,
  ErrorMessage,
  FloatingAnalysisResults,
  ImageBackgroundContainer,
  SuccessMessage,
} from '../../components';
import {
  useLogExerciseMutation,
  useLogFoodMutation,
} from '../../hooks/useApiMutations';
import type { GeminiExerciseResponse, GeminiFoodResponse } from '../../types';
import { ErrorHandlingUtils } from '../../utils/errorHandling';

interface EnhancedAnalysisScreenProps {
  navigation: any;
  route: {
    params: {
      imageUri: string;
      analysisResult: GeminiFoodResponse | GeminiExerciseResponse;
      entryType: 'food' | 'exercise';
    };
  };
}

export function EnhancedAnalysisScreen({
  navigation,
  route,
}: EnhancedAnalysisScreenProps) {
  const { imageUri, analysisResult, entryType } = route.params;

  const foodMutation = useLogFoodMutation();
  const exerciseMutation = useLogExerciseMutation();

  // State for editing mode and modified data
  const [isEditing, setIsEditing] = useState(false);
  const [modifiedData, setModifiedData] = useState<
    GeminiFoodResponse | GeminiExerciseResponse
  >(analysisResult);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);

  const handleGoBack = () => {
    if (
      hasUnsavedChanges &&
      !foodMutation.isPending &&
      !exerciseMutation.isPending
    ) {
      setShowExitConfirmation(true);
    } else {
      navigation.goBack();
    }
  };

  const confirmExit = () => {
    setShowExitConfirmation(false);
    navigation.goBack();
  };

  const cancelExit = () => {
    setShowExitConfirmation(false);
  };

  const handleSave = async () => {
    if (foodMutation.isPending || exerciseMutation.isPending) return;

    // A static userKey for now, this should come from user session state
    const userKey = '9af9778d-cf8f-4ebd-807c-f6d4873b5fcc';

    try {
      if (entryType === 'food') {
        const foodData = modifiedData as GeminiFoodResponse;
        await foodMutation.mutateAsync({
          userKey,
          isHealthy: foodData.isHealthy,
          mainIngredients: foodData.mainIngredients,
          estimatedCalories: foodData.estimatedCalories,
          mealType: foodData.mealType,
          date: foodData.date,
        });
      } else {
        const exerciseData = modifiedData as GeminiExerciseResponse;
        await exerciseMutation.mutateAsync({
          userKey,
          exerciseType: exerciseData.exerciseType,
          duration: exerciseData.duration,
          calories: exerciseData.calories,
          distance: exerciseData.distance,
          date: exerciseData.date,
        });
      }

      setHasUnsavedChanges(false);
      setShowSuccessMessage(true);

      // Auto-hide success message and navigate back
      setTimeout(() => {
        setShowSuccessMessage(false);
        navigation.reset({
          index: 0,
          routes: [{ name: '/' }],
        });
      }, 2000);
    } catch (error) {
      const appError = ErrorHandlingUtils.handleProcessingError(
        error instanceof Error ? error : new Error(String(error)),
        'Enhanced analysis save',
      );
      ErrorHandlingUtils.logError(appError, 'Enhanced analysis save');
    }
  };

  const handleItemEdit = (key: string, value: string) => {
    // Update the modified data with the new value
    setModifiedData((prevData) => {
      const newData = { ...prevData };

      // Handle different field types based on the key
      if (
        key === 'estimatedCalories' ||
        key === 'calories' ||
        key === 'duration'
      ) {
        // Extract numeric value from strings like "250kcal" or "30분"
        const numericMatch = value.match(/(\d+)/);
        const numericValue = numericMatch ? Number(numericMatch[1]) : 0;
        (newData as GeminiFoodResponse & GeminiExerciseResponse)[key] =
          numericValue;
      } else if (key === 'distance') {
        // Extract numeric value from strings like "5.2km"
        const numericMatch = value.match(/(\d+(?:\.\d+)?)/);
        const numericValue = numericMatch ? Number(numericMatch[1]) : 0;
        (newData as GeminiFoodResponse & GeminiExerciseResponse)[key] =
          numericValue;
      } else if (key === 'mainIngredients') {
        (newData as GeminiFoodResponse & GeminiExerciseResponse)[key] = value
          .split(',')
          .map((item) => item.trim());
      } else if (key === 'isHealthy') {
        (newData as GeminiFoodResponse & GeminiExerciseResponse)[key] =
          value.toLowerCase() === 'true' || value === '건강함';
      } else {
        // (newData as GeminiFoodResponse & GeminiExerciseResponse)[key] = value;
      }

      return newData;
    });

    setHasUnsavedChanges(true);
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  const mutationError = foodMutation.error || exerciseMutation.error;
  const isSaving = foodMutation.isPending || exerciseMutation.isPending;

  return (
    <ImageBackgroundContainer
      imageUri={imageUri}
      enableCompression={true}
      cacheKey={`analysis-${entryType}-${imageUri}`}
      overlayOpacity={0.3}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Navigation Header */}
      <View style={styles.header}>
        <View style={styles.safeAreaTop} />
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>뒤로</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>분석 결과</Text>
          <TouchableOpacity
            style={[styles.editButton, isEditing && styles.editButtonActive]}
            onPress={toggleEditMode}
          >
            <Text
              style={[
                styles.editButtonText,
                isEditing && styles.editButtonTextActive,
              ]}
            >
              {isEditing ? '완료' : '편집'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Analysis Results Container */}
      <View style={styles.analysisContainer}>
        <FloatingAnalysisResults
          analysisData={modifiedData}
          entryType={entryType}
          onItemEdit={handleItemEdit}
          isEditing={isEditing}
        />
      </View>

      {/* Action Footer - Fixed at bottom */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text
              style={[
                styles.saveButtonText,
                isSaving && styles.saveButtonTextDisabled,
              ]}
            >
              {isSaving ? '저장 중...' : '저장'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.safeAreaBottom} />
      </View>

      {/* Success Message */}
      {showSuccessMessage && (
        <View style={styles.successOverlay}>
          <SuccessMessage
            message="분석 결과가 저장되었습니다!"
            style={styles.successMessage}
          />
        </View>
      )}

      {/* Error Message */}
      {mutationError && (
        <View style={styles.errorOverlay}>
          <ErrorMessage
            error={ErrorHandlingUtils.handleApiError(mutationError)}
            onRetry={() => {
              if (entryType === 'food') {
                foodMutation.reset();
              } else {
                exerciseMutation.reset();
              }
              handleSave();
            }}
            onDismiss={() => {
              if (entryType === 'food') {
                foodMutation.reset();
              } else {
                exerciseMutation.reset();
              }
            }}
            style={styles.errorMessage}
          />
        </View>
      )}

      {/* Exit Confirmation Dialog */}
      {showExitConfirmation && (
        <ConfirmationDialog
          title="저장하지 않은 변경사항"
          message="수정한 내용이 저장되지 않습니다. 정말 나가시겠습니까?"
          confirmText="나가기"
          cancelText="취소"
          onConfirm={confirmExit}
          onCancel={cancelExit}
          isDestructive={true}
        />
      )}
    </ImageBackgroundContainer>
  );
}

const styles = StyleSheet.create({
  // Debug styles removed
  analysisContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60, // Header 높이만큼 여백
    paddingBottom: 220, // Footer 높이만큼 여백
  },
  header: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 100,
  },
  safeAreaTop: {
    height: StatusBar.currentHeight,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44, // Same width as back button for centering
  },
  editButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonActive: {
    backgroundColor: '#3182F6',
    borderColor: '#3182F6',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  editButtonTextActive: {
    color: '#FFFFFF',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 100,
  },
  footerContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  safeAreaBottom: {
    height: Platform.OS === 'ios' ? 34 : 0, // iPhone X+ home indicator space
  },
  saveButton: {
    backgroundColor: '#3182F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0.1,
    elevation: 2,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButtonTextDisabled: {
    color: '#E2E8F0',
  },
  successOverlay: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  successMessage: {
    marginHorizontal: 20,
  },
  errorOverlay: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  errorMessage: {
    marginHorizontal: 20,
  },
});
