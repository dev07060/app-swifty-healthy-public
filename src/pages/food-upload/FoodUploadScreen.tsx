import { useNavigation } from '@granite-js/react-native';
import { Toast } from '@toss/tds-react-native';
import React, { useCallback, useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import {
  ErrorMessage,
  InlineError,
  LoadingIndicator,
  ProgressIndicator,
  SuccessMessage,
} from '../../components/feedback';
import { useImageUpload, useValidation } from '../../hooks/useAsyncOperation';
import { useImageMemoryMonitor } from '../../hooks/useImageProcessing';
import { useImageSelection } from '../../hooks/useImageSelection';
import { geminiAPIClient } from '../../services/GeminiAPIClient';
import { useAnalysisNavigationStore } from '../../store/analysisNavigation';
import type { GeminiFoodResponse } from '../../types';
import { AppError, ErrorHandlingUtils } from '../../utils/errorHandling';
import { compressImage } from '../../utils/imageCompression';
import { styles } from './styles';

export function FoodUploadScreen(): React.JSX.Element {
  const enhancedNavigation = useNavigation();
  const { setNavigationData } = useAnalysisNavigationStore();
  const [toastMessage, setToastMessage] = React.useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showSuccess] = useState(false);

  const memoryMonitor = useImageMemoryMonitor();

  const validation = useValidation(
    async (_imageUri: string) => {
      // 간단한 검증만 수행
      return true;
    },
    {
      onError: (error) => {
        ErrorHandlingUtils.logError(error, 'Food photo validation');
      },
    },
  );

  const imageUpload = useImageUpload(
    async (imageUri: string) => {
      await validation.validate(imageUri);
      const result = await geminiAPIClient.analyzeFoodPhoto(imageUri);
      return result;
    },
    {
      onSuccess: (result: GeminiFoodResponse) => {
        // Store navigation data and navigate to enhanced analysis screen
        setNavigationData({
          imageUri: capturedImage ?? '',
          analysisResult: result,
          entryType: 'food',
        });
        enhancedNavigation.push('/enhanced-analysis');
      },
      onError: (error: AppError) => {
        ErrorHandlingUtils.logError(error, 'Food photo analysis');
        setToastMessage(true);
      },
    },
  );

  // Remove save operation since it's now handled in enhanced analysis screen

  // 이미지 선택 훅 사용
  const { showImageSelectionDialog } = useImageSelection({
    onImageSelected: useCallback(
      (imageUri: string) => {
        setCapturedImage(imageUri);
        validation.reset();
        imageUpload.reset();
      },
      [validation, imageUpload],
    ),
    onError: useCallback((_error: AppError) => {
      // 에러는 이미 훅 내부에서 처리됨
    }, []),
  });

  const handleAnalyze = async () => {
    if (!capturedImage) return;

    try {
      if (memoryMonitor.isMemoryCritical) {
        setToastMessage(true);
        return;
      }

      console.log('🖼️ Starting image compression before analysis...');

      // 1. 이미지를 1MB 이하로 압축
      const compressed = await compressImage(capturedImage, {
        maxWidth: 1024,
        maxHeight: 1024,
        maxSizeKB: 1024, // 1MB
      });

      console.log('✅ Image compressed:', {
        originalUri: capturedImage,
        compressedUri: compressed.uri,
        size: compressed.size,
        sizeKB: (compressed.size / 1024).toFixed(2),
      });

      // 2. 압축된 이미지로 분석 실행
      await imageUpload.execute(compressed.uri);
    } catch (error) {
      const appError = ErrorHandlingUtils.handleProcessingError(
        error instanceof Error
          ? error
          : new Error('분석실패 : 올바른 이미지를 선택해주세요'),
        'Food photo analysis',
      );
      ErrorHandlingUtils.logError(appError, 'handleAnalyze', error);

      setToastMessage(true);
    }
  };

  const cancelDiscard = () => {
    setCapturedImage(null);
    validation.reset();
    imageUpload.reset();
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>식단 인증</Text>
          <Text style={styles.subtitle}>음식 사진을 업로드하세요</Text>
        </View>

        {!capturedImage && (
          <View style={styles.uploadSection}>
            <TouchableOpacity
              style={styles.imagePickerButton}
              onPress={showImageSelectionDialog}
              disabled={imageUpload.isLoading}
            >
              <Text style={styles.imagePickerText}>식단 인증 입력</Text>
              <Text style={styles.imagePickerIcon}>🥗🥩🥖</Text>
              <Text style={styles.imagePickerSubtext}>
                클릭하여 촬영 또는 갤러리에서 선택하기
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {capturedImage && (
          <View style={styles.previewSection}>
            <Image
              source={{ uri: capturedImage }}
              style={styles.imagePreview}
            />
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleAnalyze}
                disabled={imageUpload.isLoading}
              >
                <Text style={[styles.buttonText, styles.primaryButtonText]}>
                  분석하기
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={cancelDiscard}
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
          <>
            <LoadingIndicator message="사진 분석 중..." />
            {imageUpload.progress > 0 && (
              <ProgressIndicator progress={imageUpload.progress / 100} />
            )}
          </>
        )}

        {validation.error && (
          <InlineError error={validation.error} onRetry={validation.reset} />
        )}

        {imageUpload.error && (
          <ErrorMessage error={imageUpload.error} onRetry={imageUpload.reset} />
        )}

        {showSuccess && <SuccessMessage message="저장되었습니다!" />}

      </View>
      <Toast
        position="bottom"
        open={toastMessage}
        text="분석실패 : 올바른 이미지를 선택해주세요"
        duration={3000}
        onClose={() => setToastMessage(false)}
      />
    </View>
  );
}
