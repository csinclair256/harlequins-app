/**
 * useAppTheme — Returns the correct brand token set based on user preference
 * or device colour scheme.
 *
 * Member App: user can choose Light, Dark, or System (follows device).
 * Preference is persisted via AsyncStorage key 'themePreference'.
 * Staff App: always imports theme.dark.ts directly (never uses this hook).
 */

import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme as LightTheme } from '../constants/theme';
import { Theme as DarkTheme } from '../constants/theme.dark';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'themePreference';

const listeners = new Set<(pref: ThemePreference) => void>();

export function setThemePreference(pref: ThemePreference): void {
  AsyncStorage.setItem(STORAGE_KEY, pref).catch(() => {});
  listeners.forEach((fn) => fn(pref));
}

export function useAppTheme() {
  const deviceScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setPreference(stored as ThemePreference);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    listeners.add(setPreference);
    return () => { listeners.delete(setPreference); };
  }, []);

  const resolvedScheme =
    preference === 'system'
      ? (deviceScheme === 'dark' ? 'dark' : 'light')
      : preference;

  return {
    colors: resolvedScheme === 'dark' ? DarkTheme.colors : LightTheme.colors,
    preference,
  };
}
