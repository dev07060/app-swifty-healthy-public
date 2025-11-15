import { fetchAlbumPhotos, openCamera } from '@apps-in-toss/framework';
import { useCallback } from 'react';
import { Alert } from 'react-native';
import { type AppError, ErrorHandlingUtils } from '../utils/errorHandling';
import { extractImageUri } from '../utils/imageTypeHelpers';

export interface ImageSelectionOptions {
  onImageSelected: (imageUri: string) => void;
  onError?: (error: AppError) => void;
}

export const useImageSelection = (options: ImageSelectionOptions) => {
  const { onImageSelected, onError } = options;

  const handleCameraCapture = useCallback(async () => {
    try {
      console.log('📷 Opening camera...');
      const result = await openCamera();

      console.log('📷 Camera result:', result);

      if (result) {
        console.log('📷 Photo object:', JSON.stringify(result, null, 2));

        const imageUri = extractImageUri(result);

        if (imageUri) {
          onImageSelected(imageUri);
          console.log('✅ Camera image set successfully');
        } else {
          console.log('❌ No valid image URI found from camera');
          Alert.alert('오류', '카메라에서 이미지를 불러올 수 없습니다.');
        }
      } else {
        console.log('❌ No photo from camera');
      }
    } catch (error) {
      console.log('❌ Camera error:', error);
      const appError = ErrorHandlingUtils.handleProcessingError(
        error instanceof Error ? error : new Error('Camera capture failed'),
        'Camera capture',
      );
      ErrorHandlingUtils.logError(appError, 'handleCameraCapture', error);
      onError?.(appError);
    }
  }, [onImageSelected, onError]);

  const handleGallerySelection = useCallback(async () => {
    try {
      console.log('📸 Fetching album photos...');
      const result = await fetchAlbumPhotos({
        maxCount: 1,
      });

      console.log('📸 Result:', result);
      console.log('📸 Result length:', result?.length);

      if (result && result.length > 0) {
        const photo = result[0];
        console.log('📸 Photo object:', JSON.stringify(photo, null, 2));
        console.log('📸 Photo type:', typeof photo);

        // 타입 안전한 방법으로 이미지 URI 추출
        const imageUri = extractImageUri(photo);

        console.log('📸 Image URI:', imageUri);

        if (imageUri) {
          onImageSelected(imageUri);
          console.log('✅ Image set successfully');
        } else {
          console.log('❌ No valid image URI found');
          Alert.alert('오류', '이미지를 불러올 수 없습니다.');
        }
      } else {
        console.log('❌ No photos in result');
      }
    } catch (error) {
      console.log('❌ Error:', error);
      const appError = ErrorHandlingUtils.handleProcessingError(
        error instanceof Error ? error : new Error('Gallery selection failed'),
        'Gallery selection',
      );
      ErrorHandlingUtils.logError(appError, 'handleGallerySelection', error);
      onError?.(appError);
    }
  }, [onImageSelected, onError]);

  const showImageSelectionDialog = useCallback(() => {
    Alert.alert('사진 선택', '사진을 선택하세요', [
      { text: '카메라', onPress: handleCameraCapture },
      { text: '갤러리', onPress: handleGallerySelection },
      { text: '취소', style: 'cancel' },
    ]);
  }, [handleCameraCapture, handleGallerySelection]);

  return {
    handleCameraCapture,
    handleGallerySelection,
    showImageSelectionDialog,
  };
};
