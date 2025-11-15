import { appSettings, geminiConfig } from '../config';
import type {
  GeminiAPIRequest,
  GeminiAPIResponse,
  GeminiExerciseResponse,
  GeminiFoodResponse,
  ProcessedImage,
} from '../types';
import { ImageMemoryManager } from '../utils/imageProcessing';
import {
  API_ERROR_MESSAGES,
  VALID_MEAL_TYPES,
  exerciseAnalysisPrompt,
  foodAnalysisPrompt,
} from './constants/gemini-api-constants';

// Error types for API client
export class GeminiAPIError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'GeminiAPIError';
  }
}

// HTTP request wrapper with timeout and error handling
class HTTPClient {
  private readonly timeout: number = 30000; // 30 seconds

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
        let errorMessage = API_ERROR_MESSAGES.HTTP_ERROR(
          response.status,
          response.statusText,
        );

        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error?.message || errorMessage;
        } catch {
          // Use default error message if JSON parsing fails
        }

        throw new GeminiAPIError(errorMessage, 'HTTP_ERROR', response.status, {
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

// Main Gemini API Client
export class GeminiAPIClient {
  private httpClient: HTTPClient;

  constructor() {
    this.httpClient = new HTTPClient();
  }

  private validateConfig(): void {
    // Validate configuration
    if (!geminiConfig.apiKey) {
      throw new GeminiAPIError(
        API_ERROR_MESSAGES.CONFIGURATION_ERROR('API key'),
        'CONFIGURATION_ERROR',
      );
    }

    if (!geminiConfig.apiUrl) {
      throw new GeminiAPIError(
        API_ERROR_MESSAGES.CONFIGURATION_ERROR('API URL'),
        'CONFIGURATION_ERROR',
      );
    }
  }

  // 공통 이미지 처리 로직
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

  // 공통 API 요청 로직
  private async makeAPIRequest(
    processedImage: ProcessedImage,
    prompt: string,
    currentDateTime?: string,
  ): Promise<GeminiAPIResponse> {
    // 현재 날짜와 시간 정보 추가
    const now = new Date();
    const dateTimeInfo = currentDateTime || now.toISOString();
    const dateInfo = dateTimeInfo.split('T')[0]; // YYYY-MM-DD
    const timeInfo = now.toLocaleTimeString('ko-KR', { hour12: false }); // HH:MM:SS
    
    const enhancedPrompt = `${prompt}

현재 날짜: ${dateInfo}
현재 시간: ${timeInfo}

위의 현재 날짜와 시간을 사용하여 응답의 date 필드를 설정해주세요.`;

    const request: GeminiAPIRequest = {
      contents: [
        {
          parts: [
            { text: enhancedPrompt },
            {
              inline_data: {
                mime_type: processedImage.mimeType,
                data: processedImage.base64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        topK: 32,
        topP: 1,
        maxOutputTokens: 1024,
      },
    };

    // apiKey가 undefined일 수 없음을 보장 (validateConfig에서 체크됨)
    const apiKey = geminiConfig.apiKey!;
    const apiUrl = geminiConfig.apiUrl!;

    return await this.httpClient.request<GeminiAPIResponse>(
      `${apiUrl}?key=${apiKey}`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      },
    );
  }

  // 공통 분석 로직
  private async analyzeImage<T>(
    imageUri: string,
    prompt: string,
    parseFunction: (response: GeminiAPIResponse) => T,
    analysisType: string,
  ): Promise<T> {
    this.validateConfig();
    let processedImage: ProcessedImage | null = null;

    try {
      if (appSettings.debugMode) {
        console.log(`Starting ${analysisType} analysis...`);
        console.log('Image URI:', imageUri);
      }

      // 이미지 처리
      processedImage = await this.processImageFromUri(imageUri);

      // 메모리 사용량 추적
      ImageMemoryManager.trackMemoryUsage(processedImage.size);

      // API 요청
      const response = await this.makeAPIRequest(processedImage, prompt);

      // 응답 파싱
      const result = parseFunction(response);

      // 메모리 해제
      ImageMemoryManager.releaseMemory(processedImage.size);

      return result;
    } catch (error) {
      // 에러 시에도 메모리 해제
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
    return this.analyzeImage(
      imageUri,
      exerciseAnalysisPrompt,
      this.parseExerciseResponse.bind(this),
      'Exercise',
    );
  }

  // Analyze food photo
  async analyzeFoodPhoto(imageUri: string): Promise<GeminiFoodResponse> {
    return this.analyzeImage(
      imageUri,
      foodAnalysisPrompt,
      this.parseFoodResponse.bind(this),
      'Food',
    );
  }

  // Convert HH:MM:SS duration to minutes
  private convertDurationToMinutes(duration: string): number {
    const parts = duration.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid duration format');
    }

    const hours = Number.parseInt(parts[0] || '0', 10);
    const minutes = Number.parseInt(parts[1] || '0', 10);
    const seconds = Number.parseInt(parts[2] || '0', 10);

    if (Number.isNaN(hours) || Number.isNaN(minutes) || Number.isNaN(seconds)) {
      throw new Error('Invalid duration values');
    }

    return hours * 60 + minutes + Math.round(seconds / 60);
  }

  // 공통 JSON 추출 로직
  private extractJSON(textContent: string): string {
    const jsonMatch =
      textContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ||
      textContent.match(/(\{[\s\S]*?\})/);

    if (!jsonMatch || !jsonMatch[1]) {
      throw new GeminiAPIError(
        API_ERROR_MESSAGES.JSON_EXTRACTION_ERROR,
        'JSON_EXTRACTION_ERROR',
        undefined,
        { textContent },
      );
    }

    return jsonMatch[1];
  }

  // 공통 응답 검증 로직
  private validateResponse(response: GeminiAPIResponse): string {
    if (!response.candidates || response.candidates.length === 0) {
      throw new GeminiAPIError(
        API_ERROR_MESSAGES.INVALID_RESPONSE_ERROR('candidates'),
        'INVALID_RESPONSE_ERROR',
        undefined,
        { response },
      );
    }

    const candidate = response.candidates[0];
    if (
      !candidate ||
      !candidate.content ||
      !candidate.content.parts ||
      candidate.content.parts.length === 0
    ) {
      throw new GeminiAPIError(
        API_ERROR_MESSAGES.INVALID_RESPONSE_ERROR('content'),
        'INVALID_RESPONSE_ERROR',
        undefined,
        { response },
      );
    }

    const textContent = candidate.content.parts[0]?.text;
    if (!textContent) {
      throw new GeminiAPIError(
        API_ERROR_MESSAGES.INVALID_RESPONSE_ERROR('text content'),
        'INVALID_RESPONSE_ERROR',
        undefined,
        { response },
      );
    }

    return textContent;
  }

  // Parse exercise response from Gemini API
  private parseExerciseResponse(
    response: GeminiAPIResponse,
  ): GeminiExerciseResponse {
    try {
      const textContent = this.validateResponse(response);
      const jsonString = this.extractJSON(textContent);
      const parsedData = JSON.parse(jsonString);

      // Validate required fields
      const requiredFields = ['exerciseType', 'duration', 'calories', 'date'];
      for (const field of requiredFields) {
        if (!(field in parsedData)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Validate data types and set defaults
      if (typeof parsedData.exerciseType !== 'string') {
        console.warn('exerciseType is not a string, setting default value');
        parsedData.exerciseType = '운동';
      }
      if (typeof parsedData.duration !== 'string') {
        console.warn(
          'duration is not a string, setting default value to "00:00:00"',
        );
        parsedData.duration = '00:00:00';
      }
      if (typeof parsedData.calories !== 'number') {
        console.warn('calories is not a number, setting default value to 0');
        parsedData.calories = 0;
      }
      if (typeof parsedData.date !== 'string') {
        console.warn('date is not a string, setting default value to today');
        parsedData.date = new Date().toISOString().split('T')[0];
      }
      // distance는 선택적 필드이므로 null이거나 number여야 함
      if (
        parsedData.distance !== null &&
        parsedData.distance !== undefined &&
        typeof parsedData.distance !== 'number'
      ) {
        throw new Error('distance must be a number or null');
      }
      // if (typeof parsedData.confidence !== 'number') {
      //   console.warn('confidence is not a number, setting default value to 0.5');
      //   parsedData.confidence = 0.5;
      // }

      // Convert duration from HH:MM:SS to minutes
      const durationMinutes = this.convertDurationToMinutes(
        parsedData.duration,
      );

      if (appSettings.debugMode) {
        console.log('Exercise analysis completed:', parsedData);
        console.log('Duration converted to minutes:', durationMinutes);
      }

      return {
        ...parsedData,
        duration: durationMinutes,
      } as GeminiExerciseResponse;
    } catch (error) {
      throw new GeminiAPIError(
        API_ERROR_MESSAGES.RESPONSE_PARSING_ERROR(
          'exercise',
          error instanceof Error ? error.message : 'Unknown error',
        ),
        'RESPONSE_PARSING_ERROR',
        undefined,
        { response },
      );
    }
  }

  // Parse food response from Gemini API
  private parseFoodResponse(response: GeminiAPIResponse): GeminiFoodResponse {
    try {
      const textContent = this.validateResponse(response);
      const jsonString = this.extractJSON(textContent);
      const parsedData = JSON.parse(jsonString);

      // Validate required fields
      const requiredFields = [
        'isHealthy',
        'ingredients',
        'estimatedCalories',
        'mealType',
        'date',
      ];
      for (const field of requiredFields) {
        if (!(field in parsedData)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Validate data types
      if (typeof parsedData.isHealthy !== 'boolean') {
        throw new Error('isHealthy must be a boolean');
      }
      if (!Array.isArray(parsedData.ingredients)) {
        throw new Error('ingredients must be an array');
      }
      // Validate each ingredient has name and color
      for (const ingredient of parsedData.ingredients) {
        if (typeof ingredient.name !== 'string') {
          throw new Error('Each ingredient must have a name (string)');
        }
        if (typeof ingredient.color !== 'string') {
          throw new Error('Each ingredient must have a color (string)');
        }
      }
      if (typeof parsedData.estimatedCalories !== 'number') {
        throw new Error('estimatedCalories must be a number');
      }
      if (typeof parsedData.mealType !== 'string') {
        throw new Error('mealType must be a string');
      }
      if (typeof parsedData.date !== 'string') {
        throw new Error('date must be a string');
      }

      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(parsedData.date)) {
        throw new Error('date must be in YYYY-MM-DD format');
      }

      // Validate meal type (한글과 영어 모두 허용)
      if (!VALID_MEAL_TYPES.includes(parsedData.mealType.toLowerCase())) {
        throw new Error(
          `mealType must be one of: ${VALID_MEAL_TYPES.join(', ')}`,
        );
      }

      // Ensure all ingredients have valid structure (already validated above)
      // No additional validation needed here

      console.log('✅ Food analysis completed:', JSON.stringify(parsedData, null, 2));
      console.log('✅ Ingredients array:', parsedData.ingredients);

      if (appSettings.debugMode) {
        console.log('Food analysis completed:', parsedData);
      }

      return parsedData as GeminiFoodResponse;
    } catch (error) {
      throw new GeminiAPIError(
        API_ERROR_MESSAGES.RESPONSE_PARSING_ERROR(
          'food',
          error instanceof Error ? error.message : 'Unknown error',
        ),
        'RESPONSE_PARSING_ERROR',
        undefined,
        { response },
      );
    }
  }
}

// Export singleton instance
export const geminiAPIClient = new GeminiAPIClient();
