/**
 * TypeScript types for Toss Cert Authentication API.
 * Matches backend toss_auth_models.py types.
 */

// Request types
export interface TossAuthInitRequest {
  authorizationCode: string;
}

// Decrypted user data from backend (simplified for now)
export interface TossUserData {
  name: string;
  // TODO: Add other fields when encryption is properly implemented
  // ci: string;
  // birthday: string;
  // gender: 'MALE' | 'FEMALE';
  // nationality: 'LOCAL' | 'FOREIGNER';
  // di: string;
  // ageGroup: 'ADULT' | 'MINOR';
}

// Backend response types
export interface TossAuthRequestResponse {
  txId: string;
  requestedAt: string;
}

export interface TossAuthStatusResponse {
  txId: string;
  status: 'REQUESTED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
  requestedAt: string;
}

export interface TossAuthResponse {
  txId: string;
  userData: TossUserData;
  signature: string;
  completedAt: string;
}

// Error types
export interface TossAuthError {
  message: string;
  code?: string;
  statusCode?: number;
}
