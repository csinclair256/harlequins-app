/**
 * theme.ts — Harlequins BJJ Member App (White)
 *
 * White theme — inverted from the dark baseline (2026-03-24).
 * All Member App components import from this file.
 * Staff App uses theme.dark.ts.
 *
 * INVERSION RULES APPLIED:
 *   backgroundDark   #121212 → #F5F5F5  (warm off-white, not harsh pure white)
 *   surface          #1E1E1E → #FFFFFF  (pure white cards on off-white bg)
 *   surfaceHighlight #2C2C2C → #EBEBEB  (light grey dividers/placeholders)
 *   textWhite        #FFFFFF → #111111  (near-black, not pure — reduces harshness)
 *   textMuted        #AAAAAA → #555555  (mid-grey, readable on white)
 *   textDisabled     #666666 → #999999  (lighter disabled on white bg)
 *   textOnGold       #121212 → #121212  (UNCHANGED — dark text on gold badge)
 *   iconPlaceholder  #CCCCCC → #BBBBBB  (slightly darker on white bg)
 *   borderSubtle     #2C2C2C → #E0E0E0  (light border on white)
 *   borderMuted      #444444 → #CCCCCC  (muted border on white)
 *   borderInactive   #888888 → #BBBBBB  (inactive tab on white)
 *   shadow           #000000 → #000000  (UNCHANGED — shadows always dark)
 *   gold             #D4A017 → #D4A017  (UNCHANGED — brand colour)
 *   goldLight        #F0C040 → #C49A00  (darkened — needs contrast on white bg)
 *   goldDark         #9A7010 → #9A7010  (UNCHANGED — active states)
 *   primary          #2979FF → #1565C0  (darkened blue — contrast on white)
 *   success          #00E676 → #00897B  (darkened green — contrast on white)
 *   danger           #FF453A → #E53935  (darkened red — contrast on white)
 *
 * Series 0100 | Black Apple Sovereign Systems
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark  = '#fff';

export const Colors = {
  light: {
    text:             '#11181C',
    background:       '#fff',
    tint:             tintColorLight,
    icon:             '#687076',
    tabIconDefault:   '#687076',
    tabIconSelected:  tintColorLight,
  },
  dark: {
    text:             '#ECEDEE',
    background:       '#151718',
    tint:             tintColorDark,
    icon:             '#9BA1A6',
    tabIconDefault:   '#9BA1A6',
    tabIconSelected:  tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans:    'system-ui',
    serif:   'ui-serif',
    rounded: 'ui-rounded',
    mono:    'ui-monospace',
  },
  default: {
    sans:    'normal',
    serif:   'serif',
    rounded: 'normal',
    mono:    'monospace',
  },
  web: {
    sans:    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif:   "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono:    "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// ─── Harlequins BJJ Member App — White Brand Tokens ───────────────────────────
// SOVEREIGN HARLEQUINS GOLD — white variant locked 2026-03-24
// This is the MEMBER (WHITE) theme. Staff App uses theme.dark.ts.

export const Theme = {
  colors: {
    // ── Backgrounds ─────────────────────────────────────────────
    backgroundDark:   '#F5F5F5',   // App root — warm off-white (not pure white)
    surface:          '#FFFFFF',   // Cards, header, tab bar — pure white
    surfaceHighlight: '#EBEBEB',   // Thumbnail placeholder, dividers — light grey

    // ── Brand ───────────────────────────────────────────────────
    gold:             '#D4A017',   // UNCHANGED — Harlequins Standard
    goldLight:        '#C49A00',   // Darkened for contrast on white backgrounds
    goldDark:         '#9A7010',   // UNCHANGED — active states, focus rings
    primary:          '#1565C0',   // Darkened blue for contrast on white

    // ── Semantic ────────────────────────────────────────────────
    success:          '#00897B',   // Darkened green for contrast on white
    danger:           '#E53935',   // Darkened red for contrast on white
    shadow:           '#000000',   // UNCHANGED — shadows always dark

    // ── Text ────────────────────────────────────────────────────
    textWhite:        '#111111',   // PRIMARY TEXT on white — near-black
    textMuted:        '#555555',   // Secondary text on white — mid-grey
    textDisabled:     '#999999',   // Past-event text on white — light grey
    textOnGold:       '#121212',   // UNCHANGED — dark text on gold badge
    iconPlaceholder:  '#BBBBBB',   // Placeholder icon on white

    // ── Borders ─────────────────────────────────────────────────
    borderSubtle:     '#E0E0E0',   // Header border, tab bar top on white
    borderMuted:      '#CCCCCC',   // Past-event button border on white
    borderInactive:   '#BBBBBB',   // Inactive tab icon on white

    // ── Member App identity ──────────────────────────────────────
    appVariant:       'member' as const,
    logoAsset:        'Logos/Harlequins_Curved_White_Logo.png' as const,
  },
} as const;

export type ThemeColors = typeof Theme.colors;
