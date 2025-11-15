import {
  extractDateFromText,
  extractDateTimeFromPhoto,
  getDaysDifference,
  isDateWithinAcceptableRange,
  isSameDate,
  validateExerciseScreenshot,
  validateFoodPhoto,
} from '../metadataValidation';
describe('MetadataValidation', () => {
  const mockCurrentDate = '2024-01-15';
  describe('validateFoodPhoto', () => {
    it('should validate photo and return current date as fallback', async () => {
      const result = await validateFoodPhoto('/path/to/photo.jpg');
      expect(result.isValid).toBe(true);
      expect(result.extractedDate).toBeDefined();
    });
    it('should extract date from filename if available', async () => {
      const result = await validateFoodPhoto(
        '/path/to/IMG_20240115_143022.jpg',
      );
      expect(result.isValid).toBe(true);
      expect(result.extractedDate).toBe('2024-01-15');
    });
  });
  describe('extractDateTimeFromPhoto', () => {
    it('should extract datetime from filename pattern', async () => {
      const result = await extractDateTimeFromPhoto(
        '/path/to/IMG_20240115_143022.jpg',
      );
      expect(result.datetime).toBe('2024-01-15T14:30:22');
      expect(result.error).toBeUndefined();
    });
    it('should use current time as fallback', async () => {
      const result = await extractDateTimeFromPhoto('/path/to/photo.jpg');
      expect(result.datetime).toBeDefined();
      expect(new Date(result.datetime).getTime()).toBeCloseTo(Date.now(), -3); // Within 1 second
    });
    it('should handle various filename patterns', async () => {
      const testCases = [
        {
          path: '/path/to/20240115_143022.jpg',
          expected: '2024-01-15T14:30:22',
        },
        {
          path: '/path/to/2024-01-15_14-30-22.jpg',
          expected: '2024-01-15T14:30:22',
        },
        { path: '/path/to/20240115.jpg', expected: '2024-01-15T12:00:00' },
      ];
      for (const testCase of testCases) {
        const result = await extractDateTimeFromPhoto(testCase.path);
        expect(result.datetime).toBe(testCase.expected);
      }
    });
  });
  describe('validateExerciseScreenshot', () => {
    it('should validate screenshot with provided date', () => {
      const result = validateExerciseScreenshot(mockCurrentDate);
      expect(result.isValid).toBe(true);
      expect(result.extractedDate).toBe(mockCurrentDate);
      expect(result.error).toBeUndefined();
    });
    it('should use current date as fallback', () => {
      const result = validateExerciseScreenshot('');
      expect(result.isValid).toBe(true);
      expect(result.extractedDate).toBeDefined();
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
