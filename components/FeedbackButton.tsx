/**
 * FeedbackButton — Animated button with synced haptic + audio feedback.
 *
 * Scale-down 0.95 is fired simultaneously with the haptic burst and audio click,
 * creating a single "mechanical" moment on press-in. Springs back on release.
 *
 * Usage:
 *   <FeedbackButton style={styles.actionBtn} onPress={handleRegister}>
 *     <Text>Register</Text>
 *   </FeedbackButton>
 */

import React, { useRef } from 'react';
import {
  Animated,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { triggerHapticLight, playFeedback } from '../utils/feedback';

interface FeedbackButtonProps {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  disabled?: boolean;
}

export function FeedbackButton({
  onPress,
  style,
  children,
  disabled = false,
}: FeedbackButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    // Fire haptic + audio simultaneously with the animation start
    triggerHapticLight();
    playFeedback();
    Animated.timing(scale, {
      toValue: 0.95,
      duration: 60,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
      tension: 300,
    }).start();
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      activeOpacity={1}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}
