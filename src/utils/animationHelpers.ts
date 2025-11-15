import { Animated, Easing } from 'react-native';

// Animation presets for consistent behavior
export const AnimationPresets = {
  // Entrance animations
  fadeIn: (animatedValue: Animated.Value, duration = 600) =>
    Animated.timing(animatedValue, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }),

  scaleIn: (animatedValue: Animated.Value) =>
    Animated.spring(animatedValue, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }),

  slideUp: (animatedValue: Animated.Value, duration = 500) =>
    Animated.timing(animatedValue, {
      toValue: 0,
      duration,
      easing: Easing.out(Easing.back(1.2)),
      useNativeDriver: true,
    }),

  // Press animations
  pressIn: (animatedValue: Animated.Value) =>
    Animated.spring(animatedValue, {
      toValue: 0.95,
      tension: 150,
      friction: 4,
      useNativeDriver: true,
    }),

  pressOut: (animatedValue: Animated.Value) =>
    Animated.spring(animatedValue, {
      toValue: 1,
      tension: 150,
      friction: 4,
      useNativeDriver: true,
    }),

  // Exit animations
  fadeOut: (animatedValue: Animated.Value, duration = 300) =>
    Animated.timing(animatedValue, {
      toValue: 0,
      duration,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }),

  scaleOut: (animatedValue: Animated.Value, duration = 300) =>
    Animated.timing(animatedValue, {
      toValue: 0.3,
      duration,
      easing: Easing.in(Easing.back(1.2)),
      useNativeDriver: true,
    }),
};

// Create staggered entrance animation for multiple items
export function createStaggeredEntrance(
  items: Array<{
    fadeAnim: Animated.Value;
    scaleAnim: Animated.Value;
    translateYAnim: Animated.Value;
  }>,
  staggerDelay = 150,
): Animated.CompositeAnimation {
  const animations = items.map((item, index) =>
    Animated.sequence([
      Animated.delay(index * staggerDelay),
      Animated.parallel([
        AnimationPresets.fadeIn(item.fadeAnim),
        AnimationPresets.scaleIn(item.scaleAnim),
        AnimationPresets.slideUp(item.translateYAnim),
      ]),
    ]),
  );

  return Animated.stagger(0, animations);
}

// Create entrance animation for a single floating text item
export function createFloatingTextEntrance(
  fadeAnim: Animated.Value,
  scaleAnim: Animated.Value,
  translateYAnim: Animated.Value,
  delay = 0,
): Animated.CompositeAnimation {
  return Animated.sequence([
    Animated.delay(delay),
    Animated.parallel([
      AnimationPresets.fadeIn(fadeAnim, 600),
      AnimationPresets.scaleIn(scaleAnim),
      AnimationPresets.slideUp(translateYAnim, 500),
    ]),
  ]);
}

// Create press animation sequence
export function createPressAnimation(
  scaleAnim: Animated.Value,
  isPressed: boolean,
): Animated.CompositeAnimation {
  return isPressed
    ? AnimationPresets.pressIn(scaleAnim)
    : AnimationPresets.pressOut(scaleAnim);
}

// Create edit mode transition animation
export function createEditModeTransition(
  animatedValues: {
    borderOpacity: Animated.Value;
    editIconScale: Animated.Value;
  },
  isEditing: boolean,
): Animated.CompositeAnimation {
  if (isEditing) {
    return Animated.parallel([
      Animated.timing(animatedValues.borderOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(animatedValues.editIconScale, {
        toValue: 1,
        tension: 120,
        friction: 6,
        useNativeDriver: true,
      }),
    ]);
  }
  return Animated.parallel([
    Animated.timing(animatedValues.borderOpacity, {
      toValue: 0.2,
      duration: 300,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValues.editIconScale, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }),
  ]);
}

// Utility to reset all animation values to initial state
export function resetAnimationValues(values: {
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
  translateYAnim: Animated.Value;
}): void {
  values.fadeAnim.setValue(0);
  values.scaleAnim.setValue(0.3);
  values.translateYAnim.setValue(20);
}

// Performance optimization: batch animation updates
export function batchAnimations(
  animations: Animated.CompositeAnimation[],
): Animated.CompositeAnimation {
  return Animated.parallel(animations);
}
