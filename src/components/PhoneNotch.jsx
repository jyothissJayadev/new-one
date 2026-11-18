// src/components/PhoneNotch.jsx
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';

/**
 * Provides clean safe area space for physical phone notches and status bars
 * without drawing an artificial simulated notch on screen.
 */
export const PhoneNotch = () => {
  const insets = useSafeAreaInsets();
  // Provide safe top spacing: use physical notch inset or fallback for web/standard
  const topPadding = insets.top > 0 ? insets.top : Platform.OS === 'web' ? 14 : 20;

  return <View style={[styles.notchSpace, { height: topPadding }]} />;
};

const styles = StyleSheet.create({
  notchSpace: {
    width: '100%',
    backgroundColor: COLORS.surface,
  },
});
