export const exerciseAnalysisPrompt = `이 운동 스크린샷을 분석하여 다음 정보를 JSON 형식으로 추출해주세요:
{
  "exerciseType": "string - 운동 종류 (예: 달리기, 사이클링, 웨이트 트레이닝 등)",
  "duration": "string - 운동 시간을 HH:MM:SS 형식으로",
  "calories": "number - 소모된 칼로리",
  "distance": "number - 운동 거리 (km 단위, 걷기/달리기/사이클링 등의 경우만. 해당 정보가 없으면 null)",
  "date": "string - 제공된 현재 날짜를 YYYY-MM-DD 형식으로"
}

거리 정보는 걷기, 달리기, 사이클링, 등산 등의 운동에서만 추출하고, 웨이트 트레이닝이나 요가 같은 운동에서는 null로 설정하세요.
모든 필드가 올바른 형식으로 포함되도록 해주세요. exerciseType은 한글로 응답해주세요.`;

export const foodAnalysisPrompt = `이 음식 사진을 분석하여 다음 정보를 JSON 형식으로 추출해주세요:
{
  "isHealthy": "boolean - 음식이 일반적으로 건강한 것으로 간주되면 true",
  "ingredients": "array of objects - 음식에서 보이는 주요 재료들. 각 재료는 {name: string, color: string} 형식",
  "estimatedCalories": "number - 예상 총 칼로리",
  "mealType": "string - 아침식사, 점심식사, 저녁식사, 간식 중 하나",
  "date": "string - 제공된 현재 날짜를 YYYY-MM-DD 형식으로"
}

재료 분류 규칙:
- 채소, 과일, 샐러드 등 식물성 재료는 color를 "green"으로 설정
- 육류, 생선, 해산물 등 동물성 단백질은 color를 "red"로 설정
- 곡물, 빵, 면, 유제품, 소스 등 기타 재료는 color를 "teal"로 설정

음식이 주로 자연식품, 채소, 저지방 단백질로 구성되어 있거나 가공이 적으면 건강한 것으로 판단하세요. 보이는 분량을 기준으로 칼로리를 추정하세요. 음식 종류와 제공된 현재 시간을 기준으로 식사 유형을 결정하세요. ingredients의 name과 mealType은 한글로 응답해주세요.`;

export const API_ERROR_MESSAGES = {
  HTTP_ERROR: (status: number, statusText: string) =>
    `HTTP ${status}: ${statusText}`,
  TIMEOUT_ERROR: 'Request timeout - please try again',
  NETWORK_ERROR: (message: string) => `Network error: ${message}`,
  UNKNOWN_ERROR: 'Unknown error occurred',
  CONFIGURATION_ERROR: (field: string) => `Gemini ${field} is not configured`,
  IMAGE_FETCH_ERROR: (status: number) => `Failed to fetch image: ${status}`,
  IMAGE_READ_ERROR: 'Failed to read image file',
  IMAGE_PROCESSING_ERROR: (message: string) =>
    `Image processing failed: ${message}`,
  ANALYSIS_ERROR: (type: string, message: string) =>
    `${type} analysis failed: ${message}`,
  JSON_EXTRACTION_ERROR: 'No valid JSON found in API response',
  INVALID_RESPONSE_ERROR: (field: string) => `No ${field} in API response`,
  RESPONSE_PARSING_ERROR: (type: string, message: string) =>
    `Failed to parse ${type} response: ${message}`,
};

export const VALID_MEAL_TYPES = [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
  '아침식사',
  '점심식사',
  '저녁식사',
  '간식',
];
