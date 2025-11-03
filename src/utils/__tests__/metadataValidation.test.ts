import {
  extractDateFromText,
  getDaysDifference,
  isDateWithinAcceptableRange,
  isSameDate,
  validateExerciseScreenshot,
} from '../metadataValidation';

// Mock react-native-exif since it requires native linking
jest.mock('react-native-exif', () => ({
  getExif: jest.fn(),
}));

describe('MetadataValidation', () => {
  const mockCurrentDate = '2024-01-15';

  describe('validateExerciseScreenshot', () => {
    it('should validate screenshot with current date', () => {
      const ocrText = `
        Today's Workout - January 15, 2024
        Running: 30 minutes
        Calories burned: 300
      `;

      const result = validateExerciseScreenshot(ocrText, mockCurrentDate);

      expect(result.isValid).toBe(true);
      expect(result.extractedDate).toBe(mockCurrentDate);
      expect(result.error).toBeUndefined();
    });

    it('should reject screenshot with past date', () => {
      const ocrText = `
        Yesterday's Workout - January 14, 2024
        Running: 30 minutes
        Calories burned: 300
      `;

      const result = validateExerciseScreenshot(ocrText, mockCurrentDate);

      expect(result.isValid).toBe(false);
      expect(result.extractedDate).toBe('2024-01-14');
      expect(result.error).toContain("Screenshot must show today's date");
    });

    it('should reject screenshot with no date found', () => {
      const ocrText = `
        Running workout
        30 minutes
        300 calories
      `;

      const result = validateExerciseScreenshot(ocrText, mockCurrentDate);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('No valid date found in screenshot');
    });

    it('should reject empty OCR text', () => {
      const result = validateExerciseScreenshot('', mockCurrentDate);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('No text content found in screenshot');
    });
  });

  describe('extractDateFromText', () => {
    it('should extract ISO format dates', () => {
      const text = 'Workout on 2024-01-15 was great!';
      const result = extractDateFromText(text);
      expect(result).toBe('2024-01-15');
    });

    it('should extract US format dates', () => {
      const text = 'Workout on 01/15/2024 was great!';
      const result = extractDateFromText(text);
      expect(result).toBe('2024-01-15');
    });

    it('should extract month name format dates', () => {
      const text = 'Workout on January 15, 2024 was great!';
      const result = extractDateFromText(text);
      expect(result).toBe('2024-01-15');
    });

    it('should extract abbreviated month format dates', () => {
      const text = 'Workout on Jan 15, 2024 was great!';
      const result = extractDateFromText(text);
      expect(result).toBe('2024-01-15');
    });

    it('should return null for text with no dates', () => {
      const text = 'Great workout today!';
      const result = extractDateFromText(text);
      expect(result).toBeNull();
    });

    it('should return null for empty text', () => {
      const result = extractDateFromText('');
      expect(result).toBeNull();
    });
  });

  describe('isSameDate', () => {
    it('should return true for same dates', () => {
      const result = isSameDate('2024-01-15', '2024-01-15');
      expect(result).toBe(true);
    });

    it('should return false for different dates', () => {
      const result = isSameDate('2024-01-15', '2024-01-16');
      expect(result).toBe(false);
    });

    it('should handle different date formats', () => {
      const result = isSameDate('2024-01-15T10:00:00Z', '2024-01-15T15:30:00Z');
      expect(result).toBe(true);
    });

    it('should return false for invalid dates', () => {
      const result = isSameDate('invalid-date', '2024-01-15');
      expect(result).toBe(false);
    });
  });

  describe('getDaysDifference', () => {
    it('should calculate difference between dates', () => {
      const result = getDaysDifference('2024-01-15', '2024-01-17');
      expect(result).toBe(2);
    });

    it('should return absolute difference', () => {
      const result = getDaysDifference('2024-01-17', '2024-01-15');
      expect(result).toBe(2);
    });

    it('should return 0 for same dates', () => {
      const result = getDaysDifference('2024-01-15', '2024-01-15');
      expect(result).toBe(0);
    });

    it('should return 0 for invalid dates', () => {
      const result = getDaysDifference('invalid-date', '2024-01-15');
      expect(result).toBe(0);
    });
  });

  describe('isDateWithinAcceptableRange', () => {
    it('should return true for current date', () => {
      const result = isDateWithinAcceptableRange(
        '2024-01-15',
        1,
        mockCurrentDate,
      );
      expect(result).toBe(true);
    });

    it('should return true for date within range', () => {
      const result = isDateWithinAcceptableRange(
        '2024-01-14',
        2,
        mockCurrentDate,
      );
      expect(result).toBe(true);
    });

    it('should return false for date outside range', () => {
      const result = isDateWithinAcceptableRange(
        '2024-01-10',
        1,
        mockCurrentDate,
      );
      expect(result).toBe(false);
    });

    it('should return false for invalid date', () => {
      const result = isDateWithinAcceptableRange(
        'invalid-date',
        1,
        mockCurrentDate,
      );
      expect(result).toBe(false);
    });
  });
});
