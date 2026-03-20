/**
 * theme.ts — Harlequins BJJ colour system
 *
 * Exports:
 *   Colors  — light/dark system tokens (used by useThemeColor hook + themed components)
 *   Fonts   — platform font stacks
 *   Theme   — Harlequins BJJ brand token system (R-05, Qwen2.5-Coder 32B, 2026-03-20)
 *             Replaces all inline hex strings in StyleSheet and JSX color props.
 *
 * Usage (brand tokens):
 *   import { Theme } from '@/constants/theme';
 *   backgroundColor: Theme.colors.surface
 *   color={Theme.colors.gold}
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// ─── Harlequins BJJ Brand Tokens (R-05) ──────────────────────────────────────

export const Theme = {
  colors: {
    // ── Backgrounds ───────────────────────────────────────────
    backgroundDark:   '#121212',   // App root background
    surface:          '#1E1E1E',   // Cards, header, tab bar
    surfaceHighlight: '#2C2C2C',   // Thumbnail placeholder, dividers

    // ── Brand ─────────────────────────────────────────────────
    gold:             '#FFD700',   // Priority events, countdown, calendar icon
    primary:          '#2979FF',   // Register / future-event action button

    // ── Semantic ──────────────────────────────────────────────
    success:          '#00E676',   // Competition-day countdown label
    danger:           '#FF453A',   // CLOSED stamp border + text (R-10)
    shadow:           '#000000',   // Card shadow base

    // ── Text ──────────────────────────────────────────────────
    textWhite:        '#FFFFFF',   // Primary text, subtitle, active tab
    textMuted:        '#AAAAAA',   // Secondary text, date/location labels, icons
    textDisabled:     '#666666',   // Past-event text and icon tint
    textOnGold:       '#121212',   // Text rendered on gold badge background
    iconPlaceholder:  '#CCCCCC',   // Trophy placeholder icon

    // ── Borders ───────────────────────────────────────────────
    borderSubtle:     '#2C2C2C',   // Header bottom border, tab bar top
    borderMuted:      '#444444',   // Past-event action button border
    borderInactive:   '#888888',   // Inactive tab icon tint (tab layout)
  },
} as const;

export type ThemeColors = typeof Theme.colors;
