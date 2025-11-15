// Validation utilities for edit functionality

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedValue?: string;
}

/**
 * Validates and sanitizes edited field values
 */
export const validateEditedField = (
  fieldKey: string,
  value: string,
  _entryType: 'food' | 'exercise',
): ValidationResult => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return {
      isValid: false,
      error: '값을 입력해주세요.',
    };
  }

  switch (fieldKey) {
    case 'estimatedCalories':
    case 'calories':
      return validateCalories(trimmedValue);

    case 'exerciseType':
      return validateExerciseType(trimmedValue);

    case 'duration':
      return validateDuration(trimmedValue);

    case 'mainIngredients':
      return validateIngredients(trimmedValue);

    case 'mealType':
      return validateMealType(trimmedValue);

    case 'isHealthy':
      return validateHealthyStatus(trimmedValue);

    default:
      // For other fields, just basic string validation
      return {
        isValid: true,
        sanitizedValue: trimmedValue,
      };
  }
};

/**
 * Validates calories input
 */
const validateCalories = (value: string): ValidationResult => {
  const numValue = Number(value);

  if (Number.isNaN(numValue)) {
    return {
      isValid: false,
      error: '숫자를 입력해주세요.',
    };
  }

  if (numValue < 0) {
    return {
      isValid: false,
      error: '0 이상의 값을 입력해주세요.',
    };
  }

  if (numValue > 10000) {
    return {
      isValid: false,
      error: '너무 큰 값입니다. 10,000 이하로 입력해주세요.',
    };
  }

  return {
    isValid: true,
    sanitizedValue: Math.round(numValue).toString(),
  };
};

/**
 * Validates exercise type input
 */
const validateExerciseType = (value: string): ValidationResult => {
  if (value.length < 2) {
    return {
      isValid: false,
      error: '운동 종류는 2글자 이상 입력해주세요.',
    };
  }

  if (value.length > 50) {
    return {
      isValid: false,
      error: '운동 종류는 50글자 이하로 입력해주세요.',
    };
  }

  // Remove special characters except Korean, English, numbers, spaces, and hyphens
  const sanitized = value.replace(/[^\w\s가-힣-]/g, '').trim();

  return {
    isValid: true,
    sanitizedValue: sanitized,
  };
};

/**
 * Validates duration input (supports various formats)
 */
const validateDuration = (value: string): ValidationResult => {
  // Try to parse different duration formats
  const minutes = parseDurationToMinutes(value);

  if (minutes === null) {
    return {
      isValid: false,
      error: '올바른 시간 형식을 입력해주세요. (예: 30분, 1시간 30분)',
    };
  }

  if (minutes <= 0) {
    return {
      isValid: false,
      error: '0보다 큰 시간을 입력해주세요.',
    };
  }

  if (minutes > 1440) {
    // 24 hours
    return {
      isValid: false,
      error: '24시간 이하로 입력해주세요.',
    };
  }

  return {
    isValid: true,
    sanitizedValue: formatMinutesToDuration(minutes),
  };
};

/**
 * Validates ingredients input
 */
const validateIngredients = (value: string): ValidationResult => {
  // Split by comma and validate each ingredient
  const mainIngredients = value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  if (mainIngredients.length === 0) {
    return {
      isValid: false,
      error: '최소 1개의 재료를 입력해주세요.',
    };
  }

  if (mainIngredients.length > 20) {
    return {
      isValid: false,
      error: '재료는 20개 이하로 입력해주세요.',
    };
  }

  // Validate each ingredient
  for (const ingredient of mainIngredients) {
    if (ingredient.length < 1) {
      return {
        isValid: false,
        error: '빈 재료명은 입력할 수 없습니다.',
      };
    }

    if (ingredient.length > 30) {
      return {
        isValid: false,
        error: '각 재료명은 30글자 이하로 입력해주세요.',
      };
    }
  }

  return {
    isValid: true,
    sanitizedValue: mainIngredients.join(', '),
  };
};

/**
 * Validates meal type input
 */
const validateMealType = (value: string): ValidationResult => {
  const validMealTypes = [
    '아침',
    '점심',
    '저녁',
    '간식',
    'breakfast',
    'lunch',
    'dinner',
    'snack',
  ];
  const lowerValue = value.toLowerCase();

  if (!validMealTypes.some((type) => type.toLowerCase() === lowerValue)) {
    return {
      isValid: false,
      error: '올바른 식사 종류를 입력해주세요. (아침, 점심, 저녁, 간식)',
    };
  }

  return {
    isValid: true,
    sanitizedValue: value,
  };
};

/**
 * Validates healthy status input
 */
const validateHealthyStatus = (value: string): ValidationResult => {
  const lowerValue = value.toLowerCase();
  const validValues = [
    '건강함',
    '건강하지 않음',
    'healthy',
    'unhealthy',
    'true',
    'false',
    '예',
    '아니오',
  ];

  if (!validValues.some((val) => val.toLowerCase() === lowerValue)) {
    return {
      isValid: false,
      error: '건강함 또는 건강하지 않음을 선택해주세요.',
    };
  }

  return {
    isValid: true,
    sanitizedValue: value,
  };
};

/**
 * Parses duration string to minutes
 */
const parseDurationToMinutes = (duration: string): number | null => {
  // Remove extra spaces
  const cleaned = duration.replace(/\s+/g, ' ').trim();

  // Try different patterns
  const patterns = [
    /^(\d+)분$/, // "30분"
    /^(\d+)시간$/, // "1시간"
    /^(\d+)시간\s*(\d+)분$/, // "1시간 30분"
    /^(\d+):\s*(\d+)$/, // "1:30"
    /^(\d+)h\s*(\d+)m$/i, // "1h 30m"
    /^(\d+)\s*hours?\s*(\d+)\s*minutes?$/i, // "1 hour 30 minutes"
  ];

  // Try each pattern
  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];
    if (!pattern) continue;

    const match = cleaned.match(pattern);
    if (match) {
      switch (i) {
        case 0: // Just minutes
          return Number.parseInt(match[1] || '0', 10);

        case 1: // Just hours
          return Number.parseInt(match[1] || '0', 10) * 60;

        case 2: // Hours and minutes (Korean)
        case 3: // HH:MM format
        case 4: // English format with h/m
        case 5: {
          // Full English format
          const hours = Number.parseInt(match[1] || '0', 10);
          const minutes = Number.parseInt(match[2] || '0', 10);
          return hours * 60 + minutes;
        }
      }
    }
  }

  return null;
};

/**
 * Formats minutes to Korean duration string
 */
const formatMinutesToDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}분`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}시간`;
  }

  return `${hours}시간 ${remainingMinutes}분`;
};

/**
 * Gets field options for multiselect fields
 */
export const getFieldOptions = (
  fieldKey: string,
  _entryType: 'food' | 'exercise',
): string[] => {
  switch (fieldKey) {
    case 'mealType':
      return ['아침', '점심', '저녁', '간식'];

    case 'isHealthy':
      return ['건강함', '건강하지 않음'];

    case 'exerciseType':
      return [
        '걷기',
        '달리기',
        '자전거',
        '수영',
        '요가',
        '필라테스',
        '웨이트 트레이닝',
        '축구',
        '농구',
        '테니스',
        '배드민턴',
        '등산',
        '계단 오르기',
        '스트레칭',
        '댄스',
        '기타',
      ];

    default:
      return [];
  }
};

/**
 * Determines field type for the edit overlay
 */
export const getFieldType = (
  fieldKey: string,
): 'text' | 'number' | 'multiselect' => {
  switch (fieldKey) {
    case 'estimatedCalories':
    case 'calories':
      return 'number';

    case 'mealType':
    case 'isHealthy':
    case 'exerciseType':
      return 'multiselect';

    default:
      return 'text';
  }
};

/**
 * Gets user-friendly field label
 */
export const getFieldLabel = (fieldKey: string): string => {
  const labels: Record<string, string> = {
    estimatedCalories: '칼로리',
    calories: '소모 칼로리',
    exerciseType: '운동 종류',
    duration: '운동 시간',
    mainIngredients: '주요 재료',
    mealType: '식사 종류',
    isHealthy: '건강 상태',
  };

  return labels[fieldKey] || fieldKey;
};
