import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ImageCache } from '../utils/imageCache';
import { ImageMemoryManager } from '../utils/imageProcessing';

interface ImageBackgroundContainerProps {
  imageUri: string;
  children: React.ReactNode;
  overlayOpacity?: number;
  onImageLoad?: () => void;
  onImageError?: (error: any) => void;
  enableCompression?: boolean;
  cacheKey?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export function ImageBackgroundContainer({
  imageUri,
  children,
  overlayOpacity = 0.4,
  onImageLoad,
  onImageError,
  enableCompression = true,
  cacheKey,
}: ImageBackgroundContainerProps) {
  const [imageLoading, setImageLoading] = useState(!!imageUri);
  const [imageError, setImageError] = useState(!imageUri);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [processedImageUri, setProcessedImageUri] = useState<string | null>(null);
  const [memoryUsage, setMemoryUsage] = useState(ImageMemoryManager.getMemoryUsage());

  // Debug logging
  console.log('ImageBackgroundContainer - imageUri:', imageUri);

  // Check if imageUri is valid
  const isValidImageUri = (uri: string): boolean => {
    if (!uri) return false;
    // Check for common image URI patterns
    return uri.startsWith('file://') ||
      uri.startsWith('content://') ||
      uri.startsWith('http://') ||
      uri.startsWith('https://') ||
      uri.startsWith('data:image/');
  };

  // Process image with caching and compression
  useEffect(() => {
    if (!imageUri) {
      setImageError(true);
      setImageLoading(false);
      return;
    }

    if (!isValidImageUri(imageUri)) {
      console.log('ImageBackgroundContainer - Invalid imageUri format:', imageUri);
      setImageError(true);
      setImageLoading(false);
      return;
    }

    const processImage = async () => {
      try {
        setImageLoading(true);
        setImageError(false);

        const cached = await ImageCache.getCachedImage(imageUri, {
          enableCompression,
          cacheKey: cacheKey || imageUri,
          priority: 'high', // Background images are high priority
          maxWidth: screenWidth * 2, // Support high DPI
          maxHeight: screenHeight * 2,
          maxSizeKB: 2048 // 2MB limit for background images
        });

        setProcessedImageUri(cached.uri);
        setMemoryUsage(ImageMemoryManager.getMemoryUsage());

        console.log('ImageBackgroundContainer - Image processed:', {
          original: imageUri,
          processed: cached.uri,
          fromCache: cached.fromCache,
          size: (cached.size / 1024).toFixed(2) + 'KB'
        });

      } catch (error) {
        console.error('ImageBackgroundContainer - Image processing failed:', error);
        setImageError(true);
        setImageLoading(false);
        onImageError?.(error);
      }
    };

    processImage();
  }, [imageUri, enableCompression, cacheKey]);

  // Monitor memory usage
  useEffect(() => {
    const interval = setInterval(() => {
      setMemoryUsage(ImageMemoryManager.getMemoryUsage());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Release memory when component unmounts
      if (processedImageUri && processedImageUri !== imageUri) {
        // Only clear if we created a processed version
        ImageCache.clearImage(cacheKey || imageUri);
      }
    };
  }, [processedImageUri, imageUri, cacheKey]);

  const handleImageLoad = (event: any) => {
    const { width, height } = event.nativeEvent.source;
    setImageDimensions({ width, height });
    setImageLoading(false);
    onImageLoad?.();
  };

  const handleImageError = (error: any) => {
    console.log('ImageBackgroundContainer - Image load error:', error);
    console.log('ImageBackgroundContainer - Failed imageUri:', imageUri);
    setImageError(true);
    setImageLoading(false);
    onImageError?.(error);
  };

  // Calculate image display dimensions - width always fits screen, height maintains aspect ratio
  const getImageStyle = () => {
    if (!imageDimensions) {
      return {
        width: screenWidth,
        height: screenHeight,
      };
    }

    const imageAspectRatio = imageDimensions.width / imageDimensions.height;

    // Always fit width to screen width
    const displayWidth = screenWidth;
    // Calculate height to maintain aspect ratio
    const displayHeight = screenWidth / imageAspectRatio;

    return {
      width: displayWidth,
      height: displayHeight,
    };
  };

  const imageStyle = getImageStyle();

  if (imageError || !imageUri) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {!imageUri ? '이미지가 없습니다' : '이미지를 불러올 수 없습니다'}
          </Text>
          <Text style={styles.errorSubtext}>
            {!imageUri ? '이미지를 선택해 주세요' : '다시 시도해 주세요'}
          </Text>
        </View>
        <View style={[styles.overlay, { opacity: overlayOpacity }]} />
        {children}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background Image */}
      {processedImageUri && (
        <Image
          source={{ uri: processedImageUri }}
          style={[
            styles.backgroundImage,
            {
              width: screenWidth,
              height: imageStyle.height,
              top: (screenHeight - imageStyle.height) / 2.8,
            },
          ]}
          onLoad={handleImageLoad}
          onError={handleImageError}
          resizeMode="stretch"
        />
      )}

      {/* Memory Usage Indicator (Debug Mode) */}
      {__DEV__ && memoryUsage.percentage > 70 && (
        <View style={styles.memoryWarning}>
          <Text style={styles.memoryWarningText}>
            Memory: {memoryUsage.percentage.toFixed(0)}%
          </Text>
        </View>
      )}

      {/* Loading Indicator */}
      {imageLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>이미지 로딩 중...</Text>
        </View>
      )}

      {/* Dark Overlay for Text Readability */}
      <View style={[styles.overlay, { opacity: overlayOpacity }]} />

      {/* Children Content */}
      <View style={styles.contentContainer}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundImage: {
    position: 'absolute',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    zIndex: 2,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '500',
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A202C',
    zIndex: 2,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    color: '#A0AEC0',
    fontSize: 14,
    textAlign: 'center',
  },
  memoryWarning: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: 'rgba(255, 165, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 10,
  },
  memoryWarningText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});