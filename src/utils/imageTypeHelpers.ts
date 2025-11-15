/**
 * Apps in Toss 이미지 관련 타입 헬퍼 함수들
 */

// Apps in Toss fetchAlbumPhotos 응답 타입 정의
export interface AppsInTossImageResponse {
  dataUri?: string;
  uri?: string;
  [key: string]: unknown; // 다른 속성들을 위한 인덱스 시그니처
}

/**
 * 타입 안전한 이미지 URI 추출 함수
 * @param photo fetchAlbumPhotos에서 반환된 photo 객체
 * @returns 이미지 URI 또는 null
 */
export function extractImageUri(photo: unknown): string | null {
  if (!photo || typeof photo !== 'object') {
    return null;
  }

  const imageResponse = photo as AppsInTossImageResponse;

  // dataUri를 우선적으로 사용, 없으면 uri 사용
  return imageResponse.dataUri || imageResponse.uri || null;
}

/**
 * 이미지 응답 배열에서 첫 번째 유효한 이미지 URI를 추출
 * @param photos fetchAlbumPhotos에서 반환된 photos 배열
 * @returns 첫 번째 유효한 이미지 URI 또는 null
 */
export function extractFirstImageUri(photos: unknown[]): string | null {
  if (!Array.isArray(photos) || photos.length === 0) {
    return null;
  }

  return extractImageUri(photos[0]);
}

/**
 * 타입 가드: 객체가 유효한 이미지 응답인지 확인
 * @param obj 확인할 객체
 * @returns 유효한 이미지 응답 여부
 */
export function isValidImageResponse(
  obj: unknown,
): obj is AppsInTossImageResponse {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const response = obj as AppsInTossImageResponse;
  return (
    typeof response.dataUri === 'string' || typeof response.uri === 'string'
  );
}
