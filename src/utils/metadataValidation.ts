import type { ImageMetadata } from '../types';
import { getCurrentDate } from './dataTransformers';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  extractedDate?: string;
  metadata?: ImageMetadata;
}

/**
 * Photo metadata extracted from file path and current time
 */
export interface PhotoMetadata {
  datetime?: string;
  extractedFromFilename?: boolean;
  fallbackUsed?: boolean;
}

/**
 * Extracts datetime from file path or uses current time as fallback
 * Looks for timestamp patterns in file names or uses current time as last resort
 */
const extractDateTimeFromFilePath = (imagePath: string): string | null => {
  try {
    if (!imagePath) return null;

    // Extract filename from path
    const filename = imagePath.split('/').pop() || imagePath;

    // Look for timestamp patterns in filename
    // Common patterns: IMG_20240115_143022.jpg, 20240115_143022.jpg, etc.
    const timestampPatterns = [
      // IMG_YYYYMMDD_HHMMSS format
      /IMG_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/,
      // YYYYMMDD_HHMMSS format
      /(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/,
      // YYYY-MM-DD_HH-MM-SS format
      /(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})/,
      // YYYYMMDD format (date only)
      /(\d{4})(\d{2})(\d{2})/,
    ];

    for (const pattern of timestampPatterns) {
      const match = filename.match(pattern);
      if (match) {
        const [, year, month, day, hour = '12', minute = '00', second = '00'] =
          match;

        // Validate date components
        const yearNum = Number.parseInt(year || '0', 10);
        const monthNum = Number.parseInt(month || '0', 10);
        const dayNum = Number.parseInt(day || '0', 10);

        if (
          yearNum >= 2000 &&
          yearNum <= 2030 &&
          monthNum >= 1 &&
          monthNum <= 12 &&
          dayNum >= 1 &&
          dayNum <= 31
        ) {
          const datetime = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
          console.log('Extracted datetime from filename:', datetime);
          return datetime;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Failed to extract datetime from file path:', error);
    return null;
  }
};

/**
 * Extracts datetime from photo using filename patterns or current time
 * Returns the date when the photo was likely taken
 */
export const extractDateTimeFromPhoto = async (
  imagePath: string,
): Promise<{ datetime?: string; error?: string }> => {
  try {
    // Try to extract from filename first
    const filenameDateTime = extractDateTimeFromFilePath(imagePath);
    if (filenameDateTime) {
      console.log('Extracted datetime from filename:', filenameDateTime);
      return { datetime: filenameDateTime };
    }

    // Fallback to current time
    const now = new Date();
    const currentDateTime = now.toISOString();
    console.log('Using current datetime as fallback:', currentDateTime);
    return { datetime: currentDateTime };
  } catch (error) {
    console.error('Failed to extract datetime:', error);

    // Last resort - use current time
    const now = new Date();
    return {
      datetime: now.toISOString(),
      error: `Failed to extract datetime: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

/**
 * Extracts just the date part from datetime string
 * "2024-01-15T14:30:00" -> "2024-01-15"
 */
export const extractDateFromDateTime = (datetime: string): string | null => {
  try {
    if (!datetime) return null;

    // If it's already in YYYY-MM-DD format
    const dateMatch = datetime.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch && dateMatch[1]) {
      return dateMatch[1];
    }

    // Try parsing as Date and extract date part
    const date = new Date(datetime);
    if (!isNaN(date.getTime())) {
      const isoString = date.toISOString();
      const datePart = isoString.split('T')[0];
      return datePart || null;
    }

    return null;
  } catch {
    return null;
  }
};

/**
 * Validates food photo using filename patterns or current date
 * Always returns valid since we can't verify actual photo timestamp without EXIF
 */
export const validateFoodPhoto = async (
  imagePath: string,
): Promise<ValidationResult> => {
  try {
    // Try to extract datetime from filename or use current time
    const { datetime, error } = await extractDateTimeFromPhoto(imagePath);

    if (datetime) {
      const photoDate = extractDateFromDateTime(datetime);
      if (photoDate) {
        return {
          isValid: true, // Always valid since we can't verify actual timestamp
          extractedDate: photoDate,
          metadata: {
            timestamp: datetime,
            dateTime: datetime,
          },
        };
      }
    }

    // Fallback to current date
    return {
      isValid: true,
      extractedDate: getCurrentDate(),
      error: error || 'Using current date as fallback',
    };
  } catch (error) {
    return {
      isValid: true, // Still valid, just use current date
      extractedDate: getCurrentDate(),
      error: `Failed to validate photo: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

/**
 * Validates exercise screenshot using OCR text date validation
 * Since screenshots may not have reliable timestamp data, this function
 * validates dates extracted from OCR text content
 */
export const validateExerciseScreenshot = (
  dateFromAnalysis: string,
  currentDate?: string,
): ValidationResult => {
  try {
    const extractedDate = dateFromAnalysis || currentDate || getCurrentDate();

    return {
      isValid: true,
      extractedDate,
    };
  } catch (error) {
    return {
      isValid: false,
      error: `Failed to validate screenshot date: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

/**
 * Extracts date information from OCR text content
 * Looks for various date formats commonly found in fitness apps
 */
export const extractDateFromText = (text: string): string | null => {
  if (!text) return null;

  // Common date patterns to look for in fitness app screenshots
  const datePatterns = [
    // ISO format: 2024-01-15, 2024/01/15
    /(\d{4}[-/]\d{1,2}[-/]\d{1,2})/g,
    // US format: 01/15/2024, 1/15/2024
    /(\d{1,2}\/\d{1,2}\/\d{4})/g,
    // European format: 15/01/2024, 15.01.2024
    /(\d{1,2}[./]\d{1,2}[./]\d{4})/g,
    // Month day year: January 15, 2024, Jan 15, 2024
    /((?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4})/gi,
    // Day month year: 15 January 2024, 15 Jan 2024
    /(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})/gi,
  ];

  const foundDates: string[] = [];

  // Search for all date patterns
  for (const pattern of datePatterns) {
    const matches = text.match(pattern);
    if (matches) {
      foundDates.push(...matches);
    }
  }

  if (foundDates.length === 0) {
    return null;
  }

  // Try to parse each found date and convert to YYYY-MM-DD format
  for (const dateStr of foundDates) {
    const normalizedDate = normalizeDateString(dateStr);
    if (normalizedDate && isValidDateString(normalizedDate)) {
      return normalizedDate;
    }
  }

  return null;
};

/**
 * Month names mapping for parsing
 */
const MONTH_NAMES: Record<string, string> = {
  january: '01',
  jan: '01',
  february: '02',
  feb: '02',
  march: '03',
  mar: '03',
  april: '04',
  apr: '04',
  may: '05',
  june: '06',
  jun: '06',
  july: '07',
  jul: '07',
  august: '08',
  aug: '08',
  september: '09',
  sep: '09',
  october: '10',
  oct: '10',
  november: '11',
  nov: '11',
  december: '12',
  dec: '12',
} as const;

/**
 * Normalizes various date string formats to YYYY-MM-DD
 */
const normalizeDateString = (dateStr: string): string | null => {
  try {
    // Clean up the date string
    const cleaned = dateStr.trim().replace(/,/g, '');

    // Check for ISO format (YYYY-MM-DD or YYYY/MM/DD)
    const isoMatch = cleaned.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (isoMatch?.[1] && isoMatch[2] && isoMatch[3]) {
      const [, year, month, day] = isoMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Check for US format (MM/DD/YYYY or M/D/YYYY)
    const usMatch = cleaned.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (usMatch?.[1] && usMatch[2] && usMatch[3]) {
      const [, month, day, year] = usMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Check for European format (DD/MM/YYYY or DD.MM.YYYY)
    const euroMatch = cleaned.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/);
    if (euroMatch?.[1] && euroMatch[2] && euroMatch[3]) {
      const [, day, month, year] = euroMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Check for "Month DD, YYYY" or "Month DD YYYY"
    const monthDayYearMatch = cleaned
      .toLowerCase()
      .match(/(\w+)\s+(\d{1,2})\s+(\d{4})/);
    if (
      monthDayYearMatch?.[1] &&
      monthDayYearMatch[2] &&
      monthDayYearMatch[3]
    ) {
      const [, monthName, day, year] = monthDayYearMatch;
      const monthNum = MONTH_NAMES[monthName];
      if (monthNum) {
        return `${year}-${monthNum}-${day.padStart(2, '0')}`;
      }
    }

    // Check for "DD Month YYYY"
    const dayMonthYearMatch = cleaned
      .toLowerCase()
      .match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
    if (
      dayMonthYearMatch?.[1] &&
      dayMonthYearMatch[2] &&
      dayMonthYearMatch[3]
    ) {
      const [, day, monthName, year] = dayMonthYearMatch;
      const monthNum = MONTH_NAMES[monthName];
      if (monthNum) {
        return `${year}-${monthNum}-${day.padStart(2, '0')}`;
      }
    }

    return null;
  } catch {
    return null;
  }
};

/**
 * Validates if a date string is in valid YYYY-MM-DD format
 */
const isValidDateString = (dateStr: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) return false;

  const parsedDate = new Date(dateStr);
  return parsedDate.toISOString().split('T')[0] === dateStr;
};

/**
 * Checks if two date strings represent the same calendar date
 */
export const isSameDate = (date1: string, date2: string): boolean => {
  try {
    const d1 = new Date(date1);
    const d2 = new Date(date2);

    // Check if dates are valid
    if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) {
      return false;
    }

    const dateStr1 = d1.toISOString().split('T')[0];
    const dateStr2 = d2.toISOString().split('T')[0];
    return dateStr1 === dateStr2;
  } catch {
    return false;
  }
};

/**
 * Gets the difference in days between two dates
 */
export const getDaysDifference = (date1: string, date2: string): number => {
  try {
    const d1 = new Date(date1);
    const d2 = new Date(date2);

    // Check if dates are valid
    if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) {
      return 0;
    }

    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
};

/**
 * Validates if a date is within acceptable range (e.g., not too far in the past or future)
 */
export const isDateWithinAcceptableRange = (
  dateStr: string,
  maxDaysFromToday = 1,
  currentDate?: string,
): boolean => {
  try {
    // Validate the input date string first
    if (!isValidDateString(dateStr)) {
      return false;
    }

    const todayDate = currentDate || getCurrentDate();
    const daysDiff = getDaysDifference(dateStr, todayDate);
    return daysDiff <= maxDaysFromToday;
  } catch {
    return false;
  }
};

/**
 * Gets basic metadata from photo path (filename-based)
 * Returns minimal metadata without EXIF dependency
 */
export const getPhotoMetadata = async (
  imagePath: string,
): Promise<PhotoMetadata> => {
  try {
    const { datetime } = await extractDateTimeFromPhoto(imagePath);

    return {
      datetime: datetime || new Date().toISOString(),
      extractedFromFilename: !!extractDateTimeFromFilePath(imagePath),
      fallbackUsed: !extractDateTimeFromFilePath(imagePath),
    };
  } catch (error) {
    console.error('Failed to extract photo metadata:', error);
    return {
      datetime: new Date().toISOString(),
      fallbackUsed: true,
    };
  }
};

/**
 * Simple function to get just the datetime from a photo
 * Returns the most reliable datetime available (filename or current time)
 */
export const getPhotoDateTime = async (
  imagePath: string,
): Promise<string | null> => {
  const { datetime } = await extractDateTimeFromPhoto(imagePath);
  return datetime || null;
};

/**
 * Get photo date in YYYY-MM-DD format
 */
export const getPhotoDate = async (
  imagePath: string,
): Promise<string | null> => {
  const datetime = await getPhotoDateTime(imagePath);
  return datetime ? extractDateFromDateTime(datetime) : null;
};
