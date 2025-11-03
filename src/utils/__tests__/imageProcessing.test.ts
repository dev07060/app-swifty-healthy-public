import {
  ImageMemoryManager,
  ImageProcessor,
  ImageValidator,
} from '../imageProcessing';

// Mock fetch for testing
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('ImageProcessor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ImageMemoryManager.reset();
  });

  describe('getImageFormat', () => {
    it('should correctly identify image formats', () => {
      expect(ImageProcessor.getImageFormat('test.jpg')).toBe('jpeg');
      expect(ImageProcessor.getImageFormat('test.jpeg')).toBe('jpeg');
      expect(ImageProcessor.getImageFormat('test.png')).toBe('png');
      expect(ImageProcessor.getImageFormat('test.webp')).toBe('webp');
      expect(ImageProcessor.getImageFormat('test.unknown')).toBe('unknown'); // returns actual extension
    });
  });

  describe('estimateMemoryUsage', () => {
    it('should calculate memory usage correctly', () => {
      const usage = ImageProcessor.estimateMemoryUsage(1000, 1000, 'jpeg');
      expect(usage).toBeGreaterThan(0);
      expect(typeof usage).toBe('number');
    });

    it('should account for PNG alpha channel', () => {
      const jpegUsage = ImageProcessor.estimateMemoryUsage(1000, 1000, 'jpeg');
      const pngUsage = ImageProcessor.estimateMemoryUsage(1000, 1000, 'png');
      expect(pngUsage).toBeGreaterThan(jpegUsage);
    });
  });

  describe('canProcessImage', () => {
    it('should allow processing small images', () => {
      const result = ImageProcessor.canProcessImage(100, 100);
      expect(result.canProcess).toBe(true);
      expect(result.estimatedMemory).toBeGreaterThan(0);
    });

    it('should reject very large images', () => {
      const result = ImageProcessor.canProcessImage(10000, 10000);
      expect(result.canProcess).toBe(false);
      expect(result.reason).toContain('too large');
    });
  });
});

describe('ImageValidator', () => {
  describe('validateFormat', () => {
    it('should validate supported formats', () => {
      const result = ImageValidator.validateFormat('test.jpg');
      expect(result.isValid).toBe(true);
      expect(result.format).toBe('jpeg');
    });

    it('should reject unsupported formats', () => {
      const result = ImageValidator.validateFormat('test.gif');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Unsupported format');
    });
  });
});

describe('ImageMemoryManager', () => {
  it('should track memory usage', () => {
    const initialUsage = ImageMemoryManager.getMemoryUsage();
    expect(initialUsage.current).toBe(0);

    ImageMemoryManager.trackMemoryUsage(1000);
    const updatedUsage = ImageMemoryManager.getMemoryUsage();
    expect(updatedUsage.current).toBe(1000);
  });

  it('should release memory', () => {
    ImageMemoryManager.reset(); // Ensure clean state
    ImageMemoryManager.trackMemoryUsage(1000);
    ImageMemoryManager.releaseMemory(500);
    const usage = ImageMemoryManager.getMemoryUsage();
    expect(usage.current).toBe(500);
  });

  it('should check memory availability', () => {
    expect(ImageMemoryManager.canAllocate(1000)).toBe(true);
  });
});
