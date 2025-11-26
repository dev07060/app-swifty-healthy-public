import { apiConfig, appSettings } from '../config';
import { GeminiAPIError } from './GeminiAPIClient'; // Import Error class from existing client to maintain compatibility
import type {
  GeminiExerciseResponse,
  GeminiFoodResponse,
  ProcessedImage,
} from '../types';
import { ImageMemoryManager } from '../utils/imageProcessing';
import { API_ERROR_MESSAGES } from './constants/gemini-api-constants';

// Types for Backend API requests
interface ImageAnalysisRequest {
  userKey: string;
  imageData: string;
  mimeType: string;
}

// HTTP request wrapper with timeout and error handling
class BackendHTTPClient {
  private readonly timeout: number = 60000; // 60 seconds (longer for backend processing)

  async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP Error ${response.status}`;
        let errorCode = 'HTTP_ERROR';

        try {
          // Backend sends error in { "message": "..." } or { "detail": "..." } format
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.detail || errorMessage;
          errorCode = errorData.code || errorCode;
        } catch {
          // Use default error message if JSON parsing fails
        }

        // Map backend status codes to GeminiAPIError
        if (response.status === 504) {
           throw new GeminiAPIError(
            API_ERROR_MESSAGES.TIMEOUT_ERROR,
            'TIMEOUT_ERROR',
            response.status
          );
        }

        throw new GeminiAPIError(errorMessage, errorCode, response.status, {
          responseText: errorText,
        });
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof GeminiAPIError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new GeminiAPIError(
            API_ERROR_MESSAGES.TIMEOUT_ERROR,
            'TIMEOUT_ERROR',
          );
        }

        throw new GeminiAPIError(
          API_ERROR_MESSAGES.NETWORK_ERROR(error.message),
          'NETWORK_ERROR',
        );
      }

      throw new GeminiAPIError(
        API_ERROR_MESSAGES.UNKNOWN_ERROR,
        'UNKNOWN_ERROR',
      );
    }
  }
}

export class BackendAPIClient {
  private httpClient: BackendHTTPClient;
  private readonly baseUrl: string;

  constructor() {
    this.httpClient = new BackendHTTPClient();
    // Use API_BASE_URL from config, removing trailing slash if present
    this.baseUrl = (apiConfig.baseUrl || 'http://127.0.0.1:8000').replace(/\/$/, '');
  }

  // Common image processing logic (Same as GeminiAPIClient)
  private async processImageFromUri(imageUri: string): Promise<ProcessedImage> {
    try {
      const imageResponse = await fetch(imageUri);
      if (!imageResponse.ok) {
        throw new GeminiAPIError(
          API_ERROR_MESSAGES.IMAGE_FETCH_ERROR(imageResponse.status),
          'IMAGE_FETCH_ERROR',
          imageResponse.status,
        );
      }

      const blob = await imageResponse.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64Data = result.split(',')[1] || result;
          resolve(base64Data);
        };
        reader.onerror = () =>
          reject(
            new GeminiAPIError(
              API_ERROR_MESSAGES.IMAGE_READ_ERROR,
              'IMAGE_READ_ERROR',
            ),
          );
        reader.readAsDataURL(blob);
      });

      return {
        base64,
        mimeType: blob.type || 'image/jpeg',
        size: blob.size,
      };
    } catch (error) {
      if (error instanceof GeminiAPIError) {
        throw error;
      }
      throw new GeminiAPIError(
        API_ERROR_MESSAGES.IMAGE_PROCESSING_ERROR(
          error instanceof Error ? error.message : 'Unknown error',
        ),
        'IMAGE_PROCESSING_ERROR',
      );
    }
  }

  private async analyzeImage<T>(
    imageUri: string,
    endpoint: string,
    analysisType: string,
  ): Promise<T> {
    let processedImage: ProcessedImage | null = null;

    try {
      if (appSettings.debugMode) {
        console.log(`Starting ${analysisType} analysis via Backend...`);
        console.log('Image URI:', imageUri);
      }

      // Image processing
      processedImage = await this.processImageFromUri(imageUri);

      // Memory tracking
      ImageMemoryManager.trackMemoryUsage(processedImage.size);

      // Request payload
      const requestPayload: ImageAnalysisRequest = {
        userKey: "test-user", // TODO: Replace with actual user key from auth context
        imageData: processedImage.base64,
        mimeType: processedImage.mimeType,
      };

      // API Request
      const result = await this.httpClient.request<T>(
        `${this.baseUrl}${endpoint}`,
        {
          method: 'POST',
          body: JSON.stringify(requestPayload),
        }
      );

      // Memory release
      ImageMemoryManager.releaseMemory(processedImage.size);

      if (appSettings.debugMode) {
        console.log(`${analysisType} analysis completed:`, result);
      }

      return result;
    } catch (error) {
      // Release memory on error
      if (processedImage) {
        ImageMemoryManager.releaseMemory(processedImage.size);
      }
      
      if (error instanceof GeminiAPIError) {
        throw error;
      }

      throw new GeminiAPIError(
        API_ERROR_MESSAGES.ANALYSIS_ERROR(
          analysisType,
          error instanceof Error ? error.message : 'Unknown error',
        ),
        'ANALYSIS_ERROR',
      );
    }
  }

  // Analyze exercise screenshot
  async analyzeExerciseScreenshot(
    imageUri: string,
  ): Promise<GeminiExerciseResponse> {
    return this.analyzeImage<GeminiExerciseResponse>(
      imageUri,
      '/api/analyze/exercise',
      'Exercise',
    );
  }

  // Analyze food photo
  async analyzeFoodPhoto(imageUri: string): Promise<GeminiFoodResponse> {
    return this.analyzeImage<GeminiFoodResponse>(
      imageUri,
      '/api/analyze/food',
      'Food',
    );
  }
}

// Export singleton instance
export const backendAPIClient = new BackendAPIClient();
