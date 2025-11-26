# Health Tracker Backend API

This document outlines the API for the Health Tracker backend server. The server is responsible for storing exercise and food data that has been analyzed by the client.

## Overview

The client application uses the Gemini API to analyze images and extract structured data. This data is then sent to the backend server for storage.

## Authentication

Each request must include a `userKey` in the request body to identify the user.

## Endpoints

### 1. Log Exercise Data

Stores data for a single exercise session.

-   **URL**: `/api/log/exercise`
-   **Method**: `POST`
-   **Headers**:
    -   `Content-Type`: `application/json`
-   **Request Body**:

    The request body should be a JSON object containing the exercise data.

    ```json
    {
      "userKey": "<user-unique-key>",
      "exerciseType": "Running",
      "duration": 30,
      "calories": 300,
      "date": "2025-11-06",
      "distance": 5.2
    }
    ```

-   **Success Response (201 Created)**:

    The response body will be a JSON object containing the ID of the created entry.

    ```json
    {
      "id": "<entry-id>",
      "message": "Exercise entry created successfully"
    }
    ```

-   **Error Responses**:
    -   `400 Bad Request`: The request body is invalid.
    -   `500 Internal Server Error`: An error occurred on the server.

### 2. Log Food Data

Stores data for a single food entry.

-   **URL**: `/api/log/food`
-   **Method**: `POST`
-   **Headers**:
    -   `Content-Type`: `application/json`
-   **Request Body**:

    The request body should be a JSON object containing the food data.

    ```json
    {
      "userKey": "<user-unique-key>",
      "isHealthy": true,
      "mainIngredients": ["Chicken Breast", "Broccoli", "Quinoa"],
      "estimatedCalories": 450,
      "mealType": "Lunch",
      "date": "2025-11-06"
    }
    ```

-   **Success Response (201 Created)**:

    The response body will be a JSON object containing the ID of the created entry.

    ```json
    {
      "id": "<entry-id>",
      "message": "Food entry created successfully"
    }
    ```

-   **Error Responses**:
    -   `400 Bad Request`: The request body is invalid.
    -   `500 Internal Server Error`: An error occurred on the server.

### 3. Create User

Creates a new user.

-   **URL**: `/api/users`
-   **Method**: `POST`
-   **Headers**:
    -   `Content-Type`: `application/json`

-   **Request Body**:

    ```json
    {
      "userKey": "<user-unique-key>",
      "gender": "female",
      "ageRange": "20-29"
    }
    ```

-   **Success Response (201 Created)**:

    ```json
    {
      "userKey": "<user-unique-key>",
      "message": "User created successfully"
    }
    ```

-   **Error Responses**:
    -   `400 Bad Request`: The request body is invalid or the userKey already exists.
    -   `500 Internal Server Error`: An error occurred on the server.