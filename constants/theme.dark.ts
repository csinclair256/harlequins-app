/**
 * theme.dark.ts — Harlequins BJJ Staff App (Black)
 *
 * LOCKED BASELINE — do not modify.
 * This is the canonical dark theme as deployed on the Member App
 * prior to the white inversion (2026-03-24). It is the Staff App
 * (Black) baseline. All Staff App components import from this file.
 *
 * Series 0100 | Black Apple Sovereign Systems
 */

import { Platform } from 'react-native';

const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: '#0a7ea4',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#0a7ea4',
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

// ─── Harlequins BJJ Staff App — Dark Brand Tokens ─────────────────────────────
// SOVEREIGN HARLEQUINS GOLD — locked 2026-03-24
// This is the STAFF (BLACK) theme. Member App uses theme.ts (white).

export const Theme = {
  colors: {
    // ── Backgrounds ─────────────────────────────────────────────
    backgroundDark:   '#121212',   // App root background
    surface:          '#1E1E1E',   // Cards, header, tab bar
    surfaceHighlight: '#2C2C2C',   // Thumbnail placeholder, dividers

    // ── Brand ───────────────────────────────────────────────────
    gold:             '#D4A017',   // Harlequins Standard — borders, icons, badge fills
    goldLight:        '#F0C040',   // High-contrast gold text on dark backgrounds
    goldDark:         '#9A7010',   // Active states, focus rings, shadow tints
    primary:          '#2979FF',   // Action button

    // ── Semantic ────────────────────────────────────────────────
    success:          '#00E676',   // Competition-day countdown label
    danger:           '#FF453A',   // CLOSED stamp border + text
    shadow:           '#000000',   // Card shadow base

    // ── Text ────────────────────────────────────────────────────
    textWhite:        '#FFFFFF',   // Primary text, subtitle, active tab
    textMuted:        '#AAAAAA',   // Secondary text, date/location labels, icons
    textDisabled:     '#666666',   // Past-event text and icon tint
    textOnGold:       '#121212',   // Text rendered on gold badge background
    iconPlaceholder:  '#CCCCCC',   // Trophy placeholder icon

    // ── Borders ─────────────────────────────────────────────────
    borderSubtle:     '#2C2C2C',   // Header bottom border, tab bar top
    borderMuted:      '#444444',   // Past-event action button border
    borderInactive:   '#888888',   // Inactive tab icon tint

    // ── Staff App identity ───────────────────────────────────────
    appVariant:       'staff'  as const,
    logoAsset:        'Logos/Harlequins_Curved_Black_Logo.png' as const,
  },
} as const;

export type ThemeColors = typeof Theme.colors;
