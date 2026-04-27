/**
 * explore.tsx — Harlequins BJJ Member Portal
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, Switch,
  StyleSheet, Linking, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronRight, UserCircle, BookOpen,
  Volume2, VolumeX, Sun, Moon, Smartphone,
} from 'lucide-react-native';
import { useAppTheme, setThemePreference, ThemePreference } from '../../hooks/useAppTheme';
import { ThemeColors } from '../../constants/theme';
import { getFeedbackEnabled, setFeedbackEnabled } from '@/utils/feedback';

const QUICK_LINKS = [
  {
    label: 'Membership Info',
    url: 'https://harlequins.com.au/membership',
    Icon: UserCircle,
  },
  {
    label: 'Competition Rules',
    url: 'https://ibjjf.com/rules',
    Icon: BookOpen,
  },
];

const THEME_OPTIONS: { value: ThemePreference; label: string; Icon: any }[] = [
  { value: 'light',  label: 'Light',  Icon: Sun },
  { value: 'system', label: 'System', Icon: Smartphone },
  { value: 'dark',   label: 'Dark',   Icon: Moon },
];

export default function MemberPortalScreen() {
  const { colors, preference } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [feedbackOn, setFeedbackOn] = useState<boolean>(getFeedbackEnabled);

  const handleFeedbackToggle = (value: boolean) => {
    setFeedbackOn(value);
    setFeedbackEnabled(value);
  };

  const handleThemeSelect = (value: ThemePreference) => {
    setThemePreference(value);
  };

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
              <Icon color={colors.gold} size={20} />
              <Text style={styles.cardLabel}>{label}</Text>
            </View>
            <ChevronRight color={colors.textMuted} size={18} />
          </TouchableOpacity>
        ))}

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>SETTINGS</Text>

        <View style={styles.settingsCard}>
          <View style={styles.settingsRow}>
            <View style={styles.cardLeft}>
              {feedbackOn
                ? <Volume2 color={colors.gold} size={20} />
                : <VolumeX color={colors.textMuted} size={20} />
              }
              <View>
                <Text style={styles.cardLabel}>Sound & Haptics</Text>
                <Text style={styles.settingsHint}>
                  {feedbackOn ? 'Button clicks active' : 'Silenced — mat mode'}
                </Text>
              </View>
            </View>
            <Switch
              value={feedbackOn}
              onValueChange={handleFeedbackToggle}
              trackColor={{ false: colors.borderMuted, true: colors.gold }}
              thumbColor={feedbackOn ? colors.goldLight : colors.textMuted}
            />
          </View>
        </View>

        <View style={[styles.settingsCard, { marginTop: 10 }]}>
          <View style={styles.appearanceHeader}>
            <Text style={styles.cardLabel}>Appearance</Text>
            <Text style={styles.settingsHint}>Choose your display mode</Text>
          </View>
          <View style={styles.themeSelector}>
            {THEME_OPTIONS.map(({ value, label, Icon }) => {
              const active = preference === value;
              return (
                <TouchableOpacity
                  key={value}
                  style={[styles.themeOption, active && styles.themeOptionActive]}
                  onPress={() => handleThemeSelect(value)}
                  activeOpacity={0.75}
                >
                  <Icon
                    color={active ? colors.gold : colors.textMuted}
                    size={18}
                  />
                  <Text style={[
                    styles.themeOptionLabel,
                    active && styles.themeOptionLabelActive,
                  ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container:    { flex: 1, backgroundColor: c.backgroundDark },
    scroll:       { padding: 20 },
    header:       { marginBottom: 28 },
    title:        { fontSize: 28, fontWeight: '800', color: c.textWhite, letterSpacing: 0.5 },
    subtitle:     { fontSize: 14, color: c.goldLight, fontWeight: '600', marginTop: 4 },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: c.textMuted,
      letterSpacing: 1.5,
      marginBottom: 10,
      marginTop: 4,
    },
    card: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: c.surface,
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderRadius: 10,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: c.borderSubtle,
    },
    cardLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
    cardLabel: { fontSize: 16, fontWeight: '600', color: c.textWhite },
    settingsCard: {
      backgroundColor: c.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      overflow: 'hidden',
    },
    settingsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    settingsHint: { fontSize: 12, color: c.textMuted, marginTop: 2 },
    appearanceHeader: {
      paddingTop: 14,
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSubtle,
    },
    themeSelector: {
      flexDirection: 'row',
      padding: 10,
      gap: 8,
    },
    themeOption: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      backgroundColor: c.surfaceHighlight,
    },
    themeOptionActive: {
      borderColor: c.gold,
      backgroundColor: c.surface,
    },
    themeOptionLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: c.textMuted,
    },
    themeOptionLabelActive: {
      color: c.gold,
    },
  });
}
