/**
 * Apps in Toss 이미지 처리 헬퍼
 * fetchAlbumPhotos로 받은 이미지를 Gemini API에 전송할 수 있도록 변환
 */

export interface ProcessedImageForAPI {
  base64: string;
  mimeType: string;
  size: number;
}

/**
 * Apps in Toss에서 받은 이미지 URI를 Base64로 변환
 */
export async function convertImageToBase64(
  imageUri: string,
): Promise<ProcessedImageForAPI> {
  try {
    // Fetch the image
    const response = await fetch(imageUri);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    // Get the blob
    const blob = await response.blob();

    // Convert blob to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64Data = base64String.split(',')[1] || base64String;

        resolve({
          base64: base64Data,
          mimeType: blob.type || 'image/jpeg',
          size: blob.size,
        });
      };

      reader.onerror = () => {
        reject(new Error('Failed to convert image to base64'));
      };

      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw new Error(
      `Image conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * 이미지 크기 조정 (필요한 경우)
 */
export async function resizeImageIfNeeded(
  imageUri: string,
  // maxWidth = 1024,
  // maxHeight = 1024,
): Promise<string> {
  // Apps in Toss 환경에서는 이미지가 이미 적절한 크기로 제공됨
  // 필요시 추가 처리 로직 구현
  return imageUri;
}
