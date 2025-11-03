import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { createFloatingTextEntrance, createPressAnimation } from '../utils/animationHelpers';

interface FloatingTextItemProps {
  label: string;
  value: string;
  position: { x: number; y: number };
  onPress: () => void;
  isEditable: boolean;
  animationDelay?: number;
  isBeingEdited?: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export function FloatingTextItem({
  label,
  value,
  position,
  onPress,
  isEditable,
  animationDelay = 0,
  isBeingEdited = false,
}: FloatingTextItemProps) {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;

  // Start entrance animation
  useEffect(() => {
    const entranceAnimation = createFloatingTextEntrance(
      fadeAnim,
      scaleAnim,
      translateYAnim,
      animationDelay
    );
    
    entranceAnimation.start();
  }, [fadeAnim, scaleAnim, translateYAnim, animationDelay]);

  // Press animation handlers
  const handlePressIn = () => {
    if (isEditable) {
      createPressAnimation(scaleAnim, true).start();
    }
  };

  const handlePressOut = () => {
    if (isEditable) {
      createPressAnimation(scaleAnim, false).start();
    }
  };
  // Calculate safe position to prevent text from going off-screen
  const getSafePosition = () => {
    const padding = 20;
    const estimatedWidth = Math.max(label.length, value.length) * 8 + 40; // Rough estimation
    const estimatedHeight = 60; // Fixed height for two-line text

    let safeX = position.x;
    let safeY = position.y;

    // Ensure text doesn't go beyond screen boundaries
    if (safeX + estimatedWidth > screenWidth - padding) {
      safeX = screenWidth - estimatedWidth - padding;
    }
    if (safeX < padding) {
      safeX = padding;
    }

    if (safeY + estimatedHeight > screenHeight - padding) {
      safeY = screenHeight - estimatedHeight - padding;
    }
    if (safeY < padding) {
      safeY = padding;
    }

    return { x: safeX, y: safeY };
  };

  const safePosition = getSafePosition();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          left: safePosition.x,
          top: safePosition.y,
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: translateYAnim },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.touchable,
          isBeingEdited && styles.editingTouchable,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!isEditable}
        activeOpacity={1} // We handle opacity with animations
      >
        <View style={styles.textContainer}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
        {isEditable && (
          <Animated.View 
            style={[
              styles.editIndicator,
              isBeingEdited && styles.editingIndicator,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Text style={styles.editIcon}>
              {isBeingEdited ? '📝' : '✏️'}
            </Text>
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
  touchable: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 140,
    maxWidth: 280,
  },
  textContainer: {
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#CBD5E0',
    marginBottom: 4,
    textAlign: 'center',
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    lineHeight: 22,
  },
  editIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#3182F6',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: {
    fontSize: 10,
  },
  editingTouchable: {
    borderColor: '#3182F6',
    borderWidth: 2,
    backgroundColor: 'rgba(49, 130, 246, 0.1)',
  },
  editingIndicator: {
    backgroundColor: '#F59E0B',
  },
});