import React, { useState } from 'react';
import {
  StatusBar,
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
import { styles } from './styles';

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

  // Debug: Log the analysis result
  console.log('🔍 Enhanced Analysis Screen - Entry Type:', entryType);
  console.log('🔍 Enhanced Analysis Screen - Analysis Result:', JSON.stringify(analysisResult, null, 2));
  if (entryType === 'food') {
    console.log('🔍 Food ingredients:', (analysisResult as GeminiFoodResponse).ingredients);
  }

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
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

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

  const handleSaveClick = () => {
    // Show confirmation dialog before saving
    setShowSaveConfirmation(true);
  };

  const handleConfirmSave = async () => {
    setShowSaveConfirmation(false);

    if (foodMutation.isPending || exerciseMutation.isPending) return;

    // A static userKey for now, this should come from user session state
    const userKey = '9af9778d-cf8f-4ebd-807c-f6d4873b5fcc';

    try {
      if (entryType === 'food') {
        const foodData = modifiedData as GeminiFoodResponse;
        const payload = {
          userKey,
          isHealthy: foodData.isHealthy,
          ingredients: foodData.ingredients,
          estimatedCalories: foodData.estimatedCalories,
          mealType: foodData.mealType,
          date: foodData.date,
        };
        console.log('💾 Saving food data - Modified Data:', JSON.stringify(foodData, null, 2));
        console.log('💾 Saving food data - Ingredients:', foodData.ingredients);
        console.log('💾 Saving food data - Payload:', JSON.stringify(payload, null, 2));
        await foodMutation.mutateAsync(payload);
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

  const handleEditFromDialog = () => {
    setShowSaveConfirmation(false);
    setIsEditing(true);
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
      } else if (key === 'ingredients') {
        const ingredientNames = value.split(',').map((item) => item.trim());
        (newData as GeminiFoodResponse & GeminiExerciseResponse)[key] =
          ingredientNames.map((name) => ({ name, color: 'teal' }));
      } else if (key === 'isHealthy') {
        (newData as GeminiFoodResponse & GeminiExerciseResponse)[key] =
          value.toLowerCase() === 'true' || value === '건강함';
      } else {
        // Handle other string fields like mealType, exerciseType, date, etc.
        (newData as any)[key] = value;
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
            onPress={handleSaveClick}
            disabled={isSaving}
          >
            <Text
              style={[
                styles.saveButtonText,
                isSaving && styles.saveButtonTextDisabled,
              ]}
            >
              {isSaving ? '저장 중...' : '저장하기'}
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
              handleConfirmSave();
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

      {/* Save Confirmation Dialog */}
      {showSaveConfirmation && (
        <ConfirmationDialog
          title="분석 정보 확인"
          message="입력된 정보가 정확한가요? 편집 버튼을 눌러 수정할 수 있습니다."
          confirmText="저장하기"
          cancelText="수정하기"
          onConfirm={handleConfirmSave}
          onCancel={handleEditFromDialog}
          isDestructive={false}
        />
      )}
    </ImageBackgroundContainer>
  );
}

