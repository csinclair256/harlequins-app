import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Theme } from '../constants/theme';

export function GradientSubtitle({ text }: { text: string }) {
  return <Text style={styles.subtitle}>{text}</Text>;
}

const styles = StyleSheet.create({
  subtitle: { fontSize: 17, color: Theme.colors.gold, fontWeight: '900', marginTop: -6 },
});
