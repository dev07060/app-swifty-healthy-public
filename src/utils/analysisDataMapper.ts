import type { GeminiExerciseResponse, GeminiFoodResponse } from '../types';
import type { FloatingTextData, Position } from './positionCalculation';

// Data mapping configuration for different analysis types
export interface AnalysisDisplayConfig {
  key: string;
  label: string;
  formatter: (value: any) => string;
  priority: number; // Higher priority items are shown first
  isEditable: boolean;
  preferredPosition?: Position;
}

// Food analysis display configuration
const FOOD_DISPLAY_CONFIG: AnalysisDisplayConfig[] = [
  {
    key: 'mealType',
    label: '식사 유형',
    formatter: (value: string) => value,
    priority: 10,
    isEditable: true,
  },
  {
    key: 'ingredients',
    label: '주요 재료',
    formatter: (value: Array<{ name: string; color: string }>) => {
      if (Array.isArray(value)) {
        return value.map((ingredient) => ingredient.name).join(', '); // 재료 이름만 표시
      }
      return String(value);
    },
    priority: 9,
    isEditable: true,
  },
  {
    key: 'estimatedCalories',
    label: '칼로리',
    formatter: (value: number) => `${value}kcal`,
    priority: 8,
    isEditable: true,
  },
];

// Exercise analysis display configuration
const EXERCISE_DISPLAY_CONFIG: AnalysisDisplayConfig[] = [
  {
    key: 'exerciseType',
    label: '운동 종류',
    formatter: (value: string) => value,
    priority: 10,
    isEditable: true,
  },
  {
    key: 'duration',
    label: '운동 시간',
    formatter: (value: number) => `${value}분`,
    priority: 9,
    isEditable: true,
  },
  {
    key: 'calories',
    label: '소모 칼로리',
    formatter: (value: number) => `${value}kcal`,
    priority: 8,
    isEditable: true,
  },
  {
    key: 'distance',
    label: '운동 거리',
    formatter: (value: number) => `${value}km`,
    priority: 7,
    isEditable: true,
  },
];

// Convert analysis data to floating text items
export function mapAnalysisToFloatingText(
  analysisData: GeminiFoodResponse | GeminiExerciseResponse,
  entryType: 'food' | 'exercise',
): FloatingTextData[] {
  const config =
    entryType === 'food' ? FOOD_DISPLAY_CONFIG : EXERCISE_DISPLAY_CONFIG;
  const items: FloatingTextData[] = [];

  console.log('📊 mapAnalysisToFloatingText - Entry Type:', entryType);
  console.log('📊 mapAnalysisToFloatingText - Analysis Data:', analysisData);

  for (const configItem of config) {
    const value = (analysisData as any)[configItem.key];

    console.log(`📊 Processing field: ${configItem.key}, value:`, value);

    // Skip undefined values
    if (value === undefined || value === null) {
      console.log(`⚠️ Skipping ${configItem.key}: undefined or null`);
      continue;
    }

    // Skip empty arrays
    if (Array.isArray(value) && value.length === 0) {
      console.log(`⚠️ Skipping ${configItem.key}: empty array`);
      continue;
    }

    const formattedValue = configItem.formatter(value);
    console.log(`✅ Adding ${configItem.key}: ${formattedValue}`);

    items.push({
      key: configItem.key,
      label: configItem.label,
      value: formattedValue,
      preferredPosition: configItem.preferredPosition,
    });
  }

  // Sort by priority (highest first)
  return items.sort((a, b) => {
    const aPriority = config.find((c) => c.key === a.key)?.priority || 0;
    const bPriority = config.find((c) => c.key === b.key)?.priority || 0;
    return bPriority - aPriority;
  });
}

// Get editable fields for a given entry type
export function getEditableFields(entryType: 'food' | 'exercise'): string[] {
  const config =
    entryType === 'food' ? FOOD_DISPLAY_CONFIG : EXERCISE_DISPLAY_CONFIG;
  return config.filter((item) => item.isEditable).map((item) => item.key);
}

// Get field configuration for editing
export function getFieldConfig(
  key: string,
  entryType: 'food' | 'exercise',
): AnalysisDisplayConfig | null {
  const config =
    entryType === 'food' ? FOOD_DISPLAY_CONFIG : EXERCISE_DISPLAY_CONFIG;
  return config.find((item) => item.key === key) || null;
}

// Validate and format edited value
export function validateAndFormatEditedValue(
  key: string,
  value: string,
  entryType: 'food' | 'exercise',
): { isValid: boolean; formattedValue: any; error?: string } {
  const fieldConfig = getFieldConfig(key, entryType);

  if (!fieldConfig) {
    return {
      isValid: false,
      formattedValue: value,
      error: '알 수 없는 필드입니다.',
    };
  }

  try {
    switch (key) {
      case 'calories':
      case 'estimatedCalories':
      case 'duration': {
        const numValue = Number.parseFloat(value);
        if (Number.isNaN(numValue) || numValue < 0) {
          return {
            isValid: false,
            formattedValue: value,
            error: '0 이상의 숫자를 입력해주세요.',
          };
        }
        return { isValid: true, formattedValue: Math.round(numValue) };
      }

      case 'distance': {
        const numValue = Number.parseFloat(value);
        if (Number.isNaN(numValue) || numValue < 0) {
          return {
            isValid: false,
            formattedValue: value,
            error: '0 이상의 숫자를 입력해주세요.',
          };
        }
        // 거리는 소수점 1자리까지 허용
        return {
          isValid: true,
          formattedValue: Math.round(numValue * 10) / 10,
        };
      }

      case 'isHealthy': {
        const lowerValue = value.toLowerCase().trim();
        if (
          lowerValue === '건강함' ||
          lowerValue === 'true' ||
          lowerValue === '1'
        ) {
          return { isValid: true, formattedValue: true };
        }
        if (
          lowerValue === '주의 필요' ||
          lowerValue === 'false' ||
          lowerValue === '0'
        ) {
          return { isValid: true, formattedValue: false };
        }
        return {
          isValid: false,
          formattedValue: value,
          error: '건강함 또는 주의 필요를 입력해주세요.',
        };
      }

      case 'ingredients': {
        if (!value.trim()) {
          return {
            isValid: false,
            formattedValue: value,
            error: '재료를 입력해주세요.',
          };
        }
        // Split by comma and clean up, then create ingredient objects with default color
        const ingredientNames = value
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item.length > 0);
        const ingredients = ingredientNames.map((name) => ({
          name,
          color: 'teal', // 수동 입력시 기본 색상
        }));
        return { isValid: true, formattedValue: ingredients };
      }

      case 'mealType': {
        const validMealTypes = ['아침식사', '점심식사', '저녁식사', '간식'];
        const trimmedValue = value.trim();
        if (!validMealTypes.includes(trimmedValue)) {
          return {
            isValid: false,
            formattedValue: value,
            error: '아침식사, 점심식사, 저녁식사, 간식 중 하나를 입력해주세요.',
          };
        }
        return { isValid: true, formattedValue: trimmedValue };
      }

      case 'exerciseType': {
        if (!value.trim()) {
          return {
            isValid: false,
            formattedValue: value,
            error: '운동 종류를 입력해주세요.',
          };
        }
        return { isValid: true, formattedValue: value.trim() };
      }

      default: {
        // For other string fields
        if (!value.trim()) {
          return {
            isValid: false,
            formattedValue: value,
            error: '값을 입력해주세요.',
          };
        }
        return { isValid: true, formattedValue: value.trim() };
      }
    }
  } catch (error) {
    return {
      isValid: false,
      formattedValue: value,
      error: '입력 값을 처리하는 중 오류가 발생했습니다.',
    };
  }
}

// Get display options for specific fields (for dropdowns, etc.)
export function getFieldDisplayOptions(
  key: string,
  _entryType: 'food' | 'exercise',
): string[] | null {
  switch (key) {
    case 'mealType':
      return ['아침식사', '점심식사', '저녁식사', '간식'];

    case 'isHealthy':
      return ['건강함', '주의 필요'];

    case 'exerciseType':
      return [
        '달리기',
        '걷기',
        '사이클링',
        '수영',
        '웨이트 트레이닝',
        '요가',
        '필라테스',
        '테니스',
        '배드민턴',
        '축구',
        '농구',
        '등산',
        '계단 오르기',
        '줄넘기',
        '기타',
      ];

    default:
      return null;
  }
}

// Create updated analysis data with edited values
export function updateAnalysisData(
  originalData: GeminiFoodResponse | GeminiExerciseResponse,
  editedValues: Record<string, any>,
  entryType: 'food' | 'exercise',
): GeminiFoodResponse | GeminiExerciseResponse {
  const updatedData = { ...originalData };

  for (const [key, value] of Object.entries(editedValues)) {
    const validation = validateAndFormatEditedValue(
      key,
      String(value),
      entryType,
    );
    if (validation.isValid) {
      (updatedData as any)[key] = validation.formattedValue;
    }
  }

  return updatedData;
}

// Get summary text for analysis data (for accessibility)
export function getAnalysisSummary(
  analysisData: GeminiFoodResponse | GeminiExerciseResponse,
  entryType: 'food' | 'exercise',
): string {
  if (entryType === 'food') {
    const foodData = analysisData as GeminiFoodResponse;
    return `음식 분석 결과: ${foodData.mealType}, ${foodData.estimatedCalories}칼로리, ${foodData.isHealthy ? '건강함' : '주의 필요'}`;
  }
  const exerciseData = analysisData as GeminiExerciseResponse;
  return `운동 분석 결과: ${exerciseData.exerciseType}, ${exerciseData.duration}분, ${exerciseData.calories}칼로리 소모`;
}
