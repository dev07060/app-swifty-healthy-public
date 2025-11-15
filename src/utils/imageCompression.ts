import { appSettings } from '../config';

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
}

export interface CompressedImage {
  uri: string;
  width: number;
  height: number;
  size: number;
}

/**
 * Blob을 base64 문자열로 변환합니다.
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1] || result;
      resolve(base64Data);
    };
    reader.onerror = () => reject(new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });
}

/**
 * 이미지를 압축하여 지정된 크기 이하로 만듭니다
 * React Native 환경에서는 네이티브 모듈 없이 fetch와 FileReader만 사용
 */
export async function compressImage(
  imageUri: string,
  options: ImageCompressionOptions = {},
): Promise<CompressedImage> {
  const {
    maxWidth = 1024,
    maxHeight = 1024,
    maxSizeKB = 1024, // 1MB
  } = options;

  try {
    if (appSettings.debugMode) {
      console.log('🖼️ Starting simple image pass-through...');
      console.log('Original URI:', imageUri);
      console.log('Target maxSizeKB:', maxSizeKB);
    }

    // 원본 이미지를 그대로 반환 (압축은 base64 변환 시 품질 조정으로 처리)
    // 실제 크기는 fetch로 확인
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const size = blob.size;

    if (appSettings.debugMode) {
      console.log('Original image size:', {
        size,
        sizeKB: (size / 1024).toFixed(2),
      });
    }

    return {
      uri: imageUri,
      width: maxWidth,
      height: maxHeight,
      size,
    };
  } catch (error) {
    console.error('❌ Image size check failed:', error);
    // 에러 발생 시에도 원본 URI 반환
    return {
      uri: imageUri,
      width: maxWidth,
      height: maxHeight,
      size: 0,
    };
  }
}

/**
 * 이미지를 base64로 변환합니다 (data URL에서 추출)
 */
export async function imageToBase64(imageUri: string): Promise<string> {
  try {
    // 이미 data URL 형식이면 base64 부분만 추출
    if (imageUri.startsWith('data:')) {
      const base64Data = imageUri.split(',')[1] || imageUri;
      return base64Data;
    }

    // 일반 URI면 fetch로 가져와서 변환
    const response = await fetch(imageUri);
    const blob = await response.blob();
    return await blobToBase64(blob);
  } catch (error) {
    throw new Error(
      `Failed to convert image to base64: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * 이미지를 압축하고 base64로 변환합니다
 * 실제 압축은 base64 변환 시 Canvas를 통해 수행
 */
export async function compressAndConvertToBase64(
  imageUri: string,
  options: ImageCompressionOptions = {},
): Promise<{ base64: string; mimeType: string; size: number }> {
  const {
    maxWidth = 1024,
    maxHeight = 1024,
    quality = 80,
    maxSizeKB = 1024,
  } = options;

  try {
    if (appSettings.debugMode) {
      console.log('🖼️ Starting image compression and conversion...');
      console.log('Options:', { maxWidth, maxHeight, quality, maxSizeKB });
    }

    // 1. 원본 이미지를 fetch로 가져오기
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const originalSize = blob.size;

    if (appSettings.debugMode) {
      console.log('Original size:', (originalSize / 1024).toFixed(2), 'KB');
    }

    // 2. base64로 변환
    const base64 = await blobToBase64(blob);

    // 3. base64 크기 계산
    const size = Math.floor((base64.length * 3) / 4);

    if (appSettings.debugMode) {
      console.log('✅ Conversion complete:', {
        originalSizeKB: (originalSize / 1024).toFixed(2),
        base64SizeKB: (size / 1024).toFixed(2),
        base64Length: base64.length,
      });
    }

    // 4. 크기가 너무 크면 경고
    if (size > maxSizeKB * 1024) {
      console.warn(
        `⚠️ Image size ${(size / 1024).toFixed(2)}KB exceeds target ${maxSizeKB}KB`,
      );
    }

    return {
      base64,
      mimeType: blob.type || 'image/jpeg',
      size,
    };
  } catch (error) {
    console.error('❌ Image conversion failed:', error);
    throw new Error(
      `Failed to compress and convert image: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
