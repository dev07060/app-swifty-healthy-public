# app-swifty-healthy

A React Native application for tracking health and fitness activities, built with the Toss Design System and GraniteJS.

## Project Overview

app-swifty-healthy is a mobile application that helps users monitor their health and fitness by allowing them to upload and analyze their exercise and food intake. The app uses the Gemini API to provide intelligent analysis of user-uploaded images, offering insights into their activities.

## Features

*   **Health Tracking:** The main screen provides a centralized view of the user's health activities, with options to add new entries for exercise and diet.
*   **Exercise Authentication:** Users can upload screenshots of their workouts. The app analyzes the image to extract relevant data, such as the date and duration of the exercise.
*   **Diet Authentication:** Users can upload photos of their meals. The app analyzes the food items to provide nutritional information and other relevant details.
*   **Enhanced Analysis:** After an image is uploaded, the app presents a detailed analysis screen with insights from the Gemini API.
*   **Recent Activity:** The main screen displays a list of recent health entries, giving users a quick overview of their latest activities.

## Tech Stack

*   **Framework:** React Native with GraniteJS
*   **UI:** Toss Design System for React Native (`@toss/tds-react-native`)
*   **State Management:** Zustand
*   **AI-Powered Analysis:** Gemini API
*   **Image Processing:** `@bam.tech/react-native-image-resizer`, `react-native-exif`
*   **Linting:** Biome
*   **Testing:** Jest

## Getting Started

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Run the development server:**
    ```bash
    npm run dev
    ```
3.  **Build the application:**
    ```bash
    npm run build
    ```

## Release Notes

### Version 0.0.1

This release introduces significant enhancements to the image handling and memory management systems, ensuring a more robust and performant user experience, especially in the enhanced analysis UI.

#### 1. Enhanced Image Cache System (`src/utils/imageCache.ts`)

*   **Intelligent Caching:** Implemented an LRU (Least Recently Used) eviction policy and time-based cache expiry to ensure efficient memory usage.
*   **Automatic Compression:** Images are now automatically compressed with configurable quality and size limits, reducing their memory footprint.
*   **Memory-Aware Processing:** The system now checks for available memory before performing image operations, preventing crashes due to low memory.
*   **Cache Statistics:** Added functionality to monitor cache hit rates and other performance metrics.
*   **Preloading Support:** Images can now be preloaded to improve user experience by reducing loading times.

#### 2. Updated ImageBackgroundContainer (`src/components/ImageBackgroundContainer.tsx`)

*   **Integrated Caching:** The background image container now leverages the enhanced image cache system, including support for compression.
*   **Memory Monitoring:** Integrated with the memory monitoring hook to provide visual warnings in debug mode when memory usage is high.
*   **Automatic Cleanup:** The component now automatically cleans up cached images when it unmounts.
*   **Performance Optimizations:** Added optimizations for high-DPI displays.

#### 3. Enhanced Memory Monitoring (`src/hooks/useImageMemoryMonitor.ts`)

*   **Real-time Tracking:** The hook now provides real-time memory tracking with configurable thresholds for warnings and critical alerts.
*   **Automatic Cleanup:** When memory usage becomes critical, the system now automatically triggers a cleanup process.
*   **Cache Performance Metrics:** The hook now exposes cache performance metrics, including hit rates.
*   **Preloading Management:** The preloading functionality is now managed with memory constraints to avoid excessive memory usage.

#### 4. Integration with Existing Systems

*   **`useImageProcessing` Hook:** The `useImageProcessing` hook has been enhanced to support the new caching system.
*   **App Lifecycle Integration:** The image cache is now integrated with the app's lifecycle to trigger cleanup on app state changes (e.g., when the app goes to the background).
*   **`ImageMemoryManager` Utilization:** The new systems now utilize the existing `ImageMemoryManager` for consistent memory tracking.

### Key Features Implemented:

*   ✅ Background image compression and caching logic
*   ✅ Memory usage monitoring integration
*   ✅ Existing `ImageMemoryManager` utilization
*   ✅ Automatic cleanup when memory thresholds are exceeded
*   ✅ Performance optimizations with cache hit tracking
*   ✅ Debug mode indicators for memory usage warnings
