/**
 * Toss Authentication API Client
 * Handles communication with backend Toss auth endpoints
 */

import { apiConfig } from '../config';
import type {
  TossAuthError,
  TossAuthRequestResponse,
  TossAuthResponse,
  TossAuthStatusResponse,
} from '../types/tossAuth';

class TossAuthAPIClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Request authentication - gets txId from backend
   */
  async requestAuthentication(): Promise<TossAuthRequestResponse> {
    console.log('🔐 Requesting Toss authentication...');
    
    try {
      // Add 10s timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${this.baseUrl}/api/toss-auth/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      if (!response.ok) {
        let errorDetail = 'Authentication request failed';
        try {
            const error = await response.json();
            errorDetail = error.detail || JSON.stringify(error);
        } catch (e) {
            // If JSON parse fails, use status text
            errorDetail = `Server returned ${response.status}: ${response.statusText}`;
            const text = await response.text();
            console.log('❌ Non-JSON error response:', text);
        }
        console.error('❌ Auth request failed:', errorDetail);
        throw this.createError(errorDetail, response.status);
      }

      const data = await response.json();
      console.log('✅ Auth request successful:', data.txId);
      return data;
    } catch (error) {
      console.error('❌ Auth request error:', error);
      if (error instanceof Error) {
          if (error.name === 'AbortError') {
              throw this.createError('Request timed out', 408);
          }
          if ('statusCode' in error) {
            throw error;
          }
      }
      throw this.createError(error instanceof Error ? error.message : 'Network error during authentication request');
    }
  }

  /**
   * Check authentication status
   */
  async checkAuthStatus(txId: string): Promise<TossAuthStatusResponse> {
    console.log(`🔐 Checking auth status for txId: ${txId}`);
    
    try {
      const response = await fetch(`${this.baseUrl}/api/toss-auth/status/${txId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Status check failed:', error);
        throw this.createError(error.detail || 'Status check failed', response.status);
      }

      const data = await response.json();
      console.log(`✅ Auth status: ${data.status}`);
      return data;
    } catch (error) {
      console.error('❌ Status check error:', error);
      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }
      throw this.createError('Network error during status check');
    }
  }

  /**
   * Get authentication result with user data
   */
  async getAuthResult(txId: string): Promise<TossAuthResponse> {
    console.log(`🔐 Getting auth result for txId: ${txId}`);
    
    try {
      const response = await fetch(`${this.baseUrl}/api/toss-auth/result/${txId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Result retrieval failed:', error);
        throw this.createError(error.detail || 'Failed to get result', response.status);
      }

      const data = await response.json();
      console.log('✅ Auth result retrieved successfully');
      console.log('👤 User data:', {
        name: data.userData.name,
        gender: data.userData.gender,
        ageGroup: data.userData.ageGroup,
      });
      return data;
    } catch (error) {
      console.error('❌ Result retrieval error:', error);
      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }
      throw this.createError('Network error during result retrieval');
    }
  }

  /**
   * Poll for authentication completion
   * Checks status every `interval` ms, up to `maxAttempts` times
   */
  async pollForCompletion(
    txId: string,
    maxAttempts: number = 60,
    interval: number = 2000
  ): Promise<TossAuthResponse> {
    console.log(`🔄 Polling for auth completion (max ${maxAttempts} attempts)`);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const status = await this.checkAuthStatus(txId);
        
        if (status.status === 'COMPLETED') {
          console.log('✅ Auth completed, fetching result...');
          return await this.getAuthResult(txId);
        }
        
        if (status.status === 'EXPIRED') {
          throw this.createError('Authentication expired. Please try again.', 408);
        }
        
        console.log(`⏳ Status: ${status.status}, attempt ${attempt}/${maxAttempts}`);
        
        // Wait before next check
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, interval));
        }
      } catch (error) {
        // If it's a status check error (not timeout/expired), retry
        if (error instanceof Error && 'statusCode' in error) {
          const authError = error as TossAuthError;
          if (authError.statusCode === 408) {
            throw error; // Don't retry on timeout
          }
        }
        console.warn(`⚠️ Status check failed, attempt ${attempt}/${maxAttempts}`);
        
        if (attempt === maxAttempts) {
          throw error;
        }
        
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
    
    throw this.createError('Authentication timeout. Please try again.', 408);
  }

  private createError(message: string, statusCode?: number): TossAuthError {
    const error: TossAuthError = {
      message,
      statusCode,
    };
    return error as Error & TossAuthError;
  }
}

// Export singleton instance
export const tossAuthClient = new TossAuthAPIClient(apiConfig.baseUrl);
