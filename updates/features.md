# Features

This document provides a detailed overview of the key features in the app-swifty-healthy application, focusing on how data is saved and utilized.

## Data Flow: From Upload to Storage

The core feature of the application is the AI-powered analysis of health data. Here's a step-by-step breakdown of the data flow:

1.  **Image Upload:** The user uploads an image of their meal (food) or workout summary (exercise) through the "Food Upload" or "Exercise Upload" screens.
2.  **AI Analysis:** The uploaded image is sent to the Google Gemini API for analysis. The API returns a structured JSON object containing detailed information about the food or exercise.
3.  **Enhanced Analysis Screen:** The user is presented with an "Enhanced Analysis" screen where they can review, edit, and confirm the data extracted by the AI.
4.  **Data Persistence:** Upon confirmation, the data is saved to the device's local storage.

## Saving Food and Exercise Data

Data persistence is handled by a `zustand` store, specifically `useHealthTrackerStore`.

*   **Actions:** The store exposes `addExerciseEntry` and `addFoodEntry` actions to save new entries.
*   **Data Structure:** Each entry is an object containing the analysis results from the Gemini API, along with a unique `id` and a `createdAt` timestamp.
*   **Local Storage:** The `zustand/persist` middleware is used to automatically save the entire `entries` array to the device's `AsyncStorage`. This ensures that the user's data is preserved between app sessions.

## Reading and Utilizing Data

The saved health data is read from the `useHealthTrackerStore` to power various features throughout the application.

### Current Features

*   **Recent Activity:** The main screen displays a list of the user's most recent entries. This is achieved by reading the `entries` array from the store, sorting it by date, and displaying the top 5 entries.

### Future and Planned Features

The data architecture is designed to support a rich set of features for data visualization and analysis. The following features are planned for future development:

*   **Weekly Reports:** A dedicated "Reports" screen will provide users with a weekly summary of their activities. The `getWeeklyStats` selector in the `healthTracker` store is already implemented to support this feature. It calculates statistics such as:
    *   Total calories burned vs. consumed.
    *   Number of exercise and food entries.
    *   Percentage of healthy vs. unhealthy meals.
*   **Data Visualization:** The reports screen will feature charts and graphs to visualize the user's progress over time. This will help users to identify trends and patterns in their health habits.
*   **Date Range Filtering:** The `getEntriesByDateRange` selector allows for fetching data within a specific date range. This will be used to power features like a calendar view or custom date range reports.
*   **Personalized Insights:** In the future, the collected data could be used to provide personalized insights and recommendations to the user, further enhancing the value of the application.
