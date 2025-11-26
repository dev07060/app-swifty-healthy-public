import { createRoute, useNavigation } from '@granite-js/react-native';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ErrorMessage,
  LoadingIndicator,
  SuccessMessage
} from '../components';

import { ExerciseRequirementsBottomSheet } from '../components';
import { useAsyncOperation, useValidation } from '../hooks/useAsyncOperation';
import { useImageMemoryMonitor } from '../hooks/useImageProcessing';
import { useImageSelection } from '../hooks/useImageSelection';
import { getAnalysisService } from '../services/AnalysisServiceFactory';
import { useAnalysisNavigationStore } from '../store/analysisNavigation';
import type { GeminiExerciseResponse } from '../types';
import { ErrorHandlingUtils, type AppError } from '../utils/errorHandling';
import { compressImage } from '../utils/imageCompression';

// @ts-ignore - Granite routing type issue
export const Route = createRoute('/exercise-upload', {
  component: ExerciseUploadScreen,
});

function ExerciseUploadScreen() {
  const enhancedNavigation = useNavigation();
  const { setNavigationData } = useAnalysisNavigationStore();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showSuccess] = useState(false);
  const [showRequirementsBottomSheet, setShowRequirementsBottomSheet] =
    useState(false);
  // Remove old analysis result state since we now use enhanced analysis screen

  // Image processing hooks
  const memoryMonitor = useImageMemoryMonitor();

  const validation = useValidation(
    async (_imageUri: string) => {
      // 여기서는 간단한 검증만 수행 (파일 존재 여부 등)
      return true;
    },
    {
      onError: (error: any) => {
        ErrorHandlingUtils.logError(error, 'Exercise screenshot validation');
      },
    },
  );

  // Remove health tracker store usage since save logic moved to enhanced analysis screen

  // Image analysis with progress tracking
  const imageUpload = useAsyncOperation<GeminiExerciseResponse>(
    async (imageUri: string) => {
      const result = await getAnalysisService().analyzeExerciseScreenshot(imageUri);
      return result;
    },
    {
      onSuccess: (result: GeminiExerciseResponse) => {
        // Store navigation data and navigate to enhanced analysis screen
        setNavigationData({
          imageUri: selectedImage!,
          analysisResult: result,
          entryType: 'exercise',
        });
        enhancedNavigation.push('/enhanced-analysis' as any);
      },
      onError: (error: AppError) => {
        ErrorHandlingUtils.logError(error, 'Exercise image analysis');
      },
    },
  );

  // 이미지 선택 훅 사용
  const { showImageSelectionDialog } = useImageSelection({
    onImageSelected: useCallback(
      (imageUri: string) => {
        setSelectedImage(imageUri);
        validation.reset();
        imageUpload.reset();
      },
      [validation, imageUpload],
    ),
    onError: useCallback((_error: any) => {
      // 에러는 이미 훅 내부에서 처리됨
    }, []),
  });

  const handleUpload = async () => {
    if (!selectedImage) {
      Alert.alert(
        'No Image Selected',
        'Please select an exercise screenshot first',
      );
      return;
    }

    // Show requirements bottom sheet first
    setShowRequirementsBottomSheet(true);
  };

  const handleProceedWithAnalysis = async () => {
    setShowRequirementsBottomSheet(false);

    // Check memory before processing
    if (memoryMonitor.isMemoryCritical) {
      Alert.alert(
        'Memory Warning',
        'Device memory is low. Please close other apps and try again.',
        [
          { text: 'Clean Up', onPress: memoryMonitor.forceCleanup },
          { text: 'Continue Anyway', onPress: () => processImage() },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
      return;
    }

    await processImage();
  };

  const processImage = async () => {
    if (!selectedImage) {
      Alert.alert('오류', '선택된 이미지가 없습니다.');
      return;
    }

    try {
      if (memoryMonitor.isMemoryCritical) {
        Alert.alert('메모리 부족', '다른 앱을 종료하고 다시 시도하세요.');
        return;
      }

      console.log('🖼️ Starting image compression before analysis...');

      // 1. 이미지를 1MB 이하로 압축
      const compressed = await compressImage(selectedImage, {
        maxWidth: 1024,
        maxHeight: 1024,
        maxSizeKB: 1024, // 1MB
      });

      console.log('✅ Image compressed:', {
        originalUri: selectedImage,
        compressedUri: compressed.uri,
        size: compressed.size,
        sizeKB: (compressed.size / 1024).toFixed(2),
      });

      // 2. 압축된 이미지로 분석 실행
      await imageUpload.execute(compressed.uri);
    } catch (error) {
      const appError = ErrorHandlingUtils.handleProcessingError(
        error instanceof Error ? error : new Error('Analysis failed'),
        'Exercise screenshot analysis',
      );
      ErrorHandlingUtils.logError(appError, 'processImage', error);

      Alert.alert('분석 실패', ErrorHandlingUtils.formatUserMessage(appError), [
        { text: '확인' },
      ]);
    }
  };

  const handleDiscard = () => {
    setSelectedImage(null);
    setShowRequirementsBottomSheet(false);
    imageUpload.reset();
  };

  const handleCloseRequirements = () => {
    setShowRequirementsBottomSheet(false);
  };

  // Remove old save and edit handlers since they're now in enhanced analysis screen

  const handleRetryAnalysis = () => {
    imageUpload.reset();
    validation.reset();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>운동 인증</Text>
          <Text style={styles.subtitle}>운동 스크린샷을 업로드하세요</Text>
        </View>

        {/* Store errors are now handled in enhanced analysis screen */}

        {!selectedImage && (
          <View style={styles.uploadSection}>
            <TouchableOpacity
              style={styles.imagePickerButton}
              onPress={showImageSelectionDialog}
              disabled={imageUpload.isLoading}
            >
              <Text style={styles.imagePickerText}>운동 인증 입력</Text>
              <Text style={styles.imagePickerIcon}>🥎⚽🏀</Text>
              <Text style={styles.imagePickerSubtext}>
                클릭하여 촬영 또는 갤러리에서 선택하기
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {selectedImage && !showSuccess && (
          <View style={styles.previewSection}>
            <Image
              source={{ uri: selectedImage }}
              style={styles.imagePreview}
              resizeMode="contain"
            />
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleUpload}
                disabled={imageUpload.isLoading}
              >
                <Text style={[styles.buttonText, styles.primaryButtonText]}>
                  분석하기
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleDiscard}
                disabled={imageUpload.isLoading}
              >
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                  취소
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {imageUpload.isLoading && (
          <LoadingIndicator message="스크린샷 분석 중..." />
        )}

        {validation.error && (
          <ErrorMessage error={validation.error} onRetry={validation.reset} />
        )}

        {imageUpload.error && (
          <ErrorMessage
            error={imageUpload.error}
            onRetry={handleRetryAnalysis}
          />
        )}

        {/* Analysis results are now handled in enhanced analysis screen */}

        {showSuccess && <SuccessMessage message="저장되었습니다!" />}

        {/* <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Text style={styles.backButtonText}>← 돌아가기</Text>
        </TouchableOpacity> */}
      </View>
      {/* <BoardRow
        title={"운동 시간을 적어주세요."}
      >
        <Post.Paragraph paddingBottom={24} typography="t6">
          주식 거래가 실시간이 아니기 때문에 가격이 변할 것에 대비하는 금액을 말해요.
        </Post.Paragraph>
        <Post.Ul paddingBottom={24} typography="t6">
          <Post.Li>
            대시를 붙이고 띄어쓰면 불렛을 쓸 수 있어요.
            <Post.Ul paddingBottom={24} typography="t6">
              <Post.Li>들여쓰려면 대시 앞에 〉를 입력해요.</Post.Li>
            </Post.Ul>
          </Post.Li>
        </Post.Ul>
      </BoardRow> */}
      <ExerciseRequirementsBottomSheet
        visible={showRequirementsBottomSheet}
        onClose={handleCloseRequirements}
        onProceed={handleProceedWithAnalysis}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#4A5568',
  },
  uploadSection: {
    marginBottom: 24,
  },
  imagePickerButton: {
    backgroundColor: 'white',
    padding: 32,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  imagePickerIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  imagePickerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 8,
  },
  imagePickerSubtext: {
    fontSize: 14,
    color: '#4A5568',
  },
  previewSection: {
    marginBottom: 24,
  },
  imagePreview: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3182F6',
  },
  secondaryButton: {
    backgroundColor: '#E2E8F0',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: 'white',
  },
  secondaryButtonText: {
    color: '#1A202C',
  },
  backButton: {
    padding: 16,
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
  },
  // Removed analysis-related styles since they're now in enhanced analysis screen
});
