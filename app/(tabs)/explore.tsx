/**
 * explore.tsx — Harlequins BJJ Member Portal (R-06/R-07)
 *
 * Replaces Expo boilerplate with brand-aligned member portal placeholder.
 * Drafted by Qwen2.5-Coder 32B, hardened 2026-03-20.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, UserCircle, BookOpen } from 'lucide-react-native';
import { Theme } from '@/constants/theme';

const QUICK_LINKS = [
  {
    label: 'Membership Info',
    url: 'https://harlequins.com.au/membership',
    Icon: UserCircle,
  },
  {
    label: 'Competition Rules',
    url: 'https://harlequins.com.au/rules',
    Icon: BookOpen,
  },
];

const COMING_SOON = [
  'Member registration',
  'Training logs',
  'Belt tracking',
];

export default function MemberPortalScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        <View style={styles.header}>
          <Text style={styles.title}>Member Portal</Text>
          <Text style={styles.subtitle}>Harlequins BJJ</Text>
        </View>

        <Text style={styles.sectionLabel}>QUICK LINKS</Text>
        {QUICK_LINKS.map(({ label, url, Icon }) => (
          <TouchableOpacity
            key={label}
            style={styles.card}
            onPress={() => Linking.openURL(url)}
            activeOpacity={0.75}
          >
            <View style={styles.cardLeft}>
              <Icon color={Theme.colors.gold} size={20} />
              <Text style={styles.cardLabel}>{label}</Text>
            </View>
            <ChevronRight color={Theme.colors.textMuted} size={18} />
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionLabel}>COMING SOON</Text>
        <View style={styles.comingSoonCard}>
          {COMING_SOON.map((item) => (
            <View key={item} style={styles.comingSoonRow}>
              <View style={styles.dot} />
              <Text style={styles.comingSoonText}>{item}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.backgroundDark,
  },
  scroll: {
    padding: 20,
  },
  header: {
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Theme.colors.textWhite,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Theme.colors.gold,
    fontWeight: '600',
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 10,
    marginTop: 4,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Theme.colors.borderSubtle,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.textWhite,
  },
  comingSoonCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.borderSubtle,
    gap: 10,
  },
  comingSoonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.primary,
  },
  comingSoonText: {
    fontSize: 15,
    color: Theme.colors.textMuted,
  },
});
