# Secure Gemini Proxy Migration Update

**Date:** 2025-11-26
**Author:** Gemini CLI Agent
**Status:** Completed

## Overview

This update transitions the application from direct client-side Gemini API calls to a secure backend proxy architecture. This change eliminates the risk of exposing the Gemini API Key in the client application and allows for better request validation and control.

## Key Improvements

### 1. Security Enhancements
- **API Key Isolation:** The Gemini API Key is now stored securely on the backend server (FastAPI) and is never exposed to the client app.
- **Input Validation:** The backend enforces validation on image data (Base64 format, MIME type whitelist) and strict size limits (default 10MB) to prevent DoS attacks.
- **CORS Configuration:** `CORSMiddleware` has been added to the backend to control cross-origin requests.
- **Secure Logging:** Sensitive information, such as the API Key, is automatically redacted from server logs even during error scenarios.

### 2. Architecture Changes

**Before:**
```
Client App (React Native)  ---->  Google Gemini API
      (Holds API Key)
```

**After:**
```
Client App (React Native)  ---->  FastAPI Backend  ---->  Google Gemini API
   (No API Key needed)          (Holds API Key)
```

## Implementation Details

### Backend (FastAPI)
- **New Endpoints:**
  - `POST /api/analyze/exercise`: Analyzes exercise screenshots.
  - `POST /api/analyze/food`: Analyzes food photos.
- **Modules Implemented:**
  - `ImageProcessor`: Validates Base64 images and checks size/MIME types.
  - `GeminiService`: Handles communication with Google Gemini API securely.
  - `ResponseParser`: Parses and validates AI responses into structured data.
  - `PromptManager`: Manages prompt templates with dynamic datetime injection.
- **Testing:**
  - Added comprehensive property-based tests (`test_api_endpoints.py`) covering input validation, error handling, and concurrency.

### Client (React Native)
- **New Client Service:** `BackendAPIClient.ts` implemented to communicate with the proxy backend.
- **Feature Flag:** Added `USE_BACKEND_ANALYSIS` flag to `src/config/index.ts` to support gradual rollout.
- **Service Factory:** `AnalysisServiceFactory.ts` creates the appropriate client (Direct vs. Proxy) based on the feature flag.
- **Refactoring:** Updated `ExerciseUploadScreen` and `FoodUploadScreen` to use the factory instead of direct imports.

## How to Use

### 1. Backend Setup
Ensure the following environment variables are set in `swifty-backend-api/.env`:
```ini
GEMINI_API_KEY="your_actual_api_key"
GEMINI_API_URL="https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent"
MAX_IMAGE_SIZE_MB=10
```

Run the server:
```bash
cd swifty-backend-api
source .venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Client Configuration
Enable the backend proxy mode by setting the flag in the client's `.env` file (in the project root):
```ini
USE_BACKEND_ANALYSIS=true
API_BASE_URL=http://127.0.0.1:8000  # Or your backend server IP
```

**Note:** You must rebuild the native app (e.g., `npm run ios` or `npm run android`) after changing `.env` variables for `react-native-config` to pick up the changes.
